
// Notificar al usuario si tiene notificación de comentario, like o nuevo seguidor
const notificationReceived = (io, data) => {
  const {userToNotify} = data;

  console.log("notificationReceived", userToNotify);

  const recipient = global.users.find(el => el.userId.toString() === userToNotify.toString());
  if(recipient) {
    io.to(recipient.socketId).emit("receivedNotification");
  }
}

module.exports = {
  notificationReceived
}