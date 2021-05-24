const express = require("express");
const router = express.Router();
const {validationResult, check} = require("express-validator");
const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const User = require("../models/UserModel");
const Profile = require("../models/ProfileModel");
const Post = require("../models/PostModel");
const Follower = require("../models/FollowerModel");
const authMiddleware = require("../middleware/authMiddleware");

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
    .populate({
      path: "user",
      select: "_id name username email avatar role"
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
      data: "Password updated successfully, login again with your new password"
    });

  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
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
    const user = await User.findOne({username});
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


/*----------------------------------*/
// Consultar los posts de un usuario
/*----------------------------------*/
router.get("/:username/posts", authMiddleware, async (req, res) => {
  try {
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
    .sort({createdAt: "desc"})
    .populate({
      path: "user",
      select: "_id name username email avatar role"
    })
    .populate({
      path: "comments.user",
      select: "_id name username avatar role"
    })

    res.json({
      status: "success",
      data: {results: userPosts.length, userPosts}
    })
    
  } catch (error) {
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
      select: "_id name username email avatar role"
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
      select: "_id name username email avatar role"
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
    }

    followerUser.followers = undefined;

    res.json({
      status: "success",
      data: followerUser
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
    const user = await User.findById(req.userId);
    
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      });
    }

    // Actualizar el campo newMessagePopup
    let currentSetting = user.newMessagePopup || false;
    user.newMessagePopup = !currentSetting;
    await user.save();

    user.password = undefined;

    res.json({
      status: "success",
      data: user
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
})


module.exports = router;