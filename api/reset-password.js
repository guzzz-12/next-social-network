const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendGrid = require("@sendgrid/mail");
const {check, validationResult} = require("express-validator");
const User = require("../models/UserModel");
const resetPasswordTemplate = require("../emailTemplates/resetPasswordTemplate");

// Enviar el correo de reseteo de contraseña
router.post("/", [
  check("email", "Invalid email address").isEmail(),
  check("email", "Email is required").exists()
], async (req, res) => {
  try {
    // Chequear errores de validación
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      const errorsArray = errors.array();

      return res.status(400).json({
        status: "failed",
        message: errorsArray[0]
      });
    }

    const {email} = req.body;

    // Verificar si el usuario existe
    const user = await User.findOne({email}).lean();
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "There is no user associated to the specified email address."
      })
    }

    // Generar el token de verificación
    const token = jwt.sign({userEmail: email}, process.env.JWT_SECRET, {expiresIn: 900});
    const resetHref = `${process.env.BASE_URL}/reset-password?token=${token}`

    // Opciones del correo a enviar
    const mailContent = {
      to: email,
      from: {
        name: "Social Network App",
        email: process.env.SENDGRID_FROM
      },
      subject: "Reset your password",
      html: resetPasswordTemplate(user.name, resetHref)
    }

    // Enviar el correo y responder al frontend
    const sendResponse = await sendGrid.send(mailContent);

    req.resetUserEmail = email;

    res.json({
      status: "success",
      data: {sendResponse, token}
    })
    
  } catch (error) {
    console.log(`Error sending reset password email: ${error.message}`);
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
});


// Verificar el token de reseteo
router.get("/", async (req, res) => {
  try {
    const {token} = req.query;

    // Verificar el token
    const verifiedResult = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      status: "success",
      data: verifiedResult
    })
    
  } catch (error) {
    console.log(`Error verifying reset password token: ${error.message}`);
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
});


// Generar la nueva contraseña
router.post("/create-password", [
  check("newPassword", "The new password is required").exists(),
  check("newPassword", "The password must be min. 6 characters and max. 30 characters").isLength({min: 6, max: 30})
], async (req, res) => {
  try {
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

    const {newPassword} = req.body;
    const {token} = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({email: decoded.userEmail});

    // Verifica si el usuario existe
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      })
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(12);
    const encrypted = await bcrypt.hash(newPassword, salt);

    // Actualizar la nueva contraseña en el usuario
    user.password = encrypted;
    await user.save();
    user.password = undefined;

    res.json({
      status: "success",
      data: {updatedUserPassword: user}
    })
    
  } catch (error) {
    console.log(`Error reseting your password: ${error.message}`);
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
})


module.exports = router;