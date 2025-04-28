const Message = require("../models/message");
const User = require("../models/User");

exports.getConversationsBySender = async (req, res) => {
  try {
    const { senderId } = req.params;

    // Step 1: Find all messages sent or received by the user
    const messages = await Message.find({
      $or: [{ sender: senderId }, { receiver: senderId }],
    }).sort({ createdAt: -1 });

    const conversationMap = new Map();

    // Step 2: Group conversations
    messages.forEach((msg) => {
      const otherUserId =
        msg.sender.toString() === senderId
          ? msg.receiver.toString()
          : msg.sender.toString();

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      // Count unread messages (only messages received by current user and not yet read)
      if (msg.receiver.toString() === senderId && !msg.read) {
        const convo = conversationMap.get(otherUserId);
        convo.unreadCount += 1;
        conversationMap.set(otherUserId, convo);
      }
    });

    const conversationList = [];

    // Step 3: Fetch user info
    for (const [userId, convoData] of conversationMap.entries()) {
      const user = await User.findById(userId);

      if (user) {
        conversationList.push({
          userId: user._id,
          name: `${user.first_name} ${user.last_name}`,
          profile: user.profilePic || "", // Use profilePic
          message: convoData.lastMessage.text || "", // Show last text
          unread: convoData.unreadCount,
          isOnline: user.isOnline || false,
        });
      }
    }

    res.status(200).json(conversationList);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
