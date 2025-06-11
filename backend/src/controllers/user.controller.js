// src/controllers/user.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const { Resend } = require("resend"); // Import Resend
const dotenv = require("dotenv");
dotenv.config();

// Initialize Resend with API key from environment variables
// Ensure RESEND_API_KEY is set in your .env file
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Helper: Generate JWT Token ---
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: "user",
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// --- Helper: Send Welcome Email (with error handling) ---
const sendWelcomeEmail = async (userEmail, userName) => {
  // Define sender email and subject directly
  const senderEmail = "welcome@4minmail.org"; // REPLACE with your verified Resend domain email
  const emailSubject = "Welcome to the E-Waste App!";

  // Define email HTML content directly
  const emailHtml = `
    <h1>Hi ${userName},</h1>
    <p>Welcome to the E-Waste Recycling App!</p>
    <p>We're excited to have you join our community dedicated to responsible e-waste disposal.</p>
    <p>You can now explore educational resources, participate in quizzes, request pickups, and earn points for your contributions.</p>
    <br>
    <p>Happy recycling!</p>
    <p>The E-Waste App Team</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: `E-Waste App <${senderEmail}>`, // Format: Name <email@domain.com>
      to: [userEmail], // Resend expects an array of emails
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      // Log the error but don't throw, allowing signup to succeed
      console.error(
        `Resend API error sending welcome email to ${userEmail}:`,
        error
      );
      return; // Exit the helper function on error
    }

    console.log(
      `Welcome email sent successfully to ${userEmail}. Message ID: ${data.id}`
    );
  } catch (emailError) {
    // Catch any unexpected errors during the API call
    console.error(
      `Unexpected error sending welcome email to ${userEmail}:`,
      emailError
    );
    // Do not re-throw, let the signup process continue
  }
};

// --- Sign Up ---
const signUp = async (req, res) => {
  let newUser = null; // Define newUser outside the try block for potential access in finally/catch if needed

  try {
    const {
      name,
      email,
      phone,
      address,
      password,
      enteredReferralCode,
    } = req.body;

    // --- Basic Validation ---
    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // --- Existing User Check ---
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // --- Hash Password ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Create New User ---
    newUser = new User({
      name,
      email: email.toLowerCase(),
      phone,
      address,
      password: hashedPassword,
      points: 0,
    });

    // --- Save New User ---
    // The pre-save hook in user.model.js generates the referralCode
    await newUser.save();
    console.log(`User ${newUser.email} created successfully.`);

    // --- Referral Bonus Logic (After successful save) ---
    if (
      enteredReferralCode &&
      typeof enteredReferralCode === "string" &&
      enteredReferralCode.trim().length > 0
    ) {
      const codeToFind = enteredReferralCode.trim().toUpperCase();
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const referrer = await User.findOne({ referralCode: codeToFind }).session(
          session
        );

        if (referrer && referrer._id.toString() !== newUser._id.toString()) {
          referrer.points = (referrer.points || 0) + 100;
          newUser.points = (newUser.points || 0) + 100; // Award points to new user too

          await referrer.save({ session });
          await newUser.save({ session }); // Save newUser again to update points

          console.log(
            `Referral bonus applied: ${referrer.email} referred ${newUser.email}`
          );
          await session.commitTransaction();
        } else {
          console.warn(
            `Referral code "${codeToFind}" entered by ${newUser.email} not found or invalid.`
          );
          await session.abortTransaction();
        }
      } catch (bonusError) {
        console.error("Error applying referral bonus:", bonusError);
        await session.abortTransaction();
      } finally {
        session.endSession();
      }
    }
    // --- End Referral Bonus Logic ---

    // --- Send Welcome Email (AFTER user save and referral logic) ---
    // We call this function but don't await it strictly if we don't want
    // it to block the response. However, for clarity and potential future
    // needs, awaiting it within its own error boundary is fine.
    // Crucially, failure inside sendWelcomeEmail will be logged but won't stop the signup.
    await sendWelcomeEmail(newUser.email, newUser.name);
    // --- End Welcome Email ---

    // --- Generate Token & Respond ---
    const token = generateToken(newUser);

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        points: newUser.points,
        referralCode: newUser.referralCode,
      },
    });
  } catch (error) {
    console.error("Error during sign up:", error);
    // Handle Mongoose validation errors specifically
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed.", errors: error.errors });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }
    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// --- Sign In (No changes needed from previous version) ---
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "user",
        points: user.points,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    console.error("Error during sign in:", error);
    res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
};

// --- User Protected Route (No changes needed) ---
const userProtected = (req, res) => {
  res.status(200).json({
    message: "User access granted",
  });
};

module.exports = {
  signUp,
  signIn,
  userProtected,
};