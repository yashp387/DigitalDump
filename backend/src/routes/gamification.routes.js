const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamification.controller");
const { authenticate, authorize } = require("../../src/middleware/authMiddleware");

// Apply authentication and user role authorization to all gamification routes
router.use(authenticate);
router.use(authorize(["user"]));

// Get user's current points and tier
router.get("/status", gamificationController.getUserGamificationStatus);

// Get list of products available for redemption
router.get("/products", gamificationController.getAvailableProducts);

// Redeem a specific product
router.post(
  "/products/:productId/redeem",
  gamificationController.redeemProduct
);

// Get user's redemption history
router.get("/redemptions", gamificationController.getUserRedemptionHistory);

module.exports = router;