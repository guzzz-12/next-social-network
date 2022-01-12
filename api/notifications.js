const express = require("express");
const router = express.Router();
const Notification = require("../models/NotificationModel");
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
    .populate("post", "_id user content picUrl");

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


// Consultar las notificaciones sin leer
router.get("/unread", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification
    .find({userToNotify: req.userId, seen: false})
    .lean();

    res.json({
      status: "success",
      data: notifications
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error getting unread notifications: ${error.message}`
    })
  }
})


// Marcar las notificaciones como leídas
router.patch("/", authMiddleware, async (req, res) => {
  try {
    const {notificationsIds} = req.body;

    await Notification
    .updateMany({_id: {$in: notificationsIds}}, {seen: true});
    
    res.json({
      status: "success",
      data: {updatedNotifications: notificationsIds}
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
});


// Eliminar una notificación
router.delete("/:notifId", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({_id: req.params.notifId});

    res.json({
      status: "success",
      data: {
        _id: notification._id
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
})


module.exports = router;