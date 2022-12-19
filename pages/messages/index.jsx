import {useState, useContext, useEffect, useRef, useCallback} from "react";
import {useRouter} from "next/router";
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

import useMessagesCounter from "../../hooks/useMessagesCounter";
import useSeenMessages from "../../hooks/useSeenMessages";
import useMessageDeleted from "../../hooks/useMessageDeleted";
import useChatDisabled from "../../hooks/useChatDisabled";


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
  }

  const [chats, setChats] = useState(props.chats);
  const [selectedChat, setSelectedChat] = useState(props.chats[0] || {});
  const [selectedChatMessages, setSelectedChatMessages] = useState([]);
  const [initialMessagesLoad, setInitialMessagesLoad] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [endResults, setEndResults] = useState(false);
  const [loadMore, setLoadMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(true);
  const [lastLoadedMsg, setLastLoadedMsg] = useState(null);
  const [moreRecentMsg, setMoreRecentMsg] = useState(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [disablingChat, setDisablingChat] = useState(false);

  const [openChatsSidebar, setOpenChatsSidebar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const windowWidth = useWindowWidth();


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

  /*---------------------------------------------------*/
  // Resetear el contador de mensajes al entrar al chat
  /*---------------------------------------------------*/
  useEffect(() => {
    resetUnreadMessages();
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
  const chatEnabledRef = useRef(() => {
    return socket.on("chatEnabled", (data) => {
      const chatId = data._id.toString();
      const selectedChatId = selectedChat._id;

      // Si el chat seleccionado fue habilitado, actualizarlo
      if(chatId === selectedChatId?.toString()) {
        setSelectedChat(data);
      }

      // Actualizar el status del chat en la lista de chats
      setChats(prev => {
        const updatedChats = [...prev];
        const chatIndex = updatedChats.findIndex(el => el._id.toString() === chatId);
        updatedChats.splice(chatIndex, 1, data);
        return updatedChats;
      })
    });
  });


  /*------------------------------*/
  // Listener de nuevo chat creado
  /*------------------------------*/
  const newChatCreatedRef = useRef(() => {
    return socket.on("newChatCreated", (newChat) => {
      setChats(prev => [newChat, ...prev]);
    })
  });


  /*------------------------------------------------------------------------------*/
  // Incializar cliente de Socket.io y procesar las actualizaciones en tiempo real
  /*------------------------------------------------------------------------------*/
  useEffect(() => {
    if(selectedChat._id) {
      socket.on("newMessageReceived", async ({newMsg, chatId}) => {
        const selectedChatId = selectedChat._id;
  
        // Actualizar el state de los mensajes con el nuevo mensaje entrante
        if(selectedChatId && chatId.toString() === selectedChatId.toString()) {
          setSelectedChatMessages(prev => {
            // Filtrar los mensajes duplicados
            const filteredDuplicates = [...prev, newMsg].reduce((acc, item) => {
              const x = acc.find(el => el._id === item._id);
              if(!x) {
                return acc.concat(item)
              } else {
                return acc
              }
            },[]);
  
            return filteredDuplicates
          });
          
          // Scrollear al fondo de la bandeja al recibir el nuevo mensaje
          if(router.pathname === "/messages" && inboxRef.current) {
            inboxRef.current.scrollTop = inboxRef.current.scrollHeight;
          }
        }
      });
    }

    // Reiniciar el listener de nuevo mensaje recibido al seleccionar otro chat
    // para inicializarlo con la id del chat seleccionado
    // y evitar que los mensajes entrantes se agreguen a la bandeja equivocada
    return () => socket.off("newMessageReceived");
  }, [selectedChat]);

  useEffect(() => {
    chatEnabledRef.current();
    newChatCreatedRef.current();
  }, []);


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


  /*------------------------------------------*/
  // Cambiar el estado de los mensajes a leído
  /*------------------------------------------*/
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


  /*----------------------------*/
  // Deshabilitar/habilitar chat
  /*----------------------------*/
  const disableChatHandler = async (chatId) => {
    try {
      setError(null);
      setDisablingChat(true);
      
      const res = await axios({
        method: "PATCH",
        url: `/api/chats/disable-chat/${chatId}`
      });

      console.log({response: res.data.data});
      const updatedChat = res.data.data;

      // Buscar el índice del chat en el state
      const chatIndex = [...chats].findIndex(el => el._id.toString() === chatId.toString());

      // Actualizar el status del chat en el state
      setChats(prev => {
        const updated = [...prev];
        updated.splice(chatIndex, 1, updatedChat);
        return updated;
      });

      // Emitir el chat deshabilitado
      if(updatedChat.status === "inactive") {
        socket.emit("disabledChat", updatedChat);
      }

      // Emitir el chat habilitado
      if(updatedChat.status === "active") {
        socket.emit("enabledChat", {updatedChat, enabledBy: currentUser._id})
      }

      setSelectedChat(updatedChat);
      setDisablingChat(false);
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message
      }

      console.log(`Error disabling/enabling chat: ${message}`)

      setDisablingChat(false);
      setError(message);
    }
  }
  

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


  /*--------------------*/
  // Crear el nuevo chat
  /*--------------------*/
  const createChateHandler = async (messagesWith) => {
    try {
      setError(null);
      setLoading(true);
      setLoadingMore(true);
      setCurrentPage(1);
      setSelectedChat({});
      setInitialMessagesLoad(false);
      setEndResults(false);
      setLastLoadedMsg(null);
      
      const res = await axios({
        method: "POST",
        url: `/api/chats/${messagesWith}`
      });

      const newChat = res.data.data;
      
      // Verificar si el chat ya existe en la lista (en caso de buscar un chat existente)
      const index = chats.findIndex(chat => chat._id.toString() === newChat._id.toString());

      // Si el chat ya existe y ya hay chats en la lista,
      // borrar el item anterior y poner el nuevo de primero en la lista
      if(index !== -1 && chats.length > 0) {
        setChats(prev => {
          const current = [...prev];
          current.splice(index, 1);  
          return [newChat, ...current];
        });

      // Si el chat no existe y ya hay chats en lalista
      // agregar el nuevo chat creado a los chats actuales de primero en la lista
      // y emitir el evento de nuevo chat creado
      } else if(index === -1 && chats.length > 0) {
        setChats(prev => [newChat, ...prev]);
        socket.emit("chatCreated", newChat);
      
      // Si no hay chats en la lista, inicializar la lista con el nuevo chat creado
      // y emitir el evento de nuevo chat creado
      } else if(chats.length === 0) {
        setChats([newChat]);
        socket.emit("chatCreated", newChat);
      }
      
      setLoadMore(true);
      setSelectedChatMessages([]);
      setSelectedChat(newChat);
      setLoading(false);
      
    } catch (error) {
      let message = error.mesage;
      if(error.response) {
        message = error.response.data.message
      }
      setLoading(false);
      setError(message);
    }
  }

  /*-------------------------------------*/
  // Enviar mensajes al chat seleccionado
  /*-------------------------------------*/
  const sendMessageHandler = async (chat) => {
    try {
      setSending(true);

      const recipient = currentUser._id === chat.user._id ? chat.messagesWith._id : chat.user._id;

      const res = await axios({
        method: "POST",
        url: `/api/chats/${chat._id}/message/${recipient}`,
        data: {messageText: text}
      });

      // console.log({msgResponse: res.data.data});
      const newMessage = res.data.data;
      
      // Emitir el nuevo mensaje enviado al recipiente
      socket.emit("newMessage", {newMsg: newMessage, chatId: chat._id});
      socket.emit("updateNewMessagesCounter", {
        chatId: chat._id,
        recipientId: newMessage.recipient._id,
        msg: newMessage
      });

      setSelectedChatMessages(prev => [...prev, newMessage]);
      setSending(false);
      setText("");

      // Scrollear al fondo de la bandeja al enviar un mensaje
      inboxRef.current.scrollTop = inboxRef.current.scrollHeight;
      
    } catch (error) {
      let message = error.mesage;
      if(error.response) {
        message = error.response.data.message
      }
      setSending(false);
      setError(message);
    }
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

    return {
      props: {
        chats: res.data.data.userChats
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
