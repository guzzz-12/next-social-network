import {useState, useEffect} from "react";
import {useRouter} from "next/router";
import {Form, Segment, Button, Message} from "semantic-ui-react";
import {parseCookies} from "nookies";
import axios from "axios";
import {HeaderMessage} from "../components/common/WelcomeMessage";
import ValidationErrorMessage from "../components/common/ValidationErrorMessage";

const ResetPasswordPage = () => {
  const router = useRouter();
  const query = router.query;

  const [values, setValues] = useState({
    newPassword: "",
    passwordConfirm: ""
  });

  const [validationErrors, setValidationErrors] = useState({
    newPassword: null,
    passwordConfirm: null
  });

  const [isVisited, setIsVisited] = useState({
    newPassword: false,
    passwordConfirm: false
  });

  const [isValid, setIsvalid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [backendError, setBackendError] = useState(null);


  /*--------------------------------------*/
  // Validador de los campos del formulario
  /*--------------------------------------*/
  const formValidator = (fields = values) => {
    setValidationErrors({
      newPassword: null,
      passwordConfirm: null
    });

    const errors = {}
    let formIsValid = true;

    if(fields.newPassword.length > 0 && fields.newPassword.length < 6) {
      errors.newPassword = "The password must be at least 6 characters"
    }

    if(fields.newPassword.length === 0) {
      errors.newPassword = "The new password is required"
    }

    if(fields.passwordConfirm.length === 0) {
      errors.passwordConfirm = "You must confirm your new password"
    }

    if(fields.newPassword.length > 0 && fields.passwordConfirm.length > 0 && (fields.newPassword !== fields.passwordConfirm)) {
      errors.passwordConfirm = "Passwords don't match"
    }

    if(Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsvalid(false);
      formIsValid = false;
    } else {
      setValidationErrors({
        newPassword: null,
        passwordConfirm: null
      });
      setIsvalid(true);
      formIsValid = true;
    }

    return formIsValid;
  }


  /*------------------------------------------*/
  // Validar el token de reseteo de contraseña
  /*------------------------------------------*/
  useEffect(() => {
    setLoading(true);
    setSuccess(false);
    setBackendError(null);

    if(query.token) {
      console.log({ResetToken: query.token})

      axios({
        method: "GET",
        url: `/api/reset-password?token=${query.token}`
      })
      .then(res => {
        console.log({tokenVerified: res.data.data});
        setLoading(false);
      })
      .catch(err => {
        let message = err.message;

        if(err.response) {
          message = err.response.data.message
        }
        
        setBackendError(message);
        setLoading(false);
        console.log(`Error checking reset token: ${message}`)
      })
    }
  }, [query]);


  /*---------------------*/
  // Enviar el formulario
  /*---------------------*/
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBackendError(null);

    setValidationErrors({
      newPassword: null,
      passwordConfirm: null
    })

    // Verificar si el formulario es válido
    const isValid = formValidator(values);
    if(!isValid) {
      setLoading(false);
      return setIsVisited({
        newPassword: true,
        passwordConfirm: true
      });
    }

    try {
      await axios({
        method: "POST",
        url: `/api/reset-password/create-password?token=${query.token}`,
        data: {
          newPassword: values.newPassword
        },
        headers: {
          "Content-type": "application/json"
        }
      });

      setLoading(false);
      setSuccess(true);
      setValues({
        newPassword: "",
        passwordConfirm: ""
      })
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message
      }
      setLoading(false);
      setBackendError(message)
    }
  }


  /*---------------------------------------*/
  // Manejar el evento change de los campos
  /*---------------------------------------*/
  const onChangeHandler = (e) => {
    const value = e.target.value.trim();
    const fieldName = e.target.name;

    setValues(prev => {
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
    setIsVisited(prev => {
      return {
        ...prev,
        [e.target.name]: true
      }
    })
  }


  /*--------------------------------------------------*/
  // Link para regresar a la página de envío del email
  //en caso de token expirado
  /*--------------------------------------------------*/
  const BackLink = () => {
    return (
      <div>
        <p>Expired token, send a new email to restore your password?</p>
        <Button
          content="Send another email"
          compact color="orange"
          onClick={(e) => {
            e.preventDefault();
            router.push("/forgot-password");
          }}
        />
      </div>
    )
  }

  // Link para ir a la página de login en caso de operación exitosa
  const LoginLink = () => {
    return (
      <div>
        <p>You can now login to your account with your new password.</p>
        <Button
          content="Go to login page"
          compact color="orange"
          onClick={(e) => {
            e.preventDefault();
            router.push("/login");
          }}
        />
      </div>
    )
  }


  return (
    <>
      <HeaderMessage />
      <Form
        noValidate
        style={{marginBottom: "1rem"}}
        loading={loading}
        success={success}
        error={!!backendError}
        onSubmit={onSubmitHandler}
      >
        {/* Mensaje de error de backend */}
        <Message
          error
          style={{marginTop: "1rem"}}
          header="Oops!"
          content={backendError?.includes("expired") ? BackLink() : backendError}
          onDismiss={() => setBackendError(null)}
        />

        {/* Mensaje de operación exitosa */}
        <Message
          success
          style={{marginTop: "1rem"}}
          header="Password successfully restored!"
          content={LoginLink()}
          onDismiss={() => setSuccess(false)}
        />

        <Segment>
          <Form.Input
            fluid
            type="password"
            name="newPassword"
            label="New password"
            placeholder="Your new password"
            error={validationErrors.newPassword && isVisited.newPassword}
            value={values.newPassword}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
          />
          {validationErrors.newPassword && isVisited.newPassword &&
            <ValidationErrorMessage message={validationErrors.newPassword} />
          }

          <Form.Input
            fluid
            type="password"
            name="passwordConfirm"
            label="New password confirm"
            placeholder="Confirm your new password"
            error={validationErrors.passwordConfirm && isVisited.passwordConfirm}
            value={values.passwordConfirm}
            onChange={onChangeHandler}
            onBlur={onBlurHandler}
          />
          {validationErrors.passwordConfirm && isVisited.passwordConfirm &&
            <ValidationErrorMessage message={validationErrors.passwordConfirm} />
          }
        </Segment>

        <Button
          content="Confirm"
          type="submit"
          color="orange"
          disabled={loading || !isValid}
        />

      </Form>
    </>
  )
}

export async function getServerSideProps(context) {
  try {
    const {token} = parseCookies(context);

    if(token) {
      console.log("Redirecting from reset-password")

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

export default ResetPasswordPage;
