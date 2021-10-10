import {ToastContainer, toast} from "react-toastify";

const GlobalToastNotification = () => {
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
