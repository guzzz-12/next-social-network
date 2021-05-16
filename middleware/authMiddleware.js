const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const {token} = req.cookies;
    if(!token) {
      return res.status(401).json({
        status: "failed",
        message: "Authorization error: You must be logged in to access this resource"
      })
    }

    // Extraer el id del usuario del token
    const decodedAndVerifiedToken = jwt.verify(token, process.env.JWT_SECRET);
    const {userId, userRole} = decodedAndVerifiedToken;

    // Almacenar el id y el rol del usuario en el request y continuar
    req.userId = userId;
    req.userRole = userRole;
    next();
    
  } catch (error) {
    console.log({authError: error.message});
    res.status(401).json({
      status: "failed",
      message: `Authorization error: ${error.message}`
    })
  }
}