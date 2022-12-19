import {useEffect} from "react";

/**
 * Listener de los eventos de los mensajes leídos
 * para actualizar el status visto de los mensajes en tiempo real.
 * @param {*} setSelectedChatMessages Callback para actualizar el state de los mensajes leídos.
 * @param {*} socket Instancia de socket.io
 * @returns null
 */
const UseSeenMessages = (setSelectedChatMessages, socket) => {
  useEffect(() => {
    socket.on("readMessages", (update) => {
      setSelectedChatMessages(prev => {
        const currentMessages = [...prev];

        update.forEach(updatedItem => {
          const index = currentMessages.findIndex(el => el._id.toString() === updatedItem._id.toString());
          currentMessages.splice(index, 1, updatedItem);
        });

        return currentMessages;
      })
    });
  }, [setSelectedChatMessages, socket])
  
  return null;
}

export default UseSeenMessages;