import {createContext, useState} from "react";

export const NotificationsContext = createContext({
  unreadNotifications: 0,
  initializeUnreadNotifications: () => {},
  updateUnreadNotifications: () => {},
  resetNotifications: () => {}
});

const NotificationsContextProvider = ({children}) => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Inicializar las notificaciones sin leer en la primera carga de la página
  // y al actualizar la página con F5
  const initializeUnreadNotifications = (num) => {
    setUnreadNotifications(num)
  }

  // Actualizar las notificaciones entrantes en tiempo real
  const updateUnreadNotifications = () => {
    setUnreadNotifications(prev => prev + 1);
  }

  // Resetear las notificaciones a cero al leerlas
  const resetNotifications = () => {
    setUnreadNotifications(0)
  }

  return (
    <NotificationsContext.Provider
      value={{
        unreadNotifications,
        initializeUnreadNotifications,
        updateUnreadNotifications,
        resetNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export default NotificationsContextProvider;