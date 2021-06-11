import {useContext, useState, useEffect} from "react";
import {List, Button, Image, Loader, Message} from "semantic-ui-react";
import axios from "axios";
import {UserContext} from "../../context/UserContext";

const Following = ({username, isProfileOwner, setOwnerFollowing}) => {
  const userContext = useContext(UserContext);
  const currentUser = userContext.currentUser;

  // Siguiendo del usuario del perfil visitado
  const [following, setFollowing] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(true);
  const [errorLoadingFollowing, setErrorLoadingFollowing] = useState(null);

  // Siguiendo del usuario actual
  const [currentUserFollowing, setCurrentUserFollowing] = useState([]);

  const [processingFollow, setProcessingFollow] = useState(null);
  const [errorProcessingFollow, setErrorProcessingFollow] = useState(null);

  // Chequear si el usuario logueado está siguiendo a los usuarios
  // de la lista de following del perfil visitado
  const checkIfFollowing = (userId) => {
    const check = currentUserFollowing.find(el => el.user._id === userId);
    return !!check;
  }

  /*-----------------------------------------------*/
  // Consultar los siguiendo del usuario del perfil
  /*-----------------------------------------------*/
  useEffect(() => {
    setLoadingFollowing(true);
    setErrorLoadingFollowing(null);

    axios({
      method: "get",
      url: `/api/profile/following/${username}`,
    })
    .then(res => {
      setFollowing(res.data.data.following);
      setLoadingFollowing(false)
    })
    .catch(err => {
      let message = err.message;
      if(err.response) {
        message = err.response.data.message
      }
      setErrorLoadingFollowing(message);
      setLoadingFollowing(message);      
    })
  }, []);


  /*-------------------------------------------*/
  // Consultar los siguiendo del usuario actual
  /*-------------------------------------------*/
  useEffect(() => {
    if(currentUser.username) {
      axios({
        method: "GET",
        url: `/api/profile/following/${currentUser.username}`
      })
      .then(res => {
        setCurrentUserFollowing(res.data.data.following);
      })
      .catch(err => {
        let message = err.message;
        if(err.response) {
          message = err.response.data.message
        }
        console.log({errorLoadingCurrentUserFollowing: message || err.message})
      })
    }

  }, [currentUser.username]);


  /*--------------------*/
  // Dar follow/unfollow
  /*--------------------*/
  const followHandler = async (username) => {
    try {
      setProcessingFollow(username);

      const res = await axios({
        method: "GET",
        url: `/api/profile/follow/${username}`
      });

      const {_id, siguiendo, actionType} = res.data.data;
      setCurrentUserFollowing(prev => {
        // Si es follow, agregar el usuario a la lista de following del usuario actual
        if(actionType === "follow") {
          return [...prev, {_id, user: {_id: siguiendo}}]
        }

        // Si es unfollow, extraer el usuario de la lista de following del usuario actual
        if(actionType === "unfollow") {
          const updated = [...prev].filter(el => el.user._id.toString() !== siguiendo.toString());
          return updated;
        }
      });

      setProcessingFollow(null);

      // Si el perfil es el perfil del usuario logueado, actualizar contador de following
      if(isProfileOwner) {
        setOwnerFollowing(prev => {
          if(actionType === "follow") {
            return [...prev, {_id, user: siguiendo}]
          }

          if(actionType === "unfollow") {
            const updated = [...prev].filter(el => el.user.toString() !== siguiendo.toString());
            return updated;
          }
        })
      }
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message
      }
      setProcessingFollow(null);
      setErrorProcessingFollow(message)
    }
  }


  /*---------------------------------------------*/
  // Mostrar loader mientras cargan los siguiendo
  /*---------------------------------------------*/
  if(loadingFollowing) {
    return <Loader active inline="centered" />
  }


  /*------------------------------------------------------*/
  // Mostrar mensaje si no está siguiendo a otros usuarios
  /*------------------------------------------------------*/
  if(!loadingFollowing && following.length === 0) {
    return (
      <Message
        icon="warning"
        header={isProfileOwner ? "You are not following other users yet" : "This user is not following other users yet"}
        content={isProfileOwner ? "Start following other users to see their content!" : ""}
      />
    )
  }


  return (
    <List divided verticalAlign="middle">
      {following.map(el => {
        return (
          <List.Item
            key={el._id}
            style={{paddingTop: "10px", paddingBottom: "10px"}}
          >
            <Image src={el.user.avatar} avatar />
            <List.Content>
              <List.Header
                as={el.user.status === "active" ? "a" : "span"}
                href={el.user.status === "active" ?`/user/${el.user.username}` : ""}
              >
                {el.user.name}
              </List.Header>
              <List.Description>
                {el.user.status === "active" ? `@${el.user.username}` : ""}
              </List.Description>
            </List.Content>

            {/* Mostrar botón de follow/unfollow si no es el usuario actual */}
            {currentUser.username !== el.user.username &&
              <List.Content floated="right">
                <Button
                  color={checkIfFollowing(el.user._id) ? "instagram" : "twitter"}
                  content={checkIfFollowing(el.user._id) ? "Unfollow" : "Follow"}
                  icon={checkIfFollowing(el.user._id) ? "check" : "add user"}
                  disabled={loadingFollowing || !!processingFollow || el.user.status !== "active"}
                  loading={loadingFollowing || processingFollow === el.user.username}
                  onClick={() => el.user.status === "active" ? followHandler(el.user.username) : null}
                />
              </List.Content>
            }
          </List.Item>
        )
      })}
    </List>
  )
}

export default Following;
