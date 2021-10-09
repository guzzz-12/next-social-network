import axios from "axios";
import Layout from "../components/Layout/Layout";
import NotificationsEventListener from "../components/NotificationsEventListener";
import UserContextProvider from "../context/UserContext";
import UnreadMsgsProvider from "../context/UnreadMessagesContext";
import SocketProvider from "../context/SocketProvider";
import NotificationsProvider from "../context/NotificationsContext";
import GlobalToastNotification from "../components/GlobalToastNotification";
import PostsSubscribedProvider from "../context/PostsSubscribedContext";
import "react-toastify/dist/ReactToastify.css";
import "semantic-ui-css/semantic.min.css";

axios.defaults.baseURL = process.env.BASE_URL;

const MyApp = ({Component, pageProps}) => {
  return (
    <NotificationsProvider>
      <UserContextProvider>
        <SocketProvider>
          <UnreadMsgsProvider>
            <PostsSubscribedProvider>
              <GlobalToastNotification />
              <NotificationsEventListener />
              <Layout {...pageProps}>
                <Component {...pageProps} />
              </Layout>
            </PostsSubscribedProvider>
          </UnreadMsgsProvider>
        </SocketProvider>
      </UserContextProvider>
    </NotificationsProvider>
  )
}

export default MyApp;