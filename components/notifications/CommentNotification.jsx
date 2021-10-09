import Link from "next/link";
import {Feed, Popup, Header, Button, Icon} from "semantic-ui-react";
import moment from "moment";
import styles from "./notification.module.css";

const CommentNotification = ({currentUser, notification, deleteNotificationHandler, deleting}) => {
  const user = notification.userNotifier;

  // Popup para eliminar notificación
  const DeletePopup = () => {
    return (
      <div style={{position: "relative"}}>
        <Popup
          on="click"
          position="top right"
          trigger={
            <Icon
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                cursor: deleting.toString() === notification._id.toString() ? "default" : "pointer"
              }}
              disabled={deleting.toString() === notification._id.toString()}
              name="times"
              color="red"
              floated="right"
            />
          }
        >
          <Header as="h4" content="Delete Notification?"/>
          <Button
            disabled={deleting.toString() === notification._id.toString()}
            color="red"
            icon="trash"
            size="tiny"
            content="Delete"
            onClick={() => deleteNotificationHandler(notification._id)}
          />
        </Popup>               
      </div>
    )
  }

  return (
    <Feed.Event
      className={styles[`${notification.seen ? "notification--seen" : "notification--not-seen"}`]}
    >
      <Link href={`/user/${user.username}`} passHref>
        <Feed.Label image={user.avatar} />
      </Link>

      <Feed.Content style={{marginTop: 0}}>
        {DeletePopup()}
        <Feed.Summary>
          <Link href={`/user/${user.username}`} passHref>
            <Feed.User>
              {user.name}
            </Feed.User>
          </Link>

          {" "}

          {currentUser?._id.toString() === notification.post?.user.toString() &&
            <span>
              commented on your
              {" "}
              <Link href={`/post/${notification.post._id}`}>
                <a>post</a>
              </Link>
            </span>
          }

          {currentUser?._id.toString() !== notification.post?.user.toString() &&
            <span>
              commented on a
              {" "}
              <Link href={`/post/${notification.post._id}`}>
                <a>post</a>
              </Link>
              {" "}
              you are following
            </span>
          }
          
          {!notification.post && <span>post (deleted)</span>}

          <Feed.Date>{moment(notification.createdAt).calendar()}</Feed.Date>
        </Feed.Summary>

        {/* Imagen del post (si la tiene) */}
        {notification.post && notification.post.picUrl &&
          <Link href={`/post/${notification.post._id}`} passHref>
            <Feed.Extra images>
              <img src={notification.post.picUrl} alt="" />
            </Feed.Extra>
          </Link>
        }

        {/* Texto del post comentado (si es de tipo texto) */}
        {/* {notification.post && !notification.post.picUrl &&
          <Feed.Extra style={{maxWidth: "100%"}} text>
            {notification.post.content}
          </Feed.Extra>
        } */}

        {/* Texto del comentario */}
        <Feed.Extra text>
          <strong>{notification.commentText}</strong>
        </Feed.Extra>

      </Feed.Content>
    </Feed.Event>
  )
}

export default CommentNotification;