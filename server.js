require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const socketio = require("socket.io");
const fs = require("fs");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const chatSocket = require("./sockets/chatSocket");
const connectDB = require("./config/db");

// Check and create upload folders if not exist
const dirs = ["uploads/images", "uploads/audios", "uploads/others"];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*", // CORS settings for Socket.io
  },
});

// Connect to the database
connectDB();

// Middleware setup
app.use(cors());
app.use(express.json());

// Auth routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
// Message routes
app.use("/api/messages", messageRoutes);

// Serve static files (if you have static assets to serve, like images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket.io setup - handle connections and message events
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Call your chatSocket function to handle events
  chatSocket(socket, io);

  // Handle disconnection event
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
