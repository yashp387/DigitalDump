// src/controllers/agentPickup.controller.js
const CollectionRequest = require("../models/request.model");
const CollectionAgent = require("../models/collectionAgent.model"); // May not be needed if agent data is fully on req.user
const mongoose = require("mongoose");
const axios = require("axios"); // For Mapbox API

const MAX_PICKUP_DISTANCE_METERS = 100 * 1000; // 100km

// --- Get Available Pickups Near Agent ---
const getAvailablePickups = async (req, res) => {
  try {
    const agentId = req.user.id;
    const agentLocation = req.user.location;

    if (
      !agentLocation ||
      !agentLocation.coordinates ||
      agentLocation.coordinates.length !== 2
    ) {
      console.error(`[getAvailablePickups] Agent ${agentId} location check failed.`);
      return res.status(400).json({
        message:
          "Agent location not found or invalid. Cannot fetch nearby pickups.",
      });
    }

    const [longitude, latitude] = agentLocation.coordinates;

    const availableRequests = await CollectionRequest.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: MAX_PICKUP_DISTANCE_METERS,
        },
      },
      status: "pending",
      assignedAgentId: null,
    })
      .populate("userId", "name email")
      .select("-userId.password")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ requests: availableRequests });
  } catch (error) {
    console.error("[getAvailablePickups] Error fetching available pickups:", error);
    res.status(500).json({
      message: "Failed to fetch available pickups.",
      error: error.message,
    });
  }
};

// --- Accept a Pickup Request ---
const acceptPickup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { requestId } = req.params;
    const agentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid request ID format." });
    }

    const updatedRequest = await CollectionRequest.findOneAndUpdate(
      {
        _id: requestId,
        status: "pending",
        assignedAgentId: null,
      },
      {
        $set: {
          status: "accepted",
          assignedAgentId: agentId,
        },
      },
      {
        new: true,
        session: session,
      }
    )
      .populate("userId", "name email")
      .lean();

    if (!updatedRequest) {
      await session.abortTransaction();
      session.endSession();
      const existingRequest = await CollectionRequest.findById(requestId).lean();
      let message = "Request not found or could not be accepted.";
      if (existingRequest) {
        message = `Request could not be accepted. Current status: ${existingRequest.status}. Assigned to: ${existingRequest.assignedAgentId || 'None'}.`;
      }
      console.warn(`[acceptPickup] Failed to accept request ${requestId} for agent ${agentId}. ${message}`);
      return res.status(409).json({ message });
    }

    await session.commitTransaction();
    session.endSession();
    console.log(`[acceptPickup] Agent ${agentId} accepted request ${requestId}.`);
    res.status(200).json({
      message: "Pickup request accepted successfully.",
      request: updatedRequest,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("[acceptPickup] Error accepting pickup request:", error);
    res.status(500).json({
      message: "Failed to accept pickup request.",
      error: error.message,
    });
  }
};

// --- Get Agent's Pickups by Status (Accepted, Completed, Cancelled) ---
const getAgentPickupsByStatus = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { status } = req.query;

    const validStatuses = ["accepted", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid or missing status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const requests = await CollectionRequest.find({
      assignedAgentId: agentId,
      status: status.toLowerCase(),
    })
      .populate("userId", "name email streetAddress city zipCode phoneNumber")
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({ requests });
  } catch (error) {
    console.error(`[getAgentPickupsByStatus] Error fetching agent's ${status} pickups:`, error);
    res.status(500).json({
      message: `Failed to fetch ${status} pickups.`,
      error: error.message,
    });
  }
};

// --- Mark a Pickup as Completed ---
const markPickupCompleted = async (req, res) => {
  try {
    const { requestId } = req.params;
    const agentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID format." });
    }

    const updatedRequest = await CollectionRequest.findOneAndUpdate(
      {
        _id: requestId,
        status: "accepted",
        assignedAgentId: agentId,
      },
      {
        $set: {
          status: "completed",
          // completedAt: new Date() // Optional
        },
      },
      { new: true }
    ).lean();

    if (!updatedRequest) {
      console.warn(`[markPickupCompleted] Failed to complete request ${requestId} for agent ${agentId}. Not found, not assigned, or not accepted.`);
      return res.status(404).json({
        message:
          "Request not found, not assigned to you, or not in 'accepted' state.",
      });
    }
    console.log(`[markPickupCompleted] Agent ${agentId} completed request ${requestId}.`);
    res.status(200).json({
      message: "Pickup marked as completed successfully.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("[markPickupCompleted] Error marking pickup as completed:", error);
    res.status(500).json({
      message: "Failed to mark pickup as completed.",
      error: error.message,
    });
  }
};

// --- Get Optimized Route for Accepted Pickups (Using Optimization API v1 - WITH DUPLICATE FILTERING) ---
const getOptimizedRoute = async (req, res) => {
  console.log("[getOptimizedRoute Controller] Received req.user:", JSON.stringify(req.user, null, 2));
  try {
    const agentId = req.user.id;
    const agentLocation = req.user.location;

    if (!agentLocation || !agentLocation.coordinates || agentLocation.coordinates.length !== 2) {
      console.error(`[getOptimizedRoute Controller] Agent ${agentId} location check failed.`);
      return res.status(400).json({ message: "Agent location not found. Cannot calculate route." });
    }
    const agentCoords = agentLocation.coordinates;
    console.log(`[getOptimizedRoute Controller] Agent ${agentId} coordinates found:`, agentCoords);

    // 1. Fetch accepted pickups
    const acceptedPickups = await CollectionRequest.find({
      assignedAgentId: agentId,
      status: "accepted",
      location: { $ne: null },
      "location.coordinates": { $ne: null, $size: 2 },
    })
      .select("location")
      .lean();

    if (!acceptedPickups || acceptedPickups.length === 0) {
      console.log(`[getOptimizedRoute Controller] No accepted pickups found for agent ${agentId}.`);
      return res.status(200).json({ message: "No accepted pickups found to optimize route for." });
    }
    console.log(`[getOptimizedRoute Controller] Found ${acceptedPickups.length} accepted pickups for agent ${agentId}.`);

    // 2. Prepare coordinates - WITH DUPLICATE FILTERING
    const allRawCoords = [
        agentCoords, // Agent's start location
        ...acceptedPickups.map(pickup => pickup.location.coordinates),
        agentCoords  // Agent's end location (for roundtrip)
    ];
    console.log("[getOptimizedRoute Controller] Raw coordinates before filtering:", JSON.stringify(allRawCoords));

    const uniqueConsecutiveCoords = allRawCoords.filter((coord, index, arr) => {
        if (!Array.isArray(coord) || coord.length !== 2 || typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
            console.warn(`[getOptimizedRoute Controller] Invalid coordinate structure found at index ${index}:`, JSON.stringify(coord));
            return false;
        }
        if (index === 0) return true;
        const prevCoord = arr[index - 1];
        if (!Array.isArray(prevCoord) || prevCoord.length !== 2) return true;
        return !(coord[0] === prevCoord[0] && coord[1] === prevCoord[1]);
    });
    console.log(`[getOptimizedRoute Controller] Filtered unique consecutive coordinates count: ${uniqueConsecutiveCoords.length}`);
    console.log("[getOptimizedRoute Controller] Unique consecutive coordinates after filtering:", JSON.stringify(uniqueConsecutiveCoords));

    // Check coordinate limits (2-12 for Optimized Trips v1)
    if (uniqueConsecutiveCoords.length < 2 || uniqueConsecutiveCoords.length > 12) {
        console.error(`[getOptimizedRoute Controller] Invalid number of coordinates (${uniqueConsecutiveCoords.length}). Must be between 2 and 12 for Optimized Trips API v1.`);
        return res.status(400).json({ message: `Invalid number of locations (${uniqueConsecutiveCoords.length}). Must be between 2 and 12 for route optimization.` });
    }

    const coordinatesString = uniqueConsecutiveCoords.map(coord => coord.join(",")).join(";");

    // 3. Call Mapbox Optimized Trips API v1
    const mapboxApiKey = process.env.MAPBOX_API_KEY; // Use sk. key
    if (!mapboxApiKey) {
        console.error("[getOptimizedRoute Controller] MAPBOX_API_KEY environment variable is not set.");
        return res.status(500).json({ message: "Mapbox API key configuration error." });
    }
    console.log(`[getOptimizedRoute Controller] Using API Key starting with: ${mapboxApiKey.substring(0, 5)}...`);

    const profile = "mapbox/driving"; // Or mapbox/driving-traffic, etc.

    // --- CORRECTED URL ENDPOINT ---
    const mapboxUrl = `https://api.mapbox.com/optimized-trips/v1/${profile}/${coordinatesString}`;
    // --- END CORRECTION ---

    console.log(`[getOptimizedRoute Controller] Calling Mapbox Optimized Trips API v1 with ${uniqueConsecutiveCoords.length} unique waypoints.`);
    console.log(`[getOptimizedRoute Controller] Mapbox URL (Optimized Trips v1): ${mapboxUrl}`);
    console.log(`[getOptimizedRoute Controller] Coordinates string length: ${coordinatesString.length}`);

    // Make the GET request with query parameters
    const mapboxResponse = await axios.get(mapboxUrl, {
      params: {
        access_token: mapboxApiKey,
        roundtrip: true,      // Default is true, but explicit is fine
        source: 'first',      // Default is first, but explicit is fine
        destination: 'last',  // Default is last, but explicit is fine
        steps: true,
        geometries: 'geojson',
        overview: 'full',
      },
      // timeout: 10000 // Optional timeout
    });

    // 4. Process and return the response (Structure should be similar: code, waypoints, trips)
    if (mapboxResponse.data && mapboxResponse.data.code === "Ok") {
      console.log(`[getOptimizedRoute Controller] Mapbox Optimized Trips v1 successful for agent ${agentId}.`);
      res.status(200).json({
        message: "Optimized route calculated successfully (Optimized Trips v1).",
        routeData: mapboxResponse.data, // Send the actual route data
      });
    } else {
      console.error("[getOptimizedRoute Controller] Mapbox Optimized Trips API v1 Error Response:", mapboxResponse.data);
      const mapboxMessage = mapboxResponse.data?.message || "Unknown Mapbox error";
      const mapboxCode = mapboxResponse.data?.code || "Error";
      res.status(mapboxResponse.status || 400).json({
        message: `Failed to calculate optimized route (Optimized Trips v1): ${mapboxMessage} (Code: ${mapboxCode})`,
      });
    }
  } catch (error) {
    console.error("[getOptimizedRoute Controller] Error during Axios request or processing:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    // Update 404 message slightly
    const message = error.response?.data?.message ||
                    (status === 404 ? "Mapbox Optimized Trips API endpoint not found. Check URL/permissions." : "Failed to get optimized route due to a server error (Optimized Trips v1).");

    res.status(status).json({
      message: message,
      error_details: process.env.NODE_ENV !== 'production' ? (error.response?.data || error.message) : undefined,
    });
  }
};

// --- Export all controller functions ---
module.exports = {
  getAvailablePickups,
  acceptPickup,
  getAgentPickupsByStatus,
  markPickupCompleted,
  getOptimizedRoute,
};