import Link from "next/link";
import {Feed, Popup, Header, Button, Icon} from "semantic-ui-react";
import moment from "moment";
import styles from "./notification.module.css";

const LikeNotification = ({notification, deleteNotificationHandler, deleting}) => {
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
        <Feed.Label image={user.avatar}/>
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

          <span>liked your</span>
          {" "}

          {notification.post &&
            <Link href={`/post/${notification.post._id}`}>
              <a>post</a>
            </Link>
          }

          {!notification.post &&
            <span>post (deleted)</span>
          }

          <Feed.Date>{moment(notification.createdAt).calendar()}</Feed.Date>
        </Feed.Summary>

        {notification.post && notification.post.picUrl &&
          <Link href={`/post/${notification.post._id}`} passHref>
            <Feed.Extra images>
              <img src={notification.post.picUrl} alt="" />
            </Feed.Extra>
          </Link>
        }

        {notification.post && !notification.post.picUrl &&
          <Feed.Extra text>
            {notification.post.content}
          </Feed.Extra>
        }
      </Feed.Content>
    </Feed.Event>
  )
}

export default LikeNotification;
