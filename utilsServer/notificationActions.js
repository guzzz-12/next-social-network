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

/*--------------------------------------------*/
// Generar notificaciones de like en los posts
/*--------------------------------------------*/
const newLikeNotification = async (userNotifierId, postId, userToNotifyId) => {
  console.log({userNotifierId, postId, userToNotifyId});
  try {
    // Notificaciones del usuario que va a recibir al notificación
    const notifiedUserNotifications = await Notification.findOne({user: userToNotifyId});

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
    if(!notifiedUserNotifications) {
      await Notification.create({
        user: userToNotifyId,
        notifications: [newNotification]
      });
      await setUnreadNotification(userToNotifyId);
      return null;
    }

    notifiedUserNotifications.notifications.push(newNotification);
    await notifiedUserNotifications.save();
    await setUnreadNotification(userToNotifyId);

    return null;
    
  } catch (error) {
    throw new Error(`Error creating like notification: ${error.message}`)
  }
}

/*---------------------------------*/
// Remover una notificación de like
/*---------------------------------*/
const removeLikeNotification = async (userId, postId, userNotifierId) => {
  try {
    const userNotificationsDoc = await Notification.findOne({user: userId});
    const notifications = [...userNotificationsDoc.notifications];
    
    // Buscar el índice de la notificación de tipo like
    // del usuario notificador correspondiente al postId
    const notificationIndex = notifications.findIndex(el => el.notificationType === "like" && el.post.toString() === postId.toString() && el.notificationUser.toString() === userNotifierId.toString());

    if(notificationIndex !== -1) {
      notifications.splice(notificationIndex, 1);
      userNotificationsDoc.notifications = notifications;
      await userNotificationsDoc.save();
    }

    return null;
    
  } catch (error) {
    throw new Error(`Error removing notification: ${error.message}`)
  }
}

module.exports = {newLikeNotification, removeLikeNotification}