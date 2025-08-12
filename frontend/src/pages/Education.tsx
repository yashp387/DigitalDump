// src/pages/Education.tsx

import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import {
  // CORRECTED Import Names to match api.ts exports
  getQuizList, // User-facing quiz list is now getQuizList
  getQuizById,
  submitQuizAnswers,
  getVideoList, // User-facing video list is now getVideoList
  markVideoWatched,
  getUserEducationProgress,
} from "../services/api";

interface QuizListItem {
  _id: string;
  title: string;
  description?: string;
}
interface Question {
  _id: string;
  questionText: string;
  options: string[];
}
interface QuizData {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
}
interface VideoData {
  _id: string;
  title: string;
  description: string;
  youtubeVideoId: string;
  videoUrl: string;
  thumbnailUrl: string;
}
interface UserProgress {
  points: number;
  hasCompletedQuiz: boolean;
  watchedVideos: number;
}

const Education: React.FC = () => {
  const [language, setLanguage] = useState<"en" | "gu">("en");
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [isLoadingQuizData, setIsLoadingQuizData] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [isMarkingVideo, setIsMarkingVideo] = useState<string | null>(null);
  const [errorQuizzes, setErrorQuizzes] = useState<string | null>(null);
  const [errorVideos, setErrorVideos] = useState<string | null>(null);
  const [errorProgress, setErrorProgress] = useState<string | null>(null);
  const [errorQuizData, setErrorQuizData] = useState<string | null>(null);
  const [errorSubmitQuiz, setErrorSubmitQuiz] = useState<string | null>(null);
  const [errorMarkVideo, setErrorMarkVideo] = useState<string | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuizData, setCurrentQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    pointsEarned: number;
    message: string;
  } | null>(null);

  const { isAuthenticated } = useContext(AuthContext);

  const translations = {
    en: {
      title: "E-Waste Education Center",
      subtitle:
        "Learn about responsible e-waste management and earn green points while making a positive impact on our environment.",
      progress: "Your Progress",
      pointsEarned: "Points Earned",
      learningModules: "Learning Modules",
      featuredVideos: "Featured Video Tutorials",
      understanding: "Understanding E-Waste",
      yearlyGenerated: "Tonnes Generated Yearly",
      properlyRecycled: "Properly Recycled",
      materialValue: "Value in Materials",
      eWasteDesc1:
        "Electronic waste, or e-waste, encompasses discarded electronic devices and equipment. As our digital world expands, e-waste has become one of the fastest-growing waste streams globally, reaching 53.6 million metric tonnes in 2024.",
      eWasteDesc2:
        "Proper e-waste management is crucial for environmental protection and resource conservation. It involves responsible collection, recycling, and disposal of electronic devices, preventing harmful materials from entering our ecosystem while recovering valuable resources.",
      startQuiz: "Start Quiz",
      quizIntroTitle: "Ready to test your knowledge?",
      quizIntroSubtitle: "Challenge yourself with our e-waste quiz!",
      duration: "Duration",
      questions: "Questions",
      pointsAvailable: "Points Available",
      passScore: "Pass Score",
      minutes: "N/A",
      total: "total",
      points: "points",
      progressLabel: "Progress",
      questionLabel: "Question",
      ofLabel: "of",
      quizComplete: "Quiz Complete!",
      yourScore: "Your Score",
      pointsAwarded: "Points Awarded",
      close: "Close",
      loading: "Loading...",
      errorOccurred: "An error occurred",
      markAsWatched: "Mark as Watched",
      watched: "Watched",
      home: "Home",
      educationCenter: "Education Center",
      rewards: "Rewards",
      making:
        "Making e-waste education accessible and rewarding for a sustainable future.",
      quickLinks: "Quick Links",
      aboutUs: "About Us",
      howItWorks: "How It Works",
      impactReport: "Impact Report",
      contact: "Contact",
      followUs: "Follow Us",
      copyright: "© 2025 DigitalDump. All rights reserved.",
    },
    gu: {
      title: "ઇ-કચરા શિક્ષણ કેન્દ્ર",
      subtitle:
        "જવાબદાર ઇ-કચરા વ્યવસ્થાપન વિશે જાણો અને આપણા પર્યાવરણ પર સકારાત્મક પ્રભાવ પાડતા ગ્રીન પોઈન્ટ્સ કમાઓ.",
      progress: "તમારી પ્રગતિ",
      pointsEarned: "મેળવેલા પોઈન્ટ્સ",
      learningModules: "શીખવાના મોડ્યુલ્સ",
      featuredVideos: "ફીચર્ડ વિડિઓ ટ્યુટોરિયલ્સ",
      understanding: "ઇ-કચરો સમજવો",
      yearlyGenerated: "વાર્ષિક ઉત્પન્ન થયેલ ટન",
      properlyRecycled: "યોગ્ય રીતે રિસાયકલ",
      materialValue: "સામગ્રીનું મૂલ્ય",
      eWasteDesc1:
        "ઇલેક્ટ્રોનિક કચરો, અથવા ઇ-કચરો, ત્યજી દીધેલા ઇલેક્ટ્રોનિક ઉપકરણો અને સાધનોનો સમાવેશ કરે છે. જેમ જેમ આપણી ડિજિટલ દુનિયા વિસ્તરે છે, ઇ-કચરો વૈશ્વિક સ્તરે સૌથી ઝડપથી વધતા કચરાના પ્રવાહોમાંનો એક બની ગયો છે, જે 2024માં 53.6 મિલિયન મેટ્રિક ટન સુધી પહોંચ્યો છે.",
      eWasteDesc2:
        "પર્યાવરણ સંરક્ષણ અને સંસાધન સંરક્ષણ માટે યોગ્ય ઇ-કચરા વ્યવસ્થાપન મહત્વપૂર્ણ છે. તેમાં ઇલેક્ટ્રોનિક ઉપકરણોનું જવાબદાર સંગ્રહ, રિસાયકલિંગ અને નિકાલનો સમાવેશ થાય છે, જે આપણા ઇકોસિસ્ટમમાં હાનિકારક પદાર્થોને પ્રવેશતા અટકાવે છે અને મૂલ્યવાન સંસાધનોને પુનઃપ્રાપ્ત કરે છે.",
      startQuiz: "ક્વિઝ શરૂ કરો",
      quizIntroTitle: "તમારું જ્ઞાન ચકાસવા માટે તૈયાર છો?",
      quizIntroSubtitle: "અમારી ઇ-કચરા ક્વિઝ સાથે તમારી જાતને પડકારો!",
      duration: "સમયગાળો",
      questions: "પ્રશ્નો",
      pointsAvailable: "ઉપલબ્ધ પોઈન્ટ્સ",
      passScore: "પાસ સ્કોર",
      minutes: "N/A",
      total: "કુલ",
      points: "પોઈન્ટ્સ",
      progressLabel: "પ્રગતિ",
      questionLabel: "પ્રશ્ન",
      ofLabel: "માંથી",
      quizComplete: "ક્વિઝ પૂર્ણ!",
      yourScore: "તમારો સ્કોર",
      pointsAwarded: "મેળવેલ પોઈન્ટ્સ",
      close: "બંધ કરો",
      loading: "લોડ થઈ રહ્યું છે...",
      errorOccurred: "એક ભૂલ આવી",
      markAsWatched: "જોયેલું તરીકે ચિહ્નિત કરો",
      watched: "જોયેલું",
      home: "હોમ",
      educationCenter: "શિક્ષણ કેન્દ્ર",
      rewards: "રિવોર્ડ્સ",
      making: "ટકાઉ ભવિષ્ય માટે ઇ-કચરા શિક્ષણને સુલભ અને પુરસ્કૃત બનાવવું.",
      quickLinks: "ઝડપી લિંક્સ",
      aboutUs: "અમારા વિશે",
      howItWorks: "કેવી રીતે કામ કરે છે",
      impactReport: "પ્રભાવ રિપોર્ટ",
      contact: "સંપર્ક",
      followUs: "અમને અનુસરો",
      copyright: "© 2025 ડિજિટલડમ્પ. બધા હકો અમારી પાસે રાખેલા છે.",
    },
  };
  const T = translations[language];

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("User not authenticated. Cannot load education data.");
      return;
    }
    const loadInitialData = async () => {
      setIsLoadingQuizzes(true);
      setErrorQuizzes(null);
      try {
        // CORRECTED API function call
        const quizData = await getQuizList();
        setQuizzes(quizData || []);
      } catch (error) {
        console.error("Failed to fetch quizzes:", error);
        setErrorQuizzes(T.errorOccurred + ": Could not load quizzes.");
      } finally {
        setIsLoadingQuizzes(false);
      }
      setIsLoadingVideos(true);
      setErrorVideos(null);
      try {
        // CORRECTED API function call
        const videoData = await getVideoList();
        setVideos(videoData || []);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        setErrorVideos(T.errorOccurred + ": Could not load videos.");
      } finally {
        setIsLoadingVideos(false);
      }
      setIsLoadingProgress(true);
      setErrorProgress(null);
      try {
        const progressData = await getUserEducationProgress();
        setUserProgress(progressData);
      } catch (error) {
        console.error("Failed to fetch user progress:", error);
        setErrorProgress(T.errorOccurred + ": Could not load progress.");
      } finally {
        setIsLoadingProgress(false);
      }
    };
    loadInitialData();
  }, [isAuthenticated, T.errorOccurred]);

  const handleStartQuiz = async (quizId: string) => {
    if (!quizId) return;
    setShowQuizModal(true);
    setCurrentQuizData(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setErrorQuizData(null);
    setErrorSubmitQuiz(null);
    setIsLoadingQuizData(true);
    try {
      const quizDetails = await getQuizById(quizId);
      if (quizDetails && quizDetails.questions) {
        setCurrentQuizData(quizDetails);
        setUserAnswers(new Array(quizDetails.questions.length).fill(null));
      } else {
        throw new Error("Quiz data is incomplete.");
      }
    } catch (error) {
      console.error(`Failed to fetch quiz ${quizId}:`, error);
      setErrorQuizData(T.errorOccurred + ": Could not load quiz details.");
    } finally {
      setIsLoadingQuizData(false);
    }
  };
  const handleSelectAnswer = (answerIndex: number) => {
    if (currentQuizData && currentQuestionIndex > 0) {
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestionIndex - 1] = answerIndex;
      setUserAnswers(newAnswers);
    }
  };
  const handleNextQuestion = () => {
    if (
      currentQuizData &&
      currentQuestionIndex < currentQuizData.questions.length
    ) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  const handleSubmitQuiz = async () => {
    if (!currentQuizData || isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);
    setErrorSubmitQuiz(null);
    setQuizResult(null);
    try {
      const finalAnswers = userAnswers.map((ans) => (ans === null ? -1 : ans));
      const result = await submitQuizAnswers(currentQuizData._id, finalAnswers);
      setQuizResult({
        score: result.score,
        pointsEarned: result.pointsEarned,
        message: result.message || T.quizComplete,
      });
      setUserProgress((prev) => ({
        ...(prev ?? { points: 0, hasCompletedQuiz: false, watchedVideos: 0 }),
        points: result.totalPoints,
        hasCompletedQuiz: true,
      }));
      setTimeout(() => {
        handleCloseQuiz();
      }, 3000);
    } catch (error: any) {
      console.error("Failed to submit quiz:", error);
      setErrorSubmitQuiz(
        error.response?.data?.message ||
          T.errorOccurred + ": Could not submit answers."
      );
    } finally {
      setIsSubmittingQuiz(false);
    }
  };
  const handleCloseQuiz = () => {
    setShowQuizModal(false);
    setCurrentQuizData(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setErrorQuizData(null);
    setErrorSubmitQuiz(null);
  };
  const handleMarkVideoWatched = async (videoId: string) => {
    if (isMarkingVideo) return;
    setIsMarkingVideo(videoId);
    setErrorMarkVideo(null);
    try {
      const result = await markVideoWatched();
      setUserProgress((prev) => ({
        ...(prev ?? { points: 0, hasCompletedQuiz: false, watchedVideos: 0 }),
        watchedVideos: result.watchedVideoCount,
      }));
    } catch (error: any) {
      console.error("Failed to mark video watched:", error);
      setErrorMarkVideo(
        error.response?.data?.message ||
          T.errorOccurred + ": Could not update watch status."
      );
      setTimeout(() => setErrorMarkVideo(null), 3000);
    } finally {
      setIsMarkingVideo(null);
    }
  };

  const calculateOverallProgress = () => {
    if (!userProgress) return 0;
    let progress = 0;
    if (userProgress.hasCompletedQuiz) {
      progress += 50;
    }
    progress += (userProgress.watchedVideos / 3) * 50;
    return Math.min(Math.round(progress), 100);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please log in to access the Education Center.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-600">DigitalDump</div>
          <nav className="flex gap-6 items-center">
            {/* Replace with React Router Link or navigate */}
             <a href="/dashboard" className="text-gray-600 hover:text-emerald-600">Home</a>
             <a href="/community" className="text-gray-600 hover:text-emerald-600">Community</a>
            <button className="!rounded-button whitespace-nowrap text-emerald-600 font-semibold">
              {T.educationCenter}
            </button>
             {/* Replace with React Router Link or navigate */}
            <a href="/rewards" className="text-gray-600 hover:text-emerald-600">{T.rewards}</a>
            <div className="flex items-center gap-2 ml-6">
              <button
                onClick={() => setLanguage("en")}
                className={`!rounded-button whitespace-nowrap px-3 py-1 ${
                  language === "en"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("gu")}
                className={`!rounded-button whitespace-nowrap px-3 py-1 ${
                  language === "gu"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                ગુજરાતી
              </button>
              {/* Profile Icon (Placeholder) */}
            <button className="cursor-pointer">
              <a href="/profile" className="text-gray-600 hover:text-emerald-600"><i className="fas fa-user-circle text-2xl"></i></a>
            </button>
            </div>
          </nav>
        </div>
      </header>

      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              {T.title}
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed">
              {T.subtitle}
            </p>
            {isLoadingProgress ? (
              <div className="text-gray-500">{T.loading}</div>
            ) : errorProgress ? (
              <div className="text-red-500">{errorProgress}</div>
            ) : userProgress ? (
              <div className="flex items-center gap-12">
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">
                    {calculateOverallProgress()}%
                  </div>
                  <div className="text-sm text-gray-500">{T.progress}</div>
                </div>
                <div className="h-12 w-[1px] bg-gray-200"></div>
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-2">
                    {userProgress.points}
                  </div>
                  <div className="text-sm text-gray-500">{T.pointsEarned}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8 tracking-tight">
                {T.understanding}
              </h2>
              <div className="grid grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-3">
                    57.4M
                  </div>
                  <div className="text-sm text-gray-600">
                    {T.yearlyGenerated}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-3">
                    17.4%
                  </div>
                  <div className="text-sm text-gray-600">
                    {T.properlyRecycled}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-600 mb-3">
                    $62.5B
                  </div>
                  <div className="text-sm text-gray-600">{T.materialValue}</div>
                </div>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {T.eWasteDesc1}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                {T.eWasteDesc2}
              </p>
            </div>
            <div className="relative h-[500px] rounded-3xl overflow-hidden">
              <img
                src="https://public.readdy.ai/ai/img_res/b32a045bcb0adb0c01b7a746119ab321.jpg"
                alt="E-waste Management"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 tracking-tight">
            {T.learningModules}
          </h2>
          {isLoadingQuizzes ? (
            <div className="text-center text-gray-500">{T.loading}</div>
          ) : errorQuizzes ? (
            <div className="text-center text-red-500">{errorQuizzes}</div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  onClick={() => handleStartQuiz(quiz._id)}
                  className="bg-white rounded-2xl border border-gray-100 p-8 hover:border-emerald-200 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <i className="fas fa-question-circle text-3xl text-emerald-600 group-hover:scale-110 transition-transform duration-300"></i>
                    {userProgress?.hasCompletedQuiz && (
                      <i
                        className="fas fa-check-circle text-xl text-green-500"
                        title="Quiz Completed"
                      ></i>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}
                  <div className="text-sm font-medium text-gray-500">
                    Click to start
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No quizzes available currently.
            </div>
          )}
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 tracking-tight">
            {T.featuredVideos}
          </h2>
          {isLoadingVideos ? (
            <div className="text-center text-gray-500">{T.loading}</div>
          ) : errorVideos ? (
            <div className="text-center text-red-500">{errorVideos}</div>
          ) : videos.length > 0 ? (
            <>
              {errorMarkVideo && (
                <div className="text-center text-red-500 mb-4">
                  {errorMarkVideo}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((video) => (
                  <div
                    key={video._id}
                    className="bg-white rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                  >
                    <div className="relative aspect-video">
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/480x360?text=Video";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <i className="fas fa-play-circle text-white text-6xl"></i>
                        </div>
                      </a>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-emerald-600 transition-colors duration-300">
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {video.title}
                        </a>
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-3">
                        {video.description}
                      </p>
                      {userProgress && userProgress.watchedVideos < 3 && (
                        <button
                          onClick={() => handleMarkVideoWatched(video._id)}
                          disabled={isMarkingVideo === video._id}
                          className={`!rounded-button whitespace-nowrap mt-auto w-full py-2 px-4 text-sm font-medium transition-colors duration-300 ${
                            isMarkingVideo === video._id
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          }`}
                        >
                          {isMarkingVideo === video._id
                            ? T.loading
                            : T.markAsWatched}
                        </button>
                      )}
                      {userProgress && userProgress.watchedVideos >= 3 && (
                        <div className="mt-auto text-center text-sm text-green-600 font-medium py-2">
                          <i className="fas fa-check-circle mr-1"></i> All
                          videos watched goal met!
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              No videos available currently.
            </div>
          )}
        </div>
      </section>

      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-bold">
                {currentQuizData?.title || "Knowledge Check"}
              </h3>
              <button
                onClick={handleCloseQuiz}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close quiz"
              >
                &times;
              </button>
            </div>
            {isLoadingQuizData && (
              <div className="text-center p-8">{T.loading}</div>
            )}
            {errorQuizData && !isLoadingQuizData && (
              <div className="text-center p-8 text-red-500">
                {errorQuizData}
              </div>
            )}
            {currentQuizData && !isLoadingQuizData && !errorQuizData && (
              <>
                {currentQuestionIndex === 0 && !quizResult && (
                  <div className="text-center">
                    <div className="mb-8">
                      <i className="fas fa-brain text-5xl md:text-6xl text-emerald-600 mb-4"></i>
                      <h4 className="text-xl md:text-2xl font-semibold mb-2">
                        {T.quizIntroTitle}
                      </h4>
                      <p className="text-gray-600">{T.quizIntroSubtitle}</p>
                      {currentQuizData.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {currentQuizData.description}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8 text-sm md:text-base">
                      <div className="bg-emerald-50 p-3 md:p-4 rounded-lg">
                        <i className="fas fa-question-circle text-emerald-600 mb-2"></i>
                        <p className="font-semibold">{T.questions}</p>
                        <p className="text-gray-600">
                          {currentQuizData.questions.length} {T.total}
                        </p>
                      </div>
                      <div className="bg-emerald-50 p-3 md:p-4 rounded-lg">
                        <i className="fas fa-star text-emerald-600 mb-2"></i>
                        <p className="font-semibold">{T.pointsAvailable}</p>
                        <p className="text-gray-600">
                          {currentQuizData.questions.length * 10} {T.points}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentQuestionIndex(1)}
                      className="!rounded-button whitespace-nowrap bg-emerald-600 text-white px-6 py-2 md:px-8 md:py-3 text-base md:text-lg font-semibold hover:bg-emerald-700 transition-colors duration-300"
                    >
                      {T.startQuiz}
                    </button>
                  </div>
                )}
                {currentQuestionIndex > 0 && !quizResult && (
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1 text-xs md:text-sm">
                        <div className="font-semibold text-gray-600">
                                                    {T.progressLabel}
                        </div>
                        <div className="text-emerald-600">
                          {Math.round(
                            ((currentQuestionIndex - 1) /
                              currentQuizData.questions.length) *
                              100
                          )}
                          %
                        </div>
                      </div>
                      <div className="h-1.5 md:h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              ((currentQuestionIndex - 1) /
                                currentQuizData.questions.length) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-4 md:mb-6 text-xs md:text-sm text-gray-500">
                      <div>
                        {T.questionLabel} {currentQuestionIndex} {T.ofLabel}{" "}
                        {currentQuizData.questions.length}
                      </div>
                    </div>
                    <div className="mb-6">
                      <h4 className="text-base md:text-xl mb-4 font-medium">
                        {
                          currentQuizData.questions[currentQuestionIndex - 1]
                            .questionText
                        }
                      </h4>
                      <div className="space-y-3">
                        {currentQuizData.questions[
                          currentQuestionIndex - 1
                        ].options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleSelectAnswer(index)}
                            className={`!rounded-button whitespace-nowrap w-full text-left p-3 border rounded-lg transition-colors duration-200 text-sm md:text-base ${
                              userAnswers[currentQuestionIndex - 1] === index
                                ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300"
                                : "border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      {currentQuestionIndex <
                      currentQuizData.questions.length ? (
                        <button
                          onClick={handleNextQuestion}
                          disabled={
                            userAnswers[currentQuestionIndex - 1] === null
                          }
                          className="!rounded-button whitespace-nowrap bg-emerald-600 text-white px-6 py-2 md:px-8 md:py-3 font-semibold hover:bg-emerald-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Next Question
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={
                            userAnswers[currentQuestionIndex - 1] === null ||
                            isSubmittingQuiz
                          }
                          className="!rounded-button whitespace-nowrap bg-green-600 text-white px-6 py-2 md:px-8 md:py-3 font-semibold hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isSubmittingQuiz ? T.loading : "Submit Quiz"}
                        </button>
                      )}
                      {errorSubmitQuiz && (
                        <p className="text-red-500 text-sm mt-2">
                          {errorSubmitQuiz}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {quizResult && (
                  <div className="text-center p-4">
                    <i className="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                    <h4 className="text-2xl font-semibold mb-2">
                      {T.quizComplete}
                    </h4>
                    <p className="text-gray-600 mb-4">{quizResult.message}</p>
                    <div className="space-y-2 text-lg">
                      <p>
                        {T.yourScore}:{" "}
                        <span className="font-bold text-emerald-600">
                          {quizResult.score}%
                        </span>
                      </p>
                      <p>
                        {T.pointsAwarded}:{" "}
                        <span className="font-bold text-emerald-600">
                          {quizResult.pointsEarned}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleCloseQuiz}
                      className="!rounded-button whitespace-nowrap mt-6 bg-gray-600 text-white px-6 py-2 font-semibold hover:bg-gray-700 transition-colors duration-300"
                    >
                      {T.close}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
            <div>
              <div className="text-3xl font-bold text-white mb-6">
                DigitalDump
              </div>
              <p className="text-base leading-relaxed">{T.making}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">
                {T.quickLinks}
              </h3>
              <div className="space-y-3">
                {/* Replace with actual links or navigate */}
                <div className="cursor-pointer hover:text-white transition-colors duration-300">
                  {T.aboutUs}
                </div>
                <div className="cursor-pointer hover:text-white transition-colors duration-300">
                  {T.howItWorks}
                </div>
                <div className="cursor-pointer hover:text-white transition-colors duration-300">
                  {T.impactReport}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">
                {T.contact}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <i className="fas fa-envelope text-emerald-500"></i>
                  <span>education@digitaldump.com</span> {/* Replace with actual contact info */}
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-phone text-emerald-500"></i>
                  <span>+91 98765 43210</span> {/* Replace with actual contact info */}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">
                {T.followUs}
              </h3>
              <div className="flex gap-5">
                 {/* Replace # with actual social media links */}
                <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors duration-300"><i className="fab fa-facebook text-xl"></i></a>
                <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors duration-300"><i className="fab fa-twitter text-xl"></i></a>
                <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors duration-300"><i className="fab fa-instagram text-xl"></i></a>
                <a href="#" className="text-gray-400 hover:text-emerald-500 transition-colors duration-300"><i className="fab fa-linkedin text-xl"></i></a>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-800 text-xs md:text-sm text-center">
            {T.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Education;
