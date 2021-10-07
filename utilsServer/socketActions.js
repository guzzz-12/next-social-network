/*----------------------------*/
// Agregar un usuario a socket
/*----------------------------*/
const addUser = (userId, socketId) => {
  // Verificar si ya el usuario está agregado
  const user = global.users.find(el => el.userId.toString() === userId.toString());

  // Si ya está agregado, retornar
  if(user && user.socketId === socketId) {
    return global.users;
  }

  // Si ya el usuario está agregado pero con otro socketId, removerlo
  if(user && user.socketId !== socketId) {
    removeUser(user.socketId);
  }
  
  // Si no está agregado, agregarlo y retornar el array actualizado
  const newUser = {userId, socketId}
  global.users.push(newUser);
  
  return global.users;
}


/*-----------------------------------*/
// Actualizar el socket de un usuario
/*-----------------------------------*/
const updateUserSocket = (userId, socketId) => {
  const updated = [...global.users.filter(el => el.userId.toString() !== userId.toString())];
  updated.push({userId, socketId});
  global.users = updated;
  return updated;
}


/*-----------------------------*/
// Remover un usuario de socket
/*-----------------------------*/
const removeUser = (userId) => {
  const filtered = [...global.users.filter(el => el.userId.toString() !== userId.toString())];
  global.users = filtered;
  return filtered;
}


/*-------------------------------*/
// Suscribir un usuario a un post
/*-------------------------------*/
const subscribeUserToPost = (postId, userId, socketId) => {
  const isSubscribed = global.postsAndSubscribedUsers.find(el => (el.postId === postId) && (el.user.userId === userId) && (el.user.socketId === socketId));

  // No agregar al usuario si ya está suscrito
  if(isSubscribed) {
    return global.postsAndSubscribedUsers
  }

  global.postsAndSubscribedUsers.push({
    postId,
    user: {
      userId,
      socketId
    }
  });

  return global.postsAndSubscribedUsers;
}


/*----------------------------------*/
// Desuscribir un usuario de un post
/*----------------------------------*/
const unsubscribeUserFromPost = (postId, userId) => {
  const index = global.postsAndSubscribedUsers.findIndex(el => (el.postId === postId) && (el.user.userId === userId));
  global.postsAndSubscribedUsers.splice(index, 1);
  return global.postsAndSubscribedUsers;
}


module.exports = {
  addUser,
  updateUserSocket,
  removeUser,
  subscribeUserToPost,
  unsubscribeUserFromPost
}