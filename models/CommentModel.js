const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  // Usuario autor del post comentado
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Usuario autor del comentario
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true
  },
  commentedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  }
}, {timestamps: true});

module.exports = mongoose.models.Comment || mongoose.model("Comment", commentSchema);