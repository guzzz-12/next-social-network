const express = require("express");
const router = express.Router();
const Notification = require("../models/NotificationModel");
const authMiddleware = require("../middleware/authMiddleware");

// Consultar las notificaciones del usuario autenticado
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.findOne({user: req.userId})
    .populate({
      path: "notifications.notificationUser",
      select: "_id name username email avatar"
    })
    .populate("notifications.post", "_id content picUrl");

    if(!notifications) {
      return res.status(404).json({
        status: "failed",
        message: "Notifications document or user not found or deleted"
      })
    }

    res.json({
      status: "success",
      data: notifications
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error getting notifications: ${error.message}`
    })
  }
})

module.exports = router;