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
      <Feed.Label
        style={{display: "flex", alignItems: "center"}}
        as="a"
        href={`/user/${user.username}`}
        image={user.avatar}
      />
      <Feed.Content>
        {DeletePopup()}
        <Feed.Summary>
          <Feed.User as="a" href={`/user/${user.username}`}>
            {user.name}
          </Feed.User>
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