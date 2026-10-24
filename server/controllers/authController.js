// Sign-up, login, current user and change password
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const respond = require('../utils/respond');
const logActivity = require('../utils/logActivity');

const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, userType, registerNo } = req.body;

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists', {
      email: 'An account with this email already exists',
    });
  }

  const isAdmin = role === 'Admin';
  const user = await User.create({
    name,
    email,
    password,
    role,
    userType: isAdmin ? null : userType,
    registerNo: isAdmin ? '' : registerNo || '',
  });

  await logActivity(user, 'Auth', `New ${role.toLowerCase()} signed up: ${user.name}`);
  respond(res, 201, 'Account created successfully', { token: createToken(user), user });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has select:false, so ask for it explicitly here
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account is inactive. Contact the Transport Office.');
  }

  respond(res, 200, 'Login successful', { token: createToken(user), user });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  respond(res, 200, 'Current user', req.user);
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect', {
      currentPassword: 'Current password is incorrect',
    });
  }
  if (currentPassword === newPassword) {
    throw new ApiError(400, 'New password must be different', {
      newPassword: 'New password must be different from the current password',
    });
  }

  user.password = newPassword; // hashed by the pre-save hook
  await user.save();
  respond(res, 200, 'Password changed successfully');
});

module.exports = { signup, login, getMe, changePassword };
