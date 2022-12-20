import {useEffect, useContext} from "react";
import {UnreadMessagesContext} from "../context/UnreadMessagesContext";
import {NotificationsContext} from "../context/NotificationsContext";

/**
 * Inicializar los contadores de notificaciones sin leer.
 * @param {number} unreadMessages 
 * @param {number} unreadNotifications 
 * @returns null
 */
const useInitializeNotificationCounters = (unreadMessages, unreadNotifications) => {
  const {initializeUnreadMessages} = useContext(UnreadMessagesContext);
  const {initializeUnreadNotifications} = useContext(NotificationsContext);

  /*----------------------------------------------------------*/
  // Mostrar el número de mensajes sin leer al entrar a la app
  /*----------------------------------------------------------*/
  useEffect(() => {
    if(unreadMessages > 0) {
      initializeUnreadMessages(unreadMessages);
    }
  }, [unreadMessages]);

  /*-----------------------------------------------------------------*/
  // Mostrar el número de notificaciones sin leer al entrar a la app
  /*-----------------------------------------------------------------*/
  useEffect(() => {
    if(unreadNotifications?.length > 0) {
      initializeUnreadNotifications(unreadNotifications.length)
    }
  }, [unreadNotifications]);

  return null;
}

export default useInitializeNotificationCounters