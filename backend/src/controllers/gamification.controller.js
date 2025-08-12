const User = require("../models/user.model");
const RedeemableProduct = require("../models/redeemableProduct.model");
const Redemption = require("../models/redemption.model");
const mongoose = require("mongoose");

// Helper function to determine tier based on points
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

// @desc    Get current user's points and calculated tier
// @route   GET /api/gamification/status
// @access  Private (User)
const getUserGamificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("points"); // Only fetch points

    if (!user) {
      // Should not happen if auth middleware is working correctly
      return res.status(404).json({ message: "User not found." });
    }

    const points = user.points || 0;
    const tier = calculateTier(points);

    res.status(200).json({
      points: points,
      tier: tier,
    });
  } catch (error) {
    console.error("Error fetching user gamification status:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve user status." });
  }
};

// @desc    Get list of available products for redemption
// @route   GET /api/gamification/products
// @access  Private (User)
const getAvailableProducts = async (req, res) => {
  try {
    const products = await RedeemableProduct.find({
      isActive: true,
      $or: [
        { stock: { $gt: 0 } }, // Stock is greater than 0
        { stock: Number.POSITIVE_INFINITY }, // Or stock is Infinity
      ],
    }).select("-isActive -createdAt -updatedAt -__v"); // Exclude unnecessary fields

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching redeemable products:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve available products." });
  }
};

// @desc    Redeem a product using points
// @route   POST /api/gamification/products/:productId/redeem
// @access  Private (User)
const redeemProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid product ID format." });
    }

    // Fetch user and product within the transaction for consistency
    const user = await User.findById(userId).session(session);
    const product = await RedeemableProduct.findById(productId).session(session);

    // --- Validation Checks ---
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found." });
    }
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Product not found." });
    }
    if (!product.isActive) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "This product is currently not available for redemption." });
    }
    if (product.stock !== Number.POSITIVE_INFINITY && product.stock <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Product is out of stock." });
    }
    if ((user.points || 0) < product.costInPoints) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient points." });
    }
    // --- End Validation ---

    // --- Perform Actions ---
    // 1. Deduct points from user
    user.points = (user.points || 0) - product.costInPoints;

    // 2. Decrement stock (if not infinite)
    if (product.stock !== Number.POSITIVE_INFINITY) {
      product.stock -= 1;
    }

    // 3. Create Redemption record
    const redemption = new Redemption({
      userId: userId,
      productId: productId,
      productName: product.name, // Store name at time of redemption
      category: product.category, // Store category at time of redemption
      pointsSpent: product.costInPoints, // Store cost at time of redemption
      // status: 'Completed' // Default status is set in the model
    });

    // --- Save Changes ---
    await user.save({ session });
    await product.save({ session });
    await redemption.save({ session });

    // --- Commit Transaction ---
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: `Successfully redeemed '${product.name}'.`,
      remainingPoints: user.points,
      redemptionId: redemption._id,
    });
  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.error("Error redeeming product:", error);
    // Handle potential validation errors from save()
    if (error.name === 'ValidationError') {
       return res.status(400).json({ message: "Validation failed.", errors: error.errors });
    }
    res
      .status(500)
      .json({ message: "Failed to redeem product.", error: error.message });
  }
};

// @desc    Get the current user's redemption history
// @route   GET /api/gamification/redemptions
// @access  Private (User)
const getUserRedemptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const redemptions = await Redemption.find({ userId: userId })
      .sort({ createdAt: -1 }) // Sort by newest first
      .select("-userId -__v -updatedAt"); // Exclude unnecessary fields

    res.status(200).json(redemptions);
  } catch (error) {
    console.error("Error fetching redemption history:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve redemption history." });
  }
};

module.exports = {
  getUserGamificationStatus,
  getAvailableProducts,
  redeemProduct,
  getUserRedemptionHistory,
};