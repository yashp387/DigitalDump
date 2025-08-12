// src/controllers/request.controller.js
const CollectionRequest = require("../models/request.model");
const User = require("../models/user.model"); // <-- Import User model
const axios = require("axios"); // Import axios
const mongoose = require("mongoose");
const { Resend } = require("resend"); // Import Resend (already here, ensure it is)
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Initialize Resend (ensure process.env.RESEND_API_KEY is set)
const resend = new Resend(process.env.RESEND_API_KEY);


// --- NEW: Helper: Send Pickup Confirmation Email ---
const sendPickupConfirmationEmail = async (userEmail, userName, requestDetails) => {
    // --- IMPORTANT: Replace with your verified domain email address ---
    const senderEmail = "welcome@4minmail.org"; // e.g., "noreply@your-domain.com" or a verified subdomain
    // --- END IMPORTANT ---

    const emailSubject = "Your E-Waste Pickup Request Confirmed!";

    // Format preferred date and time for the email
    const pickupDate = requestDetails.preferredDateTime ? new Date(requestDetails.preferredDateTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const pickupTime = requestDetails.preferredDateTime ? new Date(requestDetails.preferredDateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
    const pickupAddress = `${requestDetails.streetAddress}, ${requestDetails.city}, ${requestDetails.zipCode}`; // Combine address fields

    // Construct the HTML body for the email
    const emailHtml = `
        <h1>Hello ${userName || 'User'},</h1>
        <p>Your E-Waste pickup request has been successfully scheduled.</p>
        <p>Here are the details of your upcoming pickup:</p>
        <ul>
            <li><strong>Request ID:</strong> ${requestDetails._id}</li>
            <li><strong>Scheduled Date:</strong> ${pickupDate}</li>
            <li><strong>Scheduled Time:</strong> ${pickupTime}</li>
            <li><strong>Pickup Address:</strong> ${pickupAddress}</li>
            <li><strong>E-waste Type:</strong> ${requestDetails.ewasteType}</li>
            <li><strong>Subtype:</strong> ${requestDetails.ewasteSubtype}</li>
            <li><strong>Quantity:</strong> ${requestDetails.quantity} kg</li>
            <li><strong>Current Status:</strong> Pending</li>
        </ul>
        <p>A collection agent will be assigned and may contact you closer to the scheduled time.</p>
        <br>
        <p>Thank you for recycling with us!</p>
        <p>The E-Waste App Team</p>
         <br/>
         <p><small>This is an automated email, please do not reply directly.</small></p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: `E-Waste App <${senderEmail}>`, // Sender format: "Name <email@domain.com>"
            to: [userEmail], // 'to' expects an array of email addresses
            subject: emailSubject,
            html: emailHtml,
        });

        if (error) {
            // Log the error but don't throw, so request creation still succeeds
            console.error(`Resend API error sending pickup confirmation email to ${userEmail}:`, error);
            return; // Exit the helper function on error
        }

        console.log(`Pickup confirmation email sent successfully to ${userEmail}. Message ID: ${data.id}`);

    } catch (emailError) {
        // Catch any unexpected errors during the API call itself
        console.error(`Unexpected error sending pickup confirmation email to ${userEmail}:`, emailError);
        // Do not re-throw, let the createRequest function proceed
    }
};
// --- END NEW Helper ---


// --- createRequest (Updated with Logging and Email Sending) ---
const createRequest = async (req, res) => {
  console.log("--- createRequest received ---"); // Log start of function
  console.log("req.user:", req.user); // Log authenticated user info
  console.log("req.body:", req.body); // Log incoming request body

  try {
    const {
      fullName,
      phoneNumber,
      streetAddress,
      city,
      zipCode,
      preferredDateTime,
      ewasteType,
      ewasteSubtype,
      quantity,
    } = req.body;

    // Validate presence of required fields BEFORE geocoding/save (optional but good practice)
    if (!fullName || !phoneNumber || !streetAddress || !city || !zipCode || !preferredDateTime || !ewasteType || !ewasteSubtype || quantity === undefined) {
        console.warn("Missing required fields in request body.");
         return res.status(400).json({ message: "Missing required fields." });
    }
     if (typeof quantity !== 'number' || quantity < 1) {
        console.warn("Invalid quantity:", quantity);
        return res.status(400).json({ message: "Quantity must be a number greater than or equal to 1." });
    }
    // Ensure preferredDateTime is a valid Date object for the schema
    const parsedPreferredDateTime = new Date(preferredDateTime);
     if (isNaN(parsedPreferredDateTime.getTime())) {
         console.warn("Invalid preferredDateTime format for Date constructor:", preferredDateTime);
         return res.status(400).json({ message: "Invalid date format for preferred date and time." });
     }


    const userId = req.user.id; // Get user ID from authenticated user (via auth middleware)

    // --- Geocoding Logic ---
    let locationData = null; // Default to null
    try {
      const addressString = `${streetAddress}, ${city}, ${zipCode}`;
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        addressString
      )}.json?access_token=${process.env.MAPBOX_API_KEY}&limit=1`;

      console.log("Geocoding URL:", mapboxUrl); // Log the Mapbox URL
      const mapboxResponse = await axios.get(mapboxUrl);
      console.log("Mapbox Response Status:", mapboxResponse.status); // Log response status
      console.log("Mapbox Response Data Features:", mapboxResponse.data?.features?.length); // Log feature count

      if (
        mapboxResponse.data &&
        mapboxResponse.data.features &&
        mapboxResponse.data.features.length > 0
      ) {
        const [longitude, latitude] =
          mapboxResponse.data.features[0].center;
        locationData = {
          type: "Point",
          coordinates: [longitude, latitude],
        };
        console.log(
          `Geocoding successful for request: [${longitude}, ${latitude}]`
        );
      } else {
        console.warn(
          `Geocoding failed or returned no results for address: ${addressString}. Check address format or Mapbox API key.`
        );
        // Decide how to handle: proceed without coordinates or return error?
        // We proceed without coordinates for now.
      }
    } catch (mapError) {
      console.error(
        `Mapbox API error during request creation for user ${userId}:`,
        mapError.message
      );
      // Log the error but allow request creation without coordinates
      locationData = null; // Ensure locationData is explicitly null on error
    }
    console.log("Final locationData for new request:", locationData);
    // --- End Geocoding Logic ---

    const newRequest = new CollectionRequest({
      userId,
      fullName, // Store user details at time of request
      phoneNumber, // Store user details at time of request
      streetAddress,
      city,
      zipCode,
      preferredDateTime: parsedPreferredDateTime, // Use the parsed date
      ewasteType,
      ewasteSubtype,
      quantity: quantity, // Use the parsed quantity (already validated)
      location: locationData, // Add the geocoded location (or null)
      // status defaults to 'pending'
      // assignedAgentId defaults to null
    });

    console.log("Attempting to save new request:", newRequest);
    await newRequest.save(); // <-- Request is successfully saved here
    console.log("Request saved successfully with ID:", newRequest._id);

    // --- NEW: Send Pickup Confirmation Email (after successful save) ---
    try {
        // Fetch the user's name and email for the email notification
        const user = await User.findById(userId).select('name email');

        if (!user) {
            console.error(`User not found (ID: ${userId}) after saving request ${newRequest._id}. Cannot send confirmation email.`);
            // Continue without sending email if user is not found (shouldn't happen with auth)
        } else {
            // Prepare the request details to pass to the email helper
            const requestDetailsForEmail = {
                _id: newRequest._id, // Use the request ID
                preferredDateTime: newRequest.preferredDateTime,
                streetAddress: newRequest.streetAddress,
                city: newRequest.city,
                zipCode: newRequest.zipCode,
                ewasteType: newRequest.ewasteType,
                ewasteSubtype: newRequest.ewasteSubtype,
                quantity: newRequest.quantity,
            };

            // Call the email helper function (awaiting it ensures it finishes or logs error before final response,
            // but won't block the user's response if the helper has its own try/catch)
             await sendPickupConfirmationEmail(user.email, user.name, requestDetailsForEmail);
        }
    } catch (emailSendError) {
        console.error(`Error during email sending process for request ${newRequest._id}:`, emailSendError);
        // This catch handles errors *within* the email sending attempt itself,
        // but the main request creation succeeded, so we proceed to send the success response.
    }
    // --- END NEW Email Logic ---


    res.status(201).json({
      message: "Collection request created successfully",
      requestId: newRequest._id,
    });
  } catch (error) {
    console.error("Error creating collection request (in main catch block):", error); // Log error in catch

    // Check for Mongoose validation errors
    if (error.name === "ValidationError") {
      console.error("Validation Errors:", error.errors); // Log specific validation errors
      return res
        .status(400) // Bad Request
        .json({ message: "Validation failed.", errors: error.errors });
    }
    // Handle other potential errors (e.g., database connection issues, unexpected errors before save)
    res.status(500).json({
      message: "Failed to create collection request",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined, // Include error message in dev
    });
  } finally {
       console.log("--- createRequest finished ---"); // Log end of function
  }
};

// --- getUserRequests ---
const getUserRequests = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Basic authorization check (user can see own requests, admin can see any)
    if (
      req.user.role !== "admin" &&
      req.user.id.toString() !== userId
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const requests = await CollectionRequest.find({ userId: userId })
      .sort({ createdAt: -1 }) // Sort by creation date or preferredDateTime
      .populate("assignedAgentId", "name phoneNumber") // Populate agent details if assigned
      .lean(); // Use lean for read-only operations

    res.status(200).json({ requests });
  } catch (error) {
    console.error("Error retrieving user collection requests:", error);
    res.status(500).json({
      message: "Failed to retrieve collection requests",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

// --- getRequestById ---
const getRequestById = async (req, res) => {
  try {
    const requestId = req.params.requestId;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID format." });
    }

    const request = await CollectionRequest.findById(requestId)
      .populate("userId", "name email") // Populate user details
      .populate("assignedAgentId", "name phoneNumber email") // Populate agent details
      .lean();

    if (!request) {
      return res
        .status(404)
        .json({ message: "Collection request not found" });
    }

    // Authorization: User who created it, assigned agent, or admin can view
    const isOwner = req.user.id.toString() === request.userId._id.toString();
    const isAssignedAgent =
      request.assignedAgentId &&
      req.user.id.toString() === request.assignedAgentId._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAssignedAgent && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.status(200).json({ request });
  } catch (error) {
    console.error("Error retrieving collection request by ID:", error);
    res.status(500).json({
      message: "Failed to retrieve collection request",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

// --- cancelRequest ---
const cancelRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID format." });
    }

    const request = await CollectionRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Collection request not found" });
    }

    // Authorization: Only the user who created it or an admin can cancel here
    const isOwner = req.user.id.toString() === request.userId.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized to cancel this request" });
    }

    // Allow cancellation only if pending or accepted (adjust logic as needed)
    if (!["pending", "accepted"].includes(request.status)) {
      return res.status(400).json({
        message: `Request cannot be cancelled in its current state (${request.status})`,
      });
    }

    request.status = "cancelled";
    // Optionally clear assignedAgentId if cancelled after acceptance
    // request.assignedAgentId = null;
    await request.save();

    res
      .status(200)
      .json({ message: "Collection request cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling collection request:", error);
     res.status(500).json({
      message: "Failed to cancel collection request",
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

module.exports = {
  createRequest,
  getUserRequests,
  getRequestById,
  cancelRequest,
};
