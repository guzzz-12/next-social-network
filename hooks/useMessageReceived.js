import {useEffect} from "react";

/**
 * Recibir los mensajes entrantes y actualizarla bandeja del recipiente en tiempo real.
 * @param {{setSelectedChatMessages, socket, selectedChat, router, inboxRef}} config 
 * @returns null
 */
const useMessageReceived = (config) => {
  const {setSelectedChatMessages, socket, selectedChat, router, inboxRef} = config;

  useEffect(() => {
    if(selectedChat._id) {
      socket.on("newMessageReceived", async ({newMsg, chatId}) => {
        const selectedChatId = selectedChat._id;
  
        // Actualizar el state de los mensajes con el nuevo mensaje entrante
        if(selectedChatId && chatId.toString() === selectedChatId.toString()) {
          setSelectedChatMessages(prev => {
            // Filtrar los mensajes duplicados
            const filteredDuplicates = [...prev, newMsg].reduce((acc, item) => {
              const x = acc.find(el => el._id === item._id);
              if(!x) {
                return acc.concat(item)
              } else {
                return acc
              }
            },[]);
  
            return filteredDuplicates
          });
          
          // Scrollear al fondo de la bandeja al recibir el nuevo mensaje
          if(router.pathname === "/messages" && inboxRef.current) {
            inboxRef.current.scrollTop = inboxRef.current.scrollHeight;
          }
        }
      });
    };

    // Reiniciar el listener de nuevo mensaje recibido al seleccionar otro chat
    // para inicializarlo con la id del chat seleccionado
    // y evitar que los mensajes entrantes se agreguen a la bandeja equivocada
    return () => socket.off("newMessageReceived");

  }, [selectedChat, socket, setSelectedChatMessages, inboxRef]);

  return null;
}

export default useMessageReceived;