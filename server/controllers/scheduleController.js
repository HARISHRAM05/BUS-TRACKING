// CRUD for schedules. Reads: any logged-in user. Writes: Admin only (enforced in routes).
const Schedule = require('../models/Schedule');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');
const logActivity = require('../utils/logActivity');
const { containsRegex } = require('../utils/escapeRegex');

const POPULATE = [
  { path: 'route', select: 'routeName routeCode startPoint endPoint' },
  { path: 'bus', select: 'busNumber registrationNo driverName driverPhone status' },
];

const pickScheduleFields = (b) => ({
  route: b.route,
  bus: b.bus,
  departureTime: b.departureTime,
  arrivalTime: b.arrivalTime,
  direction: b.direction,
  shift: b.shift,
  daysOfOperation: b.daysOfOperation,
});

// Make sure the referenced route and bus exist
const ensureRefsExist = async ({ route, bus }) => {
  const errors = {};
  if (!(await Route.exists({ _id: route }))) errors.route = 'Selected route does not exist';
  if (!(await Bus.exists({ _id: bus }))) errors.bus = 'Selected bus does not exist';
  if (Object.keys(errors).length) throw new ApiError(422, 'Validation failed', errors);
};

// GET /api/schedules?search=&route=&bus=&stop=&shift=&direction=&day=
const getSchedules = asyncHandler(async (req, res) => {
  const { search, route, bus, stop, shift, direction, day } = req.query;
  const filter = {};
  const and = []; // extra conditions combined with $and

  if (route) filter.route = route;
  if (shift) filter.shift = shift;
  if (direction) filter.direction = direction;
  if (day) filter.daysOfOperation = day;

  if (bus) {
    const buses = await Bus.find({ busNumber: containsRegex(bus) }).select('_id');
    filter.bus = { $in: buses.map((b) => b._id) };
  }

  // Free-text search matches route name/code or bus number
  if (search) {
    const rx = containsRegex(search);
    const [routes, buses] = await Promise.all([
      Route.find({ $or: [{ routeName: rx }, { routeCode: rx }] }).select('_id'),
      Bus.find({ busNumber: rx }).select('_id'),
    ]);
    and.push({ $or: [{ route: { $in: routes.map((r) => r._id) } }, { bus: { $in: buses.map((b) => b._id) } }] });
  }

  // Only schedules whose route passes through the given stop
  if (stop) {
    const routes = await Route.find({ 'stops.stopName': containsRegex(stop) }).select('_id');
    and.push({ route: { $in: routes.map((r) => r._id) } });
  }
  if (and.length) filter.$and = and;

  const schedules = await Schedule.find(filter).populate(POPULATE).sort({ shift: 1, departureTime: 1 });
  respond(res, 200, 'Schedules fetched', schedules);
});

// GET /api/schedules/:id
const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id).populate(POPULATE);
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  respond(res, 200, 'Schedule fetched', schedule);
});

// POST /api/schedules
const createSchedule = asyncHandler(async (req, res) => {
  const data = pickScheduleFields(req.body);
  await ensureRefsExist(data);

  const schedule = await Schedule.create(data);
  await schedule.populate(POPULATE);
  await logActivity(
    req.user,
    'Schedule',
    `Added ${schedule.shift.toLowerCase()} schedule for ${schedule.route.routeCode} at ${schedule.departureTime}`
  );
  respond(res, 201, 'Schedule added successfully', schedule);
});

// PUT /api/schedules/:id
const updateSchedule = asyncHandler(async (req, res) => {
  const data = pickScheduleFields(req.body);
  await ensureRefsExist(data);

  const schedule = await Schedule.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).populate(
    POPULATE
  );
  if (!schedule) throw new ApiError(404, 'Schedule not found');
  await logActivity(req.user, 'Schedule', `Updated schedule for ${schedule.route.routeCode} at ${schedule.departureTime}`);
  respond(res, 200, 'Schedule updated successfully', schedule);
});

// DELETE /api/schedules/:id
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id).populate(POPULATE);
  if (!schedule) throw new ApiError(404, 'Schedule not found');

  await schedule.deleteOne();
  await logActivity(
    req.user,
    'Schedule',
    `Deleted schedule for ${schedule.route?.routeCode || 'route'} at ${schedule.departureTime}`
  );
  respond(res, 200, 'Schedule deleted successfully');
});

module.exports = { getSchedules, getSchedule, createSchedule, updateSchedule, deleteSchedule };
