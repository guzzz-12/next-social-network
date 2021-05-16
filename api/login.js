const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {check, validationResult} = require("express-validator");

const User = require("../models/UserModel");
const Profile = require("../models/ProfileModel");
const Follower = require("../models/FollowerModel");

/*---------------*/
// Iniciar sesión
/*---------------*/
router.post("/", [
  check("email", "Invalid email address").isEmail(),
  check("email", "The email is required").exists(),
  check("password", "The password is required").exists()
], async (req, res) => {
  // Chequear errores de validación
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    const errorsArray = errors.array();
    const errorsArrayStrings = errorsArray.map(error => {
      return error.msg;
    });

    return res.status(400).json({
      status: "failed",
      message: errorsArrayStrings.join(". ")
    });
  }

  try {
    const {email, password} = req.body;

    // Chequear si el usuario existe
    const user = await User.findOne({email});
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      });
    }

    // Consultar el profile del usuario
    const userProfile = await Profile.findOne({user: user._id}).populate("user", "-password");

    // Chequear la contraseña del usuario
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if(!isCorrectPassword) {
      return res.status(401).json({
        status: "failed",
        message: "Wrong password"
      });
    }

    // Generar el token de autenticación y setear el cookie
    const token = jwt.sign({userId: user._id, userRole: user.role}, process.env.JWT_SECRET, {expiresIn: "1d"});
    res.cookie("token", token, {maxAge: 24*3600*1000});

    res.json({
      status: "success",
      data: {
        profile: userProfile
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
})


module.exports = router;