module.exports = (req, res, next) => {
  try {
    if(req.userRole !== "admin") {
      return res.status(403).json({
        status: "failed",
        message: "Forbidden: You must be an admin user to access this resource"
      })
    }

    next();
    
  } catch (error) {
    console.log({roleCheckError: error.message});
    res.status(500).json({
      status: "failed",
      message: `Server error: ${error.message}`
    })
  }
}