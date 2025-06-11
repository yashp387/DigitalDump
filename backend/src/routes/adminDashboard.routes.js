// backend/src/routes/adminDashboard.routes.js
const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/adminDashboard.controller");
const { authenticate, authorize } = require("../../src/middleware/authMiddleware"); // Correct path

// Protect all dashboard routes: require authentication and admin role
router.use(authenticate);
router.use(authorize(["admin"]));

// Define routes for dashboard statistics
router.get("/stats/overview", dashboardController.getOverviewStats);
router.get(
  "/stats/user-signups/monthly",
  dashboardController.getMonthlyUserSignups
);
router.get(
  "/stats/pickup-categories/distribution",
  dashboardController.getCategoryDistribution
);
router.get(
  "/stats/scheduled-pickups/monthly", // Keep this route if you need scheduled vs total comparison elsewhere
  dashboardController.getMonthlyScheduledPickups
);

// --- NEW ROUTE ---
router.get(
  "/stats/total-pickups/monthly", // New endpoint path
  dashboardController.getMonthlyTotalPickups // New controller function
);
// --- END NEW ---


module.exports = router;
