const express = require("express");
const {
    requestRental,
    approveRental,
    rejectRental,
    returnRental,
    getRentals,
} = require("../controllers/rentalController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
    .get(protect, getRentals)
    .post(protect, requestRental);

router.put("/:id/approve", protect, approveRental);
router.put("/:id/reject", protect, rejectRental);
router.put("/:id/return", protect, returnRental);

module.exports = router;
