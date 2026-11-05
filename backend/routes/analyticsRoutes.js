const express = require("express");
const { getOverview, getUserDashboard } = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// System overview (Admin only)
router.get("/overview", protect, authorize("admin"), getOverview);

// User-specific dashboard metrics & activity (Authenticated student / user)
router.get("/user-dashboard", protect, getUserDashboard);

module.exports = router;
