import Link from "next/link";
import {Grid, Modal, Image, Card, Icon, Divider, Popup, Button, Header} from "semantic-ui-react";
import moment from "moment";
import PostComment from "./PostComment";
import CommentInput from "./CommentInput";
import LikesList from "./LikesList";
import classes from "./modal.module.css";

const ImageModal = ({
  post,
  user,
  socket,
  likes,
  comments,
  setComments,
  setCurrentPage,
  endOfComments,
  loadingComments,
  commentsCount,
  setCommentsCount,
  likesHandler,
  deleting,
  deletePostHandler,
  isLiked,
  loading,
  subscribing,
  isSubscribed,
  subscriptionHandler
}) => {

  return (
    <Grid
      stackable
      relaxed
      className={classes["modal__grid"]}
      style={{ opacity: loading && deleting ? 0.5 : 1}}
    >
      <Grid.Row className={classes["modal__row"]}>
        <Grid.Column
          className={classes["modal__img-column"]}
          width={10}
          verticalAlign="middle"
        >
          <Image
            className={classes["modal__img"]}
            src={post.picUrl}
            wrapped
          />
        </Grid.Column>
        
        <Grid.Column width={6} className={classes["modal__text-column"]}>
          <Modal.Content scrolling>
            <Card fluid className={classes["modal__text"]}>
              {/* Información del post (Flex item 1) */}
              <Card.Content className={classes["modal__user"]}>
                {/* Botón para borrar el post */}
                {user.role === "admin" || (user._id.toString() === post.user._id.toString()) ?
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
                            cursor: loading && deleting ? "default" : "pointer"
                          }}
                          disabled={loading && !!deleting}
                          name="trash"
                          size="large"
                          color="red"
                          floated="right"
                        />
                      }
                    >
                      <Header as="h4" content="Delete post?"/>
                      <p>This action cannot be undone</p>
                      <Button
                        disabled={loading && !!deleting}
                        color="red"
                        icon="trash"
                        content="Delete"
                        onClick={() => deletePostHandler(post._id)}
                      />
                    </Popup>
                  </div>
                  :
                  null
                }
                {/* Avatar del autor del post */}
                <Image  src={post.user.avatar} floated="left" inline avatar />
                {/* Nombre completo del usuario */}
                <Card.Header>
                  <Link href={`/user/${post.user.username}`}>
                    <a>{post.user.name}</a>
                  </Link>
                </Card.Header>
                <Card.Meta>
                  <Link href={`/post/${post._id}`}>
                    <a>{moment(post.createdAt).calendar()}</a>
                  </Link>
                </Card.Meta>
                {/* Location del post (si se especifica) */}
                {post.location ?
                  <Card.Meta>
                    <Icon name="location arrow" size="small" color="grey" />
                    {" "}
                    {post.location}
                  </Card.Meta>
                  :
                  null
                }
                {/* Contenido de texto del post */}
                <Card.Description className={classes["modal__description"]}>
                  {post.content}
                </Card.Description>
              </Card.Content>

              {/* Sección de likes y comentarios (Flex item 2) */}
              <Card.Content extra className={classes["modal__likes-comments"]}>
                <div style={{display: "flex", position: "relative"}}>
                  {/* Contador de likes */}
                  <div>
                    <Icon
                      style={{cursor: !loading ? "pointer" : "default"}}
                      name={isLiked ? "heart" : "heart outline"}
                      color="red"
                      onClick={() => !loading && likesHandler(post._id)}
                    />
            
                    {/* Popup con la lista de likes */}
                    <LikesList
                      postId={post._id}
                      trigger={
                        <span
                          style={{cursor: "pointer"}}
                          onClick={() => !loading && likesHandler(post._id)}
                        >
                          {likes.length} {likes.length === 1 ? "like" : "likes"}
                        </span>
                      }
                    />
                  </div>

                  {/* Contador de comentarios */}
                  <div>
                    <Icon
                      style={{marginLeft: "7px"}}
                      name="comment outline"
                      color="blue"
                    />
                    <span>{comments.length} comments</span>
                  </div>

                  {/* Popup para subscribirse/desubscribirse del post */}
                  {/* Mostrar sólo si no es el autor del post */}
                  {post.user._id.toString() !== user?._id.toString() &&
                    <div style={{position: "absolute", right: 0, top: 0, cursor: "pointer"}}>
                      <Popup
                        on="click"
                        position="top right"
                        trigger={
                          <Icon
                            name={isSubscribed ? "bell slash" : "bell"}
                            size="small"
                            circular
                          />
                        }
                      >
                        <Header
                          as="h4"
                          content={isSubscribed ? "Stop notifications?" : "Receive notifications?"}
                        />
                        <Button
                          disabled={(loading && !!deleting) || subscribing}
                          color="red"
                          icon="trash"
                          content={isSubscribed ? "Unsubscribe" : "Subscribe"}
                          onClick={() => subscriptionHandler(post._id)}
                        />
                      </Popup>
                    </div>
                  }
                </div>

                <Divider />

                {/* Input para agregar comentarios */}
                <div className={classes["modal__comment-input"]}>
                  <CommentInput
                    user={user}
                    post={post}
                    isSubscribed={isSubscribed}
                    postAuthor={post.user._id}
                    socket={socket}
                    setComments={setComments}
                    setCommentsCount={setCommentsCount}
                  />
                </div>
                {/* Lista de comentarios */}
                <div className={classes["modal__comments-list"]}>
                  {comments.length > 0 &&
                    comments.map(comment => {
                      return (
                        <PostComment
                          key={comment._id}
                          comment={comment}
                          postId={post._id}
                          post={post}
                          user={user}
                          setComments={setComments}
                          setCommentsCount={setCommentsCount}
                        />
                      )
                    })
                  }
                  {/* Botón para cargar más comentarios */}
                  {commentsCount > 0 &&
                    <div style={{display: "flex", justifyContent: "center", marginTop: "10px"}}>
                      <Button
                        compact
                        content={`${!endOfComments ? "Load more comments..." : "End of comments..."}`}
                        loading={loadingComments}
                        disabled={loadingComments || endOfComments}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                      />
                    </div>
                  }
                  {/* Mensaje de post sin comentarios */}
                  {!loadingComments && commentsCount === 0 &&
                    <>
                      <Divider />
                      <p>No comments yet...</p>
                    </>
                  }
                </div>
              </Card.Content>
            </Card>
          </Modal.Content>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}

export default ImageModal;