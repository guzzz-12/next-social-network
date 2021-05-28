const express = require("express");
const app = express();
const server = require("http").Server(app);
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({dev});
const handle = nextApp.getRequestHandler();
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const connectDB = require("./utilsServer/connectDb");
const loginRoutes = require("./api/login");
const signupRoutes = require("./api/signup");
const searchRoutes = require("./api/search");
const postsRoutes = require("./api/posts");
const profileRoutes = require("./api/profile");
const notificationsRoutes = require("./api/notifications");
const chatsRoutes = require("./api/chats");
const likesRoutes = require("./api/likes");
const errorsHandler = require("./middleware/errorsHandler");
const PORT = process.env.PORT || 5000;

// Inicializar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Inicializar el servidor
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