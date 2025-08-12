// src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const CollectionAgent = require("../models/collectionAgent.model");
const User = require("../models/user.model");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let userDocument;

    if (decoded.role === "admin") {
      userDocument = await Admin.findById(decoded.id).lean();
    } else if (decoded.role === "collectionAgent") {
      // --- Fetch agent data ---
      userDocument = await CollectionAgent.findById(decoded.id).lean(); // Fetch the agent

      // --- Logging: Check the raw document from DB ---
      console.log("[Auth Middleware] Fetched Agent Document from DB:", JSON.stringify(userDocument, null, 2));

    } else if (decoded.role === "user") {
      userDocument = await User.findById(decoded.id).lean();
    } else {
      console.warn(`Unexpected role in token: ${decoded.role}`);
      return res.status(401).json({ message: "Invalid token: Unknown role" });
    }

    if (!userDocument) {
      console.warn(`User/Agent not found for token ID: ${decoded.id}, Role: ${decoded.role}`);
      return res.status(401).json({ message: "Invalid token: User not found" });
    }

    // --- Construct req.user ---
    // Ensure location is explicitly included if the role is collectionAgent
    const userPayload = {
      id: userDocument._id,
      email: userDocument.email,
      role: decoded.role,
      name: userDocument.name,
      // Conditionally add location ONLY for collection agents
      ...(decoded.role === "collectionAgent" && { location: userDocument.location }),
    };

    req.user = userPayload;

    // --- Logging: Check the req.user object being attached ---
    console.log("[Auth Middleware] Attaching req.user:", JSON.stringify(req.user, null, 2));

    // --- Specific Check for Agent Location before proceeding ---
    if (req.user.role === 'collectionAgent') {
        if (!req.user.location || !req.user.location.coordinates || req.user.location.coordinates.length !== 2) {
            console.error(`[Auth Middleware] CRITICAL: Agent ${req.user.id} is MISSING valid location data in req.user! Location found:`, JSON.stringify(req.user.location));
            // Decide: Should we block the request here or let the controller handle it?
            // Letting the controller handle it gives a more specific error message for that route.
        } else {
             console.log(`[Auth Middleware] Agent ${req.user.id} location data looks valid in req.user.`);
        }
    }

    next(); // Proceed to the next middleware or route handler

  } catch (error) {
    console.error("Authentication error:", error.message);
    // Handle different JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token signature" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    return res.status(401).json({
      message: "Token verification failed",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

// Authorize function remains the same
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      console.error("Authorization error: req.user not found. Ensure authenticate middleware runs first.");
      return res.status(401).json({ message: "Authentication required." });
    }
    const userRole = req.user.role;
    if (!Array.isArray(roles)) {
        console.error("Authorization config error: roles must be an array.");
        return res.status(500).json({ message: "Server configuration error." });
    }
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: `Forbidden: Access denied for role '${userRole}'. Required roles: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
