// backend/src/routes/adminContent.routes.js
const express = require("express");
const router = express.Router();
const adminContentController = require("../controllers/adminContent.controller");
const { authenticate, authorize } = require("../../src/middleware/authMiddleware"); // Adjust path if needed

// Protect all content management routes: require authentication and admin role
router.use(authenticate);
router.use(authorize(["admin"]));

// Routes for Quizzes
router.post("/quizzes", adminContentController.createQuiz);
router.get("/quizzes", adminContentController.getAllQuizzes); // <-- This GET route is needed
router.delete("/quizzes/:quizId", adminContentController.deleteQuiz); // <-- This DELETE route is needed


// Routes for Video Suggestions
router.post("/videos", adminContentController.createVideoSuggestion);
router.get("/videos", adminContentController.getAllVideoSuggestions); // <-- This GET route is needed
router.delete("/videos/:videoId", adminContentController.deleteVideoSuggestion); // <-- This DELETE route is needed


module.exports = router;
