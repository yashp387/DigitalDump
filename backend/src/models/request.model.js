// src/models/request.model.js
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    fullName: {
      // User's full name at time of request
      type: String,
      required: true,
    },
    phoneNumber: {
      // User's phone number at time of request
      type: String,
      required: true,
    },
    streetAddress: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    preferredDateTime: {
      type: Date,
      required: true,
      index: true, // Index for date-based filtering
    },
    ewasteType: {
      type: String,
      enum: [
        "Household Electronics",
        "Household Appliances",
        "Lighting and Power Equipment",
        "Agricultural and Small Business Electronics",
        "Communication and Connectivity Devices",
      ],
      required: true,
    },
    ewasteSubtype: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // --- UPDATED/NEW FIELDS ---
    location: {
      // GeoJSON Point format
      type: {
        type: String,
        enum: ["Point"],
        // Not strictly required, in case geocoding fails
      },
      coordinates: {
        type: [Number], // [longitude, latitude] order
        // Index needed for geospatial queries
        index: "2dsphere",
      },
    },
    status: {
      type: String,
      enum: [
        "pending", // Newly created, awaiting agent acceptance
        "accepted", // Agent has accepted, not yet completed
        "completed", // Agent marked as completed
        "cancelled", // User or Admin cancelled
      ],
      default: "pending",
      index: true, // Index for status filtering
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollectionAgent",
      default: null,
      index: true, // Index for finding agent's assigned pickups
    },
    // --- END UPDATED/NEW FIELDS ---
  },
  {
    timestamps: true,
  }
);

// Compound index for finding available requests near a point
requestSchema.index({
  status: 1,
  assignedAgentId: 1,
  location: "2dsphere",
});
// Compound index for agent's assigned pickups filtered by status/date
requestSchema.index({ assignedAgentId: 1, status: 1, preferredDateTime: 1 });

module.exports = mongoose.model("CollectionRequest", requestSchema);