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
  },
  comments: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      text: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {timestamps: true});

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);