const express = require("express");
const User = require("../models/UserModel");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:searchTerm", authMiddleware, async (req, res) => {
  try {
    const {searchTerm} = req.params;
    if(!searchTerm) {
      return null;
    }

    const termPattern = new RegExp(`^${searchTerm}`);
    const results = await User
    .find({$or: [
      {username: {$regex: termPattern, $options: "i"}, isVerified: true},
      {name: {$regex: termPattern, $options: "i"}, isVerified: true}
    ]})
    .select("_id name username email role avatar avatarId");

    if(results.length === 0) {
      return res.status(404).json({
        status: "failed",
        message: "No results found"
      });
    }

    res.json({
      status: "success",
      data: results
    })
    
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message
    })
  }
});

module.exports = router;
