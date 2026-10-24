# Karunya Bus Tracking Portal

A MERN-stack web portal for **Karunya Institute of Technology and Sciences (Karunya University), Karunya Nagar, Coimbatore, Tamil Nadu**.
The Karunya Transport Office publishes bus routes, stops, timings and bus/driver details. Students and staff
travelling between Coimbatore city and the campus look them up.

- **Admins (Transport Office)** manage buses, routes, schedules and users.
- **Users (Students / Staff)** get a view-only dashboard with search and filters.

> ⚠️ **SAMPLE DATA:** every bus number, registration number, driver name, phone number, stop and timing created by
> `server/seed.js` is placeholder data for this project. Replace it with real data from the Karunya Transport Office.

---

## Tech stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 (Vite), React Router 6, Axios, Bootstrap 5, Bootstrap Icons |
| Backend  | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, express-validator, cors, dotenv |
| Database | MongoDB |

## Folder structure

```
College bus Tacking/
├── package.json            # root scripts (runs server + client together with concurrently)
├── server/
│   ├── config/db.js        # MongoDB connection
│   ├── models/             # User, Bus, Route, Schedule, ActivityLog
│   ├── controllers/        # request handlers (business logic)
│   ├── routes/             # Express routers (URL -> middleware -> controller)
│   ├── middleware/         # auth (protect/authorize), validate, errorHandler
│   ├── validators/         # express-validator rules for every endpoint
│   ├── services/           # trackingSimulator.js (DEMO bus positions for the map)
│   ├── utils/              # ApiError, asyncHandler, respond, logActivity, escapeRegex
│   ├── tests/              # automated API tests (npm test)
│   ├── seed.js             # SAMPLE data loader
│   ├── app.js              # Express app (middleware + routes)
│   ├── server.js           # entry point: connects to MongoDB and starts listening
│   └── .env.example
└── client/
    ├── public/             # put karunya-logo.png here
    └── src/
        ├── components/     # Navbar, Footer, Modal, ConfirmModal, FormField, LogoSlot, ...
        ├── context/        # AuthContext (JWT + user), ToastContext
        ├── pages/          # Landing, Login, Signup, ChangePassword, admin/*, user/*
        ├── routes/         # ProtectedRoute, GuestOnlyRoute
        ├── services/api.js # Axios instance + API functions
        └── utils/          # validation, formatting, hooks
```

---

## Setup

### Prerequisites
- **Node.js 18+** (`node -v`)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string

> **On the lab PC used to build this project**, MongoDB runs as the Windows service "MongoDB" (starts
> automatically), and Node.js is a portable copy in `%LOCALAPPDATA%\Programs\nodejs` that is on the user PATH.

### 1. Install dependencies
```bash
npm run install-all
```
(installs root, `server/` and `client/` packages)

### 2. Configure the backend
```bash
cd server
copy .env.example .env      # Windows  (macOS/Linux: cp .env.example .env)
```
Edit `server/.env`:

| Variable | Meaning |
|----------|---------|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | long random string used to sign tokens |
| `JWT_EXPIRES_IN` | token lifetime, e.g. `1d` |
| `ADMIN_SIGNUP_CODE` | secret code required to sign up as Admin |
| `AUTH_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_WINDOW_MIN` | failed login attempts allowed per IP / window in minutes (default 10 / 15) |
| `SIMULATE_BUS_TRACKING` | `true` = demo buses move on the map; `false` = only real GPS positions |
| `CLIENT_URL` | frontend URL allowed by CORS |

### 3. Load sample data
```bash
npm run seed
```
This **wipes** the database and loads the sample data, then prints the test accounts.

### 4. Run
```bash
npm run dev
```
- Frontend: http://localhost:5173
- API: http://localhost:5000/api/health

You can also run them separately: `npm run server` and `npm run client`.

### Run the automated tests
```bash
npm test
```
MongoDB must be running. The tests use a **separate database** (`karunya_bus_portal_test`) that they wipe and re-seed
themselves, so your real data is never touched (the runner refuses any database whose name does not contain "test").
They start the real app on a free port and run three suites in `server/tests/`:

| Suite | Covers |
|-------|--------|
| `api.test.js` | sign-up/login, validation, role protection (User gets 403), CRUD for buses/routes/schedules/users, stats |
| `map.test.js` | stop coordinates, simulated bus positions, GPS location updates |
| `security.test.js` | helmet headers and login rate limiting |

### Test accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@karunya.edu.in | `Admin@123` |
| Student | student@karunya.edu.in | `Student@123` |
| Staff | staff@karunya.edu.in | `Staff@1234` |

Admin sign-up code (sample): `KARUNYA-TRANSPORT-2026` (set by `ADMIN_SIGNUP_CODE` in `.env`).

### Adding the Karunya logo
Save the official logo as **`client/public/karunya-logo.png`**. It appears automatically in the navbar and
on the landing page. Until then a plain bus icon is shown. The slot is in `client/src/components/LogoSlot.jsx`.

---

## Features

### Authentication
- Sign-up with name, email, password + confirm, role (Admin/User). Users also choose Student/Staff and can enter a Register No / Staff ID.
- Password rule (client **and** server): min 8 chars with uppercase, lowercase, number and special character.
- Admin sign-up requires `ADMIN_SIGNUP_CODE`.
- JWT login with bcrypt-hashed passwords. Admin → `/admin`, User → `/dashboard`.
- Change Password for every user. Logout.
- Frontend `ProtectedRoute` + backend `protect` / `authorize('Admin')` middleware.
- **Security headers** with `helmet`, and **login/sign-up rate limiting**: after 10 failed attempts from one IP within
  15 minutes the API answers `429 Too many failed attempts`. Successful logins are not counted. Tune it with
  `AUTH_RATE_LIMIT_MAX` and `AUTH_RATE_LIMIT_WINDOW_MIN` in `server/.env`.

### Admin
- **Home**: portal capabilities, stats cards (buses, routes, schedules, users), recent activity log.
- **Operations**: Buses / Routes / Schedules tabs with table, search, add & edit (modal), delete (confirmation).
  - Routes have an ordered stop list (add / remove / reorder) with pickup times and an assigned bus.
  - Deleting a route also deletes its schedules. A bus used by a schedule cannot be deleted.
- **User Management**: search/filter, add, edit details/role/status, optional password reset, remove.
  An admin cannot delete themselves, or remove their own admin role or deactivate themselves.

### Live bus map (Admin and User) - `/track`
- Leaflet + OpenStreetMap (free, no API key). Every route is drawn as a line through its stops; pick a route to see
  its numbered stops and the campus marker, and click a bus for driver details. Positions refresh every 8 seconds.
- The route detail page has the same map for just that route.
- Admins can set optional **latitude / longitude** for each stop in Operations → Routes.
- **Bus positions are a DEMO.** The buses have no GPS trackers, so `server/services/trackingSimulator.js` slides each
  Active bus back and forth along its route and the map labels these as demo positions. Set
  `SIMULATE_BUS_TRACKING=false` in `server/.env` to turn it off.
- A real tracker (or an admin) can report a position with `PUT /api/buses/:id/location` (`{ "lat": 10.95, "lng": 76.8 }`).
  While that GPS position is under 2 minutes old the simulator leaves the bus alone, and the map shows it as GPS.
- Stop coordinates in the seed data are **approximate sample values**, and route lines are straight segments between
  stops (not road-following). Correct them with real positions from the Transport Office.

### User (Student / Staff)
- View-only dashboard with Routes, Schedules and Buses tabs.
- Filter by route name/code, stop name, bus number, shift, direction and day (with a "Today" shortcut).
- Route detail page: stop timeline with pickup times, assigned bus & driver, all trips.
- No add/edit/delete controls. The API returns **403** for any write request from this role.

---

## API

Base URL: `http://localhost:5000/api`. Protected endpoints need `Authorization: Bearer <token>`.

Every response has the same shape:
```json
{ "success": true,  "message": "Bus added successfully", "data": { ... } }
{ "success": false, "message": "Validation failed", "errors": { "driverPhone": "Enter a valid 10-digit mobile number" } }
```

| Method | Endpoint | Access | Notes |
|--------|----------|--------|-------|
| GET | `/health` | Public | API status |
| POST | `/auth/signup` | Public | `adminCode` required when `role=Admin` |
| POST | `/auth/login` | Public | returns `{ token, user }` |
| GET | `/auth/me` | Logged in | current user |
| PUT | `/auth/change-password` | Logged in | `currentPassword, newPassword, confirmNewPassword` |
| GET | `/buses` | Logged in | `?search=&status=` |
| GET | `/buses/:id` | Logged in | |
| POST | `/buses` | Admin | |
| PUT | `/buses/:id` | Admin | |
| DELETE | `/buses/:id` | Admin | 409 if used in schedules |
| GET | `/routes` | Logged in | `?search=&stop=&bus=` |
| GET | `/routes/:id` | Logged in | includes assigned bus + schedules |
| POST | `/routes` | Admin | |
| PUT | `/routes/:id` | Admin | |
| DELETE | `/routes/:id` | Admin | also deletes its schedules |
| GET | `/schedules` | Logged in | `?search=&route=&bus=&stop=&shift=&direction=&day=` |
| GET | `/schedules/:id` | Logged in | |
| POST | `/schedules` | Admin | |
| PUT | `/schedules/:id` | Admin | |
| DELETE | `/schedules/:id` | Admin | |
| GET | `/users` | Admin | `?search=&role=&status=` |
| GET | `/users/:id` | Admin | |
| POST | `/users` | Admin | |
| PUT | `/users/:id` | Admin | password optional (blank = unchanged) |
| DELETE | `/users/:id` | Admin | cannot delete yourself |
| PUT | `/buses/:id/location` | Admin | `{ lat, lng }` - report the bus position (GPS) |
| GET | `/tracking` | Logged in | routes with stop coordinates + assigned bus and its last location |
| GET | `/stats` | Admin | dashboard counts |
| GET | `/activity` | Admin | `?limit=10` recent activity |

**Status codes used:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found,
409 Conflict (duplicate / in use), 422 Validation failed, 500 Server error.

### Request flow (useful for the viva)
```
Request → cors/json → router → protect (verify JWT) → authorize('Admin') → validation rules → validate
        → controller (Mongoose) → respond()            ── any thrown error ──→ errorHandler → JSON error
```

---

## Deployment (free: MongoDB Atlas + Render)

The whole project runs as **one web service**: in production the Express server also serves the built React site
(`client/dist`), so there is one URL and no CORS setup. The database is **MongoDB Atlas** (free M0 cluster).

### 1. Database - MongoDB Atlas
1. Create a free account at https://www.mongodb.com/cloud/atlas and create a free **M0** cluster (pick a nearby region, e.g. Mumbai).
2. **Database Access** → add a database user with a strong password (avoid `@ : / ?` in it, or URL-encode them).
3. **Network Access** → add IP address `0.0.0.0/0` (Render's free tier has no fixed IP; the database user's password is what protects it).
4. **Connect → Drivers** → copy the connection string and put the database name before the `?`:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/karunya_bus_portal?retryWrites=true&w=majority`

### 2. Create the first admin (do NOT run the sample seed)
The sample seed has public passwords (`Admin@123`) and wipes the database, so it refuses to run when `NODE_ENV=production`.
Create a real admin instead, from your PC, pointing at Atlas:
```bash
npm.cmd run create-admin
```
It asks for the Atlas connection string, the admin's name and email, and a password (typed hidden, twice). It prints
which database host it connected to, so you can confirm it is Atlas and not your local database. Password rule:
8+ characters with uppercase, lowercase, a number and a special character.
Then add the real buses, routes and schedules from the **Operations** page after you log in.

### 3. Put the code on GitHub
Create a (private) GitHub repository and push this project. `.env`, `node_modules` and `client/dist` are git-ignored.
To show the Karunya logo online, add `client/public/karunya-logo.png` before pushing.

### 4. Host - Render
1. Sign in at https://render.com with GitHub → **New → Blueprint** → pick the repository (it reads `render.yaml`).
2. When asked, set **`MONGO_URI`** (the Atlas string) and **`ADMIN_SIGNUP_CODE`** (your own secret code for Admin sign-up).
   `JWT_SECRET` is generated automatically.
3. Deploy. Your site will be at `https://<service-name>.onrender.com`.

(Manual alternative to the Blueprint: New → Web Service, build command `npm run render-build`, start command `npm start`,
health check `/api/health`, and the environment variables from `render.yaml`.)

### After deploying - quick checks
- `https://<your-site>/api/health` shows `Karunya Bus Tracking Portal API is running`.
- Log in with the admin you created; open **Live Map**; add a bus and a route.
- Render's free tier **sleeps after ~15 minutes without traffic**; the first visit afterwards takes about a minute to wake up.
- `SIMULATE_BUS_TRACKING=true` keeps the *demo* bus movement. Set it to `false` in Render's environment once real GPS data exists.
- Change `ADMIN_SIGNUP_CODE` if it is ever shared, and never commit `.env`.

To test the production build on your own PC: `npm run build`, then run the server with `NODE_ENV=production`
(it then serves `client/dist` on the API port).

## Screenshots

> Add your screenshots to a `screenshots/` folder and update the paths below.

| Page | Screenshot |
|------|-----------|
| Landing page | `screenshots/landing.png` |
| Login / Sign-up | `screenshots/signup.png` |
| Admin home | `screenshots/admin-home.png` |
| Operations (Routes tab) | `screenshots/operations.png` |
| User Management | `screenshots/users.png` |
| User dashboard | `screenshots/dashboard.png` |
| Route detail | `screenshots/route-detail.png` |
| Live bus map | `screenshots/live-map.png` |

---

## Notes
- All seed data is **SAMPLE** data. Replace it with the real Transport Office routes and timings.
- Times are stored as 24-hour `HH:MM` strings and shown as 12-hour on screen.
- `.env` is git-ignored; only `.env.example` is committed.
