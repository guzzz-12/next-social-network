import {useState, useEffect} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import {List, Icon} from "semantic-ui-react";
import { logoutUser } from "../../utils/logoutUser";

const SideMenu = ({user: {unreadNotification, unreadMessage, username, email}}) => {
  const router = useRouter();

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
            style={{padding: "10px", marginBottom: "10px"}}
            active={activeRoute === "/messages"}
            onClick={() => setActiveRoute("/messages")}
          >
            <Icon
              name={unreadMessage ? "hand point right" : "mail outline"}
              size="large"
              color={activeRoute === "/messages" ? "teal" : unreadMessage ? "orange" : "grey"}
            />
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
              name={unreadMessage ? "hand point right" : "bell outline"}
              size="large"
              color={activeRoute === "/notifications" ? "teal" : unreadNotification ? "orange" : "grey"}
            />
            <List.Content>
              <List.Header content="Notifications" />
            </List.Content>
          </List.Item>
        </Link>

        <Link href={`/${username}`}>
          <List.Item
            style={{padding: "10px", marginBottom: "10px"}}
            active={activeRoute === `/${username}`}
            onClick={() => setActiveRoute(`/${username}`)}
          >
            <Icon
              name="user"
              size="large"
              color={activeRoute === `/${username}` ? "teal" : "grey"}
            />
            <List.Content>
              <List.Header content="Account" />
            </List.Content>
          </List.Item>
        </Link>

        <List.Item
          style={{padding: "10px"}}
          onClick={() => logoutUser()}
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
