import {useState, useContext, useEffect, useRef} from "react";
import {Container, Segment, Header, List, Image, Button, Icon, Form, TextArea, Comment, Ref} from "semantic-ui-react";
import {useRouter} from "next/router";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies, destroyCookie} from "nookies";

import Search from "../../components/Layout/Search";
import ChatItem from "../../components/messages/ChatItem";
import SingleMessage from "../../components/messages/SingleMessage";
import {UserContext} from "../../context/UserContext";
import styles from "./messages.module.css";


const MessagesPage = (props) => {
  const lastMsgRef = useRef();
  const inboxRef = useRef();
  const router = useRouter();
  const {currentUser} = useContext(UserContext);

  const [chats, setChats] = useState(props.chats);
  const [selectedChat, setSelectedChat] = useState(props.chats[0] || {});
  const [selectedChatMessages, setSelectedChatMessages] = useState([]);
  const [initialMessagesLoad, setInitialMessagesLoad] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [endResults, setEndResults] = useState(false);
  const [loadMore, setLoadMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastLoadedMsg, setLastLoadedMsg] = useState(null);
  const [moreRecentMsg, setMoreRecentMsg] = useState(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [disablingChat, setDisablingChat] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <Container className={styles["messages__container"]}>
      <Button
        floated="left"
        labelPosition="left"
        onClick={() => router.push("/")}
      >
        <Icon name="left arrow" />
        Go back
      </Button>

      <Header style={{paddingBottom: "1.5rem"}} as="h3" textAlign="center">
        <Icon
          style={{display: "block", margin: "0 auto"}}
          name="comments outline"
        />
        Messages
      </Header>

      <div className={styles["messages__grid"]}>
        {/* Coluna izquierda: Sección de listas de chats */}
        <div className={styles["messages__chats-list-column"]}>
          <Segment className={styles["messages__chat-list"]}>
            <div className={styles["messages__chat-list-header"]}>
              <h4 style={{marginBottom: "10px"}}>
                Chats
              </h4>
              <Search type="chat" onClickHandler={createChateHandler} />
            </div>
            
            <div className={styles["messages__chat-list-wrapper"]}>
              {/* Mensaje si el usuario no ha creado chats */}
              {chats.length === 0 &&
                <Header
                  as="h3"
                  color="grey"
                  className={styles["messages__chat-list-empty"]}
                >
                  <Header.Content>
                    <Icon name="meh outline" />
                    Aún no tienes chats
                    <Header.Subheader>
                      Selecciona un usuario en el buscador
                    </Header.Subheader>
                  </Header.Content>
                </Header>
              }

              {/* Items de la lisla de chats */}
              {chats.length > 0 &&
                <List
                  className={styles["messages__chat-list-items"]}
                  divided
                  selection
                  verticalAlign="middle"
                >
                  {chats.map(item => {
                    return (
                      <ChatItem
                        key={item._id}
                        item={item}
                        currentUser={currentUser}
                        selectedChat={selectedChat}
                        disablingChat={disablingChat}
                        disableChatHandler={disableChatHandler}
                        chatItemClickHandler={chatItemClickHandler}
                      />
                    )
                  })}
                </List>
              }
            </div>
          </Segment>
        </div>

        {/* Columna derecha: Bandeja de mensajes del chat seleccionado */}
        <div className={styles["messages__inbox-column"]}>
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
                className={styles["messages__inbox-btn"]}
                icon
                basic
                disabled={text.length === 0 || sending || selectedChat.status === "inactive"}
                onClick={sendMessageHandler}
              >
                <Icon name="send" size="large" color="teal"/>
              </Button>
            </Segment>
          </div>
        </div>
      </div>
    </Container>
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
