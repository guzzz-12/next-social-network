import {createContext, useState} from "react";

export const UnreadMessagesContext = createContext({
  unreadMessages: 0,
  unreadMessagesInitialized: false,
  initializeUnreadMessages: () => {},
  updateUnreadMessages: () => {},
  resetUnreadMessages: () => {},
  setUnreadMessages: () => {}
});

const UnreadMsgsContextProvider = ({children}) => {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadMessagesInitialized, setUnreadMessagesInitialized] = useState(false);

  // Inicializar el contador de mensjaes nuevos en la primera carga de la página
  // y al actualizar la página con F5
  const initializeUnreadMessages = (num) => {
    setUnreadMessages(num);
    setUnreadMessagesInitialized(true);
  }

  // Actualizar las notificaciones entrantes en tiempo real
  const updateUnreadMessages = () => {
    setUnreadMessages(prev => prev + 1);
  }

  // Resetear las notificaciones a cero al leerlas
  const resetUnreadMessages = () => {
    setUnreadMessages(0)
  }

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadMessages,
        unreadMessagesInitialized,
        initializeUnreadMessages,
        updateUnreadMessages,
        resetUnreadMessages,
        setUnreadMessages
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export default UnreadMsgsContextProvider;
