import axios from "axios";

/**
 * Enviar un mensaje.
 * @param {*} currentUser El usuario actualmente logueado (Remitente).
 * @param {*} chat El chat seleccionado.
 * @param {*} socket Instancia de socket.io.
 * @param {*} inboxRef Ref del inbox.
 * @param {*} text Texto del mensaje a enviar.
 * @param {*} setSending Callback para actualizar el loader del envío del mensaje.
 * @param {*} setSelectedChatMessages Callback para actualizar el state de los mensajes del chat.
 * @param {*} setText Callback para actualizar el state del texto del mensaje.
 * @param {*} setError Callback para actualizar el state de los mensajes de error.
 */
export const sendMessage = async (
  currentUser,
  chat,
  socket,
  inboxRef,
  text,
  setSending,
  setSelectedChatMessages,
  setText,
  setError
  ) => {
  try {
    setSending(true);

    const recipient = currentUser._id === chat.user._id ? chat.messagesWith._id : chat.user._id;

    const res = await axios({
      method: "POST",
      url: `/api/chats/${chat._id}/message/${recipient}`,
      data: {messageText: text}
    });

    // console.log({msgResponse: res.data.data});
    const newMessage = res.data.data;
    
    // Emitir el nuevo mensaje enviado al recipiente
    socket.emit("newMessage", {newMsg: newMessage, chatId: chat._id});
    socket.emit("updateNewMessagesCounter", {
      chatId: chat._id,
      recipientId: newMessage.recipient._id,
      msg: newMessage
    });

    setSelectedChatMessages(prev => [...prev, newMessage]);
    setText("");

    // Scrollear al fondo de la bandeja al enviar un mensaje
    inboxRef.current.scrollTop = inboxRef.current.scrollHeight;
    
  } catch (error) {
    let message = error.mesage;

    if(error.response) {
      message = error.response.data.message
    };

    setError(message);
    
  } finally {
    setSending(false);
  }
}