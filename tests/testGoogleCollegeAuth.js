/**
 * BookNexus — College-verified Google authentication suite.
 *
 * Covers the eight scenarios required of the Google-only student login:
 *   1. approved college Gmail, first-time registration
 *   2. approved college Gmail, returning student
 *   3. unregistered personal Gmail, access denied
 *   4. wrong / mismatched Google account, access denied
 *   5. duplicate USN, rejected
 *   6. existing student profile, preserved
 *   7. logout and Google sign-in again
 *   8. librarian and admin access still works
 *
 * The Google ID token itself cannot be minted outside Google, so the one thing
 * this suite fakes is the *verification result*: `verifyGoogleIdToken` is
 * stubbed to return a payload for a chosen email, exactly as Google's library
 * would after checking signature, audience, issuer and email_verified. Every
 * other layer is the real thing: the real controllers, the real roster
 * collection and the real MongoDB. The token verification itself and the
 * browser flow are checked separately against the running site.
 *
 * It creates its own throwaway roster rows and users (all prefixed gauth-test)
 * and deletes only those at the end. No existing record is touched.
 *
 * Run:  node tests/testGoogleCollegeAuth.js
 */

const path = require('path');
const backendNodeModules = path.resolve(__dirname, '../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) module.paths.push(backendNodeModules);
require('../backend/config/linuxCaseResolver');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../backend/models/user');
const CollegeStudent = require('../backend/models/collegeStudent');

// Stub Google's verification result before the controller is loaded.
const googleAuthController = require('../backend/controllers/googleAuthController');
const onboardingController = require('../backend/controllers/onboardingController');
const authController = require('../backend/controllers/authController');

let FAKE_GOOGLE = null;
const realVerify = googleAuthController.verifyGoogleIdToken;

function stubGoogle(email, googleId, name) {
  FAKE_GOOGLE = { email: String(email).trim().toLowerCase(), googleId, name };
}

// Patch the module's internal verifier by re-wiring the exported controller:
// googleLogin calls verifyGoogleIdToken from its own closure, so the cleanest
// seam is the library client itself.
const { OAuth2Client } = require('google-auth-library');
OAuth2Client.prototype.verifyIdToken = async function () {
  if (!FAKE_GOOGLE) throw new Error('No stubbed Google payload');
  const payload = {
    iss: 'https://accounts.google.com',
    aud: process.env.GOOGLE_CLIENT_ID,
    sub: FAKE_GOOGLE.googleId,
    email: FAKE_GOOGLE.email,
    email_verified: true,
    name: FAKE_GOOGLE.name,
  };
  return { getPayload: () => payload };
};

// ---------------------------------------------------------------- helpers
let passed = 0;
let failed = 0;
const failures = [];

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

async function call(handler, req) {
  const res = mockRes();
  try {
    await handler(req, res);
  } catch (err) {
    if (res.statusCode === 200) res.statusCode = 500;
    res.body = { success: false, message: err.message };
    res.threw = true;
  }
  return res;
}

function check(label, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    failures.push(label + (detail ? ` — ${detail}` : ''));
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
  }
}

const googleReq = () => ({ body: { credential: 'stubbed.id.token' }, headers: {}, ip: '127.0.0.1' });
const tokenReq = (token, body) => ({ body, headers: { authorization: `Bearer ${token}` }, ip: '127.0.0.1' });

const fullQuiz = { 0: ['a'], 1: ['a'], 2: ['e'], 3: ['f'], 4: ['a'], 5: ['d'] };

// Throwaway fixtures, all clearly namespaced.
const APPROVED = {
  email: 'gauth-test.approved@gmail.com',
  name: 'Gauth Test Approved',
  usn: 'GAUTHTEST001',
  googleId: 'gauth-test-google-approved',
  dob: '2004-05-17',
};
const SECOND = {
  email: 'gauth-test.second@gmail.com',
  name: 'Gauth Test Second',
  usn: 'GAUTHTEST002',
  googleId: 'gauth-test-google-second',
  dob: '2003-11-02',
};
const OUTSIDER = {
  email: 'gauth-test.outsider@gmail.com',
  name: 'Random Personal Account',
  googleId: 'gauth-test-google-outsider',
};
const STAFF = {
  email: 'gauth-test.librarian@college.edu',
  name: 'Gauth Test Librarian',
  librarianId: 'GAUTHTEST-LIB',
  password: 'StaffPass#2026',
};

async function cleanup() {
  await CollegeStudent.deleteMany({ email: /^gauth-test/i });
  await User.deleteMany({ email: /^gauth-test/i });
}

// ---------------------------------------------------------------- the suite
async function run() {
  const uri = process.env.ATLAS_MONGO_URI || process.env.MONGO_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`\nConnected to MongoDB: ${mongoose.connection.name}`);

  const usersBefore = await User.countDocuments({});
  const rosterBefore = await CollegeStudent.countDocuments({});
  console.log(`Baseline: ${usersBefore} users, ${rosterBefore} roster rows\n`);

  await cleanup();

  // Roster rows for the two approved test students, and a staff account.
  await CollegeStudent.create([
    { email: APPROVED.email, name: APPROVED.name, usn: APPROVED.usn, branch: 'TEST BRANCH', college: 'Test College', semester: 'Sixth', active: true, source: 'test-suite' },
    { email: SECOND.email, name: SECOND.name, usn: SECOND.usn, branch: 'TEST BRANCH', college: 'Test College', semester: 'Sixth', active: true, source: 'test-suite' },
  ]);
  await User.create({ name: STAFF.name, email: STAFF.email, password: STAFF.password, role: 'librarian', librarianId: STAFF.librarianId, registrationCompleted: true, quizCompleted: true });

  // ---- 3. Unregistered personal Gmail -> denied -------------------------
  console.log('3. Unregistered personal Gmail is denied');
  stubGoogle(OUTSIDER.email, OUTSIDER.googleId, OUTSIDER.name);
  let res = await call(googleAuthController.googleLogin, googleReq());
  check('refused with 403', res.statusCode === 403, `got ${res.statusCode}`);
  check('shows the college-records message', /not registered in college records/i.test(res.body.message || ''), res.body.message);
  check('no user account was created', (await User.countDocuments({ email: OUTSIDER.email })) === 0);
  check('no token was issued', !(res.body.data && res.body.data.token));
  check('no onboarding token was issued', !(res.body.data && res.body.data.onboardingToken));

  // ---- 1. Approved college Gmail, first-time registration ---------------
  console.log('\n1. Approved college Gmail, first-time registration');
  stubGoogle(APPROVED.email, APPROVED.googleId, 'Google Display Name');
  res = await call(googleAuthController.googleLogin, googleReq());
  check('accepted', res.statusCode === 200 && res.body.success === true, res.body.message);
  check('asks for onboarding', res.body.needsOnboarding === true);
  check('issues a registration token, not a login token', !!res.body.data.onboardingToken && !res.body.data.token);
  check('returns the student own college record', res.body.data.collegeRecord && res.body.data.collegeRecord.usn === APPROVED.usn);
  check('still no user document yet', (await User.countDocuments({ email: APPROVED.email })) === 0);

  const onboardingToken = res.body.data.onboardingToken;
  const decoded = jwt.verify(onboardingToken, process.env.JWT_SECRET);
  check('registration token is purpose-scoped', decoded.purpose === 'onboarding');
  check('registration token carries the verified email', decoded.email === APPROVED.email);

  // A registration token must not open protected routes. express-async-handler
  // reports a thrown error through next(err), so watch next's argument rather
  // than the response body.
  const { protect } = require('../backend/middleware/authMiddleware');
  const protectReq = tokenReq(onboardingToken, {});
  const protectRes = mockRes();
  let nextErr = null;
  let reachedRoute = false;
  await protect(protectReq, protectRes, (err) => {
    if (err) nextErr = err;
    else reachedRoute = true;
  });
  check('registration token cannot authorise a protected route', !reachedRoute && !!nextErr && protectRes.statusCode === 401, `reached=${reachedRoute} status=${protectRes.statusCode} err=${nextErr && nextErr.message}`);
  check('registration token does not attach a user', !protectReq.user);

  // Step 1: wrong name is rejected
  res = await call(onboardingController.verifyStudentIdentity, tokenReq(onboardingToken, { name: 'Somebody Else', usn: APPROVED.usn, dob: APPROVED.dob }));
  check('step 1 rejects a name that is not on the college record', res.body.success === false && res.body.field === 'name', JSON.stringify(res.body));

  // Step 1: wrong USN is rejected
  res = await call(onboardingController.verifyStudentIdentity, tokenReq(onboardingToken, { name: APPROVED.name, usn: 'NOTMYUSN999', dob: APPROVED.dob }));
  check('step 1 rejects a USN that is not on the college record', res.body.success === false && res.body.field === 'usn', JSON.stringify(res.body));

  // Step 1: good details
  res = await call(onboardingController.verifyStudentIdentity, tokenReq(onboardingToken, { name: APPROVED.name.toLowerCase(), usn: ' ' + APPROVED.usn.toLowerCase() + ' ', dob: APPROVED.dob }));
  check('step 1 accepts the real details (case and spacing normalised)', res.body.success === true, JSON.stringify(res.body));

  // Step 2: an unfinished quiz is rejected
  res = await call(onboardingController.completeStudentOnboarding, tokenReq(onboardingToken, {
    name: APPROVED.name, usn: APPROVED.usn, dob: APPROVED.dob,
    preferredName: 'Appy', bio: 'I like systems books.', quizAnswers: { 0: ['a'] },
  }));
  check('step 2 rejects an unfinished quiz', res.body.success === false && res.body.field === 'quizAnswers', JSON.stringify(res.body));

  // Step 2: complete
  res = await call(onboardingController.completeStudentOnboarding, tokenReq(onboardingToken, {
    name: APPROVED.name, usn: APPROVED.usn, dob: APPROVED.dob,
    preferredName: 'Appy', bio: 'I like systems books.', quizAnswers: fullQuiz,
  }));
  check('registration completes', res.body.success === true, JSON.stringify(res.body));
  check('a login token is issued now', !!(res.body.data && res.body.data.token));
  check('USN is stored normalised', res.body.data.usn === APPROVED.usn);
  check('DOB is stored', res.body.data.dob === APPROVED.dob);
  check('genres were computed from the quiz', Array.isArray(res.body.data.preferences.genres) && res.body.data.preferences.genres.length > 0);

  const created = await User.findOne({ email: APPROVED.email });
  check('exactly one account exists for the approved email', (await User.countDocuments({ email: APPROVED.email })) === 1);
  check('the account is linked to the Google subject id', created.googleId === APPROVED.googleId);
  check('branch and college came from the college record', created.branch === 'TEST BRANCH' && created.college === 'Test College');
  check('onboarding is marked complete', created.registrationCompleted === true && created.quizCompleted === true && created.onboardingStep === 'completed');

  // ---- 2 + 6. Returning student, profile preserved ----------------------
  console.log('\n2 + 6. Returning student signs straight in, profile preserved');
  stubGoogle(APPROVED.email, APPROVED.googleId, 'Google Display Name Changed');
  res = await call(googleAuthController.googleLogin, googleReq());
  check('signs in directly', res.statusCode === 200 && res.body.success === true, res.body.message);
  check('is not asked to register again', res.body.needsOnboarding === false);
  check('a login token is returned', !!res.body.data.token);
  check('preferred name is restored', res.body.data.preferredName === 'Appy');
  check('bio is restored', res.body.data.bio === 'I like systems books.');
  check('USN is unchanged', res.body.data.usn === APPROVED.usn);
  check('DOB is unchanged', res.body.data.dob === APPROVED.dob);

  const after = await User.findOne({ email: APPROVED.email });
  check('saved name was not overwritten by the Google display name', after.name === created.name, `${after.name} vs ${created.name}`);
  check('quiz answers were not overwritten', JSON.stringify(after.quizAnswers) === JSON.stringify(created.quizAnswers));

  // ---- 7. Logout and sign in again --------------------------------------
  console.log('\n7. Logout then Google sign-in again');
  const logoutRes = await call(authController.logoutUser, { body: {}, headers: {} });
  check('logout responds', logoutRes.statusCode === 200 && logoutRes.body.success === true);
  res = await call(googleAuthController.googleLogin, googleReq());
  check('the same Google account signs back in', res.body.success === true && res.body.needsOnboarding === false);
  check('and lands on a complete profile', res.body.data.preferredName === 'Appy' && res.body.data.usn === APPROVED.usn);

  // ---- 4. Wrong Google account for a registered college email -----------
  console.log('\n4. A different Google account cannot take over a registered college email');
  stubGoogle(APPROVED.email, 'gauth-test-google-impostor', 'Impostor');
  res = await call(googleAuthController.googleLogin, googleReq());
  check('refused with 403', res.statusCode === 403, `got ${res.statusCode}`);
  check('explains the account is linked elsewhere', /already linked to a different Google account/i.test(res.body.message || ''), res.body.message);
  check('the original Google link is untouched', (await User.findOne({ email: APPROVED.email })).googleId === APPROVED.googleId);

  console.log('\n4b. A registered Google account cannot be reused for another college email');
  stubGoogle(SECOND.email, APPROVED.googleId, 'Second Student');
  res = await call(googleAuthController.googleLogin, googleReq());
  check('refused with 403', res.statusCode === 403, `got ${res.statusCode}`);
  check('no account was created for the second email', (await User.countDocuments({ email: SECOND.email })) === 0);

  // ---- 5. Duplicate USN rejected ----------------------------------------
  console.log('\n5. Duplicate USN is rejected');
  stubGoogle(SECOND.email, SECOND.googleId, 'Second Student');
  res = await call(googleAuthController.googleLogin, googleReq());
  check('the second approved student is let in to register', res.body.needsOnboarding === true, JSON.stringify(res.body));
  const secondToken = res.body.data.onboardingToken;

  // Claiming the first student's USN must fail even with a correct-looking DOB.
  res = await call(onboardingController.verifyStudentIdentity, tokenReq(secondToken, { name: SECOND.name, usn: APPROVED.usn, dob: APPROVED.dob }));
  check('cannot claim another student USN', res.body.success === false && res.body.field === 'usn', JSON.stringify(res.body));
  check('the refusal does not leak the other student DOB', !String(res.body.message).includes(APPROVED.dob), res.body.message);
  check('the refusal does not leak the other student name', !String(res.body.message).includes(APPROVED.name), res.body.message);

  // And the correct USN still works.
  res = await call(onboardingController.completeStudentOnboarding, tokenReq(secondToken, {
    name: SECOND.name, usn: SECOND.usn, dob: SECOND.dob,
    preferredName: 'Seco', bio: 'Reading about bridges.', quizAnswers: fullQuiz,
  }));
  check('the second student registers with their own USN', res.body.success === true, JSON.stringify(res.body));
  check('both students exist with distinct USNs', (await User.countDocuments({ usn: { $in: [APPROVED.usn, SECOND.usn] } })) === 2);

  // A direct duplicate write must be refused by the database too.
  let dupBlocked = false;
  try {
    await User.create({ name: 'Dup Writer', email: 'gauth-test.dup@gmail.com', password: 'Whatever#123', role: 'student', usn: APPROVED.usn });
  } catch (err) {
    dupBlocked = err.code === 11000;
  }
  check('the database unique index blocks a duplicate USN', dupBlocked);

  // ---- Password / self-registration paths are closed for students -------
  console.log('\nStudent password sign-in and self-registration are closed');
  res = await call(authController.loginUser, { body: { identifier: APPROVED.usn, password: APPROVED.usn }, headers: {}, ip: '127.0.0.1' });
  check('student password sign-in is refused', res.statusCode === 403 || res.statusCode === 401, `got ${res.statusCode}`);
  res = await call(authController.registerUser, { body: { name: 'X', email: 'gauth-test.selfreg@gmail.com', password: 'Abcdef#123', confirmPassword: 'Abcdef#123' }, headers: {} });
  check('self-registration is refused', res.statusCode === 403, `got ${res.statusCode}`);
  check('no self-registered account was created', (await User.countDocuments({ email: 'gauth-test.selfreg@gmail.com' })) === 0);
  res = await call(authController.verifyRoleEligibility, { body: { email: APPROVED.email, role: 'student' }, headers: {} });
  check('student role-eligibility probing is refused', res.statusCode === 403, `got ${res.statusCode}`);

  // ---- 8. Librarian and admin access still works ------------------------
  console.log('\n8. Librarian and admin authentication still works');
  res = await call(authController.roleLogin, { body: { email: STAFF.email, identifier: STAFF.librarianId, password: STAFF.password, role: 'librarian' }, headers: {}, ip: '127.0.0.1' });
  check('librarian role-login succeeds', res.body.success === true && res.body.data.role === 'librarian', JSON.stringify(res.body));
  check('librarian gets a token', !!res.body.data.token);

  res = await call(authController.roleLogin, { body: { email: STAFF.email, identifier: STAFF.librarianId, password: 'WrongPassword#1', role: 'librarian' }, headers: {}, ip: '127.0.0.1' });
  check('a wrong librarian password is refused', res.statusCode === 401, `got ${res.statusCode}`);

  res = await call(authController.verifyRoleEligibility, { body: { email: STAFF.email, role: 'librarian' }, headers: {} });
  check('librarian role eligibility still answers', res.body.eligible === true, JSON.stringify(res.body));

  // Staff may also use Google on their authorised account, without the roster.
  stubGoogle(STAFF.email, 'gauth-test-google-librarian', STAFF.name);
  res = await call(googleAuthController.googleLogin, googleReq());
  check('an authorised librarian can also sign in with Google', res.body.success === true && res.body.data.role === 'librarian', JSON.stringify(res.body));
  check('and is not pushed through student onboarding', res.body.needsOnboarding === false);

  const realAdmin = await User.findOne({ role: 'admin' });
  check('existing admin accounts are intact', !!realAdmin && realAdmin.role === 'admin');

  // ---- Roster integrity -------------------------------------------------
  console.log('\nRoster and existing data integrity');
  const activeRoster = await CollegeStudent.countDocuments({ active: true });
  check('the approved roster holds the real college records plus 2 test rows', activeRoster === rosterBefore + 2, `${activeRoster} vs ${rosterBefore} + 2`);
  const rosterSample = await CollegeStudent.findOne({ usn: '4MC23CB001' });
  check('a real roster row is present and normalised', !!rosterSample && rosterSample.email === rosterSample.email.toLowerCase());

  // A roster row is NOT enough on its own: an email only in `users` and not in
  // the roster is still refused (the old test rows must not be able to log in).
  const legacyTestUser = await User.findOne({ email: 'test@example.com' });
  if (legacyTestUser) {
    stubGoogle('test@example.com', 'gauth-test-google-legacy', 'Legacy Test User');
    res = await call(googleAuthController.googleLogin, googleReq());
    check('a legacy user row that is not on the roster is still refused', res.statusCode === 403, `got ${res.statusCode}`);
  }

  await cleanup();
  const usersAfter = await User.countDocuments({});
  const rosterAfter = await CollegeStudent.countDocuments({});
  check('no pre-existing user was added or removed', usersAfter === usersBefore, `${usersAfter} vs ${usersBefore}`);
  check('no pre-existing roster row was added or removed', rosterAfter === rosterBefore, `${rosterAfter} vs ${rosterBefore}`);

  OAuth2Client.prototype.verifyIdToken = realVerify;
  await mongoose.disconnect();

  console.log(`\n================ ${passed} passed, ${failed} failed ================`);
  if (failed) {
    console.log('Failures:');
    failures.forEach(f => console.log('  - ' + f));
    process.exitCode = 1;
  }
}

run().catch(async (err) => {
  console.error('\nSuite crashed:', err);
  try { await cleanup(); } catch (e) {}
  try { await mongoose.disconnect(); } catch (e) {}
  process.exit(1);
});
