import {Fragment, useState, useEffect, useContext, useRef} from "react";
import Head from "next/head";
import {Container, Feed, Segment, Visibility, Header, Icon, Message, Divider, Loader} from "semantic-ui-react";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies} from "nookies";

import unauthRedirect from "../utilsServer/unauthRedirect";
import CommentNotification from "../components/notifications/CommentNotification";
import FollowerNotification from "../components/notifications/FollowerNotification";
import LikeNotification from "../components/notifications/LikeNotification";
import {NotificationsContext} from "../context/NotificationsContext";
import {UserContext} from "../context/UserContext";
import useUpdateTitleNotifications from "../hooks/useUpdateTitleNotifications";
import useInitializeNotificationCounters from "../hooks/useInitializeNotificationCounters";
import {checkVerification} from "../utilsServer/verificationStatus";

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const NotificationsPage = (props) => {
  const cancellerRef = useRef();
  const {resetNotifications} = useContext(NotificationsContext);
  const {currentUser} = useContext(UserContext);
  
  // State de las notificaciones
  const [notifications, setNotifications] = useState(props.notifications);

  // State de la paginación
  const [loadMore, setLoadMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLastPage, setIsLastPage] = useState(false);

  const [_loading, setLoading] = useState(true);
  const [_errorMsg, setErrorMsg] = useState(props.error);

  const [deletingNotif, setDeletingNotif] = useState("");

  // Actualizar el title
  const updatedTitle = useUpdateTitleNotifications("Next Social Network | Notifications");

  // Mostrar el número de mensajes sin leer y de notificaciones
  // al entrar a la app o al actualizar las páginas.
  useInitializeNotificationCounters(props.unreadMessages, 0);


  /*-----------------------------------------------------------------------*/
  // Marcar notificaciones como leídas al entrar a la página notificaciones
  /*-----------------------------------------------------------------------*/
  useEffect(() => {
    setLoading(true);
    setErrorMsg(false);
    
    // Extraer las ids de las notificaciones sin leer
    let notSeen = [];
    notifications.forEach(el => {
      if(!el.seen) {
        notSeen.push(el._id)
      }
    });
    
    if(notSeen.length > 0) {
      axios({
        method: "PATCH",
        url: "/api/notifications",
        data: {notificationsIds: notSeen},
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(res => {
        const {updatedNotifications} = res.data.data;

        resetNotifications();
  
        // Actualizar el state de las notificaciones vistas
        setNotifications(prev => {
          const current = [...prev];
          updatedNotifications.forEach(el => {
            const index = current.findIndex(item => item._id.toString() === el.toString());
            let currentItem = current[index];
            current.splice(index, 1, {...currentItem, seen: true});
          });  
          return current;
        });
        
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

    } else {
      return null;
    }

  }, [notifications]);


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

  /*---------------------*/
  //Eliminar notificación
  /*---------------------*/
  const deleteNotificationHandler = async (id) => {
    try {
      setDeletingNotif(id);

      const res = await axios({
        method: "DELETE",
        url: `/api/notifications/${id}`
      });

      const {_id} = res.data.data;
      setNotifications(prev => {
        const updated = [...prev].filter(item => item._id.toString() !== _id.toString());
        return updated
      });

      setDeletingNotif("");

    } catch (error) {
      let message = error.message;

      if(error.response) {
        message = error.response.data.message
      }

      setErrorMsg(message);
      setDeletingNotif("");
    }
  }


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
      <Head>
        <title>{updatedTitle}</title>
      </Head>

      <Segment style={{minHeight: "85vh"}}>
        <Header style={{marginTop: "10px"}} as="h3" textAlign="center">
          <Icon
            style={{display: "block", margin: "0 auto"}}
            name="tasks"
            />
          Notifications
        </Header>

        <Divider />

        {notifications.length > 0 &&
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
                          <LikeNotification
                            notification={el}
                            deleting={deletingNotif}
                            deleteNotificationHandler={deleteNotificationHandler}
                          />
                          <Divider />
                        </>
                      }
                      {el.notificationType === "comment" &&
                        <>
                          <CommentNotification
                            currentUser={currentUser}
                            notification={el}
                            deleting={deletingNotif}
                            deleteNotificationHandler={deleteNotificationHandler}
                          />
                          <Divider />
                        </>
                      }
                      {el.notificationType === "follower" &&
                        <>
                          <FollowerNotification
                            notification={el}
                            deleting={deletingNotif}
                            deleteNotificationHandler={deleteNotificationHandler}
                          />
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
        }

        {notifications.length === 0 &&
          <Segment placeholder>
            <Header icon as="h4">
              <Icon name="meh outline" />
              You don't have notifications
            </Header>
          </Segment>
        }
      </Segment>
    </Container>
  )
}

export async function getServerSideProps(context) {
  try {
    const {token} = parseCookies(context);

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);  

    // Chequear si el email del usuario está verificado
    const isVerified = await checkVerification(token);

    // Si no está verificado, redirigir a la página de verificación
    if(!isVerified) {
      return {
        redirect: {
          destination: "/account-verification",
          permanent: false
        }
      }
    }

    const res = await axios({
      method: "GET",
      url: `${process.env.BASE_URL}/api/notifications?page=1`,
      headers: {
        Cookie: `token=${token}`
      },
    });

    // Consultar si hay mensajes sin leer
    const res2 = await axios({
      method: "GET",
      url: `${process.env.BASE_URL}/api/chats/unread-messages`,
      headers: {
        Cookie: `token=${token}`
      }
    });

    return {
      props: {
        notifications: res.data.data,
        unreadMessages: res2.data.data
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