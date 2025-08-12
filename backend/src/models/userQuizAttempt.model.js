const mongoose = require("mongoose");

const userQuizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    score: {
      // Score out of 100
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    answers: {
      // Store the index of the answer submitted by the user for each question
      type: [Number],
      required: true,
    },
    // durationSeconds: { // Frontend can send this if needed
    //   type: Number,
    // },
  },
  {
    timestamps: true, // Records when the attempt was made
  }
);

// Index for efficient querying of attempts by user
userQuizAttemptSchema.index({ userId: 1 });
// Index for efficient querying of attempts for a specific quiz
userQuizAttemptSchema.index({ quizId: 1 });
// Compound index if querying user's attempts on a specific quiz often
userQuizAttemptSchema.index({ userId: 1, quizId: 1 });

module.exports = mongoose.model("UserQuizAttempt", userQuizAttemptSchema);