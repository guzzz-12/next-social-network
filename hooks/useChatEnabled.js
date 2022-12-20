import {useEffect} from "react";

/**
 * Custom hook para volver a habilitar el chat en la bandeja del recipiente en tiempo real.
 * @param {*} setChats Callback para actualizar el state de los chats.
 * @param {*} socket Instancia de socket.io.
 * @param {*} selectedChat Chat atualmente seleccionado.
 * @param {*} setSelectedChat Callback para actualizar el state del chat seleccionado.
 * @returns null
 */
const UseChatEnabled = (setChats, socket, selectedChat, setSelectedChat) => {
  useEffect(() => {
    socket.on("chatEnabled", (data) => {
      const chatId = data._id.toString();
      const selectedChatId = selectedChat._id;

      // Si el chat seleccionado fue habilitado, actualizarlo
      if(chatId === selectedChatId?.toString()) {
        setSelectedChat(data);
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

export default UseChatEnabled;