/**
 * DEMO bus-position simulator.
 *
 * There are no GPS trackers on the buses yet, so to let the map show moving buses this
 * service slides every Active bus back and forth along its route (stop 1 <-> campus).
 * Positions are written to Bus.location with source = 'simulated'.
 *
 * When a real tracker reports a position via PUT /api/buses/:id/location (source = 'gps'),
 * the simulator leaves that bus alone for GPS_FRESH_MS.
 *
 * Turn it off with SIMULATE_BUS_TRACKING=false in server/.env.
 */
const Route = require('../models/Route');
const Bus = require('../models/Bus');

const TICK_MS = 5000; // how often positions are updated
const TRIP_MS = 4 * 60 * 1000; // a one-way trip takes 4 minutes in the demo
const GPS_FRESH_MS = 2 * 60 * 1000;

// progress (0..1 along the route) and direction (+1 to campus, -1 back) per route
const state = new Map();

// Great-circle distance in km between two [lat, lng] points
const haversine = ([lat1, lng1], [lat2, lng2]) => {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

// Point at `fraction` (0..1) of the total length of the polyline
const pointAlong = (points, fraction) => {
  const legs = points.slice(1).map((p, i) => haversine(points[i], p));
  const total = legs.reduce((a, b) => a + b, 0);
  let remaining = fraction * total;
  for (let i = 0; i < legs.length; i++) {
    if (remaining <= legs[i] || i === legs.length - 1) {
      const t = legs[i] === 0 ? 0 : Math.min(remaining / legs[i], 1);
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * t,
        points[i][1] + (points[i + 1][1] - points[i][1]) * t,
      ];
    }
    remaining -= legs[i];
  }
  return points[points.length - 1];
};

const tick = async () => {
  const routes = await Route.find({ assignedBus: { $ne: null } }).populate('assignedBus');

  for (const [index, route] of routes.entries()) {
    const bus = route.assignedBus;
    if (!bus || bus.status !== 'Active') continue;

    const loc = bus.location;
    if (loc?.source === 'gps' && Date.now() - new Date(loc.updatedAt).getTime() < GPS_FRESH_MS) continue;

    const points = [...route.stops]
      .sort((a, b) => a.order - b.order)
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
      .map((s) => [s.lat, s.lng]);
    if (points.length < 2) continue;

    // Start each bus at a different point so they are spread out on the map
    const id = String(route._id);
    if (!state.has(id)) state.set(id, { progress: (index * 0.17) % 1, dir: 1 });
    const s = state.get(id);

    s.progress += (s.dir * TICK_MS) / TRIP_MS;
    if (s.progress >= 1) { s.progress = 1; s.dir = -1; }
    if (s.progress <= 0) { s.progress = 0; s.dir = 1; }

    const [lat, lng] = pointAlong(points, s.progress);
    await Bus.updateOne(
      { _id: bus._id },
      { location: { lat, lng, source: 'simulated', updatedAt: new Date() } }
    );
  }
};

const start = () => {
  if (process.env.SIMULATE_BUS_TRACKING === 'false') {
    console.log('Bus tracking simulator is OFF');
    return;
  }
  const run = () => tick().catch((err) => console.error('Tracking simulator error:', err.message));
  run();
  setInterval(run, TICK_MS);
  console.log('Bus tracking simulator running (DEMO positions, not real GPS)');
};

module.exports = { start };
