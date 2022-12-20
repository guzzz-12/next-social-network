import axios from "axios";

/**
 * Enviar consulta para bloquear/desbloquar el chat y
 * emitir evento de chat bloqueado/desbloqueado al usuario recipiente.
 * @param {*} chatId La ID del chat a bloquear/desbloquear.
 * @param {*} chats State de los chats.
 * @param {*} currentUser Usuario actualmente logueado.
 * @param {*} setSelectedChat Actualizar el state del chat seleccionado.
 * @param {*} setError Callback para actualizar el state en caso de errores de backend.
 * @param {*} setChats Callback para actualizar el state de los chats.
 * @param {*} socket Instancia de socket.io.
 * @param {*} setDisablingChat Callback para actualizar el state de loading.
 */
export const disableChat = async (
  chatId,
  chats,
  currentUser,
  setSelectedChat,
  setError,
  setChats,
  socket,
  setDisablingChat
) => {
  try {
    setError(null);
    setDisablingChat(true);
    
    const res = await axios({
      method: "PATCH",
      url: `/api/chats/disable-chat/${chatId}`
    });

    console.log({response: res.data.data});
    const updatedChat = res.data.data;

    // Buscar el índice del chat en el state
    const chatIndex = [...chats].findIndex(el => el._id.toString() === chatId.toString());

    // Actualizar el status del chat en el state
    setChats(prev => {
      const updated = [...prev];
      updated.splice(chatIndex, 1, updatedChat);
      return updated;
    });

    // Emitir el chat deshabilitado
    if(updatedChat.status === "inactive") {
      socket.emit("disabledChat", updatedChat);
    }

    // Emitir el chat habilitado
    if(updatedChat.status === "active") {
      socket.emit("enabledChat", {updatedChat, enabledBy: currentUser._id})
    }

    setSelectedChat(updatedChat);
    
  } catch (error) {
    let message = error.message;
    if(error.response) {
      message = error.response.data.message
    }

    console.log(`Error disabling/enabling chat: ${message}`)

    setError(message);

  } finally {
    setDisablingChat(false);
  }
};