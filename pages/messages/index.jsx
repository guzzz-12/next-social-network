import {useState, useContext, useEffect, useRef} from "react";
import {Segment, Header, Sidebar, Button, Icon, Form, TextArea, Comment, Ref} from "semantic-ui-react";
import {useRouter} from "next/router";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies, destroyCookie} from "nookies";

import SingleMessage from "../../components/messages/SingleMessage";
import {UserContext} from "../../context/UserContext";
import {UnreadMessagesContext} from "../../context/UnreadMessagesContext";
import {SocketContext} from "../../context/SocketProvider";
import styles from "./messages.module.css";
import ChatsList from "./ChatsList";
import { useWindowWidth } from "../../utils/customHooks";


const MessagesPage = (props) => {
  const lastMsgRef = useRef();
  const inboxRef = useRef();
  const router = useRouter();
  const {currentUser} = useContext(UserContext);
  const unreadContext = useContext(UnreadMessagesContext);
  const {socket, onlineUsers} = useContext(SocketContext);

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

  /*---------------------------------------------------*/
  // Resetear el contador de mensajes al entrar al chat
  /*---------------------------------------------------*/
  useEffect(() => {
    unreadContext.setUnreadMessages(0)
  }, []);

  /*-------------------------------------------------------------------------------*/
  // Incializar cliente de Socket.io y actualizar mensajes entrantes en tiempo real
  /*-------------------------------------------------------------------------------*/
  useEffect(() => {
    if(socket && currentUser) {
      // Actualizar la bandeja con el nuevo mensaje recibido en el recipiente
      socket.on("newMessageReceived", (data) => {
        setSelectedChatMessages(prev => {          
          // Filtrar mensajes duplicados
          const filteredDuplicates = [...prev, data].reduce((acc, item) => {
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
      });

      // Actualizar la bandeja con el mensaje eliminado en el recipiente
      socket.on("messageDeleted", (data) => {
        console.log({MensajeEliminado: data})

        setSelectedChatMessages(prev => {
          const updatedMsgs = [...prev];
          const msgIndex = updatedMsgs.findIndex(el => el._id.toString() === data._id.toString());
          updatedMsgs.splice(msgIndex, 1, data);
          return updatedMsgs;
        })
      })
    }

    // Actualizar el chat en el otro usuario al deshabilitarlo
    socket.on("chatDisabled", (data) => {
      const chatId = data._id.toString();

      // Si el chat seleccionado fue deshabilitado, actualizarlo
      if(chatId === selectedChat._id.toString()) {
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

    // Actualizar el chat en el otro usuario al habilitarlo
    socket.on("chatEnabled", (data) => {
      const chatId = data._id.toString();

      // Si el chat seleccionado fue habilitado, actualizarlo
      if(chatId === selectedChat._id.toString()) {
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

    // Actualizar el status de los mensajes vistos
    socket.on("readMessages", (update) => {
      setSelectedChatMessages(prev => {
        const currentMessages = [...prev];

        update.forEach(updatedItem => {
          const index = currentMessages.findIndex(el => el._id.toString() === updatedItem._id.toString());
          currentMessages.splice(index, 1, updatedItem);
        });

        return currentMessages;
      })
    });

    // Poner el status offline al salir del chat
    // return () => socket.current.emit("offline");

  }, [socket, currentUser, inboxRef.current]);

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

        unreadContext.setUnreadMessages(0)
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
    if(selectedChat && !endResults && loadMore) {
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
          setMoreRecentMsg(messages[messages.length - 1])
        }

        setSelectedChatMessages(prev => [...messages, ...prev]);
        setCurrentPage(prev => prev + 1);
        setLoadMore(false);
        setLoadingMore(false);
        setInitialMessagesLoad(false);

        // Mantener el scroll en el último mensaje recibido en la carga anterior
        lastMsgRef.current && lastMsgRef.current.scrollIntoView({block: "end"});

        // Marcar todos como leídos
        unreadContext.setUnreadMessages(0)

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

  }, [selectedChat, endResults, loadMore]);

  /*--------------------------------------------------------------------------*/
  // Seleccionar el chat y reinicializar el state al clickear un item del chat
  /*--------------------------------------------------------------------------*/
  const chatItemClickHandler = (item) => {
    setSelectedChat(item);
    setSelectedChatMessages([]);
    setLoadMore(true);
    setLoadingMore(true);
    setCurrentPage(1);
    setEndResults(false);
    setInitialMessagesLoad(true);
    setLastLoadedMsg(null);
  }

  /*--------------------*/
  // Crear el nuevo chat
  /*--------------------*/
  const createChateHandler = async (messagesWith) => {
    try {
      setError(null);
      setLoading(true);
      
      const res = await axios({
        method: "POST",
        url: `/api/chats/${messagesWith}`
      });

      const newChat = res.data.data;
      setChats(prev => [...prev, newChat]);
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
  const sendMessageHandler = async () => {
    try {
      setSending(true);

      const recipient = currentUser._id === selectedChat.user._id ? selectedChat.messagesWith._id : selectedChat.user._id;

      const res = await axios({
        method: "POST",
        url: `/api/chats/${selectedChat._id}/message/${recipient}`,
        data: {messageText: text}
      });

      // console.log({msgResponse: res.data.data});
      const newMessage = res.data.data;
      
      // Emitir el nuevo mensaje enviado al recipiente
      socket.emit("newMessage", newMessage);

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
            chatItemClickHandler={chatItemClickHandler}
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
                chatItemClickHandler={chatItemClickHandler}
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
              style={{background: selectedChat.status === "inactive" ? "ghostwhite" : "white"}}
              className={styles["messages__inbox"]}
            >
              <Button
                className={styles["messages__inbox-load-more-btn"]}
                content={!endResults ? "Load more messages..." : "No more messages available..."}
                loading={loadingMore}
                disabled={loadingMore || endResults}
                onClick={() => setLoadMore(true)}
              />
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
                onClick={sendMessageHandler}
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
    const {req} = context;

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);  

    // Setear el token en los cookies del request
    axios.defaults.headers.get.Cookie = `token=${token}`;

    // Consultar los chats del usuario
    const res = await axios({
      method: "GET",
      url: `${req.protocol}://${req.get("host")}/api/chats`
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
