import {createContext, useState, useEffect, useContext} from "react";
import {Icon} from "semantic-ui-react";
import {toast} from "react-toastify";
import ioClient from "socket.io-client";
import {UserContext} from "./UserContext";

const io = ioClient(process.env.BASE_URL);

// Contenido del toast de status de conexión
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

export const SocketContext = createContext({
  socket: null,
  onlineUsers: [],
  connectionLost: false
});

const SocketContextProvider = ({children}) => {
  const {currentUser} = useContext(UserContext);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionLost, setConnectionLost] = useState(false);
  
  // Inicializar el socket
  useEffect(() => {    
    if(currentUser) {
      // Actualizar el socket del usuario cuando recupere su conexión
      // Mostrar toast de conexión exitosa
      window.addEventListener("online", () => {
        io.emit("updateUser", {userId: currentUser._id});
        toast.dismiss();
        toast.success(
          <ToastContent icon="wifi" message="You are back online."/>,
          {autoClose: 3000}
        );
        setConnectionLost(false);
      });
        
      // Pasar el usuario a offline en el server
      // cuando pierda su conexión
      // Mostrar toast de error de conexión
      window.addEventListener("offline", () => {
        io.emit("offline", {userId: currentUser._id});
        toast.dismiss();
        toast.error(
          <ToastContent icon="ban" message="Check your intenet connection!" />,
          {autoClose: 5000}
        );
        setConnectionLost(true);
      });

      io.on("setOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // Actualizar el socket del usuario actual en el server al actualizar la página
      io.emit("updateUser", {userId: currentUser._id});

      // Actualizar los sockets de los usuarios en el frontend
      // cuando actualicen las páginas en sus navegadores
      // filtrando al usuario actual
      io.on("updatedOnlineUsers", (updatedUsers) => {
        const filtered = [...updatedUsers].filter(el => el.userId.toString() !== currentUser._id.toString());
        setOnlineUsers(filtered);
      });
    }

  }, [currentUser]);

  return (
    <SocketContext.Provider
      value={{
        socket: io,
        onlineUsers,
        connectionLost
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContextProvider;
