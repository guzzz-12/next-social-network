import {useEffect, useState, useContext} from "react";
import Link from "next/link";
import {useRouter} from "next/router";
import {Container, Header, Card, Icon, Image, Divider, Segment, Button, Popup, Message} from "semantic-ui-react";
import moment from "moment";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies} from "nookies";
import unauthRedirect from "../../utilsServer/unauthRedirect";
import {ToastContainer, toast} from "react-toastify";
import PostComment from "../../components/post/PostComment";
import CommentInput from "../../components/post/CommentInput";
import LikesList from "../../components/post/LikesList";
import {UserContext} from "../../context/UserContext";

const PostPage = (props) => {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const user = userContext.currentUser;
  const {post} = props;

  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [isLiked, setIsLiked] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  /*----------------------------------------------------------*/
  // Verificar si el post ya fue likeado por el usuario actual
  /*----------------------------------------------------------*/
  useEffect(() => {
    if(user && likes.length > 0) {
      const isLiked = !!likes.find(like => like.user.toString() === user._id.toString());
      setIsLiked(isLiked)
    } else {
      setIsLiked(false);
    }
  }, [user, likes]);


  //*------------*/
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
        method: "POST",
        url: `/api/posts/likes/${postId}`,
        withCredentials: true
      });

      setLikes(res.data.data.likes);
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
      {/* Toast para indicar que el post fue borrado con éxito */}
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={true}
      />

      <Segment basic>
        <Card
          style={{opacity: loading && (deleting === post._id.toString()) ? 0.5 : 1 }}
          color="teal"
          fluid
        >
          {post.picUrl &&
            <Image
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
            {/* Likes */}
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
                  <span
                    style={{cursor: !loading ? "pointer" : "default"}}
                    onClick={() => !loading && likesHandler(post._id)}
                  >
                    {likes.length} {likes.length === 1 ? "like" : "likes"}
                  </span>
                }
              />
            }

            {/* Comentarios */}
            <Icon
              style={{marginLeft: "7px"}}
              name="comment outline"
              color="blue"
            />
            <span>{comments.length} comments</span>

            <Divider />
            
            {/* Campo para agregar comentarios */}
            <CommentInput
              user={user}
              postId={post._id}
              setComments={setComments}
            />

            {/* Lista de comentarios del post */}
            {user && comments.length > 0 &&
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

    // Setear el token en los cookies del request
    axios.defaults.headers.get.Cookie = `token=${token}`;

    // Buscar el post
    const res = await axios({
      method: "GET",
      url: `/api/posts/${postid}`
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
