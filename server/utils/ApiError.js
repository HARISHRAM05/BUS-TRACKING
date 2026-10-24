// Custom error carrying an HTTP status code and optional field-wise errors
class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // e.g. { email: 'Email already exists' } - shown inline on forms
  }
}

module.exports = ApiError;
