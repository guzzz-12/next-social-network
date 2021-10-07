
/*---------------------------------------*/
// Notificar que el chat fue deshabilitado
/*---------------------------------------*/
const disabledChat = (io, chat) => {
  const {user, messagesWith, disabledBy} = chat;

  const userToNotify = disabledBy.toString() === user._id.toString() ? messagesWith._id.toString() : user._id.toString();

  const recipient = global.users.find(el => el.userId.toString() === userToNotify);
  if(recipient) {
    io.to(recipient.socketId).emit("chatDisabled", chat);
  }
}


/*-------------------------------------*/
// Notificar que el chat fue habilitado
/*-------------------------------------*/
const enabledChat = (io, data) => {
  const {updatedChat, enabledBy} = data;
  const {user, messagesWith} = updatedChat;

  const userToNotify = enabledBy.toString() === user._id.toString() ? messagesWith._id.toString() : user._id.toString();

  const recipient = global.users.find(el => el.userId.toString() === userToNotify);
  if(recipient) {
    io.to(recipient.socketId).emit("chatEnabled", updatedChat);
  }
}

module.exports = {
  disabledChat,
  enabledChat
}