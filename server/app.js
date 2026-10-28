// Builds the Express app (middleware + routes). It does not connect to MongoDB or listen on a port,
// so server.js can run it for real and the automated tests can run it against a test database.
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { authLimiter } = require('./middleware/rateLimit');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Hosts such as Render put a reverse proxy in front of the app. Trust its X-Forwarded-For header so the
// rate limiter sees each visitor's real IP instead of treating everyone as the same address.
if (isProduction) app.set('trust proxy', 1);

// ---------- Middleware ----------
// helmet adds security headers. The map needs OpenStreetMap tile images, so img-src allows that host.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://tile.openstreetmap.org', 'https://*.tile.openstreetmap.org'],
        // the site is served over HTTPS by the host; plain-http localhost testing must keep working
        'upgrade-insecure-requests': null,
      },
    },
  })
);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

// ---------- API routes ----------
app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Karunya Bus Tracking Portal API is running' })
);
// Failed logins / sign-ups are rate limited to slow down password guessing
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api', require('./routes/dashboardRoutes')); // /api/stats, /api/activity

// ---------- Website (production) ----------
// After `npm run build` the React app lives in client/dist. Serving it from this same server means one
// host and one URL for the whole project (and no CORS setup). In development Vite serves it instead.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (isProduction && fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  // React Router handles pages like /login or /routes/123: send index.html for any non-API path
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// ---------- Errors (must be last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
