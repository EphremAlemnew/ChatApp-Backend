const express = require("express");
const upload = require("../config/upload"); // Import multer configuration
const messageController = require("../controllers/messageController");
const {
  getConversationsBySender,
} = require("../controllers/conversation.controller");
const router = express.Router();

// Route to send a message (with or without a file)
router.post("/send", upload.single("file"), messageController.sendMessage);

// Route to get messages between two users
router.get("/:sender/:receiver", messageController.getMessages);

router.put(
  "/markAsRead/:senderId/:receiverId",
  messageController.markMessagesAsRead
);
router.get("/:senderId", getConversationsBySender);
router.post("/", messageController.createMessage);
router.get("/", messageController.getMessages);
router.get("/:id", messageController.getMessageById);
router.put("/:id", messageController.updateMessage);
router.delete("/:id", messageController.deleteMessage);
module.exports = router;
