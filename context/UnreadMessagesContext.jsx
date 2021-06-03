import {createContext, useState} from "react";

export const UnreadMessagesContext = createContext({
  unreadCount: 0,
  setUnreadCount: () => {},
  setAllRead: () => {}
});

const UnreadMsgsContextProvider = ({children}) => {
  const [unreadMessages, setUnreadMessages] = useState(0);

  const setUnreadCount = (count) => {
    console.log({countUpdated: count});
    setUnreadMessages(count)
  }

  const setAllRead = () => {
    setUnreadMessages(0)
  }

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadCount: unreadMessages,
        setUnreadCount,
        setAllRead
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export default UnreadMsgsContextProvider;
