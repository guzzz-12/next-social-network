import Link from "next/link";
import {Feed, Popup, Header, Button, Icon} from "semantic-ui-react";
import moment from "moment";
import styles from "./notification.module.css";

const FollowerNotification = ({notification, deleteNotificationHandler, deleting}) => {
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
        <Feed.Label
          style={{display: "flex", alignItems: "center"}}
          image={user.avatar}
        />
      </Link>
      <Feed.Content>
        {DeletePopup()}
        <Feed.Summary>
          <Link href={`/user/${user.username}`} passHref>
            <Feed.User>
              {user.name}
            </Feed.User>
          </Link>
          {" "}
          started following you
          {" "}
          <Feed.Date>{moment(notification.createdAt).calendar()}</Feed.Date>
        </Feed.Summary>
      </Feed.Content>
    </Feed.Event>
  )
}

export default FollowerNotification;