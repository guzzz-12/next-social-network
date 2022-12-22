import {useEffect, useState, useContext} from "react";
import Head from "next/head";
import Link from "next/link";
import {useRouter} from "next/router";
import {Container, Header, Card, Icon, Image, Divider, Segment, Button, Popup, Message, Loader} from "semantic-ui-react";
import moment from "moment";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies} from "nookies";
import unauthRedirect from "../../utilsServer/unauthRedirect";
import {toast} from "react-toastify";
import PostComment from "../../components/post/PostComment";
import CommentInput from "../../components/post/CommentInput";
import LikesList from "../../components/post/LikesList";
import {UserContext} from "../../context/UserContext";
import {SocketContext} from "../../context/SocketProvider";
import {PostsSubscribedContext} from "../../context/PostsSubscribedContext";
import useUpdateTitleNotifications from "../../hooks/useUpdateTitleNotifications";
import useReinitializeNotifications from "../../hooks/useReinitializeNotifications";
import {checkVerification} from "../../utilsServer/verificationStatus";
import styles from "./post.module.css";

const PostPage = (props) => {
  const router = useRouter();
  const {currentUser: user} = useContext(UserContext);
  const {socket} = useContext(SocketContext);
  const {postsSubscribed} = useContext(PostsSubscribedContext);
  const {post} = props;

  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loadingComments, setLoadingComments] = useState(true);
  const [_commentError, setCommentError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [endOfComments, setEndOfComments] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState(null);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Actualizar el title
  const updatedTitle = useUpdateTitleNotifications(`Next Social Network | ${post.user.name.split(" ")[0]}'s post`);
  
  // Reinicializar los contadores de notificaciones y mensajes sin leer
  // al hacer hard refresh de la página.
  useReinitializeNotifications();

  /*----------------------------------------------------*/
  // Verificar si el usuario está suscrito al post
  // Sólo aplica para recibir o dejar de recibir
  // notificaciones de los comentarios de otros usuarios
  /*----------------------------------------------------*/
  useEffect(() => {
    if(post && user) {
      if(postsSubscribed.includes(post._id.toString())) {
        setIsSubscribed(true)
      } else {
        setIsSubscribed(false)
      }
    }
  }, [post, user, postsSubscribed]);


  /*--------------------------------------------------------------*/
  // Suscribir/desuscribir el usuario al post
  // Agregar en tiempo real los nuevos comentarios de los usuarios
  /*--------------------------------------------------------------*/
  useEffect(() => {
    let data = {}

    if(socket && user) {
      data = {
        postId: post._id.toString(),
        userId: user._id.toString()
      }
      socket.emit("subscribeUserToPost", data)
    }

    // Agregar en tiempo real los nuevos comentarios de los usuarios
    socket.on("newComment", (comment) => {
      setComments(prev => [comment, ...prev])
    });

    // Aactualizar el comentario editado en tiempo real
    socket.on("editedComment", (comment) => {
      setComments(prev => {
        const updatedComments = [...prev];
        const index = updatedComments.findIndex(el => el._id.toString() === comment._id.toString());
        updatedComments.splice(index, 1, comment);
        return updatedComments;
      })
    })

    // Eliminar en tiempo real el comentario eliminado por otro usuario
    socket.on("deletedComment", (commentId) => {
      console.log({DELETED_COMMENT: commentId});
      setComments(prev => {
        const filtered = prev.filter(el => el._id.toString() !== commentId);
        return filtered
      })
    });

    return () => socket.emit("unsubscribeUserFromPost", data)
  }, [socket, user]);


  /*-----------------------------------*/
  // Consultar los comentarios del post
  /*-----------------------------------*/
  useEffect(() => {    
    if(!endOfComments){
      setLoadingComments(true);
      axios({
        method: "GET",
        url: `/api/comments/${post._id}?page=${currentPage}`
      })
      .then(res => {
        const {comments, commentsCount, isLastPage} = res.data.data;
        
        setCommentsCount(commentsCount);
        setComments(prev => [...prev, ...comments]);

        if(isLastPage) {
          setEndOfComments(true);
        }

        setLoadingComments(false);
      })
      .catch(err => {
        let message = err;
        if(err.response) {
          message = err.response.data.message
        }
        setCommentError(message);
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

      setLoading(false);
      setDeleting(null);
      toast.dark("Post deleted successfully");

      // Redirigir al eliminar el post
      setTimeout(() => {
        router.push("/");
      }, 2500);
      
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
        setLikes(prev => [...prev, like]);

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


  /*-------------------------------------------*/
  // Suscribirse/desuscribirse para recibir
  // o dejar de recibir notificaciones del post
  /*-------------------------------------------*/
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

      if (operationType === "unsubscribe") {
        socket.emit("unsubscribeUserFromPost", {postId, userId: user._id});
      };

      const successMsg = operationType === "subscribe" ? "Subscribed successfully to this post" : "You won't receive future notifications from this post"

      toast.dark(successMsg);
      setIsSubscribed(prev => !prev);
      setSubscribing(false);
      
    } catch (error) {
      console.log(error.message);
      setSubscribing(false);
    }
  }


  /*-------------------------------------------*/
  // Mostrar mensaje de error al cargar el post
  /*-------------------------------------------*/
  if(props.error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: "350px",
          minHeight: "80vh",
          margin: "0 auto",
          paddingTop: "1rem"
        }}
      >
        <Message negative
          icon="warning sign"
          header="Error loading post!"
          content={props.error.includes("Cast to ObjectId") ? "Post not found or deleted" : props.error}
        />
      </div>
    )
  }

  return (
    <Container text>
      <Head>
        <title>{updatedTitle}</title>
      </Head>

      <Segment basic>
        <Card
          style={{opacity: loading && (deleting === post._id.toString()) ? 0.5 : 1 }}
          color="teal"
          fluid
        >
          {post.picUrl &&
            <Image
              className={styles["post__image"]}
              src={post.picUrl}
              floated="left"
              ui={false}
              alt="Post image"
            />
          }

          <Card.Content>
            {/* Avatar del usuario y botón de borrar */}
            <Image floated="left" src={post.user.avatar} avatar circular />
            {user && user.role === "admin" || (user && user._id.toString() === post.user._id.toString()) ?
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
              postId={post._id}
              postAuthor={post.user._id}
              socket={socket}
              setComments={setComments}
              setCommentsCount={setCommentsCount}
            />

            {/* Lista de comentarios del post */}
            {user && comments.length > 0 &&
              comments.map(comment => {
                return (
                  <PostComment
                    key={comment._id}
                    comment={comment}
                    postId={post._id}
                    post={post}
                    user={user}
                    socket={socket}
                    setComments={setComments}
                    setCommentsCount={setCommentsCount}
                  />
                )
              })
            }

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

            {!loadingComments && commentsCount === 0 &&
              <>
                <Divider />
                <p>No comments yet...</p>
              </>
            }
          </Card.Content>
        </Card>
      </Segment>
    </Container>
  )
}

export async function getServerSideProps(context) {
  try {
    const {postid} = context.query;
    const {token} = parseCookies(context);

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Consultar si el email del usuario está verificado
    const isVerified = await checkVerification(token);

    // Si no está verificado, redirigir a la página de verificación
    if(!isVerified) {
      return {
        redirect: {
          destination: "/account-verification",
          permanent: false
        }
      }
    }

    // Buscar el post
    const res = await axios({
      method: "GET",
      url: `${process.env.BASE_URL}/api/posts/${postid}`,
      headers: {
        Cookie: `token=${token}`
      }
    });

    return {
      props: {
        post: res.data.data
      }
    }
    
  } catch (error) {
    let message = error.message;

    if(error.response) {
      message = error.response.data.message;
    }
    
    // Redirigir al login si hay error de token
    if(message.includes("jwt") || message.includes("signature")) {
      return unauthRedirect(message, context)
    }
    
    console.log(`Error fetching posts: ${message}`);

    return {
      props: {
        error: message
      }
    }
  }
}

export default PostPage;
