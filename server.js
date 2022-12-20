const express = require("express");
const app = express();
const server = require("http").Server(app);
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({dev});
const handle = nextApp.getRequestHandler();
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary").v2;
const sendgrid = require("@sendgrid/mail");
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
const resetPassword = require("./api/reset-password");
const errorsHandler = require("./middleware/errorsHandler");
const {removeUser, removeUserBySocketId, updateUserSocket} = require("./utilsServer/socketActions");
const {onNewMessage, onUpdateNewMessagesCounter, onDeletedMessage, onMessagesRead} = require("./socket-backend/messagesEvents");
const {chatCreated, enabledChat, disabledChat} = require("./socket-backend/chatEvents");
const {notificationReceived} = require("./socket-backend/notificationsEvents");
const {subscribeUser, unsubscribeUser, commentAdded, commentEdited, commentDeleted} = require("./socket-backend/commentsEvents");
const {notifyToPostFollowers} = require("./socket-backend/postEvents");
const PORT = process.env.PORT || 5000;

/*-----------------------*/
// Inicializar Cloudinary
/*-----------------------*/
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/*---------------------*/
// Inicializar Sendgrid
/*---------------------*/
sendgrid.setApiKey(process.env.SENDGRID_SECRET);

/*-----------------------*/
// Inicializar socket.io
/*-----------------------*/
io.on("connection", (socket) => {
  // Remover un usuario de los usuarios online al cerrar el navegador
  socket.on("disconnect", () => {
    const users = removeUserBySocketId(socket.id);
    io.emit("updatedOnlineUsers", users);
  });

  // Actualizar el usuario
  socket.on("updateUser", (data) => {
    const users = updateUserSocket(data.userId, socket.id);
    io.emit("updatedOnlineUsers", users);
  });  

  // Remover el usuario de los conectados al salir del chat
  socket.on("offline", (data) => {
    const users = removeUser(data.userId);
    io.emit("updatedOnlineUsers", users);
  });
  
  // Eventos de los mensajes
  socket.on("newMessage", (data) => onNewMessage(io, data));
  socket.on("updateNewMessagesCounter", (data) => onUpdateNewMessagesCounter(io, data));
  socket.on("deletedMessage", (data) => onDeletedMessage(io, data));
  socket.on("messagesRead", (data) => onMessagesRead(io, data));

  // Eventos de los chats
  socket.on("chatCreated", (chat) => chatCreated(io, chat));
  socket.on("disabledChat", (chat) => disabledChat(io, chat));
  socket.on("enabledChat", (data) => enabledChat(io, data));

  // Eventos de los comentarios
  socket.on("subscribeUserToPost", (data) => subscribeUser(socket.id, data));
  socket.on("unsubscribeUserFromPost", (data) => unsubscribeUser(data));
  socket.on("commentCreated", (data) => commentAdded(io, data, socket.id));
  socket.on("commentEdited", (data) => commentEdited(io, data));
  socket.on("commentDeleted", (data) => commentDeleted(io, data));

  // Eventos de los posts
  socket.on("notifyToPostFollowers", (data) => notifyToPostFollowers(io, data));

  // Eventos de las notificaciones
  socket.on("notificationReceived", (data) => notificationReceived(io, data));
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
  app.use("/api/reset-password", resetPassword);
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