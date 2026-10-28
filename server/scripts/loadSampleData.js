/**
 * Loads the SAMPLE buses, routes and schedules into a database - WITHOUT any sample user accounts.
 * Meant for the live (Atlas) database so the site has something to show for a demo.
 *
 *   npm.cmd run load-sample-data          (from the project folder)
 *
 * Safe by design:
 *  - it only ADDS data and refuses to run if the database already has buses, routes or schedules,
 *  - it asks you to type "yes" and shows which database host it will use,
 *  - it creates no users, so no sample passwords exist on the live site.
 *
 * Everything loaded is SAMPLE data (made-up bus numbers, drivers, phone numbers and timings, approximate
 * stop positions). Replace it with the Transport Office's real data from Admin > Operations.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Schedule = require('../models/Schedule');
const ActivityLog = require('../models/ActivityLog');
const { loadTransportData } = require('../seed');
const { createPrompter } = require('./prompt');

const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

(async () => {
  const p = createPrompter();
  console.log('\nLoad SAMPLE buses, routes and schedules (no user accounts)\n');
  const uri = await p.ask(
    'MongoDB connection string (typed hidden), or press Enter to use the local database from .env: ',
    { hidden: true }
  );
  if (uri) process.env.MONGO_URI = uri;

  let target = 'unknown';
  try {
    target = new URL(process.env.MONGO_URI).host;
  } catch (e) {
    /* leave as unknown */
  }
  const answer = await p.ask(`\nAdd the sample data to ${target}? Type yes to continue: `);
  p.close();
  if (answer.toLowerCase() !== 'yes') fail('Cancelled. Nothing was changed.');

  console.log(`\nConnecting to ${target} ...`);
  await connectDB();

  const [buses, routes, schedules] = await Promise.all([
    Bus.countDocuments(),
    Route.countDocuments(),
    Schedule.countDocuments(),
  ]);
  if (buses || routes || schedules) {
    fail(
      `This database already has data (${buses} buses, ${routes} routes, ${schedules} schedules). ` +
        'Nothing was changed. Add or edit records from Admin > Operations instead.'
    );
  }

  const counts = await loadTransportData();
  await ActivityLog.create({
    action: 'Loaded SAMPLE buses, routes and schedules',
    entity: 'Bus',
    performedByName: 'System',
  });

  console.log(
    `\n✅ Added ${counts.buses} buses, ${counts.routes} routes, ${counts.schedules} schedules and ` +
      `${counts.announcements} sample announcements to ${target}.`
  );
  console.log('   These are SAMPLE records. Replace them with real data from Admin > Operations.\n');

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(`\n✖ Failed: ${err.message}\n`);
  await mongoose.disconnect();
  process.exit(1);
});
