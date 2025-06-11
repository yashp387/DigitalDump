const mongoose = require("mongoose");

const collectionAgentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address."],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must be at least 6 characters long."],
    },
    address: {
      street: { type: String, required: true, trim: true },
      area: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      },
    },
    certificatePath: {
      type: String,
      required: [true, "GPCB Certificate is required."],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // --- NEW: Status Field ---
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    }
    // --- END NEW ---
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CollectionAgent", collectionAgentSchema);
