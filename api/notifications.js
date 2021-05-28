const express = require("express");
const router = express.Router();
const Notification = require("../models/NotificationModel");
const User = require("../models/UserModel");
const authMiddleware = require("../middleware/authMiddleware");

// Consultar las notificaciones del usuario autenticado
router.get("/", authMiddleware, async (req, res) => {
  try {
    const page = +req.query.page;
    const limit = 10;

    const notifications = await Notification
    .find({userToNotify: req.userId})
    .limit(limit)
    .skip(limit * (page - 1))
    .sort({createdAt: -1})
    .populate({
      path: "userNotifier",
      select: "_id name username email avatar role"
    })
    .populate("post", "_id content picUrl");

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