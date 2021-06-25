const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: "https://res.cloudinary.com/dzytlqnoi/image/upload/v1615203395/default-user-img_t3xpfj.jpg"
  },
  avatarId: {
    type: String
  },
  newMessagePopup: {
    type: Boolean,
    default: true
  },
  unreadMessage: {
    type: Boolean,
    default: false
  },
  unreadNotification: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String
  },
  resetToken: {
    type: String
  },
  expiredToken: {
    type: Date
  },
  status: {
    type: String,
    default: "active",
    enum: ["active", "inactive", "deleted"]
  }
}, {timestamps: true});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);