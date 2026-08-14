const express = require("express");
const { getMyRecommendations } = require("../controllers/recommendationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyRecommendations);

module.exports = router;
