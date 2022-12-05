/**
 * State global de los usuarios conectados a la app
 * y de las suscripciones de los usuarios a los posts.
 * Patrón Revealing Module (IIFE).
 */
const connectedUsersState = (function () {
  let users = [];
  let postsAndSubscribedUsers = [];

  /**
   * Consultar todos los usuarios conectados a la app.
   * @returns {{userId: string, socketId: string}[]} Array con la data de los usuarios conectados.
   */
  const getUsers = () => {
    return users;
  }

  /**
   * Consultar los usuarios suscritos a cada post.
   */
  const getPostsAndSubscribedUsers = () => {
    return postsAndSubscribedUsers;
  };

  /**
   * Actualiza el socket de un usuario.
   * @param {string} userId ID del usuario.
   * @param {string} socketId ID del nuevo socket del usuario.
   * @returns {{userId: string, socketId: string}[]} Array con la data de los usuarios conectados.
   */
  const updateUserSocket = (userId, socketId) => {
    console.log({usersBeforeUpdate: users});
    const updatedUser = {userId, socketId};
    const index = users.findIndex(user => userId === user.userId);
    
    if(index !== -1) {
      users.splice(index, 1, updatedUser);
    } else {
      users.push(updatedUser);
    };

    console.log({usersAfterUpdate: users});

    return users;
  };

  /**
   * Remueve un usuario por ID del array de usuarios conectados
   * y devuelve el array actualizado.
   * @param {string} userId ID del usuario a remover.
   * @returns {{userId: string, socketId: string}[]} Array con la data de los usuarios conectados.
   */
  const removeUserById = (userId) => {
    const filtered = users.filter((user) => user.userId !== userId);
    users = filtered;
    console.log("USER_REMOVED", userId, {users});
    return filtered;
  };

  /**
   * Remover un usuario conectado mediante la ID del socket.
   * @param {string} socketId ID del socket del usuario a remover.
   * @returns {{userId: string, socketId: string}[]} Array con la data de los usuarios conectados.
   */
  const removeUserBySocketId = (socketId) => {
    const filtered = users.filter(user => user.socketId !== socketId);
    users = filtered;
    return users;
  };

  /**
   * Agrega un usuario y el post correspondiente al array de suscripciones
   * y retorna el array actualizado.
   * @param {string} userId ID del usuario a suscribir.
   * @param {string} postId ID del post al que se suscribió.
   * @param {string} socketId ID del socket del usuario a suscribir.
   * @returns {{postId: string, user: {userId: string, socketId: string}}[]} Array con la data de las suscripciones de los usuarios a los posts.
   */
  const addUserPostSubscription = (postId, userId, socketId) => {
    const isSubscribed = postsAndSubscribedUsers.find(el => (el.postId === postId) && (el.user.userId === userId) && (el.user.socketId === socketId));

    // No agregar al usuario si ya está suscrito al post
    if(isSubscribed) {
      return postsAndSubscribedUsers
    }

    const data = {
      postId,
      user: {
        userId,
        socketId
      }
    }

    postsAndSubscribedUsers.push(data);
    return postsAndSubscribedUsers;
  };

  /**
   * Elimina un usuario del array de suscripciones al desuscribirse de un post
   * y devuelve el post actualizado.
   * @param {string} userId ID del usuario a desuscribir.
   * @param {string} postId ID del post al que se desuscribió.
   * @returns {{postId: string, user: {userId: string, socketId: string}}[]} Array con la data de las suscripciones de los usuarios a los posts.
   */
  const removeUserPostSubscription = (userId, postId) => {    
    const index = postsAndSubscribedUsers.findIndex(el => (el.postId === postId) && (el.user.userId === userId));

    postsAndSubscribedUsers.splice(index, 1);
    
    return postsAndSubscribedUsers;
  };

  return {
    getUsers,
    getPostsAndSubscribedUsers,
    removeUserById,
    removeUserBySocketId,
    updateUserSocket,
    addUserPostSubscription,
    removeUserPostSubscription
  };

})();

exports.connectedUsersState = Object.freeze(connectedUsersState);