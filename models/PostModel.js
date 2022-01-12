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
  followedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
}, {timestamps: true});

postSchema.index({user: 1});
postSchema.index({createdAt: 1});

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);