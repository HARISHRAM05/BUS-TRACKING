/**
 * Seed script - fills the database with SAMPLE data.
 *
 *   npm run seed   (from /server)
 *
 * IMPORTANT: Every bus number, registration number, driver name, phone number, stop
 * and timing below is SAMPLE / PLACEHOLDER data created for this college project.
 * Replace it with the real data from the Karunya Transport Office before real use.
 *
 * Running this script DELETES all existing buses, routes, schedules, users and logs.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Bus = require('./models/Bus');
const Route = require('./models/Route');
const Schedule = require('./models/Schedule');
const ActivityLog = require('./models/ActivityLog');

const CAMPUS = 'Karunya Nagar Campus';

// ---------- SAMPLE users ----------
const users = [
  { name: 'Transport Office Admin', email: 'admin@karunya.edu.in', password: 'Admin@123', role: 'Admin' },
  {
    name: 'Arun Prakash',
    email: 'student@karunya.edu.in',
    password: 'Student@123',
    role: 'User',
    userType: 'Student',
    registerNo: 'URK23CS1001',
  },
  {
    name: 'Dr. Priya Raman',
    email: 'staff@karunya.edu.in',
    password: 'Staff@1234',
    role: 'User',
    userType: 'Staff',
    registerNo: 'KITS-STF-0421',
  },
];

// ---------- SAMPLE buses (numbers, drivers and phones are placeholders) ----------
const buses = [
  { busNumber: 'KU-01', registrationNo: 'TN 37 KU 1001', capacity: 52, driverName: 'Murugan S', driverPhone: '9000000101' },
  { busNumber: 'KU-02', registrationNo: 'TN 37 KU 1002', capacity: 52, driverName: 'Selvaraj K', driverPhone: '9000000102' },
  { busNumber: 'KU-03', registrationNo: 'TN 37 KU 1003', capacity: 48, driverName: 'Ravi Kumar P', driverPhone: '9000000103' },
  { busNumber: 'KU-04', registrationNo: 'TN 37 KU 1004', capacity: 52, driverName: 'Senthil Nathan R', driverPhone: '9000000104' },
  { busNumber: 'KU-05', registrationNo: 'TN 37 KU 1005', capacity: 40, driverName: 'Ganesan M', driverPhone: '9000000105' },
  { busNumber: 'KU-06', registrationNo: 'TN 37 KU 1006', capacity: 48, driverName: 'Prakash J', driverPhone: '9000000106' },
];

// ---------- SAMPLE routes: [code, name, start, km, bus, [stopName, morningPickupTime]...] ----------
// Morning pickup times are placeholders; the last stop is always the campus.
const routes = [
  {
    routeCode: 'R01', routeName: 'Gandhipuram - Karunya', startPoint: 'Gandhipuram', distanceKm: 31.5, bus: 'KU-01',
    stops: [['Gandhipuram Central Bus Stand', '06:45'], ['Town Hall', '06:55'], ['Ukkadam', '07:05'],
      ['Perur', '07:25'], ['Madampatti', '07:40'], [CAMPUS, '08:05']],
  },
  {
    routeCode: 'R02', routeName: 'RS Puram - Karunya', startPoint: 'RS Puram', distanceKm: 26, bus: 'KU-02',
    stops: [['RS Puram (DB Road)', '06:55'], ['Ponnaiyarajapuram', '07:02'], ['Seeranaickenpalayam', '07:10'],
      ['Kovaipudur Pirivu', '07:22'], ['Perur Chettipalayam', '07:35'], ['Madampatti', '07:48'], [CAMPUS, '08:10']],
  },
  {
    routeCode: 'R03', routeName: 'Saibaba Colony - Karunya', startPoint: 'Saibaba Colony', distanceKm: 33, bus: 'KU-03',
    stops: [['Saibaba Colony', '06:40'], ['Edayarpalayam', '06:50'], ['Vadavalli', '07:02'],
      ['Thondamuthur', '07:25'], ['Alandurai', '07:45'], [CAMPUS, '08:05']],
  },
  {
    routeCode: 'R04', routeName: 'Singanallur - Karunya', startPoint: 'Singanallur', distanceKm: 38, bus: 'KU-04',
    stops: [['Singanallur Bus Stand', '06:20'], ['Ramanathapuram', '06:32'], ['Sungam', '06:40'],
      ['Ukkadam', '06:52'], ['Selvapuram', '07:02'], ['Perur', '07:15'], ['Madampatti', '07:30'], [CAMPUS, '07:55']],
  },
  {
    routeCode: 'R05', routeName: 'Peelamedu - Karunya', startPoint: 'Peelamedu', distanceKm: 36, bus: 'KU-05',
    stops: [['Peelamedu', '06:25'], ['Lakshmi Mills', '06:38'], ['Race Course', '06:48'],
      ['Ukkadam', '07:00'], ['Perur', '07:20'], ['Madampatti', '07:35'], [CAMPUS, '08:00']],
  },
  {
    routeCode: 'R06', routeName: 'Thudiyalur - Karunya', startPoint: 'Thudiyalur', distanceKm: 35, bus: 'KU-06',
    stops: [['Thudiyalur', '06:30'], ['Kavundampalayam', '06:40'], ['Vadavalli', '06:58'],
      ['Thondamuthur', '07:20'], ['Alandurai', '07:40'], [CAMPUS, '08:00']],
  },
  {
    routeCode: 'R07', routeName: 'Ukkadam - Karunya (via Selvapuram)', startPoint: 'Ukkadam', distanceKm: 27, bus: null,
    stops: [['Ukkadam Bus Stand', '07:00'], ['Selvapuram', '07:10'], ['Telungupalayam', '07:18'],
      ['Perur', '07:28'], ['Pachapalayam', '07:40'], ['Madampatti', '07:50'], [CAMPUS, '08:10']],
  },
];

// Map positions [lat, lng] of every stop, looked up by stop name.
// APPROXIMATE sample coordinates (placed by hand around the real localities, not surveyed).
// The Transport Office should correct them, e.g. from Google Maps, via Admin > Operations > Routes.
const COORDS = {
  [CAMPUS]: [10.9358, 76.7437],
  'Gandhipuram Central Bus Stand': [11.0183, 76.9674],
  'Town Hall': [10.9941, 76.9617],
  Ukkadam: [10.9886, 76.9575],
  'Ukkadam Bus Stand': [10.989, 76.957],
  Perur: [10.9757, 76.916],
  Madampatti: [10.95, 76.87],
  'RS Puram (DB Road)': [11.006, 76.95],
  Ponnaiyarajapuram: [10.999, 76.952],
  Seeranaickenpalayam: [10.98, 76.94],
  'Kovaipudur Pirivu': [10.95, 76.935],
  'Perur Chettipalayam': [10.965, 76.91],
  'Saibaba Colony': [11.027, 76.949],
  Edayarpalayam: [11.029, 76.935],
  Vadavalli: [11.026, 76.904],
  Thondamuthur: [10.989, 76.8247],
  Alandurai: [10.9780, 76.776],
  'Singanallur Bus Stand': [10.999, 77.029],
  Ramanathapuram: [10.997, 76.995],
  Sungam: [10.993, 76.976],
  Selvapuram: [10.982, 76.954],
  Peelamedu: [11.024, 77.005],
  'Lakshmi Mills': [11.014, 76.981],
  'Race Course': [11.001, 76.974],
  Thudiyalur: [11.08, 76.94],
  Kavundampalayam: [11.056, 76.945],
  Telungupalayam: [10.978, 76.939],
  Pachapalayam: [10.956, 76.895],
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WITH_SAT = [...WEEKDAYS, 'Sat'];

// Adds minutes to an "HH:MM" string
const addMinutes = (time, mins) => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const minutesBetween = (a, b) => {
  const [h1, m1] = a.split(':').map(Number);
  const [h2, m2] = b.split(':').map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
};

// Wipes the database and loads the sample data. Assumes mongoose is already connected.
const seedDatabase = async () => {
  console.log('Clearing old data...');
  await Promise.all([
    User.deleteMany(),
    Bus.deleteMany(),
    Route.deleteMany(),
    Schedule.deleteMany(),
    ActivityLog.deleteMany(),
  ]);

  // create() one by one so the password-hashing pre-save hook runs
  const createdUsers = [];
  for (const u of users) createdUsers.push(await User.create(u));
  const admin = createdUsers[0];

  const createdBuses = await Bus.insertMany(buses);
  const busByNumber = Object.fromEntries(createdBuses.map((b) => [b.busNumber, b]));

  const scheduleDocs = [];
  for (const [i, r] of routes.entries()) {
    const bus = r.bus ? busByNumber[r.bus] : null;
    const route = await Route.create({
      routeCode: r.routeCode,
      routeName: r.routeName,
      startPoint: r.startPoint,
      endPoint: CAMPUS,
      distanceKm: r.distanceKm,
      assignedBus: bus?._id || null,
      stops: r.stops.map(([stopName, pickupTime], idx) => {
        const [lat, lng] = COORDS[stopName];
        return { stopName, pickupTime, order: idx + 1, lat, lng };
      }),
    });

    if (!bus) continue; // a route without a bus gets no schedules yet

    const first = r.stops[0][1];
    const last = r.stops[r.stops.length - 1][1];
    const tripMinutes = minutesBetween(first, last);
    const days = i % 2 === 0 ? WITH_SAT : WEEKDAYS; // vary days a little

    // Morning: area -> campus
    scheduleDocs.push({
      route: route._id, bus: bus._id, shift: 'Morning', direction: 'To Campus',
      departureTime: first, arrivalTime: last, daysOfOperation: days,
    });
    // Evening: campus -> area (classes end ~16:30)
    const eveningDeparture = '16:45';
    scheduleDocs.push({
      route: route._id, bus: bus._id, shift: 'Evening', direction: 'From Campus',
      departureTime: eveningDeparture, arrivalTime: addMinutes(eveningDeparture, tripMinutes), daysOfOperation: days,
    });
  }
  await Schedule.insertMany(scheduleDocs);

  await ActivityLog.create({
    action: 'Database seeded with SAMPLE data',
    entity: 'Auth',
    performedBy: admin._id,
    performedByName: 'System',
  });

  return { buses: createdBuses.length, routes: routes.length, schedules: scheduleDocs.length };
};

// Run directly with: npm run seed
if (require.main === module) {
  (async () => {
    // The sample accounts have PUBLIC passwords and the seed wipes all data: never run it on a live site
    if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
      console.error('Refusing to seed with NODE_ENV=production (it deletes all data and creates sample accounts).');
      console.error('Use `npm run create-admin` to create a real admin instead.');
      process.exit(1);
    }
    await connectDB();
    const counts = await seedDatabase();

    console.log('\n✅ Seed complete (SAMPLE data - replace with real Transport Office data)');
    console.log(`   ${counts.buses} buses, ${counts.routes} routes, ${counts.schedules} schedules\n`);
    console.log('   Test accounts:');
    console.table(users.map((u) => ({ role: u.userType || u.role, email: u.email, password: u.password })));
    console.log(`   Admin signup code (from .env): ${process.env.ADMIN_SIGNUP_CODE}\n`);

    await mongoose.disconnect();
  })().catch(async (err) => {
    console.error('Seeding failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  });
}

// Used by the automated tests (server/tests)
module.exports = { seedDatabase };
