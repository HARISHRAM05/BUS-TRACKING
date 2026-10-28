// express-validator rule sets for every endpoint that accepts input
const { body, param, query } = require('express-validator');
const { DAYS } = require('../models/Schedule');
const { SEVERITIES } = require('../models/Announcement');
const { CATEGORIES, STATUSES: ISSUE_STATUSES } = require('../models/Issue');

// Min 8 chars with at least one uppercase, lowercase, number and special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_MSG =
  'Password must be at least 8 characters and include uppercase, lowercase, a number and a special character';
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:MM

const strongPassword = (field) =>
  body(field).notEmpty().withMessage('Password is required').bail().matches(PASSWORD_REGEX).withMessage(PASSWORD_MSG);

const nameRule = body('name')
  .trim()
  .notEmpty().withMessage('Name is required').bail()
  .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters')
  .matches(/^[A-Za-z .'-]+$/).withMessage('Name can contain only letters, spaces and . \' -');

const emailRule = body('email')
  .trim()
  .notEmpty().withMessage('Email is required').bail()
  .isEmail().withMessage('Enter a valid email address')
  .normalizeEmail({ gmail_remove_dots: false });

const userTypeRule = body('userType')
  .if(body('role').equals('User'))
  .notEmpty().withMessage('Select Student or Staff').bail()
  .isIn(['Student', 'Staff']).withMessage('Type must be Student or Staff');

const registerNoRule = body('registerNo')
  .optional({ values: 'falsy' })
  .trim()
  .isLength({ max: 20 }).withMessage('Register No / Staff ID must be at most 20 characters')
  .matches(/^[A-Za-z0-9/-]+$/).withMessage('Register No / Staff ID can contain only letters, numbers, / and -');

const mongoIdParam = [param('id').isMongoId().withMessage('Invalid ID')];

// ---------- Auth ----------
const signupRules = [
  nameRule,
  emailRule,
  strongPassword('password'),
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password').bail()
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
  body('role').isIn(['Admin', 'User']).withMessage('Role must be Admin or User'),
  body('adminCode')
    .if(body('role').equals('Admin'))
    .notEmpty().withMessage('Admin signup code is required').bail()
    .custom((value) => value === process.env.ADMIN_SIGNUP_CODE).withMessage('Invalid admin signup code'),
  userTypeRule,
  registerNoRule,
];

const loginRules = [
  emailRule,
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  strongPassword('newPassword'),
  body('confirmNewPassword')
    .notEmpty().withMessage('Please confirm the new password').bail()
    .custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match'),
];

// ---------- Users (admin management) ----------
const userRules = (isUpdate = false) => [
  nameRule,
  emailRule,
  // Password is required when creating, optional when updating
  isUpdate
    ? body('password').optional({ values: 'falsy' }).matches(PASSWORD_REGEX).withMessage(PASSWORD_MSG)
    : strongPassword('password'),
  body('role').isIn(['Admin', 'User']).withMessage('Role must be Admin or User'),
  userTypeRule,
  registerNoRule,
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

// ---------- Buses ----------
const busRules = [
  body('busNumber')
    .trim()
    .notEmpty().withMessage('Bus number is required').bail()
    .matches(/^[A-Za-z0-9-]{2,10}$/).withMessage('Bus number: 2-10 letters, numbers or -'),
  body('registrationNo')
    .trim()
    .notEmpty().withMessage('Registration number is required').bail()
    .matches(/^[A-Za-z]{2}\s?\d{1,2}\s?[A-Za-z]{0,3}\s?\d{1,4}$/)
    .withMessage('Use the format TN 37 AB 1234'),
  body('capacity')
    .notEmpty().withMessage('Capacity is required').bail()
    .isInt({ min: 1, max: 100 }).withMessage('Capacity must be a whole number between 1 and 100')
    .toInt(),
  body('driverName')
    .trim()
    .notEmpty().withMessage('Driver name is required').bail()
    .matches(/^[A-Za-z .'-]{2,60}$/).withMessage('Driver name: 2-60 letters'),
  body('driverPhone')
    .trim()
    .notEmpty().withMessage('Driver phone is required').bail()
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('status').optional().isIn(['Active', 'Maintenance', 'Inactive']).withMessage('Invalid status'),
];

// ---------- Routes ----------
const routeRules = [
  body('routeName')
    .trim()
    .notEmpty().withMessage('Route name is required').bail()
    .isLength({ min: 3, max: 80 }).withMessage('Route name must be 3-80 characters'),
  body('routeCode')
    .trim()
    .notEmpty().withMessage('Route code is required').bail()
    .matches(/^[A-Za-z0-9-]{2,10}$/).withMessage('Route code: 2-10 letters, numbers or -'),
  body('startPoint').trim().notEmpty().withMessage('Start point is required'),
  body('endPoint').optional({ values: 'falsy' }).trim(),
  body('distanceKm')
    .notEmpty().withMessage('Distance is required').bail()
    .isFloat({ min: 0.1, max: 200 }).withMessage('Distance must be between 0.1 and 200 km')
    .toFloat(),
  body('assignedBus')
    .optional({ values: 'falsy' })
    .isMongoId().withMessage('Invalid bus selected'),
  body('stops').isArray({ min: 1 }).withMessage('Add at least one stop'),
  body('stops.*.stopName').trim().notEmpty().withMessage('Every stop needs a name'),
  body('stops.*.pickupTime').matches(TIME_REGEX).withMessage('Pickup time must be HH:MM'),
  body('stops.*.order').isInt({ min: 1 }).withMessage('Stop order must be 1 or more').toInt(),
  // Map coordinates are optional per stop
  body('stops.*.lat').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }).withMessage('Latitude must be -90 to 90').toFloat(),
  body('stops.*.lng').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }).withMessage('Longitude must be -180 to 180').toFloat(),
];

// ---------- Bus location (GPS tracker / admin update) ----------
const locationRules = [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be -90 to 90').toFloat(),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be -180 to 180').toFloat(),
];

// ---------- Schedules ----------
const scheduleRules = [
  body('route').isMongoId().withMessage('Select a route'),
  body('bus').isMongoId().withMessage('Select a bus'),
  body('departureTime').matches(TIME_REGEX).withMessage('Departure time must be HH:MM'),
  body('arrivalTime')
    .matches(TIME_REGEX).withMessage('Arrival time must be HH:MM').bail()
    .custom((value, { req }) => value > req.body.departureTime) // "HH:MM" strings compare correctly
    .withMessage('Arrival time must be after departure time'),
  body('direction').isIn(['To Campus', 'From Campus']).withMessage('Select a direction'),
  body('shift').isIn(['Morning', 'Evening']).withMessage('Select a shift'),
  body('daysOfOperation').isArray({ min: 1 }).withMessage('Select at least one day'),
  body('daysOfOperation.*').isIn(DAYS).withMessage('Invalid day'),
];

// ---------- Query-string filters on list endpoints ----------
const searchQuery = query(['search', 'stop', 'bus']).optional().isString().isLength({ max: 50 }).withMessage('Search text is too long');

const busQueryRules = [searchQuery, query('status').optional().isIn(['Active', 'Maintenance', 'Inactive']).withMessage('Invalid status')];

const routeQueryRules = [searchQuery];

const scheduleQueryRules = [
  searchQuery,
  query('route').optional().isMongoId().withMessage('Invalid route'),
  query('shift').optional().isIn(['Morning', 'Evening']).withMessage('Invalid shift'),
  query('direction').optional().isIn(['To Campus', 'From Campus']).withMessage('Invalid direction'),
  query('day').optional().isIn(DAYS).withMessage('Invalid day'),
];

const userQueryRules = [
  searchQuery,
  query('role').optional().isIn(['Admin', 'User']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

// ---------- Announcements ----------
const announcementRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required').bail()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required').bail()
    .isLength({ min: 5, max: 500 }).withMessage('Message must be 5-500 characters'),
  body('severity').isIn(SEVERITIES).withMessage('Choose Info, Warning or Urgent'),
  body('route').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid route'),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid expiry date').toDate(),
];

const announcementQueryRules = [
  query('search').optional().isString().isLength({ max: 50 }).withMessage('Search text is too long'),
  query('route').optional().isMongoId().withMessage('Invalid route'),
  query('all').optional().isBoolean().withMessage('Invalid value'),
];

// ---------- Rider reports (issues) ----------
const reportRules = [
  body('category').isIn(CATEGORIES).withMessage('Choose what the problem is about'),
  body('route').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid route'),
  body('message')
    .trim()
    .notEmpty().withMessage('Please describe the problem').bail()
    .isLength({ min: 10, max: 600 }).withMessage('Please write 10-600 characters'),
];

const issueUpdateRules = [
  body('status').isIn(ISSUE_STATUSES).withMessage('Invalid status'),
  body('adminNote').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).withMessage('Reply must be at most 300 characters'),
];

const issueQueryRules = [
  query('status').optional().isIn(ISSUE_STATUSES).withMessage('Invalid status'),
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
];

// ---------- My Route ----------
const myRouteRules = [
  body('routeId').isMongoId().withMessage('Select a route'),
  body('stopName').trim().notEmpty().withMessage('Select your boarding stop'),
];

module.exports = {
  PASSWORD_REGEX,
  announcementRules,
  announcementQueryRules,
  reportRules,
  issueUpdateRules,
  issueQueryRules,
  myRouteRules,
  busQueryRules,
  routeQueryRules,
  scheduleQueryRules,
  userQueryRules,
  mongoIdParam,
  signupRules,
  loginRules,
  changePasswordRules,
  userRules,
  busRules,
  locationRules,
  routeRules,
  scheduleRules,
};
