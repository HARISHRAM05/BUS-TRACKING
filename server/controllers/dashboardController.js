// Admin home: stats cards and recent activity
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');

// GET /api/stats
const getStats = asyncHandler(async (req, res) => {
  const [buses, activeBuses, routes, schedules, users, admins] = await Promise.all([
    Bus.countDocuments(),
    Bus.countDocuments({ status: 'Active' }),
    Route.countDocuments(),
    Schedule.countDocuments(),
    User.countDocuments(),
    User.countDocuments({ role: 'Admin' }),
  ]);
  respond(res, 200, 'Stats fetched', { buses, activeBuses, routes, schedules, users, admins });
});

// GET /api/activity?limit=10
const getActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(limit);
  respond(res, 200, 'Recent activity', logs);
});

module.exports = { getStats, getActivity };
