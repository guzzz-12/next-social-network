import {useState, useEffect, useContext, useRef} from "react";
import {useRouter} from "next/router";
import {Grid, Visibility, Segment, Loader} from "semantic-ui-react";
import axios from "axios";
import {parseCookies} from "nookies";
import ProfileMenuTabs from "../../components/profile/ProfileMenuTabs";
import ProfileHeader from "../../components/profile/ProfileHeader";
import CardPost from "../../components/post/CardPost";
import Followers from "../../components/profile/Followers";
import Following from "../../components/profile/Following";
import {PlaceHolderPosts} from "../../components/Layout/PlaceHolderGroup";
import {NoProfile, NoProfilePosts} from "../../components/Layout/NoData";
import {UserContext} from "../../context/UserContext";

// Token de cancelación de requests de axios
const CancelToken = axios.CancelToken;

const ProfilePage = (props) => {
  const cancellerRef = useRef();
  const {profile, error} = props;
  const userContext = useContext(UserContext);
  const router = useRouter();
  const {username} = router.query;

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [isAccountOwner, setIsAccountOwner] = useState(false);

  // State de la paginación
  const [loadMore, setLoadMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);

  // State de los tabs
  const [activeTab, setActiveTab] = useState("profile");
  const [followers, setFollowers] = useState(props.followers);
  const [following, setFollowing] = useState(props.following);


  /*-----------------------------------------------------*/
  // Verificar si el perfil pertenece al usuario logueado
  /*-----------------------------------------------------*/
  useEffect(() => {
    if(userContext.currentUser && profile) {
      setIsAccountOwner(userContext.currentUser._id.toString() === profile.user._id.toString())
    }
  }, [userContext.currentUser, profile]);


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
        url: `/api/profile/${username}/posts?page=${currentPage}`,
        cancelToken: new CancelToken((canceller) => {
          cancellerRef.current = canceller
        })
      })
      .then(res => {
        const {userPosts, results} = res.data.data;
        if(results > 0) {
          setPosts(prev => [...prev, ...userPosts]);
          setCurrentPage(prev => prev + 1);
          setIsLastPage(false)
        } else {
          setIsLastPage(true);
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
  }, [profile, username, loadMore, isLastPage, activeTab]);


  /*--------------------------------------------------------*/
  // Chequear si el scroll pasó de 60% para cargar más posts
  /*--------------------------------------------------------*/
  const scrollUpdateHandler = (e, {calculations}) => {
    console.log({calculations})
    if(calculations.percentagePassed >= 0.60 || calculations.bottomVisible) {
      setLoadMore(true);
    }
  }


  /*----------------------------------------*/
  // Mostrar mensaje si el perfil no existe
  /*----------------------------------------*/
  if(!profile && !loadingPosts) {
    return <NoProfile />
  }


  return (
    <Visibility onUpdate={scrollUpdateHandler} style={{marginBottom: "1rem"}}>
      <Grid stackable>
        <Grid.Row>
          <Grid.Column>
            <ProfileMenuTabs
              activeTab={activeTab}
              tabClickHandler={tabClickHandler}
              followers={followers}
              following={following}
              isAccountOwner={isAccountOwner}
            />
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column>
            {activeTab === "profile" &&
              <>
                <ProfileHeader
                  profile={profile}
                  isAccountOwner={isAccountOwner}
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
                        user={userContext.currentUser}
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

            {activeTab === "followers" && <Followers username={username}/>}
            {activeTab === "following" && <Following username={username}/>}
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


// Desde getInitialProps se debe usar axios para los requests
// a diferencia de getServerSideProps donde se debe usar código de backend
// ProfilePage.getInitialProps = async (context) => {
export async function getServerSideProps(context) {
  const {token} = parseCookies(context);
  const {req} = context;
  const {username} = context.query;

  axios.defaults.headers.get.Cookie = `token=${token}`

  try {
    const res = await axios({
      method: "GET",
      url: `${req.protocol}://${req.get("host")}/api/profile/user/${username}`
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

    return {
      props: {
        profile: null,
        error: message || error.message
      }
    }
  }
}

export default ProfilePage;
