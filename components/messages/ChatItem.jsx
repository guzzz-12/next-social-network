import React from "react";
import {List, Image, Popup, Header, Button, Icon} from "semantic-ui-react";
import moment from "moment";
import styles from "../../pages/messages/messages.module.css";

const ChatItem = ({item, selectedChat, currentUser, chatItemClickHandler, disableChatHandler, disablingChat}) => {

  if(!currentUser) {
    return null;
  }

  // Verificar si el usuario es el creador del chat
  const isChatCreator = currentUser._id === item.user._id;

  return (
    <List.Item
      style={{
        position: "relative",
        backgroundColor: item._id === selectedChat._id && "rgba(0,0,0,.06)"}}
      key={item._id}
      onClick={() => chatItemClickHandler(item)}
    >

      {/* Popup para deshabilitar el chat */}
      {/* Se muestra a todos los usuarios si el chat está activo, y si está inactivo, se muestra al usuario que lo desactivó */}
      {item.status === "active" || (item.status === "inactive" && item.disabledBy.toString() === currentUser._id.toString()) ?
        <Popup
          on="click"
          position="top right"
          trigger={
            <Icon
              style={{
                position: "absolute",
                top: "5px",
                right: 0,
                cursor: disablingChat ? "default" : "pointer"
              }}
              disabled={disablingChat}
              name="times"
              size="small"
              color="red"
              floated="right"
            />
          }
        >
          <Header
            as="p"
            style={{marginBottom: "5px"}}
            content={item.status === "active" ? "Disable this conversation?" : "Enable this conversation?"}
            textAlign="center"
          />
          <small
            style={{
              display: "block",
              marginBottom: "10px",
              textAlign: "center",
              lineHeight: 1.3
            }}
          >
            {item.status === "active" && "This chat will remain visible but the users will not be able to send messages"}
            {item.status === "inactive" && "Users will be able to send messages again"}
          </small>
          <Button
            disabled={disablingChat}
            color={item.status === "active" ? "red" : "teal"}
            icon={item.status === "active" ? "lock" : "envelope outline"}
            compact
            content={item.status === "active" ? "Disable chat" : "Enable chat"}
            onClick={() => disableChatHandler(item._id)}
          />
        </Popup>
        :
        null
      }

      <Image
        className={styles["messages__chat-item-avatar"]}
        src={isChatCreator ? item.messagesWith.avatar : item.user.avatar}
      />
      <List.Content>
        <List.Header>
          {isChatCreator ? item.messagesWith.name : item.user.name}
        </List.Header>
        {item.isEmpty && "Empty chat..."}
        {!item.isEmpty &&
          <>
            <span>
              {item.latestMessage.text.substring(0, 25)}...
            </span>
            <br />
            <small>
              {moment(item.latestMessage.date).calendar()}
            </small>
          </>
        }
      </List.Content>
    </List.Item>
  )
}

export default ChatItem;
