import moment from "moment";
import jwtDecode from "jwt-decode";

export const sessionRemainingSecs = (token) => {
  const decodedToken = jwtDecode(token);

  // Fecha actual en milisegundos
  const now = Date.now();

  // Fecha de expiración del token en milisegundos
  const expiryDate = moment(decodedToken.exp*1000);

  // Segundos restantes para la expiración del token
  const remainingSeconds = Math.round(expiryDate.diff(now)/1000);
  return remainingSeconds;
}