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
      io.emit("userStatusChange", { userId, status: "online" });
    });

    // User typing
    socket.on("typing", ({ sender, receiver }) => {
      io.to(receiver).emit("typing", { sender });
    });

    // User stopped typing
    socket.on("stopTyping", ({ sender, receiver }) => {
      io.to(receiver).emit("stopTyping", { sender });
    });

    // Direct message
    socket.on("sendMessage", async (messageData) => {
      const newMessage = new Message({
        ...messageData,
        isRead: false,
        createdAt: new Date(),
      });
      // await newMessage.save();

      io.to(messageData.receiver).emit("receiveMessage", newMessage);
      console.log(
        `Message sent from ${messageData.sender} to ${messageData.receiver}`
      );
    });

    // Mark all messages from sender to receiver as read
    socket.on("markAllAsRead", async ({ sender, receiver }) => {
      await Message.updateMany(
        { sender, receiver, isRead: false },
        { $set: { isRead: true } }
      );
      io.to(sender).emit("messagesSeen", { byUser: receiver });
    });

    // Get unread count
    socket.on("getUnreadCount", async ({ userId }) => {
      const result = await Message.aggregate([
        { $match: { receiver: userId, isRead: false } },
        {
          $group: {
            _id: "$sender",
            unreadCount: { $sum: 1 },
          },
        },
      ]);
      socket.emit("unreadCounts", result);
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      const userId = onlineUsers[socket.id];
      if (userId) {
        delete onlineUsers[socket.id];
        await User.findByIdAndUpdate(userId, { isOnline: false });
        io.emit("userStatusChange", { userId, status: "offline" });
        console.log(`User ${userId} is offline`);
      }
    });
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
