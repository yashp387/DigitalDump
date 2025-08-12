const mongoose = require("mongoose");
const generateReferralCode = require("../../utils/referralCodeGenerator");

const userSchema = new mongoose.Schema(
  {
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
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    hasCompletedFirstQuiz: {
      type: Boolean,
      default: false,
    },
    watchedVideoCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    // --- NEW: Status Field ---
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    // --- END NEW ---
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isNew && !this.referralCode) {
    let uniqueCodeFound = false;
    let potentialCode;
    while (!uniqueCodeFound) {
      potentialCode = generateReferralCode(8);
      try {
        const existingUser = await mongoose.models.User.findOne({
          referralCode: potentialCode,
        });
        if (!existingUser) {
          uniqueCodeFound = true;
        }
      } catch (error) {
        console.error("Error checking referral code uniqueness:", error);
        return next(error);
      }
    }
    this.referralCode = potentialCode;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
