import {useEffect, useContext, useRef, useState} from "react";
import {useRouter} from "next/router";
import {toast} from "react-toastify";
import {SocketContext} from "../context/SocketProvider";
import {UnreadMessagesContext} from "../context/UnreadMessagesContext";
import {NotificationsContext} from "../context/NotificationsContext";
import {UserContext} from "../context/UserContext";

/*----------------------------------------------*/
// Contenido del toast de nuevo mensaje entrante
/*----------------------------------------------*/
const NewMsgToastContent = ({msg, router}) => {
  const {avatar, name} = msg.sender;

  return (
    <div className="new-msg-toast" onClick={() => router.push("/messages")}>
      <img src={avatar} className="new-msg-toast__avatar" />
      <div className="new-msg-toast__content">
        <strong>
          {name}
        </strong>
        <span>
          {msg.text.substring(0, 50)}...
        </span>
      </div>
    </div>
  )
}


const NotificationsEventListener = () => {
  const router = useRouter();
  const {socket} = useContext(SocketContext);
  const {updateUnreadMessages} = useContext(UnreadMessagesContext);
  const {updateUnreadNotifications} = useContext(NotificationsContext);
  const {showNewMessagePopup} = useContext(UserContext);

  const [newIncomingMsg, setNewIncomingMsg] = useState(null);

  /*--------------------------------------------*/
  // Disparar el toast de nuevo mensaje recibido
  /*--------------------------------------------*/
  useEffect(() => {
    if(!router.pathname.includes("messages") && showNewMessagePopup && !!newIncomingMsg) {
      toast.dismiss();
      toast.dark(
        <NewMsgToastContent msg={newIncomingMsg} router={router} />,
        {
          onClose: setNewIncomingMsg(null)
        }
      )
    }
  }, [showNewMessagePopup, newIncomingMsg]);

  
  /*---------------------------------------------------------------------------*/
  // Actualizar el contador de notificaciones al recibir una nueva notificación
  /*---------------------------------------------------------------------------*/
  const unreadNotificationsRef = useRef(() => {
    return socket.on("receivedNotification", () => {
      console.log("receivedNotification")
      updateUnreadNotifications()
    });
  });

  /*--------------------------------------------*/
  // Actualizar el contador de mensajes sin leer
  /*--------------------------------------------*/
  const unreadMsgsRef = useRef(() => {
    return socket.on("newMessagesCounterUpdated", ({msg}) => {
      // Incrementar el contador de mensajes en el sidebar
      updateUnreadMessages();
      setNewIncomingMsg(msg);
    })
  });


  // Actualizar el contador de notificaciones al recibir
  // notificaciones de comentarios en posts suscritos
  const commentNotificationOnSubscribedPost = useRef(() => {
    return socket.on("commentNotificationToPostFollowers", () => {
      console.log("commentNotificationToPostFollowers");
      updateUnreadNotifications();
    })
  });


  /*------------------------------------------------*/
  // Inicializar los listeners al entrar a la página
  /*------------------------------------------------*/
  useEffect(() => {
    unreadMsgsRef.current();
    unreadNotificationsRef.current();
    commentNotificationOnSubscribedPost.current()
  }, []);

  return null;
}

export default NotificationsEventListener
