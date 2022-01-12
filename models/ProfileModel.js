const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  bio: {
    type: String,
    required: true
  },
  social: {
    facebook: {type: String},
    twitter: {type: String},
    instagram: {type: String},
    youtube: {type: String}
  }
}, {timestamps: true});

profileSchema.index({user: 1});

module.exports = mongoose.models.Profile || mongoose.model("Profile", profileSchema);