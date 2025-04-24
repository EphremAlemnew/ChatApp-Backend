const Message = require("../models/message");
const path = require("path");
const fs = require("fs");

// Controller for sending a message
// Controller for sending a message
exports.sendMessage = async (req, res) => {
  try {
    // Extract message details
    const { sender, receiver, text } = req.body;

    // Check if the file is uploaded
    let fileUrl = null;
    let messageType = "text"; // Default message type

    // If a file is uploaded, process it
    if (req.file) {
      fileUrl = `/uploads/${req.file.destination.split("uploads/")[1]}/${
        req.file.filename
      }`; // Get file path based on its type
      messageType = "file"; // Change message type to 'file'
    }

    // Create a new message
    const newMessage = new Message({
      sender,
      receiver,
      text,
      file: fileUrl, // Store the file URL
      messageType, // Store message type (text or file)
    });

    // Save the new message to the database
    await newMessage.save();

    // Return the saved message as the response
    return res.status(200).json({
      message: "Message sent successfully!",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller for getting all messages between two users
exports.getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.params;

    // Find messages between sender and receiver
    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ timestamp: 1 });

    // Return the messages as the response
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const message = await Message.create(req.body);
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// exports.getMessages = async (req, res) => {
//   try {
//     const messages = await Message.find();
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

exports.getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
