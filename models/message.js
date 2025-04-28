const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    file: { type: String },
    messageType: {
      type: String,
      enum: ["text", "file", "file and text"],
      default: "text",
    },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }, // ✅ New field
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
