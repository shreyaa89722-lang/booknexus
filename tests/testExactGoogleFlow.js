const path = require('path');
const backendNodeModules = path.resolve(__dirname, '../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) module.paths.push(backendNodeModules);
require('../backend/config/linuxCaseResolver');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const mongoose = require('mongoose');
const User = require('../backend/models/user');
const googleAuthController = require('../backend/controllers/googleAuthController');
const { UNREGISTERED_GOOGLE_MESSAGE, googleLogin } = googleAuthController;

let FAKE_GOOGLE = null;

const { OAuth2Client } = require('google-auth-library');
OAuth2Client.prototype.verifyIdToken = async function () {
  if (!FAKE_GOOGLE) {
    const err = new Error('Invalid token');
    throw err;
  }
  return {
    getPayload: () => ({
      iss: 'https://accounts.google.com',
      aud: process.env.GOOGLE_CLIENT_ID,
      sub: FAKE_GOOGLE.googleId,
      email: FAKE_GOOGLE.email,
      email_verified: true,
      name: FAKE_GOOGLE.name,
    }),
  };
};

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

async function callGoogleLogin(body) {
  const res = mockRes();
  const req = { body, headers: {}, ip: '127.0.0.1' };
  try {
    await googleLogin(req, res);
  } catch (err) {
    if (res.statusCode === 200) res.statusCode = 500;
    res.body = { success: false, message: err.message };
  }
  return res;
}

async function run() {
  console.log('\n========================================');
  console.log('BookNexus: Testing Continue with Google Flow');
  console.log('========================================\n');

  const connectDB = require('../backend/config/db');
  await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(title, condition, info = '') {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title} ${info}`);
      failed++;
    }
  }

  // Find an existing registered student in MongoDB
  const existingStudent = await User.findOne({ role: 'student', email: { $exists: true, $ne: '' } });
  if (!existingStudent) {
    throw new Error('No existing registered student found in MongoDB to test.');
  }
  console.log(`Found existing registered student: ${existingStudent.name} (${existingStudent.email})`);

  // 1. Test: Registered Student logs in via Google
  FAKE_GOOGLE = {
    email: existingStudent.email,
    googleId: 'google-sub-test-12345',
    name: existingStudent.name,
  };
  const r1 = await callGoogleLogin({ credential: 'valid.mock.token' });
  assert('Registered student Google login returns HTTP 200', r1.statusCode === 200, `Got: ${r1.statusCode}`);
  assert('Registered student login success: true', r1.body && r1.body.success === true);
  assert('Registered student needsOnboarding: false', r1.body && r1.body.needsOnboarding === false);
  assert('Registered student receives valid session token', Boolean(r1.body && r1.body.data && r1.body.data.token));
  assert('Registered student data matches user', r1.body && r1.body.data && r1.body.data.email === existingStudent.email);

  // 2. Test: Unregistered / unknown Google email is rejected
  const unknownEmail = 'completely_unknown_student_999@gmail.com';
  FAKE_GOOGLE = {
    email: unknownEmail,
    googleId: 'google-sub-unknown-999',
    name: 'Unknown Student',
  };
  const r2 = await callGoogleLogin({ credential: 'valid.mock.token' });
  assert('Unregistered Google email returns HTTP 403', r2.statusCode === 403, `Got: ${r2.statusCode}`);
  assert(
    'Unregistered Google email returns exact specified rejection message',
    r2.body && r2.body.message === UNREGISTERED_GOOGLE_MESSAGE,
    `Got: ${r2.body && r2.body.message}`
  );

  // 3. Test: Unregistered email does NOT create any record in MongoDB
  const dbCheck = await User.findOne({ email: unknownEmail });
  assert('Unregistered Google email did not create any MongoDB account', dbCheck === null);

  // 4. Test: Missing or empty token is rejected
  FAKE_GOOGLE = null;
  const r3 = await callGoogleLogin({});
  assert('Empty token request returns HTTP 400', r3.statusCode === 400, `Got: ${r3.statusCode}`);

  // 5. Test: Invalid token is rejected
  const r4 = await callGoogleLogin({ credential: 'invalid.token.payload' });
  assert('Invalid token returns HTTP 401', r4.statusCode === 401, `Got: ${r4.statusCode}`);

  // 6. Test: Librarian / Admin account Google sign-in works
  const staff = await User.findOne({ role: { $in: ['librarian', 'admin'] } });
  if (staff) {
    FAKE_GOOGLE = {
      email: staff.email,
      googleId: 'google-staff-id-123',
      name: staff.name,
    };
    const r5 = await callGoogleLogin({ credential: 'valid.staff.token' });
    assert('Staff Google login returns HTTP 200', r5.statusCode === 200, `Got: ${r5.statusCode}`);
    assert('Staff role is preserved', r5.body && r5.body.data && r5.body.data.role === staff.role);
  }

  await mongoose.disconnect();
  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
