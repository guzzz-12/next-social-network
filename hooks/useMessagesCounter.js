import {useEffect} from "react";

/**
  * Custom hook para actualizar el contador de mensajes sin leer
  * en el item del chat al que pertenece el mensaje recibido
  * y poner el item de primero en la lista.
  */
const UseMessagesCounter = (setChats, socket) => {  
  useEffect(() => {
    socket.on("newMessagesCounterUpdated", ({chatId}) => {
      setChats(prev => {
        const current = [...prev];
        const index = current.findIndex(el => el._id.toString() === chatId.toString());
        const unreadMessages = current[index].unreadMessages || 0;
        const updatedChat = {...current[index], unreadMessages: unreadMessages + 1};
        current.splice(index, 1);
        return [updatedChat, ...current];
      });
    })
  }, [socket]);

  return null;
}

export default UseMessagesCounter;