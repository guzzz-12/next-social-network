import {createContext, useState} from "react";

export const NotificationsContext = createContext({
  unreadNotifications: 0,
  setUnreadNotifications: () => {}
});

const NotificationsContextProvider = ({children}) => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  return (
    <NotificationsContext.Provider
      value={{
        unreadNotifications,
        setUnreadNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export default NotificationsContextProvider;