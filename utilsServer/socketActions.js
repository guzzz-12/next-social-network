const users = [];
const postsAndSubscribedUsers = [
  {
    postId: null,
    user: {
      userId: null,
      socketId: null
    }
  }
];

/*----------------------------*/
// Agregar un usuario a socket
/*----------------------------*/
const addUser = (userId, socketId) => {
  // Verificar si ya el usuario está agregado
  const user = users.find(el => el.userId.toString() === userId.toString());

  // Si ya está agregado, retornar
  if(user && user.socketId === socketId) {
    return users;
  }

  // Si ya el usuario está agregado pero con otro socketId, removerlo
  if(user && user.socketId !== socketId) {
    removeUser(user.socketId);
  }
  
  // Si no está agregado, agregarlo y retornar el array actualizado
  const newUser = {userId, socketId}
  users.push(newUser);
  
  return users;
}


/*-----------------------------*/
// Remover un usuario de socket
/*-----------------------------*/
const removeUser = (socketId) => {
  const userIndex = users.findIndex(el => el.socketId === socketId);
  users.splice(userIndex, 1);
  return users;
}


/*-------------------------------*/
// Suscribir un usuario a un post
/*-------------------------------*/
const subscribeUserToPost = (postId, userId, socketId) => {
  const isSubscribed = postsAndSubscribedUsers.find(el => (el.postId === postId) && (el.user.userId === userId) && (el.user.socketId === socketId));

  // No agregar al usuario si ya está suscrito
  if(isSubscribed) {
    return postsAndSubscribedUsers
  }

  postsAndSubscribedUsers.push({
    postId,
    user: {
      userId,
      socketId
    }
  });

  return postsAndSubscribedUsers;
}


/*----------------------------------*/
// Desuscribir un usuario de un post
/*----------------------------------*/
const unsubscribeUserFromPost = (postId, userId) => {
  const index = postsAndSubscribedUsers.findIndex(el => (el.postId === postId) && (el.user.userId === userId));
  postsAndSubscribedUsers.splice(index, 1);
  return postsAndSubscribedUsers;
}


module.exports = {
  users,
  addUser,
  removeUser,
  postsAndSubscribedUsers,
  subscribeUserToPost,
  unsubscribeUserFromPost
}