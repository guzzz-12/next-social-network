import {useEffect} from "react";

/**
 * Custom hook para deshabilitar el chat en la bandeja del recipiente en tiempo real.
 * @param {*} setChats Callback para actualizar el state de los chats.
 * @param {*} socket Instancia de socket.io.
 * @param {*} chatItemClickHandler Callback para resetear la bandeja al seleccionar otro item.
 * @param {*} selectedChat Chat atualmente seleccionado.
 * @returns null
 */
const useChatDisabled = (setChats, socket, chatItemClickHandler, selectedChat) => {
  useEffect(() => {
    socket.on("chatDisabled", (data) => {
      const chatId = data._id.toString();
      const selectedChatId = selectedChat._id;

      // Si el chat seleccionado fue deshabilitado, actualizarlo
      if(chatId === selectedChatId?.toString()) {
        chatItemClickHandler(data);
      }

      // Actualizar el status del chat en la lista de chats
      setChats(prev => {
        const updatedChats = [...prev];
        const chatIndex = updatedChats.findIndex(el => el._id.toString() === chatId);
        updatedChats.splice(chatIndex, 1, data);
        return updatedChats;
      })
    });
  }, []);

  return null;
}

export default useChatDisabled