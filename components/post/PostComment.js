import {useState, useEffect} from "react";
import Link from "next/link";
import {Comment, Form, Icon, Popup, Header, Button} from "semantic-ui-react";
import axios from "axios";
import moment from "moment";

const PostComment = ({comment, user, setComments, setCommentsCount}) => {
  const [editMode, setEditMode] = useState(false);
  const [text, setText] = useState(comment.text);
  const [editing, setEditing] = useState(false);
  const [editingError, setEditingError] = useState(null);

  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  /*-----------------------------------------------------*/
  // Cancelar la edición del comentario al presionar ESC
  /*-----------------------------------------------------*/
  useEffect(() => {
    if(editMode) {
      window.onkeydown = (e) => {
        if(e.keyCode === 27) {
          setEditMode(false);
          setText(comment.text)
        } else {
          return null
        }
      }
    }
  }, [editMode]);

  /*-----------------------*/
  // Eliminar un comentario
  /*-----------------------*/
  const deleteCommentHandler = async (commentId) => {
    try {
      setDeleting(commentId.toString());
      setError(null);

      await axios({
        method: "DELETE",
        url: `/api/comments/${commentId}`
      });

      setComments(prev => {
        return prev.filter(comment => comment._id.toString() !== commentId.toString())
      });
      setCommentsCount(prev => prev - 1);
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

  /*---------------------*/
  // Editar un comentario
  /*---------------------*/
  const editCommentHandler = async (commentId) => {
    try {
      setEditing(true);

      const res = await axios({
        method: "PATCH",
        url: `/api/comments/${commentId}`,
        data: {text},
        headers: {
          "Contente-Type": "application/jason"
        }
      });

      const editedComment = res.data.data;

      // Actualizar el state con el comentario editado
      setComments(prev => {
        const currentComments = [...prev];
        const editedCommentIndex = currentComments.findIndex(item => item._id.toString() === commentId.toString());
        currentComments.splice(editedCommentIndex, 1, editedComment);
        return currentComments;
      });

      setEditing(false);
      setEditMode(false);
      
    } catch (error) {
      let message = error.message;

      if(error.response) {
        message = error.response.data.message
      }

      setText(comment.text);
      setEditing(false);
      setEditingError(message);
    }
  }

  return (
    <>
      {/* Formulario para editar el comentario */}
      {editMode && 
        <Form reply>
          <Form.Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Edit comment"
            disabled={editing}
            action={{
              color: "blue",
              icon: "edit",
              loading: editing,
              disabled: editing || text.length === 0,
              onClick: () => editCommentHandler(comment._id)
            }}
          />
        </Form>
      }

      {/* Contenido del comentario */}
      {!editMode &&
        <Comment.Group>
          <Comment style={{
            position: "relative",
            width: "100%",
            paddingBottom: "6px",
            borderBottom: "1px solid lightgray",
            opacity: deleting && deleting.toString() === comment._id.toString() ? 0.5 : 1
          }}>
            <Comment.Avatar src={comment.author.avatar} />
            <Comment.Content>
              <Comment.Author as={Link} href={`/user/${comment.author.username}`}>
                {comment.author.name}
              </Comment.Author>

              <Comment.Metadata>
                <div>
                  {moment(comment.createdAt).calendar()}
                  {" "}
                  {comment.createdAt.toString() !== comment.updatedAt.toString() ? "(Edited)" : ""}
                </div>
              </Comment.Metadata>

              <Comment.Text>{comment.text}</Comment.Text>

              <Comment.Actions style={{position: "absolute", top: 0, right: 0}}>
                <Comment.Action>
                  {user.role === "admin" || (comment.user.toString() === user._id.toString()) ?
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
                          name="chevron down"
                          color="grey"
                          floated="right"
                        />
                      }
                    >
                      <Header
                        as="h4"
                        textAlign="center"
                        content="Edit or delete comment"
                      />
                      <Button
                        color="teal"
                        basic
                        compact
                        content="Edit"
                        icon="edit outline"
                        disabled={deleting && deleting.toString() === comment._id.toString()}
                        onClick={() => setEditMode(true)}
                      />
                      <Button
                        color="red"
                        basic
                        compact
                        content="Delete"
                        icon="trash"
                        disabled={deleting && deleting.toString() === comment._id.toString()}
                        onClick={() => deleteCommentHandler(comment._id)}
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
      }
    </>
  )
}

export default PostComment;