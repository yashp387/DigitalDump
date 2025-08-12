// src/controllers/collectionAgent.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios"); // For Mapbox API call
const fs = require("fs").promises; // Use promises version of fs for async cleanup
const path = require("path");
const CollectionAgent = require("../models/collectionAgent.model");
const mongoose = require("mongoose"); // Needed for transaction potentially (though not used in this version)

// --- Helper to Generate JWT ---
const generateToken = (collectionAgent) => {
  return jwt.sign(
    {
      id: collectionAgent.id,
      email: collectionAgent.email,
      role: "collectionAgent",
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" } // Token expires in 30 days
  );
};

// --- Helper to delete uploaded file (used for cleanup on error) ---
const deleteFile = async (filePath) => {
  // Check if a file path was actually provided
  if (!filePath) {
    console.log("No file path provided for deletion.");
    return;
  }
  try {
    // Use fs.promises.unlink for asynchronous deletion
    await fs.unlink(filePath);
    console.log(`Successfully deleted orphaned file: ${filePath}`);
  } catch (unlinkError) {
    // Log errors during deletion, e.g., file not found (might happen if deletion is attempted twice)
    console.error(`Error deleting orphaned file ${filePath}:`, unlinkError.message);
    // Don't let this crash the main error response flow
  }
};

// --- Sign Up ---
// --- Sign Up ---
const signUp = async (req, res) => {
  const certificateFile = req.file;
  let certificateFilePath = certificateFile ? certificateFile.path : null;

  try {
    const { name, email, phoneNumber, street, area, city, pincode, password } = req.body;

    if (!certificateFile) {
      console.error("[Agent Signup] No certificate file received.");
      return res.status(400).json({ message: "GPCB Certificate file is required." });
    }
    if (!name || !email || !phoneNumber || !street || !area || !city || !pincode || !password) {
      await deleteFile(certificateFilePath); // Cleanup uploaded file
      return res.status(400).json({ message: "All text fields are required." });
    }

    const existingAgent = await CollectionAgent.findOne({ email: email.toLowerCase() });
    if (existingAgent) {
      await deleteFile(certificateFilePath);
      return res.status(400).json({ message: "Email already registered." });
    }

    // --- Geocoding Logic ---
    let agentLocation = null; // Initialize location data
    try {
      const addressString = `${street}, ${area}, ${city}, ${pincode}`;
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        addressString
      )}.json?access_token=${process.env.MAPBOX_API_KEY}&limit=1`;

      console.log(`[Agent Signup] Geocoding address: ${addressString}`);
      const mapboxResponse = await axios.get(mapboxUrl);

      if (
        mapboxResponse.data?.features?.length > 0 &&
        mapboxResponse.data.features[0]?.center?.length === 2
      ) {
        const [longitude, latitude] = mapboxResponse.data.features[0].center;
        agentLocation = { // Assign the GeoJSON structure
          type: "Point",
          coordinates: [longitude, latitude],
        };
        console.log(`[Agent Signup] Geocoding successful for ${email}: [${longitude}, ${latitude}]`);
      } else {
        // Geocoding failed or returned no results
        console.warn(`[Agent Signup] Geocoding failed or no results for address: ${addressString}. Response:`, mapboxResponse.data);
        // Decide: Should signup fail? Or proceed without location?
        // For this feature, location is CRITICAL. Let's make it fail.
        await deleteFile(certificateFilePath); // Cleanup file
        return res.status(400).json({ message: "Failed to verify address location. Please check address details." });
      }
    } catch (mapError) {
      console.error("[Agent Signup] Mapbox API Error:", mapError.response?.data || mapError.message);
      await deleteFile(certificateFilePath);
      return res.status(400).json({
        message: "Failed to verify address due to geocoding service error.",
        // error: mapError.message // Only show detailed error in dev
      });
    }
    // --- End Geocoding Logic ---

    // Ensure agentLocation is valid before proceeding (should be guaranteed by check above)
    if (!agentLocation) {
         console.error("[Agent Signup] CRITICAL: agentLocation is null/undefined after geocoding block. This should not happen.");
         await deleteFile(certificateFilePath);
         return res.status(500).json({ message: "Internal server error during signup (location processing)." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAgent = new CollectionAgent({
      name,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      address: { street, area, city, pincode },
      location: agentLocation, // Assign the successfully geocoded location
      certificatePath: certificateFilePath,
      // isVerified defaults to false
    });

    await newAgent.save();
    console.log(`[Agent Signup] Agent ${newAgent.email} saved successfully with ID: ${newAgent._id} and location.`);

    const token = generateToken(newAgent);

    res.status(201).json({
      message: "Collection agent created successfully",
      token: token,
      agentId: newAgent._id,
    });

  } catch (error) {
    console.error("[Agent Signup] Global Error:", error);
    await deleteFile(certificateFilePath); // Attempt cleanup on any error

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation failed.", errors: error.errors });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `An account with this ${field} already exists.` });
    }
    res.status(500).json({
      message: "Failed to create collection agent due to a server error.",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};
// --- Sign In ---
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Find agent by email (case-insensitive)
    const collectionAgent = await CollectionAgent.findOne({
      email: email.toLowerCase(),
    });
    // If agent not found, return 401 Unauthorized
    if (!collectionAgent) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Compare provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(
      password,
      collectionAgent.password
    );
    // If passwords don't match, return 401 Unauthorized
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Generate JWT token upon successful authentication
    const token = generateToken(collectionAgent);

    // Send success response with token and basic user info
    res.status(200).json({
      message: "Logged in successfully",
      token,
      user: { // Send essential, non-sensitive info
        id: collectionAgent._id,
        name: collectionAgent.name, // Include name
        email: collectionAgent.email,
        role: "collectionAgent",
      },
    });
  } catch (error) {
    // Handle unexpected errors during sign-in
    console.error("Sign In Error:", error);
    res.status(500).json({
      message: "Failed to login due to a server error.",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

// --- Protected Route Example ---
// This is just a placeholder to test authentication/authorization
const collectionAgentProtected = (req, res) => {
  // If the request reaches here, authenticate and authorize middleware passed
  res.status(200).json({
    message: "Collection agent access granted to protected route.",
    agentId: req.user.id, // Access user info attached by middleware
    agentEmail: req.user.email,
  });
};

// Export the controller functions
module.exports = {
  signUp,
  signIn,
  collectionAgentProtected,
};
