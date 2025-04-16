const express = require("express");
const upload = require("../config/upload"); // Import multer configuration
const messageController = require("../controllers/messageController");
const router = express.Router();

// Route to send a message (with or without a file)
router.post("/send", upload.single("file"), messageController.sendMessage);

// Route to get messages between two users
router.get("/:sender/:receiver", messageController.getMessages);

module.exports = router;
