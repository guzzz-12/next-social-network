import {useState, useEffect, useRef, useContext} from "react";
import Router from "next/router";
import {Form, Button, Icon, Message, Divider} from "semantic-ui-react";
import axios from "axios";
import CommonInputs from "../common/CommonInputs";
import ImageDropInput from "../common/ImageDropInput";
import {UserContext} from "../../context/UserContext";

const UpdateProfile = ({setActiveTab}) => {
  const imgInputRef = useRef();
  const userContext = useContext(UserContext);

  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [highlighted, setHighlighted] = useState(false);

  const [profile, setProfile] = useState({
    bio: "",
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: ""
  });

  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorLoadingProfile, setErrorLoadingProfile] = useState(null);
  
  const [submittingChanges, setSubmittingChanges] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorSubmitting, setErrorSubmitting] = useState(false);
  

  /*---------------------------------------*/
  // Consultar el perfil del usuario actual
  /*---------------------------------------*/
  useEffect(() => {
    setLoadingProfile(true);
    setErrorLoadingProfile(null);

    axios({
      method: "GET",
      url: "/api/profile/me"
    })
    .then(res => {
      const {bio, social} = res.data.data.profile;
      setProfile({
        bio,
        ...social
      });
      setShowSocialLinks(true);
      setLoadingProfile(false);
    })
    .catch(err => {
      let msg = err.message;
      if(err.response){
        msg = err.response.data.message
      }
      setErrorLoadingProfile(msg);
      setLoadingProfile(false);
    })
  }, []);


  /*-------------------------------------*/
  // Cargar la imagen actual del usuario
  /*-------------------------------------*/
  useEffect(() => {
    if(userContext.currentUser) {
      setCurrentImage(userContext.currentUser.avatar)
    }
  }, [userContext.currentUser]);


  /*-----------------------*/
  // Confirmar los cambios
  /*-----------------------*/
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setErrorSubmitting(null);
    setSubmittingChanges(true);

    try {
      // Enviar la data de texto
      await axios({
        method: "PATCH",
        url: "/api/profile/me",
        data: {...profile},
        headers: {
          "Content-Type": "application/json"
        }
      });

      // Actualizar la data del perfil en el state global
      userContext.setCurrentProfile({...profile});

      // Enviar la imagen si se selecciona imagen
      if(image) {
        const formData = new FormData();
        formData.append("avatar", image);

        const updatedUserData = await axios({
          method: "PATCH",
          url: `/api/profile/me/avatar`,
          withCredentials: true,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        
        // Actualizar el avatar del usuario en el state global
        const {newAvatar} = updatedUserData.data.data;
        userContext.setCurrentUser({...userContext.currentUser, avatar: newAvatar});

        setSubmittingChanges(false);
        setSuccessMsg("Profile updated successfully!");
        window.scrollTo({top: 0, behavior: "smooth"});
        
        // Recargar la página al procesar los cambios correctamente
        setTimeout(() => {
          Router.reload();
        }, 3000);

      } else {
        setSuccessMsg("Profile updated successfully!")
        setSubmittingChanges(false);
        window.scrollTo({top: 0, behavior: "smooth"});
        
        // Recargar la página al procesar los cambios correctamente
        setTimeout(() => {
          Router.reload();
        }, 3000);
      }
      
    } catch (err) {
      let msg = err.message;

      if(err.response){
        msg = err.response.data.message
      }

      setErrorSubmitting(msg);
      setSubmittingChanges(false);
      window.scrollTo({top: 0, behavior: "smooth"});
    }
  }


  /*----------------------------------------------------------*/
  // Manejar el evento change del input de selección de imagen
  /*----------------------------------------------------------*/
  const onImageChangeHandler = (e) => {
    if(e.target.files[0]) {
      setHighlighted(true);
      setImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  }


  /*------------------------------------------------*/
  // Manejar el evento change de los inputs de texto
  /*------------------------------------------------*/
  const onChangeHandler = (e) => {
    setProfile(prev => {
      return {
        ...prev,
        [e.target.name]: e.target.value
      }
    })
  }


  /*-----------------------*/
  // Manejar el evento blur
  /*-----------------------*/
  const onBlurHandler = (e) => {
    console.log(e.target)
  }


  return (
    <Form
      style={{marginBottom: "1rem"}}
      noValidate
      loading={loadingProfile}
      success={!!successMsg}
      error={!!errorLoadingProfile || !!errorSubmitting}
      onSubmit={onSubmitHandler}
    >
      {/* Mensajes de error */}
      <Message
        error
        header="Oops!"
        content={errorLoadingProfile || errorSubmitting}
        onDismiss={() => {
          setErrorLoadingProfile(null);
          setErrorSubmitting(null);
        }}
      />

      {/* Mensaje de éxito */}
      <Message
        success
        header="Success!"
        content={successMsg}
        onDismiss={() => setSuccessMsg(null)}
      />
      
      {/* Selector de la imagen y preview */}
      <h4 style={{textAlign: "center"}}>
        Click image or drop another image to change avatar
      </h4>
      <ImageDropInput
        imgInputRef={imgInputRef}
        setImage={setImage}
        imagePreview={imagePreview || currentImage}
        setImagePreview={setImagePreview}
        highlighted={highlighted}
        setHighlighted={setHighlighted}
        onChangeHandler={onImageChangeHandler}
      />

      <CommonInputs
        user={profile}
        onChangeHandler={onChangeHandler}
        onBlur={onBlurHandler}
        showSocialLinks={showSocialLinks}
        setShowSocialLinks={setShowSocialLinks}
        bioError={errorLoadingProfile}
      />

      {!showSocialLinks && <Divider />}

      <div style={{display: "flex"}}>
        <Button
          primary
          style={{marginRight: "1rem"}}
          loading={submittingChanges}
          disabled={submittingChanges}
        >
          <Icon name="pencil alternate" />
          Submit changes
        </Button>
        
        <Button
          loading={submittingChanges}
          disabled={submittingChanges}
          onClick={() => setActiveTab("profile")}
        >
          <Icon name="cancel" />
          Cancel
        </Button>
      </div>
    </Form>
  )
}

export default UpdateProfile;
