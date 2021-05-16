import Link from "next/link";
import {Grid, Image, Card, Icon, Divider, Popup, Button, Header} from "semantic-ui-react";
import moment from "moment";
import PostComment from "./PostComment";
import CommentInput from "./CommentInput";
import LikesList from "./LikesList";
import classes from "./imageModal.module.css";

const ImageModal = ({post, user, likes, comments, setComments, likesHandler, deleting, deletePostHandler, isLiked, loading}) => {
  return (
    <Grid
      stackable
      relaxed
      className={classes["image-modal__grid"]}
      style={{opacity: loading && deleting ? 0.5 : 1}}
    >
      <Grid.Row className={classes["image-modal__row"]}>
        <Grid.Column
          className={classes["image-modal__img-column"]}
          width={10}
          verticalAlign="middle"
        >
          <Image
            style={{width: "100%"}}
            src={post.picUrl}
            size="large"
            wrapped
          />
        </Grid.Column>
        
        <Grid.Column width={6} className={classes["image-modal__text-column"]}>
          <Card fluid className={classes["image-modal__text"]}>
            {/* Información del post (Flex item 1) */}
            <Card.Content className={classes["image-modal__user"]}>
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
              <Image  src={user.avatar} floated="left" inline avatar />

              {/* Nombre completo del usuario */}
              <Card.Header>
                <Link href={`/${post.user.username}`}>
                  <a>{post.user.name}</a>
                </Link>
              </Card.Header>
              <Card.Meta>
                {moment(post.createdAt).calendar()}
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
              <Card.Description className={classes["image-modal__description"]}>
                {post.content}
              </Card.Description>
            </Card.Content>

            {/* Sección de likes y comentarios (Flex item 2) */}
            <Card.Content extra className={classes["image-modal__likes-comments"]}>
              <div style={{display: "flex", }}>
                {/* Contador de likes */}
                <div>
                  <Icon
                    style={{cursor: !loading ? "pointer" : "default"}}
                    name={isLiked ? "heart" : "heart outline"}
                    color="red"
                    onClick={() => !loading && likesHandler(post._id)}
                  />
                  {/* Popup con la lista de likes */}
                  {likes.length > 0 &&
                    <LikesList
                      postId={post._id}
                      trigger={
                        <span style={{cursor: "pointer"}}>
                          {likes.length} {likes.length === 1 ? "like" : "likes"}
                        </span>
                      }
                    />
                  }
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
              </div>

              <Divider />

              {/* Lista de comentarios */}
              <div className={classes["image-modal__comments-list"]}>
                {comments.length > 0 &&
                  comments.map(comment => {
                    return (
                      <PostComment
                        key={comment._id}
                        comment={comment}
                        postId={post._id}
                        user={user}
                        setComments={setComments}
                      />
                    )
                  })
                }
              </div>

              {/* Input para agregar comentarios */}
              <div className={classes["image-modal__comment-input"]}>
                <CommentInput
                  user={user}
                  postId={post._id.toString()}
                  setComments={setComments}
                />
              </div>
            </Card.Content>
          </Card>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}

export default ImageModal;