const router = require("express").Router();
const Like = require("../models/LikeModel");
const Post = require("../models/PostModel");
const authMiddleware = require("../middleware/authMiddleware");
const {newLikeNotification, removeNotification} = require("../utilsServer/notificationActions");

// Consultar los likes asociados a un post
router.get("/:postId", authMiddleware, async (req, res) => {
  try {
    const {postId} = req.params;

    const likes = await Like
    .find({post: postId})
    .lean()
    .populate({
      path: "author",
      select: "_id name username email avatar role"
    });

    res.json({
      status: "success",
      data: likes
    })

  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error fetching likes: ${error.message}`
    })
  }
});

// Crear/remover un like en un post
router.patch("/:postId", authMiddleware, async (req, res) => {
  try {
    const {postId} = req.params;
    const authorId = req.userId;

    // Buscar el post likeado
    const post = await Post
    .findById(postId)
    .lean();

    if(!post) {
      return res.status(404).json({
        status: "failed",
        message: "Post not found or deleted from DB"
      })
    }

    // Verificar si el like ya existe
    const like = await Like
    .findOne({author: authorId, post: postId})
    .populate({
      path: "author",
      select: "author._id"
    });

    // Tipo de evento (like | dislike)
    let eventType = null;
    
    // Crear el like si no existe
    if(!like) {
      eventType = "liked";

      await Like.create({
        user: post.user,
        author: authorId,
        post: postId
      });

      // Crear notificación de tipo like
      await newLikeNotification(authorId, post._id, post.user);

      res.json({
        status: "success",
        data: {
          eventType,
          like: {
            author: {
              _id: authorId
            }
          }
        }
      });

      // Remover el like si existe
    } else {
      eventType = "disliked";

      await like.delete();

      // Eliminar la notificación de like asociada al post y a los usuarios
      await removeNotification("like", post.user, post._id, null, authorId);

      res.json({
        status: "success",
        data: {
          eventType,
          like: {
            author: {
              _id: authorId
            }
          }
        }
      });
    }
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: `Error creating like: ${error.message}`
    })
  }
});

module.exports = router;