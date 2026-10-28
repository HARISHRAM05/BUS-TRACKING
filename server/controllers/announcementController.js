// Announcements. Reading: any logged-in user (active ones only). Writing: Admin only (enforced in routes).
const Announcement = require('../models/Announcement');
const Route = require('../models/Route');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');
const logActivity = require('../utils/logActivity');
const { containsRegex } = require('../utils/escapeRegex');

const SEVERITY_RANK = { Urgent: 0, Warning: 1, Info: 2 };

const pickFields = (b) => ({
  title: b.title,
  message: b.message,
  severity: b.severity,
  route: b.route || null,
  expiresAt: b.expiresAt || null,
});

const ensureRouteExists = async (routeId) => {
  if (routeId && !(await Route.exists({ _id: routeId }))) {
    throw new ApiError(422, 'Validation failed', { route: 'Selected route does not exist' });
  }
};

// GET /api/announcements?route=&search=&all=true
// Riders get only the active ones. An admin passing all=true also sees expired ones.
const getAnnouncements = asyncHandler(async (req, res) => {
  const { route, search, all } = req.query;
  const and = [];

  if (!(all === 'true' && req.user.role === 'Admin')) {
    and.push({ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });
  }
  // for one route: notices for everyone plus notices for that route
  if (route) and.push({ $or: [{ route: null }, { route }] });
  if (search) {
    const rx = containsRegex(search);
    and.push({ $or: [{ title: rx }, { message: rx }] });
  }

  const list = await Announcement.find(and.length ? { $and: and } : {})
    .populate('route', 'routeCode routeName')
    .sort({ createdAt: -1 });

  // Urgent first, then Warning, then Info; newest first inside each (the sort is stable)
  list.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  respond(res, 200, 'Announcements fetched', list);
});

// POST /api/announcements
const createAnnouncement = asyncHandler(async (req, res) => {
  const data = pickFields(req.body);
  await ensureRouteExists(data.route);

  const created = await Announcement.create({ ...data, createdBy: req.user._id, createdByName: req.user.name });
  await created.populate('route', 'routeCode routeName');
  await logActivity(req.user, 'Announcement', `Posted ${created.severity.toLowerCase()} notice "${created.title}"`);
  respond(res, 201, 'Announcement posted', created);
});

// PUT /api/announcements/:id
const updateAnnouncement = asyncHandler(async (req, res) => {
  const data = pickFields(req.body);
  await ensureRouteExists(data.route);

  const updated = await Announcement.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).populate(
    'route',
    'routeCode routeName'
  );
  if (!updated) throw new ApiError(404, 'Announcement not found');
  await logActivity(req.user, 'Announcement', `Updated notice "${updated.title}"`);
  respond(res, 200, 'Announcement updated', updated);
});

// DELETE /api/announcements/:id
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const found = await Announcement.findById(req.params.id);
  if (!found) throw new ApiError(404, 'Announcement not found');

  await found.deleteOne();
  await logActivity(req.user, 'Announcement', `Removed notice "${found.title}"`);
  respond(res, 200, 'Announcement removed');
});

module.exports = { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
