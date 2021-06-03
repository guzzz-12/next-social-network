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
  
  useEffect(() => {
    if(!socketRef.current) {
      socketRef.current = ioClient(process.env.BASE_URL)
    }

    if(socketRef.current && currentUser) {
      socketRef.current.emit("join", {userId: currentUser._id});

      // Actualizar el state de los usuarios online
      socketRef.current.on("onlineUsers", (onlineUsers) => {
        const filtered = onlineUsers.filter(el => el.userId.toString() !== currentUser._id.toString());
        setOnlineUsers(filtered);
      });
    }

  }, [socketRef.current, currentUser]);

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
