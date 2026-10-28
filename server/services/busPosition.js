/**
 * Where is a bus right now?
 *
 *  1. A recent GPS position (reported with PUT /api/buses/:id/location, source 'gps') always wins.
 *  2. Otherwise, while SIMULATE_BUS_TRACKING is not 'false', the position is a DEMO: it is calculated from
 *     the clock, sliding the bus back and forth along its route (stop 1 <-> campus), a bit different for
 *     every route. Nothing is stored and no background timer is needed, so it also works on serverless
 *     hosts such as Vercel.
 *  3. Otherwise the last stored position (if any) is returned.
 *
 * There are no GPS trackers on the buses yet, so the map labels simulated positions as a demo.
 */

const TRIP_MS = 4 * 60 * 1000; // a one-way trip takes 4 minutes in the demo
const GPS_FRESH_MS = 2 * 60 * 1000; // a GPS position older than this is considered stale

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

// Stops that have coordinates, in route order, as [lat, lng]
const mappedPoints = (route) =>
  [...(route.stops || [])]
    .sort((a, b) => a.order - b.order)
    .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
    .map((s) => [s.lat, s.lng]);

// Stable 0..1 number from the route id, so each route's bus starts at a different point
const offsetFor = (id) => {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return h / 1000;
};

// DEMO position for a route at time `now` (ms); null if the route has fewer than 2 mapped stops
const simulatedLocation = (route, now = Date.now()) => {
  const points = mappedPoints(route);
  if (points.length < 2) return null;

  const phase = (now / TRIP_MS + offsetFor(route._id)) % 2; // 0..1 outbound, 1..2 coming back
  const progress = phase < 1 ? phase : 2 - phase;
  const [lat, lng] = pointAlong(points, progress);
  return { lat, lng, source: 'simulated', updatedAt: new Date(now) };
};

// The location the app should show for a route's bus
const liveLocation = (route, bus, now = Date.now()) => {
  const stored = bus.location && Number.isFinite(bus.location.lat) ? bus.location : null;

  if (stored?.source === 'gps' && now - new Date(stored.updatedAt).getTime() < GPS_FRESH_MS) return stored;

  if (process.env.SIMULATE_BUS_TRACKING !== 'false' && bus.status === 'Active') {
    return simulatedLocation(route, now) || stored;
  }
  return stored;
};

// Plain-object copy of a route whose assignedBus carries the live location
const withLiveLocation = (route) => {
  const plain = route.toObject ? route.toObject() : route;
  if (!plain.assignedBus) return plain;
  return { ...plain, assignedBus: { ...plain.assignedBus, location: liveLocation(plain, plain.assignedBus) } };
};

module.exports = { liveLocation, simulatedLocation, withLiveLocation, haversine };
