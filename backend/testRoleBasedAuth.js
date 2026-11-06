const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/user');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('   BOOKNEXUS ROLE-BASED AUTH & SECURITY TEST SUITE   ');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookhive');
  console.log('Connected to MongoDB');

  const totalUsers = await User.countDocuments();
  console.log(`Initial total user count: ${totalUsers}`);
  if (totalUsers !== 81) {
    console.error(`❌ Expected 81 users, found ${totalUsers}`);
  } else {
    console.log(`✅ User count preserved: exactly 81 accounts in database.`);
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Student USN Login
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '4MC23CB001', password: '4MC23CB001' })
    });
    const json = await res.json();
    assert(res.status === 200 && json.success && json.data.token, 'Student USN login returns 200 and token');
    assert(json.data.role === 'student' || json.data.role === 'user', 'Student has student role');
  } catch (e) {
    assert(false, `Student USN login failed: ${e.message}`);
  }

  // Test 2: Student email attempting Admin role eligibility check
  try {
    const res = await fetch(`${API_BASE}/auth/verify-role-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'shreya@example.com', role: 'admin' })
    });
    const json = await res.json();
    assert(res.status === 403 && json.eligible === false, 'Student email denied for Admin role eligibility (403)');
    assert(json.message === "You are not authorised to access this role. Please sign in using your registered account.", 'Student email receives exact authorization denial message');
  } catch (e) {
    assert(false, `Student verify-role admin check failed: ${e.message}`);
  }

  // Test 3: Student email attempting Librarian role eligibility check
  try {
    const res = await fetch(`${API_BASE}/auth/verify-role-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'shreya@example.com', role: 'librarian' })
    });
    const json = await res.json();
    assert(res.status === 403 && json.eligible === false, 'Student email denied for Librarian role eligibility (403)');
    assert(json.message === "You are not authorised to access this role. Please sign in using your registered account.", 'Student email receives exact authorization denial message for librarian');
  } catch (e) {
    assert(false, `Student verify-role librarian check failed: ${e.message}`);
  }

  // Test 4: Unregistered email attempting Admin role eligibility
  try {
    const res = await fetch(`${API_BASE}/auth/verify-role-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fake.admin@gmail.com', role: 'admin' })
    });
    const json = await res.json();
    assert(res.status === 403 && json.eligible === false, 'Unregistered email denied for Admin role eligibility (403)');
  } catch (e) {
    assert(false, `Unregistered verify-role admin failed: ${e.message}`);
  }

  // Test 5: Registered Admin email checks Admin role eligibility
  try {
    const res = await fetch(`${API_BASE}/auth/verify-role-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@booknexus.com', role: 'admin' })
    });
    const json = await res.json();
    assert(res.status === 200 && json.eligible === true && json.role === 'admin', 'Registered Admin email verified as eligible (200)');
  } catch (e) {
    assert(false, `Admin verify-role failed: ${e.message}`);
  }

  // Test 6: Admin Role Login with correct Admin ID + password
  let adminToken = '';
  try {
    const res = await fetch(`${API_BASE}/auth/role-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@booknexus.com',
        identifier: 'ADMIN001',
        password: 'Admin@123',
        role: 'admin'
      })
    });
    const json = await res.json();
    adminToken = json.data?.token || '';
    assert(res.status === 200 && json.success && adminToken, 'Admin role login succeeds with 200 and token');
    assert(json.data.role === 'admin', 'Admin user payload role is admin');
  } catch (e) {
    assert(false, `Admin role-login failed: ${e.message}`);
  }

  // Test 7: Admin Role Login with wrong password
  try {
    const res = await fetch(`${API_BASE}/auth/role-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@booknexus.com',
        identifier: 'ADMIN001',
        password: 'WrongPassword!',
        role: 'admin'
      })
    });
    assert(res.status === 401, 'Admin role login with wrong password rejected (401)');
  } catch (e) {
    assert(false, `Admin wrong password test failed: ${e.message}`);
  }

  // Test 8: Registered Librarian email checks Librarian role eligibility
  try {
    const res = await fetch(`${API_BASE}/auth/verify-role-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'librarian.test.payment@univ.edu', role: 'librarian' })
    });
    const json = await res.json();
    assert(res.status === 200 && json.eligible === true && json.role === 'librarian', 'Registered Librarian email verified as eligible (200)');
  } catch (e) {
    assert(false, `Librarian verify-role failed: ${e.message}`);
  }

  // Test 9: Librarian Role Login with correct Librarian ID + password
  let librarianToken = '';
  try {
    const res = await fetch(`${API_BASE}/auth/role-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'librarian.test.payment@univ.edu',
        identifier: 'STAFF-LIB-01',
        password: 'Password123!',
        role: 'librarian'
      })
    });
    const json = await res.json();
    librarianToken = json.data?.token || '';
    assert(res.status === 200 && json.success && librarianToken, 'Librarian role login succeeds with 200 and token');
    assert(json.data.role === 'librarian', 'Librarian user payload role is librarian');
  } catch (e) {
    assert(false, `Librarian role-login failed: ${e.message}`);
  }

  // Test 10: Librarian Role Login with wrong password
  try {
    const res = await fetch(`${API_BASE}/auth/role-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'librarian.test.payment@univ.edu',
        identifier: 'STAFF-LIB-01',
        password: 'WrongPassword!',
        role: 'librarian'
      })
    });
    assert(res.status === 401, 'Librarian role login with wrong password rejected (401)');
  } catch (e) {
    assert(false, `Librarian wrong password test failed: ${e.message}`);
  }

  // Test 11: Attempt public registration with role: "admin"
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: 'hacker.admin@test.edu',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'admin',
        usn: '4MC23CS999'
      })
    });
    assert(res.status === 400 || res.status === 403, 'Public registration attempting role: "admin" rejected');
  } catch (e) {
    assert(false, `Admin public register test failed: ${e.message}`);
  }

  // Test 12: Attempt public registration with role: "librarian"
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Librarian',
        email: 'hacker.lib@test.edu',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'librarian',
        usn: '4MC23CS998'
      })
    });
    assert(res.status === 400 || res.status === 403, 'Public registration attempting role: "librarian" rejected');
  } catch (e) {
    assert(false, `Librarian public register test failed: ${e.message}`);
  }

  // Test 13: Student token accessing Admin overview endpoint (/api/analytics/overview)
  let studentToken = '';
  let studentUserId = '';
  try {
    const sRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '4MC23CB001', password: '4MC23CB001' })
    });
    const sJson = await sRes.json();
    studentToken = sJson.data.token;
    studentUserId = sJson.data._id;

    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(res.status === 403, 'Student token attempting /api/analytics/overview rejected with 403 Forbidden');
  } catch (e) {
    assert(false, `Student route access test failed: ${e.message}`);
  }

  // Test 14: Admin token accessing Admin overview endpoint (/api/analytics/overview)
  try {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const json = await res.json();
    assert(res.status === 200 && json.success, 'Admin token accessing /api/analytics/overview succeeds with 200');
  } catch (e) {
    assert(false, `Admin route access test failed: ${e.message}`);
  }

  // Test 15: Student token accessing user dashboard (/api/analytics/user-dashboard)
  try {
    const res = await fetch(`${API_BASE}/analytics/user-dashboard`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const json = await res.json();
    assert(res.status === 200 && json.success && json.data.userId === studentUserId, 'Student token accessing user dashboard succeeds with 200 and matches student ID');
  } catch (e) {
    assert(false, `Student user dashboard access test failed: ${e.message}`);
  }

  // Test 16: Verify final user count in database
  const finalUsers = await User.countDocuments();
  assert(finalUsers === 81, `Final database user count is exactly 81 (actual: ${finalUsers})`);

  console.log('====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
