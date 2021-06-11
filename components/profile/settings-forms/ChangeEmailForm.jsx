import {useState, useRef} from "react";
import {Form, Header, Icon, Button, Message} from "semantic-ui-react";
import axios from "axios";
import ValidationErrorMessage from "../../common/ValidationErrorMessage";
import {isEmail} from "../../../utils/emailValidator";

const ChangeEmailForm = () => {
  const emailRef = useRef();

  // State de los valores de los inputs
  const [values, setValues] = useState({
    password: "",
    newEmail: ""
  });

  // State de los errores de validación del formulario
  const [validationErrors, setValidationErrors] = useState({
    password: null,
    newEmail: null
  });

  // State de los campos visitados
  const [isFieldVisited, setIsFieldVisited] = useState({
    password: false,
    newEmail: false
  })

  // State del submit del formulario
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [backendErrorMsg, setBackendErrorMsg] = useState(null);

  /*----------------------------------*/
  // Validar los campos del formulario
  /*----------------------------------*/
  const formValidator = (fields = values) => {
    setValidationErrors({
      password: null,
      newEmail: null
    });

    const errors = {};
    let isFormValid = true;

    if(fields.password.length === 0) {
      errors.password = "The current password is required"
    }

    if(!isEmail(fields.newEmail)) {
      errors.newEmail = "Invalid email address"
    }

    if(fields.newEmail.length === 0) {
      errors.newEmail = "The new email address is required"
    }

    if(Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      isFormValid = false;

    } else {
      setValidationErrors({
        password: null,
        newEmail: null
      });
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
    setSuccessMsg(null);
    setBackendErrorMsg(null);

    // Validar el formulario al intentar enviarlo
    const isValid = formValidator();
    setIsFieldVisited({
      password: true,
      newEmail: true
    });

    // Impedir enviar la data si no pasa la validación
    if(!isValid) {
      setLoading(false);
      return false;
    }

    emailRef.current = values.newEmail;

    try {
      const res = await axios({
        method: "PATCH",
        url: "/api/profile/me/update-email",
        data: {
          password: values.password,
          newEmail: values.newEmail
        },
        headers: {
          "Content-Type": "application/json"
        }
      });

      console.log({response: res.data.data});
      setSuccessMsg("Confirmation email sent.");
      setLoading(false);
      setValues({
        password: "",
        newEmail: ""
      })
      
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
    const fieldName = e.target.name;
    const trimmed = e.target.value.trim();
    const value = fieldName === "newEmail" ? trimmed.toLowerCase() : trimmed;

    setSuccessMsg(null);
    setBackendErrorMsg(null);

    setValues(prev => {
      // Validar el input mientras se tipea
      formValidator({...prev, [fieldName]: value})

      return {
        ...prev,
        [fieldName]: value
      }
    })
  }

  /*------------*/
  // Evento blur
  /*------------*/
  const onBlurHandler = (e) => {
    setIsFieldVisited(prev => {
      return {...prev, [e.target.name]: true}
    })
  }


  return (
    <>
      <Header as="h4" textAlign="center">
        <Icon name="envelope" />
        Change email address
      </Header>

      <Form
        noValidate
        loading={loading}
        error={!!backendErrorMsg}
        success={!!successMsg}
        onSubmit={onSubmitHandler}
      >
        <Message
          error
          header="Oops!"
          content={backendErrorMsg}
          onDismiss={() => setBackendErrorMsg(null)}
        />
        
        <Message
          success
          header="Success!"
          content={
            <div>
              A confirmation email was sent to <strong>{emailRef.current}</strong>. Check your inbox!
            </div>
          }
          onDismiss={() => {
            setSuccessMsg(null);
            emailRef.current = null
          }}
        />

        <Form.Input
          label="Current password"
          type="password"
          name="password"
          placeholder="Your current password"
          error={
            validationErrors.password &&
            isFieldVisited.password ||
            backendErrorMsg && backendErrorMsg.toLowerCase() === "wrong password"
          }
          value={values.password}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
        />
        {validationErrors.password && isFieldVisited.password &&
          <ValidationErrorMessage message={validationErrors.password} />
        }

        <Form.Input
          type="email"
          name="newEmail"
          label="Email"
          placeholder="Your new email address"
          value={values.newEmail}
          error={validationErrors.newEmail && isFieldVisited.newEmail}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
        />
        {validationErrors.newEmail && isFieldVisited.newEmail &&
          <ValidationErrorMessage message={validationErrors.newEmail} />
        }

        <Button primary content="Confirm" />
      </Form>
    </>
  )
}

export default ChangeEmailForm;
