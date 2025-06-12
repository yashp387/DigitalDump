// frontend/src/pages/AdminEducationalContent.tsx
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  // Corrected Import Names to match api.ts
  createAdminQuiz,
  createAdminVideoSuggestion,
  getAdminAllQuizzes,
  deleteAdminQuiz,
  getAdminAllVideoSuggestions,
  deleteAdminVideoSuggestion,
} from "../services/api";

// Define types for Quiz Question form state
interface QuizQuestionFormState {
  questionText: string;
  options: string[]; // Array of 4 strings
  correctAnswerIndex: number | null; // Index (0-3)
  // explanation: string; // Add if you include explanation in schema and form
}

// Define types for fetched content data (based on backend responses)
interface FetchedQuiz {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface FetchedVideo {
  _id: string;
  title: string;
  youtubeVideoId: string;
  description: string;
  videoUrl: string; // This is a virtual property added by the backend model
  thumbnailUrl: string; // Also a virtual property often needed for display
  createdAt: string;
  updatedAt: string;
}


const AdminEducationalContent: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("quiz");

  // --- State for Quiz Form ---
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<
    QuizQuestionFormState[]
  >([
    { questionText: "", options: ["", "", "", ""], correctAnswerIndex: null },
  ]);
  const [quizFormErrors, setQuizFormErrors] = useState<string[]>([]);
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false);
  // --- End State for Quiz Form ---

  // --- State for Video Form ---
  const [videoTitle, setVideoTitle] = useState("");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoFormErrors, setVideoFormErrors] = useState<string[]>([]);
  const [isVideoSubmitting, setIsVideoSubmitting] = useState(false);
  // --- End State for Video Form ---

  // --- State for Content Lists ---
  const [quizzesList, setQuizzesList] = useState<FetchedQuiz[]>([]);
  const [videosList, setVideosList] = useState<FetchedVideo[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(
    null,
  ); // To track which item is being deleted
  // --- End State for Content Lists ---


  // --- State for Toast Notification ---
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const showToastMessage = (message: string, type: "success" | "error") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  // --- Fetch Content Lists Effect ---
  const fetchContentLists = async () => {
    setIsLoadingContent(true);
    setContentError(null);
    try {
      // Fetch quizzes and videos concurrently
      const [quizzes, videos] = await Promise.all([
        getAdminAllQuizzes(),
        getAdminAllVideoSuggestions(),
      ]);
      setQuizzesList(quizzes || []); // Ensure setting to empty array if null/undefined
      setVideosList(videos || []); // Ensure setting to empty array if null/undefined
    } catch (err: any) {
      console.error("Failed to fetch content lists:", err);
      // Display the backend error message if available, otherwise a generic one
      const errorMsg = err.response?.data?.message || err.message || "Failed to load content due to network or server error.";
      setContentError(errorMsg);
    } finally {
      setIsLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchContentLists();
  }, []);


  // --- Quiz Form Handlers (unchanged, using createAdminQuiz) ---
  const handleAddQuizQuestion = () => {
    if (quizQuestions.length < 10) {
      setQuizQuestions([
        ...quizQuestions,
        { questionText: "", options: ["", "", "", ""], correctAnswerIndex: null },
      ]);
    } else {
      showToastMessage("Maximum 10 questions allowed per quiz.", "error");
    }
  };

  const handleRemoveQuizQuestion = (index: number) => {
    if (quizQuestions.length > 1) {
      setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
    } else {
      showToastMessage("Quiz must have at least one question.", "error");
    }
  };

  const handleQuizQuestionChange = (
    index: number,
    field: keyof QuizQuestionFormState,
    value: any,
    optionIndex?: number,
  ) => {
    const newQuestions = [...quizQuestions];
    if (field === "options" && optionIndex !== undefined) {
      newQuestions[index].options[optionIndex] = value;
    } else if (field !== "options") {
      // @ts-ignore
      newQuestions[index][field] = value;
    }
    setQuizQuestions(newQuestions);
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuizFormErrors([]);
    setIsQuizSubmitting(true);

    const errors: string[] = [];
    if (!quizTitle.trim()) errors.push("Quiz title is required.");
    if (!quizDescription.trim()) errors.push("Quiz description is required.");
    if (quizQuestions.length === 0 || quizQuestions.length > 10) {
      errors.push("Quiz must have between 1 and 10 questions.");
    }

    quizQuestions.forEach((q, qIndex) => {
      if (!q.questionText?.trim()) // Added optional chaining
        errors.push(`Question ${qIndex + 1}: Question text is required.`);
      if (
        !Array.isArray(q.options) || q.options.length !== 4 ||
        q.options.some((opt) => typeof opt !== "string" || opt.trim() === "")
      ) {
        errors.push(`Question ${qIndex + 1}: Must have exactly 4 non-empty options.`);
      }
      if (
        q.correctAnswerIndex === null ||
        typeof q.correctAnswerIndex !== 'number' || // Added type check
        q.correctAnswerIndex < 0 ||
        q.correctAnswerIndex > 3
      ) {
        errors.push(`Question ${qIndex + 1}: A correct answer must be selected.`);
      }
    });

    if (errors.length > 0) {
      setQuizFormErrors(errors);
      setIsQuizSubmitting(false);
      showToastMessage("Please fix the errors in the form.", "error");
      return;
    }

    const questionsForBackend = quizQuestions.map((q) => ({
      questionText: q.questionText.trim(),
      options: q.options.map((opt) => opt.trim()),
      correctAnswerIndex: q.correctAnswerIndex,
    }));

    try {
      const response = await createAdminQuiz({
        title: quizTitle.trim(),
        description: quizDescription.trim(),
        questions: questionsForBackend,
      });

      showToastMessage(response.message || "Quiz created successfully!", "success");

      setQuizTitle("");
      setQuizDescription("");
      setQuizQuestions([{ questionText: "", options: ["", "", "", ""], correctAnswerIndex: null }]);
      setQuizFormErrors([]);

      fetchContentLists();

    } catch (err: any) {
      console.error("Error creating quiz:", err);
      const errorMsg = err.response?.data?.message || "Failed to create quiz.";
      setQuizFormErrors([errorMsg]);
      showToastMessage(errorMsg, "error");
    } finally {
      setIsQuizSubmitting(false);
    }
  };
  // --- End Quiz Form Handlers ---


  // --- Video Form Handlers (unchanged, using createAdminVideoSuggestion) ---
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoFormErrors([]);
    setIsVideoSubmitting(true);

    const errors: string[] = [];
    if (!videoTitle.trim()) errors.push("Video title is required.");
    if (!youtubeVideoId.trim()) errors.push("YouTube Video ID is required.");
    if (!videoDescription.trim()) errors.push("Video description is required.");

    if (youtubeVideoId.trim().length !== 11) {
      errors.push("Please enter a valid 11-character YouTube Video ID.");
    }

    if (errors.length > 0) {
      setVideoFormErrors(errors);
      setIsVideoSubmitting(false);
      showToastMessage("Please fix the errors in the form.", "error");
      return;
    }

    try {
      const response = await createAdminVideoSuggestion({
        title: videoTitle.trim(),
        youtubeVideoId: youtubeVideoId.trim(),
        description: videoDescription.trim(),
      });

      showToastMessage(response.message || "Video suggestion created successfully!", "success");

      setVideoTitle("");
      setYoutubeVideoId("");
      setVideoDescription("");
      setVideoFormErrors([]);

      fetchContentLists();

    } catch (err: any) {
      console.error("Error creating video suggestion:", err);
      const errorMsg = err.response?.data?.message || "Failed to create video suggestion.";
      setVideoFormErrors([errorMsg]);
      showToastMessage(errorMsg, "error");
    } finally {
      setIsVideoSubmitting(false);
    }
  };
  // --- End Video Form Handlers ---

  // --- Content Deletion Handlers (unchanged, using deleteAdminQuiz, deleteAdminVideoSuggestion) ---
  const handleDeleteQuiz = async (quizId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")
    ) {
      return;
    }
    setDeletingContentId(quizId);
    try {
      const response = await deleteAdminQuiz(quizId);
      showToastMessage(response.message || "Quiz deleted successfully.", "success");
      fetchContentLists();
    } catch (err: any) {
      console.error(`Error deleting quiz ${quizId}:`, err);
      const errorMsg = err.response?.data?.message || "Failed to delete quiz.";
      showToastMessage(errorMsg, "error");
    } finally {
      setDeletingContentId(null);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this video suggestion? This action cannot be undone.")
    ) {
      return;
    }
    setDeletingContentId(videoId);
    try {
      const response = await deleteAdminVideoSuggestion(videoId);
      showToastMessage(response.message || "Video suggestion deleted successfully.", "success");
      fetchContentLists();
    } catch (err: any) {
      console.error(`Error deleting video suggestion ${videoId}:`, err);
      const errorMsg =
        err.response?.data?.message || "Failed to delete video suggestion.";
      showToastMessage(errorMsg, "error");
    } finally {
      setDeletingContentId(null);
    }
  };
  // --- End Content Deletion Handlers ---

  // Handler for logging out (assuming standard admin logout)
  const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
       localStorage.removeItem("userId");
       localStorage.removeItem("userEmail");

      navigate("/admin/signin");
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Educational Content Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage quizzes and video suggestions for users.
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="text-indigo-600 hover:text-indigo-700 cursor-pointer !rounded-button"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Educational Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-8 min-h-[600px]">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Manage Content
            </h2>
            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === "quiz" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"} whitespace-nowrap !rounded-button`}
                onClick={() => setActiveTab("quiz")}
              >
                Quiz Creation & Management
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === "video" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"} whitespace-nowrap !rounded-button`}
                onClick={() => setActiveTab("video")}
              >
                Video Suggestions Management
              </button>
            </div>

            {/* Quiz Section */}
            {activeTab === "quiz" && (
              <div className="space-y-10">

                {/* Quiz Creation Form */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Create New Quiz
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <form onSubmit={handleQuizSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quiz Title
                        </label>
                        <input
                          type="text"
                          value={quizTitle}
                          onChange={(e) => setQuizTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                          placeholder="Enter quiz title"
                          disabled={isQuizSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quiz Description
                        </label>
                        <textarea
                          value={quizDescription}
                          onChange={(e) => setQuizDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                          placeholder="Enter quiz description"
                          rows={2}
                          disabled={isQuizSubmitting}
                        ></textarea>
                      </div>

                      <h4 className="text-md font-semibold text-gray-800 mt-6 mb-4">
                        Questions ({quizQuestions.length}/10)
                      </h4>
                      {quizQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 space-y-4 relative">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-700">Question {qIndex + 1}</p>
                            {quizQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveQuizQuestion(qIndex)}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                disabled={isQuizSubmitting || quizQuestions.length <= 1}
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Question Text
                            </label>
                            <textarea
                              value={q.questionText}
                              onChange={(e) =>
                                handleQuizQuestionChange(
                                  qIndex,
                                  "questionText",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                              placeholder="Enter your question here"
                              rows={2}
                              disabled={isQuizSubmitting}
                            ></textarea>
                          </div>

                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Options (Select the correct one)
                            </label>
                            {[0, 1, 2, 3].map((optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`correctAnswer-${qIndex}`}
                                  checked={q.correctAnswerIndex === optIndex}
                                  onChange={() =>
                                    handleQuizQuestionChange(
                                      qIndex,
                                      "correctAnswerIndex",
                                      optIndex,
                                    )
                                  }
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                  disabled={isQuizSubmitting}
                                />
                                <input
                                  type="text"
                                  value={q.options[optIndex]}
                                  onChange={(e) =>
                                    handleQuizQuestionChange(
                                      qIndex,
                                      "options",
                                      e.target.value,
                                      optIndex,
                                    )
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                                  placeholder={`Option ${optIndex + 1}`}
                                  disabled={isQuizSubmitting}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {quizQuestions.length < 10 && (
                        <button
                          type="button"
                          onClick={handleAddQuizQuestion}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer whitespace-nowrap !rounded-button disabled:opacity-50 mt-4"
                          disabled={isQuizSubmitting || quizQuestions.length >= 10}
                        >
                          <i className="fas fa-plus mr-2"></i>
                          Add Question
                        </button>
                      )}

                      {quizFormErrors.length > 0 && (
                        <div className="mt-4">
                          <p className="text-red-600 font-medium mb-2">Please correct the following errors:</p>
                          <ul className="list-disc list-inside text-red-600 text-sm">
                            {quizFormErrors.map((err, index) => <li key={index}>{err}</li>)}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-end mt-6">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap !rounded-button disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isQuizSubmitting}
                        >
                          {isQuizSubmitting ? (
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                          ) : (
                            <i className="fas fa-save mr-2"></i>
                          )}
                          {isQuizSubmitting ? "Saving Quiz..." : "Save Quiz"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Current Quizzes List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Current Quizzes
                  </h3>
                  {isLoadingContent ? (
                    <div className="text-center py-8">
                      <i className="fas fa-spinner fa-spin text-indigo-600 text-3xl"></i>
                      <p className="mt-2 text-gray-600">Loading quizzes...</p>
                    </div>
                  ) : contentError ? (
                    <div className="text-red-600 text-center py-8">
                      <i className="fas fa-exclamation-circle mr-2"></i> {contentError}
                    </div>
                  ) : quizzesList.length === 0 ? (
                    <div className="text-gray-600 text-center py-8">
                      <i className="fas fa-question-circle text-2xl mb-2"></i>
                      <p>No quizzes found. Create one using the form above.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Title
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Description
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Created At
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {quizzesList.map((quiz) => (
                              <tr key={quiz._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                     {quiz.title || 'N/A'} {/* Defensive check */}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-500 max-w-xs truncate">
                                     {quiz.description || 'No description'} {/* Defensive check */}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                   {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'N/A'} {/* Defensive check and formatting */}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleDeleteQuiz(quiz._id)}
                                    className="text-red-600 hover:text-red-900 !rounded-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={deletingContentId === quiz._id}
                                  >
                                                                        {deletingContentId === quiz._id ? (
                                      <i className="fas fa-spinner fa-spin mr-1"></i>
                                    ) : (
                                      <i className="fas fa-trash-alt mr-1"></i>
                                    )}
                                    {deletingContentId === quiz._id ? "Removing..." : "Remove"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Video Section */}
            {activeTab === "video" && (
              <div className="space-y-10">
                {/* Video Suggestion Form */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Add YouTube Video Suggestion
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <form onSubmit={handleVideoSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Video Title
                        </label>
                        <input
                          type="text"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                          placeholder="Enter video title"
                          disabled={isVideoSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          YouTube Video ID
                        </label>
                        <input
                          type="text"
                          value={youtubeVideoId}
                          onChange={(e) => setYoutubeVideoId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                          placeholder="e.g. dQw4w9WgXcQ"
                          disabled={isVideoSubmitting}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          The ID is the part after "v=" or "/embed/" or "/watch?v="
                          in the YouTube URL
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                          placeholder="Describe what users will learn from this video"
                          rows={3}
                          disabled={isVideoSubmitting}
                        ></textarea>
                      </div>

                      {videoFormErrors.length > 0 && (
                        <div className="mt-4">
                          <p className="text-red-600 font-medium mb-2">Please correct the following errors:</p>
                          <ul className="list-disc list-inside text-red-600 text-sm">
                            {videoFormErrors.map((err, index) => <li key={index}>{err}</li>)}
                          </ul>
                        </div>
                      )}

                      <div className="flex justify-end mt-6">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap !rounded-button disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isVideoSubmitting}
                        >
                          {isVideoSubmitting ? (
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                          ) : (
                            <i className="fas fa-save mr-2"></i>
                          )}
                          {isVideoSubmitting ? "Saving Video..." : "Save Video Suggestion"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Current Video Suggestions List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Current Video Suggestions
                  </h3>
                  {isLoadingContent ? (
                    <div className="text-center py-8">
                      <i className="fas fa-spinner fa-spin text-indigo-600 text-3xl"></i>
                      <p className="mt-2 text-gray-600">Loading videos...</p>
                    </div>
                  ) : contentError ? (
                    <div className="text-red-600 text-center py-8">
                      <i className="fas fa-exclamation-circle mr-2"></i> {contentError}
                    </div>
                  ) : videosList.length === 0 ? (
                    <div className="text-gray-600 text-center py-8">
                      <i className="fas fa-video text-2xl mb-2"></i>
                      <p>No video suggestions found. Add one using the form above.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Title
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Video ID
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Description
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Created At
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {videosList.map((video) => (
                              <tr key={video._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {video.title || 'N/A'} {/* Defensive check */}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {video.youtubeVideoId || 'N/A'} {/* Defensive check */}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-500 max-w-xs truncate">
                                    {video.description || 'No description'} {/* Defensive check */}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                   {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'N/A'} {/* Defensive check and formatting */}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleDeleteVideo(video._id)}
                                    className="text-red-600 hover:text-red-900 !rounded-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={deletingContentId === video._id}
                                  >
                                    {deletingContentId === video._id ? (
                                      <i className="fas fa-spinner fa-spin mr-1"></i>
                                    ) : (
                                      <i className="fas fa-trash-alt mr-1"></i>
                                    )}
                                    {deletingContentId === video._id ? "Removing..." : "Remove"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 py-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4">DigitalDump</h3>
              <p className="text-gray-600 text-sm">
                Your comprehensive platform for digital learning resources,
                quizzes, and educational videos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-indigo-600 text-sm"
                  >
                    Quizzes
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-indigo-600 text-sm"
                  >
                    Video Tutorials
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-indigo-600 text-sm"
                  >
                    Learning Paths
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-indigo-600 text-sm"
                  >
                    Community Forum
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-indigo-600 text-sm"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-indigo-600 text-sm"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-indigo-600 text-sm"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 hover:text-indigo-600 text-sm"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Stay Connected
              </h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" className="text-gray-600 hover:text-indigo-600">
                  <i className="fab fa-twitter text-lg"></i>
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600">
                  <i className="fab fa-facebook text-lg"></i>
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600">
                  <i className="fab fa-instagram text-lg"></i>
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600">
                  <i className="fab fa-linkedin text-lg"></i>
                </a>
              </div>
              <p className="text-gray-600 text-sm">
                Subscribe to our newsletter for updates
              </p>
              <div className="mt-2 flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  className="bg-indigo-600 text-white px-3 py-2 rounded-r-lg hover:bg-indigo-700 text-sm whitespace-nowrap !rounded-button"
                  onClick={() => showToastMessage('Subscribed to newsletter!', 'success')}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2025 DigitalDump. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-600 hover:text-indigo-600 text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-indigo-600 text-sm"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-indigo-600 text-sm"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${toastType === "success" ? "bg-green-600" : "bg-red-600"
            }`}
           style={{ zIndex: 100 }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default AdminEducationalContent;
