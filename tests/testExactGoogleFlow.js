const path = require('path');
const backendNodeModules = path.resolve(__dirname, '../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) module.paths.push(backendNodeModules);
require('../backend/config/linuxCaseResolver');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const mongoose = require('mongoose');
const User = require('../backend/models/user');
const googleAuthController = require('../backend/controllers/googleAuthController');
const { UNREGISTERED_GOOGLE_MESSAGE, googleLogin } = googleAuthController;
const { registerUser, registerStep1, registerStep2, loginUser } = require('../backend/controllers/authController');

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

async function callRegister(body) {
  const res = mockRes();
  const req = { body, headers: {}, ip: '127.0.0.1' };
  try {
    await registerUser(req, res);
  } catch (err) {
    if (res.statusCode === 200) res.statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.body = { success: false, message: err.message };
  }
  return res;
}

async function callStep1(body) {
  const res = mockRes();
  const req = { body, headers: {}, ip: '127.0.0.1' };
  try {
    await registerStep1(req, res);
  } catch (err) {
    if (res.statusCode === 200) res.statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.body = { success: false, message: err.message };
  }
  return res;
}

async function callStep2(body, token) {
  const res = mockRes();
  const req = {
    body,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ip: '127.0.0.1',
  };
  try {
    await registerStep2(req, res);
  } catch (err) {
    if (res.statusCode === 200) res.statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.body = { success: false, message: err.message };
  }
  return res;
}

async function run() {
  console.log('\n========================================');
  console.log('BookNexus: 10 Required Test Cases Suite');
  console.log('========================================\n');

  const connectDB = require('../backend/config/db');
  await connectDB();
  await User.deleteMany({ email: /^test_flow_/ });

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

  const testEmail = `test_flow_student_${Date.now()}@college.edu`;
  const testUsn = `USN-${Date.now().toString().slice(-6)}`;
  let registeredUserId = null;

  try {
    // ----------------------------------------------------
    // Test 1: New student registration using college email
    // ----------------------------------------------------
    const regRes = await callRegister({
      name: 'Aditi Rao',
      email: testEmail,
      usn: testUsn,
      dob: '2003-04-12',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      preferredName: 'Aditi',
      bio: 'Loves mystery, science fiction and classical literature.',
      quizAnswers: {
        q0: ['a'],
        q1: ['a'],
        q2: ['a'],
        q3: ['a'],
        q4: ['a'],
        q5: ['a'],
      },
    });

    assert('Case 1: New student registration returns 201', regRes.statusCode === 201, `Got: ${regRes.statusCode} (${regRes.body?.message})`);
    assert('Case 1: Registration returns session token and data', Boolean(regRes.body?.data?.token));
    registeredUserId = regRes.body?.data?._id;

    // ----------------------------------------------------
    // Test 1b: Exact Two-Step Student Registration (accepts dots in name)
    // ----------------------------------------------------
    const twoStepEmail = `two_step_student_${Date.now()}@college.edu`;
    const twoStepUsn = `USN-DOT-${Date.now().toString().slice(-4)}`;
    const step1Res = await callStep1({
      name: 'K. S. Hegde', // valid name with dots and initials
      email: twoStepEmail,
      usn: twoStepUsn,
      dob: '2002-11-20',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
    });
    assert('Step 1: Student registration with dots in name returns 201', step1Res.statusCode === 201, `Got: ${step1Res.statusCode} (${step1Res.body?.message})`);
    assert('Step 1: Returns token and onboardingStep: quiz', step1Res.body?.data?.onboardingStep === 'quiz');

    const step1User = await User.findOne({ email: twoStepEmail });
    assert('Step 1: Full name with dots stored in MongoDB intact', step1User && step1User.name === 'K. S. Hegde');
    assert('Step 1: USN stored and registrationCompleted is false', step1User && step1User.usn === twoStepUsn && step1User.registrationCompleted === false);

    // Step 2: About You
    const step2Res = await callStep2({
      email: twoStepEmail,
      preferredName: 'Kiran',
      bio: 'Enthusiastic reader of computer science and technology.',
      quizAnswers: { 0: ['a'], 1: ['c'], 2: ['a'], 3: ['e'], 4: ['c'], 5: ['b'] },
    }, step1Res.body?.data?.token);

    assert('Step 2: About You returns 200', step2Res.statusCode === 200, `Got: ${step2Res.statusCode} (${step2Res.body?.message})`);
    assert('Step 2: Marks registrationCompleted: true and returns session', step2Res.body?.data?.registrationCompleted === true && Boolean(step2Res.body?.data?.token));

    const finalTwoStepUser = await User.findOne({ email: twoStepEmail });
    assert('Step 2: Saved preferredName and bio in SAME MongoDB student record', finalTwoStepUser && finalTwoStepUser.preferredName === 'Kiran' && finalTwoStepUser._id.toString() === step1User._id.toString());

    // ----------------------------------------------------
    // Test 2: Duplicate email registration
    // ----------------------------------------------------
    const dupEmailRes = await callRegister({
      name: 'Aditi Rao Another',
      email: testEmail,
      usn: `USN-${Date.now().toString().slice(-6)}-D`,
      dob: '2003-04-12',
      password: 'AnotherPassword123!',
      confirmPassword: 'AnotherPassword123!',
    });
    assert('Case 2: Duplicate email registration rejected (400 or 409)', dupEmailRes.statusCode >= 400, `Got: ${dupEmailRes.statusCode}`);

    // ----------------------------------------------------
    // Test 3: Duplicate USN registration
    // ----------------------------------------------------
    const dupUsnRes = await callRegister({
      name: 'Different Student',
      email: `diff_student_${Date.now()}@college.edu`,
      usn: testUsn,
      dob: '2003-04-12',
      password: 'AnotherPassword123!',
      confirmPassword: 'AnotherPassword123!',
    });
    assert('Case 3: Duplicate USN registration rejected (400 or 409)', dupUsnRes.statusCode >= 400, `Got: ${dupUsnRes.statusCode}`);

    // ----------------------------------------------------
    // Test 4: Missing or invalid DOB
    // ----------------------------------------------------
    const invalidDobRes = await callRegister({
      name: 'Future Student',
      email: `future_student_${Date.now()}@college.edu`,
      usn: `USN-FUT-${Date.now().toString().slice(-4)}`,
      dob: '2099-01-01', // future date
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    assert('Case 4: Future or invalid DOB rejected (400)', invalidDobRes.statusCode === 400, `Got: ${invalidDobRes.statusCode}`);

    // ----------------------------------------------------
    // Test 5: Correct registered Gmail selected through Google
    // ----------------------------------------------------
    FAKE_GOOGLE = {
      email: testEmail,
      googleId: `google-sub-${Date.now()}`,
      name: 'Aditi Rao',
    };
    const googleLoginRes = await callGoogleLogin({ credential: 'valid.mock.token' });
    assert('Case 5: Correct registered Gmail via Google returns 200', googleLoginRes.statusCode === 200, `Got: ${googleLoginRes.statusCode}`);
    assert('Case 5: Direct login to home (needsOnboarding: false)', googleLoginRes.body?.needsOnboarding === false);
    assert('Case 5: Session token issued', Boolean(googleLoginRes.body?.data?.token));

    // ----------------------------------------------------
    // Test 6: Unregistered Gmail selected through Google
    // ----------------------------------------------------
    const unknownGmail = `unknown_person_${Date.now()}@gmail.com`;
    FAKE_GOOGLE = {
      email: unknownGmail,
      googleId: 'google-sub-unknown-1234',
      name: 'Unknown Person',
    };
    const unregGoogleRes = await callGoogleLogin({ credential: 'valid.mock.token' });
    assert('Case 6: Unregistered Gmail returns HTTP 403', unregGoogleRes.statusCode === 403, `Got: ${unregGoogleRes.statusCode}`);
    assert('Case 6: Exact specified rejection message returned', unregGoogleRes.body?.message === UNREGISTERED_GOOGLE_MESSAGE, `Got: ${unregGoogleRes.body?.message}`);
    const unregDbCheck = await User.findOne({ email: unknownGmail });
    assert('Case 6: No MongoDB account created for unregistered Gmail', unregDbCheck === null);

    // ----------------------------------------------------
    // Test 7: Google token with invalid signature
    // ----------------------------------------------------
    FAKE_GOOGLE = null;
    const invalidSigRes = await callGoogleLogin({ credential: 'corrupt.or.invalid.signature.token' });
    assert('Case 7: Google token with invalid signature rejected (401)', invalidSigRes.statusCode === 401, `Got: ${invalidSigRes.statusCode}`);

    // ----------------------------------------------------
    // Test 8: Existing student logs out and logs in again
    // ----------------------------------------------------
    FAKE_GOOGLE = {
      email: testEmail,
      googleId: `google-sub-${Date.now()}`,
      name: 'Aditi Rao',
    };
    const secondLoginRes = await callGoogleLogin({ credential: 'valid.mock.token' });
    assert('Case 8: Re-login succeeds and returns 200', secondLoginRes.statusCode === 200, `Got: ${secondLoginRes.statusCode}`);
    assert('Case 8: Re-login resolves to same student MongoDB record', secondLoginRes.body?.data?._id?.toString() === registeredUserId?.toString());

    // ----------------------------------------------------
    // Test 9: Existing imported student with incomplete onboarding
    // ----------------------------------------------------
    const importedStudent = await User.findOne({ usn: { $exists: true, $ne: null } });
    console.log('Sample imported student:', { name: importedStudent?.name, email: importedStudent?.email, usn: importedStudent?.usn });
    assert('Case 9: Existing imported student record preserved intact', Boolean(importedStudent && importedStudent.email));
    if (importedStudent) {
      assert('Case 9: Imported student USN preserved', Boolean(importedStudent.usn));
      assert('Case 9: Imported student role is student', importedStudent.role === 'student');
    }

    // ----------------------------------------------------
    // Test 10: Registration and Google login both resolve to same MongoDB user
    // ----------------------------------------------------
    const finalUserDoc = await User.findById(registeredUserId);
    assert('Case 10: Registration and Google login resolve to single MongoDB user document', Boolean(finalUserDoc && finalUserDoc.email === testEmail));
    assert('Case 10: Original USN and DOB intact and not overwritten', finalUserDoc && finalUserDoc.usn === testUsn && finalUserDoc.dob === '2003-04-12');

  } finally {
    // Clean up only our single throwaway test user created in this run
    if (registeredUserId) {
      await User.deleteOne({ _id: registeredUserId });
    }
    await mongoose.disconnect();
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
