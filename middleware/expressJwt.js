const expressJwt = require("express-jwt");

const authJwt = () => {
  return expressJwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"]
  })
}

module.exports = authJwt;