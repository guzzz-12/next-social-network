const {connectedUsersState} = require("./connectedUsersState");

// Notificar al usuario si tiene notificación de comentario, like o nuevo seguidor
const notificationReceived = (io, data) => {
  const {userToNotify} = data;
  const currentUsers = connectedUsersState.getUsers();

  const recipient = currentUsers.find(el => el.userId.toString() === userToNotify.toString());
  if(recipient) {
    io.to(recipient.socketId).emit("receivedNotification");
  }
};

module.exports = {
  notificationReceived
}