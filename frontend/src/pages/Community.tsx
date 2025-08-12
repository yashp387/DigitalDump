// src/pages/Community.tsx (Assuming it's a page)

import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext"; // Adjust path if needed
import {
  getCommunityOverview,
  createReview,
  getMyReferralCode,
} from "../services/api"; // Adjust path if needed

// --- Interfaces for API Data ---
interface UserRef {
  _id: string;
  name: string;
}

interface RecentActivityItem {
  _id: string;
  userId: UserRef;
  ewasteSubtype: string;
  createdAt: string; // ISO Date string
  status: string;
}

interface TopContributor {
  _id: string;
  name: string;
  points: number;
}

interface RecentReview {
  _id: string;
  userId: UserRef;
  text: string;
  createdAt: string; // ISO Date string
}

interface RecentUser {
  _id: string;
  name: string;
  createdAt: string; // ISO Date string
}

interface CommunityOverviewData {
  recentActivity: RecentActivityItem[];
  topContributors: TopContributor[];
  recentReviews: RecentReview[];
  recentUsers: RecentUser[];
}

// --- Component ---
// Rename component from App to Community
const Community: React.FC = () => {
  // --- State ---
  const [language, setLanguage] = useState<"english" | "gujarati">("english"); // Keep language state

  // Data State
  const [overviewData, setOverviewData] =
    useState<CommunityOverviewData | null>(null);
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState(""); // For the form input

  // Loading State
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingReferralCode, setIsLoadingReferralCode] = useState(true);
  const [isPostingReview, setIsPostingReview] = useState(false);

  // Error State
  const [errorOverview, setErrorOverview] = useState<string | null>(null);
  const [errorReferralCode, setErrorReferralCode] = useState<string | null>(
    null
  );
  const [errorPostReview, setErrorPostReview] = useState<string | null>(null);

  // UI State
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState("Copy"); // State for copy button text

  // --- Context ---
  const { isAuthenticated } = useContext(AuthContext);

  // --- Translations ---
  const translations = {
    english: {
      pageTitle: "Community Forum",
      pageSubtitle:
        "Connect with fellow environmentalists and share your recycling journey",
      recentActivity: "Recent Activity",
      topContributors: "Top Contributors",
      shareExperience: "Share Your Experience",
      yourReview: "Your Review",
      reviewPlaceholder: "Share your thoughts about our service...",
      postReview: "Post Review",
      recentReviews: "Recent Reviews",
      recentlyJoined: "Recently Joined",
      inviteFriend: "Invite Your Friend",
      yourReferralCode: "Your Referral Code",
      copy: "Copy",
      copied: "Copied!",
      referralBonusInfo:
        "Share this code with friends and both of you will earn 100 bonus points!", // Updated bonus
      home: "Home",
      loading: "Loading...",
      errorOccurred: "An error occurred",
      reviewPosted: "Review posted successfully!",
      noActivity: "No recent pickup activity.",
      noContributors: "No top contributors yet.",
      noReviews: "No reviews posted yet.",
      noJoined: "No recently joined users.",
      pts: "pts",
      joined: "Joined",
      reviewBy: "Review by", // Added for clarity
      pickupDetails: "Pickup Details", // Added for clarity
    },
    gujarati: {
      pageTitle: "સમુદાય મંચ",
      pageSubtitle:
        "પર્યાવરણવાદીઓ સાથે જોડાઓ અને તમારી રિસાયકલિંગ યાત્રા શેર કરો",
      recentActivity: "તાજેતરની પ્રવૃત્તિ",
      topContributors: "શ્રેષ્ઠ યોગદાનકર્તાઓ",
      shareExperience: "તમારો અનુભવ શેર કરો",
      yourReview: "તમારી સમીક્ષા",
      reviewPlaceholder: "અમારી સેવા વિશે તમારા વિચારો શેર કરો...",
      postReview: "સમીક્ષા પોસ્ટ કરો",
      recentReviews: "તાજેતરની સમીક્ષાઓ",
      recentlyJoined: "તાજેતરમાં જોડાયા",
      inviteFriend: "તમારા મિત્રને આમંત્રિત કરો",
      yourReferralCode: "તમારો રેફરલ કોડ",
      copy: "કૉપિ કરો",
      copied: "કૉપિ થઈ ગયું!",
      referralBonusInfo:
        "આ કોડ મિત્રો સાથે શેર કરો અને તમે બંને 100 બોનસ પોઈન્ટ્સ કમાશો!", // Updated bonus
      home: "હોમ",
      loading: "લોડ થઈ રહ્યું છે...",
      errorOccurred: "એક ભૂલ આવી",
      reviewPosted: "સમીક્ષા સફળતાપૂર્વક પોસ્ટ થઈ!",
      noActivity: "કોઈ તાજેતરની પિકઅપ પ્રવૃત્તિ નથી.",
      noContributors: "હજી સુધી કોઈ શ્રેષ્ઠ યોગદાનકર્તા નથી.",
      noReviews: "હજી સુધી કોઈ સમીક્ષા પોસ્ટ થઈ નથી.",
      noJoined: "કોઈ તાજેતરમાં જોડાયેલા વપરાશકર્તાઓ નથી.",
      pts: "પોઈન્ટ્સ",
      joined: "જોડાયા",
      reviewBy: "દ્વારા સમીક્ષા", // Added for clarity
      pickupDetails: "પિકઅપ વિગતો", // Added for clarity
    },
  };
  const T = translations[language];

  // --- Fetch Data ---
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("User not authenticated. Cannot load community data.");
      setIsLoadingOverview(false);
      setIsLoadingReferralCode(false);
      return;
    }

    // Fetch Overview Data
    const fetchOverview = async () => {
      setIsLoadingOverview(true);
      setErrorOverview(null);
      try {
        const data = await getCommunityOverview();
        setOverviewData(data);
      } catch (error) {
        console.error("Failed to fetch community overview:", error);
        setErrorOverview(T.errorOccurred);
      } finally {
        setIsLoadingOverview(false);
      }
    };

    // Fetch Referral Code
    const fetchReferralCode = async () => {
      setIsLoadingReferralCode(true);
      setErrorReferralCode(null);
      try {
        const data = await getMyReferralCode();
        setMyReferralCode(data.referralCode); // Assuming API returns { referralCode: '...' }
      } catch (error) {
        console.error("Failed to fetch referral code:", error);
        setErrorReferralCode(T.errorOccurred);
      } finally {
        setIsLoadingReferralCode(false);
      }
    };

    fetchOverview();
    fetchReferralCode();
  }, [isAuthenticated, T.errorOccurred]); // Re-fetch if auth status changes

  // --- Event Handlers ---
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || isPostingReview) {
      return;
    }

    setIsPostingReview(true);
    setErrorPostReview(null);

    try {
      const result = await createReview(reviewText.trim());
      console.log(T.reviewPosted, result);
      setReviewText(""); // Clear input on success

      // Optimistically add the new review to the list or refetch overview
      if (result.review && overviewData) {
        setOverviewData({
          ...overviewData,
          recentReviews: [
            result.review, // Add the new review (with populated user)
            ...overviewData.recentReviews,
          ].slice(0, 3), // Keep only the latest 3
        });
      } else {
        // Fallback: Refetch overview data if optimistic update is complex
        const data = await getCommunityOverview();
        setOverviewData(data);
      }
      // Optionally show a success toast message
    } catch (error: any) {
      console.error("Failed to post review:", error);
      setErrorPostReview(error.response?.data?.message || T.errorOccurred);
    } finally {
      setIsPostingReview(false);
    }
  };

  const handleInviteFriend = () => {
    setShowReferralCode(!showReferralCode); // Toggle visibility
  };

  const copyReferralCode = () => {
    if (!myReferralCode) return;
    navigator.clipboard
      .writeText(myReferralCode)
      .then(() => {
        setCopyButtonText(T.copied);
        setTimeout(() => {
          setCopyButtonText(T.copy);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy referral code: ", err);
        // Optionally show an error message to the user
      });
  };

  // Helper to format date strings
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString; // Return original if formatting fails
    }
  };

  // --- Render Logic ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please log in to view the Community Forum.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-600">DigitalDump</div>
          <nav className="flex items-center gap-6">
            <a href="/dashboard" className="text-gray-600 hover:text-emerald-600">
              {T.home}
            </a>
            {/* Add links to Education, Rewards */}
            <a href="/education" className="text-gray-600 hover:text-emerald-600">
              Education
            </a>
            <a href="/rewards" className="text-gray-600 hover:text-emerald-600">
              Rewards
            </a>
             <button className="!rounded-button whitespace-nowrap text-emerald-600 font-semibold">
              Community
            </button>
            {/* Language Switcher */}
            <div className="flex items-center gap-2">
              <button
                className={`!rounded-button whitespace-nowrap px-3 py-1 text-sm ${
                  language === "english"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setLanguage("english")}
              >
                English
              </button>
              <button
                className={`!rounded-button whitespace-nowrap px-3 py-1 text-sm ${
                  language === "gujarati"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setLanguage("gujarati")}
              >
                ગુજરાતી
              </button>
            </div>
            {/* Profile Icon (Placeholder) */}
            <button className="cursor-pointer">
              <a href="/profile" className="text-gray-600 hover:text-emerald-600"><i className="fas fa-user-circle text-2xl"></i></a>
            </button>
          </nav>
        </div>
      </header>

      {/* Page Title Section */}
      <div className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            {T.pageTitle}
          </h1>
          <p className="text-lg md:text-xl opacity-90">{T.pageSubtitle}</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoadingOverview ? (
          <div className="text-center py-16">{T.loading}</div>
        ) : errorOverview ? (
          <div className="text-center py-16 text-red-500">{errorOverview}</div>
        ) : overviewData ? (
          // Grid for main layout
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Recent Activity & Reviews) */}
            <div className="lg:col-span-2 space-y-10 md:space-y-12">
              {/* Recent Activity Section */}
              <section>
                <h2 className="text-2xl md:text-3xl font-bold mb-5 md:mb-6 text-gray-800">
                  {T.recentActivity}
                </h2>
                {overviewData.recentActivity.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 md:gap-6">
                    {overviewData.recentActivity.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          {/* User Info */}
                          <div className="flex-shrink-0">
                             {/* Placeholder Avatar */}
                             <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold">
                                {item.userId?.name?.charAt(0) || '?'}
                             </div>
                          </div>
                          {/* Activity Details */}
                          <div className="flex-grow">
                            <h3 className="text-base md:text-lg font-semibold mb-1">
                              {item.userId?.name || "Unknown User"}
                            </h3>
                            <p className="text-sm text-gray-500 mb-3">
                              {formatDate(item.createdAt)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs md:text-sm font-medium">
                                <i className="fas fa-recycle mr-1.5"></i>
                                {item.ewasteSubtype || "E-waste"}
                              </span>
                               <span className={`px-2.5 py-1 rounded-full text-xs md:text-sm font-medium ${
                                   item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                   item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                   item.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                   'bg-gray-100 text-gray-700' // pending or default
                               }`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)} {/* Capitalize status */}
                               </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6">{T.noActivity}</div>
                )}
              </section>

              {/* Recent Reviews Section */}
              <section>
                <h2 className="text-2xl md:text-3xl font-bold mb-5 md:mb-6 text-gray-800">
                  {T.recentReviews}
                </h2>
                {overviewData.recentReviews.length > 0 ? (
                  <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm space-y-6">
                    {overviewData.recentReviews.map((review) => (
                      <div
                        key={review._id}
                        className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
                      >
                        <div className="flex items-center gap-3 mb-3">
                           {/* Placeholder Avatar */}
                           <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-semibold">
                              {review.userId?.name?.charAt(0) || '?'}
                           </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {review.userId?.name || "Anonymous"}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg relative">
                           <i className="fas fa-quote-left text-emerald-200 text-xl absolute top-2 left-2 opacity-50"></i>
                           <p className="text-gray-700 italic pl-6">{review.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="text-center text-gray-500 py-6 bg-white rounded-xl shadow-sm">{T.noReviews}</div>
                )}
              </section>

              {/* Share Experience Form Section */}
              <section>
                <h2 className="text-2xl md:text-3xl font-bold mb-5 md:mb-6 text-gray-800">
                  {T.shareExperience}
                </h2>
                <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm">
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-4">
                      <label
                        htmlFor="review"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {T.yourReview}
                      </label>
                      <textarea
                        id="review"
                        rows={4} // Reduced rows slightly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-200"
                        placeholder={T.reviewPlaceholder}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        required
                        maxLength={1000} // Match backend validation
                      ></textarea>
                       {errorPostReview && <p className="text-red-500 text-xs mt-1">{errorPostReview}</p>}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isPostingReview || !reviewText.trim()}
                        className="!rounded-button whitespace-nowrap bg-emerald-600 text-white px-5 py-2 md:px-6 hover:bg-emerald-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isPostingReview ? T.loading : T.postReview}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>

            {/* Right Column (Top Contributors, Recently Joined, Referral) */}
            <div className="lg:col-span-1 space-y-10 md:space-y-12">
              {/* Top Contributors Section */}
              <section>
                <h2 className="text-2xl md:text-3xl font-bold mb-5 md:mb-6 text-gray-800">
                  {T.topContributors}
                </h2>
                {overviewData.topContributors.length > 0 ? (
                  <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm">
                    <ul className="divide-y divide-gray-100">
                      {overviewData.topContributors.map((user, index) => {
                        const rank = index + 1;
                        let rankBgColor = "bg-emerald-100 text-emerald-600";
                        if (rank === 1) rankBgColor = "bg-yellow-100 text-yellow-600";
                        if (rank === 2) rankBgColor = "bg-gray-200 text-gray-600";
                        if (rank === 3) rankBgColor = "bg-amber-100 text-amber-600";

                        return (
                          <li
                            key={user._id}
                            className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${rankBgColor}`}
                              >
                                {rank}
                              </div>
                               {/* Placeholder Avatar */}
                               <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-semibold">
                                  {user.name?.charAt(0) || '?'}
                               </div>
                              <div className="font-medium text-gray-900 text-sm">
                                {user.name}
                              </div>
                            </div>
                            <span className="bg-emerald-50 text-emerald-800 py-0.5 px-2.5 rounded-full text-xs font-semibold">
                              {user.points.toLocaleString()} {T.pts}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                   <div className="text-center text-gray-500 py-6 bg-white rounded-xl shadow-sm">{T.noContributors}</div>
                )}
              </section>

              {/* Recently Joined & Referral Section */}
              <section>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 md:mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                      {T.recentlyJoined}
                    </h2>
                    <button
                      onClick={handleInviteFriend}
                      className="!rounded-button whitespace-nowrap bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-700 transition-colors flex-shrink-0"
                    >
                      <i className="fas fa-user-plus mr-2"></i>
                      {T.inviteFriend}
                    </button>
                 </div>
                <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm">
                  {/* Referral Code Display */}
                  {showReferralCode && (
                    <div className="mb-6 bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <h3 className="text-base md:text-lg font-semibold mb-2 text-emerald-700">
                        {T.yourReferralCode}
                      </h3>
                      {isLoadingReferralCode ? (
                         <div className="text-center py-2">{T.loading}</div>
                      ) : errorReferralCode ? (
                         <div className="text-center py-2 text-red-500">{errorReferralCode}</div>
                      ) : myReferralCode ? (
                        <>
                          <div className="flex">
                            <div className="flex-grow bg-white border border-emerald-200 rounded-l-lg p-2 md:p-3 font-mono text-base md:text-lg font-bold text-center tracking-wider">
                              {myReferralCode}
                            </div>
                            <button
                              id="copy-button"
                              onClick={copyReferralCode}
                              className="!rounded-button whitespace-nowrap bg-emerald-600 text-white px-3 md:px-4 rounded-r-lg hover:bg-emerald-700 transition-colors flex items-center justify-center text-sm"
                            >
                              <i className={`fas ${copyButtonText === T.copied ? 'fa-check' : 'fa-copy'} mr-1.5`}></i>
                              {copyButtonText}
                            </button>
                          </div>
                          <p className="text-xs md:text-sm text-emerald-600 mt-2">
                            {T.referralBonusInfo}
                          </p>
                        </>
                      ) : (
                         <div className="text-center py-2 text-gray-500">Referral code not available.</div>
                      )}
                    </div>
                  )}

                  {/* Recently Joined List */}
                  {overviewData.recentUsers.length > 0 ? (
                     <ul className="divide-y divide-gray-100">
                      {overviewData.recentUsers.map((user) => (
                        <li
                          key={user._id}
                          className="py-3 flex items-center hover:bg-gray-50 px-1 rounded-lg transition-colors"
                        >
                           {/* Placeholder Avatar */}
                           <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-semibold mr-3">
                              {user.name?.charAt(0) || '?'}
                           </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium text-gray-900">
                              {user.name}
                            </p>
                            {/* Location removed as it's not in backend data */}
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {T.joined} {formatDate(user.createdAt)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                     <div className="text-center text-gray-500 py-4">{T.noJoined}</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Rename the export to Community
export default Community;
