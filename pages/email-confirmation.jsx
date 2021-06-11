import axios from "axios";
import {parseCookies} from "nookies";

const EmailConfirmation = () => {
  return (
    <div>
      Redirecting...
    </div>
  )
}

export async function getServerSideProps(context) {
  try {
    const {token} = parseCookies(context);
    const confirmationToken = context.query.token;

    if(!token) {
      return {
        redirect: {
          destination: "/",
          permanent: false
        }
      }
    }

    const res = await axios({
      method: "GET",
      url: `${process.env.BASE_URL}/api/profile/me/confirmation-email?token=${confirmationToken}`,
      headers: {
        Cookie: `token=${token}`
      }
    });

    const updatedEmail = res.data.data.email;

    return {
      redirect: {
        destination: `/profile?updatedEmail=${updatedEmail}`,
        permanent: false
      }
    }
    
  } catch (error) {
    let message = error.message;
    if(error.response) {
      message = error.response.data.message;
    }
    console.log(`Error checking confirmation email: ${message}`);

    return {
      redirect: {
        destination: `/profile?errorUpdatingEmail=${message}`,
        permanent: false
      }
    }
  }
}

export default EmailConfirmation
