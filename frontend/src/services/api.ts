// frontend/src/services/api.ts
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"; // Ensure this points to your backend

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Get token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add Authorization header
    }
    return config; // Proceed with the request config
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Process successful responses
    return response;
  },
  (error) => {
    // Handle response errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        `[API Response Error] <-- ${error.response.status} ${error.config.method?.toUpperCase()} ${
          error.config.url
        }`,
      );
      console.error("[API Response Error] Data:", error.response.data);
      // You could add specific handling here for 401/403 errors, e.g., redirect to login
      // if (error.response.status === 401 || error.response.status === 403) {
      //   console.warn("Authentication or Authorization error. Redirecting to login...");
      //   // Example: Redirect to login page (replace with actual routing logic)
      //   // window.location.href = '/admin/signin';
      // }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("[API No Response Error] Request:", error.request);
      error.message =
        "Network Error: Could not connect to the server. Please ensure the backend is running and accessible."; // Provide a user-friendly error
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("[API Request Setup Error]", error.message);
    }
    // Re-throw the error so it can be caught by the calling function/component
    return Promise.reject(error);
  },
);

// Generic API request helper function
const apiRequest = async (
  method: string,
  url: string,
  dataOrParams: any = null,
  config: object = {},
) => {
  const lowerMethod = method.toLowerCase();
  try {
    const response = await api({
      method: lowerMethod,
      url,
      // Attach data for methods that send a body (POST, PUT, PATCH)
      data: ["post", "put", "patch"].includes(lowerMethod)
        ? dataOrParams
        : undefined,
      // Attach params for methods that use URL parameters (GET, DELETE)
      params: ["get", "delete"].includes(lowerMethod) ? dataOrParams : undefined,
      ...config, // Include any custom axios config
    });
    // Return the response data directly
    return response.data;
  } catch (error: any) {
    // Rethrow the error to be handled by the component
    throw error;
  }
};

// ========================================
//            API ENDPOINT EXPORTS
// ========================================


// --- USER AUTH & PROFILE ---
export const userSignup = (userData: any) =>
  apiRequest("post", "/user/signup", userData);
export const userSignin = (credentials: any) =>
  apiRequest("post", "/user/signin", credentials);
export const getProfileData = () => apiRequest("get", "/profile/me");
export const getUserScheduledPickups = () => apiRequest("get", "/profile/pickups"); // Assuming user profile has this
export const getUserRedemptionHistory = () =>
  apiRequest("get", "/profile/redemptions"); // Assuming user profile has this


// --- COLLECTION AGENT AUTH & FEATURES ---
export const collectorSignin = (credentials: any) =>
  apiRequest("post", "/collection-agent/signin", credentials);
export const collectorSignup = async (formData: FormData) => {
  // Special case for FormData upload
  try {
    const response = await api.post("/collection-agent/signup", formData, {
      headers: {
        'Content-Type': 'multipart/form-data' // Ensure correct content type for file uploads
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
// Assuming these are agent-specific routes
export const getAvailablePickups = () =>
  apiRequest("get", "/agent/pickups/available");
export const getAgentPickupsByStatus = (status: string) => // This is the function Education.tsx was looking for
  apiRequest("get", `/agent/pickups/status`, { status }); // Note: Takes status as a query param
export const acceptPickup = (requestId: string) =>
  apiRequest("put", `/agent/pickups/${requestId}/accept`);
export const completePickup = (requestId: string) =>
  apiRequest("put", `/agent/pickups/${requestId}/complete`);
export const getOptimizedRoute = () =>
  apiRequest("get", "/agent/pickups/optimize-route");


// --- ADMIN AUTH ---
export const adminSignup = (userData: any) =>
  apiRequest("post", "/admin/signup", userData); // Admin signup should ideally be restricted in production
export const adminSignin = (credentials: any) =>
  apiRequest("post", "/admin/signin", credentials);
export const adminForgotPassword = (data: { email: string }) =>
  apiRequest("post", "/admin/forgot-password", data);
export const adminResetPasswordWithCode = (data: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}) => apiRequest("post", "/admin/reset-password-code", data);


// --- USER FACING FEATURES (EDUCATION, GAMIFICATION, COMMUNITY) ---
// Education
export const getQuizList = () => apiRequest("get", "/education/quizzes"); // User-facing quiz list (was getAllQuizzes)
export const getQuizById = (quizId: string) =>
  apiRequest("get", `/education/quizzes/${quizId}`); // Get single quiz (for user to take)
export const submitQuizAnswers = (quizId: string, answers: number[]) =>
  apiRequest("post", `/education/quizzes/${quizId}/submit`, { answers });
export const getVideoList = () => apiRequest("get", "/education/videos"); // User-facing video list (was getAllVideos)
export const markVideoWatched = () =>
  apiRequest("post", "/education/videos/watched"); // Assuming this marks a video as watched for the current user
export const getUserEducationProgress = () =>
  apiRequest("get", "/education/progress");

// Gamification
export const getUserGamificationStatus = () =>
  apiRequest("get", "/gamification/status");
export const getAvailableProducts = () =>
  apiRequest("get", "/gamification/products");
export const redeemProductById = (productId: string) =>
  apiRequest("post", `/gamification/products/${productId}/redeem`);
export const getUserGamificationRedemptionHistory = () =>
  apiRequest("get", "/gamification/redemptions");

// Community
export const getCommunityOverview = () =>
  apiRequest("get", "/community/overview");
export const createReview = (text: string) => // Assuming review body is { text: string }
  apiRequest("post", "/community/reviews", { text });
export const getMyReferralCode = () =>
  apiRequest("get", "/community/my-referral-code"); // Assuming this gets the logged-in user's code
export const getAllReviews = () => apiRequest("get", "/community/reviews"); // Assuming this gets community reviews


// --- ADMIN DASHBOARD ---
export const getAdminOverviewStats = () =>
  apiRequest("get", "/admin/dashboard/stats/overview");
export const getAdminMonthlyUserSignups = () =>
  apiRequest("get", "/admin/dashboard/stats/user-signups/monthly");
export const getAdminCategoryDistribution = () =>
  apiRequest("get", "/admin/dashboard/stats/pickup-categories/distribution");
export const getAdminMonthlyScheduledPickups = () =>
  apiRequest("get", "/admin/dashboard/stats/scheduled-pickups/monthly");
export const getAdminMonthlyTotalPickups = () =>
  apiRequest("get", "/admin/dashboard/stats/total-pickups/monthly");


// --- ADMIN CONTENT MANAGEMENT ---
// Create Content (Names updated from createQuiz/createVideoSuggestion)
export const createAdminQuiz = (quizData: any) =>
  apiRequest("post", "/admin/content/quizzes", quizData);
export const createAdminVideoSuggestion = (videoData: any) =>
  apiRequest("post", "/admin/content/videos", videoData);

// View & Delete Content (New functions)
export const getAdminAllQuizzes = () => // Get all quizzes for admin list view
  apiRequest("get", "/admin/content/quizzes");
export const deleteAdminQuiz = (quizId: string) => // Delete a specific quiz
  apiRequest("delete", `/admin/content/quizzes/${quizId}`);

export const getAdminAllVideoSuggestions = () => // Get all videos for admin list view
  apiRequest("get", "/admin/content/videos");
export const deleteAdminVideoSuggestion = (videoId: string) => // Delete a specific video
  apiRequest("delete", `/admin/content/videos/${videoId}`);


// --- ADMIN REWARDS MANAGEMENT ---
export const getAdminRewardsOverviewStats = () =>
  apiRequest("get", "/admin/rewards/stats/overview");
export const createAdminRedeemableProduct = (productData: any) => // Use any for simplicity
  apiRequest("post", "/admin/rewards/products", productData);
export const getAdminAllRedeemableProducts = () =>
  apiRequest("get", "/admin/rewards/products");
export const deleteAdminRedeemableProduct = (productId: string) =>
  apiRequest("delete", `/admin/rewards/products/${productId}`);


// --- ADMIN MANAGEMENT (USERS & AGENTS) ---
export const getAdminManagementOverviewStats = () =>
  apiRequest("get", "/admin/management/stats/overview");
export const getAdminMonthlyUserGrowth = () =>
  apiRequest("get", "/admin/management/stats/user-growth/monthly");
export const getAdminAllUsers = () =>
  apiRequest("get", "/admin/management/users");
export const getAdminAllAgents = () =>
  apiRequest("get", "/admin/management/agents");
export const updateAdminUserStatus = (userId: string, status: "active" | "suspended") =>
  apiRequest("put", `/admin/management/users/${userId}/status`, { status }); // Body is { status: newStatus }
export const updateAdminAgentStatus = (agentId: string, status: "active" | "suspended") =>
  apiRequest("put", `/admin/management/agents/${agentId}/status`, { status }); // Body is { status: newStatus }
export const deleteAdminUser = (userId: string) =>
  apiRequest("delete", `/admin/management/users/${userId}`);
export const deleteAdminAgent = (agentId: string) =>
  apiRequest("delete", `/admin/management/agents/${agentId}`);


// --- COLLECTION REQUESTS (General or Admin View) ---
// These routes might be used by Admin or specific User/Agent views
// Adjust based on where they are actually consumed and authorized
export const createCollectionRequest = (requestData: any) =>
  apiRequest("post", "/requests/create", requestData);
export const getUserRequests = (userId: string) => // Assuming user-specific requests
  apiRequest("get", `/requests/user/${userId}`); // Needs user auth
export const getCollectionRequestById = (requestId: string) =>
  apiRequest("get", `/requests/${requestId}`); // Could be user, agent, or admin authorized
export const cancelCollectionRequest = (requestId: string) => // Assuming user can cancel their request
  apiRequest("put", `/requests/${requestId}/cancel`);


// Add any other API functions needed in your application...
// Example: Admin view of requests? Admin agent verification?


// No need for 'export {}' or explicitly listing exports if using 'export const' inline
