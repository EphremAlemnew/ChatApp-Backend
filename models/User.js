const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    first_name: String,
    last_name: String,
    username: String,
    phone: String,
    bio: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: String,
    profilePic: { type: String, default: null },
    isOnline: { type: Boolean, default: false },
    isTyping: { type: Boolean, default: false },
    last_seen: Date,
    // For email verification
    otp: String,
    otpExpires: Date,
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
