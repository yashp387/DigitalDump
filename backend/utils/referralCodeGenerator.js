const crypto = require("crypto");

/**
 * Generates a random alphanumeric string of a specified length.
 * @param {number} length The desired length of the code (default: 8).
 * @returns {string} A random alphanumeric string.
 */
const generateReferralCode = (length = 8) => {
  // Use crypto for better randomness than Math.random
  // Generate slightly more bytes than needed to account for non-alphanumeric chars
  const byteLength = Math.ceil((length * 3) / 4);
  const buffer = crypto.randomBytes(byteLength);
  // Convert to base64 and remove non-alphanumeric characters
  const base64 = buffer.toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  // Take the first 'length' characters
  return base64.slice(0, length).toUpperCase(); // Make it uppercase for consistency
};

module.exports = generateReferralCode;