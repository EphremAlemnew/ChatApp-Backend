const socketIO = require("socket.io");
const User = require("../models/User"); // User model to update the online status
const Message = require("../models/message"); // Message model for storing messages

let onlineUsers = {}; // Track users who are currently online

// Initialize Socket.io
const initSocket = (server) => {
  const io = socketIO(server);

  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    // Handle user online status
    socket.on("userOnline", async (userId) => {
      // Set user status to online
      onlineUsers[socket.id] = userId;

      // Update user's online status in the database
      await User.findByIdAndUpdate(userId, { online: true });

      console.log(`User ${userId} is online`);

      // Emit updated online status to all connected clients
      io.emit("userStatusChange", { userId, status: "online" });
    });

    // Handle user offline status
    socket.on("disconnect", async () => {
      // Find user ID by socket ID
      const userId = onlineUsers[socket.id];

      if (userId) {
        // Set user status to offline
        delete onlineUsers[socket.id];

        // Update user's online status in the database
        await User.findByIdAndUpdate(userId, { online: false });

        console.log(`User ${userId} is offline`);

        // Emit updated online status to all connected clients
        io.emit("userStatusChange", { userId, status: "offline" });
      }
    });

    // Handle sending a message
    socket.on("sendMessage", async (messageData) => {
      // Create a new message in the database
      const newMessage = new Message(messageData);
      await newMessage.save();

      // Broadcast the message to the receiver
      io.to(messageData.receiver).emit("receiveMessage", newMessage);

      console.log(
        `Message sent from ${messageData.sender} to ${messageData.receiver}`
      );
    });

    // Handle the private message (for one-on-one conversations)
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Emit new message to the chat room
    socket.on("sendRoomMessage", async (roomData) => {
      // Save the room message in the database
      const newMessage = new Message(roomData);
      await newMessage.save();

      // Emit the message to the room
      io.to(roomData.roomId).emit("receiveRoomMessage", newMessage);
    });
  });
};

module.exports = initSocket;
