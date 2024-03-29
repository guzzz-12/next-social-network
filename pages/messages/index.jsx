import {useState, useContext, useEffect, useRef, useCallback} from "react";
import {useRouter} from "next/router";
import Head from "next/head";
import {Segment, Header, Sidebar, Button, Icon, Form, TextArea, Comment, Ref} from "semantic-ui-react";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies, destroyCookie} from "nookies";

import SingleMessage from "../../components/messages/SingleMessage";
import {UserContext} from "../../context/UserContext";
import {UnreadMessagesContext} from "../../context/UnreadMessagesContext";
import {SocketContext} from "../../context/SocketProvider";
import styles from "./messages.module.css";
import ChatsList from "../../components/messages/ChatsList";
import {checkVerification} from "../../utilsServer/verificationStatus";
import {useWindowWidth} from "../../utils/customHooks";
import {createChat, disableChat} from "../../utils/chatHandlers";
import {sendMessage} from "../../utils/messageHandlers";

import useMessagesCounter from "../../hooks/useMessagesCounter";
import useSeenMessages from "../../hooks/useSeenMessages";
import useMessageDeleted from "../../hooks/useMessageDeleted";
import useChatDisabled from "../../hooks/useChatDisabled";
import useChatEnabled from "../../hooks/useChatEnabled";
import useMessageReceived from "../../hooks/useMessageReceived";
import useUpdateTitleNotifications from "../../hooks/useUpdateTitleNotifications";
import useReinitializeNotifications from "../../hooks/useReinitializeNotifications";


const MessagesPage = (props) => {
  const lastMsgRef = useRef();
  const inboxRef = useRef();
  const router = useRouter();
  const {currentUser} = useContext(UserContext);
  const {resetUnreadMessages} = useContext(UnreadMessagesContext);
  const {socket, onlineUsers} = useContext(SocketContext);

  // Retornar null mientras no haya usuario o chats
  if(!currentUser || !props.chats) {
    return null;
  };


  const [chats, setChats] = useState(props.chats);
  const [selectedChat, setSelectedChat] = useState(props.chats[0] || {});
  const [selectedChatMessages, setSelectedChatMessages] = useState([]);
  const [initialMessagesLoad, setInitialMessagesLoad] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [endResults, setEndResults] = useState(false);
  const [loadMore, setLoadMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(true);
  const [lastLoadedMsg, setLastLoadedMsg] = useState(null);
  const [_moreRecentMsg, setMoreRecentMsg] = useState(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [disablingChat, setDisablingChat] = useState(false);

  const [openChatsSidebar, setOpenChatsSidebar] = useState(false);

  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState(null);

  const windowWidth = useWindowWidth();

  // Actualizar el title
  const updatedTitle = useUpdateTitleNotifications("Next Social Network | Messages");
  
  // Reinicializar los contadores de notificaciones y mensajes sin leer
  // al hacer hard refresh de la página.
  useReinitializeNotifications();


  /*--------------------------------------------------------------------------*/
  // Seleccionar el chat y reinicializar el state al clickear un item del chat
  /*--------------------------------------------------------------------------*/
  const chatItemClickHandler = useCallback((item) => {
    setCurrentPage(1);
    setSelectedChatMessages([]);
    setLoadMore(true);
    setLoadingMore(true);
    setEndResults(false);
    setInitialMessagesLoad(true);
    setLastLoadedMsg(null);

    setSelectedChat(item);
    setChats(prev => {
      const index = prev.findIndex(el => el._id.toString() === item._id.toString());
      const updated = [...prev];
      updated.splice(index, 1, {...prev[index], unreadMessages: 0});
      return updated;
    });
  }, []);


  /*-------------------------------------------------------------*/
  // Seleccionar el primer chat al entrar a la página de mensajes
  /*-------------------------------------------------------------*/
  useEffect(() => {
    if(props.chats.length > 0) {
      chatItemClickHandler(props.chats[0])
    }
  }, [props.chats]);
  

  useEffect(() => {
    // Resetear el contador de mensajes al entrar al chat
    resetUnreadMessages();

    // Listener del evento de nuevo chat creado
    socket.on("newChatCreated", (newChat) => {
      setChats(prev => [newChat, ...prev]);
    });
  }, []);


  /*-----------------------------------------------------------*/
  // Listener del contador de mensajes nuevos del item del chat
  /*-----------------------------------------------------------*/
  useMessagesCounter(setChats, socket);


  /*-----------------------------------------------------------*/
  // Listener de los mensajes leídos (Cambiar el status a visto)
  /*-----------------------------------------------------------*/
  useSeenMessages(setSelectedChatMessages, socket);


  /*------------------------------------*/
  // Listener de los mensajes eliminados
  /*------------------------------------*/
  useMessageDeleted(setSelectedChatMessages, socket);


  /*--------------------------------*/
  // Listener de chat deshabilitado
  /*--------------------------------*/
  useChatDisabled(setChats, socket, chatItemClickHandler, selectedChat);


  /*----------------------------*/
  // Listener de chat habilitado
  /*----------------------------*/
  useChatEnabled(setChats, socket, selectedChat, setSelectedChat);


  /*---------------------------------------------------------------------------*/
  // Recibir los mensajes y actualizarla bandeja del recipiente en tiempo real.
  /*---------------------------------------------------------------------------*/
  useMessageReceived({setSelectedChatMessages, socket, selectedChat, router, inboxRef});


  /*---------------------------------------------------------------*/
  // Almacenar el último mensaje cargado para mantenerlo en el view
  /*---------------------------------------------------------------*/
  useEffect(() => {
    if(lastLoadedMsg) {
      const msgId = lastLoadedMsg._id.toString();
      const lastMsg = document.querySelector(`[data-msgid="${msgId}"]`);
      lastMsgRef.current = lastMsg;
    }
  }, [lastLoadedMsg]);


  /*-----------------------------------------------------------*/
  // Enviar consulta para cambiar el status de los mensajes
  // a leído en la db y en la bandeja de entrada del recipiente
  /*-----------------------------------------------------------*/
  useEffect(() => {
    if(currentUser && selectedChat && !loadingMore) {
      // Extraer las ids de los mensajes a actualizar donde el remitente
      // no sea el usuario logueado y que no hayan sido leídos
      const messagesIds = [];
      selectedChatMessages.forEach(el => {
        if(el.sender._id.toString() !== currentUser._id.toString() && el.unread) {
          messagesIds.push(el._id)
        }
      });
      
      axios({
        method: "PATCH",
        url: `/api/chats/read-messages`,
        data: {messagesIds},
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(res => {
        const updatedMessages = res.data.data;

        // Emitir el evento de mensajes vistos al recipiente
        if(updatedMessages.length > 0) {
          socket.emit("messagesRead", {
            updatedMessages,
            senderId: updatedMessages[0].sender._id.toString(),
            seenById: currentUser._id
          });
        }

        resetUnreadMessages();
      })
      .catch(err => {
        let message = err.message;
        if(err.response) {
          message = err.response.data.message
        }
        console.log({message});
      })
    }
  }, [selectedChat, loadingMore]);
  

  /*------------------------------------------*/
  // Cargar los mensajes del chat seleccionado
  /*------------------------------------------*/
  useEffect(() => {
    if(selectedChat._id && loadMore) {
      setError(null);
      setLoadingMore(true);

      axios({
        method: "GET",
        url: `/api/chats/${selectedChat._id}/messages?page=${currentPage}`
      })
      .then(res => {
        const {messages, isLastPage} = res.data.data;

        // Almacenar el mensaje más reciente en la carga inicial
        if(initialMessagesLoad) {
          setSelectedChatMessages(messages);
          setMoreRecentMsg(messages[messages.length - 1]);
        } else {
          setSelectedChatMessages(prev => [...messages, ...prev]);
        }

        setCurrentPage(prev => prev + 1);
        setLoadMore(false);
        setLoadingMore(false);
        setInitialMessagesLoad(false);

        // Mantener el scroll en el último mensaje recibido en la carga anterior
        lastMsgRef.current && lastMsgRef.current.scrollIntoView({block: "end"});

        // Marcar todos como leídos
        resetUnreadMessages();

        // Almacenar la id del último mensaje cargado
        setLastLoadedMsg(messages[0]);

        if(isLastPage) {
          setEndResults(true)
        }
      })
      .catch(error => {
        let message = error.mesage;
        if(error.response) {
          message = error.response.data.message
        }
        setLoadingMore(false);
        setError(message);
      })
    }

  }, [selectedChat, loadMore]);


  /*----------------------------*/
  // Deshabilitar/habilitar chat
  /*----------------------------*/
  const disableChatHandler = (chatId) => {
    const config = [
      chatId,
      chats,
      currentUser,
      setSelectedChat,
      setError,
      setChats,
      socket,
      setDisablingChat
    ];

    return disableChat(...config);
  };


  /*--------------------*/
  // Crear un nuevo chat
  /*--------------------*/
  const createChateHandler = (messagesWith) => {
    const config = [
      messagesWith,
      chats,
      setChats,
      socket,
      setError,
      setLoading,
      setLoadMore,
      setLoadingMore,
      setCurrentPage,
      setSelectedChat,
      setInitialMessagesLoad,
      setEndResults,
      setLastLoadedMsg
    ];

    return createChat(...config);
  }

  /*-------------------------------------*/
  // Enviar mensajes al chat seleccionado
  /*-------------------------------------*/
  const sendMessageHandler = (chat) => {
    const config = [
      currentUser,
      chat,
      socket,
      inboxRef,
      text,
      setSending,
      setSelectedChatMessages,
      setText,
      setError
    ];

    return sendMessage(...config);
  }

  /*----------------------------------------------------------------------------*/
  // Scrollear el inbox al bottom al cargar el chat y al agregar nuevos mensajes
  /*----------------------------------------------------------------------------*/
  useEffect(() => {
    if(inboxRef.current && !initialMessagesLoad) {
      inboxRef.current.scrollTop = inboxRef.current.scrollHeight;
    }

  }, [inboxRef.current, initialMessagesLoad]);

  return (
    <section className={styles["messages__container"]}>
      <Head>
        <title>{updatedTitle}</title>
      </Head>

      <Button
        floated="left"
        labelPosition="left"
        onClick={() => router.push("/")}
      >
        <Icon name="left arrow" />
        Go back
      </Button>

      <Header style={{paddingBottom: "2rem"}} as="h3" textAlign="center">
        <Icon
          style={{display: "block", margin: "0 auto"}}
          name="comments outline"
        />
        Messages
      </Header>

      <div className={styles["messages__grid"]}>
        {/* Coluna izquierda: Sección de listas de chats */}
        {windowWidth >= 750 &&
          <ChatsList
            chats={chats}
            onClickHandler={createChateHandler}
            onlineUsers={onlineUsers}
            currentUser={currentUser}
            selectedChat={selectedChat}
            disablingChat={disablingChat}
            disableChatHandler={disableChatHandler}
            chatItemClickHandler={(item) => chatItemClickHandler(item)}
          />
        }

        {windowWidth < 750 &&
          <Sidebar.Pushable
            className={styles["messages__chat-list-sidebar-wrapper"]}
          >
            <Sidebar
              className={styles["messages__chat-list-sidebar"]}
              as="menu"
              // width="wide"
              animation="overlay"
              vertical
              visible={openChatsSidebar}
              onHide={() => setOpenChatsSidebar(false)}
            >
              <ChatsList
                chats={chats}
                onClickHandler={createChateHandler}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                selectedChat={selectedChat}
                disablingChat={disablingChat}
                disableChatHandler={disableChatHandler}
                chatItemClickHandler={(item) => chatItemClickHandler(item)}
                setOpenChatsSidebar={setOpenChatsSidebar}
              />
            </Sidebar>

            <Sidebar.Pusher dimmed={openChatsSidebar}/>
          </Sidebar.Pushable>
        }

        {/* Columna derecha: Bandeja de mensajes del chat seleccionado */}
        <div
          className={styles["messages__inbox-column"]}
          style={{zIndex: openChatsSidebar ? 1 : 3}}
        >
          {windowWidth < 750 &&
            <Button
              className={styles["messages__sidebar-btn"]}
              onClick={() => setOpenChatsSidebar(prev => !prev)}
              compact
            >
              <div style={{display: "flex"}}>
                <Icon
                  style={{order: openChatsSidebar ? 0 : 1}}
                  name={openChatsSidebar ? "chevron left" : "chevron right"}
                />
                <span style={{order: openChatsSidebar ? 1 : 0}}>
                  {openChatsSidebar ? "Close list" : " Select chat"}
                </span>
              </div>
            </Button>
          }
          
          <Ref innerRef={inboxRef}>
            <Segment
              style={{
                background: selectedChat.status === "inactive" ? "ghostwhite" : "white",
                backgroundImage: `url(${chats.length === 0 ? "https://res.cloudinary.com/dzytlqnoi/image/upload/e_brightness:80,q_100/v1624138590/chat-app/no-messages_v7o8j7.png" : ""})`,
                backgroundSize: "contain",
                backgroundPosition: "center center"
              }}
              className={styles["messages__inbox"]}
            >
              {chats.length > 0 &&
                <Button
                  className={styles["messages__inbox-load-more-btn"]}
                  content={!endResults ? "Load more messages..." : "No more messages available..."}
                  loading={loadingMore}
                  disabled={loadingMore || endResults || selectedChatMessages.length === 0}
                  onClick={() => setLoadMore(true)}
                />
              }
              <Comment.Group className={styles["messages__inbox-messages-list"]}>
                {selectedChatMessages.map(msg => {
                  return (
                    <SingleMessage
                      key={msg._id}
                      message={msg}
                      setMessages={setSelectedChatMessages}
                      currentUser={currentUser.username}
                    />
                  )
                })}
              </Comment.Group>
            </Segment>
          </Ref>

          <div className={styles["messages__inbox-input-wrapper"]}>
            <Segment className={styles["messages__inbox-input"]}>
              <Form className={styles["messages__inbox-input-form"]}>
                <TextArea
                  style={{
                    resize: "none",
                    background: selectedChat.status === "inactive" ? "ghostwhite" : "white"
                  }}
                  rows={3}
                  value={text}
                  disabled={sending || selectedChat.status === "inactive"}
                  placeholder={selectedChat.status === "inactive" ? "Chat disabled..." : "Write message..."}
                  onChange={(e) => {
                    setText(e.target.value)
                  }}
                />
              </Form>

              <Button
                className={styles["messages__inbox-input-btn"]}
                icon
                basic
                disabled={text.length === 0 || sending || selectedChat.status === "inactive"}
                onClick={() => sendMessageHandler(selectedChat)}
              >
                <Icon name="paper plane outline" size="large" color="grey"/>
              </Button>
            </Segment>
          </div>
        </div>
      </div>
    </section>
  )
}


// Consultar los chats del usuario antes de retornar el componente
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

    // Consultar los chats del usuario
    const res = await axios({
      method: "GET",
      url: `${process.env.BASE_URL}/api/chats`,
      headers: {
        Cookie: `token=${token}`
      }
    });

    // Consultar las notificaciones no leídas
    const res2 = await axios({
      method: "GET",
      url: `${process.env.BASE_URL}/api/notifications/unread`,
      headers: {
        Cookie: `token=${token}`
      }
    });

    return {
      props: {
        chats: res.data.data.userChats,
        unreadNotifications: res2.data.data
      }
    }
    
  } catch (error) {
    let message = error.message;

    if(error.response) {
      message = error.response.data.message;
    }
    
    console.log(`Error fetching posts: ${message}`);

    // Redirigir al login si hay error de token
    if(message.includes("jwt") || message.includes("signature")) {
      destroyCookie(context, "token");
      return {
        redirect: {
          destination: "/login",
          permanent: false
        }
      }
    }

    return {
      props: {
        error: message
      }
    }
  }
}

export default MessagesPage;
