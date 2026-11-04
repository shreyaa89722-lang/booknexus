const express = require("express");
const {
  initiatePayment,
  submitUtr,
  verifyPayment,
  rejectPayment,
  processRefund,
  getTransactions,
} = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getTransactions);
router.post("/initiate", initiatePayment);
router.post("/submit-utr", submitUtr);
router.post("/verify", authorize("admin"), verifyPayment);
router.post("/reject", authorize("admin"), rejectPayment);
router.post("/refund", authorize("admin", "owner"), processRefund);

module.exports = router;
