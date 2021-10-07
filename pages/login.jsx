import {useState, useContext} from "react";
import {useRouter} from "next/router";
import {Form, Button, Message, Segment} from "semantic-ui-react";
import axios from "axios";
import {parseCookies, destroyCookie} from "nookies";
import jsCookie from "js-cookie";
import {FooterMessage, HeaderMessage} from "../components/common/WelcomeMessage";
import {SessionTimerContext} from "../context/SessionTimerContext";
import {UserContext} from "../context/UserContext";
import ValidationErrorMessage from "../components/common/ValidationErrorMessage";
import {isEmail} from "../utils/emailValidator";
import {sessionRemainingSecs} from "../utils/sessionRemainingSecs";

const Login = () => {
  const router = useRouter();
  const timerContext = useContext(SessionTimerContext);
  const userContext = useContext(UserContext);

  const [values, setValues] = useState({
    email: "",
    password: ""
  });

  const [isFieldVisited, setIsFieldVisited] = useState({
    email: false,
    password: false
  });

  const [validationErrors, setValidationErrors] = useState({
    email: null,
    password: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);


  /*---------------------*/
  // Enviar el formulario
  /*---------------------*/
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setIsFormLoading(true);
      setBackendError(null);

      const res = await axios({
        method: "POST",
        url: "/api/login",
        withCredentials: true,
        data: {
          email: values.email,
          password: values.password
        },
        headers: {
          "Content-Type": "application/json"
        }
      });

      setIsFormLoading(false);

      const {profile} = res.data.data;
      userContext.setCurrentUser(profile.user);
      userContext.setCurrentProfile(profile);

      const remainingSeconds = sessionRemainingSecs(jsCookie.get("token"));
      timerContext.initializeTimer(remainingSeconds);

      // Redirigir a la página de verificación de email si no lo ha verificado aún
      if(!profile.user.isVerified) {
        return router.push("/account-verification");
      }

      // Redirigir al homepage si ya está verificado
      router.push("/");
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message
      }
      setBackendError(message);
      setIsFormLoading(false);
    }
  }


  /*----------------------*/
  // Validar el formulario
  /*----------------------*/
  const formValidator = (fields = values) => {
    setValidationErrors({
      email: false,
      password: false
    });

    let errors = {};
    let isFormValid = true;

    if(!isEmail(fields.email)) {
      errors.email = "Invalid email address"
    }

    if(fields.email.length === 0) {
      errors.email = "The email is required"
    }

    if(fields.password.length === 0) {
      errors.password = "The password is required"
    }

    if(fields.password.length < 6 || fields.password.length > 30) {
      errors.password = "The password must be at least 6 characters and max 30 characters"
    }

    if(Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsSubmitDisabled(true);
      isFormValid = false;
    } else {
      setValidationErrors({
        email: null,
        password: null
      });
      setIsSubmitDisabled(false);
      isFormValid = true;
    }

    return isFormValid;
  }

  
  /*---------------------------------------*/
  // Manejar el evento change de los campos
  /*---------------------------------------*/
  const onChangeHandler = (e) => {
    const trimmedValue = e.target.value.trim();
    const fieldName = e.target.name;

    setValues(prev => {
      const value = fieldName === "email" ? trimmedValue.toLowerCase() : trimmedValue;
      // Actualizar la validación con el nuevo valor ingresado
      formValidator({...prev, [fieldName]: value});
      // Retornar el nuevo state del campo
      return {...prev, [fieldName]: value}
    })
  }


  /*-------------------------------------*/
  // Manejar el evento blur de los campos
  /*-------------------------------------*/
  const onBlurHandler = (e) => {
    formValidator();
    setIsFieldVisited(prev => {
      return {
        ...prev,
        [e.target.name]: true
      }
    })
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
        noValidate
        style={{marginBottom: "1rem"}}
        loading={isFormLoading}
        error={!!backendError}
        onSubmit={onSubmitHandler}
      >
        <Message
          error
          style={{marginTop: "1rem"}}
          header="Oops!"
          content={backendError?.includes("MongoDB") ? "Network error, check your intenet conection" : backendError}
          onDismiss={() => setBackendError(null)}
        />
        <Segment>
          <Form.Input
            fluid
            error={validationErrors.email && isFieldVisited.email}
            name="email"
            label="Email"
            icon="envelope"
            iconPosition="left"
            placeholder="Email"
            value={values.email}
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
            value={values.password}
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
        </Segment>

        <Button
          content="Login"
          type="submit"
          color="orange"
          disabled={isSubmitDisabled}
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
    return {
      props: {
        error: error.message
      }
    }
  }
}

export default Login;
