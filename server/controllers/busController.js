// CRUD for buses. Reads: any logged-in user. Writes: Admin only (enforced in routes).
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Schedule = require('../models/Schedule');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');
const logActivity = require('../utils/logActivity');
const { containsRegex } = require('../utils/escapeRegex');

// Only these fields may be set from the request body
const pickBusFields = (b) => ({
  busNumber: b.busNumber,
  registrationNo: b.registrationNo,
  capacity: b.capacity,
  driverName: b.driverName,
  driverPhone: b.driverPhone,
  status: b.status || 'Active',
});

// GET /api/buses?search=&status=
const getBuses = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const filter = {};
  if (search) {
    const rx = containsRegex(search);
    filter.$or = [{ busNumber: rx }, { registrationNo: rx }, { driverName: rx }];
  }
  if (status) filter.status = status;

  const buses = await Bus.find(filter).sort({ busNumber: 1 });
  respond(res, 200, 'Buses fetched', buses);
});

// GET /api/buses/:id
const getBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) throw new ApiError(404, 'Bus not found');
  respond(res, 200, 'Bus fetched', bus);
});

// POST /api/buses
const createBus = asyncHandler(async (req, res) => {
  const bus = await Bus.create(pickBusFields(req.body));
  await logActivity(req.user, 'Bus', `Added bus ${bus.busNumber}`);
  respond(res, 201, 'Bus added successfully', bus);
});

// PUT /api/buses/:id
const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndUpdate(req.params.id, pickBusFields(req.body), {
    new: true,
    runValidators: true,
  });
  if (!bus) throw new ApiError(404, 'Bus not found');
  await logActivity(req.user, 'Bus', `Updated bus ${bus.busNumber}`);
  respond(res, 200, 'Bus updated successfully', bus);
});

// DELETE /api/buses/:id
const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) throw new ApiError(404, 'Bus not found');

  // Do not leave schedules pointing at a missing bus
  const scheduleCount = await Schedule.countDocuments({ bus: bus._id });
  if (scheduleCount > 0) {
    throw new ApiError(
      409,
      `Bus ${bus.busNumber} is used in ${scheduleCount} schedule(s). Reassign or delete those schedules first.`
    );
  }

  await Route.updateMany({ assignedBus: bus._id }, { assignedBus: null });
  await bus.deleteOne();
  await logActivity(req.user, 'Bus', `Deleted bus ${bus.busNumber}`);
  respond(res, 200, 'Bus deleted successfully');
});

// PUT /api/buses/:id/location  { lat, lng }
// Used by a GPS tracker (or an admin) to report where the bus is right now.
// While a 'gps' position is fresh, the demo simulator leaves this bus alone.
const updateLocation = asyncHandler(async (req, res) => {
  const bus = await Bus.findByIdAndUpdate(
    req.params.id,
    { location: { lat: req.body.lat, lng: req.body.lng, source: 'gps', updatedAt: new Date() } },
    { new: true, runValidators: true }
  );
  if (!bus) throw new ApiError(404, 'Bus not found');
  respond(res, 200, `Location of ${bus.busNumber} updated`, bus);
});

module.exports = { getBuses, getBus, createBus, updateBus, deleteBus, updateLocation };
