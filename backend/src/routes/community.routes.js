const express = require("express");
const router = express.Router();
const communityController = require("../controllers/community.controller");
const { authenticate, authorize } = require("../../src/middleware/authMiddleware"); // Adjust path as needed

// All community routes require authentication
router.use(authenticate);

// Get the overview data (recent activity, top users, etc.)
router.get("/overview", communityController.getCommunityOverview);

// Post a new review (only users)
router.post("/reviews", authorize(["user"]), communityController.createReview);

// Get all reviews (optional - accessible to all logged-in users)
router.get("/reviews", communityController.getAllReviews);

// Get the logged-in user's referral code
router.get("/my-referral-code", communityController.getMyReferralCode);


module.exports = router;