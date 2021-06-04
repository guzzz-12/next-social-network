const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userToNotify: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userNotifier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  notificationType: {
    type: String,
    enum: ["like", "comment", "follower"],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
  },
  commentId: {
    type: String
  },
  commentText: {
    type: String
  },
  seen: {
    type: Boolean,
    default: false
  }
}, {timestamps: true});

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);