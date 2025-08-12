const Quiz = require("../models/quiz.model");
const VideoSuggestion = require("../models/videoSuggestion.model");
const UserQuizAttempt = require("../models/userQuizAttempt.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

// --- Quiz Functions ---

// @desc    Get all available quizzes (title, description, id)
// @route   GET /api/education/quizzes
// @access  Private (User)
const getAllQuizzes = async (req, res) => {
  try {
    // Select only necessary fields for the list view
    const quizzes = await Quiz.find({}).select("title description _id");
    res.status(200).json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
};

// @desc    Get a specific quiz by ID with questions
// @route   GET /api/education/quizzes/:quizId
// @access  Private (User)
const getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID format" });
    }

    // Exclude correct answer index and explanation when sending to user
    const quiz = await Quiz.findById(quizId).select("-questions.correctAnswerIndex -questions.explanation");


    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Optional: Shuffle questions or options here if desired
    // quiz.questions = shuffleArray(quiz.questions);
    // quiz.questions.forEach(q => q.options = shuffleArray(q.options));

    res.status(200).json(quiz);
  } catch (error) {
    console.error(`Error fetching quiz ${req.params.quizId}:`, error);
    res.status(500).json({ message: "Failed to fetch quiz details" });
  }
};

// @desc    Submit answers for a quiz
// @route   POST /api/education/quizzes/:quizId/submit
// @access  Private (User)
const submitQuiz = async (req, res) => {
  const session = await mongoose.startSession(); // Use transaction for multiple updates
  session.startTransaction();
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Expecting an array of selected answer indices
    const userId = req.user.id; // From authMiddleware

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid quiz ID format" });
    }

    if (!Array.isArray(answers)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Invalid answers format. Expected an array." });
    }

    // Fetch the quiz with correct answers (select necessary fields only)
    const quiz = await Quiz.findById(quizId)
      .select("questions.correctAnswerIndex questions.length")
      .session(session);

    if (!quiz) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (answers.length !== quiz.questions.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: Expected `${quiz.questions.length} answers, but received ${answers.length}.`,
      });
    }

    // Calculate score
    let correctAnswersCount = 0;
    quiz.questions.forEach((question, index) => {
      // Ensure answer is a number and matches the correct index
      if (
        typeof answers[index] === "number" &&
        answers[index] === question.correctAnswerIndex
      ) {
        correctAnswersCount++;
      }
    });

    const scorePerQuestion = 100 / quiz.questions.length; // 10 points if 10 questions
    const finalScore = Math.round(correctAnswersCount * scorePerQuestion);

    // Create quiz attempt record
    const attempt = new UserQuizAttempt({
      userId,
      quizId,
      score: finalScore,
      answers, // Store user's submitted answers
    });
    await attempt.save({ session });

    // Update user points and progress flag
    const user = await User.findById(userId).session(session);
    if (!user) {
      // Should not happen if auth middleware is working
      throw new Error("User not found during quiz submission.");
    }

    user.points = (user.points || 0) + finalScore; // Add score to total points
    if (!user.hasCompletedFirstQuiz) {
      user.hasCompletedFirstQuiz = true; // Mark first quiz completion
    }
    await user.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Quiz submitted successfully",
      score: finalScore,
      correctAnswersCount: correctAnswersCount,
      totalQuestions: quiz.questions.length,
      pointsEarned: finalScore, // Points earned in this attempt
      totalPoints: user.points, // User's new total points
      attemptId: attempt._id,
    });
  } catch (error) {
    // If anything fails, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.error(`Error submitting quiz ${req.params.quizId}:`, error);
    res.status(500).json({
      message: "Failed to submit quiz",
      error: error.message,
    });
  }
};

// --- Video Functions ---

// @desc    Get all video suggestions
// @route   GET /api/education/videos
// @access  Private (User)
const getAllVideos = async (req, res) => {
  try {
    const videos = await VideoSuggestion.find({});
    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Failed to fetch videos" });
  }
};

// @desc    Mark a video as watched by the user
// @route   POST /api/education/videos/watched
// @access  Private (User)
const markVideoWatched = async (req, res) => {
  try {
    const userId = req.user.id;
    // const { videoId } = req.body; // Optional: If you want to track which video

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let updated = false;
    if (user.watchedVideoCount < 3) {
      user.watchedVideoCount += 1;
      await user.save();
      updated = true;
    }

    res.status(200).json({
      message: updated
        ? "Video marked as watched."
        : "Video watch count already at maximum (3).",
      watchedVideoCount: user.watchedVideoCount,
    });
  } catch (error) {
    console.error("Error marking video as watched:", error);
    res
      .status(500)
      .json({ message: "Failed to mark video as watched" });
  }
};

// --- User Progress Function ---

// @desc    Get user's education progress and points
// @route   GET /api/education/progress
// @access  Private (User)
const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "points hasCompletedFirstQuiz watchedVideoCount"
    ); // Select only needed fields

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      points: user.points,
      hasCompletedQuiz: user.hasCompletedFirstQuiz, // Renamed for clarity
      watchedVideos: user.watchedVideoCount, // Renamed for clarity
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({ message: "Failed to fetch user progress" });
  }
};

module.exports = {
  getAllQuizzes,
  getQuizById,
  submitQuiz,
  getAllVideos,
  markVideoWatched,
  getUserProgress,
};