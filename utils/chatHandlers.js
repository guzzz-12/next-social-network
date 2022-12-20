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


/**
 * 
 * @param {*} messagesWith Recipiente del chat.
 * @param {*} chats State actual de los chats.
 * @param {*} setChats Callback para actualizar el state de los chats.
 * @param {*} socket Instancia de socket.io.
 * @param {*} setError Callback para actualizar el state de los mensajes de error.
 * @param {*} setLoading Callback para actualizar el state del loader general.
 * @param {*} setLoadMore Callback para actualizar el state del loader de cargar más mensajes.
 * @param {*} setLoadingMore Callback para actualizar el state del loader de cargar más mensajes.
 * @param {*} setCurrentPage Callback para actualizar el state de la paginación.
 * @param {*} setSelectedChat Callback para actualizar el state del chat seleccionado.
 * @param {*} setInitialMessagesLoad Callback para actualizar el state de los mensajes iniciales.
 * @param {*} setEndResults Callback para actualizar el state de la última página de mensajes.
 * @param {*} setLastLoadedMsg Callback para actualizar el state del último mensaje cargado.
 */
export const createChat = async (
  messagesWith,
  chats,
  setChats,
  socket,
  setError,
  setLoading,
  setLoadMore,
  setLoadingMore,
  setCurrentPage,
  setSelectedChat,
  setInitialMessagesLoad,
  setEndResults,
  setLastLoadedMsg
  ) => {
  try {
    setError(null);
    setLoading(true);
    setLoadingMore(true);
    setCurrentPage(1);
    setSelectedChat({});
    setInitialMessagesLoad(false);
    setEndResults(false);
    setLastLoadedMsg(null);
    
    const res = await axios({
      method: "POST",
      url: `/api/chats/${messagesWith}`
    });

    const newChat = res.data.data;
    
    // Verificar si el chat ya existe en la lista (en caso de buscar un chat existente)
    const index = chats.findIndex(chat => chat._id.toString() === newChat._id.toString());

    // Si el chat ya existe y ya hay chats en la lista,
    // borrar el item anterior y poner el nuevo de primero en la lista
    if(index !== -1 && chats.length > 0) {
      setChats(prev => {
        const current = [...prev];
        current.splice(index, 1);  
        return [newChat, ...current];
      });

    // Si el chat no existe y ya hay chats en lalista
    // agregar el nuevo chat creado a los chats actuales de primero en la lista
    // y emitir el evento de nuevo chat creado
    } else if(index === -1 && chats.length > 0) {
      setChats(prev => [newChat, ...prev]);
      socket.emit("chatCreated", newChat);
    
    // Si no hay chats en la lista, inicializar la lista con el nuevo chat creado
    // y emitir el evento de nuevo chat creado
    } else if(chats.length === 0) {
      setChats([newChat]);
      socket.emit("chatCreated", newChat);
    }
    
    setLoadMore(true);
    setSelectedChatMessages([]);
    setSelectedChat(newChat);
    
  } catch (error) {
    let message = error.mesage;

    if(error.response) {
      message = error.response.data.message
    };

    setError(message);

  } finally {
    setLoading(false);
  }
};