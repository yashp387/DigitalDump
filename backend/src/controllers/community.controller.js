const User = require("../models/user.model");
const Review = require("../models/review.model");
const CollectionRequest = require("../models/request.model"); // Assuming path is correct
const mongoose = require("mongoose");

// @desc    Get overview data for the community forum
// @route   GET /api/community/overview
// @access  Private
const getCommunityOverview = async (req, res) => {
  try {
    // Use Promise.all to fetch data concurrently
    const [
      recentActivity,
      topContributors,
      recentReviews,
      recentUsers,
    ] = await Promise.all([
      // 1. Recent Activity (Latest 3 Pickups)
      CollectionRequest.find({})
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(3)
        .populate("userId", "name") // Get user's name
        .select("userId ewasteSubtype createdAt status") // Select needed fields
        .lean(), // Use lean for faster queries when not modifying docs

      // 2. Top 5 Contributors (Highest Points)
      User.find({})
        .sort({ points: -1 }) // Sort by points descending
        .limit(5)
        .select("name points") // Select name and points
        .lean(),

      // 3. Recent Reviews (Latest 3)
      Review.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("userId", "name") // Get author's name
        .select("userId text createdAt")
        .lean(),

      // 4. Recent Users (Latest 5 Joined)
      User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name createdAt") // Select name and join date
        .lean(),
    ]);

    res.status(200).json({
      recentActivity,
      topContributors,
      recentReviews,
      recentUsers,
    });
  } catch (error) {
    console.error("Error fetching community overview data:", error);
    res.status(500).json({ message: "Failed to retrieve community data." });
  }
};

// @desc    Create a new review/post
// @route   POST /api/community/reviews
// @access  Private (User)
const createReview = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.id; // From authMiddleware

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ message: "Review text is required." });
    }

    const newReview = new Review({
      userId,
      text: text.trim(), // Trim whitespace
    });

    await newReview.save();

    // Populate user info for the response immediately
    const populatedReview = await Review.findById(newReview._id)
                                        .populate("userId", "name")
                                        .lean();


    res.status(201).json({
      message: "Review posted successfully.",
      review: populatedReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    // Handle Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
       return res.status(400).json({ message: "Validation failed.", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to post review." });
  }
};


// @desc    Get the logged-in user's referral code
// @route   GET /api/community/my-referral-code
// @access  Private
const getMyReferralCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('referralCode');

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Note: The pre-save hook should ensure the code exists for saved users.
        // If there's a scenario where it might be null (e.g., very old users before the hook),
        // you might want to generate it on-the-fly here, but the hook is preferred.
        if (!user.referralCode) {
             console.warn(`User ${userId} does not have a referral code. This might indicate an issue or an older user.`);
             // Decide how to handle this: return null, error, or generate on demand.
             // For now, let's return null or an empty string.
             return res.status(200).json({ referralCode: null });
             // Or potentially: return res.status(404).json({ message: "Referral code not generated yet." });
        }

        res.status(200).json({ referralCode: user.referralCode });

    } catch (error) {
        console.error("Error fetching referral code:", error);
        res.status(500).json({ message: "Failed to retrieve referral code." });
    }
};


// @desc    Get all reviews (Optional - for full forum view)
// @route   GET /api/community/reviews
// @access  Private
const getAllReviews = async (req, res) => {
  try {
    // Basic implementation - Add pagination later if needed
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .populate("userId", "name") // Get author's name
      .select("userId text createdAt")
      .lean();

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({ message: "Failed to retrieve reviews." });
  }
};


module.exports = {
  getCommunityOverview,
  createReview,
  getMyReferralCode,
  getAllReviews, // Export if you added the optional route
};