import {useState, useEffect} from "react";

/*---------------------------------*/
// Determinar el ancho de la vetana
/*---------------------------------*/
export const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState();

  const windowWidthListener = (e) => {
    setWindowWidth(e.target.innerWidth);
  }

  useEffect(() => {
    window.addEventListener("resize", windowWidthListener);
    setWindowWidth(window.innerWidth);

    return () => window.removeEventListener("resize", windowWidthListener)
  }, []);

  return windowWidth;
}