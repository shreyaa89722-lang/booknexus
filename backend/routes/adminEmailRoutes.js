const express = require("express");
const { getEmailActivity, getEmailStats, retryEmail } = require("../controllers/adminEmailController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// All admin email routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/", getEmailActivity);
router.get("/stats", getEmailStats);
router.post("/:id/retry", retryEmail);

module.exports = router;
