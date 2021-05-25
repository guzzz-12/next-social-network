import {useState, useEffect, useContext} from "react";
import {useRouter} from "next/router";
import axios from "axios";
import {Grid} from "semantic-ui-react";
import {parseCookies} from "nookies";
import ProfileMenuTabs from "../../components/profile/ProfileMenuTabs";
import ProfileHeader from "../../components/profile/ProfileHeader";
import CardPost from "../../components/post/CardPost";
import {PlaceHolderPosts} from "../../components/Layout/PlaceHolderGroup";
import {NoProfile, NoProfilePosts} from "../../components/Layout/NoData";
import {UserContext} from "../../context/UserContext";
import Followers from "../../components/profile/Followers";

const ProfilePage = (props) => {
  const {profile, error} = props;
  const userContext = useContext(UserContext);
  const router = useRouter();
  const {username} = router.query;

  const [posts, setPosts] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [isAccountOwner, setIsAccountOwner] = useState(false);

  // State de los tabs
  const [activeTab, setActiveTab] = useState("profile");
  const [followers, setFollowers] = useState(props.followers);
  const [following, setFollowing] = useState(props.following);
  const [tabError, setTabError] = useState(null);


  /*---------------------------*/
  // Click handler de los tabs
  /*---------------------------*/
  const tabClickHandler = async (tab) => {
    try {
      setLoading(true);
      setActiveTab(tab);
      
    } catch (error) {
      let message = error.message;
        if(error.response) {
          message = error.response.data.message
        }
        setTabError(message);
        setLoading(false);
    }
  }


  /*-----------------------------------------------------*/
  // Verificar si el perfil pertenece al usuario logueado
  /*-----------------------------------------------------*/
  useEffect(() => {
    if(userContext.currentUser && profile) {
      setIsAccountOwner(userContext.currentUser._id.toString() === profile.user._id.toString())
    }
  }, [userContext.currentUser, profile]);


  /*--------------------------------*/
  // Consultar los posts del usuario
  /*--------------------------------*/
  useEffect(() => {
    if(profile) {
      setLoadingPosts(true);
      setPostsError(null);

      axios({
        method: "GET",
        url: `/api/profile/${username}/posts`
      })
      .then(res => {
        const {userPosts, results} = res.data.data;
        setPosts(userPosts);
        setResults(results);
        setLoadingPosts(false);
      })
      .catch(err => {
        let message = err.message;
        if(err.response) {
          message = err.response.data.message
        }
        setPostsError(message);
        setLoadingPosts(false);
      })
    }
  }, [profile, username]);


  /*----------------------------------------*/
  // Mostrar mensaje si el perfil no existe
  /*----------------------------------------*/
  if(!profile) {
    return <NoProfile />
  }

  return (
    <>
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
                {!loadingPosts && posts.length > 0 ?
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
                  :
                  <NoProfilePosts />
                }
              </>
            }

            {activeTab === "followers" &&
              <Followers username={username}/>
            }
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </>
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
