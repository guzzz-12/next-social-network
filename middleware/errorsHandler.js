const errorsHandler = (error, req, res, next) => {
  const {name} = error;
  if(error) {
    if(name === "UnauthorizedError") {
      return res.status(401).json({
        status: "failed",
        msg: "Invalid or expired token. Please login again."
      })
    } else {
      return res.status(500).json({
        status: "failed",
        msg: `Something went wrong: ${error.message}`
      })
    }
  }
  next()
}

module.exports = errorsHandler;