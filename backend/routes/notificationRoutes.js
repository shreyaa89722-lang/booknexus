const express = require("express");
const {
  getNotifications,
  testAllNotifications,
  triggerSingleNotification,
  markAsRead,
  clearNotifications,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", getNotifications);
router.post("/test-all", testAllNotifications);
router.post("/trigger/:type", triggerSingleNotification);
router.put("/:id/read", markAsRead);
router.delete("/", clearNotifications);

module.exports = router;
