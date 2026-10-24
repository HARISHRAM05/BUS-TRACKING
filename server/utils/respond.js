// Sends a consistent success response: { success: true, message, data }
const respond = (res, statusCode, message, data = null) =>
  res.status(statusCode).json({ success: true, message, data });

module.exports = respond;
