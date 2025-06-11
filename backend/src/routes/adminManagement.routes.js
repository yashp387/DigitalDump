const express = require("express");
const router = express.Router();
const adminManagementController = require("../controllers/adminManagement.controller");
const {
  authenticate,
  authorize,
} = require("../../src/middleware/authMiddleware");

router.use(authenticate);
router.use(authorize(["admin"]));

router.get("/stats/overview", adminManagementController.getManagementOverviewStats);
router.get("/stats/user-growth/monthly", adminManagementController.getMonthlyUserGrowth);

router.get("/users", adminManagementController.getAllUsers);
router.put("/users/:userId/status", adminManagementController.updateUserStatus);
router.delete("/users/:userId", adminManagementController.deleteUser);

router.get("/agents", adminManagementController.getAllAgents);
router.put("/agents/:agentId/status", adminManagementController.updateAgentStatus);
router.delete("/agents/:agentId", adminManagementController.deleteAgent);


module.exports = router;
