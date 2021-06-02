import {useState, useContext, useEffect, useRef} from "react";
import {Container, Segment, Header, List, Image, Button, Icon, Form, TextArea, Comment, Ref} from "semantic-ui-react";
import {useRouter} from "next/router";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies, destroyCookie} from "nookies";

import Search from "../../components/Layout/Search";
import SingleMessage from "../../components/messages/SingleMessage";
import {UserContext} from "../../context/UserContext";
import styles from "./messages.module.css";


const MessagesPage = (props) => {
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

  // console.log({selectedChatMessages});

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        // console.log({mensajes: res.data.data});
        const {messages, isLastPage} = res.data.data;
        setSelectedChatMessages(prev => [...messages, ...prev]);
        setCurrentPage(prev => prev + 1);
        setLoadMore(false);
        setLoadingMore(false);
        setInitialMessagesLoad(false);

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
    setLoadMore(true);
    setLoadingMore(true);
    setCurrentPage(1);
    setEndResults(false);
    setSelectedChatMessages([]);
    setSelectedChat(item);
    setInitialMessagesLoad(true);
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
                    // Verificar si el usuario es el creador del chat
                    const isChatCreator = currentUser && currentUser._id === item.user._id;

                    return (
                      <List.Item
                        style={{
                          backgroundColor: item._id === selectedChat._id && "rgba(0,0,0,.06)"}}
                        key={item._id}
                        onClick={() => chatItemClickHandler(item)}
                      >
                        <Image
                          className={styles["messages__chat-item-avatar"]}
                          src={isChatCreator ? item.messagesWith.avatar : item.user.avatar}
                        />
                        <List.Content>
                          <List.Header>
                            {isChatCreator ? item.messagesWith.name : item.user.name}
                          </List.Header>
                          {item.isEmpty ? "Chat vacío" : "Último mensaje recibido"}
                        </List.Content>
                      </List.Item>
                    )
                  })}
                </List>
              }
            </div>
          </Segment>
        </div>

        {/* Columna derecha: Bandeja de mensajes del chat seleccionado */}
        <div  className={styles["messages__inbox-column"]}>
          <Ref innerRef={inboxRef}>
            <Segment className={styles["messages__inbox"]}>
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
                  style={{resize: "none"}}
                  rows={3}
                  value={text}
                  disabled={sending}
                  placeholder="Write message..."
                  onChange={(e) => {
                    setText(e.target.value)
                  }}
                />
              </Form>
              <Button
                className={styles["messages__inbox-btn"]}
                icon
                basic
                disabled={text.length === 0 || sending}
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
