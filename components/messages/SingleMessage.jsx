import {useState, useEffect, useContext} from "react";
import Link from "next/link";
import {Comment, Popup, Button, Icon, Header} from "semantic-ui-react";
import moment from "moment";
import {SocketContext} from "../../context/SocketProvider";
import {deleteMessage} from "../../utils/messageHandlers";
import styles from "./singleMessage.module.css";

const SingleMessage = ({message, setMessages, currentUser}) => {
  const {socket} = useContext(SocketContext);

  // Verificar si el usuario actual es el que envía
  const [isCurrentUserSender, setIsCurrentUserSender] = useState(currentUser === message.sender.username);
  const [user, setUser] = useState({});

  const [deleting, setDeleting] = useState(false);
  const [_errorDeleting, setErrorDeleting] = useState(null);

  useEffect(() => {
    setIsCurrentUserSender(currentUser === message.sender.username);
    setUser(message.sender);
  }, [message, currentUser]);

  /*------------------------------------------------*/
  // Borrar el mensaje (Cambiar su status a inactive)
  /*------------------------------------------------*/
  const deleteMessageHandler = async (msgId) => {
    const config = [msgId, socket, setDeleting, setErrorDeleting, setMessages];

    return deleteMessage(...config);
  };

  return (
    <Comment
      style={{
        alignSelf: isCurrentUserSender ? "flex-end" : "flex-start",
        opacity: deleting ? 0.5 : 1,
        backgroundColor: message.status === "inactive" ? "gainsboro" : "aliceblue"
      }}
      className={styles["message"]}
      data-msgid={message._id.toString()}
    >
      {/* Popup para eliminar el mensaje */}
      {isCurrentUserSender && message.status === "active" ?
        <Popup
          on="click"
          position="top right"
          trigger={
            <Icon
              style={{
                position: "absolute",
                top: "5px",
                right: 0,
                cursor: deleting ? "default" : "pointer"
              }}
              disabled={deleting}
              name="times"
              size="small"
              color="red"
              floated="right"
            />
          }
        >
          <Header as="p" content="Delete message?"/>
          <Button
            disabled={deleting}
            color="red"
            icon="trash"
            compact
            content="Delete"
            onClick={() => deleteMessageHandler(message._id)}
          />
        </Popup>
        :
        null
      }

      {/* Cuerpo del mensaje */}
      {message.senderStatus === "active" ?
        <Link href={`/user/${user.username}`} passHref>
          <Comment.Avatar
            className={styles["message__avatar"]}
            src={user.avatar}
          />
        </Link>
        :
        <Comment.Avatar
          className={styles["message__avatar"]}
          src={user.avatar}
          as="span"
        />
      }
      <Comment.Content>
        {message.senderStatus === "active" ?
          <Link href={`/user/${user.username}`} passHref>
            <Comment.Author>
              {user.name}
            </Comment.Author>
          </Link>
          :
          <Comment.Author as="span">
            {user.name}
          </Comment.Author>
        }
        
        <Comment.Metadata>
          {moment(message.createdAt).calendar()}
        </Comment.Metadata>
        
        <Comment.Text>
          <span
            style={{
              fontStyle: message.status === "inactive" ? "italic" : "normal",
              color: message.status === "inactive" ? "grey" : "black"
            }}
          >
            {message.text}
          </span>
        </Comment.Text>
      </Comment.Content>
      
      {message.seen && isCurrentUserSender &&
        <div className={styles["message__seen-info"]}>
          <small>
            Seen: {moment(message.seen.at).calendar()}
          </small>
          <Icon name="check circle outline" size="small" color="teal" />
        </div>
      }

    </Comment>
  )
}

export default SingleMessage;
