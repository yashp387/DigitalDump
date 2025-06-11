const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/database");

// Import Routes
const adminRoutes = require("./src/routes/admin.routes");
const adminContentRoutes = require("./src/routes/adminContent.routes");
const adminDashboardRoutes = require("./src/routes/adminDashboard.routes");
const collectionAgentRoutes = require("./src/routes/collectionAgent.routes");
const requestRoutes = require("./src/routes/request.routes");
const userRoutes = require("./src/routes/user.routes");
const educationRoutes = require("./src/routes/education.routes");
const gamificationRoutes = require("./src/routes/gamification.routes");
const communityRoutes = require("./src/routes/community.routes");
const agentPickupRoutes = require("./src/routes/agentPickup.routes");
const profileRoutes = require("./src/routes/profile.routes");
const adminRewardsRoutes = require("./src/routes/adminRewards.routes");
// --- NEW: Import admin management routes ---
const adminManagementRoutes = require("./src/routes/adminManagement.routes");
// --- END NEW ---


// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS configuration
app.use(
  cors({
    origin: "*", // TODO: Adjust for production
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

// Serve static files if needed
// const path = require('path');
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use("/api/admin", adminRoutes);
app.use("/api/admin/content", adminContentRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/collection-agent", collectionAgentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/user", userRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/agent/pickups", agentPickupRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin/rewards", adminRewardsRoutes);
// --- NEW: Use admin management routes ---
app.use("/api/admin/management", adminManagementRoutes);
// --- END NEW ---


// Basic Root Route
app.get("/", (req, res) => {
  res.send("E-Waste Backend API is running!");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || 500;
  if (req.originalUrl.startsWith("/api/")) {
    return res
      .status(statusCode)
      .json({
        message: err.message || "An unexpected server error occurred.",
        error: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      });
  }
  res.status(statusCode).send(err.message || "An unexpected server error occurred.");
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
