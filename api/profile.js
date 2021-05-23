const express = require("express");
const router = express.Router();
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
      select: "_id name username avatar role"
    });

    // Chequear los followers y following
    const followersAndFollowing = await Follower.findOne({user: req.userId});

    return res.json({
      status: "success",
      data: {
        profile,
        followers: followersAndFollowing.followers.length,
        following: followersAndFollowing.following.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


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
      select: "_id name username avatar role"
    });

    // Chequear los followers y following
    const followersAndFollowing = await Follower.findOne({user: req.userId});

    return res.json({
      status: "success",
      data: {
        profile,
        followers: followersAndFollowing.followers.length,
        following: followersAndFollowing.following.length
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
      select: "_id name username avatar role"
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
      select: "_id name username avatar role"
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
      select: "_id name username avatar role"
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


module.exports = router;