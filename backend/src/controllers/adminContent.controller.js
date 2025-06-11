const Quiz = require("../models/quiz.model");
const VideoSuggestion = require("../models/videoSuggestion.model");
const mongoose = require("mongoose");

// Helper function for consistent error responses
const handleError = (res, error, message = "An internal server error occurred", statusCode = 500) => {
  console.error(`${message}:`, error);
  // Avoid sending detailed internal errors in production
  const responseMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? "An internal server error occurred."
    : error.message || message;
  res.status(statusCode).json({ message: responseMessage });
};

// @desc    Create a new Quiz
// @route   POST /api/admin/content/quizzes
// @access  Private (Admin)
const createQuiz = async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    if (!title || !description || !questions) {
      return handleError(res, new Error("Missing required fields"), "Title, description, and questions are required.", 400);
    }
    if (!Array.isArray(questions) || questions.length === 0 || questions.length > 10) {
      return handleError(res, new Error("Invalid questions format"), "Quiz must have between 1 and 10 questions.", 400);
    }

    for (const q of questions) {
      if (!q.questionText || !q.options || !Array.isArray(q.options) || q.options.length !== 4 || q.correctAnswerIndex === undefined) {
        return handleError(res, new Error("Invalid question structure"), "Each question must have text, 4 options, and a correct answer index.", 400);
      }
      if (typeof q.correctAnswerIndex !== 'number' || q.correctAnswerIndex < 0 || q.correctAnswerIndex > 3) {
        return handleError(res, new Error("Invalid correct answer index"), "Correct answer index must be between 0 and 3.", 400);
      }
      if (q.options.some(opt => typeof opt !== 'string' || opt.trim() === '')) {
         return handleError(res, new Error("Invalid option format"), "All options must be non-empty strings.", 400);
      }
    }

    const existingQuiz = await Quiz.findOne({ title });
    if (existingQuiz) {
      return handleError(res, new Error("Duplicate title"), `A quiz with the title "${title}" already exists.`, 409); // Corrected message syntax
    }

    const newQuiz = new Quiz({
      title,
      description,
      questions,
    });

    const savedQuiz = await newQuiz.save();

    res.status(201).json({
      message: "Quiz created successfully.",
      quiz: savedQuiz,
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
       return handleError(res, error, "Validation failed.", 400);
    }
    handleError(res, error, "Failed to create quiz.");
  }
};

// --- NEW: Get all Quizzes ---
// @desc    Get all Quizzes
// @route   GET /api/admin/content/quizzes
// @access  Private (Admin)
const getAllQuizzes = async (req, res) => {
  try {
    // Exclude sensitive/large fields like question details if not needed for list view
    const quizzes = await Quiz.find({}).select('-questions -__v').sort({ createdAt: -1 });

    res.status(200).json(quizzes);
  } catch (error) {
    handleError(res, error, "Failed to fetch all quizzes.");
  }
};
// --- END NEW ---

// --- NEW: Delete Quiz by ID ---
// @desc    Delete a Quiz
// @route   DELETE /api/admin/content/quizzes/:quizId
// @access  Private (Admin)
const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return handleError(res, new Error("Invalid quiz ID format."), null, 400);
    }

    const deletedQuiz = await Quiz.findByIdAndDelete(quizId);

    if (!deletedQuiz) {
      return handleError(res, new Error("Quiz not found."), null, 404);
    }

    res.status(200).json({
      message: "Quiz deleted successfully.",
      quiz: {
        id: deletedQuiz._id,
        title: deletedQuiz.title,
        // Return minimal info
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to delete quiz.");
  }
};
// --- END NEW ---


// @desc    Create a new Video Suggestion
// @route   POST /api/admin/content/videos
// @access  Private (Admin)
const createVideoSuggestion = async (req, res) => {
  try {
    const { title, youtubeVideoId, description } = req.body;

    if (!title || !youtubeVideoId || !description) {
      return handleError(res, new Error("Missing required fields"), "Title, YouTube Video ID, and description are required.", 400);
    }
    if (typeof title !== 'string' || typeof youtubeVideoId !== 'string' || typeof description !== 'string') {
        return handleError(res, new Error("Invalid data types"), "Fields must be strings.", 400);
    }
     if (youtubeVideoId.trim() === '' || title.trim() === '' || description.trim() === '') {
        return handleError(res, new Error("Fields cannot be empty"), "Fields cannot be empty.", 400);
    }

    const existingVideo = await VideoSuggestion.findOne({ youtubeVideoId });
    if (existingVideo) {
      return handleError(res, new Error("Duplicate video ID"), `A video suggestion with the ID "${youtubeVideoId}" already exists.`, 409); // Corrected message syntax
    }

    const newVideo = new VideoSuggestion({
      title,
      youtubeVideoId,
      description,
    });

    const savedVideo = await newVideo.save();

    res.status(201).json({
      message: "Video suggestion created successfully.",
      video: savedVideo,
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
       return handleError(res, error, "Validation failed.", 400);
    }
    handleError(res, error, "Failed to create video suggestion.");
  }
};

// --- NEW: Get all Video Suggestions ---
// @desc    Get all Video Suggestions
// @route   GET /api/admin/content/videos
// @access  Private (Admin)
const getAllVideoSuggestions = async (req, res) => {
  try {
    const videos = await VideoSuggestion.find({}).select('-__v').sort({ createdAt: -1 }); // Exclude __v

    res.status(200).json(videos);
  } catch (error) {
    handleError(res, error, "Failed to fetch all video suggestions.");
  }
};
// --- END NEW ---

// --- NEW: Delete Video Suggestion by ID ---
// @desc    Delete a Video Suggestion
// @route   DELETE /api/admin/content/videos/:videoId
// @access  Private (Admin)
const deleteVideoSuggestion = async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return handleError(res, new Error("Invalid video ID format."), null, 400);
    }

    const deletedVideo = await VideoSuggestion.findByIdAndDelete(videoId);

    if (!deletedVideo) {
      return handleError(res, new Error("Video suggestion not found."), null, 404);
    }

    res.status(200).json({
      message: "Video suggestion deleted successfully.",
       video: {
        id: deletedVideo._id,
        title: deletedVideo.title,
         // Return minimal info
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to delete video suggestion.");
  }
};
// --- END NEW ---


module.exports = {
  createQuiz,
  getAllQuizzes, // Export the new function
  deleteQuiz, // Export the new function
  createVideoSuggestion,
  getAllVideoSuggestions, // Export the new function
  deleteVideoSuggestion, // Export the new function
};
