import axios from "axios";
import Layout from "../components/Layout/Layout";
import SessionTimerProvider from "../context/SessionTimerContext";
import UserContextProvider from "../context/UserContext";
import UnreadMsgsProvider from "../context/UnreadMessagesContext";
import "react-toastify/dist/ReactToastify.css";
import "semantic-ui-css/semantic.min.css";

axios.defaults.baseURL = process.env.BASE_URL;

const MyApp = ({Component, pageProps}) => {
  return (
    <UnreadMsgsProvider>
      <SessionTimerProvider>
        <UserContextProvider>
          <Layout {...pageProps}>
            <Component {...pageProps} />
          </Layout>
        </UserContextProvider>
      </SessionTimerProvider>
    </UnreadMsgsProvider>
  )
}

export default MyApp;