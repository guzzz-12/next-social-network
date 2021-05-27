const express = require("express");
const router = express.Router();
const Notification = require("../models/NotificationModel");
const User = require("../models/UserModel");
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
});


// Marcar las notificaciones como leídas
router.patch("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    let isUpdated = null;

    if(user.unreadNotification) {
      user.unreadNotification = false;
      await user.save();
      isUpdated = true;
    } else {
      isUpdated = false;
    }

    
    res.json({
      status: "success",
      data: {user, isUpdated}
    })

  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
})


module.exports = router;