import {useState, useEffect, useContext} from "react";
import {Segment, Grid, Image, Header, Divider, Button, List} from "semantic-ui-react";
import axios from "axios";
import {UserContext} from "../../context/UserContext";

const ProfileHeader = ({profile, isAccountOwner, followers, following, setFollowers}) => {
  const userContext = useContext(UserContext);

  const [socialLinks, setSocialLinks] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  /*-----------------------------------------------------------------------------*/
  // Chequear si el usuario actual sigue al usuario del perfil que está visitando
  /*-----------------------------------------------------------------------------*/
  useEffect(() => {
    if(userContext.currentUser) {
      const isFollowing = followers.some(el => el.user.toString() === userContext.currentUser._id.toString());
      setIsFollowing(isFollowing);
    }
  }, [userContext.currentUser, followers]);


  /*------------------------------------------------------------------*/
  // Chequear si el perfil tiene links de redes sociales y extraerlos
  // en un array de la forma [{name: "facebook", link: "facebook.com"}]
  /*------------------------------------------------------------------*/
  useEffect(() => {
    if(profile.social) {
      const keysArray = Object.keys(profile.social);
      const valuesArray = Object.values(profile.social);
      const data = [];
      for(let key in keysArray) {
        data.push({name: keysArray[key], link: valuesArray[key]})
      }
      setSocialLinks(data);
    }
  }, [profile]);


  /*--------------------*/
  // Dar follow/unfollow
  /*--------------------*/
  const followHandler = async () => {
    try {
      setLoading(true);

      const res = await axios({
        method: "GET",
        url: `/api/profile/follow/${profile.user.username}`
      });
      
      const {actionType, seguidor, _id} = res.data.data;

      setFollowers(prev => {
        // En caso de unfollow, remover el usuario actual de los seguidores del usuario del perfil visitado
        if(actionType === "unfollow") {
          const updated = [...prev].filter(el => el.user.toString() !== seguidor.toString());
          return updated;
        }

        // En caso de follow, agregar el usuario actual a los seguidores del usuario del perfil visitado
        if(actionType === "follow") {
          const updated = [...prev, {_id, user: seguidor}];
          return updated
        }
      });

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

  return (
    <Segment>
      <Grid stackable>
        {/* Columna izquierda (Contenido de texto) */}
        <Grid.Column width={11}>
          {/* Nombre del usuario */}
          <Grid.Row>
            <Header
              as="h2"
              content={profile.user.name}
              style={{marginTop: "5px"}}
            />
          </Grid.Row>

          {/* Biografía del usuario */}
          <Grid.Row stretched>
            {profile.bio}
            <Divider />
          </Grid.Row>

          {/* Email y links de redes sociales */}
          <Grid.Row>
            <List>
              <List.Item>
                <List.Icon name="mail" color="blue" />
                <List.Content content={profile.user.email} />
              </List.Item>
              {socialLinks.length === 0 &&
                <span>No social links</span>
              }
              {socialLinks.length > 0 &&
                socialLinks.map(link => {
                  return (
                    <List.Item key={link.name}>
                      <List.Icon name={link.name} color="blue" />
                      <List.Content content={link.link} />
                    </List.Item>
                  )
                })
              }
            </List>
          </Grid.Row>
        </Grid.Column>

        {/* Columna derecha (Imagen y botón de follow/unfollow) */}
        <Grid.Column
          style={{textAlign: "center"}}
          width={5}
          stretched
        >
          <Grid.Row>
            <Image src={profile.user.avatar} size="large" />
          </Grid.Row>
          {!isAccountOwner &&
            <>
              <br />
              <Button
                compact
                loading={loading}
                disabled={loading}
                content={isFollowing ? "Unfollow" : "Follow"}
                icon={isFollowing ? "check circle" : "add user"}
                color={isFollowing ? "instagram" : "twitter"}
                onClick={followHandler}
              />
            </>
          }
        </Grid.Column>
      </Grid>
    </Segment>
  )
}

export default ProfileHeader;
