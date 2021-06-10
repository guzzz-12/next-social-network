import {useState, useEffect, useContext} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import {List, Icon} from "semantic-ui-react";
import {UserContext} from "../../context/UserContext";
import {UnreadMessagesContext} from "../../context/UnreadMessagesContext";
import {NotificationsContext} from "../../context/NotificationsContext";
import {SocketContext} from "../../context/SocketProvider";
import styles from "./sideMenu.module.css";

const SideMenu = ({isDesktop, isPhone}) => {
  const userContext = useContext(UserContext);
  const {setUnreadMessages, unreadMessages} = useContext(UnreadMessagesContext);
  const {unreadNotifications, setUnreadNotifications} = useContext(NotificationsContext);
  const {socket} = useContext(SocketContext);

  const router = useRouter();

  const [activeRoute, setActiveRoute] = useState(null);

  // Actualizar el contador de mensajes al recibir un nuevo mensaje
  // y el contador de notificaciones al recibir una nueva notificación
  useEffect(() => {
    if(socket && router.pathname !== "/messages") {
      socket.on("newMessageReceived", () => {
        setUnreadMessages(prev => prev + 1)
      })
    }

    if(socket) {
      socket.on("receivedNotification", () => {
        console.log("receivedNotification")
        setUnreadNotifications(prev => prev + 1)
      })
    }

  }, [socket]);
  
  useEffect(() => {
    setActiveRoute(router.pathname);
  }, [router.pathname]);

  return (
    <List
      style={{
        display: isPhone ? "flex" : "inline-block",
        justifyContent: "space-between",
        width: isPhone ? "100%" : "auto",
        marginTop: isPhone ? "10px" : 0,
        marginBottom : isPhone ? 0 : "1rem",
        paddingTop: "1rem"
      }}
      size="big"
      verticalAlign="middle"
      selection
      horizontal={isPhone}
    >
      <Link href="/">
        <List.Item
          style={{
            marginBottom: isPhone ? 0 : "10px",
            justifyContent: isDesktop ? "flex-start" : "center"
          }}
          className={styles["side-menu__list-item"]}
          active={activeRoute === "/"}
          onClick={() => setActiveRoute("/")}
        >
          <Icon
            name="home"
            size="large"
            color={activeRoute === "/" ? "teal" : "grey"}
          />
          {/* Mostrar el texto del item sólo en desktop */}
          {isDesktop &&
            <List.Content>
              <List.Header content="Home" />
            </List.Content>
          }
        </List.Item>
      </Link>

      <Link href="/messages">
        <List.Item
          style={{
            marginBottom: isPhone ? 0 : "10px",
            justifyContent: isDesktop ? "flex-start" : "center"
          }}
          className={styles["side-menu__list-item"]}
          active={activeRoute === "/messages"}
          onClick={() => setActiveRoute("/messages")}
        >
          <div className={styles["side-menu__icon-wrapper"]}>
            <Icon
              name={unreadMessages > 0 ? "mail" : "mail outline"}
              size="large"
              color={activeRoute === "/messages" ? "teal" : "grey"}
            />
            {unreadMessages > 0 &&
              <div className={styles["side-menu__icon-badge"]}>
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </div>
            }
          </div>
          {/* Mostrar el texto del item sólo en desktop */}
          {isDesktop &&
            <List.Content style={{marginLeft: "1rem"}}>
              <List.Header content="Messages" />
            </List.Content>
          }
        </List.Item>
      </Link>

      <Link href="/notifications">
        <List.Item
          style={{
            marginBottom: isPhone ? 0 : "10px",
            justifyContent: isDesktop ? "flex-start" : "center"
          }}
          className={styles["side-menu__list-item"]}
          active={activeRoute === "/notifications"}
          onClick={() => {
            setActiveRoute("/notifications");
            setUnreadNotifications(0)
          }}
        >
          <div className={styles["side-menu__icon-wrapper"]}>
            <Icon
              name={unreadNotifications?.length > 0 ? "bell" : "bell outline"}
              size="large"
              color={activeRoute === "/notifications" ? "teal" : "grey"}
            />
            {unreadNotifications?.length > 0 &&
              <div className={styles["side-menu__icon-badge"]}>
                {unreadNotifications?.length > 99 ? "99+" : unreadNotifications?.length > 0 ? unreadNotifications.length : ""}
              </div>
            }
          </div>
          {/* Mostrar el texto del item sólo en desktop */}
          {isDesktop &&
            <List.Content style={{marginLeft: "1rem"}}>
              <List.Header content="Notifications" />
            </List.Content>
          }
        </List.Item>
      </Link>

      <Link href={`/profile`}>
        <List.Item
          style={{
            marginBottom: isPhone ? 0 : "10px",
            justifyContent: isDesktop ? "flex-start" : "center"
          }}
          className={styles["side-menu__list-item"]}
          active={activeRoute === `/profile`}
          onClick={() => setActiveRoute(`/profile`)}
        >
          <Icon
            name="user outline"
            size="large"
            color={activeRoute === `/profile` ? "teal" : "grey"}
          />
          {/* Mostrar el texto del item sólo en desktop */}
          {isDesktop &&
            <List.Content>
              <List.Header content="Account" />
            </List.Content>
          }
        </List.Item>
      </Link>

      <List.Item
        style={{padding: "10px", textAlign: isDesktop ? "left" : "center"}}
        onClick={() => userContext.logOut()}
      >
        <Icon name="log out" size="large" />
        {/* Mostrar el texto del item sólo en desktop */}
        {isDesktop &&
          <List.Content>
            <List.Header content="Logout" />
          </List.Content>
        }
      </List.Item>
    </List>
  )
}

export default SideMenu;
