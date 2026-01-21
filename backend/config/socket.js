const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

// Initialize Socket.io server
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // Vite default port
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
io.on("connection", (socket) => {

  socket.on("join-video-room", ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.userId);
  });

  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });
});


  return io;
};

// Get Socket.io instance
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Emit notification to specific user
const emitNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(userId).emit("new-notification", notification);
  }
};

// Emit unread count update to specific user
const emitUnreadCountToUser = (userId, count) => {
  if (io) {
    io.to(userId).emit("unread-count-update", count);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitNotificationToUser,
  emitUnreadCountToUser,
};
