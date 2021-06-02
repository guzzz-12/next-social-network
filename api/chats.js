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
    const user = await User
    .findById({_id: req.userId})
    .lean()
    .select("_id name username avatar email role");

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
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          role: user.role,
          email: user.email
        },
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


/*-------------------------------*/
// Deshabilitar/habilitar un chat
/*-------------------------------*/
router.patch("/disable-chat/:chatId", authMiddleware, async (req, res) => {
  try {
    const currentUser = req.userId.toString();
    const chat = await Chat
    .findById(req.params.chatId)
    .populate({
      path: "user",
      select: "_id name username email avatar role"
    })
    .populate({
      path: "messagesWith",
      select: "_id name username email avatar role"
    });

    // Verificar si el usuario es participante del chat
    if((currentUser !== chat.user._id.toString()) && (currentUser !== chat.messagesWith._id.toString())) {
      return res.status(401).json({
        status: "failed",
        message: "You're not allowed to disable/enable this chat"
      })
    }

    const currentStatus = chat.status;

    // Habilitar o inhabilitar el chat, dependiendo del status actual
    if(currentStatus === "active") {
      chat.status = "inactive";
      chat.disabledBy = req.userId;

    } else {
      if(req.userId.toString() !== chat.disabledBy.toString()) {
        return res.status(401).json({
          status: "failed",
          message: "Only the user that disabled the chat is allowed to enable it again"
        })
      }
      chat.status = "active";
      chat.disabledBy = null;
    }

    await chat.save();

    res.json({
      status: "success",
      data: chat
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error disabling chat: ${error.message}`
    })
  }
})


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
    const chatExists = await Chat.findOne({_id: chatId});

    if(!chatExists) {
      return res.status(404).json({
        status: "failed",
        message: "Chat not found"
      })
    }

    // Verificar si el chat está deshabilitado
    if(chatExists.status === "inactive") {
      return res.status(401).json({
        status: "failed",
        message: "The chat is disabled"
      })
    }

    // Buscar la data de los usuarios
    const sender = await User
    .findById(req.userId)
    .lean()
    .select("_id name username avatar email role");

    const recipient = await User
    .findById(messagesWithId)
    .lean()
    .select("_id name username avatar email role");

    // Chequear si los usuarios existen
    if(!sender || !recipient) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      })
    }

    // Extraer la data de los usuarios
    const senderData = {
      _id: sender._id,
      name: sender.name,
      username: sender.username,
      avatar: sender.avatar,
      email: sender.email,
      role: sender.role
    }

    const recipientData = {
      _id: recipient._id,
      name: recipient.name,
      username: recipient.username,
      avatar: recipient.avatar,
      email: recipient.email,
      role: recipient.role
    }

    // Crear el mensaje
    const message = await Message.create({
      chat: chatId,
      sender: req.userId,
      recipient: messagesWithId,
      text: messageText
    });

    // Data del nuevo mensaje creado
    const messageData = {
      _id: message._id,
      chat: message.chat,
      sender: senderData,
      recipient: recipientData,
      text: message.text,
      status: message.status,
      createdAt: message.createdAt
    }

    // Especificar que el chat no está vacío y actualizar el último mensaje recibido
    chatExists.isEmpty = false;
    chatExists.latestMessage = {
      text: message.text,
      date: Date.now()
    }

    await chatExists.save();

    res.json({
      status: "success",
      data: messageData
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
    const amount = 5;

    // const totalMessagesCount = await Message.countDocuments();

    const messages = await Message
    .find({chat: chatId})
    .lean()
    .skip(amount * (page - 1))
    .limit(amount)
    .sort({createdAt: -1})
    .populate({
      path: "sender",
      select: "_id name username avatar email role"
    })
    .populate({
      path: "recipient",
      select: "_id name username avatar email role"
    });

    // Verificar si es la última página de mensajes
    const isLastPage = messages.length < amount;

    // Verificar el status del mensaje y no enviar el texto si está inactivo (eliminado)
    if(messages.length > 0) {
      messages.forEach(msg => {
        if(msg.status === "inactive") {
          msg.text = "Message deleted"
        }
      })
    }

    const sortedMessages = [...messages].sort((a, b) => {
      if(a.createdAt > b.createdAt) return 1;
      if(a.createdAt < b.createdAt) return -1;
      return 0;
    });

    res.json({
      status: "success",
      data: {messages: sortedMessages, isLastPage}
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error retrieving messages: ${error.message}`
    })
  }
});


/*--------------------------------------------------*/
// Eliminar un mensaje (Cambiar su status a inactive)
/*--------------------------------------------------*/
router.patch("/message/:messageId", authMiddleware, async (req, res) => {
  try {
    const message = await Message
    .findOneAndUpdate({_id: req.params.messageId}, {status: "inactive"}, {new: true})
    .lean()
    .populate({
      path: "sender",
      select: "_id name username avatar email role"
    })
    .populate({
      path: "recipient",
      select: "_id name username avatar email role"
    })

    if(!message) {
      return res.status(404).json({
        status: "failed",
        message: "Message nor found or already deleted"
      })
    }

    // Impedir qu pueda eliminar el mensaje de otro usuario
    if(message.sender._id.toString() !== req.userId.toString()) {
      return res.status(401).json({
        status: "failed",
        message: "You're not allowed to delete this message"
      })
    }

    res.json({
      status: "success",
      data: message
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error deleting message: ${error.message}`
    })
  }
});


module.exports = router;