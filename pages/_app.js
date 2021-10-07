import axios from "axios";
import Layout from "../components/Layout/Layout";
import UserContextProvider from "../context/UserContext";
import UnreadMsgsProvider from "../context/UnreadMessagesContext";
import SocketProvider from "../context/SocketProvider";
import NotificationsProvider from "../context/NotificationsContext";
import "react-toastify/dist/ReactToastify.css";
import "semantic-ui-css/semantic.min.css";

axios.defaults.baseURL = process.env.BASE_URL;

const MyApp = ({Component, pageProps}) => {
  return (
    <NotificationsProvider>
      <UserContextProvider>
        <SocketProvider>
          <UnreadMsgsProvider>
            <Layout {...pageProps}>
              <Component {...pageProps} />
            </Layout>
          </UnreadMsgsProvider>
        </SocketProvider>
      </UserContextProvider>
    </NotificationsProvider>
  )
}

export default MyApp;