import {Segment, Header, Icon, List} from "semantic-ui-react";
import Search from "../../components/Layout/Search";
import ChatItem from "../../components/messages/ChatItem";
import styles from "./messages.module.css";

const ChatsList = ({onClickHandler, chats, onlineUsers, currentUser, selectedChat, disablingChat, disableChatHandler, chatItemClickHandler, setOpenChatsSidebar}) => {
  return (
    <div className={styles["messages__chat-list-column"]}>
      <Segment className={styles["messages__chat-list"]}>
        <div className={styles["messages__chat-list-header"]}>
          <h4 style={{marginBottom: "10px"}}>
            Chats
          </h4>
          <Search type="chat" onClickHandler={onClickHandler} />
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
                    onlineUsers={onlineUsers}
                    currentUser={currentUser}
                    selectedChat={selectedChat}
                    disablingChat={disablingChat}
                    disableChatHandler={disableChatHandler}
                    setOpenChatsSidebar={setOpenChatsSidebar}
                    chatItemClickHandler={chatItemClickHandler}
                  />
                )
              })}
            </List>
          }
        </div>
      </Segment>
    </div>
  )
}

export default ChatsList;
