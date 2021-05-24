import {useState, useEffect} from "react";
import {Segment, Grid, Image, Header, Divider, Button, List} from "semantic-ui-react";

const ProfileHeader = ({profile, isAccountOwner, followers, following, setUserFollow}) => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Chequear si el usuario actual sigue al usuario del perfil que está visitando
  useEffect(() => {
    const isFollowing = following.some(el => el.user.toString() === profile.user._id.toString());
    setIsFollowing(isFollowing);
  }, []);

  // Chequear si el perfil tiene links de redes sociales y extraerlos
  // en un array de la forma [{name: "facebook", link: "facebook.com"}]
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
              />
            </>
          }
        </Grid.Column>
      </Grid>
    </Segment>
  )
}

export default ProfileHeader;
