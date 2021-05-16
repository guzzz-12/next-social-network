import {createContext, useState, useEffect, useRef} from "react";

export const SessionTimerContext = createContext({
  time: 0,
  counter: 0,
  sessionExpired: null,
  setSessionExpired: () => {},
  initializeTimer: () => {}
});

const SessionTimer = ({children}) => {
  const intervalRef = useRef();
  const [time, setTime] = useState(null);
  const [counter, setCounter] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(null);

  /*-----------------------------------------------------------*/
  // Actualizar el contador con el tiempo restante de la sesión
  /*-----------------------------------------------------------*/
  useEffect(() => {
    if(time !== null) {
      intervalRef.current = setInterval(() => {
        setCounter(prev => {
          if(prev > 0) {
            return prev - 1
          } else {
            return 0
          }
        })
      }, 1000);
    }
  }, [time]);


  /*--------------------------------*/
  // Especificar si la sesión expiró
  /*--------------------------------*/
  useEffect(() => {
    if(counter !== null && counter >= 1) {
      setSessionExpired(false)
    }

    if(counter !== null && counter < 1) {
      setSessionExpired(true);
      clearInterval(intervalRef.current);
    }
  }, [counter]);
  

  /*---------------------------------------------------------------*/
  // Inicializar el contador con el tiempo especificado en segundos
  /*---------------------------------------------------------------*/
  const initializeTimer = (time) => {
    // Pasar el tiempo en segundos
    setCounter(time);
    setTime(time);
  }


  return (
    <SessionTimerContext.Provider
      value={{
        time,
        counter,
        sessionExpired,
        setSessionExpired,
        initializeTimer
      }}
    >
      {children}
    </SessionTimerContext.Provider>
  )
}

export default SessionTimer;