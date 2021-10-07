import {useEffect, useContext, useRef} from "react";
import {SocketContext} from "../context/SocketProvider";
import {UnreadMessagesContext} from "../context/UnreadMessagesContext";
import {NotificationsContext} from "../context/NotificationsContext";

const NotificationsEventListener = () => {
  const {socket} = useContext(SocketContext);
  const {setUnreadMessages} = useContext(UnreadMessagesContext);
  const {updateUnreadNotifications} = useContext(NotificationsContext);
  
  // Actualizar el contador de notificaciones al recibir una nueva notificación
  const unreadNotificationsRef = useRef(() => {
    return socket.on("receivedNotification", () => {
      console.log("receivedNotification")
      updateUnreadNotifications()
    });
  });

  // Actualizar el contador de mensajes sin leer
  const unreadMsgsRef = useRef(() => {
    return socket.on("newMessageReceived", () => {
      setUnreadMessages(prev => prev + 1)
    })
  })

  useEffect(() => {
    unreadMsgsRef.current();
    unreadNotificationsRef.current();
  }, [])

  return null;
}

export default NotificationsEventListener
