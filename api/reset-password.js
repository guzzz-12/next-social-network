const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const {check, validationResult} = require("express-validator");
const User = require("../models/UserModel");

// Inicializar el transport de nodemailer para enviar el email
const transport = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: process.env.SENDGRID_SECRET
  }
}));

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
        message: "User not found"
      })
    }

    // Generar el token de verificación
    const token = jwt.sign({userEmail: email}, process.env.JWT_SECRET, {expiresIn: 900});
    const resetHref = `${process.env.BASE_URL}/reset-password?token=${token}`

    // Opciones del correo a enviar
    const mailOptions = {
      to: email,
      from: process.env.SENDGRID_FROM,
      subject: "Reset your password",
      // text: "",
      html: `
        <p>Hello ${user.name.toString()}, click on <a href=${resetHref}>this link</a> to reset your password.</p>
        <p>This link will expire in 15 minutes.</p>
        <p>You can ignore this email if this is a mistake.</p>
      `
    }

    // Enviar el correo y responder al frontend
    const sendResponse = await transport.sendMail(mailOptions);

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
  check("password", "The current password is required").exists(),
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

    const {password, newPassword} = req.body;
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

    // Verificar la contraseña actual del usuario
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if(!isPasswordCorrect) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid password"
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