const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  notifications: [
    {
      notificationType: {
        type: String,
        enum: ["like", "comment", "follower"],
        required: true
      },
      notificationUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
      },
      commentId: {
        type: String
      },
      text: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);