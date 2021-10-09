const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
const Post = require("../models/PostModel");
const User = require("../models/UserModel");
const Follower = require("../models/FollowerModel");
const Like = require("../models/LikeModel");
const Comment = require("../models/CommentModel");
const Notification = require("../models/NotificationModel");
const authMiddleware = require("../middleware/authMiddleware");

/*--------------*/
// Crear un post
/*--------------*/
router.post("/", authMiddleware, async (req, res) => {
  // Validar el contenido del post
  if(req.body.content.length === 0) {
    return res.status(400).json({
      status: "failed",
      message: "The post cannot be empty"
    })
  }

  try {
    const {content, location} = req.body;
    const userId = req.userId;
    const user = await User.findById(req.userId).select("_id name username avatar");
    const post = new Post({user: userId, content, location});
    await post.save();
    post.user = user;

    res.json({
      status: "success",
      data: post
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*---------------------------*/
// Agregar la imagen del post
/*---------------------------*/
router.patch("/:postId", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Chequear si el post existe
    const post = await Post.findById(req.params.postId).populate("user", "-password")
    if(!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found or deleted from the database"
      })
    }

    // Chequear si el post pertenece al usuario que intenta modificarlo
    const isOwner = userId === post.user.id;
    if(!isOwner) {
      return res.status(403).json({
        status: "failed",
        message: "Only admin users can modify other users' posts"
      })
    }

    // Chequear si el usuario existe
    const user = await User.findById(userId);
    if(!user) {
      return res.status(404).json({
        status: "failed",
        message: "User not found or deleted"
      })
    }

    const form = new formidable.IncomingForm();
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      try {
        if(err) {
          return res.status(500).json({
            status: "failed",
            message: `Internal server error: ${err.message}`
          })
        }

        // Requerir la imagen
        if(!files.postImage) {
          return res.status(400).json({
            status: "failed",
            message: "The image is required."
          })
        }

        // Validar el formato de la imagen
        if(!files.postImage.type.includes("jpg") && !files.postImage.type.includes("jpeg") && !files.postImage.type.includes("png")) {
          return res.status(400).json({
            status: "failed",
            message: "The image must be one of the following formats: .jpg, .jpeg or .png."
          })
        }

        // Validar el tamaño de la imagen
        if(files.postImage.size > 6000000) {
          return res.status(400).json({
            status: "failed",
            message: "The image size cannot be larger than 6mb"
          })
        }

        // Eliminar la imagen anterior del posts
        post.picPublicId && await cloudinary.uploader.destroy(post.picPublicId, {invalidate: true});

        // Subir la imagen a Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(files.postImage.path, {folder: `chat-app/posts/${user.username}`});

        // Actualizar la data del post
        post.picUrl = uploadResponse.url;
        post.picPublicId = uploadResponse.public_id;
        await post.save();
        post.user.newMessagePopup = undefined;
        post.user.unreadMessage = undefined;
        post.user.unreadNotification = undefined;

        res.json({
          status: "success",
          data: post
        });
        
      } catch (error) {
        res.status(500).json({
          status: "failed",
          message: `Internal server error: ${error.message}`
        })
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*-----------------------------------------------------------------*/
// Consultar todos los posts del usuario y de sus usuarios seguidos
/*-----------------------------------------------------------------*/
router.get("/", authMiddleware, async (req, res) => {
  const page = +req.query.page;
  const amount = 3;

  try {
    // Buscar los usuarios seguidos por el usuario
    const followingData = await Follower.findOne({user: req.userId});
    const followingUsers = followingData.following.map(el => el.user);

    // Consultar los posts
    const posts = await Post.find({user: {$in: [req.userId, ...followingUsers]}})
    .lean()
    .limit(amount)
    .skip(amount * (page - 1))
    .sort({createdAt: "desc"})
    .populate("user", "_id avatar name username role email");

    // Extraer las ids de los posts
    const postsIds = [];
    for(let post of posts) {
      postsIds.push(post._id.toString());
    }

    // Consultar los likes de cada post
    const allLikes = await Like
    .find({post: {$in: postsIds}})
    .lean()
    .populate({
      path: "author",
      select: "_id"
    });

    // Combinar cada post con sus likes correspondientes
    const postsAndLikes = [];
    for(let post of posts) {
      const element = {
        ...post,
        likes: allLikes.filter(el => el.post.toString() === post._id.toString())
      }
      postsAndLikes.push(element)
    }

    // Verificar si es la última página de documentos
    let isLastPage = posts.length < amount;

    res.json({
      status: "success",
      data: {posts: postsAndLikes, isLastPage}
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*------------------*/
// Consultar un post
/*------------------*/
router.get("/:postId", authMiddleware, async (req, res) => {
  try {
    // Buscar el post
    const post = await Post.findById(req.params.postId)
    .lean()
    .populate({
      path: "user",
      select: "_id name username email avatar"
    })
    .populate({
      path: "comments.user",
      select: "_id name username avatar role"
    });

    // Chequear si el post existe
    if(!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found or deleted"
      })
    }

    // Consultar los likes del post
    const likes = await Like
    .find({post: post._id})
    .lean()
    .populate({
      path: "author",
      select: "_id"
    })

    res.json({
      status: "success",
      data: {...post, likes}
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*----------------------------------------*/
// Borrar un post (admin y autor del post)
/*----------------------------------------*/
router.delete("/:postId", authMiddleware, async (req, res) => {
  try {
    // Buscar el post a eliminar
    const post = await Post.findById(req.params.postId).populate("user", "_id name username avatar email role");

    // Chequear si el post existe
    if(!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found or deleted"
      })
    }

    // Chequear si el usuario es admin o el autor del post
    const isOwner = req.userId.toString() === post.user.id.toString();

    if((req.userRole !== "admin") && !isOwner) {
      return res.status(403).json({
        status: "failed",
        message: "You're not allowed to perform this task"
      })
    }

    // Eliminar todos los comentarios, likes y notificaciones asociados al post
    const deletedComments = await Comment.deleteMany({commentedPost: post._id});
    const deletedLikes = await Like.deleteMany({post: post._id});
    const deletedNotifications = await Notification.deleteMany({post: post._id});

    console.log({
      deletedComments: deletedComments.deletedCount,
      deletedLikes: deletedLikes.deletedCount,
      deletedNotifications: deletedNotifications.deletedCount
    });

    // Borrar la imagen del post de cloudinary (si la tiene)
    const postImageId = post.picPublicId;
    postImageId && await cloudinary.uploader.destroy(postImageId, {invalidate: true});

    // Borrar el post de la base de datos
    await post.delete();

    res.json({
      status: "success",
      data: `Post ${post._id} deleted successfully`
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*---------------------------------*/
// Dejar de seguir / seguir un post
/*---------------------------------*/
router.put("/togglesubscription/:postId", authMiddleware, async (req, res) => {
  try {
    const {postId} = req.params;
    const {operationType} = req.query;
    const {userId} = req;

    if(operationType === "unsubscribe") {
      await Post.findOneAndUpdate({_id: postId}, {$pull: {followedBy: userId}});
      await User.findOneAndUpdate({_id: req.userId}, {$pull: {postsSubscribed: postId}});

    } else {
      await Post.findOneAndUpdate({_id: postId}, {$push: {followedBy: userId}});
      await User.findOneAndUpdate({_id: req.userId}, {$push: {postsSubscribed: postId}});    
    }

    return res.json({
      status: "success",
      data: `${operationType}d`
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
})

module.exports = router;