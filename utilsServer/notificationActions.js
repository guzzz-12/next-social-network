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
const removeNotification = async (type, userId, postId, commentId, userNotifierId) => {
  try {
    let query = null;

    // Buscar y eliminar la notificación de tipo like
    if(type === "like") {
      query = Notification.findOneAndDelete({$and: [
        {userToNotify: userId},
        {userNotifier: userNotifierId},
        {notificationType: "like"},
        {post: postId}
      ]})
    }

    // Buscar y eliminar la notificación de tipo comment
    if(type === "comment") {
      query = Notification.findOneAndDelete({$and: [
        {userToNotify: userId},
        {notificationType: "comment"},
        {post: postId},
        {commentId}
      ]})
    }

    // Buscar y eliminar la notificación de tipo follower
    if(type === "follower") {
      query = Notification.findOneAndDelete({$and: [
        {userToNotify: userId},
        {userNotifier: userNotifierId},
        {notificationType: "follower"}
      ]})
    }

    await query;
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
    await Notification.create({
      userToNotify: userToNotifyId,
      userNotifier: userNotifierId,
      notificationType: "like",
      post: postId
    });

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
    await Notification.create({
      userToNotify: userToNotifyId,
      userNotifier: userNotifierId,
      notificationType: "comment",
      post: postId,
      commentId,
      commentText
    });

    await setUnreadNotification(userToNotifyId);

    return null;
    
  } catch (error) {
    throw new Error(`Error creating comment notification: ${error.message}`)
  }
}


/*---------------------------------------*/
// Crear notificaciones de nuevo seguidor
/*---------------------------------------*/
const newFollowerNotification = async (userFollowerId, userToNotifyId) => {
  try {
    await Notification.create({
      userToNotify: userToNotifyId,
      userNotifier: userFollowerId,
      notificationType: "follower"
    });

    await setUnreadNotificationAlt(userToNotifyId);
    
    return null;
    
  } catch (error) {
    throw new Error(`Error creating follower notification: ${error.message}`)
  }
}


module.exports = {
  removeNotification,
  newLikeNotification,
  newCommentNotification,
  newFollowerNotification
}