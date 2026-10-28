// CRUD for routes. Reads: any logged-in user. Writes: Admin only (enforced in routes).
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');
const logActivity = require('../utils/logActivity');
const { containsRegex } = require('../utils/escapeRegex');
const { withLiveLocation } = require('../services/busPosition');

const BUS_FIELDS = 'busNumber registrationNo capacity driverName driverPhone status location';

const pickRouteFields = (b) => ({
  routeName: b.routeName,
  routeCode: b.routeCode,
  startPoint: b.startPoint,
  endPoint: b.endPoint || 'Karunya Nagar Campus',
  distanceKm: b.distanceKm,
  assignedBus: b.assignedBus || null,
  stops: (b.stops || []).map((s) => ({
    stopName: s.stopName,
    pickupTime: s.pickupTime,
    order: s.order,
    // keep coordinates only when both are present
    ...(Number.isFinite(s.lat) && Number.isFinite(s.lng) ? { lat: s.lat, lng: s.lng } : {}),
  })),
});

// Make sure the selected bus actually exists
const ensureBusExists = async (busId) => {
  if (busId && !(await Bus.exists({ _id: busId }))) {
    throw new ApiError(422, 'Validation failed', { assignedBus: 'Selected bus does not exist' });
  }
};

// GET /api/routes?search=&stop=&bus=
// search -> route name / code / start point, stop -> stop name, bus -> bus number
const getRoutes = asyncHandler(async (req, res) => {
  const { search, stop, bus } = req.query;
  const filter = {};

  if (search) {
    const rx = containsRegex(search);
    filter.$or = [{ routeName: rx }, { routeCode: rx }, { startPoint: rx }];
  }
  if (stop) filter['stops.stopName'] = containsRegex(stop);
  if (bus) {
    const buses = await Bus.find({ busNumber: containsRegex(bus) }).select('_id');
    filter.assignedBus = { $in: buses.map((b) => b._id) };
  }

  const routes = await Route.find(filter).populate('assignedBus', BUS_FIELDS).sort({ routeCode: 1 });
  respond(res, 200, 'Routes fetched', routes.map(withLiveLocation));
});

// GET /api/routes/:id  (includes the schedules running on this route)
const getRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id).populate('assignedBus', BUS_FIELDS);
  if (!route) throw new ApiError(404, 'Route not found');

  const schedules = await Schedule.find({ route: route._id })
    .populate('bus', BUS_FIELDS)
    .sort({ shift: 1, departureTime: 1 });

  respond(res, 200, 'Route fetched', { ...withLiveLocation(route), schedules });
});

// POST /api/routes
const createRoute = asyncHandler(async (req, res) => {
  const data = pickRouteFields(req.body);
  await ensureBusExists(data.assignedBus);

  const route = await Route.create(data);
  await route.populate('assignedBus', BUS_FIELDS);
  await logActivity(req.user, 'Route', `Added route ${route.routeCode} - ${route.routeName}`);
  respond(res, 201, 'Route added successfully', route);
});

// PUT /api/routes/:id
const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw new ApiError(404, 'Route not found');

  const data = pickRouteFields(req.body);
  await ensureBusExists(data.assignedBus);

  route.set(data);
  await route.save(); // save() (not findByIdAndUpdate) so the stop-sorting hook runs
  await route.populate('assignedBus', BUS_FIELDS);
  await logActivity(req.user, 'Route', `Updated route ${route.routeCode}`);
  respond(res, 200, 'Route updated successfully', route);
});

// DELETE /api/routes/:id  (also removes the route's schedules)
const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw new ApiError(404, 'Route not found');

  const { deletedCount } = await Schedule.deleteMany({ route: route._id });
  // clean up everything that pointed at this route
  await Promise.all([
    User.updateMany({ myRoute: route._id }, { myRoute: null, myStop: '' }),
    Announcement.deleteMany({ route: route._id }),
    Issue.updateMany({ route: route._id }, { route: null }),
  ]);
  await route.deleteOne();
  await logActivity(req.user, 'Route', `Deleted route ${route.routeCode} and ${deletedCount} schedule(s)`);
  respond(res, 200, `Route deleted along with ${deletedCount} schedule(s)`);
});

module.exports = { getRoutes, getRoute, createRoute, updateRoute, deleteRoute };
