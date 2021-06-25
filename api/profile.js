const express = require("express");
const router = express.Router();
const {validationResult, check} = require("express-validator");
const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendgrid = require("@sendgrid/mail");
const User = require("../models/UserModel");
const Profile = require("../models/ProfileModel");
const Post = require("../models/PostModel");
const Follower = require("../models/FollowerModel");
const Like = require("../models/LikeModel");
const Comment = require("../models/CommentModel");
const Notification = require("../models/NotificationModel.js");
const Message = require("../models/MessageModel");
const authMiddleware = require("../middleware/authMiddleware");
const {newFollowerNotification, removeNotification} = require("../utilsServer/notificationActions");
const changeEmailTemplate = require("../emailTemplates/changeEmailTemplate");

/*---------------------------------------*/
// Consultar el perfil del usuario actual
/*---------------------------------------*/
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Chequear si el usuario existe en la base de datos
    const user = await User.findById(userId);
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      });
    }
    
    // Consultar el perfil del usuario
    const profile = await Profile.findOne({user: user._id})
    .lean()
    .populate({
      path: "user",
      select: "-password -__v"
    });

    // Chequear los followers y following
    const followersAndFollowing = await Follower.findOne({user: req.userId});

    return res.json({
      status: "success",
      data: {
        profile,
        followers: followersAndFollowing.followers,
        following: followersAndFollowing.following
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*---------------------------*/
// Eliminar cuenta de usuario
/*---------------------------*/
router.delete("/me", authMiddleware, async (req, res) => {
  try {
    const {userId} = req;
    const {password} = req.body;

    if(!password || password.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "The password is required"
      })
    }

    // Buscar la data del usuario y verificar si existe
    const user = await User.findById(userId);

    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or already deleted"
      })
    }

    // Verificar si la contraseña es correcta
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if(!isPasswordCorrect) {
      return res.status(401).json({
        status: "failed",
        message: "Wrong password"
      })
    }

    // Buscar y borrar todos sus posts, comentarios, likes y notificaciones
    const posts = await Post.deleteMany({user: userId});
    const comments = await Comment.deleteMany({author: userId});
    const likes = await Like.deleteMany({author: userId});
    const notifications = await Notification.deleteMany({userNotifier: userId});

    // Buscar todos los mensajes donde el usuario sea sender y cambiar el status del sender a inactive
    await Message.updateMany({sender: userId}, {senderStatus: "deleted"});

    // Eliminar el avatar del usuario (si lo tiene)
    if(user.avatarId) {
      await cloudinary.uploader.destroy(user.avatarId, {invalidate: true});
    }

    // Desactivar el usuario el usuario y eliminar el perfil
    user.status = "deleted";
    user.name = "Deleted user";
    user.username = `DeletedUser-${user._id}`;
    user.email = `deleted-${user._id}`;
    user.avatar = "https://res.cloudinary.com/dzytlqnoi/image/upload/v1615203395/default-user-img_t3xpfj.jpg";
    user.avatarId = "";
    await user.save();
    await Profile.findOneAndDelete({user: userId});

    res.json({
      status: "success",
      data: {
        deletedUser: user,
        deletedPosts: posts.deletedCount,
        deletedComments: comments.deletedCount,
        deletedLikes: likes.deletedCount,
        deletedNotifications: notifications.deletedCount
      }
    })
    
  } catch (error) {
    console.log(`Error deleting user account: ${error.message}`);
    res.status(500).json({
      status: "failed",
      message: `Error deleting user account: ${error.message}`
    })
  }
});


//*------------------------------------*/
// Actualizar perfil del usuario actual
/*-------------------------------------*/
router.patch("/me", authMiddleware, [
  check("bio", "The bio is required").exists(),
  check("bio", "The bio must be at least 10 characters and max 300 characters").isLength({min: 10, max: 300})
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
    const {bio, facebook, twitter, instagram, youtube} = req.body;

    // Buscar el pefil a actualizar y chequear si existe
    const userProfile = await Profile.findOne({user: req.userId});
    
    if(!userProfile) {
      return res.status(404).json({
        status: "failed",
        message: "User profile not found or deleted"
      })
    }

    // Actualizar el perfil del nuevo usuario
    const profileSocialLinks = {};
    if(facebook) profileSocialLinks.facebook = facebook;
    if(twitter) profileSocialLinks.twitter = twitter;
    if(instagram) profileSocialLinks.instagram = instagram;
    if(youtube) profileSocialLinks.youtube = youtube;

    userProfile.bio = bio;
    userProfile.social = profileSocialLinks;
    await userProfile.save();

    res.json({
      status: "success",
      data: userProfile
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*--------------------------------------------*/
// Actualizar la imagen del perfil del usuario
/*--------------------------------------------*/
router.patch("/me/avatar", authMiddleware, (req, res) => {
  const form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    try {
      if(err) {
        return res.status(400).json({
          status: "failed",
          message: `Error processing the request: ${err.message}`
        })
      }

      // Requerir la imagen
      if(!files.avatar) {
        return res.status(400).json({
          status: "failed",
          message: "The image is required."
        })
      }

      // Validar el formato de la imagen
      if(!files.avatar.type.includes("jpg") && !files.avatar.type.includes("jpeg") && !files.avatar.type.includes("png")) {
        return res.status(400).json({
          status: "failed",
          message: "The image must be either .jpg, .jpeg or .png."
        })
      }

      // Validar el tamaño de la imagen
      if(files.avatar.size > 4000000) {
        return res.status(400).json({
          status: "failed",
          message: "The image size cannot be larger than 4mb"
        })
      }

      // Buscar el usuario correspondiente
      const user = await User.findById(req.userId);
      if(!user) {
        return res.status(404).json({
          status: "failed",
          message: "User not found or deleted"
        })
      }

      // Borrar la imagen actual del usuario de cloudinary (si la tiene)
      const avatarId = user.avatarId;
      avatarId && await cloudinary.uploader.destroy(avatarId, {invalidate: true});

      // Subir la nueva imagen del perfil a cloudinary
      const uploadResponse = await cloudinary.uploader.upload(files.avatar.path, {folder: `chat-app/user-avatar/${user.username}`});
      
      // Actualizar el avatar del usuario en la base de datos
      user.avatar = uploadResponse.url;
      user.avatarId = uploadResponse.public_id;
      const updatedUser = await user.save();

      res.json({
        status: "success",
        data: {
          newAvatar: updatedUser.avatar
        }
      })
      
    } catch (error) {
      res.status(500).json({
        status: "failed",
        message: `Internal server error: ${error.message}`
      })
    }
  })
});


/*---------------------------------------*/
// Actualizar la contraseña de un usuario
/*---------------------------------------*/
router.patch("/me/update-password", authMiddleware, [
  check("currentPassword", "The current password is required").exists(),
  check("newPassword", "The new password is required and must contain between 6 and 30 characters").isLength({min: 6, max: 30})
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
    const {currentPassword, newPassword} = req.body;

    // Buscar el usuario y chequear si existe
    const user = await User.findById(req.userId);
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      })
    }

    // Chequear si la contraseña actual es correcta
    const isCorrectPassword = await bcrypt.compare(currentPassword, user.password);
    if(!isCorrectPassword) {
      return res.status(401).json({
        status: "failed",
        message: "Wrong password"
      })
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(12);
    const updatedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña en la base de datos
    user.password = updatedPassword;
    await user.save();

    // Destruir el cookie de la sesión actual y redirigir a login
    res.cookie("token", null, {maxAge: 0});

    res.json({
      status: "success",
      data: {
        message: "Password updated successfully. Please, login again with your new password"
      }
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*-----------------------------------------------------------*/
// Enviar email de cambio de dirección de email de un usuario
/*-----------------------------------------------------------*/
router.patch("/me/update-email", authMiddleware, [
  check("newEmail", "Invalid email address").isEmail(),
  check("newEmail", "The email is required").exists(),
  check("password", "The password is required").exists()
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
    const {newEmail, password} = req.body;

    console.log({newEmail})

    // Verificar si el email está disponible
    const userExists = await User.exists({email: newEmail});
    if(userExists) {
      return res.status(400).json({
        status: "failed",
        message: "Email already used by another account"
      })
    }

    // Buscar el usuario actual
    const user = await User.findById(req.userId);

    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      })
    }

    // Verificar la contraseña
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if(!isPasswordCorrect) {
      return res.status(401).json({
        status: "failed",
        message: "Wrong password"
      })
    }

    // Generar el token y la url
    const token = jwt.sign({userId: user._id, newEmail}, process.env.JWT_SECRET, {expiresIn: 900});
    const resetHref = `${process.env.BASE_URL}/email-confirmation?token=${token}`;

    // Opciones del correo a enviar
    const mailContent = {
      to: newEmail,
      from: {
        name: "Social Network App",
        email: process.env.SENDGRID_FROM
      },
      subject: "Email address update",
      html: changeEmailTemplate(user.name, resetHref)
    }

    // Enviar el correo y responder al frontend
    const sendResponse = await sendgrid.send(mailContent);

    res.json({
      status: "success",
      data: {sendResponse}
    })
    
  } catch (error) {
    console.log(`Error updating user email: ${error.message}`);

    res.status(500).json({
      status: "failed",
      message: `Error updating user email: ${error.message}`
    })
  }
});


/*--------------------------------------------------------*/
// Confirmar el cambio de dirección de email de un usuario
/*--------------------------------------------------------*/
router.get("/me/confirmation-email", authMiddleware, async (req, res) => {
  try {
    const {token} = req.query;
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const {userId, newEmail} = decoded;

    // Buscar el usuario correspondiente
    const user = await User.findById(userId);

    // Actualizar el email del usuario
    user.email = newEmail;
    await user.save();

    res.json({
      status: "success",
      data: user
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error verifying confirmation token: ${error.message}`
    })
  }
})


/*-----------------------------------*/
// Consultar el perfil del un usuario
/*-----------------------------------*/
router.get("/user/:username", authMiddleware, async (req, res) => {
  try {
    const {username} = req.params;

    // Chequear si el usuario existe en la base de datos
    const user = await User.findOne({username, isVerified: true});
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      });
    }
    
    // Consultar el perfil del usuario
    const profile = await Profile.findOne({user: user._id})
    .populate({
      path: "user",
      select: "_id name username email avatar role"
    });

    // Chequear los followers y following
    const followersAndFollowing = await Follower.findOne({user: user._id});

    return res.json({
      status: "success",
      data: {
        profile,
        followers: followersAndFollowing.followers,
        following: followersAndFollowing.following
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*----------------------------------*/
// Consultar los posts de un usuario
/*----------------------------------*/
router.get("/:username/posts", authMiddleware, async (req, res) => {
  try {
    const page = +req.query.page;
    const amount = 2;
    const {username} = req.params;

    // Chequear si el usuario existe
    const user = await User.findOne({username});
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      });
    }

    // Buscar los posts del usuario
    const userPosts = await Post.find({user: user._id})
    .lean()
    .limit(amount)
    .skip(amount * (page - 1))
    .sort({createdAt: "desc"})
    .populate({
      path: "user",
      select: "_id name username email avatar role"
    })
    .populate({
      path: "comments.user",
      select: "_id name username avatar role"
    });

    // Extraer las ids de los posts
    const postsIds = [];
    for(let post of userPosts) {
      postsIds.push(post._id.toString());
    }

    // Consultar los likes de cada post
    const allLikes = await Like
    .find({post: {$in: postsIds}})
    .lean()
    .populate({
      path: "author",
      select: "author._id"
    });

    // Combinar cada post con sus likes correspondientes
    const postsAndLikes = [];
    for(let post of userPosts) {
      const element = {
        ...post,
        likes: allLikes.filter(el => el.post.toString() === post._id.toString())
      }
      postsAndLikes.push(element)
    }

    // Verificar si es la última página de documentos
    let isLastPage = userPosts.length < amount;

    res.json({
      status: "success",
      data: {
        results: userPosts.length,
        userPosts: postsAndLikes,
        isLastPage
      }
    })
    
  } catch (error) {
    console.log(`Error fetching user posts: ${error.message}`)

    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*---------------------------------------*/
// Consultar los seguidores de un usuario
/*---------------------------------------*/
router.get("/followers/:username", authMiddleware, async (req, res) => {
  try {
    const {username} = req.params;

    // Chequear si el usuario existe
    const user = await User.findOne({username});
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      })
    }

    // Extraer la data de los followers y following del usuario
    const userFollowers = await Follower.findOne({user: user._id})
    .populate({
      path: "followers.user",
      select: "_id name username email avatar role status"
    });

    userFollowers.following = undefined;

    res.json({
      status: "success",
      data: userFollowers
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*-------------------------------------*/
// Consultar los seguidos de un usuario
/*-------------------------------------*/
router.get("/following/:username", authMiddleware, async (req, res) => {
  try {
    const {username} = req.params;

    // Chequear si el usuario existe
    const user = await User.findOne({username});
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      })
    }

    // Extraer la data de los followers y following del usuario
    const userFollowing = await Follower.findOne({user: user._id})
    .populate({
      path: "following.user",
      select: "_id name username email avatar role status"
    });

    userFollowing.followers = undefined;

    res.json({
      status: "success",
      data: userFollowing
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*------------------------------------*/
// Seguir/dejar de seguir a un usuario
/*------------------------------------*/
router.get("/follow/:username", authMiddleware, async (req, res) => {
  try {
    // Usuario al que se le va a dar follow/unfollow
    const {username} = req.params;

    // Usuario que da el follow/unfollow
    const currentUser = req.userId;

    // Usuario seguido
    const user = await User.findOne({username});
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "Followed user not found or deleted"
      })
    }

    // Prevenir que el usuario se siga a sí mismo
    if(user._id.toString() === currentUser.toString()) {
      return res.status(400).json({
        status: "failed",
        "message": "Users cannot follow themselves"
      })
    }

    const followedUser = await Follower.findOne({user: user._id.toString()});
    const followerUser = await Follower.findOne({user: currentUser});

    if(!followerUser) {
      return res.status(404).json({
        status: "failed",
        message: "Current user not found or deleted"
      })
    }

    // SI NO LO SIGUE, HACER FOLLOW:
    // Agregar la id del usuario seguidor al documento seguidores del usuario seguido
    // Agregar la id del usuario seguido al documento siguiendo del usuario seguidor
    /*-------------------------------------------------------------------------------*/
    /*-------------------------------------------------------------------------------*/
    // SI YA LO SIGUE, HACER UNFOLLOW:
    // Remover la id del usuario seguidor del documento seguidores del usuario seguido
    // Remover la id del usuario seguido del documento siguiendo del usuario seguidor

    // Chequear si es follower
    const followedUserFollowers = [...followedUser.followers];
    const followerIndex = followedUserFollowers.findIndex(el => el.user.toString() === currentUser.toString());

    let actionType = "unset";

    // Si es seguidor, dar unfollow
    if(followerIndex !== -1) {
      // Actualizar los seguidores del usuario seguido
      followedUserFollowers.splice(followerIndex, 1);
      followedUser.followers = followedUserFollowers;

      // Actualizar los seguidos del usuario seguidor
      const followerUserFollowing = followerUser.following.filter(el => el.user.toString() !== user._id.toString());
      followerUser.following = followerUserFollowing;

      // Actualizar ambos docs en la base de datos
      await followedUser.save();
      await followerUser.save();
      actionType = "unfollow";

      // Eliminar la notificación de nuevo seguidor
      await removeNotification("follower", user._id, null, null, req.userId);

    // Si no es seguidor, dar follow
    } else {
      // Actualizar los seguidores del usuario seguido
      followedUserFollowers.push({user: currentUser});
      followedUser.followers = followedUserFollowers;

      // Actualizar los seguidos del usuario seguidor
      const followerUserFollowing = [...followerUser.following, {user: user._id}];
      followerUser.following = followerUserFollowing;

      // Actualizar ambos docs en la base de datos
      await followedUser.save();
      await followerUser.save();
      actionType = "follow";

      // Generar notificación de nuevo seguidor
      await newFollowerNotification(req.userId, user._id);
    }

    res.json({
      status: "success",
      data: {
        actionType,
        _id: user._id,
        seguidor: req.userId,
        siguiendo: user._id
      }
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*-------------------------------------------------*/
// Habilitar/deshabilitar el popup de nuevo mensaje
/*-------------------------------------------------*/
router.patch("/settings/message-popup", authMiddleware, async (req, res) => {
  try {
    const {msgPopupSetting} = req.body;
    const user = await User.findById(req.userId);
    
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      });
    }

    // Actualizar el campo newMessagePopup
    user.newMessagePopup = msgPopupSetting;
    await user.save();

    user.password = undefined;

    res.json({
      status: "success",
      data: {newMessagePopup: msgPopupSetting}
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
})


module.exports = router;