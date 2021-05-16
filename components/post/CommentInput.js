import {useState} from "react";
import {Form} from "semantic-ui-react";
import axios from "axios";

const CommentInput = ({user, postId, setComments}) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /*----------------------*/
  // Agregar un comentario
  /*----------------------*/
  const createCommentHandler = async (postId) => {
    try {
      setLoading(true);

      const res = await axios({
        method: "POST",
        url: `/api/posts/comments/${postId}`,
        data: {text},
        headers: {
          "Content-Type": "application/json"
        },
        withCredentials: true,
      });

      setComments(res.data.data);
      setLoading(false);
      setText("");
      
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
    <Form reply>
      <Form.Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add comment"
        disabled={loading}
        action={{
          color: "blue",
          icon: "edit",
          loading,
          disabled: loading || text.length === 0,
          onClick: () => createCommentHandler(postId)
        }}
      />
    </Form>
  )
}

export default CommentInput;
