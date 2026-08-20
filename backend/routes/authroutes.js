const express = require("express");
const { registerUser, loginUser, getMe, updatePreferences } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validate, registerRules, loginRules } = require("../middleware/validators");

const router = express.Router();

router.post("/register", registerRules, validate, registerUser);
router.post("/login", loginRules, validate, loginUser);
router.get("/me", protect, getMe);
router.put("/preferences", protect, updatePreferences);

module.exports = router;
