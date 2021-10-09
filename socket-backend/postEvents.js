const Notification = require("../models/NotificationModel");
const Post = require("../models/PostModel");

// Notificar a todos los seguidores de un post al agregar un nuevo comentario
const notifyToPostFollowers = async (io, data) => {
  const {userNotifierId, postId, commentId, commentText} = data;

  // Buscar los usuarios seguidores del post comentado
  const {followedBy} = await Post.findById(postId).select("followedBy");

  // Ids de los usuarios suscritos al post exceptuando al autor de comentario
  const usersToNotifyIds = followedBy.filter(item => item.toString() !== userNotifierId.toString());
  
  // Buscar los socketIds de los usuarios suscritos al post
  const usersSocketsIds = [];
  global.users.forEach(item => {
    if(usersToNotifyIds.includes(item.userId.toString())) {
      usersSocketsIds.push(item.socketId)
    }
  });

  // Crear una notificación de comentario para cada usuario suscrito al post
  const notifications = [];
  usersToNotifyIds.forEach(user => {
    const n = new Notification({
      userToNotify: user,
      userNotifier: userNotifierId,
      notificationType: "comment",
      post: postId,
      commentId,
      commentText
    });

    // No notificar al autor del comentario
    notifications.push(n);

  });

  // Enviar todas las notificaciones a la base de datos
  await Notification.insertMany(notifications);

  // Notificar a todos los usuarios excepto al autor del post
  usersSocketsIds.forEach(socketId => {
    io.to(socketId).emit("commentNotificationToPostFollowers");
  })
}

module.exports = {
  notifyToPostFollowers
}