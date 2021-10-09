import {useState, useEffect, useContext} from "react";
import Link from "next/link";
import {Card, Icon, Image, Divider, Segment, Button, Popup, Header, Modal, Loader} from "semantic-ui-react";
import axios from "axios";
import moment from "moment";
import {ToastContainer, toast} from "react-toastify";
import PostComment from "./PostComment";
import CommentInput from "./CommentInput";
import LikesList from "./LikesList";
import ImageModal from "./ImageModal";
import NoImageModal from "./NoImageModal";
import {PostsSubscribedContext} from "../../context/PostsSubscribedContext";
import classes from "./cardPost.module.css";


const CardPost = ({user, post, setPosts, noPadding, socket}) => {
  const {postsSubscribed, updatePostsSubscribed, removePostSubscribed} = useContext(PostsSubscribedContext);

  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(null);
  const [loadingComments, setLoadingComments] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [endOfComments, setEndOfComments] = useState(false);

  const [likes, setLikes] = useState(post.likes || []);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  /*-----------------------------------------------*/
  // Verificar si el usuario está suscrito al post
  /*-----------------------------------------------*/
  useEffect(() => {
    if(post && user) {
      if(postsSubscribed.includes(post._id.toString())) {
        setIsSubscribed(true)
      } else {
        setIsSubscribed(false)
      }
    }
  }, [post, user, postsSubscribed]);

  /*-----------------------------------*/
  // Consultar los comentarios del post
  /*-----------------------------------*/
  useEffect(() => {
    if(!endOfComments) {
      setLoadingComments(true);

      axios({
        method:"GET",
        url: `/api/comments/${post._id}?page=${currentPage}`
      })
      .then(res => {
        const {commentsCount, comments, isLastPage} = res.data.data;

        setCommentsCount(commentsCount);
        setComments(prev => [...prev, ...comments]);
        setLoadingComments(false);

        if(isLastPage) {
          setEndOfComments(true);
        }
      })
      .catch(err => {
        let message = err.message;
        if(err.response) {
          message = err.response.data.message
        }
        console.log({errorLoadingComments: message})
        setLoadingComments(false);
      })
    }

  }, [post, endOfComments, currentPage]);

  /*----------------------------------------------------------*/
  // Verificar si el post ya fue likeado por el usuario actual
  /*----------------------------------------------------------*/
  useEffect(() => {
    if(user && likes.length > 0) {
      const isLiked = !!likes.find(like => like.author._id.toString() === user._id.toString());
      setIsLiked(isLiked)
    } else {
      setIsLiked(false);
    }
  }, [user, likes]);

  if(!user) {
    return null;
  }

  /*------------*/
  // Borrar post
  /*------------*/
  const deletePostHandler = async (postId) => {
    try {
      setError(null);
      setLoading(true);
      setDeleting(postId.toString());

      await axios({
        method: "DELETE",
        url: `/api/posts/${postId}`,
        withCredentials: true
      });

      // Extraer el post eliminado del state
      setPosts(prev => {
        const filteredPosts = prev.filter(post => post._id.toString() !== postId.toString());
        return filteredPosts;
      });

      setLoading(false);
      setDeleting(null);
      setIsModalOpen(false);
      toast.dark("Post deleted successfully")
      
    } catch (error) {
      let message = error.message;

      if(error.response) {
        message = error.response.data.message
      }

      setError(message);
      setLoading(false);
      setDeleting(null);
    }
  }

  /*-------------------------*/
  // Dar/remover like al post
  /*-------------------------*/
  const likesHandler = async (postId) => {
    try {
      setLoading(true);

      const res = await axios({
        method: "PATCH",
        url: `/api/likes/${postId}`,
      });

      const {like, eventType} = res.data.data;

      // Chequear si es like o dislike
      if(eventType === "liked") {
        setLikes(prev => [like, ...prev]);

        // Emitir al backend el evento de notificación al likear el post
        // sólo si el autor del like no es el autor del post
        if(user._id.toString() !== post.user._id.toString()) {
          socket.emit("notificationReceived", {userToNotify: post.user._id});
        }

      } else if(eventType === "disliked") {
        setLikes(prev => {
          return [...prev].filter(el => el.author._id.toString() !== like.author._id.toString())
        })
      }

      setLoading(false);
      
    } catch (error) {
      let message = error.message;

      if(error.response) {
        message = error.response.data.message
      }

      setError(message);
      setLoading(false);
    }
  }


  /*---------------------------------------------------------*/
  // Desuscribirse (dejar de recibir notificaciones) del post
  /*---------------------------------------------------------*/
  const subscriptionHandler = async (postId) => {
    try {
      setSubscribing(true);

      const operationType = isSubscribed ? "unsubscribe" : "subscribe";

      await axios({
        method: "PUT",
        url: `/api/posts/togglesubscription/${postId}`,
        params: {
          operationType
        }
      });

      if(!isSubscribed) {
        updatePostsSubscribed(postId);

      } else {
        removePostSubscribed(postId);
      }

      const successMsg = operationType === "subscribe" ? "Subscribed successfully to this post" : "You won't receive future notifications from this post"

      toast.dark(successMsg);
      setIsSubscribed(prev => !prev);
      setSubscribing(false);
      
    } catch (error) {
      console.log(error.message);
      setSubscribing(false);
    }
  }


  return (
    <>
      {isModalOpen ?
        <Modal
          className={classes[post.picUrl ? "post-card__image-modal" : "post-card__noimage-modal"]}
          closeIcon
          open={isModalOpen}
          closeOnDimmerClick
          onClose={() => setIsModalOpen(false)}
        >
          <Modal.Content>
            {post.picUrl ?
              <ImageModal
                post={post}
                user={user}
                socket={socket}
                comments={comments}
                setComments={setComments}
                setCommentsCount={setCommentsCount}
                commentsCount={commentsCount}
                endOfComments={endOfComments}
                loadingComments={loadingComments}
                setCurrentPage={setCurrentPage}
                likes={likes}
                isLiked={isLiked}
                likesHandler={likesHandler}
                loading={loading}
                deleting={deleting}
                deletePostHandler={deletePostHandler}
                subscribing={subscribing}
                isSubscribed={isSubscribed}
                subscriptionHandler={subscriptionHandler}
              />
              :
              <NoImageModal
                post={post}
                user={user}
                socket={socket}
                comments={comments}
                setComments={setComments}
                setCommentsCount={setCommentsCount}
                commentsCount={commentsCount}
                endOfComments={endOfComments}
                loadingComments={loadingComments}
                setCurrentPage={setCurrentPage}
                likes={likes}
                isLiked={isLiked}
                likesHandler={likesHandler}
                loading={loading}
                deleting={deleting}
                deletePostHandler={deletePostHandler}
                subscribing={subscribing}
                isSubscribed={isSubscribed}
                subscriptionHandler={subscriptionHandler}
              />
            }
          </Modal.Content>
        </Modal>
        :
        null
      }

      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={true}
      />

      <Segment
        style={{
          padding: noPadding ? 0 : "1rem",
          boxShadow: "0 0 5px rgba(0,0,0,0.25)",
          borderRadius: "5px"
        }}
        basic
      >
        <Card
          style={{opacity: loading && (deleting === post._id.toString()) ? 0.5 : 1 }}
          color="teal"
          fluid
        >
          {post.picUrl &&
            <Image
              style={{
                width: "100%",
                maxHeight: "95vh",
                objectFit: "contain",
                objectPosition: "center center",
                cursor: "pointer"
              }}
              src={post.picUrl}
              floated="left"
              ui={false}
              alt="Post image"
              onClick={() => setIsModalOpen(true)}
            />
          }
          <Card.Content>
            {/* Avatar del usuario y botón de borrar */}
            <Image
              className={classes["post-card__user-avatar"]}
              floated="left"
              src={post.user.avatar}
              avatar circular
            />
            {/* Popup para eliminar el post */}
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
            {/* Nombre completo del usuario */}
            <Card.Header>
              <Link href={`/user/${post.user.username}`}>
                <a>{post.user.name}</a>
              </Link>
            </Card.Header>
            <Card.Meta>
              <div
                className={classes["post-card__link"]}
                onClick={() => setIsModalOpen(true)}
              >
                {moment(post.createdAt).calendar()}
              </div>
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
            <Card.Description
              style={{
                fontSize: "17px",
                wordSpacing: "0.35px",
                whiteSpace: "pre-line"
              }}
            >
              {post.content}
            </Card.Description>
          </Card.Content>

          {/* Sección de likes y comentarios */}
          <Card.Content extra>
            <div style={{position: "relative"}}>
              {/* Likes */}
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
                    style={{cursor: !loading ? "pointer" : "default"}}
                    onClick={() => !loading && likesHandler(post._id)}
                  >
                    {likes.length} {likes.length === 1 ? "like" : "likes"}
                  </span>
                }
              />

              {/* Comentarios */}
              <Icon
                style={{marginLeft: "7px"}}
                name="comment outline"
                color="blue"
              />
              <span>{commentsCount} comments</span>

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

            {/* Campo para agregar comentarios */}
            <CommentInput
              user={user}
              post={post}
              isSubscribed={isSubscribed}
              postAuthor={post.user._id}
              socket={socket}
              setComments={setComments}
              setCommentsCount={setCommentsCount}
            />
            {comments.length > 0 &&
              comments.map(comment => {
                return (
                  <PostComment
                    key={comment._id}
                    comment={comment}
                    postId={post._id}
                    user={user}
                    socket={socket}
                    setComments={setComments}
                    setCommentsCount={setCommentsCount}
                  />
                )
              })
            }
            {/* Loader indicador de carga de comentarios */}
            {loadingComments &&
              <div style={{marginTop: "10px"}}>
                <Loader active inline="centered" />
              </div>
            }
            {/* Botón para cargar más comentarios */}
            {commentsCount > 0 &&
              <div style={{display: "flex", justifyContent: "center", marginTop: "10px"}}>
                <Button
                  compact
                  content={`${!endOfComments ? "Load more comments..." : "End of comments..."}`}
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
          </Card.Content>
        </Card>
      </Segment>
    </>
  )
}

export default CardPost;
