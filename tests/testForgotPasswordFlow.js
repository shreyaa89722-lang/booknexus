const path = require("path");
const backendNodeModules = path.resolve(__dirname, "../backend/node_modules");
if (!module.paths.includes(backendNodeModules)) module.paths.push(backendNodeModules);
require("../backend/config/linuxCaseResolver");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const connectDB = require("../backend/config/db");

const User = require("../backend/models/user");
const {
  forgotPasswordRequestOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  loginUser,
  checkEmail,
} = require("../backend/controllers/authController");

function mockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
}

async function callController(fn, body = {}) {
  const req = { body, headers: {}, ip: "127.0.0.1" };
  const res = mockRes();
  try {
    await fn(req, res);
  } catch (err) {
    if (res.statusCode === 200) res.statusCode = res.statusCode >= 400 ? res.statusCode : 500;
    res.data = { success: false, message: err.message };
  }
  return res;
}

async function runTests() {
  console.log("====================================================");
  console.log("BookNexus: Comprehensive Forgot Password Test Suite");
  console.log("====================================================\n");

  await connectDB();
  console.log("✅ Connected to MongoDB\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const testEmail = `fp_test_student_${Date.now()}@college.edu`;
    const initialPassword = "InitialPassword@123";
    const testUsn = `FP${String(Date.now()).slice(-7)}`;

    // Create a registered user for test
    const user = new User({
      name: "Forgot Password Tester",
      email: testEmail,
      password: initialPassword,
      role: "student",
      usn: testUsn,
      dob: "2002-05-15",
      registrationCompleted: true,
      onboardingStep: "completed",
    });
    await user.save();
    console.log(`Created test student: ${testEmail} (USN: ${testUsn})\n`);

    // ----------------------------------------------------
    // TEST 1: checkEmail returns USN for "Welcome back" chip
    // ----------------------------------------------------
    {
      const res = await callController(checkEmail, { email: testEmail });
      assert(res.statusCode === 200, "checkEmail returns 200 for registered student");
      assert(res.data && res.data.isRegistered === true, "checkEmail identifies registered student");
      assert(res.data && res.data.data && res.data.data.usn === testUsn, "checkEmail returns exact student USN for welcome chip display");
    }

    // ----------------------------------------------------
    // TEST 2: Unknown email request (does not leak existence)
    // ----------------------------------------------------
    {
      const unknownEmail = `nonexistent_${Date.now()}@unknown.edu`;
      const res = await callController(forgotPasswordRequestOtp, { email: unknownEmail });
      assert(res.statusCode === 200, "Unknown email returns HTTP 200 without error");
      assert(
        res.data && res.data.message.includes("If an account exists"),
        "Unknown email returns generic enumeration-safe response"
      );
    }

    // ----------------------------------------------------
    // TEST 3: Invalid email format
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordRequestOtp, { email: "invalid-email-format" });
      assert(res.statusCode === 400, "Invalid email format rejected with 400");
    }

    // ----------------------------------------------------
    // TEST 4: Valid email requests OTP
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordRequestOtp, { email: testEmail });
      assert(res.statusCode === 200, "Valid email OTP request returns HTTP 200");
      assert(res.data && res.data.success === true, "OTP request marked success");

      const savedUser = await User.findOne({ email: testEmail }).select(
        "+resetPasswordOtpHash +resetPasswordOtpExpires +resetPasswordOtpAttempts +resetPasswordLastRequested"
      );
      assert(!!savedUser.resetPasswordOtpHash, "OTP is stored as cryptographic hash in MongoDB, never plain text");
      assert(savedUser.resetPasswordOtpExpires > new Date(), "OTP expiry is set in the future (~10 minutes)");
      assert(savedUser.resetPasswordOtpAttempts === 0, "OTP attempt counter initialized to 0");
    }

    // ----------------------------------------------------
    // TEST 5: Rate limit cooldown on immediate second request
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordRequestOtp, { email: testEmail });
      assert(res.statusCode === 429, "Immediate second OTP request rejected with 429 cooldown limit");
      assert(res.data && res.data.message.includes("seconds"), "Cooldown response indicates seconds remaining");
    }

    // Set known OTP for testing verification
    const knownOtp = "729415";
    const knownOtpHash = crypto.createHash("sha256").update(knownOtp).digest("hex");
    await User.updateOne(
      { email: testEmail },
      {
        resetPasswordOtpHash: knownOtpHash,
        resetPasswordOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
        resetPasswordOtpAttempts: 0,
      }
    );

    // ----------------------------------------------------
    // TEST 6: Invalid OTP format (non-6 digits)
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordVerifyOtp, { email: testEmail, otp: "123" });
      assert(res.statusCode === 400, "Short OTP rejected with 400");
    }

    // ----------------------------------------------------
    // TEST 7: Wrong OTP code
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordVerifyOtp, { email: testEmail, otp: "000000" });
      assert(res.statusCode === 400, "Wrong OTP code rejected with 400");
      assert(res.data && res.data.message.includes("remaining"), "Wrong OTP response mentions remaining attempts");

      const checkAttempts = await User.findOne({ email: testEmail }).select("+resetPasswordOtpAttempts");
      assert(checkAttempts.resetPasswordOtpAttempts === 1, "Wrong OTP increments attempt counter in database");
    }

    // ----------------------------------------------------
    // TEST 8: Max attempts exceeded
    // ----------------------------------------------------
    {
      await User.updateOne({ email: testEmail }, { resetPasswordOtpAttempts: 5 });
      const res = await callController(forgotPasswordVerifyOtp, { email: testEmail, otp: knownOtp });
      assert(res.statusCode === 429, "OTP verification rejected with 429 when max attempts reached");
    }

    // ----------------------------------------------------
    // TEST 9: Expired OTP code
    // ----------------------------------------------------
    {
      await User.updateOne(
        { email: testEmail },
        {
          resetPasswordOtpHash: knownOtpHash,
          resetPasswordOtpExpires: new Date(Date.now() - 5000), // 5s in past
          resetPasswordOtpAttempts: 0,
        }
      );
      const res = await callController(forgotPasswordVerifyOtp, { email: testEmail, otp: knownOtp });
      assert(res.statusCode === 400, "Expired OTP rejected with 400");
      assert(res.data && res.data.message.includes("expired"), "Expired OTP gives clear expiry message");
    }

    // Restore fresh active OTP for successful verification
    await User.updateOne(
      { email: testEmail },
      {
        resetPasswordOtpHash: knownOtpHash,
        resetPasswordOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
        resetPasswordOtpAttempts: 0,
      }
    );

    // ----------------------------------------------------
    // TEST 10: Successful OTP verification issues resetToken
    // ----------------------------------------------------
    let issuedResetToken = null;
    {
      const res = await callController(forgotPasswordVerifyOtp, { email: testEmail, otp: knownOtp });
      assert(res.statusCode === 200, "Correct OTP returns HTTP 200");
      assert(!!res.data && !!res.data.resetToken, "Returns single-use resetToken");
      issuedResetToken = res.data && res.data.resetToken;

      // Verify OTP is cleared immediately from DB (single-use)
      const afterVerify = await User.findOne({ email: testEmail }).select(
        "+resetPasswordOtpHash +passwordResetTokenHash"
      );
      assert(!afterVerify.resetPasswordOtpHash, "OTP hash deleted from database immediately after successful verification");
      assert(!!afterVerify.passwordResetTokenHash, "Cryptographic resetToken hash stored in database");
    }

    // ----------------------------------------------------
    // TEST 11: Reused OTP rejected (single-use protection)
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordVerifyOtp, { email: testEmail, otp: knownOtp });
      assert(res.statusCode === 400, "Reused OTP rejected with 400 (single-use)");
    }

    // ----------------------------------------------------
    // TEST 12: Password reset - mismatched passwords
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordReset, {
        email: testEmail,
        resetToken: issuedResetToken,
        newPassword: "BrandNewPassword@2026",
        confirmPassword: "DifferentPassword@2026",
      });
      assert(res.statusCode === 400, "Mismatched passwords rejected with 400");
      assert(res.data && res.data.message.includes("match"), "Error indicates password mismatch");
    }

    // ----------------------------------------------------
    // TEST 13: Password reset - weak password rules
    // ----------------------------------------------------
    {
      const resShort = await callController(forgotPasswordReset, {
        email: testEmail,
        resetToken: issuedResetToken,
        newPassword: "short",
        confirmPassword: "short",
      });
      assert(resShort.statusCode === 400, "Short password rejected with 400");

      const resNoNum = await callController(forgotPasswordReset, {
        email: testEmail,
        resetToken: issuedResetToken,
        newPassword: "NoNumbersPassword!",
        confirmPassword: "NoNumbersPassword!",
      });
      assert(resNoNum.statusCode === 400, "Password without number rejected with 400");

      const resSpace = await callController(forgotPasswordReset, {
        email: testEmail,
        resetToken: issuedResetToken,
        newPassword: "Pass word @1234",
        confirmPassword: "Pass word @1234",
      });
      assert(resSpace.statusCode === 400, "Password with space rejected with 400");
    }

    // ----------------------------------------------------
    // TEST 14: Password reset - invalid reset token
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordReset, {
        email: testEmail,
        resetToken: "fake_invalid_token_12345",
        newPassword: "BrandNewPassword@2026",
        confirmPassword: "BrandNewPassword@2026",
      });
      assert(res.statusCode === 400, "Invalid reset token rejected with 400");
    }

    // ----------------------------------------------------
    // TEST 15: Successful password reset
    // ----------------------------------------------------
    const brandNewPassword = "BrandNewPassword@2026";
    {
      const res = await callController(forgotPasswordReset, {
        email: testEmail,
        resetToken: issuedResetToken,
        newPassword: brandNewPassword,
        confirmPassword: brandNewPassword,
      });
      assert(res.statusCode === 200, "Valid password reset returns HTTP 200");
      assert(res.data && res.data.success === true, "Password reset marked success");

      // Verify reset token cleared
      const verifiedUserAfterReset = await User.findOne({ email: testEmail }).select("+password +passwordResetTokenHash");
      assert(!verifiedUserAfterReset.passwordResetTokenHash, "Reset token hash cleared from database after reset");
      assert(verifiedUserAfterReset.password.startsWith("$2b$") || verifiedUserAfterReset.password.startsWith("$2a$"), "New password is permanently hashed with bcrypt, never plain text");
      assert(verifiedUserAfterReset.password !== initialPassword, "New password hash replaces the old password hash");

      const countUsers = await User.countDocuments({ email: testEmail });
      assert(countUsers === 1, "No duplicate user record created (exactly 1 document)");
      assert(verifiedUserAfterReset.usn === testUsn, "Existing student USN preserved intact in MongoDB");
    }

    // ----------------------------------------------------
    // TEST 16: Login with old password fails
    // ----------------------------------------------------
    {
      const res = await callController(loginUser, {
        identifier: testEmail,
        password: initialPassword,
      });
      assert(res.statusCode === 401, "Login with old password rejected with 401");
    }

    // ----------------------------------------------------
    // TEST 17: Login with new password succeeds!
    // ----------------------------------------------------
    {
      const res = await callController(loginUser, {
        identifier: testEmail,
        password: brandNewPassword,
      });
      assert(res.statusCode === 200, "Login with new password succeeds (HTTP 200)");
      assert(!!res.data && !!res.data.data && !!res.data.data.token, "Returns authenticated JWT session token");
      assert(res.data.data.usn === testUsn, "Existing student USN preserved intact");
      assert(res.data.data.email === testEmail, "Existing student email preserved intact");
    }

    // ----------------------------------------------------
    // TEST 18: Reusing same resetToken fails
    // ----------------------------------------------------
    {
      const res = await callController(forgotPasswordReset, {
        email: testEmail,
        resetToken: issuedResetToken,
        newPassword: "AnotherNewPassword@2026",
        confirmPassword: "AnotherNewPassword@2026",
      });
      assert(res.statusCode === 400, "Reusing already consumed resetToken rejected with 400");
    }

    // Cleanup test user
    await User.deleteOne({ email: testEmail });
    console.log(`\nCleaned up test student: ${testEmail}`);

  } catch (err) {
    console.error("Test execution caught error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\n====================================================");
    console.log(`Results: ${passed} passed, ${failed} failed.`);
    console.log("====================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

module.exports = { runTests };

