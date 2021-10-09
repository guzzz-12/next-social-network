import {useContext, useEffect} from "react";
import {Icon} from "semantic-ui-react";
import {ToastContainer, toast} from "react-toastify";
import {SocketContext} from "../context/SocketProvider";

const ToastContent = ({icon, message}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center"
      }}
    >
      <span style={{marginRight: "10px"}}>
        <Icon name={icon} size="large" />
      </span>
      <span>{message}</span>
    </div>
  )
}

const GlobalToastNotification = () => {
  const {connectionLost} = useContext(SocketContext);

  // Generar toast para indicar problemas de conexión
  useEffect(() => {
    toast.dismiss();

    if(connectionLost) {
      toast.error(
        <ToastContent icon="ban" message="Check your intenet connection!" />,
        {autoClose: 5000}
      );

      } else {
      toast.success(
        <ToastContent icon="wifi" message="You are back online."/>,
        {autoClose: 3000}
      )
    }
  }, [connectionLost]);


  return (
    <>
      {/* Contenedor de los toasts */}
      <ToastContainer
        position="bottom-left"
        autoClose={4000}
        hideProgressBar={true}
      />
    </>
  )
}

export default GlobalToastNotification
