import {useState} from "react";
import {useRouter} from "next/router";
import {List, Popup, Image, Loader} from "semantic-ui-react";
import axios from "axios";

const LikesList = ({postId, trigger}) => {
  const router = useRouter();

  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*------------------------------*/
  // Consultar los likes del post
  /*------------------------------*/
  const getLikes = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios({
        method: "GET",
        url: `/api/posts/likes/${postId}`
      });

      setLikes(res.data.data.likes);
      setLoading(false);
      
    } catch (err) {
      let message = err.message;
      if(err.response) {
        message = err.response.data.message;
      }
      setError(message);
      setLoading(false);
    }
  }

  return (
    <Popup
      on="hover"
      onOpen={() => getLikes()}
      onClose={() => setLikes([])}
      popperDependencies={[likes]}
      trigger={trigger}
      wide
    >
      {loading ?
        <div
          style={{
            minWidth: "210px",
            height: "auto",
            maxHeight: "15rem",
            overflow: "auto"
          }}
        >
          <Loader
            content="Loading likes..."
            size="small"
            inline="centered"
            active
          />
        </div>
        :
        !loading && likes.length > 0 ?
        <div
          style={{
            minWidth: "210px",
            height: "auto",
            maxHeight: "15rem",
            overflow: "auto"
          }}
        >
          <List selection size="large" divided>
            {likes.map(like => {
              return (
                <List.Item
                  key={like._id}
                  onClick={() => router.push(`/${like.user.username}`)}
                >
                  <Image src={like.user.avatar} avatar inline />
                  <List.Content>
                    <List.Header content={like.user.name} />
                    <List.Description content={`@${like.user.username}`} />
                  </List.Content>
                </List.Item>
              )
            })}
          </List>
        </div>
        :
        <span>No likes yet...</span>
      }
    </Popup>
  )
}

export default LikesList;
