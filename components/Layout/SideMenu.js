import {useState, useEffect, useContext} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import {List, Icon} from "semantic-ui-react";
import {UserContext} from "../../context/UserContext";
import {UnreadMessagesContext} from "../../context/UnreadMessagesContext";
import styles from "./sideMenu.module.css";

const SideMenu = ({user: {unreadNotification, unreadMessage, username, email}}) => {
  const userContext = useContext(UserContext);
  const {unreadCount, setAllRead} = useContext(UnreadMessagesContext);
  const router = useRouter();

  console.log({unreadCount});

  const [activeRoute, setActiveRoute] = useState(null);
  
  useEffect(() => {
    setActiveRoute(router.pathname);
  }, [router.pathname]);

  return (
    <>
      <List
        style={{paddingTop: "1rem"}}
        size="big"
        verticalAlign="middle"
        selection
      >
        <Link href="/">
          <List.Item
            style={{padding: "10px", marginBottom: "10px"}}
            active={activeRoute === "/"}
            onClick={() => setActiveRoute("/")}
          >
            <Icon
              name="home"
              size="large"
              color={activeRoute === "/" ? "teal" : "grey"}
            />
            <List.Content>
              <List.Header content="Home" />
            </List.Content>
          </List.Item>
        </Link>

        <Link href="/messages">
          <List.Item
            className={styles["side-menu__list-item"]}
            active={activeRoute === "/messages"}
            onClick={() => setActiveRoute("/messages")}
          >
            <div className={styles["side-menu__icon-wrapper"]}>
              <Icon
                name={unreadCount > 0 ? "mail" : "mail outline"}
                size="large"
                color={activeRoute === "/messages" ? "teal" : "grey"}
              />
              {unreadCount > 0 &&
                <div className={styles["side-menu__icon-badge"]}>
                  {unreadCount}
                </div>
              }
            </div>
            <List.Content>
              <List.Header content="Messages" />
            </List.Content>
          </List.Item>
        </Link>

        <Link href="/notifications">
          <List.Item
            style={{padding: "10px", marginBottom: "10px"}}
            active={activeRoute === "/notifications"}
            onClick={() => setActiveRoute("/notifications")}
          >
            <Icon
              name={unreadMessage ? "hand point right" : unreadNotification ? "bell" : "bell outline"}
              size="large"
              color={activeRoute === "/notifications" ? "teal" : unreadNotification ? "orange" : "grey"}
            />
            <List.Content>
              <List.Header content="Notifications" />
            </List.Content>
          </List.Item>
        </Link>

        <Link href={`/profile`}>
          <List.Item
            style={{padding: "10px", marginBottom: "10px"}}
            active={activeRoute === `/profile`}
            onClick={() => setActiveRoute(`/profile`)}
          >
            <Icon
              name="user"
              size="large"
              color={activeRoute === `/profile` ? "teal" : "grey"}
            />
            <List.Content>
              <List.Header content="Account" />
            </List.Content>
          </List.Item>
        </Link>

        <List.Item
          style={{padding: "10px"}}
          onClick={() => userContext.logOut()}
        >
          <Icon name="log out" size="large" />
          <List.Content>
            <List.Header content="Logout" />
          </List.Content>
        </List.Item>
      </List>
    </>
  )
}

export default SideMenu;
