import {createContext, useState, useRef, useEffect, useContext} from "react";
import ioClient from "socket.io-client";
import {UserContext} from "./UserContext";

export const SocketContext = createContext({
  socket: null,
  onlineUsers: []
});

const SocketContextProvider = ({children}) => {
  const {currentUser} = useContext(UserContext);
  const socketRef = useRef(ioClient(process.env.BASE_URL));

  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Inicializar el socket del usuario en el servidor
  // y actualizarlo al actualizar la página
  useEffect(() => {
    if(!socketRef.current) {
      socketRef.current = ioClient(process.env.BASE_URL)
    }

    if(currentUser) {
      socketRef.current.emit("updateUser", {userId: currentUser._id});
    }

  }, [socketRef.current, currentUser]);


  // Actualizar los sockets de los usuarios en el frontend
  // cuando actualicen las páginas en sus navegadores y generen un nuevo socket.id
  // Filtrar al usuario actual
  useEffect(() => {
    if(currentUser) {
      socketRef.current?.on("updatedOnlineUsers", (updatedUsers) => {
        const filtered = [...updatedUsers].filter(el => el.userId.toString() !== currentUser._id.toString());
        setOnlineUsers(filtered);
      });
    }
  }, [currentUser]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export default SocketContextProvider;
