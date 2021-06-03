import {createContext, useState} from "react";

export const UnreadMessagesContext = createContext({
  unreadMessages: 0,
  setUnreadMessages: () => {}
});

const UnreadMsgsContextProvider = ({children}) => {
  const [unreadMessages, setUnreadMessages] = useState(0);

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadMessages,
        setUnreadMessages
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export default UnreadMsgsContextProvider;
