const mongoose = require("mongoose");

const followerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  followers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }],
  following: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }]
});

module.exports = mongoose.model("Follower", followerSchema);