const express = require("express");
const router = express.Router();
const Chat = require("../models/ChatModel");
const authMiddleware = require("../middleware/authMiddleware");

// Consultar los chats de un usuario
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userChats = await Chat.findOne({user: req.userId})
    .populate({
      path: "chats.messagesWith",
      select: "_id name username email avatar role"
    });

    res.json({
      status: "success",
      data: userChats
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error retrieving user chats: ${error.message}`
    })
  }
})

module.exports = router;