import {useState, useEffect} from "react";
import {Icon, Message, Divider} from "semantic-ui-react";
import {useRouter} from "next/router";
import Link from "next/link";

export const HeaderMessage = () => {
  const router = useRouter();

  const [signupRoute, setSignupRoute] = useState(false);

  useEffect(() => {
    if(router.pathname === "/signup") {
      setSignupRoute(true)
    } else {
      setSignupRoute(false);
    }
  }, [router.pathname]);

  return (
    <Message
      color="teal"
      attached="top"
      header={signupRoute ? "Get Started" : "Welcome Back"}
      icon={signupRoute ? "settings" : "privacy"}
      content={signupRoute ? "Create new account" : "Login with email and password"}
    />
  )
}

export const FooterMessage = () => {
  const router = useRouter();

  const [signupRoute, setSignupRoute] = useState(false);

  useEffect(() => {
    if(router.pathname === "/signup") {
      setSignupRoute(true)
    } else {
      setSignupRoute(false);
    }
  }, [router.pathname]);

  return (
    <>
      {signupRoute &&
        <>
          <Message warning attached="bottom" >
            <Icon name="help" />
            {" "}
            Existing user?
            {" "}
            <Link href="/login">Login here instead</Link>
          </Message>
          <Divider hidden />
        </>
      }
      {!signupRoute &&
        <>
          <Message info attached="bottom" >
            <Icon name="lock" />
            {" "}
            <Link href="/reset">Forgot password?</Link>
          </Message>

          <Message warning attached="bottom" >
            <Icon name="help" />
            {" "}
            New user?
            {" "}
            <Link href="/signup">Signup here instead</Link>
          </Message>
        </>
      }
    </>
  )
}
