const destroyCookie = require("nookies").destroyCookie;

const unauthRedirect = (message, context) => {
  console.log(`Error fetching posts: ${message}`);

  // Redirigir al login si hay error de token
  destroyCookie(context, "token");
  return {
    redirect: {
      destination: "/login",
      permanent: false
    }
  }
}

module.exports = unauthRedirect;
