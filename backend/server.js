const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const connectDB = require("./config/db");
const { initializeSocket } = require("./config/socket");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// middlewares
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ajoutez ce middleware de debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// database
connectDB();

// Initialize Socket.io
initializeSocket(server);

// routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// Montage des routes avec logging
console.log("Mounting routes...");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);

console.log("Routes mounted successfully");

// Route de debug pour voir toutes les routes montées
app.get("/api/debug-routes", (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes directes
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
        type: 'direct'
      });
    } else if (middleware.name === 'router') {
      // Routes montées
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '') + handler.route.path,
            methods: Object.keys(handler.route.methods),
            type: 'mounted'
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// Route de test simple sans auth
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString()
  });
});

// Route de test avec auth
app.get("/api/test-auth", (req, res, next) => {
  const { authMiddleware } = require("./middlewares/authMiddleware");
  authMiddleware(req, res, next);
}, (req, res) => {
  res.json({
    success: true,
    message: "Auth test successful!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// 404 handler - CE DOIT ÊTRE APRÈS TOUTES LES ROUTES
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io initialized`);
  console.log(`Test endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/api/test`);
  console.log(`  GET  http://localhost:${PORT}/api/test-auth (requires token)`);
  console.log(`  GET  http://localhost:${PORT}/api/debug-routes`);
});