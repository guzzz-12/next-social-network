import {useState, useEffect, useRef, useContext} from "react";
import {useRouter} from "next/router";
import {Grid, Visibility, Segment, Message, Loader} from "semantic-ui-react";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies, destroyCookie} from "nookies";
import unauthRedirect from "../utilsServer/unauthRedirect";
import ProfileMenuTabs from "../components/profile/ProfileMenuTabs";
import ProfileHeader from "../components/profile/ProfileHeader";
import CardPost from "../components/post/CardPost";
import Followers from "../components/profile/Followers";
import Following from "../components/profile/Following";
import UpdateProfile from "../components/profile/UpdateProfile";
import Settings from "../components/profile/Settings";
import {NoProfile, NoProfilePosts} from "../components/Layout/NoData";
import {PlaceHolderPosts} from "../components/Layout/PlaceHolderGroup";
import {UserContext} from "../context/UserContext";
import {checkVerification} from "../utilsServer/verificationStatus";

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const ProfilePage = (props) => {
  const userContext = useContext(UserContext);
  const newEmailRef = useRef();
  const emailErrorRef = useRef();

  const cancellerRef = useRef();
  const router = useRouter();
  const {updatedEmail, errorUpdatingEmail} = router.query;
  const {profile, user: currentUser, error} = props;

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(null);

  // State de la paginación
  const [loadMore, setLoadMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [endOfPosts, setEndOfPosts] = useState(false);

  // State de los tabs
  const [activeTab, setActiveTab] = useState("profile");
  const [followers, setFollowers] = useState(props.followers);
  const [following, setFollowing] = useState(props.following);

  const [isEmailUpdatedSuccess, setIsEmailUpdatedSuccess] = useState(null);
  const [isEmailUpdateError, setIsEmailUpdateError] = useState(null);


  /*---------------------------*/
  // Click handler de los tabs
  /*---------------------------*/
  const tabClickHandler = async (tab) => {
    setActiveTab(tab);
    setPosts([]);
    setEndOfPosts(false);
    setCurrentPage(1)
  }


  /*------------------------------------------------------------------*/
  // Verificar si viene de actualizar el email y si es exitoso o error
  /*------------------------------------------------------------------*/
  useEffect(() => {
    if(updatedEmail && userContext.currentUser) {
      newEmailRef.current = updatedEmail;
      setIsEmailUpdatedSuccess(updatedEmail);
    }

    if(errorUpdatingEmail){
      emailErrorRef.current = errorUpdatingEmail;
      setIsEmailUpdateError(errorUpdatingEmail);
      router.push("/profile");
    }
  }, [updatedEmail, errorUpdatingEmail, userContext]);


  /*------------------------------------------------------------*/
  // Actualizar el email en la data del usuario del state global
  /*------------------------------------------------------------*/
  useEffect(() => {
    if(newEmailRef.current) {
      setIsEmailUpdatedSuccess(null);
      const currentUser = {...userContext.currentUser};
      currentUser.email = newEmailRef.current;
      userContext.setCurrentUser(currentUser);
      router.push("/profile");
    }
  }, [newEmailRef.current]);


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
        url: `/api/profile/${profile.user.username}/posts?page=${currentPage}`,
        cancelToken: new CancelToken((canceller) => {
          cancellerRef.current = canceller
        }) 
      })
      .then(res => {
        const {userPosts, isLastPage} = res.data.data;
        
        setPosts(prev => [...prev, ...userPosts]);
        setCurrentPage(prev => prev + 1);
        
        if(isLastPage) {
          setEndOfPosts(true);
        }

        setLoadingPosts(false);
        setLoadMore(false);
        setIsLoadingMore(false);
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
  }, [profile, endOfPosts, activeTab, loadMore]);


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
  if(!profile) {
    return <NoProfile />
  }

  return (
    <Visibility onUpdate={scrollUpdateHandler}>
      <Grid stackable>
        <Grid.Row>
          <Grid.Column>
            <ProfileMenuTabs
              isAccountOwner
              activeTab={activeTab}
              tabClickHandler={tabClickHandler}
              followers={followers}
              following={following}
            />
          </Grid.Column>
        </Grid.Row>

        {(newEmailRef.current || emailErrorRef.current) &&
          <div style={{width: "100%"}}>
            {/* Mostrar mensaje de email actualizado exitosamente */}
            {newEmailRef.current &&
              <Message
                success
                header="Email updated succesfully"
                content={`Your email address was successfully changed to ${newEmailRef.current}`}
                onDismiss={() => {
                  setIsEmailUpdatedSuccess(null);
                  newEmailRef.current = null
                }}
              />
            }

            {/* Mostrar mensaje de error al actualizar el email */}
            {emailErrorRef.current &&
              <Message
                error
                header="There was a problem updating your email address"
                content={emailErrorRef.current}
                onDismiss={() => {
                  setIsEmailUpdateError(null);
                  emailErrorRef.current = null;
                }}
              />
            }
          </div>
        }

        <Grid.Row>
          <Grid.Column>
            {activeTab === "profile" &&
              <>
                <ProfileHeader
                  isAccountOwner
                  profile={profile}
                  followers={followers}
                  following={following}
                />

                {/* Mostrar skeletons mientras los posts cargan */}
                {loadingPosts ? <PlaceHolderPosts /> : null}

                {/* Lista de posts del usuario */}
                {!loadingPosts && posts.length > 0 &&
                  posts.map(post => {
                    return (
                      <CardPost
                        key={post._id}
                        user={currentUser}
                        post={post}
                        setPosts={setPosts}
                        noPadding
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
                isProfileOwner
                username={currentUser.username}
                setOwnerFollowing={setFollowing}
              />
            }

            {activeTab === "following" &&
              <Following
                isProfileOwner
                username={currentUser.username}
                setOwnerFollowing={setFollowing}
              />
            }

            {activeTab === "updateProfile" &&
              <UpdateProfile setActiveTab={setActiveTab} />
            }

            {activeTab === "settings" && 
              <Settings newMessagePopup={currentUser.newMessagePopup} />
            }
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Loader para indicar la carga de los siguientes posts */}
      {isLoadingMore && activeTab === "profile" ?
        <div style={{width: "100%", minHeight: "50px", margin: "1rem 0"}}>
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
  
  try {
    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);

    // Chequear si el email del usuario está verificado
    const isVerified = await checkVerification(token);

    // Si no está verificado, redirigir a la página de verificación
    if(isVerified) {
      return {
        redirect: {
          destination: "/account-verification",
          permanent: false
        }
      }
    }
  
    return {
      props: {
        user: userData.data.data.profile.user,
        profile: userData.data.data.profile,
        following: userData.data.data.following,
        followers: userData.data.data.followers,
        error: null
      }
    }
    
  } catch (error) {
    let message = error.message;

    if(error.response) {
      message = error.response.data.message;
    }    
    
    console.log(`Error fetching user profile: ${message}`);

    // Redirigir al login si hay error de token
    if(message.includes("jwt") || message.includes("signature")) {
      return unauthRedirect(message, context)
    }
    
    destroyCookie(context, "token");

    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    }
  }
}

export default ProfilePage;
