// src/controllers/profile.controller.js
const mongoose = require("mongoose");
const User = require("../models/user.model");
const CollectionRequest = require("../models/request.model");
const Redemption = require("../models/redemption.model");

// Helper function to determine tier based on points (can reuse from gamification controller)
const calculateTier = (points) => {
  if (points >= 5500) {
    return "Gold";
  } else if (points >= 3500) {
    return "Silver";
  } else if (points >= 1200) {
    return "Bronze";
  } else {
    return "Normal";
  }
};

// @desc    Get user profile details and stats
// @route   GET /api/profile/me
// @access  Private (User)
const getUserProfileAndStats = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated user

    // Fetch user details and points
    const user = await User.findById(userId).select(
      "name email phone address points referralCode"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Calculate tier
    const tier = calculateTier(user.points || 0);

    // --- Fetch and calculate pickup statistics ---
    // Fetch ALL requests by the user to easily count different statuses
    const allUserRequests = await CollectionRequest.find({ userId: userId });

    // Filter for completed requests to count pickups made and waste recycled
    const completedRequests = allUserRequests.filter(
      (request) => request.status === "completed"
    );

     // Filter for scheduled requests (pending or accepted) to get their count
     const scheduledRequests = allUserRequests.filter(
        (request) => request.status === "pending" || request.status === "accepted"
     );

    const totalPickupsCompleted = completedRequests.length;
    const totalPickupsScheduled = scheduledRequests.length; // Count scheduled ones

    // Calculate total waste recycled (sum of quantity from completed requests)
    const totalWasteRecycled = completedRequests.reduce(
      (sum, request) => sum + (request.quantity || 0),
      0
    );

    // --- CO2 Reduced Calculation (Placeholder) ---
    // This requires specific conversion factors based on e-waste types and quantities.
    // You would typically look up conversion factors for each ewasteType and quantity
    // and sum them up here from the `completedRequests`.
    const co2Reduced = 0; // Placeholder for calculation based on completedRequests
    // --- END CO2 Reduced Calculation ---


    res.status(200).json({
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        referralCode: user.referralCode, // Include referral code
      },
      stats: {
        ecoPoints: user.points || 0,
        tier: tier,
        wasteRecycled: totalWasteRecycled,
        totalPickupsMade: totalPickupsCompleted, // This now explicitly means COMPLETED
        totalPickupsScheduled: totalPickupsScheduled, // NEW: Count of PENDING/ACCEPTED requests
        co2Reduced: co2Reduced, // Placeholder or calculated value based on completed waste
      },
    });
  } catch (error) {
    console.error("Error fetching user profile and stats:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve user profile data." });
  }
};

// @desc    Get the user's scheduled pickup requests (pending or accepted) - This returns the LIST
// @route   GET /api/profile/pickups
// @access  Private (User)
const getUserScheduledPickups = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated user

    // Find requests that are not yet completed or cancelled
    const scheduledRequestsList = await CollectionRequest.find({
      userId: userId,
      status: { $in: ["pending", "accepted"] }, // Only include pending and accepted
    })
      .sort({ preferredDateTime: 1 }) // Sort by preferred date/time ascending
      .populate("assignedAgentId", "name phoneNumber") // Populate agent details if assigned
      .select(
        "preferredDateTime ewasteType ewasteSubtype quantity status assignedAgentId streetAddress city zipCode"
      ) // Select necessary fields
      .lean(); // Use lean for faster read operations

    // Note: This endpoint returns the ARRAY/LIST of scheduled pickups,
    // not just a count. The count is provided in getUserProfileAndStats.
    res.status(200).json({ scheduledPickupsList: scheduledRequestsList });
  } catch (error) {
    console.error("Error fetching user scheduled pickups list:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve scheduled pickups list." });
  }
};

// @desc    Get the user's redemption history
// @route   GET /api/profile/redemptions
// @access  Private (User)
const getUserRedemptionHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated user

    const redemptions = await Redemption.find({ userId: userId })
      .sort({ createdAt: -1 }) // Sort by most recent redemption
      .select("productName category pointsSpent status createdAt"); // Select necessary fields
      // .populate('productId', 'imageUrl') // Optional: populate product image if needed

    res.status(200).json({ redemptionHistory: redemptions });
  } catch (error) {
    console.error("Error fetching user redemption history:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve redemption history." });
  }
};

module.exports = {
  getUserProfileAndStats,
  getUserScheduledPickups, // Note: This returns the LIST
  getUserRedemptionHistory,
};