require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const socketio = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const chatSocket = require("./sockets/chatSocket");
const connectDB = require("./config/db");

const fs = require("fs");
const path = require("path");

// Check and create upload folders if not exist
const dirs = ["uploads/images", "uploads/audios", "uploads/others"];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

connectDB();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// Socket.io setup
io.on("connection", (socket) => {
  chatSocket(socket, io);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
