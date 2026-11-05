const express = require("express");
const {
    registerUser,
    loginUser,
    verifyRoleEligibility,
    roleLogin,
    completeOnboarding,
    getMe,
    updatePreferences,
    getEmailPreferences,
    updateEmailPreferences,
    logoutUser,
} = require("../controllers/authController");
const { googleLogin, getGoogleConfig } = require("../controllers/googleAuthController");
const { protect } = require("../middleware/authMiddleware");
const { validate, registerRules, loginRules } = require("../middleware/validators");

const router = express.Router();

router.post("/register", registerRules, validate, registerUser);
router.post("/login", loginRules, validate, loginUser);
router.post("/verify-role-eligibility", verifyRoleEligibility);
router.post("/role-login", roleLogin);
router.post("/complete-onboarding", completeOnboarding);
router.get("/google/config", getGoogleConfig);
router.post("/google", googleLogin);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.put("/preferences", protect, updatePreferences);
router.get("/email-preferences", protect, getEmailPreferences);
router.put("/email-preferences", protect, updateEmailPreferences);

module.exports = router;
