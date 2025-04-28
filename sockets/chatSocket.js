const User = require("../models/User");
const Message = require("../models/message");
const { Server } = require("socket.io");
let onlineUsers = {}; // Map socket.id to userId
const io = new Server({
  /* options */
});
const initSocket = () => {
  io.on("connection", (socket) => {
    console.log(`✅ New user connected! Socket ID: ${socket.id}`);

    // When user comes online
    socket.on("userOnline", async (userId) => {
      if (!userId) return;

      onlineUsers[socket.id] = userId;
      socket.join(userId); // Join user room

      await User.findByIdAndUpdate(userId, { isOnline: true });

      console.log(`User ${userId} is online`);
      io.emit("userStatusChange", { userId, status: "online" });
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      const userId = onlineUsers[socket.id];
      if (userId) {
        delete onlineUsers[socket.id];
        await User.findByIdAndUpdate(userId, { isOnline: false });

        console.log(`User ${userId} is offline`);
        io.emit("userStatusChange", { userId, status: "offline" });
      }
    });

    // Send direct message
    socket.on("sendMessage", async (messageData) => {
      const newMessage = new Message(messageData);
      await newMessage.save();

      // Send to receiver's room
      io.to(messageData.receiver).emit("receiveMessage", newMessage);
      console.log(
        `Message sent from ${messageData.sender} to ${messageData.receiver}`
      );
    });

    // Join custom room (for groups or private chat rooms)
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Send room/group message
    socket.on("sendRoomMessage", async (roomData) => {
      const newMessage = new Message(roomData);
      await newMessage.save();

      io.to(roomData.roomId).emit("receiveRoomMessage", newMessage);
    });
  });
  io.listen(5000);
};

module.exports = initSocket;
