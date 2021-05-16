import {useState, useRef, useContext} from "react";
import {useRouter} from "next/router";
import {Form, Button, Message, Segment, Divider} from "semantic-ui-react";
import axios from "axios";
import {parseCookies, destroyCookie} from "nookies";
import jsCookie from "js-cookie";
import CommonInputs from "../components/common/CommonInputs";
import ImageDropInput from "../components/common/ImageDropInput";
import ValidationErrorMessage from "../components/common/ValidationErrorMessage";
import {HeaderMessage, FooterMessage} from "../components/common/WelcomeMessage";
import {SessionTimerContext} from "../context/SessionTimerContext";
import {UserContext} from "../context/UserContext";
import {regexUserName} from "../utils/regexUsername";
import {isEmail} from "../utils/emailValidator";
import {sessionRemainingSecs} from "../utils/sessionRemainingSecs";

const Signup = () => {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const timerContext = useContext(SessionTimerContext);
  const imgInputRef = useRef();
  const timeoutRef = useRef();

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    facebook: "",
    youtube: "",
    twitter: "",
    instagram: ""
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [highlighted, setHighlighted] = useState(false);

  const [isFormLoading, setIsFormLoading] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [isValidUsernameFormat, setIsvalidUsernameFormat] = useState(true);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [backendError, setBackendError] = useState(null);

  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  const [isFieldVisited, setIsFieldVisited] = useState({
    name: false,
    email: false,
    password: false,
    bio: false
  });

  const [validationErrors, setValidationErrors] = useState({
    name: null,
    email: null,
    password: null,
    bio: null
  });

  
  /*--------------------------------------*/
  // Validador de los campos del formulario
  /*--------------------------------------*/
  const formValidator = (fields = user) => {
    setValidationErrors({
      name: null,
      email: null,
      password: null,
      bio: null
    });

    const errors = {}
    let formIsValid = true;

    if(fields.name.length < 4) {
      errors.name = "The name is required and must be at least 4 characters"
    }

    if(fields.bio.length < 10) {
      errors.bio = "The bio is required and must be at least 10 characters"
    }

    if(!isEmail(fields.email)) {
      errors.email = "Invalid email address"
    }

    if(fields.email.length === 0) {
      errors.email = "The email is required"
    }

    if(fields.password.length > 0 && fields.password.length < 6) {
      errors.password = "The password must be at least 6 characters"
    }

    if(fields.password.length === 0) {
      errors.password = "The password is required"
    }

    if(Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsSubmitDisabled(true);
      formIsValid = false;
    } else {
      setValidationErrors({
        name: null,
        email: null,
        password: null,
        bio: null
      });
      setIsSubmitDisabled(false);
      formIsValid = true;
    }

    return formIsValid;
  }

  /*----------------------------------------------------*/
  // Manejar el evento submit (Enviar la data al backend)
  /*----------------------------------------------------*/
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setBackendError(null);

    try {
      setIsFormLoading(true);

      // Enviar la data del formulario
      const res = await axios({
        method: "POST",
        url: "/api/signup",
        data: {
          name: user.name,
          username: username,
          email: user.email,
          password: user.password,
          bio: user.bio,
          facebook: user.facebook,
          youtube: user.youtube,
          twitter: user.twitter,
          instagram: user.instagram
        },
        headers: {
          "Content-Type": "application/json"
        }
      });

      const {profile} = res.data.data;
      userContext.setCurrentUser(profile.user);
      userContext.setCurrentProfile({profile, user: undefined});

      const remainingSeconds = sessionRemainingSecs(jsCookie.get("token"));
      timerContext.initializeTimer(remainingSeconds);

      // Actualizar el avatar del nuevo usuario si lo especifica
      if(image) {
        const formData = new FormData();
        formData.append("avatar", image);

        const updatedrUserData = await axios({
          method: "PATCH",
          url: `/api/signup/update-avatar/${res.data.data.profile.user._id}`,
          withCredentials: true,
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });

        setIsFormLoading(false);
        
        const updatedUser = updatedrUserData.data.data;
        userContext.setCurrentUser(updatedUser);
        router.push("/");
        
      } else {
        setIsFormLoading(false);
        router.push("/");
      }
      
    } catch (error) {
      let message = error.message;
      
      if(error.response) {
        message = error.response.data.message;
      }

      setIsFormLoading(false);
      setBackendError(message);
    }
  }

  /*--------------------------*/
  // Manejar el evento change
  /*--------------------------*/
  const onChangeHandler = (e) => {
    let trimmedValue = e.target.value.trim();
    const fieldName = e.target.name;

    // No hacer trim al nombre y a la biografía
    if((fieldName === "name" && e.target.value.trim().length > 0) || (fieldName === "bio" && e.target.value.trim().length > 0)) {
      trimmedValue = e.target.value;
    }
    
    // Prevenir que el nombre y la biografía contengan sólo espacios en blanco
    if((fieldName === "name" && e.target.value.trim().length === 0) || (fieldName === "bio" && e.target.value.trim().length === 0)) {
      trimmedValue = ""
    }

    setUser(prev => {
      const value = fieldName === "email" ? trimmedValue.toLowerCase() : trimmedValue;
      // Actualizar la validación con el nuevo valor ingresado
      formValidator({...prev, [fieldName]: value});
      // Retornar el nuevo state del campo
      return {...prev, [fieldName]: value}
    })
  }

  /*-----------------------*/
  // Manejar el evento blur
  /*-----------------------*/
  const onBlurHandler = (e) => {
    formValidator();
    setIsFieldVisited(prev => {
      return {...prev, [e.target.name]: true}
    })
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


  /*----------------------------------------------------------*/
  // Chequear si el username está disponible mientras se tipea
  /*----------------------------------------------------------*/
  const checkIfUsernameAvailable = async (username) => {
    try {
      setUsernameLoading(true);
      
      const res = await axios({
        method: "GET",
        url: `/api/signup/${username}`
      });

      console.log({usernameAvailableResponse: res.data});
      
      setUsernameLoading(false);
      setIsUsernameAvailable(true);
      
    } catch (error) {
      setUsernameLoading(false);
      setIsUsernameAvailable(false);
      return false;
    }
  }


  /*-----------------------------------------------*/
  // Manejar el evento change del input de username
  /*-----------------------------------------------*/
  const onUsernameChangeHandler = (e) => {
    setUsername(e.target.value);
    setIsUsernameAvailable(true);
    setIsvalidUsernameFormat(true);

    // Resetear el timeout anterior si se tipea de nuevo antes de que termine
    if(timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if(!regexUserName.test(e.target.value)) {
      setIsvalidUsernameFormat(false);
    } else {
      setIsvalidUsernameFormat(true);
    }
    
    // Ejecutar el request para chequear el username sólo
    // si se deja de tipear durante el tiempo especificado
    if(regexUserName.test(e.target.value)) {
      timeoutRef.current = setTimeout(() => {
        checkIfUsernameAvailable(e.target.value);
      }, 750);
    }
  }


  /*------------------------------------------------*/
  // No renderizar el componente si está autenticado
  /*------------------------------------------------*/
  if(userContext.isAuth) {
    return null
  }


  return (
    <>
      <HeaderMessage />

      <Form
        style={{marginBottom: "1rem"}}
        noValidate
        loading={isFormLoading}
        error={!!backendError}
        onSubmit={onSubmitHandler}
      >
        <Message
          error
          style={{marginTop: "1rem"}}
          header="Oops!"
          content={backendError}
          onDismiss={() => setBackendError(null)}
        />
        <Segment>
          <ImageDropInput
            highlighted={highlighted}
            setHighlighted={setHighlighted}
            imagePreview={imagePreview}
            imgInputRef={imgInputRef}
            setImage={setImage}
            onChangeHandler={onImageChangeHandler}
            setImagePreview={setImagePreview}
          />

          <Form.Input
            fluid
            error={validationErrors.name && isFieldVisited.name}
            name="name"
            label="Name"
            icon="user"
            iconPosition="left"
            placeholder="Name"
            value={user.name}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
          />
          {validationErrors.name && isFieldVisited.name &&
            <ValidationErrorMessage message={validationErrors.name} />
          }

          <Form.Input
            fluid
            error={validationErrors.email && isFieldVisited.email}
            type="email"
            name="email"
            label="Email"
            icon="envelope"
            iconPosition="left"
            placeholder="Email"
            value={user.email}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
          />
          {validationErrors.email && isFieldVisited.email &&
            <ValidationErrorMessage message={validationErrors.email} />
          }

          <Form.Input
            fluid
            error={validationErrors.password && isFieldVisited.password}
            type={showPassword ? "text" : "password"}
            name="password"
            label="Password"
            iconPosition="left"
            placeholder="Password"
            value={user.password}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
            icon={{
              name: !showPassword ? "eye" : "eye slash",
              circular: true,
              link: true,
              onClick: () => setShowPassword(prev => !prev)
            }}
          />
          {validationErrors.password && isFieldVisited.password &&
            <ValidationErrorMessage message={validationErrors.password} />
          }

          <Form.Input
            fluid
            loading={usernameLoading}
            error={(username.length > 0 && (!isUsernameAvailable || !isValidUsernameFormat))}
            name="username"
            label="Username"
            icon={(username.length > 0 && (!isUsernameAvailable || !isValidUsernameFormat)) ? "close" : "check"}
            iconPosition="left"
            placeholder="Name"
            value={username}
            onBlur={onBlurHandler}
            onChange={onUsernameChangeHandler}
          />
          {username.length > 0 && username.length <= 30 && !isValidUsernameFormat &&
            <ValidationErrorMessage message={"Username only accepts alphanumeric characters and underscore"} />
          }
          {username.length > 0 && username.length <= 30 && !isUsernameAvailable &&
            <ValidationErrorMessage message={"Username already taken by another user"} />
          }
          {username.length > 30 &&
            <ValidationErrorMessage message={"The username can only be max 30 characters"} />
          }
        </Segment>
      
        <CommonInputs
          user={user}
          bioError={validationErrors.bio && isFieldVisited.bio ? validationErrors.bio : null}
          onBlur={onBlurHandler}
          onChangeHandler={onChangeHandler}
          showSocialLinks={showSocialLinks}
          setShowSocialLinks={setShowSocialLinks}
        />
        <Divider hidden />
        <Button
          content="Signup"
          type="submit"
          color="orange"
          disabled={isSubmitDisabled || !isUsernameAvailable}
        />
      </Form>

      <FooterMessage />
    </>
  );
}

// Redirigir si el usuario está autenticado
export async function getServerSideProps(context) {
  try {
    const {token} = parseCookies(context);

    if(token) {
      return {
        redirect: {
          destination: "/",
          permanent: false
        }
      }
    }

    return {
      props: {}
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

export default Signup;
