const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ], // Array of possible answers
  correctAnswerIndex: {
    type: Number,
    required: true,
  }, // Index of the correct answer in the options array
  explanation: {
    // Optional explanation for the answer
    type: String,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: [
        (val) => val.length > 0 && val.length <= 10, // Ensure 1 to 10 questions
        "Quiz must have between 1 and 10 questions.",
      ],
    },
    // You could add difficulty, category etc. later if needed
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quiz", quizSchema);