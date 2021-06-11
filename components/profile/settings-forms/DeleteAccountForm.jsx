import {useState, useContext} from "react";
import {Form, Header, Icon, Button, Message} from "semantic-ui-react";
import axios from "axios";
import ValidationErrorMessage from "../../common/ValidationErrorMessage";
import {UserContext} from "../../../context/UserContext";

const DeleteAccountForm = () => {
  const userContext = useContext(UserContext);

  // State de los valores de los inputs
  const [password, setPassword] = useState("");

  // State de los errores de validación del formulario
  const [validationErrors, setValidationErrors] = useState(null);

  // State de los campos visitados
  const [isFieldVisited, setIsFieldVisited] = useState(false)

  // State del submit del formulario
  const [loading, setLoading] = useState(false);
  const [backendErrorMsg, setBackendErrorMsg] = useState(null);

  /*----------------------------------*/
  // Validar los campos del formulario
  /*----------------------------------*/
  const formValidator = (value = password) => {
    setValidationErrors(null);

    let errors = null;
    let isFormValid = true;

    if(value.length > 0 && value.length < 6) {
      errors = "The value must be at least 6 characters"
    }

    if(value.length === 0) {
      errors = "The current password is required"
    }

    if(errors) {
      setValidationErrors(errors);
      isFormValid = false;

    } else {
      setValidationErrors(null);
      isFormValid = true;
    }

    return isFormValid;
  }

  /*-----------------------------------------------*/
  // Procesar el formulario de cambio de contraseña
  /*-----------------------------------------------*/
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBackendErrorMsg(null);

    // Validar el formulario al intentar enviarlo
    const isValid = formValidator();
    setIsFieldVisited(true);

    // Impedir enviar la data si no pasa la validación
    if(!isValid) {
      setLoading(false);
      return false;
    }

    try {
      await axios({
        method: "DELETE",
        url: "/api/profile/me",
        data: {password},
        headers: {
          "Content-Type": "application/json"
        }
      });

      setLoading(false);
      userContext.logOut();
      
    } catch (error) {
      let msg = error.message;

      if(error.response) {
        msg = error.response.data.message;
      }

      setBackendErrorMsg(msg);
      setLoading(false);
    }
  }

  /*---------------*/
  // Evento change
  /*---------------*/
  const onChangeHandler = (e) => {
    setBackendErrorMsg(null);

    setPassword(() => {
      // Validar el input mientras se tipea
      formValidator(e.target.value);

      return e.target.value
    })
  }

  /*------------*/
  // Evento blur
  /*------------*/
  const onBlurHandler = () => {
    setIsFieldVisited(true)
  }


  return (
    <>
      <Header
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
        as="h4"
      >
        <Icon name="user delete" />
        <Header.Content style={{textAlign: "center"}}>
          Delete your account
          <Header.Subheader style={{color: "red"}} >
            <small>This process will remove all your personal data,</small>
            <br />
            <small>your posts and comments and cannot be undone</small>
          </Header.Subheader>
        </Header.Content>
      </Header>

      <Form
        noValidate
        loading={loading}
        error={!!backendErrorMsg}
        onSubmit={onSubmitHandler}
      >
        <Message
          error
          header="Oops!"
          content={backendErrorMsg}
          onDismiss={() => setBackendErrorMsg(null)}
        />

        <Form.Input
          label="Current password"
          type="password"
          name="password"
          placeholder="Your current password"
          error={
            validationErrors &&
            isFieldVisited ||
            backendErrorMsg && backendErrorMsg.toLowerCase() === "wrong password"
          }
          value={password}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
        />
        {validationErrors && isFieldVisited &&
          <ValidationErrorMessage message={validationErrors} />
        }

        <Button primary content="Confirm" />
      </Form>
    </>
  )
}

export default DeleteAccountForm;
