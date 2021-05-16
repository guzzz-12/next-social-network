import {useState} from "react";
import {Comment, Icon, Popup, Header, Button} from "semantic-ui-react";
import axios from "axios";
import moment from "moment";

const PostComment = ({comment, postId, user, setComments}) => {
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  /*-----------------------*/
  // Eliminar un comentario
  /*-----------------------*/
  const deleteCommentHandler = async (postId, commentId) => {
    try {
      setDeleting(commentId.toString());
      setError(null);

      await axios({
        method: "DELETE",
        url: `/api/posts/comments/${postId}/${commentId}`,
        withCredentials: true
      });

      setComments(prev => {
        return prev.filter(comment => comment._id.toString() !== commentId.toString())
      });
      setDeleting(null);
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message
      }
      setError(message);
      setDeleting(null);
      console.log({ErrorDeletingComment: message})
    }
  }

  return (
    <Comment.Group>
      <Comment style={{
        position: "relative",
        opacity: deleting && deleting.toString() === comment._id.toString() ? 0.5 : 1
      }}>
        <Comment.Avatar src={comment.user.avatar} />
        <Comment.Content>
          <Comment.Author as="a">{comment.user.name}</Comment.Author>

          <Comment.Metadata>
            <div>{moment(comment.date).calendar()}</div>
          </Comment.Metadata>

          <Comment.Text>{comment.text}</Comment.Text>

          <Comment.Actions style={{position: "absolute", top: 0, right: 0}}>
            <Comment.Action>
              {user.role === "admin" || (comment.user._id.toString() === user._id.toString()) ?
                <Popup
                  on="click"
                  position="top right"
                  size="small"
                  trigger={
                    <Icon
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        cursor: deleting && deleting.toString() === comment._id.toString() ? "default" : "pointer"
                      }}
                      disabled={deleting && deleting.toString() === comment._id.toString()}
                      name="delete"
                      color="red"
                      floated="right"
                    />
                  }
                >
                  <Header as="h4" content="Delete comment?"/>
                  <Button
                    disabled={deleting && deleting.toString() === comment._id.toString()}
                    color="red"
                    basic
                    icon="trash"
                    content="Delete"
                    onClick={() => deleteCommentHandler(postId, comment._id)}
                  />
                </Popup>
                :
                null
              }
            </Comment.Action>
          </Comment.Actions>
        </Comment.Content>
      </Comment>
    </Comment.Group>
  )
}

export default PostComment;