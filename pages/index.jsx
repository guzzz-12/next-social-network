import {useEffect, useState, useContext, useRef} from "react";
import Head from "next/head";
import {Segment, Visibility, Loader, Dimmer} from "semantic-ui-react";
import jwt from "jsonwebtoken";
import {parseCookies} from "nookies";
import axios from "axios";
import unauthRedirect from "../utilsServer/unauthRedirect";
import {NoPosts} from "../components/Layout/NoData";
import {UserContext} from "../context/UserContext";
import CreatePost from "../components/post/CreatePost";
import CardPost from "../components/post/CardPost";

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const HomePage = ({posts}) => {
  const userContext = useContext(UserContext);
  const cancellerRef = useRef();

  const [title, setTitle] = useState("");
  const [postsData, setPostsData] = useState(posts);
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
    if(calculations.percentagePassed >= 0.50 || calculations.bottomVisible) {
      setLoadMore(true);
    }
  }

  /*----------------------------------------------------------------------*/
  // Cargar la siguiente página de posts al llegar al fondo del contenedor
  /*----------------------------------------------------------------------*/
  useEffect(() => {
    if(loadMore && !isLastPage) {      
      // Cancelar el request anterior en caso de repetirlo
      cancellerRef.current && cancellerRef.current();

      setLoadingMore(true);

      axios({
        method: "GET",
        url: `/api/posts?page=${currentPage}`,
        cancelToken: new CancelToken((canceller) => {
          cancellerRef.current = canceller
        })
      })
      .then(res => {
        const {posts, isLastPage} = res.data.data;

        setPostsData(prev => [...prev, ...posts])
        setCurrentPage(prev => prev + 1);
        setLoadMore(false);
        setLoadingMore(false);

        if(isLastPage) {
          setIsLastPage(true);
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


// Cargar la primera página de posts y de likes
export async function getServerSideProps(context) {
  try {
    const {token} = parseCookies(context);
    const {req} = context;

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);
    
    const res = await axios({
      method: "GET",
      url: `${req.protocol}://${req.get("host")}/api/posts`,
      headers: {
        Cookie: `token=${token}`
      },
      params: {
        page: 1
      }
    });

    return {
      props: {
        posts: res.data.data.posts
      }
    }
  } catch (error) {
    let message = error.message;

    if(error.response) {
      message = error.response.data.message
    }

    // Redirigir a login si hay error de autenticación o no está autenticado
    if(message.includes("jwt") || message.includes("signature")) {
      return unauthRedirect(message, context);
    }

    console.log(`Error fetching user profile: ${message}`);

    return {
      props: {
        error: message
      }
    }
  }
}

export default HomePage;
