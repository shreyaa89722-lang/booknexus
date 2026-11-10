const express = require("express");
const {
    checkEmail,
    registerUser,
    registerStep1,
    registerStep2,
    loginUser,
    verifyRoleEligibility,
    roleLogin,
    getMe,
    updatePreferences,
    getEmailPreferences,
    updateEmailPreferences,
    logoutUser,
} = require("../controllers/authController");
const { googleLogin, getGoogleConfig } = require("../controllers/googleAuthController");
const {
    verifyStudentIdentity,
    completeStudentOnboarding,
} = require("../controllers/onboardingController");
const { protect } = require("../middleware/authMiddleware");
const { validate, registerRules, loginRules } = require("../middleware/validators");

const router = express.Router();

// --- Student authentication: Google only, gated on the approved college roster ---
router.get("/google/config", getGoogleConfig);
router.post("/google", googleLogin);
// Both onboarding steps authenticate with the short-lived registration token
// issued by POST /api/auth/google (Authorization: Bearer <onboardingToken>).
router.post("/onboarding/verify-identity", verifyStudentIdentity);
router.post("/complete-onboarding", completeStudentOnboarding);

// --- Librarian / admin / owner authentication (unchanged) ---
router.post("/login", loginRules, validate, loginUser);
router.post("/check-email", checkEmail);
router.post("/verify-role-eligibility", verifyRoleEligibility);
router.post("/role-login", roleLogin);

// --- Student two-step registration ---
router.post("/register-step1", registerStep1);
router.post("/register-step2", registerStep2);
router.post("/register", registerRules, validate, registerUser);

router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.put("/preferences", protect, updatePreferences);
router.get("/email-preferences", protect, getEmailPreferences);
router.put("/email-preferences", protect, updateEmailPreferences);

module.exports = router;

module.exports = router;
