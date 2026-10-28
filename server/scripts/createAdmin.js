/**
 * Creates the first Transport Office admin on a real (hosted) database.
 * Use this INSTEAD of the sample seed when you go live.
 *
 *   npm.cmd run create-admin          (from the project folder)
 *
 * It asks for the database connection string, a name, an email and a password. The connection string and
 * password are typed hidden and never touch the command line or shell history. For automation you can
 * instead set the environment variables ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD (and MONGO_URI) and it
 * will not ask.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { PASSWORD_REGEX } = require('../validators');
const { createPrompter } = require('./prompt');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

(async () => {
  let { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
  const scripted = ADMIN_EMAIL && ADMIN_NAME && ADMIN_PASSWORD;

  if (!scripted) {
    const p = createPrompter();
    console.log('\nCreate the first admin for the Karunya Bus Tracking Portal\n');
    const uri = await p.ask(
      'MongoDB connection string (typed hidden), or press Enter to use the local database from .env: ',
      { hidden: true }
    );
    if (uri) process.env.MONGO_URI = uri;
    ADMIN_NAME = await p.ask('Admin name (e.g. Transport Office): ');
    ADMIN_EMAIL = await p.ask('Admin email: ');
    ADMIN_PASSWORD = await p.ask('Admin password (hidden): ', { hidden: true });
    const confirm = await p.ask('Repeat password (hidden): ', { hidden: true });
    p.close();
    if (ADMIN_PASSWORD !== confirm) fail('The two passwords do not match.');
  }

  if (!ADMIN_NAME) fail('Admin name is required.');
  if (!EMAIL_REGEX.test(ADMIN_EMAIL || '')) fail('That is not a valid email address.');
  if (!PASSWORD_REGEX.test(ADMIN_PASSWORD || '')) {
    fail('Password must be 8+ characters with uppercase, lowercase, a number and a special character.');
  }

  // Show WHERE the admin will be created (host only, never the password) so a wrong target is obvious
  let target = 'unknown';
  try {
    target = new URL(process.env.MONGO_URI).host;
  } catch (e) {
    /* leave as unknown */
  }
  console.log(`\nConnecting to ${target} ...`);
  await connectDB();

  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) fail(`A user with the email ${email} already exists.`);

  // create() (not insertMany) so the password-hashing hook runs
  const admin = await User.create({ name: ADMIN_NAME.trim(), email, password: ADMIN_PASSWORD, role: 'Admin' });
  console.log(`\n✅ Admin created on ${target}: ${admin.email}\n`);

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(`\n✖ Failed: ${err.message}\n`);
  await mongoose.disconnect();
  process.exit(1);
});
