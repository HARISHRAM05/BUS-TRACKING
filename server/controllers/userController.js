// User management - Admin only
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');
const logActivity = require('../utils/logActivity');
const { containsRegex } = require('../utils/escapeRegex');

const pickUserFields = (b) => {
  const isAdmin = b.role === 'Admin';
  return {
    name: b.name,
    email: b.email,
    role: b.role,
    userType: isAdmin ? null : b.userType,
    registerNo: isAdmin ? '' : b.registerNo || '',
    status: b.status || 'active',
  };
};

// GET /api/users?search=&role=&status=
const getUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;
  const filter = {};
  if (search) {
    const rx = containsRegex(search);
    filter.$or = [{ name: rx }, { email: rx }, { registerNo: rx }];
  }
  if (role) filter.role = role;
  if (status) filter.status = status;

  const users = await User.find(filter).sort({ createdAt: -1 });
  respond(res, 200, 'Users fetched', users);
});

// GET /api/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  respond(res, 200, 'User fetched', user);
});

// POST /api/users
const createUser = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) {
    throw new ApiError(409, 'Email already exists', { email: 'An account with this email already exists' });
  }
  const user = await User.create({ ...pickUserFields(req.body), password: req.body.password });
  await logActivity(req.user, 'User', `Added ${user.role.toLowerCase()} ${user.name}`);
  respond(res, 201, 'User added successfully', user);
});

// PUT /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const data = pickUserFields(req.body);
  const isSelf = user._id.equals(req.user._id);

  // Stop an admin from locking themselves out
  if (isSelf && data.role !== 'Admin') {
    throw new ApiError(400, 'You cannot remove your own admin role', { role: 'You cannot change your own role' });
  }
  if (isSelf && data.status !== 'active') {
    throw new ApiError(400, 'You cannot deactivate your own account', { status: 'You cannot deactivate yourself' });
  }
  if (data.email !== user.email && (await User.exists({ email: data.email }))) {
    throw new ApiError(409, 'Email already exists', { email: 'An account with this email already exists' });
  }

  user.set(data);
  if (req.body.password) user.password = req.body.password; // optional reset, hashed by pre-save hook
  await user.save();

  await logActivity(req.user, 'User', `Updated user ${user.name}`);
  respond(res, 200, 'User updated successfully', user);
});

// DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  await user.deleteOne();
  await logActivity(req.user, 'User', `Removed user ${user.name}`);
  respond(res, 200, 'User removed successfully');
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
