// Vercel serverless entry point: every /api/* request is handled by the same Express app used locally.
// (Locally and on Render, server/server.js starts the app; on Vercel this function does instead.)
const connectDB = require('../server/config/db');
const app = require('../server/app');

// Serverless instances are reused between requests, so connect to MongoDB once and keep the promise.
let connection;

module.exports = async (req, res) => {
  try {
    connection = connection || connectDB();
    await connection;
  } catch (err) {
    connection = null; // try again on the next request
    console.error('MongoDB connection failed:', err.message);
    return res.status(500).json({ success: false, message: 'Database connection failed' });
  }
  return app(req, res);
};
