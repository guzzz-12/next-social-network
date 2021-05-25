import {useEffect, useState, useContext, useRef} from "react";
import Head from "next/head";
import {Segment, Visibility, Loader, Dimmer} from "semantic-ui-react";
import jwt from "jsonwebtoken";
import {parseCookies, destroyCookie} from "nookies";
import axios from "axios";
import {NoPosts} from "../components/Layout/NoData";
import {UserContext} from "../context/UserContext";
import Post from "../models/PostModel";
import CreatePost from "../components/post/CreatePost";
import CardPost from "../components/post/CardPost";
import {PlaceHolderPosts} from "../components/Layout/PlaceHolderGroup";

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const HomePage = ({posts}) => {
  const userContext = useContext(UserContext);
  const cancellerRef = useRef();

  const [title, setTitle] = useState("");
  const [postsData, setPostsData] = useState(JSON.parse(posts));
  const [showToastr, setShowToastr] = useState(false);
  
  const [loadMore, setLoadMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isLastPage, setIsLastPage] = useState(false);

  /*--------------------------------------------------------*/
  // Chequear si el scroll pasó de 60% para cargar más posts
  /*--------------------------------------------------------*/
  const updateHandler = (e, {calculations}) => {
    if(calculations.percentagePassed >= 0.60 || calculations.bottomVisible) {
      setLoadMore(true);
    } else {
      setLoadMore(false)
    }
  }

  /*----------------------------------------------------------------------*/
  // Cargar la siguiente página de posts al llegar al fondo del contenedor
  /*----------------------------------------------------------------------*/
  useEffect(() => {
    if(loadMore && !isLastPage) {
      setLoadingMore(true);

      // Cancelar el request anterior en caso de repetirlo
      cancellerRef.current && cancellerRef.current();

      axios({
        method: "GET",
        url: `/api/posts?page=${currentPage}`,
        cancelToken: new CancelToken((canceller) => {
          cancellerRef.current = canceller
        })
      })
      .then(res => {
        if(res.data.data.length > 0) {
          setPostsData(prev => [...prev, ...res.data.data])
          setCurrentPage(prev => prev + 1);
          setLoadMore(false);
          setLoadingMore(false);
        } else {
          setIsLastPage(true);
          setLoadMore(false);
          setLoadingMore(false);
        }
      })
      .catch(err => {
        let message = err.message;
        if(err.response) {
          message = err.response.data.message
        }
        setError(message)
        setLoadingMore(false);
        setLoadMore(false);
      })
    }
  }, [loadMore, isLastPage]);

  /*----------------------------------------------------*/
  // Actualizar el meta tag title con el usuario actual
  /*----------------------------------------------------*/
  useEffect(() => {
    if(userContext.currentUser) {
      const userFirstName = userContext.currentUser.name.split(" ")[0];
      setTitle(`Welcome, ${userFirstName}`);
    }    
  }, [userContext.currentUser]);

  if(postsData.length === 0) {
    return <NoPosts />
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
        <Visibility onUpdate={updateHandler}>
          <Segment>
            {/* Input para crear post */}
            {userContext.currentUser &&
              <CreatePost user={userContext.currentUser} setPosts={setPostsData} />
            }
            {/* Lista de todos los posts disponibles */}
            {postsData.map(post => {
              return (
                <CardPost
                  key={post._id}
                  post={post}
                  user={userContext.currentUser}
                  setPosts={setPostsData}
                  setShowToastr={setShowToastr}
                />
              )
            })}
          </Segment>

          {/* Loader para indicar la carga de los siguientes posts */}
          {loadingMore ?
            <div style={{width: "100%", minHeight: "50px", marginBottom: "1rem"}}>
              <Loader active inline="centered">Loading...</Loader>
            </div>
            :
            null
          }

          {/* Mensaje de no más posts disponibles */}
          {isLastPage ?
            <Segment textAlign="center" vertical>
              No more posts available
            </Segment>
            :
            null
          }
        </Visibility>
    </>
  );
}


export async function getServerSideProps(context) {
  try {
    const {token} = parseCookies(context);

    if(!token) {
      return {
        redirect: {
          destination: "/login",
          permanent: false
        }
      }
    }

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Es necesario extraer la lógica de la consulta a la DB ya que no es posible
    // realizar consultas a los endpoints de la API interna desde getServerSideProps
    const posts = await Post.find()
    .limit(2)
    .skip(0)
    .sort({createdAt: "desc"})
    .populate("user", "_id avatar name username role email")
    .populate({
      path: "comments.user",
      select: "_id name username avatar"
    });

    return {
      props: {
        posts: JSON.stringify(posts)
      }
    }
  } catch (error) {
    destroyCookie(context, "token");
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    }
  }
}

export default HomePage;
