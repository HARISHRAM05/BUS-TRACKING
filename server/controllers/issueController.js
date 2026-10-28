// Rider reports. Create / "my reports": any logged-in user. Inbox, update, delete: Admin only (enforced in routes).
const Issue = require('../models/Issue');
const Route = require('../models/Route');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');
const logActivity = require('../utils/logActivity');

const MAX_UNRESOLVED_PER_USER = 10; // stops one account from flooding the inbox

// POST /api/issues
const createIssue = asyncHandler(async (req, res) => {
  const { category, route, message } = req.body;

  if (route && !(await Route.exists({ _id: route }))) {
    throw new ApiError(422, 'Validation failed', { route: 'Selected route does not exist' });
  }
  const unresolved = await Issue.countDocuments({ user: req.user._id, status: { $ne: 'Resolved' } });
  if (unresolved >= MAX_UNRESOLVED_PER_USER) {
    throw new ApiError(409, `You already have ${MAX_UNRESOLVED_PER_USER} unresolved reports. Please wait for a reply first.`);
  }

  const issue = await Issue.create({ user: req.user._id, category, route: route || null, message });
  await issue.populate('route', 'routeCode routeName');
  await logActivity(req.user, 'Report', `${req.user.name} reported: ${category}`);
  respond(res, 201, 'Report sent to the Transport Office', issue);
});

// GET /api/issues/mine - the rider's own reports, newest first
const getMyIssues = asyncHandler(async (req, res) => {
  const issues = await Issue.find({ user: req.user._id }).populate('route', 'routeCode routeName').sort({ createdAt: -1 });
  respond(res, 200, 'Your reports', issues);
});

// GET /api/issues?status=&category=   (Admin inbox)
const getIssues = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  const issues = await Issue.find(filter)
    .populate('user', 'name email userType registerNo')
    .populate('route', 'routeCode routeName')
    .sort({ createdAt: -1 });
  respond(res, 200, 'Reports fetched', issues);
});

// PUT /api/issues/:id   { status, adminNote }   (Admin)
const updateIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, adminNote: req.body.adminNote || '' },
    { new: true, runValidators: true }
  )
    .populate('user', 'name email userType registerNo')
    .populate('route', 'routeCode routeName');
  if (!issue) throw new ApiError(404, 'Report not found');

  await logActivity(req.user, 'Report', `Marked a "${issue.category}" report as ${issue.status}`);
  respond(res, 200, 'Report updated', issue);
});

// DELETE /api/issues/:id   (Admin)
const deleteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(404, 'Report not found');

  await issue.deleteOne();
  await logActivity(req.user, 'Report', `Deleted a "${issue.category}" report`);
  respond(res, 200, 'Report deleted');
});

module.exports = { createIssue, getMyIssues, getIssues, updateIssue, deleteIssue };
