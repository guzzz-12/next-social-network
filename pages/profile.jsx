import {useState, useEffect, useRef} from "react";
import {Grid, Visibility, Segment, Loader} from "semantic-ui-react";
import axios from "axios";
import jwt from "jsonwebtoken";
import {parseCookies} from "nookies";
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

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const ProfilePage = (props) => {
  const cancellerRef = useRef();
  const {profile, user: currentUser, error} = props;

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(null);

  // State de la paginación
  const [loadMore, setLoadMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  // State de los tabs
  const [activeTab, setActiveTab] = useState("profile");
  const [followers, setFollowers] = useState(props.followers);
  const [following, setFollowing] = useState(props.following);


  /*---------------------------*/
  // Click handler de los tabs
  /*---------------------------*/
  const tabClickHandler = async (tab) => {
    setActiveTab(tab);
    setPosts([]);
    setIsLastPage(false);
    setCurrentPage(1)
  }


  /*--------------------------------*/
  // Consultar los posts del usuario
  /*--------------------------------*/
  useEffect(() => {
    if((activeTab === "profile" && ((profile && !isLastPage && loadMore) || (profile && currentPage === 1)))) {
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
        const {userPosts, results} = res.data.data;
        
        if(results > 0) {
          setPosts(prev => [...prev, ...userPosts]);
          setCurrentPage(prev => prev + 1);
          setIsLastPage(false);
        } else {
          setIsLastPage(true);
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
  }, [profile, loadMore, isLastPage, activeTab]);


  /*--------------------------------------------------------*/
  // Chequear si el scroll pasó de 60% para cargar más posts
  /*--------------------------------------------------------*/
  const scrollUpdateHandler = (e, {calculations}) => {
    if(calculations.percentagePassed >= 0.60 || calculations.bottomVisible) {
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
        <div style={{width: "100%", minHeight: "50px", marginBottom: "1rem"}}>
          <Loader active inline="centered">Loading...</Loader>
        </div>
        :
        null
      }

      {/* Mensaje de no más posts disponibles */}
      {isLastPage && activeTab === "profile" ?
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
  const {req} = context;
  
  try {
    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET);

    // Consultar el perfil del usuario
    const res = await axios({
      method: "GET",
      url: `${req.protocol}://${req.get("host")}/api/profile/me`,
      headers: {
        Cookie: `token=${token}`
      }
    });
  
    return {
      props: {
        user: res.data.data.profile.user,
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
      return unauthRedirect(message, context)
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
