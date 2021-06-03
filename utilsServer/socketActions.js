const users = [];

// Agregar un usuario a socket
const addUser = (userId, socketId) => {
  // Verificar si ya el usuario está agregado
  const user = users.some(el => el.userId.toString() === userId.toString());

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

  console.log({userAdded: {userId, socketId}});
  
  return users;
}

// Remover un usuario de socket
const removeUser = (socketId) => {
  const userIndex = users.findIndex(el => el.socketId === socketId);
  users.splice(userIndex, 1);
  return users;
}

module.exports = {
  users,
  addUser,
  removeUser
}