// src/models/admin.model.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  // --- UPDATED FIELDS FOR PASSWORD RESET CODE ---
  passwordResetCodeHash: {
    type: String, // Stores the HMAC hash of the 6-digit code
    index: true,  // Add index for faster lookup
  },
  passwordResetExpires: {
    type: Date, // Stores the expiry timestamp
  },
  // Optional: Field to track failed attempts for rate limiting
  // resetAttemptCount: {
  //   type: Number,
  //   default: 0,
  // },
  // --- END UPDATED FIELDS ---
}, {
  timestamps: true,
});

module.exports = mongoose.model('Admin', adminSchema);
