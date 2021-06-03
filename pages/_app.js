import axios from "axios";
import Layout from "../components/Layout/Layout";
import SessionTimerProvider from "../context/SessionTimerContext";
import UserContextProvider from "../context/UserContext";
import "react-toastify/dist/ReactToastify.css";
import "semantic-ui-css/semantic.min.css";

axios.defaults.baseURL = process.env.BASE_URL;

const MyApp = ({Component, pageProps}) => {
  return (
    <SessionTimerProvider>
      <UserContextProvider>
        <Layout {...pageProps}>
          <Component {...pageProps} />
        </Layout>
      </UserContextProvider>
    </SessionTimerProvider>
  )
}

export default MyApp;