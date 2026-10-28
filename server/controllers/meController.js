// "My Route": the rider's saved route + boarding stop, and the Next Bus card built from it
const User = require('../models/User');
const Route = require('../models/Route');
const Schedule = require('../models/Schedule');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');
const { nextDepartures } = require('../services/nextBus');
const { liveLocation, haversine } = require('../services/busPosition');

const BUS_FIELDS = 'busNumber registrationNo driverName driverPhone status location';

// PUT /api/me/route   { routeId, stopName }
const setMyRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.body.routeId);
  if (!route) throw new ApiError(404, 'Route not found');

  const wanted = req.body.stopName.trim().toLowerCase();
  const stop = route.stops.find((s) => s.stopName.toLowerCase() === wanted);
  if (!stop) throw new ApiError(422, 'Validation failed', { stopName: 'That stop is not on this route' });

  const user = await User.findByIdAndUpdate(req.user._id, { myRoute: route._id, myStop: stop.stopName }, { new: true });
  respond(res, 200, `Saved: ${route.routeCode}, boarding at ${stop.stopName}`, user);
});

// DELETE /api/me/route
const clearMyRoute = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { myRoute: null, myStop: '' }, { new: true });
  respond(res, 200, 'Saved route removed', user);
});

// GET /api/me/next-bus
// -> null if no route saved; otherwise the next buses at the saved stop plus how far the bus is right now
const getNextBus = asyncHandler(async (req, res) => {
  if (!req.user.myRoute) return respond(res, 200, 'No saved route', null);

  const route = await Route.findById(req.user.myRoute).populate('assignedBus', BUS_FIELDS);
  if (!route) {
    // the saved route was deleted
    await User.findByIdAndUpdate(req.user._id, { myRoute: null, myStop: '' });
    return respond(res, 200, 'No saved route', null);
  }

  const summary = { route: { _id: route._id, routeCode: route.routeCode, routeName: route.routeName }, stopName: req.user.myStop };
  const schedules = await Schedule.find({ route: route._id }).populate('bus', 'busNumber driverName');
  const departures = nextDepartures({ route, schedules, stopName: req.user.myStop });

  // the saved stop no longer exists on the route (an admin edited the route)
  if (departures === null) {
    return respond(res, 200, 'Saved stop not found', { ...summary, stopMissing: true, departures: [], live: null });
  }

  // How far is the route's bus from the stop right now?
  let live = null;
  const plainRoute = route.toObject();
  const bus = plainRoute.assignedBus;
  const stop = plainRoute.stops.find((s) => s.stopName.toLowerCase() === req.user.myStop.toLowerCase());
  const location = bus ? liveLocation(plainRoute, bus) : null;
  if (location && Number.isFinite(stop?.lat) && Number.isFinite(stop?.lng)) {
    live = {
      busNumber: bus.busNumber,
      distanceKm: Math.round(haversine([location.lat, location.lng], [stop.lat, stop.lng]) * 10) / 10,
      source: location.source,
      updatedAt: location.updatedAt,
    };
  }

  respond(res, 200, 'Next bus', { ...summary, stopMissing: false, departures, live });
});

module.exports = { setMyRoute, clearMyRoute, getNextBus };
