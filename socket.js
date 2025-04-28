let io;

module.exports = {
  init: (serverIO) => {
    io = serverIO;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
