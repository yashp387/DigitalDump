// src/controllers/admin.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Import crypto for token generation
const Admin = require('../models/admin.model');
const { Resend } = require("resend"); // Import Resend
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables

// Initialize Resend (ensure process.env.RESEND_API_KEY is set)
const resend = new Resend(process.env.RESEND_API_KEY);

// --- HMAC Secret for Reset Codes ---
// IMPORTANT: Add a long, random string for this in your backend .env file!
// Example: RESET_HMAC_SECRET=a_very_long_random_string_of_at_least_32_bytes
const RESET_HMAC_SECRET = process.env.RESET_HMAC_SECRET;

if (!RESET_HMAC_SECRET || RESET_HMAC_SECRET.length < 32) {
    console.error("CRITICAL ERROR: RESET_HMAC_SECRET is not set or too short in .env! Password reset codes will not be secure.");
    // In a real production app, you might want to throw an error here
    // process.exit(1);
}


// --- Helper: Generate JWT Token ---
const generateToken = (admin) => {
  return jwt.sign({
    id: admin.id,
    email: admin.email,
    role: 'admin',
  }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expiry
  });
};

// --- Helper: Generate HMAC Hash for Code ---
const generateCodeHash = (code) => {
    if (!RESET_HMAC_SECRET) {
         // Throw here if secret is critical for operation
         throw new Error("HMAC Secret not configured, cannot generate code hash.");
    }
     // Use a strong, key-dependent hash (HMAC-SHA256)
    return crypto.createHmac('sha256', RESET_HMAC_SECRET).update(code).digest('hex');
};

// --- Helper: Generate Random 6-Digit Code ---
const generateSixDigitCode = () => {
    // Generate a random number between 100000 and 999999
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Ensure it's exactly 6 digits (should be, but as a safeguard)
    return code.padStart(6, '0');
};


// --- Helper: Send Password Reset Code Email ---
const sendPasswordResetCodeEmail = async (adminEmail, resetCode) => {
    // --- IMPORTANT: Replace with your verified domain email address ---
    const senderEmail = "welcome@4minmail.org"; // e.g., "noreply@your-domain.com" or a verified subdomain
     // --- END IMPORTANT ---

    const emailSubject = "Your Password Reset Code for E-Waste App Admin";

    const emailHtml = `
        <h1>Password Reset Code</h1>
        <p>You requested a password reset for your E-Waste App admin account.</p>
        <p>Your password reset code is:</p>
        <h2 style="color: #43A047; text-align: center;">${resetCode}</h2>
        <p>Enter this code on the website to reset your password.</p>
        <p>This code is valid for a short period (e.g., 15 minutes).</p>
        <br>
        <p>If you did not request a password reset, please ignore this email.</p>
        <br/>
        <p>The E-Waste App Team</p>
        <br/>
        <p><small>This is an automated email, please do not reply directly.</small></p>
    `;

    try {
        const { data, error } = await resend.emails.send({
            from: `E-Waste App Admin <${senderEmail}>`, // Sender format: "Name <email@domain.com>"
            to: [adminEmail], // 'to' expects an array of email addresses
            subject: emailSubject,
            html: emailHtml,
        });

        if (error) {
            console.error(`Resend API error sending password reset code email to ${adminEmail}:`, error);
             // Don't re-throw, allow forgotPassword to complete
            return;
        }

        console.log(`Password reset code email sent successfully to ${adminEmail}. Message ID: ${data.id}`);

    } catch (emailError) {
        console.error(`Unexpected error sending password reset code email to ${adminEmail}:`, emailError);
         // Don't re-throw
    }
};
// --- END NEW Helper ---


// --- Admin Sign Up ---
const signUp = async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body;

    // Check if the admin already exists (case-insensitive)
    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase() // Ensure case-insensitive check
    });
    if (existingAdmin) {
      console.warn(`Admin signup attempt with existing email: ${email}`);
      return res.status(400).json({
        message: 'Admin with this email already exists'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new admin
    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(), // Store email in lowercase
      password: hashedPassword,
    });

    await newAdmin.save();
    console.log(`New Admin ${newAdmin.email} created successfully with ID: ${newAdmin._id}`);

    // Note: Typically, admin signup might be a manual process or require
    // a specific invite mechanism in a production system for security.
    // Public signup might not be desired.

    res.status(201).json({
      message: 'Admin account created successfully',
      // Optionally return token here for immediate login
      // token: generateToken(newAdmin)
    });
  } catch (error) {
    console.error("Admin Sign Up Error:", error);
    if (error.code === 11000) { // Duplicate key error for unique fields
       return res.status(400).json({ message: 'An account with this email already exists.' });
    }
     if (error.name === 'ValidationError') { // Mongoose validation errors
         return res.status(400).json({ message: 'Validation failed.', errors: error.errors });
     }
    res.status(500).json({
      message: 'Failed to create admin account',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined, // Show detailed error in dev
    });
  }
};

// --- Admin Sign In ---
const signIn = async (req, res) => {
  console.log("--- Admin signIn controller reached ---"); // <-- Debugging log
  console.log("Request body:", req.body); // <-- Debugging log
  try {
    const {
      email,
      password
    } = req.body;

    // Basic validation
    if (!email || !password) {
        console.warn("Admin signin attempt missing email or password.");
        return res.status(400).json({ message: "Email and password are required." });
    }

    // Check if the admin exists (case-insensitive)
    const admin = await Admin.findOne({
      email: email.toLowerCase() // Ensure case-insensitive check
    });
    if (!admin) {
      console.warn(`Admin signin attempt for non-existent email: ${email}`);
      // Use generic message for security
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }
    console.log(`Admin found for email: ${email}`); // <-- Debugging log after finding user

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
       console.warn(`Admin signin attempt failed password for email: ${email}`);
       // Use generic message for security
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }
    console.log(`Password valid for admin: ${email}`); // <-- Debugging log after password check

    // Generate token upon successful authentication
    const token = generateToken(admin);
    console.log(`Admin ${admin.email} signed in successfully. Token generated.`);

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: { // Return essential admin info
        id: admin._id,
        email: admin.email,
        name: admin.name, // Include name from model
        role: 'admin',
      },
    });
     console.log("Admin signin response sent."); // <-- Debugging log after sending response
  } catch (error) {
    console.error("Admin Sign In Error:", error); // Log actual error
    res.status(500).json({
      message: 'Failed to login',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined, // Show detailed error in dev
    });
  }
};


// --- Forgot Password Request (Generates and sends code) ---
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
         console.log(`Received forgot password request for email: ${email}`); // Debugging log

        if (!email) {
            console.warn("Forgot password request missing email.");
            return res.status(400).json({ message: 'Email address is required.' });
        }

        // Find the admin by email (case-insensitive)
        const admin = await Admin.findOne({ email: email.toLowerCase() });

        // --- Security Measure: Always return a generic success message ---
        const genericSuccessMessage = 'If an account with that email exists, a password reset code has been sent.';

        if (!admin) {
            console.warn(`Forgot password code request for non-existent admin email: ${email}. Returning generic success.`);
             // Still attempt to send an empty email or delay response slightly to obscure existence
             // (Advanced security, for now just return success)
            return res.status(200).json({ message: genericSuccessMessage });
        }
        console.log(`Admin found for forgot password request: ${admin.email}`); // Debugging log

        // --- Generate and Store Reset Code ---
        const resetCode = generateSixDigitCode(); // Plain 6-digit code
        console.log(`Generated reset code (plain): ${resetCode}`); // WARNING: Don't log plain code in production!
        let resetCodeHash;
         try {
           resetCodeHash = generateCodeHash(resetCode); // HMAC hash of the code
         } catch (hmacError) {
              console.error("Error generating HMAC hash for reset code:", hmacError);
              // Return generic success to avoid revealing internal error, but log it.
               sendPasswordResetCodeEmail(admin.email, "--- Code Generation Failed ---"); // Optional: send a dummy email
              return res.status(200).json({ message: genericSuccessMessage });
         }


        admin.passwordResetCodeHash = resetCodeHash;
        // Code expires in 15 minutes (adjust as needed: 15 * 60 * 1000 ms)
        admin.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        // Optional: reset attempt count if using
        // admin.resetAttemptCount = 0;


        await admin.save(); // Save the admin with code details
        console.log(`Admin ${admin.email} updated with reset code hash and expiry.`); // Debugging log

        // --- Send Email with the Code ---
        // We don't await this strictly, email sending happens async.
        // The helper function contains its own try/catch.
        sendPasswordResetCodeEmail(admin.email, resetCode); // Send the plain code to the user

        // --- Return Generic Success Response ---
        console.log(`Forgot password request completed for ${email}. Sending generic success response.`); // Debugging log
        res.status(200).json({ message: genericSuccessMessage });

    } catch (error) {
        console.error("Forgot Password Code Error (in main catch block):", error); // Log actual error

         // Handle potential HMAC secret missing error explicitly
        if (error.message === "HMAC Secret not configured, cannot generate code hash.") {
             return res.status(500).json({ message: 'Server configuration error: HMAC secret missing.' });
        }
        // Handle other errors (e.g., DB save error)
        res.status(500).json({
            message: 'An error occurred while processing your request.', // Generic error message
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined, // Show detailed error in dev
        });
    }
};


// --- Reset Password with Code Verification ---
const resetPasswordWithCode = async (req, res) => {
    try {
        const { email, code, newPassword, confirmPassword } = req.body;
         console.log(`Received reset password with code request for email: ${email}, code: [HIDDEN]`); // Debugging log

        // --- Basic Validation ---
         if (!email || !code || !newPassword || !confirmPassword) {
             console.warn("Reset password with code attempt missing required fields.");
             return res.status(400).json({ message: 'Email, code, new password, and confirm password are required.' });
         }
         if (code.length !== 6 || !/^\d{6}$/.test(code)) {
             console.warn(`Invalid code format submitted for email ${email}: ${code}`);
             return res.status(400).json({ message: 'Invalid code format. Code must be 6 digits.' });
         }
        if (newPassword !== confirmPassword) {
             console.warn(`Passwords do not match for reset attempt for email ${email}.`);
            return res.status(400).json({ message: 'New password and confirm password do not match.' });
        }
        if (newPassword.length < 6) { // Should match schema or be configurable
             console.warn(`New password too short for reset attempt for email ${email}.`);
             return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        // Find the admin by email first
        const admin = await Admin.findOne({ email: email.toLowerCase() });

        if (!admin) {
             console.warn(`Reset password attempt with code for non-existent admin email: ${email}.`);
             // Return generic error for security
            return res.status(400).json({ message: 'Invalid email or code.' }); // Generic message
        }
         console.log(`Admin found for reset attempt: ${admin.email}`); // Debugging log

        // --- Rate Limiting / Attempt Tracking (Optional but Recommended) ---
        // Example (requires resetAttemptCount field in model):
        /*
        admin.resetAttemptCount = (admin.resetAttemptCount || 0) + 1;
        const MAX_ATTEMPTS = 5; // Define your limit
        if (admin.resetAttemptCount > MAX_ATTEMPTS) {
            // Invalidate the code and potentially lock the account temporarily
            admin.passwordResetCodeHash = undefined;
            admin.passwordResetExpires = undefined;
            // Also potentially set a lock timestamp
            await admin.save();
            console.warn(`Too many failed reset attempts for ${email}. Code invalidated.`);
            return res.status(429).json({ message: 'Too many attempts. Please request a new code.' }); // 429 Too Many Requests
        }
        // Save attempts before code check so malicious attempts increment count
        await admin.save();
        */


        // --- Verify the Code and Expiry ---
        // Generate the HMAC hash of the submitted code
        let submittedCodeHash;
        try {
           submittedCodeHash = generateCodeHash(code); // Use the same helper
        } catch (hmacError) {
            console.error("Error generating HMAC hash for submitted code in reset:", hmacError);
             // Return generic error for security
             // Optional: Decrement attempt count if you incremented earlier and failed here
             return res.status(400).json({ message: 'Invalid email or code.' });
        }

        // Compare submitted hash with stored hash AND check expiry
        const isCodeValid = admin.passwordResetCodeHash === submittedCodeHash;
        const isCodeExpired = admin.passwordResetExpires < Date.now();

        if (!isCodeValid || isCodeExpired) {
             console.warn(`Password reset attempt failed for ${email}: Code invalid (${!isCodeValid}) or expired (${isCodeExpired}).`);
             // Optional: Increment attempt count on admin document and save here if you didn't earlier
             // admin.resetAttemptCount = (admin.resetAttemptCount || 0) + 1;
             // await admin.save(); // Save updated attempt count

            return res.status(400).json({ message: 'Invalid email or code.' }); // Generic error message
        }
        console.log(`Code and expiry valid for admin: ${admin.email}`); // Debugging log

        // --- Code and Expiry are Valid - Proceed with Password Reset ---

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(`New password hashed for admin: ${admin.email}`); // Debugging log

        // Update Admin Document
        admin.password = hashedPassword; // Set the new password
        admin.passwordResetCodeHash = undefined; // Invalidate the code hash
        admin.passwordResetExpires = undefined; // Invalidate the expiry date
        // Optional: reset attempt count
        // admin.resetAttemptCount = 0; // Reset attempts on success


        await admin.save(); // Save the updated admin document
        console.log(`Admin ${admin.email} password reset successfully and code invalidated.`); // Debugging log

        // --- Send Success Response ---
        res.status(200).json({ message: 'Password reset successfully. You can now sign in with your new password.' });
        console.log("Reset password with code response sent."); // Debugging log

    } catch (error) {
        console.error("Reset Password With Code Error (in main catch block):", error); // Log actual error
         // Handle potential HMAC secret missing error explicitly (less likely here if checked in forgotPassword)
        if (error.message === "HMAC Secret not configured, cannot generate code hash.") {
             return res.status(500).json({ message: 'Server configuration error: HMAC secret missing.' });
        }
        // Handle other errors (e.g., DB save error)
        res.status(500).json({
            message: 'An error occurred while resetting your password.',
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined, // Show detailed error in dev
        });
    }
};


// --- Admin Protected Route (Existing - no change) ---
const adminProtected = (req, res) => {
  // If the request reaches here, authenticate and authorize middleware passed
  res.status(200).json({
    message: "Admin access granted to protected route.",
    adminId: req.user.id, // Access user info attached by middleware
    adminEmail: req.user.email,
  });
};

module.exports = {
  signUp,
  signIn,
  adminProtected,
  forgotPassword, // Export the updated forgotPassword
  resetPasswordWithCode, // Export the new resetPasswordWithCode
  // Note: If you removed the token-based reset route, do not export resetPassword
};
