import {useEffect} from "react";

/**
 * Listener de los eventos de los mensajes eliminados
 * para eliminar en tiempo real el mensaje en la bandeja del recipiente.
 * @param {*} setSelectedChatMessages Callback para actualizar el state de los mensajes.
 * @param {*} socket Instancia de socket.io
 * @returns null
 */
const useMessageDeleted = (setSelectedChatMessages, socket) => {
  useEffect(() => {
    socket.on("messageDeleted", (data) => {
      setSelectedChatMessages(prev => {
        const updatedMsgs = [...prev];
        const msgIndex = updatedMsgs.findIndex(el => el._id.toString() === data._id.toString());
        updatedMsgs.splice(msgIndex, 1, data);
        return updatedMsgs;
      })
    });
  }, [setSelectedChatMessages, socket]);

  return null;
}

export default useMessageDeleted;