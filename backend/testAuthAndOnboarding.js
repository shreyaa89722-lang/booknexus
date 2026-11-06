/**
 * In-Process Automated Verification Suite for BookNexus Authentication & Student Onboarding
 * Tests Phases 2 through 8 directly against MongoDB
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const jwt = require("jsonwebtoken");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/user");
const { loginUser, registerUser, completeOnboarding } = require("./controllers/authController");
const { protect } = require("./middleware/authMiddleware");
const quizService = require("./services/quizService");

// Mock Express response helper
const createMockRes = () => {
  return {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
};

// Safe executor that simulates Express asyncHandler + errorHandler
const safeExec = async (controllerFn, req, res) => {
  return new Promise((resolve) => {
    const next = (err) => {
      if (err) {
        if (res.statusCode === 200) res.statusCode = 500;
        res.jsonData = {
          success: false,
          message: err.message || "Error",
          code: err.code || (res.statusCode === 403 ? "INCOMPLETE_ONBOARDING" : undefined)
        };
      } else {
        req.__nextCalled = true;
      }
      resolve();
    };

    try {
      const result = controllerFn(req, res, next);
      if (result && typeof result.then === "function") {
        result.then(() => resolve()).catch(next);
      } else {
        resolve();
      }
    } catch (syncErr) {
      next(syncErr);
    }
  });
};

async function runTests() {
  console.log("====================================================");
  console.log("🧪 BOOKNEXUS AUTHENTICATION & ONBOARDING TEST SUITE");
  console.log("====================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extraInfo) {
    if (condition) {
      console.log(`✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${title}`, extraInfo || "");
      failed++;
    }
  }

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookhive";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for auth verification.\n");

    // 1. Existing student login with valid USN and password
    console.log("--- Phase 2: Existing Student USN Login ---");
    const req1 = {
      body: { identifier: "4MC23CB001", password: "4MC23CB001" },
      headers: { "user-agent": "Automated Test Suite" },
      ip: "127.0.0.1"
    };
    const res1 = createMockRes();
    await safeExec(loginUser, req1, res1);

    assert(
      "Existing student logs in with valid USN and password (200 OK)",
      res1.statusCode === 200 && res1.jsonData?.success === true && !!res1.jsonData?.data?.token,
      res1.jsonData
    );

    assert(
      "Existing student response has registrationCompleted = true & quizCompleted = true",
      res1.jsonData?.data?.registrationCompleted === true && res1.jsonData?.data?.quizCompleted === true,
      res1.jsonData?.data
    );

    // 2. Existing student login with invalid password
    const req2 = {
      body: { identifier: "4MC23CB001", password: "wrongpassword" },
      headers: { "user-agent": "Automated Test Suite" },
      ip: "127.0.0.1"
    };
    const res2 = createMockRes();
    await safeExec(loginUser, req2, res2);

    assert(
      "Existing student login rejected with wrong password (401)",
      res2.statusCode === 401 && res2.jsonData?.success === false,
      res2.jsonData
    );

    // 3. Unknown USN login
    const req3 = {
      body: { identifier: "9ZZ99ZZ999", password: "student123" },
      headers: { "user-agent": "Automated Test Suite" },
      ip: "127.0.0.1"
    };
    const res3 = createMockRes();
    await safeExec(loginUser, req3, res3);

    assert(
      "Non-existent student USN rejected (401)",
      res3.statusCode === 401 && res3.jsonData?.success === false,
      res3.jsonData
    );

    // 4. New student registration with valid details and complete quiz
    console.log("\n--- Phase 3 & 4: New Student Registration & Genre Quiz ---");
    const testUsn = "4MC23CB" + Math.floor(100 + Math.random() * 899);
    const testEmail = `student_${Date.now()}@college.edu`;
    const fullQuizAnswers = {
      "0": "c", // How things work -> Science, Engineering, Computer Science
      "1": "c", // Circuit boards -> Engineering, Science, Computer Science
      "2": "a", // Numbers & logic -> Mathematics, Computer Science
      "3": "e", // An inventor -> Engineering, Computer Science
      "4": "c", // Writing code -> Mathematics, Computer Science
      "5": "b", // Skills for career -> Computer Science, Engineering
    };

    const req4 = {
      body: {
        name: "Priya Sharma",
        usn: testUsn,
        email: testEmail,
        phone: "+91 9876543210",
        department: "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
        semester: "6",
        password: "Password123!",
        confirmPassword: "Password123!",
        quizAnswers: fullQuizAnswers,
      },
    };
    const res4 = createMockRes();
    await safeExec(registerUser, req4, res4);

    assert(
      "New student successfully registers with all fields & 6 quiz answers (201 Created)",
      res4.statusCode === 201 && res4.jsonData?.success === true && !!res4.jsonData?.data?.token,
      res4.jsonData
    );

    const newStudentUser = res4.jsonData?.data?.user || res4.jsonData?.data;

    assert(
      "New student has registrationCompleted = true & quizCompleted = true",
      newStudentUser?.registrationCompleted === true && newStudentUser?.quizCompleted === true
    );

    assert(
      "Personalized genre preferences computed from quiz (Cosine similarity ready)",
      Array.isArray(newStudentUser?.preferences?.genres) &&
        newStudentUser.preferences.genres.includes("Computer Science"),
      newStudentUser?.preferences?.genres
    );

    // 5. Duplicate USN rejection
    const req5 = {
      body: {
        name: "Another Student",
        usn: testUsn, // duplicate!
        email: `another_${Date.now()}@college.edu`,
        phone: "+91 9876543211",
        department: "COMPUTER SCIENCE AND ENGINEERING",
        semester: "6",
        password: "Password123!",
        confirmPassword: "Password123!",
        quizAnswers: fullQuizAnswers,
      },
    };
    const res5 = createMockRes();
    await safeExec(registerUser, req5, res5);

    assert(
      "Registration with duplicate USN is rejected (400)",
      res5.statusCode === 400 && res5.jsonData?.success === false,
      res5.jsonData
    );

    // 6. Duplicate Email rejection
    const req6 = {
      body: {
        name: "Another Student",
        usn: "4MC23CB" + Math.floor(100 + Math.random() * 899),
        email: testEmail, // duplicate!
        phone: "+91 9876543212",
        department: "INFORMATION SCIENCE AND ENGINEERING",
        semester: "6",
        password: "Password123!",
        confirmPassword: "Password123!",
        quizAnswers: fullQuizAnswers,
      },
    };
    const res6 = createMockRes();
    await safeExec(registerUser, req6, res6);

    assert(
      "Registration with duplicate email is rejected (400)",
      res6.statusCode === 400 && res6.jsonData?.success === false,
      res6.jsonData
    );

    // 7. Password mismatch rejection
    const req7 = {
      body: {
        name: "Test Mismatch",
        usn: "4MC23CB" + Math.floor(100 + Math.random() * 899),
        email: `mismatch_${Date.now()}@college.edu`,
        phone: "+91 9876543213",
        department: "MECHANICAL ENGINEERING",
        semester: "6",
        password: "Password123!",
        confirmPassword: "DifferentPassword123!",
        quizAnswers: fullQuizAnswers,
      },
    };
    const res7 = createMockRes();
    await safeExec(registerUser, req7, res7);

    assert(
      "Registration with mismatched password is rejected (400)",
      res7.statusCode === 400 && res7.jsonData?.success === false,
      res7.jsonData
    );

    // 8. Incomplete quiz rejection
    const req8 = {
      body: {
        name: "Incomplete Quiz Test",
        usn: "4MC23CB" + Math.floor(100 + Math.random() * 899),
        email: `noquiz_${Date.now()}@college.edu`,
        phone: "+91 9876543214",
        department: "CIVIL ENGINEERING",
        semester: "6",
        password: "Password123!",
        confirmPassword: "Password123!",
        quizAnswers: { "0": "a" }, // only 1 question answered
      },
    };
    const res8 = createMockRes();
    await safeExec(registerUser, req8, res8);

    assert(
      "Registration with incomplete quiz is rejected (400)",
      res8.statusCode === 400 && res8.jsonData?.success === false,
      res8.jsonData
    );

    // 9. Newly registered student can log in directly with USN & password
    const req9 = {
      body: { identifier: testUsn, password: "Password123!" },
      headers: { "user-agent": "Automated Test Suite" },
      ip: "127.0.0.1"
    };
    const res9 = createMockRes();
    await safeExec(loginUser, req9, res9);

    assert(
      "Newly registered student logs in directly with USN & password without re-registering",
      res9.statusCode === 200 && res9.jsonData?.success === true && !res9.jsonData?.needsOnboarding,
      res9.jsonData
    );

    // 10. Protection: Incomplete student cannot access protected features
    console.log("\n--- Phase 5 & 6: Incomplete User Protection & Student Onboarding ---");
    const incompleteUser = await User.create({
      name: "Incomplete Google User",
      email: `google_${Date.now()}@gmail.com`,
      googleId: "goog_" + Date.now(),
      registrationCompleted: false,
      quizCompleted: false,
      onboardingStep: "details",
    });

    const incompleteToken = jwt.sign(
      { id: incompleteUser._id, role: "student", registrationCompleted: false },
      process.env.JWT_SECRET || "your-default-secret-key-change-it",
      { expiresIn: "1d" }
    );

    // Test authMiddleware protection directly
    const req10 = { headers: { authorization: `Bearer ${incompleteToken}` }, originalUrl: "/api/rentals" };
    const res10 = createMockRes();
    await safeExec(protect, req10, res10);

    assert(
      "Incomplete student is blocked by authMiddleware from protected student features (403)",
      res10.statusCode === 403 && !req10.__nextCalled,
      res10.jsonData
    );

    // 11. Complete onboarding for incomplete / Google user
    const onboardUsn = "4MC23CB" + Math.floor(100 + Math.random() * 899);
    const req11 = {
      user: incompleteUser,
      body: {
        usn: onboardUsn,
        phone: "+91 9741000000",
        department: "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
        semester: "6",
        quizAnswers: fullQuizAnswers,
      },
    };
    const res11 = createMockRes();
    await safeExec(completeOnboarding, req11, res11);

    assert(
      "Incomplete user completes onboarding with USN, phone, department and quiz (200 OK)",
      res11.statusCode === 200 && res11.jsonData?.success === true,
      res11.jsonData
    );

    // 12. Check updated user in MongoDB
    const verifiedUser = await User.findById(incompleteUser._id);
    assert(
      "User record in MongoDB updated with registrationCompleted = true & quizCompleted = true",
      verifiedUser.registrationCompleted === true &&
        verifiedUser.quizCompleted === true &&
        verifiedUser.usn === onboardUsn
    );

    // 13. Completed student can now pass through authMiddleware
    const completedToken = res11.jsonData?.data?.token;
    const req13 = { headers: { authorization: `Bearer ${completedToken}` }, originalUrl: "/api/rentals" };
    const res13 = createMockRes();
    await safeExec(protect, req13, res13);

    assert(
      "Completed student passes authMiddleware and reaches protected routes",
      req13.__nextCalled === true && res13.statusCode === 200
    );

    // 14. Admin authentication
    console.log("\n--- Authority Admin Verification ---");
    const req14 = {
      body: {
        email: "admin@booknexus.com",
        password: process.env.ADMIN_PASSWORD || "Admin@123",
      },
      headers: { "user-agent": "Automated Test Suite" },
      ip: "127.0.0.1"
    };
    const res14 = createMockRes();
    await safeExec(loginUser, req14, res14);

    assert(
      "Admin authenticates successfully with MongoDB backend",
      res14.statusCode === 200 && res14.jsonData?.success === true && res14.jsonData?.data?.role === "admin",
      res14.jsonData
    );

    // Clean up test-created user records so database stays clean
    await User.deleteOne({ _id: incompleteUser._id });
    await User.deleteOne({ usn: testUsn });
    console.log("\n🧹 Test users cleaned up successfully.");

  } catch (err) {
    console.error("Test suite error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n====================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("====================================================");

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
