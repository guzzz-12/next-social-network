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
  editHistory: [
    {
      text: String,
      date: Date
    }
  ],
  commentedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  }
}, {timestamps: true});

commentSchema.index({commentedPost: 1});

module.exports = mongoose.models.Comment || mongoose.model("Comment", commentSchema);