import {useEffect, useContext} from "react";
import {useRouter} from "next/router";
import axios from "axios";
import {UnreadMessagesContext} from "../context/UnreadMessagesContext";
import {NotificationsContext} from "../context/NotificationsContext";

/**
 * Custom hook para volver a consultar las notificaciones y mensajes sin leer
 * para reinicializar los contadores del sidebar al hacer hard refresh.
 */
const useReinitializeNotifications = () => {
  const {pathname} = useRouter();

  const {setUnreadMessages, unreadMessagesInitialized} = useContext(UnreadMessagesContext);
  const {initializeUnreadNotifications, notificationsInitialized} = useContext(NotificationsContext);

  const refetchNotifications = async () => {
    try {
      // Consultar si hay mensajes sin leer
      if(pathname !== "/messages") {
        const unreadMsgs = await axios.get(`/api/chats/unread-messages`);
        setUnreadMessages(unreadMsgs.data.data);
      };

      // Consultar las notificaciones no leídas
      if(pathname !== "/notifications") {
        const unreadNotifications = await axios.get(`/api/notifications/unread`);
        initializeUnreadNotifications(unreadNotifications.data.data.length);
      };
      
    } catch (error) {
      console.log(`Error consultando notificaciones y mensajes sin leer: ${error.message}`)
    }
  };

  useEffect(() => {
    if(!unreadMessagesInitialized && !notificationsInitialized) {
      refetchNotifications()
    };

  }, [unreadMessagesInitialized, notificationsInitialized, pathname]);
};

export default useReinitializeNotifications;