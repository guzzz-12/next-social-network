import {useState, useContext, useEffect} from "react";
import {Form} from "semantic-ui-react";
import axios from "axios";
import {PostsSubscribedContext} from "../../context/PostsSubscribedContext";

const CommentInput = ({user, post, setComments, setCommentsCount, socket, postAuthor, isSubscribed}) => {
  const {updatePostsSubscribed} = useContext(PostsSubscribedContext);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChangeHandler = (e) => {
    setText(e.target.value)
  }

  
  /*----------------------*/
  // Agregar un comentario
  /*----------------------*/
  const createCommentHandler = async (postId, commentText, isSubscribed) => {
    try {
      setLoading(true);
      
      const res = await axios({
        method: "POST",
        url: `/api/comments/${postId}`,
        data: {text: commentText},
        headers: {
          "Content-Type": "application/json"
        },
        withCredentials: true,
      });

      
      setComments(prev => [res.data.data, ...prev]);
      setCommentsCount(prev => prev + 1);
      setLoading(false);
      setText("");

      // Agregar el post al state de posts suscritos si no lo está
      if(!isSubscribed) {
        updatePostsSubscribed(postId)
      }

      // Emitir evento de notificación al backend
      // sólo si el autor del comentario no es el autor del post
      if(user._id?.toString() !== postAuthor.toString()) {
        socket.emit("notificationReceived", {userToNotify: postAuthor});
      }
      
      // Emitir el evento de nuevo comentario al backend
      socket.emit("commentCreated", {postId, comment: res.data.data});
      
      // Emitir evento de nueva notificación a los usuarios suscritos al post
      const {_id, text} = res.data.data;
      socket.emit("notifyToPostFollowers", {
        userNotifierId: user._id.toString(),
        postId,
        commentId: _id,
        commentText: text
      })
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message
      }
      setError(message);
      setLoading(false);
      console.log({ErrorCreatingComment: message})
    }
  }


  return (
    <Form reply style={{marginBottom: "10px"}}>
      <Form.Input
        value={text}
        onChange={onChangeHandler}
        placeholder="Add comment"
        disabled={loading}
        action={{
          color: "blue",
          icon: "edit",
          loading,
          disabled: loading || text.length === 0,
          onClick: () => createCommentHandler(post._id, text, isSubscribed)
        }}
      />
    </Form>
  )
}

export default CommentInput;
