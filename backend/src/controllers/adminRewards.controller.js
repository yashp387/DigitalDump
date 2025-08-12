const User = require("../models/user.model");
const RedeemableProduct = require("../models/redeemableProduct.model");
const CollectionRequest = require("../models/request.model");
const mongoose = require("mongoose");

const getRewardsOverviewStats = async (req, res) => {
  try {
    const [totalPointsResult, totalRecycledItemsResult] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            totalPoints: { $sum: "$points" },
          },
        },
      ]),
      CollectionRequest.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            totalItems: { $sum: "$quantity" },
          },
        },
      ]),
    ]);

    const totalPointsSpread =
      totalPointsResult.length > 0 ? totalPointsResult[0].totalPoints : 0;
    const totalItemsRecycled =
      totalRecycledItemsResult.length > 0
        ? totalRecycledItemsResult[0].totalItems
        : 0;

    res.status(200).json({
      totalPointsSpread,
      totalItemsRecycled,
    });
  } catch (error) {
    console.error("Failed to fetch admin rewards overview stats:", error);
    res.status(500).json({
      message: "Failed to retrieve rewards overview statistics.",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};

const createRedeemableProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      costInPoints,
      stock,
      imageUrl,
      isActive,
    } = req.body;

    if (
      !name ||
      !category ||
      costInPoints === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (
      category !== "Eco Product" &&
      category !== "Cash Voucher" &&
      category !== "Merchandise"
    ) {
      // Added 'Merchandise' as a potential category based on common use cases
      return res.status(400).json({ message: "Invalid category." });
    }

    if (typeof costInPoints !== "number" || costInPoints < 0) {
      return res
        .status(400)
        .json({ message: "Cost in points must be a non-negative number." });
    }

    // Allow positive numbers or Infinity for stock
    if (
      typeof stock !== "number" ||
      (stock < 0 && stock !== Number.POSITIVE_INFINITY)
    ) {
      return res
        .status(400)
        .json({ message: "Stock must be a non-negative number or Infinity." });
    }
    if (
      stock !== Number.POSITIVE_INFINITY &&
      !Number.isInteger(stock)
    ) {
        return res.status(400).json({ message: "Stock must be an integer or Infinity." });
    }

    const newProduct = new RedeemableProduct({
      name,
      category,
      description,
      costInPoints,
      stock,
      imageUrl,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: "Redeemable product created successfully.",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Failed to create redeemable product:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed.",
        errors: error.errors,
      });
    }
    res.status(500).json({
      message: "Failed to create redeemable product.",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};

const getAllRedeemableProducts = async (req, res) => {
  try {
    const products = await RedeemableProduct.find({}).sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(products);
  } catch (error) {
    console.error("Failed to fetch all redeemable products:", error);
    res.status(500).json({
      message: "Failed to retrieve redeemable products.",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};

const deleteRedeemableProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID format." });
    }

    const deletedProduct = await RedeemableProduct.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Redeemable product not found." });
    }

    res.status(200).json({
      message: "Redeemable product deleted successfully.",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Failed to delete redeemable product:", error);
    res.status(500).json({
      message: "Failed to delete redeemable product.",
      error: process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
};

module.exports = {
  getRewardsOverviewStats,
  createRedeemableProduct,
  getAllRedeemableProducts,
  deleteRedeemableProduct,
};
