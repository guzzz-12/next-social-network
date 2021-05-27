import {useState, useEffect, useContext} from "react";
import {Container, Feed, Segment, Header, Icon, Divider} from "semantic-ui-react";
import axios from "axios";
import {parseCookies} from "nookies";

import CommentNotification from "../components/notifications/CommentNotification";
import FollowerNotification from "../components/notifications/FollowerNotification";
import LikeNotification from "../components/notifications/LikeNotification";
import {UserContext} from "../context/UserContext";

const NotificationsPage = (props) => {
  const {notifications} = props.notifications;

  const userContext = useContext(UserContext);

  // console.log({notifications});

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Marcar notificaciones como leídas al entrar a la página notificaciones
  useEffect(() => {
    setLoading(true);
    setErrorMsg(false);

    axios({
      method: "PATCH",
      url: "/api/notifications"
    })
    .then(res => {
      const {user, isUpdated} = res.data.data;
      isUpdated && userContext.setCurrentUser(user);
      setLoading(false);
    })
    .catch(error => {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message;
      }
      setLoading(false);
      setErrorMsg(message)
    });

  }, []);

  return (
    <Container style={{marginTop: "1rem"}}>
      {notifications.length > 0 &&
        <Segment>
          <Header as="h3" textAlign="center">
            <Icon
              style={{display: "block", margin: "0 auto"}}
              name="tasks"
            />
            Notifications
          </Header>

          <Divider />

          <div
            style={{
              position: "relative",
              width: "100%",
              height: "40rem",
              maxHeight: "40rem",
              overflow: "auto"
            }}
          >
            <Feed size="small">
              {notifications.map(el => {
                return (
                  <>
                    {el.notificationType === "like" &&
                      <>
                        <LikeNotification key={el._id} notification={el}/>
                        <Divider />                     
                      </>
                    }
                    {el.notificationType === "comment" &&
                      <>
                        <CommentNotification key={el._id} notification={el}/>
                        <Divider />
                      </>
                    }
                    {el.notificationType === "follower" &&
                      <>
                        <FollowerNotification key={el._id} notification={el}/>
                        <Divider />
                      </>
                    }
                  </>
                )
              })}
            </Feed>
          </div>
        </Segment>
      }

      {notifications.length === 0 && <p>No new notifications</p> }
      
    </Container>
  )
}

export async function getServerSideProps(context) {
  try {
    const {token} = parseCookies(context);
    const {req} = context;

    axios.defaults.headers.get.Cookie = `token=${token}`;

    const res = await axios({
      method: "GET",
      url: `${req.protocol}://${req.get("host")}/api/notifications`
    });

    return {
      props: {
        notifications: res.data.data
      }
    }
    
  } catch (error) {
    return {
      props: {
        error: error.message
      }
    }
  }
}

export default NotificationsPage;