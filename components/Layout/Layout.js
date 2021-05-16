import React, {useContext, useEffect, createRef} from "react";
import Router, {useRouter} from "next/router";
import {Container, Visibility, Grid, Sticky, Ref, Segment} from "semantic-ui-react";
import nprogress from "nprogress";
import jsCookie from "js-cookie";
import HeadTags from "./HeadTags";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import Search from "./Search";
import {SessionTimerContext} from "../../context/SessionTimerContext";
import {UserContext} from "../../context/UserContext";
import {sessionRemainingSecs} from "../../utils/sessionRemainingSecs";

const Layout = (props) => {
  const contextRef = createRef();

  Router.onRouteChangeStart = () => nprogress.start();
  Router.onRouteChangeComplete = () => nprogress.done();
  Router.onRouteChangeError = () => nprogress.done();

  const router = useRouter();
  const userContext = useContext(UserContext);
  const timerContext = useContext(SessionTimerContext);
  
  /*-----------------------------------------------------------------*/
  // Inicializar el timer de expiración de sesión al refrescar la app
  /*-----------------------------------------------------------------*/
  useEffect(() => {
    const token = jsCookie.get("token");
    console.log({tokenCookie: token});
    
    if(token) {
      const remainingSeconds = sessionRemainingSecs(token);
      timerContext.initializeTimer(remainingSeconds);

      const user = JSON.parse(localStorage.getItem("user"))
      userContext.setCurrentUser(user);
    } else {
      userContext.clearCurrentUser();
    }
  }, []);
  
  /*----------------------------------------*/
  // Cerrar la sesión cuando el token expire
  /*----------------------------------------*/
  useEffect(() => {
    if(timerContext.sessionExpired === true) {
      timerContext.setSessionExpired(null);
      userContext.clearCurrentUser();
      
      router.push("/login");
    }
  }, [timerContext.sessionExpired]);


  /*------------------------------------------*/
  // Mostrar el tiempo restante en la consola
  /*------------------------------------------*/
  useEffect(() => {
    if(timerContext.counter > 0) {
      // console.clear();
      // console.log({timeRemaining: timerContext.counter})
    }
  }, [timerContext.counter]);

  return (
    <>
      <HeadTags />

      {userContext.currentUser &&
        <div style={{marginLeft: "1rem", marginRight: "1rem"}}>
          <Ref innerRef={contextRef}>
            <Grid>
              {/* Contenido no scrolleable */}
              <Grid.Column floated="left" width={3}>
                <Sticky context={contextRef}>
                  <SideMenu user={userContext.currentUser}/>
                </Sticky>
              </Grid.Column>
              {/* Contenido scrolleable */}
              <Grid.Column width={9}>
                <Visibility context={contextRef}>
                  {props.children}
                </Visibility>
              </Grid.Column>
              {/* Contenido no scrolleable */}
              <Grid.Column floated="left" width={4}>
                <Sticky context={contextRef}>
                  <Segment basic>
                    <Search />
                  </Segment>
                </Sticky>
              </Grid.Column>
            </Grid>
          </Ref>
        </div>
      }

      {!userContext.currentUser &&
        <>
          <Navbar />
          <Container style={{paddingTop: "1rem"}} text>
            {props.children}
          </Container>
        </>
      }
    </>
  );
}

export default Layout;
