const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
const mongoose = require("mongoose");
const Post = require("../models/PostModel");
const User = require("../models/UserModel");
const Follower = require("../models/FollowerModel");
const {newLikeNotification, newCommentNotification, removeNotification} = require("../utilsServer/notificationActions");
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
  const amount = 2;

  try {
    // Buscar los usuarios seguidos por el usuario
    const followingData = await Follower.findOne({user: req.userId});
    const followingUsers = followingData.following.map(el => el.user);

    const posts = await Post.find({user: {$in: [req.userId, ...followingUsers]}})
    .limit(amount)
    .skip(amount * (page - 1))
    .sort({createdAt: "desc"})
    .populate("user", "_id avatar name username role email")
    .populate({
      path: "comments.user",
      select: "_id name username avatar"
    });

    res.json({
      status: "success",
      data: posts
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
    .populate("user", "_id name username email")
    .populate({
      path: "likes.user",
      select: "_id name username avatar"
    })
    .populate({
      path: "comments.user",
      select: "_id name username avatar"
    });

    // Chequear si el post existe
    if(!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found or deleted"
      })
    }

    res.json({
      status: "success",
      data: post
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
    const user = await User.findById(req.userId);
    const isAdmin = user.role === "admin";
    const isOwner = user.id === post.user.id;

    if(!isAdmin && !isOwner) {
      return res.status(403).json({
        status: "failed",
        message: "You're not allowed to perform this task"
      })
    }

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


/*---------------------------------------*/
// Procesar los likes/dislikes de un post
/*---------------------------------------*/
router.post("/likes/:postId", authMiddleware, async (req, res) => {
  try {
    // Buscar el post
    const post = await Post.findById(req.params.postId);

    // Chequear si el post existe
    if(!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found or deleted"
      })
    }

    // Chequear si ya el usuario le dio like al post y removerlo o crearlo, dependiendo del caso
    const updatedLikes = [...post.likes];
    const likeIndex = updatedLikes.findIndex(like => like.user.toString() === req.userId.toString());

    if(likeIndex !== -1) {
      // Remover el like de los likes en el post
      updatedLikes.splice(likeIndex, 1);
      // Remover la notificación de like del doc de notificaciones del autor de post
      await removeNotification("like", post.user, post._id, req.userId);

    } else {
      // Agregar el like a los likes del post
      updatedLikes.push({user: req.userId});
      // Agregar la notificación al doc de notificaciones del autor del post
      // sólo si el autor del like no es el autor del post
      if(req.userId.toString() !== post.user.toString()) {
        await newLikeNotification(req.userId, post._id, post.user);
      }
    }

    // Actualizar los likes en la data del post
    post.likes = updatedLikes;
    await post.save();

    res.json({
      status: "success",
      data: {likes: post.likes}
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*-------------------------------*/
// Consultar los likes de un post
/*-------------------------------*/
router.get("/likes/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
    .populate({
      path: "likes.user",
      select: "_id name username avatar"
    });

    if(!post){
      return res.status(404).json({
        status: "failed",
        message: "Post not found or deleted"
      })
    }
    
    res.json({
      status: "success",
      data: {
        likes: post.likes,
        likesCount: post.likes.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*-------------------------------*/
// Agregar comentarios a un post
/*-------------------------------*/
router.post("/comments/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
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
    
    const {text} = req.body;

    // Validar el contenido del comentario
    if(text.length === 0) {
      return res.status(400).json({
        status: "failed",
        message: "The comment cannot be empty"
      })
    }

    const author = await User.findById(req.userId);
    
    const newCommentId = mongoose.Types.ObjectId();
    const newComment = {
      _id: newCommentId,
      user: {
        _id: author._id,
        name: author.name,
        username: author.username,
        avatar: author.avatar,
        role: author.role
      },
      text
    }

    // Guardar el comentario en la base de datos
    post.comments.push(newComment);
    await post.save();

    // Generar la notificación de nuevo comentario
    // sólo si el comentario no es del autor del post
    if(req.userId.toString() !== post.user._id.toString()) {
      await newCommentNotification(post._id, newCommentId, text, req.userId, post.user._id);
    }

    res.json({
      status: "success",
      data: post.comments
    });
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


/*--------------------------------*/
// Borrar un comentario de un post
/*--------------------------------*/
router.delete("/comments/:postId/:commentId", authMiddleware, async (req, res) => {
  try {
    // Buscar el post correspondiente al comentario que se va a eliminar
    const post = await Post.findById(req.params.postId)
    .populate({
      path: "comments.user",
      select: "_id name username avatar"
    });

    // Chequear si el post existe
    if(!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found or deleted"
      })
    }

    // Buscar el comentario
    const updatedComments = [...post.comments];
    const commentIndex = updatedComments.findIndex(comment => comment._id.toString() === req.params.commentId);

    // Chequear si el comentario existe
    if(commentIndex === -1) {
      return res.status(404).json({
        status: "failed",
        message: "Comment not found or already deleted"
      })
    }

    // Chequear si es admin y si el comentario pertenece al usuario que intenta eliminarlo
    if(req.userRole !== "admin" && updatedComments[commentIndex].user._id.toString() !== req.userId.toString()) {
      return res.status(401).json({
        status: "failed",
        message: "Users can delete only their own comments"
      })
    }

    // Eliminar el comentario y actualizar el documento en la DB
    const deletedComment = updatedComments.splice(commentIndex, 1);
    post.comments = updatedComments;
    await post.save();

    // Eliminar la notificación asociada al comentario
    // de la colección de notificaciones del autor de post
    await removeNotification("comment", post.user._id, post._id, req.userId);

    res.json({
      status: "success",
      data: {deletedCommentId: deletedComment[0]._id}
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Internal server error: ${error.message}`
    })
  }
});


module.exports = router;