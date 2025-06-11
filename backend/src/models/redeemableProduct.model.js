const mongoose = require("mongoose");

const redeemableProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Product category is required."],
      enum: {
        values: ["Eco Product", "Cash Voucher"],
        message: "{VALUE} is not a supported category.",
      },
    },
    costInPoints: {
      type: Number,
      required: [true, "Product cost in points is required."],
      min: [0, "Cost cannot be negative."],
    },
    stock: {
      // Use Number.POSITIVE_INFINITY for unlimited stock (like vouchers)
      type: Number,
      required: [true, "Stock quantity is required."],
      min: [0, "Stock cannot be negative."],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value for stock.",
        // Allow Infinity
        unless: (value) => value === Number.POSITIVE_INFINITY,
      },
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      // Allows admin to temporarily disable redemption without deleting
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster querying of active, in-stock products
redeemableProductSchema.index({ isActive: 1, stock: 1, category: 1 });

module.exports = mongoose.model("RedeemableProduct", redeemableProductSchema);