import {Divider, Feed} from "semantic-ui-react";
import moment from "moment";

const LikeNotification = ({notification}) => {
  const user = notification.notificationUser;

  return (
    <Feed.Event>
      <Feed.Label image={user.avatar}/>
      <Feed.Content>
        <Feed.Summary>
          <>
            <Feed.User as="a" href={`/user/${user.username}`}>
              {user.name}
            </Feed.User>
            {" "}
            liked your
            {" "}
            {notification.post && <a href={`/post/${notification.post._id}`}>post</a>}
            {!notification.post && <span>post (deleted)</span>}

            <Feed.Date>{moment(notification.date).calendar()}</Feed.Date>
          </>
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
