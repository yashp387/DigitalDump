// backend/src/controllers/adminDashboard.controller.js
const User = require("../models/user.model");
const CollectionRequest = require("../models/request.model"); // Make sure CollectionRequest is imported
const mongoose = require("mongoose");

// Helper function for consistent error responses
const handleError = (res, error, message = "An internal server error occurred") => {
  console.error(message, error);
  res.status(500).json({ message, error: process.env.NODE_ENV !== 'production' ? error.message : undefined });
};

// @desc    Get overview statistics for the admin dashboard
// @route   GET /api/admin/dashboard/stats/overview
// @access  Private (Admin)
const getOverviewStats = async (req, res) => {
  try {
    // Fetch counts concurrently
    const [
      totalUsers,
      scheduledPickups,
      completedPickups,
      collectedWasteResult, // Aggregation result needs processing
    ] = await Promise.all([
      User.countDocuments({}),
      CollectionRequest.countDocuments({ status: "scheduled" }),
      CollectionRequest.countDocuments({ status: "completed" }),
      CollectionRequest.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null, // Group all completed requests together
            totalQuantity: { $sum: "$quantity" }, // Summing a field named 'quantity'
          },
        },
      ]),
    ]);

    // Extract total quantity safely (result is an array, might be empty)
    const totalEwasteCollected =
      collectedWasteResult.length > 0 ? collectedWasteResult[0].totalQuantity : 0;

    res.status(200).json({
      totalUsers,
      scheduledPickups,
      completedPickups,
      totalEwasteCollected,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch overview statistics.");
  }
};

// @desc    Get monthly user signup counts
// @route   GET /api/admin/dashboard/stats/user-signups/monthly
// @access  Private (Admin)
const getMonthlyUserSignups = async (req, res) => {
  try {
    const monthlySignups = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 }, // Count documents in each group
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default _id
          year: "$_id.year",
          month: "$_id.month",
          count: "$count",
        },
      },
      {
        $sort: { year: 1, month: 1 }, // Sort chronologically
      },
    ]);

    res.status(200).json(monthlySignups);
  } catch (error) {
    handleError(res, error, "Failed to fetch monthly user signups.");
  }
};

// @desc    Get distribution of e-waste categories for completed pickups
// @route   GET /api/admin/dashboard/stats/pickup-categories/distribution
// @access  Private (Admin)
const getCategoryDistribution = async (req, res) => {
  try {
    const categoryDistribution = await CollectionRequest.aggregate([
      {
        $match: {
          status: "completed", // Only consider completed requests for category distribution
          ewasteType: { $ne: null, $exists: true, $ne: "" }, // Ensure category exists and is not null/empty string
        },
      },
      {
        $group: {
          _id: "$ewasteType", // Group by the e-waste category type
          count: { $sum: 1 }, // Count requests per category
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default _id
          category: "$_id", // Rename _id to category
          count: "$count",
        },
      },
      {
        $sort: { count: -1 }, // Sort by count descending (most frequent first)
      },
    ]);

    res.status(200).json(categoryDistribution);
  } catch (error) {
    handleError(res, error, "Failed to fetch category distribution.");
  }
};

// @desc    Get monthly scheduled pickup counts
// @route   GET /api/admin/dashboard/stats/scheduled-pickups/monthly
// @access  Private (Admin)
const getMonthlyScheduledPickups = async (req, res) => {
  try {
    const monthlyPickups = await CollectionRequest.aggregate([
      {
        $match: {
          status: "scheduled", // Only consider scheduled requests
        },
      },
      {
        $group: {
          // Group by year/month of creation date
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 }, // Count documents in each group
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default _id
          year: "$_id.year",
          month: "$_id.month",
          count: "$count",
        },
      },
      {
        $sort: { year: 1, month: 1 }, // Sort chronologically
      },
    ]);

    res.status(200).json(monthlyPickups);
  } catch (error) {
    handleError(res, error, "Failed to fetch monthly scheduled pickups.");
  }
};


// --- NEW: Get monthly total pickup counts (all statuses) ---
// @desc    Get monthly total pickup counts made by users
// @route   GET /api/admin/dashboard/stats/total-pickups/monthly
// @access  Private (Admin)
const getMonthlyTotalPickups = async (req, res) => {
  try {
    const monthlyTotalPickups = await CollectionRequest.aggregate([
      // No $match stage here to include all statuses
      {
        $group: {
          // Group by year/month of creation date ($createdAt)
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 }, // Count documents in each group
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default _id
          year: "$_id.year",
          month: "$_id.month",
          count: "$count",
        },
      },
      {
        $sort: { year: 1, month: 1 }, // Sort chronologically
      },
    ]);

    res.status(200).json(monthlyTotalPickups);
  } catch (error) {
    handleError(res, error, "Failed to fetch monthly total pickups.");
  }
};
// --- END NEW ---


module.exports = {
  getOverviewStats,
  getMonthlyUserSignups,
  getCategoryDistribution,
  getMonthlyScheduledPickups,
  getMonthlyTotalPickups, // Export the new function
};
