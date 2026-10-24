/**
 * Creates the first Transport Office admin on a real (hosted) database.
 * Use this INSTEAD of the sample seed when you go live.
 *
 *   PowerShell:
 *     $env:ADMIN_EMAIL = 'transport@karunya.edu.in'
 *     $env:ADMIN_NAME = 'Transport Office'
 *     $env:ADMIN_PASSWORD = 'a-Strong#Password1'
 *     $env:MONGO_URI = '<your Atlas connection string>'
 *     npm run create-admin --prefix server
 *
 * The password is read from the environment (not the command line) so it does not end up in shell history.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { PASSWORD_REGEX } = require('../validators');

const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;

const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

(async () => {
  if (!ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD) {
    fail('Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD environment variables first (see the top of this file).');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ADMIN_EMAIL)) fail('ADMIN_EMAIL is not a valid email address.');
  if (!PASSWORD_REGEX.test(ADMIN_PASSWORD)) {
    fail('ADMIN_PASSWORD must be 8+ characters with uppercase, lowercase, a number and a special character.');
  }

  await connectDB();

  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) fail(`A user with the email ${email} already exists.`);

  // create() (not insertMany) so the password-hashing hook runs
  const admin = await User.create({ name: ADMIN_NAME.trim(), email, password: ADMIN_PASSWORD, role: 'Admin' });
  console.log(`\n✅ Admin created: ${admin.email}\n`);

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
