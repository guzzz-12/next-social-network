import React, {useContext, useEffect, createRef, useState} from "react";
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

  const [windowWidth, setWindowWidth] = useState();
  const [isDesktop, setIsDesktop] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  
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
    }
  }, []);
  
  /*----------------------------------------*/
  // Cerrar la sesión cuando el token expire
  /*----------------------------------------*/
  useEffect(() => {
    if(timerContext.sessionExpired === true) {
      timerContext.setSessionExpired(null);
      userContext.logOut();
      
      router.push("/login");
    }
  }, [timerContext.sessionExpired]);

  /*----------------------------------*/
  // Listener del ancho de la pantalla
  /*----------------------------------*/
  const windowWidthListener = (e) => {
    setWindowWidth(e.target.innerWidth);
  }

  /*------------------------------------------*/
  // Actualizar el state del ancho de pantalla
  /*------------------------------------------*/
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    window.addEventListener("resize", windowWidthListener);

    // Desmontar el listener del window al salir del layout
    return () => window.removeEventListener("resize", windowWidthListener);
  }, []);

  /*---------------------------------*/
  // Especificar si es tamaño desktop
  /*---------------------------------*/
  useEffect(() => {
    if(windowWidth > 900) {
      setIsDesktop(true);
      setIsTablet(false);
      setIsPhone(false);
    } else if(windowWidth <= 900 && windowWidth > 500) {
      setIsDesktop(false);
      setIsTablet(true);
      setIsPhone(false);
    } else {
      setIsDesktop(false);
      setIsTablet(false);
      setIsPhone(true);
    }
  }, [windowWidth]);

  return (
    <>
      <HeadTags />

      {userContext.currentUser &&
        <div style={{marginLeft: "1rem", marginRight: "1rem"}}>
          <Ref innerRef={contextRef}>
            <Grid>
              {/* Sidebar izquierdo para tablet y superior (No scrolleable) */}
              {router.pathname !== "/messages" && !isPhone &&
                <Grid.Column
                  style={{paddingRight: 0}}
                  floated="left"
                  width={isDesktop ? 3 : 2}
                >
                  <Sticky context={contextRef}>
                    <SideMenu isDesktop={isDesktop} isPhone={isPhone}/>
                  </Sticky>
                </Grid.Column>
              }

              {/* Menú superior para tamaño mobile e inferior */}
              {router.pathname !== "/messages" && isPhone &&
                <SideMenu isDesktop={isDesktop} isPhone={isPhone}/>
              }

              {/* Contenido scrolleable (contenido de las páginas) */}
              <Grid.Column
                width={router.pathname === "/messages" ? 16 : isDesktop ? 9 : isTablet ? 14 : 16}
              >
                <Visibility context={contextRef}>
                  {props.children}
                </Visibility>
              </Grid.Column>

              {/* Contenido no scrolleable */}
              {router.pathname !== "/messages" && isDesktop &&
                <Grid.Column floated="right" width={4}>
                  <Sticky context={contextRef}>
                    <Segment basic>
                      <Search />
                    </Segment>
                  </Sticky>
                </Grid.Column>
              }
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
