import {useState, useContext} from "react";
import {useRouter} from "next/router";
import {Form, Segment, Button, Message} from "semantic-ui-react";
import {parseCookies} from "nookies";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/UserModel";
import {UserContext} from "../context/UserContext";
import {HeaderMessage} from "../components/common/WelcomeMessage";

const AccountVerificationPage = () => {
  const router = useRouter();
  const userContext = useContext(UserContext);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [newCodeSent, setNewCodeSent] = useState(false);


  /*---------------------------------*/
  // Enviar el código de verificaci´ón
  /*---------------------------------*/
  const onSubmitHandler = async () => {
    try {
      setLoading(true);
      setSuccessMessage(null);
      setError(null);
      setNewCodeSent(false);

      const res = await axios({
        method: "POST",
        url: "/api/signup/email-verification",
        data: {code},
        headers: {
          "Content-Type": "application/json"
        }
      });

      setSuccessMessage("Account successfully verified. Redirecting...");
      setLoading(false);
      userContext.setCurrentUser(res.data.data);

      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message;
      }
      setLoading(false);
      setError(message);
    }
  }


  /*-------------------------------------------------------------*/
  // Enviar un nuevo código de verificación al correo electrónico
  /*-------------------------------------------------------------*/
  const getNewVerificationCode = async () => {
    try {
      setLoading(true);
      setSuccessMessage(null);
      setError(null);
      setNewCodeSent(false);

      await axios({
        method: "GET",
        url: "/api/signup/email-verification/new-code"
      });

      setLoading(false);
      setSuccessMessage("Verification code sent successfully");
      setNewCodeSent(true);
      
    } catch (error) {
      let message = error.message;
      if(error.response) {
        message = error.response.data.message;
      }
      setLoading(false);
      setError(message);
    }
  }


  /*--------------*/
  // Evento change
  /*--------------*/
  const onChangeHandler = (e) => {
    setError(null);
    setSuccessMessage(null);
    setNewCodeSent(false);
    setCode(e.target.value);
  }

  return (
    <div style={{marginTop: "1rem"}}>
      <HeaderMessage />

      <Message
        warning
        style={{marginTop: "1rem"}}
        header="Didn't receive the code?"
        content={
          <div>
            <p style={{margin: "10px auto"}}>
              You can send a new verification code clicking on the button below
            </p>
            
            <Button
              content="Send new verification code"
              color="orange"
              disabled={loading}
              onClick={getNewVerificationCode}
            />
          </div>
        }
      />

      <Form
        noValidate
        style={{marginBottom: "1rem"}}
        loading={loading}
        success={!!successMessage}
        error={!!error}
        onSubmit={onSubmitHandler}
      >
        {/* Mensaje de error de backend */}
        <Message
          error
          style={{marginTop: "1rem"}}
          header="Oops!"
          content={error}
          onDismiss={() => setError(null)}
        />

        {/* Mensaje de operación exitosa */}
        <Message
          success
          style={{marginTop: "1rem"}}
          header={successMessage}
          content={
            newCodeSent ?
            <div>
              A new verification code was sent to <strong>{userContext.currentUser.email}</strong>, check your inbox!
            </div>
            :
            ""
          }
          onDismiss={() => {
            setSuccessMessage(null);
            codeInputRef.current = null;
          }}
        />

        <Segment>
          <Form.Input
            fluid
            name="code"
            label="Verification code"
            icon="key"
            iconPosition="left"
            placeholder="Your 6-digit code"
            value={code}
            onChange={onChangeHandler}
          />
        </Segment>
        
        <Button
          content="Submit"
          type="submit"
          color="orange"
          disabled={loading || code.length < 6}
        />
      </Form>
    </div>
  )
}

export async function getServerSideProps(ctx) {
  const {token} = parseCookies(ctx);
  
  // Redirigir al login si no hay token
  if(!token) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    }
  }
  
  try {
    const decodedToken = jwt.decode(token);
    const userId = decodedToken.userId;
    const user = await User.findById(userId).select("isVerified verificationCode");

    // Si ya está verificado, redirigir al homepage
    if(user.isVerified) {
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
    console.log(`Error verifying user status: ${error.message}`)
    
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    }
  }
}

export default AccountVerificationPage;
