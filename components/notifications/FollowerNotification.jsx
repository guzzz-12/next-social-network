import {Feed} from "semantic-ui-react";
import moment from "moment";

const FollowerNotification = ({notification}) => {
  const user = notification.notificationUser;

  console.log({notification})

  return (
    <Feed.Event>
      <Feed.Label
        style={{display: "flex", alignItems: "center"}}
        as="a"
        href={`/user/${user.username}`}
        image={user.avatar}
      />
      <Feed.Content>
        <Feed.Summary>
          <Feed.User as="a" href={`/user/${user.username}`}>
            {user.name}
          </Feed.User>
          {" "}
          started following you
          {" "}
          <Feed.Date>{moment(notification.date).calendar()}</Feed.Date>
        </Feed.Summary>
      </Feed.Content>
    </Feed.Event>
  )
}

export default FollowerNotification;