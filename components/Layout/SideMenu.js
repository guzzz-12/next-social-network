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
  const router = useRouter();

  const {currentUser, logOut} = useContext(UserContext);
  const {unreadMessages} = useContext(UnreadMessagesContext);
  const {unreadNotifications} = useContext(NotificationsContext);
  const {socket} = useContext(SocketContext);
  const [activeRoute, setActiveRoute] = useState(null);
  
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
          }}
        >
          <div className={styles["side-menu__icon-wrapper"]}>
            <Icon
              name={unreadNotifications > 0 ? "bell" : "bell outline"}
              size="large"
              color={activeRoute === "/notifications" ? "teal" : "grey"}
            />
            {unreadNotifications > 0 &&
              <div className={styles["side-menu__icon-badge"]}>
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
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
        onClick={() => {
          // Eliminar el usuario de los clientes de socket en el servidor
          // El evento cambia el status a offline en la lista del chat
          socket.emit("offline", {userId: currentUser._id});
          // Cerrar sesión
          logOut();
        }}
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
