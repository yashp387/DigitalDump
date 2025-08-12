// src/routes/agentPickup.routes.js
const express = require("express");
const router = express.Router();
const agentPickupController = require("../controllers/agentPickup.controller");
const { authenticate, authorize } = require("../../src/middleware/authMiddleware"); // Correct path if it's one level up from src/routes

// --- REMOVED OR COMMENTED OUT THE TEST ROUTE ---
// router.get("/test-directions", authenticate, agentPickupController.testBasicDirections);
// ---

// Middleware applied to all subsequent routes in this file: Must be authenticated and must be a CollectionAgent
router.use(authenticate); // Ensure authenticate runs if not placed before
router.use(authorize(["collectionAgent"])); // Ensure only agents can access these routes

// --- Agent Pickup Routes ---

// GET /api/agent/pickups/available - Fetch nearby available pickups
router.get("/available", agentPickupController.getAvailablePickups); // This might now be around line 11

// PUT /api/agent/pickups/:requestId/accept - Accept a specific pickup
router.put("/:requestId/accept", agentPickupController.acceptPickup);

// GET /api/agent/pickups/status?status=accepted - Get agent's accepted pickups
// GET /api/agent/pickups/status?status=completed - Get agent's completed pickups
// GET /api/agent/pickups/status?status=cancelled - Get agent's cancelled pickups (by user)
router.get("/status", agentPickupController.getAgentPickupsByStatus);

// PUT /api/agent/pickups/:requestId/complete - Mark a pickup as completed
router.put("/:requestId/complete", agentPickupController.markPickupCompleted);

// GET /api/agent/pickups/optimize-route - Get optimized route for accepted pickups
router.get("/optimize-route", agentPickupController.getOptimizedRoute);


module.exports = router;