const express = require("express");
const {
  requestRental,
  approveRental,
  rejectRental,
  returnRental,
  getRentals,
} = require("../controllers/rentalController");
const { protect } = require("../middleware/authMiddleware");
const { validate, rentalRequestRules } = require("../middleware/validators");

const router = express.Router();

router.route("/")
  .get(protect, getRentals)
  .post(protect, rentalRequestRules, validate, requestRental);

router.put("/:id/approve", protect, approveRental);
router.put("/:id/reject", protect, rejectRental);
router.put("/:id/return", protect, returnRental);

module.exports = router;
