import React, {useContext, useEffect, createRef, useState} from "react";
import Router, {useRouter} from "next/router";
import {Container, Visibility, Grid, Sticky, Ref, Segment} from "semantic-ui-react";
import nprogress from "nprogress";
import jsCookie from "js-cookie";

import HeadTags from "./HeadTags";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import Search from "./Search";
import {UserContext} from "../../context/UserContext";
import {sessionRemainingSecs} from "../../utils/sessionRemainingSecs";
import { useWindowWidth } from "../../utils/customHooks";

const Layout = (props) => {
  const contextRef = createRef();

  Router.onRouteChangeStart = () => nprogress.start();
  Router.onRouteChangeComplete = () => nprogress.done();
  Router.onRouteChangeError = () => nprogress.done();

  const router = useRouter();  
  const userContext = useContext(UserContext);
  
  const windowWidth = useWindowWidth();
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
      const user = JSON.parse(localStorage.getItem("user"))
      userContext.setCurrentUser(user);
    }
  }, []);
  
  /*----------------------------------------*/
  // Cerrar la sesión cuando el token expire
  /*----------------------------------------*/
  useEffect(() => {
    const token = jsCookie.get("token");

    if(token) {
      const remainingMinutes = Math.floor(sessionRemainingSecs(token)/60);
  
      if(remainingMinutes <= 0) {
        userContext.logOut();
        router.push("/login");
      }
    }
  }, [router.route]);

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
