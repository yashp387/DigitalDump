// src/pages/UserSignIn.tsx // Renamed file for clarity
import React, { useState, useContext } from "react"; // Import useContext
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Import Link for Sign Up
import AuthContext from "../context/AuthContext"; // Import AuthContext

const UserSignIn: React.FC = () => { // Renamed component for clarity
  const { login } = useContext(AuthContext); // Get login function from context
  const navigate = useNavigate(); // Initialize useNavigate

  const [isEnglish, setIsEnglish] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const texts = {
    english: {
      title: "Digital Dump",
      email: "Email",
      password: "Password",
      login: "Login",
      newUser: "New to Digital Dump?",
      signup: "Sign Up",
      welcome: "Welcome Back!",
      subtitle: "Login to manage your e-waste pickups", // Updated subtitle
      footer: "© 2025 DigitalDump. All rights reserved.",
      emailPlaceholder: "Enter your email",
      passwordPlaceholder: "Enter your password",
      loggingIn: "Logging In...", // Added loading text
      loginError: "Invalid email or password.", // Specific error
      networkError: "Login failed. Please check connection.", // Network error
      missingFields: "Please enter both email and password.", // Validation error
    },
    gujarati: {
      title: "ડિજિટલ ડમ્પ",
      email: "ઈમેલ",
      password: "પાસવર્ડ",
      login: "લૉગિન",
      newUser: "ડિજિટલ ડમ્પ પર નવા છો?",
      signup: "સાઇન અપ કરો",
      welcome: "પાછા આવ્યા!",
      subtitle: "તમારા ઇ-કચરા પિકઅપનું સંચાલન કરવા માટે લૉગિન કરો", // Updated subtitle
      footer: "© 2025 ડિજિટલ ડમ્પ. બધા હકો સુરક્ષિત.",
      emailPlaceholder: "તમારો ઈમેલ દાખલ કરો",
      passwordPlaceholder: "તમારો પાસવર્ડ દાખલ કરો",
      loggingIn: "લોગ ઇન કરી રહ્યું છે...", // Added loading text
      loginError: "અમાન્ય ઇમેઇલ અથવા પાસવર્ડ.", // Specific error
      networkError: "લૉગિન નિષ્ફળ થયું. કૃપા કરીને કનેક્શન તપાસો.", // Network error
      missingFields: "કૃપા કરીને ઇમેઇલ અને પાસવર્ડ બંને દાખલ કરો.", // Validation error
    },
  };

  const currentText = isEnglish ? texts.english : texts.gujarati;
  const welcomeImage =
    "https://public.readdy.ai/ai/img_res/07d590b0ad70a4d0a478a4cbbc6f41b1.jpg"; // Keep or change image

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(""); // Clear error on input change
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setIsLoading(true); // Set loading state

    if (!email || !password) {
      setError(currentText.missingFields);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        // Use environment variable for API base URL if possible
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/user/signin`,
        { email: email, password: password }
      );

      console.log("Login successful:", response.data);

      // Ensure token exists in the response
      if (response.data && response.data.token) {
        const token = response.data.token;
        // Determine role - default to 'user' if not provided by backend
        const role = response.data.user?.role || 'user';

        // Update global Auth state using the context function
        // This function should handle storing token/role in localStorage internally
        login(token, role);

        // Navigate to the dashboard route path AFTER state is updated
        // ** IMPORTANT: Ensure '/dashboard' is the correct path defined in AppRoutes.tsx **
        // This path should render the component from your dashboard.tsx file.
        navigate('/dashboard');

      } else {
        // Handle cases where login succeeds (2xx status) but token is missing
        console.error("Login response missing token:", response.data);
        setError("Login failed: Invalid response from server.");
      }

    } catch (err: any) {
      // Handle API call errors (network, 4xx, 5xx)
      console.error("Login failed:", err);
      if (err.response) {
        // Server responded with an error status code (e.g., 401 Unauthorized)
         setError(err.response.data?.message || currentText.loginError);
      } else if (err.request) {
        // Network error (no response received)
        setError(currentText.networkError);
      } else {
        // Other errors (e.g., setting up the request)
        setError("An unexpected error occurred during login.");
      }
    } finally {
      setIsLoading(false); // Reset loading state regardless of success/failure
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-[#4CAF50]">
            {currentText.title}
          </div>
          <button
            onClick={() => setIsEnglish(!isEnglish)}
            className="px-4 py-2 text-sm font-medium text-[#4CAF50] hover:bg-[#E8F5E9] !rounded-button cursor-pointer whitespace-nowrap"
          >
            {isEnglish ? "ગુજરાતી" : "English"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 bg-gradient-to-br from-white to-[#E8F5E9]">
        <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* Image Section */}
          <div className="w-full max-w-md lg:w-[480px] hidden lg:block">
            <img
              src={welcomeImage}
              alt="Welcome illustration"
              className="w-full h-auto max-h-[600px] object-cover rounded-2xl shadow-2xl"
            />
          </div>
          {/* Form Section */}
          <div className="w-full max-w-md lg:w-[480px]">
            <div className="bg-white shadow-2xl rounded-lg p-8 border border-gray-100">
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {currentText.welcome}
                  </h2>
                  <p className="text-gray-600">{currentText.subtitle}</p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      {currentText.email}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 !rounded-button focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition duration-200"
                        required
                        placeholder={currentText.emailPlaceholder}
                        disabled={isLoading} // Disable input when loading
                      />
                      <i className="fa-solid fa-envelope absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      {currentText.password}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 !rounded-button focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent transition duration-200"
                        required
                        placeholder={currentText.passwordPlaceholder}
                        disabled={isLoading} // Disable input when loading
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg cursor-pointer transition duration-200"
                        disabled={isLoading}
                      >
                        <i className={`fa-solid ${ showPassword ? "fa-eye-slash" : "fa-eye" }`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!email || !password || isLoading} // Disable if loading or fields empty
                    className={`w-full py-3 text-base font-medium !rounded-button whitespace-nowrap transition duration-200 flex items-center justify-center ${
                      !email || !password || isLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#4CAF50] text-white hover:bg-[#388E3C]"
                    }`}
                  >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            {currentText.loggingIn}
                        </>
                    ) : (
                        currentText.login
                    )}
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    {currentText.newUser}
                  </p>
                  {/* Use Link component for internal navigation */}
                  <Link
                    to="/user/signup" // Adjust path to your user signup route
                    className="inline-block w-full py-3 text-base font-medium bg-[#E8F5E9] text-[#4CAF50] hover:bg-[#C8E6C9] transition-colors duration-200 !rounded-button text-center"
                  >
                    {currentText.signup}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] py-6">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-gray-600">
            {currentText.footer}
          </p>
        </div>
      </footer>
    </div>
  );
};

// Rename the export to match the component name
export default UserSignIn;
