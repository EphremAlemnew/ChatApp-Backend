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
    // Typing status
    socket.on("typing", ({ receiverId, isTyping }) => {
      const senderId = onlineUsers[socket.id];
      if (!senderId || !receiverId) return;

      io.to(receiverId).emit("typing", {
        userId: senderId,
        isTyping: isTyping,
      });
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

      // 🔁 Emit updated unread counts to receiver
      const unreadCounts = await Message.aggregate([
        { $match: { receiver: messageData.receiver, isRead: false } },
        {
          $group: {
            _id: "$sender",
            unreadCount: { $sum: 1 },
          },
        },
      ]);
      io.to(messageData.receiver).emit("unreadCounts", unreadCounts);
    });

    // Mark all messages from sender to receiver as read
    socket.on("markAllAsRead", async ({ senderId, receiverId }) => {
      await Message.updateMany(
        { sender: receiverId, receiver: senderId, isRead: false },
        { $set: { isRead: true } }
      );

      // Send updated unread count list to receiver
      const unreadCounts = await Message.aggregate([
        { $match: { receiver: senderId, isRead: false } },
        {
          $group: {
            _id: "$sender",
            unreadCount: { $sum: 1 },
          },
        },
      ]);
      io.to(receiverId).emit("unreadCounts", unreadCounts);
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
