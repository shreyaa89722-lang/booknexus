const path = require('path');
require(path.resolve(__dirname, '../backend/node_modules/dotenv')).config({ path: path.resolve(__dirname, '../backend/.env') });
const mongoose = require(path.resolve(__dirname, '../backend/node_modules/mongoose'));
const connectDB = require('../backend/config/db');
const User = require('../backend/models/user');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('BookNexus: Welcome Back USN Display Test Suite');
  console.log('====================================================\n');

  await connectDB();
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Create a test student account in MongoDB with a known USN
  const testEmailWithUsn = `usn_test_${Date.now()}@college.edu`;
  const knownUsn = '4MC22CS001';
  let studentWithUsn = null;

  // 2. Create another test student account in MongoDB WITHOUT a USN (missing USN case)
  const testEmailNoUsn = `no_usn_${Date.now()}@college.edu`;
  let studentNoUsn = null;

  try {
    studentWithUsn = await User.create({
      name: 'Welcome Back Student',
      email: testEmailWithUsn,
      usn: knownUsn,
      password: 'StrongPassword123!',
      role: 'student',
      branch: 'Computer Science',
      college: 'Malnad College of Engineering',
      dateOfBirth: new Date('2002-05-15'),
      registrationCompleted: true
    });

    studentNoUsn = await User.create({
      name: 'No Usn Student',
      email: testEmailNoUsn,
      password: 'StrongPassword123!',
      role: 'student',
      branch: 'Computer Science',
      college: 'Malnad College of Engineering',
      dateOfBirth: new Date('2002-05-15'),
      registrationCompleted: true
    });

    console.log(`Created test student with USN: ${testEmailWithUsn} (${knownUsn})`);
    console.log(`Created test student without USN: ${testEmailNoUsn}\n`);

    // TEST 1: Check existing student with USN
    const res1 = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(testEmailWithUsn)}`);
    const data1 = await res1.json();
    assert(res1.status === 200, 'check-email returns HTTP 200 for registered student');
    assert(data1.success === true, 'check-email response marks success: true');
    assert(data1.isRegistered === true, 'isRegistered is true for student in MongoDB');
    assert(data1.data.email === testEmailWithUsn, 'Returns exact student email');
    assert(data1.data.usn === knownUsn, `Fetches student's USN '${knownUsn}' directly from MongoDB User record`);

    // TEST 2: Check student with missing USN
    const res2 = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(testEmailNoUsn)}`);
    const data2 = await res2.json();
    assert(res2.status === 200, 'check-email returns HTTP 200 for student without USN');
    assert(data2.isRegistered === true, 'isRegistered is true');
    assert(!data2.data.usn || data2.data.usn === '', 'USN is empty string when missing from MongoDB user record');

    // TEST 3: Check unregistered email never leaks another student's USN
    const randomEmail = `unregistered_${Date.now()}@gmail.com`;
    const res3 = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(randomEmail)}`);
    const data3 = await res3.json();
    assert(res3.status === 200, 'check-email returns HTTP 200 for unregistered email');
    assert(data3.isRegistered === false, 'isRegistered is false for unregistered email');
    assert(!data3.data || !data3.data.usn || data3.onRoster === false, 'Never leaks another student USN to an unregistered email');

    // TEST 4: Existing user record is NOT modified or duplicated
    const userCount = await User.countDocuments({ email: testEmailWithUsn });
    assert(userCount === 1, 'Exactly one user document exists in MongoDB (no duplicates)');
    const fetchedDoc = await User.findOne({ email: testEmailWithUsn });
    assert(fetchedDoc.usn === knownUsn, 'Original USN in MongoDB document is intact and unmodified');

    // TEST 5: Normal password login works with the account
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmailWithUsn,
        password: 'StrongPassword123!',
        role: 'student',
        usn: knownUsn
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Password login succeeds for student with USN');
    assert(loginData.data.token, 'Login issues authenticated JWT token');
    assert(loginData.data.usn === knownUsn, 'Login response confirms USN');

  } catch (err) {
    console.error('Test execution error:', err.message);
    failed++;
  } finally {
    if (studentWithUsn) {
      await User.deleteOne({ _id: studentWithUsn._id });
    }
    if (studentNoUsn) {
      await User.deleteOne({ _id: studentNoUsn._id });
    }
    await mongoose.disconnect();
    console.log(`\n====================================================`);
    console.log(`Results: ${passed} passed, ${failed} failed.`);
    console.log(`====================================================`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

module.exports = { runTests };

