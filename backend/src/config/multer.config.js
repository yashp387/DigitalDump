// src/config/multer.config.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the base upload directory exists relative to the project root
// __dirname is the directory of the current file (src/config)
// Use path.join to go up one level to src, then another to the backend root
const baseDir = path.join(__dirname, "..", ".."); // Navigate up two levels from src/config to backend root
const uploadBaseDir = process.env.UPLOAD_DIR || path.join(baseDir, "uploads"); // Default to backend/uploads
const certificateDir = path.join(uploadBaseDir, "certificates");

console.log(`[Multer Config] Base directory resolved to: ${baseDir}`);
console.log(`[Multer Config] Upload directory target: ${certificateDir}`);

// Create directory if it doesn't exist
if (!fs.existsSync(certificateDir)) {
  try {
    fs.mkdirSync(certificateDir, { recursive: true });
    console.log(`[Multer Config] Created directory: ${certificateDir}`);
  } catch (err) {
    console.error(`[Multer Config] ERROR creating directory ${certificateDir}:`, err);
    // Depending on severity, you might want to exit or throw
  }
} else {
  console.log(`[Multer Config] Upload directory already exists: ${certificateDir}`);
}

// Configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Log when multer tries to determine the destination
    console.log(
      `[Multer Storage] Destination function called for file: ${file.originalname}`
    );
    // Check if the directory actually exists right before saving
    if (!fs.existsSync(certificateDir)) {
        console.error(`[Multer Storage] ERROR: Destination directory ${certificateDir} does not exist!`);
        // Pass an error to multer
        return cb(new Error(`Upload destination directory ${certificateDir} not found.`), null);
    }
    // Pass the directory path to multer
    cb(null, certificateDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to avoid collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname); // Get file extension
    const filename = file.fieldname + "-" + uniqueSuffix + extension;
    // Log the generated filename
    console.log(`[Multer Storage] Generating filename: ${filename}`);
    // Pass the generated filename to multer
    cb(null, filename);
  },
});

// --- TEMPORARILY SIMPLIFIED MULTER OPTIONS FOR DEBUGGING ---
// Configure Multer instance WITHOUT filter and limits
const upload = multer({
  storage: storage, // Use the configured disk storage
  // fileFilter: fileFilter, // <-- Temporarily COMMENTED OUT for debugging
  // limits: { fileSize: 1024 * 1024 * 5 }, // <-- Temporarily COMMENTED OUT for debugging
});
console.log(
  "--- [Multer Config] Multer instance configured WITHOUT fileFilter and limits for debugging ---"
);
// --- END SIMPLIFICATION ---

// Export the configured multer instance
module.exports = upload;

// --- Original fileFilter (kept commented for reference) ---
/*
const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const fileFilter = (req, file, cb) => {
  console.log("--- Multer File Filter ---");
  console.log("Received file object:", file);
  console.log("Received mimetype:", file.mimetype);
  console.log("Is mimetype allowed?", allowedMimeTypes.includes(file.mimetype));

  if (allowedMimeTypes.includes(file.mimetype)) {
    console.log("Mimetype allowed. Accepting file.");
    cb(null, true); // Accept file
  } else {
    console.log(`Mimetype (${file.mimetype}) NOT allowed. Rejecting file.`);
    // Reject file and pass an error
    cb(
      new Error(
        `Invalid file type (${file.mimetype}). Only PDF, JPG, PNG allowed.`
      ),
      false
    );
  }
};
*/
