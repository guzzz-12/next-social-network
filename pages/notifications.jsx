import {Fragment, useState, useEffect, useContext, useRef} from "react";
import {Container, Feed, Segment, Visibility, Header, Icon, Message, Divider, Loader} from "semantic-ui-react";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies} from "nookies";

import unauthRedirect from "../utilsServer/unauthRedirect";
import CommentNotification from "../components/notifications/CommentNotification";
import FollowerNotification from "../components/notifications/FollowerNotification";
import LikeNotification from "../components/notifications/LikeNotification";
import {UserContext} from "../context/UserContext";

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const NotificationsPage = (props) => {
  const cancellerRef = useRef();
  const userContext = useContext(UserContext);
  
  // State de las notificaciones
  const [notifications, setNotifications] = useState(props.notifications);

  // State de la paginación
  const [loadMore, setLoadMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(props.error);


  /*-----------------------------------------------------------------------*/
  // Marcar notificaciones como leídas al entrar a la página notificaciones
  /*-----------------------------------------------------------------------*/
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


  /*---------------------------*/
  // Paginar las notificaciones
  /*---------------------------*/
  useEffect(() => {
    if(!isLastPage && loadMore && currentPage > 1) {
      setLoadingMore(true);

      // Cancelar el request anterior en caso de repetirlo
      cancellerRef.current && cancellerRef.current();

      axios({
        method: "GET",
        url: `/api/notifications?page=${currentPage}`,
        cancelToken: new CancelToken((canceller) => {
          cancellerRef.current = canceller
        })
      })
      .then(res => {
        if(res.data.data.length > 0) {
          setNotifications(prev => [...prev, ...res.data.data])
          setCurrentPage(prev => prev + 1);
          setLoadMore(false);
          setLoadingMore(false);
  
        } else {
          setIsLastPage(true);
          setLoadMore(false);
          setLoadingMore(false);
        }
      })
      .catch(err => {
        let message = err.message;
        if(err.response) {
          message = err.response.data.message
        }
        setLoadMore(false);
        setLoadingMore(false);
        setErrorMsg(message);
      })
    }

  }, [isLastPage, loadMore]);


  /*------------------------------------------------------------*/
  // Verificar si el scroll llegó al fondo de las notificaciones
  /*------------------------------------------------------------*/
  const onScrollHandler = (e, {calculations}) => {
    if(calculations.bottomVisible) {
      setLoadMore(true)
    } else {
      setLoadMore(false)
    }
  }


  return (
    <Container style={{marginTop: "1rem"}}>
      {notifications.length > 0 &&
        <Segment>
          <Header style={{marginTop: "10px"}} as="h3" textAlign="center">
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
              height: "80vh",
              overflow: "auto"
            }}
          >
            <Visibility onUpdate={onScrollHandler}>
              <Feed style={{paddingRight: "10px"}} size="small">
                {notifications.map(el => {
                  return (
                    <Fragment key={el._id}>
                      {el.notificationType === "like" &&
                        <>
                          <LikeNotification notification={el}/>
                          <Divider />
                        </>
                      }
                      {el.notificationType === "comment" &&
                        <>
                          <CommentNotification notification={el}/>
                          <Divider />
                        </>
                      }
                      {el.notificationType === "follower" &&
                        <>
                          <FollowerNotification notification={el}/>
                          <Divider />
                        </>
                      }
                    </Fragment>
                  )
                })}
              </Feed>
            </Visibility>

            {/* Loader indicador de paginación */}
            {loadingMore &&
              <div style={{padding: "1rem 0"}}>
                <Loader active content="Loading..."  inline="centered" />
              </div>
            }

            {/* Mensaje para indicar que no hay más notificaciones */}
            {isLastPage &&
              <Message
                style={{textAlign: "center"}}
                content="You don't have more notifications"
              />
            }
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

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);  

    // Setear el token en los cookies del request
    axios.defaults.headers.get.Cookie = `token=${token}`;

    const res = await axios({
      method: "GET",
      url: `${req.protocol}://${req.get("host")}/api/notifications?page=1`
    });

    return {
      props: {
        notifications: res.data.data
      }
    }
    
  } catch (error) {
    let message = error.message;

    if(error.response) {
      message = error.response.data.message;
    }    
    
    // Redirigir al login si hay error de token
    if(message.includes("jwt") || message.includes("signature")) {
      return unauthRedirect(message, context);
    }
    
    console.log(`Error fetching posts: ${message}`);

    return {
      props: {
        error: message
      }
    }
  }
}

export default NotificationsPage;