const mongoose = require("mongoose");

const redemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster lookup of user's redemptions
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RedeemableProduct",
      required: true,
    },
    // Store key details at the time of redemption for historical accuracy
    productName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Eco Product", "Cash Voucher"],
    },
    pointsSpent: {
      type: Number,
      required: true,
    },
    status: {
      // Useful for physical goods tracking
      type: String,
      enum: ["Completed", "Pending Shipment", "Shipped", "Cancelled"],
      default: "Completed", // Default for digital or immediate items
    },
    // Add fields like trackingNumber, shippingAddress if needed for physical goods
  },
  {
    timestamps: true, // Records when the redemption occurred
  }
);

// Index for sorting by timestamp efficiently
redemptionSchema.index({ timestamp: -1 });
// Compound index for user's redemptions sorted by time
redemptionSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Redemption", redemptionSchema);