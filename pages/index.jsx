import {useEffect, useState, useContext} from "react";
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

// Generar token de cancelación de requests de axios
const CancelToken = axios.CancelToken;
let cancel = null;

const HomePage = ({posts}) => {
  const userContext = useContext(UserContext);

  const [title, setTitle] = useState("");
  const [postsData, setPostsData] = useState(JSON.parse(posts));
  const [showToastr, setShowToastr] = useState(false);
  
  const [bottomVisible, setBottomVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isLastPage, setIsLastPage] = useState(false);

  /*----------------------------------------------*/
  // Chequear si se llegó al fondo del contenedor
  /*----------------------------------------------*/
  const updateHandler = (e, {calculations}) => {
    setBottomVisible(calculations.bottomVisible);
  }

  /*----------------------------------------------------------------------*/
  // Cargar la siguiente página de posts al llegar al fondo del contenedor
  /*----------------------------------------------------------------------*/
  useEffect(() => {
    if(bottomVisible && !isLastPage) {
      setLoadingMore(true);

      // Cancelar el request anterior en caso de repetirlo
      cancel && cancel();

      axios({
        method: "GET",
        url: `/api/posts?page=${currentPage}`,
        cancelToken: new CancelToken((canceller) => {
          cancel = canceller
        })
      })
      .then(res => {
        if(res.data.data.length > 0) {
          setPostsData(prev => [...prev, ...res.data.data])
          setCurrentPage(prev => prev + 1);
        } else {
          setPostsData(prev => prev);
          setIsLastPage(true);
        }
        setBottomVisible(false);
        setLoadingMore(false);
      })
      .catch(err => {
        let message = err.message;
        if(err.response) {
          message = err.response.data.message
        }
        setError(message)
        setLoadingMore(false);
        setBottomVisible(false);
      })
    }
  }, [bottomVisible, isLastPage]);

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
            <div style={{width: "100%", minHeight: "50px"}}>
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
