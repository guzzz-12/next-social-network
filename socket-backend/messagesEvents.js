
// Enviar el mensaje recibido al usuario recipiente
const onNewMessage = (io, data) => {
  const {newMsg, chatId} = data;
  const recipient = global.users.find(el => el.userId.toString() === newMsg.recipient._id.toString());
  if(recipient) {
    io.to(recipient.socketId).emit("newMessageReceived", {newMsg, chatId});
  }
}

// Enviar el mensaje eliminado al usuario recipiente
const onDeletedMessage = (io, msg) => {
  const recipient = global.users.find(el => el.userId.toString() === msg.recipient._id.toString());
  if(recipient) {
    io.to(recipient.socketId).emit("messageDeleted", msg);
  }
}

// Notificar al remitente que sus mensajes fueron leídos por el recipiente
const onMessagesRead = (io, data) => {
  const {senderId, seenById, updatedMessages} = data;

  const recipient = global.users.find(el => el.userId.toString() === senderId.toString());
  
  if(recipient && recipient !== seenById.toString()) {
    io.to(recipient.socketId).emit("readMessages", updatedMessages);
  }
}

module.exports = {
  onNewMessage,
  onDeletedMessage,
  onMessagesRead
}