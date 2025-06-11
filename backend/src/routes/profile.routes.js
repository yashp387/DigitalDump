// src/routes/profile.routes.js
const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const { authenticate, authorize } = require("../middleware/authMiddleware"); // Adjust path based on your setup

// All profile routes require authentication and user role
router.use(authenticate);
router.use(authorize(["user"])); // Only allow users to access their profile

// GET user profile details and stats
// Example: GET /api/profile/me
router.get("/me", profileController.getUserProfileAndStats);

// GET user's scheduled pickup requests
// Example: GET /api/profile/pickups
router.get("/pickups", profileController.getUserScheduledPickups);

// GET user's redemption history
// Example: GET /api/profile/redemptions
router.get("/redemptions", profileController.getUserRedemptionHistory);

module.exports = router;
