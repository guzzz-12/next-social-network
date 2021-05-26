const User = require("../models/UserModel");
const Notification = require("../models/NotificationModel");

/*-------------------------------------------------------------------*/
// Actualizar el campo de notificación sin leer en el doc del usuario
/*-------------------------------------------------------------------*/
const setUnreadNotification = async (userId) => {
  try {
    const user = await User.findById(userId);

    if(!user.unreadNotification) {
      user.unreadNotification = true;
      await user.save()
    }

    return null;
    
  } catch (error) {
    throw new error(`Error updating user unread notification property: ${error.message}`)
  }
}

/*--------------------------*/
// Remover una notificación
/*--------------------------*/
const removeNotification = async (type, userId, postId, userNotifierId) => {
  try {
    const userNotificationsDoc = await Notification.findOne({user: userId});
    const notifications = [...userNotificationsDoc.notifications];

    // Buscar el índice de la notificación del tipo especificado
    // del usuario notificador correspondiente al postId
    let notificationIndex = null;
    if(type === "like" || type === "comment") {
      notificationIndex = notifications.findIndex(el => el.notificationType === type && el.post.toString() === postId.toString() && el.notificationUser.toString() === userNotifierId.toString());
    }

    if(notificationIndex > -1) {
      notifications.splice(notificationIndex, 1);
      userNotificationsDoc.notifications = notifications;
      await userNotificationsDoc.save();
    }

    return null;
    
  } catch (error) {
    throw new Error(`Error removing notification: ${error.message}`)
  }
}


/*--------------------------------------------*/
// Generar notificaciones de like en los posts
/*--------------------------------------------*/
const newLikeNotification = async (userNotifierId, postId, userToNotifyId) => {
  try {
    // Notificaciones del usuario que va a recibir al notificación
    const userNotificationsDoc = await Notification.findOne({user: userToNotifyId});

    // Cotenido de la notificación
    const newNotification = {
      notificationType: "like",
      // Usuario notificador (el usuario que dio el like)
      notificationUser: userNotifierId,
      // Post likeado
      post: postId,
      date: Date.now()
    }

    // Inicializar la colección de notificaciones del usuario si no existe
    if(!userNotificationsDoc) {
      await Notification.create({
        user: userToNotifyId,
        notifications: [newNotification]
      });
      await setUnreadNotification(userToNotifyId);
      return null;
    }

    userNotificationsDoc.notifications.push(newNotification);
    await userNotificationsDoc.save();
    await setUnreadNotification(userToNotifyId);

    return null;
    
  } catch (error) {
    throw new Error(`Error creating like notification: ${error.message}`)
  }
}


/*--------------------------------------------------------*/
// Generar notificaciones de nuevo comentario en los posts
/*--------------------------------------------------------*/
const newCommentNotification = async (postId, commentId, commentText, userNotifierId, userToNotifyId) => {
  try {
    const userNotificationsDoc = await Notification.findOne({user: userToNotifyId});

    const newNotification = {
      notificationType: "comment",
      notificationUser: userNotifierId,
      post: postId,
      commentId,
      commentText
    }

    // Inicializar la colección de notificaciones del usuario si no tiene notificaciones
    if(!userNotificationsDoc) {
      await Notification.create({
        user: userToNotifyId,
        notifications: [newNotification]
      });

      await setUnreadNotification(userToNotifyId);
      return null;
    }

    userNotificationsDoc.notifications.push(newNotification);
    await userNotificationsDoc.save();
    await setUnreadNotification(userToNotifyId);

    return null;
    
  } catch (error) {
    throw new Error(`Error creating comment notification: ${error.message}`)
  }
}


module.exports = {
  removeNotification,
  newLikeNotification,
  newCommentNotification
}