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
})


module.exports = router;