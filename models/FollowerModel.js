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

followerSchema.index({user: 1});

module.exports = mongoose.models.Follower || mongoose.model("Follower", followerSchema);