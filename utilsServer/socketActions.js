const {connectedUsersState} = require("../socket-backend/connectedUsersState");


/*------------------------------------------------*/
// agregar un usuario al state de usuarios online.
// Actualizar el socket de un usuario.
/*------------------------------------------------*/
const updateUserSocket = (userId, socketId) => {
  const updatedUsers = connectedUsersState.updateUserSocket(userId, socketId);
  return updatedUsers;
}


/*------------------------------------------------*/
// Remover un usuario del state de usuarios online
/*------------------------------------------------*/
const removeUser = (userId) => {
  return connectedUsersState.removeUserById(userId);
}


/*--------------------------------------------*/
// Remover un usuario filtrando por socket id
/*--------------------------------------------*/
const removeUserBySocketId = (socketId) => {
  return connectedUsersState.removeUserBySocketId(socketId);
};


/*-------------------------------*/
// Suscribir un usuario a un post
/*-------------------------------*/
const subscribeUserToPost = (postId, userId, socketId) => {
  return connectedUsersState.addUserPostSubscription(postId, userId, socketId);
}


/*----------------------------------*/
// Desuscribir un usuario de un post
/*----------------------------------*/
const unsubscribeUserFromPost = (postId, userId) => {
  return connectedUsersState.removeUserPostSubscription(userId, postId);
}


module.exports = {
  updateUserSocket,
  removeUser,
  removeUserBySocketId,
  subscribeUserToPost,
  unsubscribeUserFromPost
}