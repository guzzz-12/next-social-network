const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {check, validationResult} = require("express-validator");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
const sendGrid = require("@sendgrid/mail");

const User = require("../models/UserModel");
const Profile = require("../models/ProfileModel");
const Follower = require("../models/FollowerModel");
const authMiddleware = require("../middleware/authMiddleware");
const emailConfirmationTemplate = require("../emailTemplates/emailConfirmTemplate");

const regexUserName = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;


/*--------------------------------------------------*/
// Ruta para verificar si el username está disponible
/*--------------------------------------------------*/
router.get("/:username", async (req, res) => {
  try {
    const {username} = req.params;

    console.log({username});

    // Chequear si se especificó el username como parámetro en la url
    if(!username) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid username url param"
      })
    }

    // Validar el formato del username
    if(!regexUserName.test(username)) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid username format"
      })
    }

    // Chequear si ya existe el usuario asociado al username especificado
    const userExists = await User.findOne({username});
    if(userExists) {
      return res.status(401).json({
        status: "failed",
        message: "Username already in use"
      });
    }

    // Retornar respuesta especificando que el username está disponible
    res.json({
      status: "success",
      data: "Username available"
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
});


/*-------------------------------------*/
// Ruta para registrar el nuevo usuario
/*-------------------------------------*/
router.post("/", [
  check("name", "The name must be at least 3 characters and max 20 characters").isLength({min: 4, max: 30}),
  check("name", "The name is required").exists(),
  check("username", "The username is required").exists(),
  check("email", "Invalid email address").isEmail(),
  check("email", "The email is required").exists(),
  check("password", "The password must be at least 6 characters and max 30 characters").isLength({min: 6, max: 30}),
  check("password", "The password is required").exists(),
  check("bio", "The bio must be at least 10 characters and max 300 characters").isLength({min: 10, max: 300}),
  check("bio", "The bio is required").exists()
], async (req, res) => {

  /*--------------------------------*/
  // Chequear errores de validación
  /*--------------------------------*/
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
    const {name, username, email, password, bio, facebook, twitter, instagram, youtube} = req.body;

    // Chequar si ya existe un usuario asociado al email o al username
    const userExists = await User.findOne({$or: [{email}, {username}]});
    if(userExists) {
      return res.status(401).json({
        status: "failed",
        message: "Email or username already in use"
      })
    }

    // Encriptar la contraseña del usuario
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generar el nuevo usuario
    const verificationCode = Math.floor(1000000 + Math.random() * 900000);
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      verificationCode: verificationCode.toString()
    });

    // Opciones del correo a enviar
    const mailContent = {
      to: email,
      from: {
        name: "Social Network App",
        email: process.env.SENDGRID_FROM
      },
      subject: "Confirm account creation",
      html: emailConfirmationTemplate(name, verificationCode)
    }

    // Enviar el correo con el código de verificación
    await sendGrid.send(mailContent);

    // Generar el perfil del nuevo usuario
    const profileSocialLinks = {};
    if(facebook) profileSocialLinks.facebook = facebook;
    if(twitter) profileSocialLinks.twitter = twitter;
    if(instagram) profileSocialLinks.instagram = instagram;
    if(youtube) profileSocialLinks.youtube = youtube;

    const newUserProfile = new Profile({
      user: newUser._id,
      bio,
      social: profileSocialLinks
    })

    // Guardar el perfil en la base de datos
    await newUserProfile.save();

    // Inicializar la colección de seguidores y seguidos
    await Follower.create({user: newUser._id});

    // Generar el token de autenticación y setear el cookie
    const token = jwt.sign({userId: newUser._id, userRole: newUser.role}, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });
    res.cookie("token", token, {maxAge: 24*3600*1000});
    
    newUser.password = undefined;
    newUser.verificationCode = undefined;

    res.json({
      status: "success",
      data: {
        profile: {...newUserProfile, user: newUser}
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
});


/*-------------------------------------------------------*/
// Ruta para verificar el código de confirmación de email
/*-------------------------------------------------------*/
router.post("/email-verification", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      })
    }

    // Verificar si el código es correcto
    const requestedCode = req.body.code;
    const verificationCode = user.verificationCode;
    
    if(requestedCode !== verificationCode) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid verification code."
      })
    }

    // Cambiar el status del usuario a verificado en la DB
    user.verificationCode = "";
    user.isVerified = true;
    await user.save();

    user.verificationCode = undefined;
    
    res.json({
      status: "success",
      data: user
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
});


/*-----------------------------------------------------------*/
// Ruta para generar un nuevo código de verificación de email
/*-----------------------------------------------------------*/
router.get("/email-verification/new-code", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found"
      })
    }

    // Generar el nuevo código
    const verificationCode = Math.floor(1000000 + Math.random() * 900000);

    // Opciones del correo a enviar
    const mailContent = {
      to: user.email,
      from: {
        name: "Social Network App",
        email: process.env.SENDGRID_FROM
      },
      subject: "Confirm your email",
      html: emailConfirmationTemplate(user.name, verificationCode)
    }

    // Enviar el correo con el código de verificación
    await sendGrid.send(mailContent);

    // Actualizar el código en la DB
    user.verificationCode = verificationCode.toString();
    await user.save();

    res.json({
      status: "success",
      data: "Verification code sent successfully"
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
});


/*-------------------------------------------*/
// Ruta para actualizar el avatar del usuario
/*-------------------------------------------*/
router.patch(`/update-avatar/:userId`, (req, res) => {
  // Chequear si se envió el token en los cookies
  const {token} = req.cookies;
  if(!token) {
    return res.status(401).json({
      status: "failed",
      message: "You must be logged in to perform this task"
    })
  }

  const form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if(err) {
      await User.findByIdAndDelete(req.params.userId);
      await Profile.findOneAndDelete({user: req.params.userId});
      return res.status(500).json({
        status: "failed",
        message: `Error processing the request: ${error.message}`
      })
    }

    // Requerir la imagen
    if(!files.avatar) {
      await User.findByIdAndDelete(req.params.userId);
      await Profile.findOneAndDelete({user: req.params.userId});
      return res.status(400).json({
        status: "failed",
        message: "The image is required."
      })
    }

    // Validar el formato de la imagen
    if(!files.avatar.type.includes("jpg") && !files.avatar.type.includes("jpeg") && !files.avatar.type.includes("png")) {
      await User.findByIdAndDelete(req.params.userId);
      await Profile.findOneAndDelete({user: req.params.userId});
      return res.status(400).json({
        status: "failed",
        message: "The image must be .jpg, .jpeg or .png."
      })
    }

    // Validar el tamaño de la imagen
    if(files.avatar.size > 4000000) {
      await User.findByIdAndDelete(req.params.userId);
      await Profile.findOneAndDelete({user: req.params.userId});
      return res.status(400).json({
        status: "failed",
        message: "The image size cannot be larger than 4mb"
      })
    }

    try {
      // Extraer el id del usuario
      const decodedAndVerifiedToken = jwt.verify(token, process.env.JWT_SECRET);
      const {userId} = decodedAndVerifiedToken;

      // Buscar la data del usuario correspondiente al id del token
      const user = await User.findById(userId);

      // Verificar si el usuario existe en la base de datos
      if(!user) {
        return res.status(404).json({
          status: "failed",
          message: `User ${user.username} not found or deleted`
        })
      }

      // Subir la imagen a Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(files.avatar.path, {folder: `chat-app/user-avatar/${user.username}`});

      // console.log({uploadResponse});

      // Actualizar el avatar y el avatarId del usuario en la base de datos
      user.avatar = uploadResponse.url;
      user.avatarId = uploadResponse.public_id;
      const updatedUser = await user.save();

      updatedUser.password = undefined;

      res.json({
        status: "success",
        data: updatedUser
      })
      
    } catch (error) {
      // Borrar el usuario de la base de datos si hay error al subir el avatar
      // De esta forma se debe repetir el proceso de signup evitando la necesidad
      // de crear una funcionalidad específica para actualizar el avatar posteriormente
      await User.findByIdAndDelete(req.params.userId);
      await Profile.findOneAndDelete({user: req.params.userId});

      res.status(500).json({
        status: "failed",
        message: error.message
      })
    }
  })
})

module.exports = router;