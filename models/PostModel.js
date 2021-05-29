const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  content: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  picUrl: {
    type: String,
    default: null
  },
  picPublicId: {
    type: String,
    default: null
  }
}, {timestamps: true});

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);