// Live map data: every route with its stops (coordinates) and the bus assigned to it
const Route = require('../models/Route');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');

// GET /api/tracking  (any logged-in user)
const getTracking = asyncHandler(async (req, res) => {
  const routes = await Route.find()
    .populate('assignedBus', 'busNumber registrationNo capacity driverName driverPhone status location')
    .sort({ routeCode: 1 });
  respond(res, 200, 'Tracking data fetched', routes);
});

module.exports = { getTracking };
