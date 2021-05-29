import {Feed, Popup, Header, Button, Icon} from "semantic-ui-react";
import moment from "moment";

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
    <Feed.Event>
      <Feed.Label
        as="a"
        href={`/user/${user.username}`}
        image={user.avatar}
      />
      <Feed.Content style={{marginTop: 0}}>
        {DeletePopup()}
        <Feed.Summary>
          <Feed.User as="a" href={`/user/${user.username}`}>
            {user.name}
          </Feed.User>
          {" "}
          liked your
          {" "}
          {notification.post && <a href={`/post/${notification.post._id}`}>post</a>}
          {!notification.post && <span>post (deleted)</span>}

          <Feed.Date>{moment(notification.createdAt).calendar()}</Feed.Date>
        </Feed.Summary>

        {notification.post && notification.post.picUrl &&
          <Feed.Extra images>
            <a href={`/post/${notification.post._id}`}>
              <img src={notification.post.picUrl} alt="" />
            </a>
          </Feed.Extra>
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
