import {createContext, useState, useEffect, useContext} from "react";
import ioClient from "socket.io-client";
import {UserContext} from "./UserContext";

export const SocketContext = createContext({
  socket: null,
  onlineUsers: [],
  connectionLost: false
});

const SocketContextProvider = ({children}) => {
  const {currentUser} = useContext(UserContext);
  const io = ioClient(process.env.BASE_URL);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionLost, setConnectionLost] = useState(false);
  
  // Inicializar el socket
  useEffect(() => {    
    if(currentUser) {
      // Actualizar el socket del usuario cuando recupere su conexión
      window.addEventListener("online", () => {
        setConnectionLost(false)
        io.emit("updateUser", {userId: currentUser._id});
      });

      // Pasar el usuario a offline en el server
      // cuando pierda su conexión
      window.addEventListener("offline", () => {
        setConnectionLost(true);
        io.emit("offline", {userId: currentUser._id})
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
