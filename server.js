const express = require("express");
const app = express();
const server = require("http").Server(app);
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({dev});
const handle = nextApp.getRequestHandler();
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary").v2;
const io = require("socket.io")(server);
require("dotenv").config();

const connectDB = require("./utilsServer/connectDb");
const loginRoutes = require("./api/login");
const signupRoutes = require("./api/signup");
const searchRoutes = require("./api/search");
const postsRoutes = require("./api/posts");
const profileRoutes = require("./api/profile");
const notificationsRoutes = require("./api/notifications");
const chatsRoutes = require("./api/chats");
const commentsRoutes = require("./api/comments");
const likesRoutes = require("./api/likes");
const errorsHandler = require("./middleware/errorsHandler");
const {addUser, removeUser, users} = require("./utilsServer/socketActions");
const PORT = process.env.PORT || 5000;

/*-----------------------*/
// Inicializar Cloudinary
/*-----------------------*/
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


/*-----------------------*/
// Inicializar socket.io
/*-----------------------*/
io.on("connection", (socket) => {
  // Emitir los usuarios actualmente conectados a la app
  socket.on("join", (data) => {
    const users = addUser(data.userId, socket.id);
    io.emit("onlineUsers", users)
  });
  

  // Remover el usuario de los conectados al salir del chat
  socket.on("offline", () => {
    const users = removeUser(socket.id);
    io.emit("onlineUsers", users);
  })


  // Enviar el mensaje recibido al usuario recipiente
  socket.on("newMessage", (msg) => {
    const recipient = users.find(el => el.userId.toString() === msg.recipient._id.toString());
    if(recipient) {
      io.to(recipient.socketId).emit("newMessageReceived", msg);
    }
  });


  // Enviar el mensaje eliminado al usuario recipiente
  socket.on("deletedMessage", (msg) => {
    const recipient = users.find(el => el.userId.toString() === msg.recipient._id.toString());
    if(recipient) {
      io.to(recipient.socketId).emit("messageDeleted", msg);
    }
  });


  // Notificar que el chat fue deshabilitado
  socket.on("disabledChat", (chat) => {
    const {user, messagesWith, disabledBy} = chat;

    const userToNotify = disabledBy.toString() === user._id.toString() ? messagesWith._id.toString() : user._id.toString();

    const recipient = users.find(el => el.userId.toString() === userToNotify);
    if(recipient) {
      io.to(recipient.socketId).emit("chatDisabled", chat);
    }
  });


  // Notificar que el chat fue habilitado
  socket.on("enabledChat", (data) => {
    const {updatedChat, enabledBy} = data;

    const {user, messagesWith} = updatedChat;

    const userToNotify = enabledBy.toString() === user._id.toString() ? messagesWith._id.toString() : user._id.toString();

    const recipient = users.find(el => el.userId.toString() === userToNotify);
    if(recipient) {
      io.to(recipient.socketId).emit("chatEnabled", updatedChat);
    }
  });


  // Notificar al remitente que sus mensajes fueron leídos por el recipiente
  socket.on("messagesRead", (data) => {
    const {senderId, seenById, updatedMessages} = data;

    const recipient = users.find(el => el.userId.toString() === senderId.toString());
    
    if(recipient && recipient !== seenById.toString()) {
      io.to(recipient.socketId).emit("readMessages", updatedMessages);
    }
  })
});


/*------------------------*/
// Inicializar el servidor
/*------------------------*/
nextApp.prepare()
.then(() => {
  // Inicializar conexión con la base de datos de MongoDB
  return connectDB();
})
.then(() => {
  // Middlewares
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));

  // Rutas
  app.use("/api/signup", signupRoutes);
  app.use("/api/login", loginRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/posts", postsRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/chats", chatsRoutes);
  app.use("/api/comments", commentsRoutes);
  app.use("/api/likes", likesRoutes);
  app.all("*", (req, res) => handle(req, res));

  // Manejo de errores
  app.use(errorsHandler);

  // Inicializar el servidor
  server.listen(PORT, (err) => {
    if(err) {
      throw new Error(err.message)
    }
    console.log(`Server running on port ${PORT}`)
  })
})
.catch(err => {
  console.log({serverError: err.message})
});