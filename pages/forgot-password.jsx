import {useState, useRef} from "react";
import {Form, Segment, Button, Message} from "semantic-ui-react";
import {parseCookies} from "nookies";
import axios from "axios";
import {HeaderMessage} from "../components/common/WelcomeMessage";
import ValidationErrorMessage from "../components/common/ValidationErrorMessage";
import {isEmail} from "../utils/emailValidator";

const ForgotPasswordPage = () => {
  const emailValueRef = useRef();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [isVisited, setIsVisited] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);


  /*----------------------*/
  // Validar el formulario
  /*----------------------*/
  const formValidator = (value) => {
    setValidationErrors(null);
    
    let error = null;
    let isFormValid = true;

    if(!isEmail(value)) {
      error = "Invalid email address"
    }

    if(value.length === 0) {
      error = "The email is required"
    }

    if(error) {
      setValidationErrors(error);
      isFormValid = false;
    } else {
      setValidationErrors(null);
      isFormValid = true;
    }
    
    return isFormValid;
  }


  /*----------------------*/
  // Enviar el formulario
  /*----------------------*/
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setValidationErrors(null);
    setBackendError(null);
    setSuccess(false);
    
    // Validar al intentar enviar
    const isValid = formValidator(email);
    if(!isValid) {
      return setIsVisited(true)
    }

    // Amacenar el email en el ref para mostrarlo en el mensaje de sucess
    emailValueRef.current = email;
    
    try {
      setLoading(true);

      const res = await axios({
        method: "POST",
        url: `/api/reset-password`,
        data: {email},
        headers: {
          "Content-Type": "application/json"
        }
      });

      setLoading(false);
      setSuccess(true);
      setEmail("");
      console.log({response: res.data.data});
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message
      }
      setLoading(false);
      setSuccess(false);
      setBackendError(message);
    }
  }


  /*------------------------*/
  // Manejar evento onchange
  /*------------------------*/
  const onChangeHandler = (e) => {
    setBackendError(null);
    setSuccess(false);
    const value = e.target.value.trim().toLowerCase();

    setEmail(() => {
      // Validar el formulario al tipear
      formValidator(value)
      // Retornar el nuevo valor
      return value;
    })
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
          content={backendError}
          onDismiss={() => setBackendError(null)}
        />

        {/* Mensaje de operación exitosa */}
        <Message
          success
          style={{marginTop: "1rem"}}
          header="Email sent!"
          content={
            <div>
              An email was sent to <strong>{emailValueRef.current}</strong> with instructions to reset your password, check your inbox!
            </div>
          }
          onDismiss={() => {
            setSuccess(false);
            emailValueRef.current = null;
          }}
        />

        <Segment>
          <Form.Input
            fluid
            error={validationErrors && isVisited}
            name="email"
            label="Email"
            icon="envelope"
            iconPosition="left"
            placeholder="Email"
            value={email}
            onChange={onChangeHandler}
            onBlur={() => setIsVisited(true)}
          />
          {validationErrors && isVisited &&
            <ValidationErrorMessage message={validationErrors} />
          }
        </Segment>
        
        <Button
          content="Submit"
          type="submit"
          color="orange"
          disabled={loading || !!validationErrors}
        />
      </Form>
    </>
  )
}

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

export default ForgotPasswordPage;
