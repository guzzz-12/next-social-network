import {Feed} from "semantic-ui-react";
import moment from "moment";

const CommentNotification = ({notification}) => {
  const user = notification.userNotifier;

  return (
    <Feed.Event>
      <Feed.Label
        as="a"
        href={`/user/${user.username}`}
        image={user.avatar}
      />
      <Feed.Content style={{marginTop: 0}}>
        <Feed.Summary>
          <Feed.User as="a" href={`/user/${user.username}`}>
            {user.name}
          </Feed.User>
          {" "}
          commented on your
          {" "}
          {notification.post && <a href={`/post/${notification.post._id}`}>post</a>}
          {!notification.post && <span>post (deleted)</span>}

          <Feed.Date>{moment(notification.createdAt).calendar()}</Feed.Date>
        </Feed.Summary>

        {/* Imagen del post (si la tiene) */}
        {notification.post && notification.post.picUrl &&
          <Feed.Extra images>
            <a href={`/post/${notification.post._id}`}>
              <img src={notification.post.picUrl} alt="" />
            </a>
          </Feed.Extra>
        }

        {/* Texto del post comentado (si es de tipo texto) */}
        {notification.post && !notification.post.picUrl &&
          <Feed.Extra style={{maxWidth: "100%"}} text>
            {notification.post.content}
          </Feed.Extra>
        }

        {/* Texto del comentario */}
        <Feed.Extra text>
          <strong>{notification.commentText}</strong>
        </Feed.Extra>

      </Feed.Content>
    </Feed.Event>
  )
}

export default CommentNotification;