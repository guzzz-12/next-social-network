const express = require("express");
const router = express.Router();
const Chat = require("../models/ChatModel");
const Message = require("../models/MessageModel");
const User = require("../models/UserModel");
const authMiddleware = require("../middleware/authMiddleware");


/*-----------*/
// Crear chat
/*-----------*/
router.post("/:messagesWithId", authMiddleware, async (req, res) => {
  try {
    // Id del usuario con el que se va a iniciar el chat
    const {messagesWithId} = req.params;

    // Chequear si los usuarios existen
    const user = await User.exists({_id: req.userId});
    const messagesWith = await User
    .findById(messagesWithId)
    .lean()
    .select("_id name username avatar email role")

    if(!user || !messagesWith) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      })
    }

    // Impedir que el usuario cree un chat consigo mismo
    if(req.userId.toString() === messagesWithId.toString()) {
      return res.status(400).json({
        status: "failed",
        message: "You can't create a chat with yourself"
      })
    }

    // Verificar si el chat ya existe
    const chatExists = await Chat.exists({$or: [
      {user: req.userId, messagesWith: messagesWithId},
      {user: messagesWithId, messagesWith: req.userId}
    ]});

    if(chatExists) {
      return res.status(400).json({
        status: "failed",
        message: "Chat already exists"
      })
    }

    // Crear el chat
    const chat = await Chat.create({
      user: req.userId,
      messagesWith: messagesWithId
    });

    res.json({
      status: "success",
      data: {
        _id: chat._id,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        isEmpty: chat.isEmpty,
        status: chat.status,
        user: chat.user,
        messagesWith: {
          _id: messagesWith._id,
          name: messagesWith.name,
          username: messagesWith.username,
          avatar: messagesWith.avatar,
          role: messagesWith.role,
          email: messagesWith.email
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error creating chat: ${error.message}`
    })
  }
});


/*----------------------------------*/
// Consultar los chats de un usuario
/*----------------------------------*/
router.get("/", authMiddleware, async (req, res) => {
  const {page} = req.query;
  const amount = 10;

  try {
    const userChats = await Chat
    .find({$or: [{user: req.userId}, {messagesWith: req.userId}]})
    .lean()
    .limit(amount)
    .skip(amount * (page - 1))
    .sort({lastMessageDate: -1})
    .populate({
      path: "user",
      select: "_id name username email avatar role"
    })
    .populate({
      path: "messagesWith",
      select: "_id name username email avatar role"
    });

    // Verificar si es la última página de chats
    const isLastPage = userChats.length <= amount;

    res.json({
      status: "success",
      data: {userChats, isLastPage}
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error retrieving user chats: ${error.message}`
    })
  }
});


/*--------------------------*/
// Crear mensaje en un chat
/*--------------------------*/
router.post("/:chatId/message/:messagesWithId", authMiddleware, async (req, res) => {
  try {
    const {chatId, messagesWithId} = req.params;

    // Validar el contenido del mensaje
    const {messageText} = req.body;

    if(!messageText || messageText.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "The message cannot be empty"
      })
    }

    // Verificar si el chat existe y si está activo
    const chatExists = await Chat.findOne({_id: chatId, status: "active"});

    if(!chatExists) {
      return res.status(404).json({
        status: "failed",
        message: "Chat not found or disabled"
      })
    }

    // Crear el mensaje
    const message = await Message.create({
      chat: chatId,
      sender: req.userId,
      recipient: messagesWithId,
      text: messageText
    });

    // Especificar que el chat no está vacío
    chatExists.isEmpty = false;
    await chatExists.save();

    res.json({
      status: "success",
      data: message
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error creating message: ${error.message}`
    })
  }
});


/*-----------------------------------*/
// Consultar los mensajes de un chat
/*-----------------------------------*/
router.get("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const {chatId} = req.params;
    const {page} = req.query;
    const amount = 10;

    const messages = await Message
    .find({chat: chatId})
    .lean()
    .limit(amount)
    .skip(amount * (page - 1))
    .sort({createdAt: -1})
    .populate({
      path: "sender",
      select: "_id name username email avatar role"
    })
    .populate({
      path: "recipient",
      select: "_id name username email avatar role"
    });

    // Verificar el status del mensaje y no enviar el texto si está inactivo (eliminado)
    if(messages.length > 0) {
      messages.forEach(msg => {
        if(msg.status === "inactive") {
          msg.text = "Message deleted"
        }
      })
    }

    // Verificar si es la última página de mensajes
    const isLastPage = messages.length <= amount;

    res.json({
      status: "success",
      data: {messages, isLastPage}
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error retrieving messages: ${error.message}`
    })
  }
});


module.exports = router;