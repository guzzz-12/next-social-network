import {useState, useEffect, useContext, useRef} from "react";
import {useRouter} from "next/router";
import Head from "next/head";
import {Grid, Visibility, Segment, Loader} from "semantic-ui-react";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies} from "nookies";
import unauthRedirect from "../../utilsServer/unauthRedirect";
import ProfileMenuTabs from "../../components/profile/ProfileMenuTabs";
import ProfileHeader from "../../components/profile/ProfileHeader";
import CardPost from "../../components/post/CardPost";
import Followers from "../../components/profile/Followers";
import Following from "../../components/profile/Following";
import {PlaceHolderPosts} from "../../components/Layout/PlaceHolderGroup";
import {NoProfile, NoProfilePosts} from "../../components/Layout/NoData";
import {UserContext} from "../../context/UserContext";
import {SocketContext} from "../../context/SocketProvider";
import useUpdateTitleNotifications from "../../hooks/useUpdateTitleNotifications";
import useReinitializeNotifications from "../../hooks/useReinitializeNotifications";
import {checkVerification} from "../../utilsServer/verificationStatus";

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const ProfilePage = (props) => {
  const router = useRouter();
  const {username} = router.query;
  const cancellerRef = useRef();
  const pathUsernameRef = useRef(router.query.username);
  const {profile, error} = props;
  
  const {socket} = useContext(SocketContext);
  const userContext = useContext(UserContext);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [_postsError, setPostsError] = useState(null);

  // State de la paginación
  const [loadMore, setLoadMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [endOfPosts, setEndOfPosts] = useState(false);

  // State de los tabs
  const [activeTab, setActiveTab] = useState("profile");
  const [followers, setFollowers] = useState(props.followers);
  const [following, setFollowing] = useState(props.following);

  // Actualizar el title
  const updatedTitle = useUpdateTitleNotifications(`Next Social Network | ${profile.user.name.split(" ")[0]}'s Profile`);
  
  // Reinicializar los contadores de notificaciones y mensajes sin leer
  // al hacer hard refresh de la página.
  useReinitializeNotifications();


  /*---------------------------*/
  // Click handler de los tabs
  /*---------------------------*/
  const tabClickHandler = async (tab) => {
    setActiveTab(tab);
    setPosts([]);
    setEndOfPosts(false);
    setCurrentPage(1)
  }


  // Repetir la consulta al cambiar el username en el path
  useEffect(() => {
    if(pathUsernameRef.current !== username) {
      setPosts([]);
      setLoadMore(true);
      setCurrentPage(1);
      setEndOfPosts(false);
      pathUsernameRef.current = username;
    }
  }, [username]);


  /*--------------------------------*/
  // Consultar los posts del usuario
  /*--------------------------------*/
  useEffect(() => {
    if((activeTab === "profile" && !endOfPosts) && (currentPage === 1 || loadMore)) {
      currentPage === 1 && setLoadingPosts(true);
      currentPage > 1 && setIsLoadingMore(true);
      setPostsError(null);

      // Cancelar el request anterior en caso de repetirlo
      cancellerRef.current && cancellerRef.current();

      axios({
        method: "GET",
        url: `/api/profile/${username}/posts?page=${currentPage}`,
        cancelToken: new CancelToken((canceller) => {
          cancellerRef.current = canceller
        })
      })
      .then(res => {
        const {userPosts, isLastPage} = res.data.data;

        setPosts(prev => [...prev, ...userPosts]);
        setCurrentPage(prev => prev + 1);
        setEndOfPosts(false);

        if(isLastPage) {
          setEndOfPosts(true);
        }
        
        setIsLoadingMore(false);
        setLoadingPosts(false);
        setLoadMore(false);
      })
      .catch(err => {
        let message = err.message;
        if(err.response) {
          message = err.response.data.message
        }
        setPostsError(message);
        setLoadingPosts(false);
        setIsLoadingMore(false);
        setLoadMore(false);
      })
    }
  }, [profile, loadMore, endOfPosts, activeTab]);


  /*--------------------------------------------------------*/
  // Chequear si el scroll pasó de 60% para cargar más posts
  /*--------------------------------------------------------*/
  const scrollUpdateHandler = (e, {calculations}) => {
    if(calculations.percentagePassed >= 0.50 || calculations.bottomVisible) {
      setLoadMore(true);
    }
  }


  /*----------------------------------------*/
  // Mostrar mensaje si el perfil no existe
  /*----------------------------------------*/
  if((!profile && !loadingPosts) || props.error) {
    return <NoProfile />
  }


  return (
    <Visibility onUpdate={scrollUpdateHandler} style={{marginBottom: "1rem"}}>
      <Head>
        <title>{updatedTitle}</title>
      </Head>

      <Grid stackable>
        <Grid.Row>
          <Grid.Column>
            <ProfileMenuTabs
              activeTab={activeTab}
              tabClickHandler={tabClickHandler}
              followers={followers}
              following={following}
            />
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column>
            {activeTab === "profile" &&
              <>
                <ProfileHeader
                  profile={profile}
                  followers={followers}
                  following={following}
                  setFollowers={setFollowers}
                />
                {/* Mostrar skeletons mientras los posts cargan */}
                {loadingPosts ? <PlaceHolderPosts /> : null}

                {/* Lista de posts del usuario */}
                {!loadingPosts && posts.length > 0 &&
                  posts.map(post => {
                    return (
                      <CardPost
                        key={post._id}
                        post={post}
                        user={userContext.currentUser}
                        noPadding
                        setPosts={setPosts}
                        socket={socket}
                      />
                    )
                  })
                }

                {/* Mensaje de no posts */}
                {!loadingPosts && posts.length === 0 && <NoProfilePosts />}
              </>
            }

            {activeTab === "followers" &&
              <Followers
                username={username}
                followers={followers}
                setFollowers={setFollowers}
              />
            }
            {activeTab === "following" &&
              <Following
                username={username}
                following={following}
                setFollowing={setFollowing}
              />
            }
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Loader para indicar la carga de los siguientes posts */}
      {isLoadingMore && activeTab === "profile" ?
        <div style={{width: "100%", minHeight: "50px", marginBottom: "1rem"}}>
          <Loader active inline="centered">Loading...</Loader>
        </div>
        :
        null
      }

      {/* Mensaje de no más posts disponibles */}
      {endOfPosts && activeTab === "profile" ?
        <Segment textAlign="center" vertical>
          No more posts available
        </Segment>
        :
        null
      }
    </Visibility>
  )
}


export async function getServerSideProps(context) {
  const {token} = parseCookies(context);
  const {username} = context.query;
  
  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Chequear si el email del usuario está verificado
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

    // Redirigir a profile si es el pefil del usuario autenticado
    if(decoded.username === username) {
      return {
        redirect: {
          destination: "/profile",
          permanent: false
        }
      }
    }

    // Consultar data del usuario correspondiente al perfil visitado
    const res = await axios({
      method: "GET",
      url: `${process.env.BASE_URL}/api/profile/user/${username}`,
      headers: {
        Cookie: `token=${token}`
      }
    });
  
    return {
      props: {
        profile: res.data.data.profile,
        following: res.data.data.following,
        followers: res.data.data.followers,
        error: null
      }
    }
    
  } catch (error) {
    let message = error.message;

    if(error.response) {
      message = error.response.data.message;
    }
    
    // Redirigir al login si hay error de token
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

export default ProfilePage;
