// Centralized error handling - every error in the app ends up here
const ApiError = require('../utils/ApiError');

// Friendly names for unique fields in duplicate-key messages
const FIELD_LABELS = { busNumber: 'Bus number', routeCode: 'Route code', email: 'Email' };

// 404 for unknown API routes
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error';
  let errors = err.errors;

  // Invalid MongoDB ObjectId, e.g. /api/buses/abc
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Duplicate unique field (email, busNumber, routeCode)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    const label = FIELD_LABELS[field] || field;
    message = `${label} "${err.keyValue[field]}" already exists`;
    errors = { [field]: message };
  }

  // Mongoose schema validation errors
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = {};
    Object.values(err.errors).forEach((e) => {
      errors[e.path] = e.message;
    });
  }

  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};

module.exports = { notFound, errorHandler };
