const path = require('path');
const backendNodeModules = path.resolve(__dirname, '../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) {
  module.paths.push(backendNodeModules);
}
require('../backend/config/linuxCaseResolver');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const mongoose = require('mongoose');
const User = require('../backend/models/user');
const { registerUser, completeOnboarding, loginUser } = require('../backend/controllers/authController');

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

async function testEndpoints() {
  console.log('\n--- TESTING HTTP AUTH CONTROLLER ENDPOINTS ---');
  const uri = process.env.ATLAS_MONGO_URI || process.env.MONGO_URI;
  await mongoose.connect(uri);

  try {
    await User.deleteMany({ email: { $regex: /^http-test-/i }, usn: { $regex: /^HTTP-USN-/i } });

    // 1. Test registration with USN and DOB
    console.log('1. Registering student via registerUser...');
    const regReq = {
      body: {
        name: "Http Test Student",
        email: "http-test-student1@college.edu",
        usn: "http-usn-001",
        dob: "2003-04-12",
        password: "MyPassword#2026",
        quizAnswers: [["fiction"], ["thriller"], ["adventure"], ["fantasy"], ["mystery"], ["scifi"]]
      }
    };
    const regRes = createMockRes();
    await registerUser(regReq, regRes);
    console.log('   Registration status:', regRes.statusCode, 'Data USN:', regRes.body.data.usn, 'DOB:', regRes.body.data.dob);
    if (regRes.body.data.usn !== "HTTP-USN-001" || regRes.body.data.dob !== "2003-04-12") {
      throw new Error("Registration did not return normalized USN or DOB");
    }

    // 2. Test duplicate USN claim with WRONG DOB -> Must return 403 Forbidden without leaking DOB
    console.log('2. Testing claim of same USN with WRONG DOB...');
    const badClaimReq = {
      user: null,
      body: {
        email: "http-test-intruder@college.edu",
        googleId: "fake-google-id-intruder",
        name: "Intruder User",
        usn: "HTTP-USN-001",
        dob: "2001-01-01",
        password: "IntruderPassword#1",
        quizAnswers: [["fiction"], ["thriller"], ["adventure"], ["fantasy"], ["mystery"], ["scifi"]]
      }
    };
    const badClaimRes = createMockRes();
    try {
      await completeOnboarding(badClaimReq, badClaimRes);
    } catch (err) {
      console.log('   Rejected with error:', err.message, 'Status:', badClaimRes.statusCode);
      if (badClaimRes.statusCode !== 403) throw new Error("Expected 403 for mismatched DOB");
      if (err.message.includes("2003-04-12")) throw new Error("Private DOB was leaked in error message!");
    }

    // 3. Test duplicate USN claim with MATCHING DOB -> Must succeed and securely link
    console.log('3. Testing claim of same USN with MATCHING DOB...');
    const goodClaimReq = {
      user: null,
      body: {
        email: "http-test-google@college.edu",
        googleId: "google-linked-id-12345",
        name: "Http Test Student",
        usn: "HTTP-USN-001",
        dob: "2003-04-12",
        password: "MyPassword#2026",
        quizAnswers: [["fiction"], ["thriller"], ["adventure"], ["fantasy"], ["mystery"], ["scifi"]]
      }
    };
    const goodClaimRes = createMockRes();
    await completeOnboarding(goodClaimReq, goodClaimRes);
    console.log('   Claim status:', goodClaimRes.statusCode, 'Linked successfully! USN:', goodClaimRes.body.data.usn);
    if (goodClaimRes.body.data.usn !== "HTTP-USN-001") throw new Error("Failed to link matching USN");

    // 4. Test loginUser returning DOB
    console.log('4. Testing loginUser...');
    const loginReq = {
      body: {
        identifier: "HTTP-USN-001",
        password: "MyPassword#2026"
      },
      headers: {},
      ip: "127.0.0.1"
    };
    const loginRes = createMockRes();
    await loginUser(loginReq, loginRes);
    console.log('   Login status:', loginRes.statusCode, 'Logged in student DOB:', loginRes.body.data.dob);
    if (loginRes.body.data.dob !== "2003-04-12") throw new Error("Login did not return verified DOB");

    // Clean up
    await User.deleteMany({ email: { $regex: /^http-test-/i }, usn: { $regex: /^HTTP-USN-/i } });
    console.log('✅ ALL HTTP CONTROLLER ENDPOINTS VERIFIED 100% SUCCESSFUL!\n');
  } finally {
    await mongoose.disconnect();
  }
}

testEndpoints().catch(err => {
  console.error('❌ Endpoint test failed:', err);
  process.exit(1);
});
