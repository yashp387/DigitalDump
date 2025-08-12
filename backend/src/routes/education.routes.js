const express = require("express");
const router = express.Router();
const educationController = require("../controllers/education.controller");
const { authenticate, authorize } = require("../../src/middleware/authMiddleware"); // Correct path

// All education routes require a logged-in user
router.use(authenticate);
router.use(authorize(["user"])); // Ensure only users with 'user' role access these

// Quiz Routes
router.get("/quizzes", educationController.getAllQuizzes);
router.get("/quizzes/:quizId", educationController.getQuizById);
router.post("/quizzes/:quizId/submit", educationController.submitQuiz);

// Video Routes
router.get("/videos", educationController.getAllVideos);
router.post("/videos/watched", educationController.markVideoWatched); // Endpoint to mark a video watched

// Progress Route
router.get("/progress", educationController.getUserProgress);

module.exports = router;