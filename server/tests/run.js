/**
 * Automated API tests:  npm test   (from the project root or /server)
 *
 * What it does:
 *   1. connects to a SEPARATE test database (never your real data),
 *   2. seeds it with the sample data,
 *   3. starts the real Express app on a random free port,
 *   4. runs every suite in order and exits with code 1 if any check failed.
 *
 * MongoDB must be running. Override the test database with TEST_MONGO_URI (its name must contain "test").
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TEST_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/karunya_bus_portal_test';

// Safety: the seed wipes the database, so refuse anything that is not clearly a test database
if (!/test/i.test(new URL(TEST_URI).pathname)) {
  console.error(`Refusing to run: "${TEST_URI}" is not a test database (name must contain "test").`);
  process.exit(1);
}

// These must be set BEFORE the app is loaded (middleware reads them when it is created)
process.env.MONGO_URI = TEST_URI;
process.env.AUTH_RATE_LIMIT_MAX = '10';
process.env.AUTH_RATE_LIMIT_WINDOW_MIN = '15';
process.env.SIMULATE_BUS_TRACKING = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_SIGNUP_CODE = process.env.ADMIN_SIGNUP_CODE || 'TEST-ADMIN-CODE';

const mongoose = require('mongoose');
const app = require('../app');
const { seedDatabase } = require('../seed');
const { createClient, createChecker } = require('./helpers');

// Order matters: security runs last because it gets this IP rate limited
const SUITES = ['api', 'map', 'security'];

(async () => {
  await mongoose.connect(TEST_URI);
  await seedDatabase();

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;

  const client = createClient(base);
  let failed = 0;
  let passed = 0;

  for (const name of SUITES) {
    console.log(`\n=== ${name} ===`);
    const { check, result } = createChecker();
    try {
      await require(`./${name}.test.js`)({ ...client, check });
    } catch (err) {
      result.fail += 1;
      console.log(`  FAIL  suite crashed: ${err.stack}`);
    }
    passed += result.pass;
    failed += result.fail;
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await mongoose.disconnect();
  server.close();
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('Test runner failed:', err.message);
  process.exit(1);
});
