import {useState, useEffect} from "react";
import {Icon, Message, Divider} from "semantic-ui-react";
import {useRouter} from "next/router";
import Link from "next/link";

export const HeaderMessage = () => {
  const router = useRouter();

  // const [signupRoute, setSignupRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);

  // Verificar la ruta actual
  useEffect(() => {
    setCurrentRoute(router.pathname)
  }, [router.pathname]);

  return (
    <Message
      color="teal"
      attached="top"
      header={
        currentRoute === "/signup" ? "Get Started" :
        currentRoute === "/login" ? "Welcome Back" :
        currentRoute === "/forgot-password" ? "Reset your password" :
        currentRoute === "/reset-password" ? "Reset your password" :
        ""
      }
      icon={currentRoute !== "/login" ? "settings" : "privacy"}
      content={
        currentRoute === "/signup" ? "Create new account" :
        currentRoute === "/login" ? "Login with email and password" :
        currentRoute === "/forgot-password" ? "We'll send you an email with instructions to reset your password" :
        currentRoute === "/reset-password" ? "Type your new password" :
        ""
      }
    />
  )
}

export const FooterMessage = () => {
  const router = useRouter();

  if(router.pathname !== "/signup" && router.pathname !== "/login") {
    return null
  }

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
            <Link href="/forgot-password">Forgot password?</Link>
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
