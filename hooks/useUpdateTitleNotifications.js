import {useEffect, useState, useContext} from "react";
import {useRouter} from "next/router";
import {NotificationsContext} from "../context/NotificationsContext";
import {UnreadMessagesContext} from "../context/UnreadMessagesContext";

/**
 * Actualizar el title de las páginas
 * agregando o removiendo las notificaciones sin leer.
 * @returns {string} El title actualizado acorde con las notificaciones.
 */
const UseUpdateTitleNotifications = (currentTitle) => {
  const {route} = useRouter();

  const {unreadMessages} = useContext(UnreadMessagesContext);
  const {unreadNotifications} = useContext(NotificationsContext);

  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    if((unreadMessages || unreadNotifications) > 0) {
      setTitle(`(${unreadMessages + unreadNotifications}) ${currentTitle}`);
    } else {
      setTitle((currentTitle).replace(/\(\d+\)\s/, ""))
    };
  }, [currentTitle, unreadMessages, unreadNotifications, route]);

  return title;
};

export default UseUpdateTitleNotifications;