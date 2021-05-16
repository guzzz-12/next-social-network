import Router from "next/router";
import jsCookie from "js-cookie";

export const logoutUser = () => {
  jsCookie.remove("token");
  localStorage.removeItem("user");
  localStorage.removeItem("profile");
  Router.push("/login");
  Router.reload();
}