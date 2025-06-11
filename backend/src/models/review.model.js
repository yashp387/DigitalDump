const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster lookup of user's reviews
    },
    text: {
      type: String,
      required: [true, "Review text cannot be empty."],
      trim: true,
      minlength: [5, "Review must be at least 5 characters long."],
      maxlength: [1000, "Review cannot exceed 1000 characters."],
    },
    // Add fields like 'rating' (Number) if needed later
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Index for sorting by creation date efficiently
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);