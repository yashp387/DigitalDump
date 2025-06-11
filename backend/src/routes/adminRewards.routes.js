const express = require("express");
const router = express.Router();
const adminRewardsController = require("../controllers/adminRewards.controller");
const {
  authenticate,
  authorize,
} = require("../../src/middleware/authMiddleware");

router.use(authenticate);
router.use(authorize(["admin"]));

router.get("/stats/overview", adminRewardsController.getRewardsOverviewStats);

router
  .route("/products")
  .post(adminRewardsController.createRedeemableProduct)
  .get(adminRewardsController.getAllRedeemableProducts);

router.delete(
  "/products/:productId",
  adminRewardsController.deleteRedeemableProduct
);

module.exports = router;
