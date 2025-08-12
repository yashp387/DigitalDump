// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState } from "react";
import {
  adminSignin,
  adminForgotPassword,
  adminResetPasswordWithCode,
} from "../services/api";

const AdminSignin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [progressValue, setProgressValue] = useState(0);

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false); // State to show code sent message

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isOtpLoading, setIsOtpLoading] = useState(false); // Loading for OTP submission
  const [resetFlowSuccessMessage, setResetFlowSuccessMessage] = useState(""); // Success message for reset flow

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setResetFlowSuccessMessage("");

    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      // Assuming minimum 6 based on backend model, adjust if needed
      setOtpError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpError("Passwords do not match");
      return;
    }

    setIsOtpLoading(true);
    try {
      const response = await adminResetPasswordWithCode({
        email: resetEmail, // Use the email from the first modal
        code: otpCode,
        newPassword,
        confirmPassword,
      });

      setResetFlowSuccessMessage(
        response.message ||
          "Password reset successfully. You can now sign in.",
      );

      setShowOtpModal(false);
      setShowResetModal(false);

      // Reset all states related to reset/otp
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setResetEmail("");
      setResetCodeSent(false);

      // Optionally clear main login form fields or wait for user to sign in with new password
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error("Reset Password with Code Error:", err);
      setOtpError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again.",
      );
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      // Assuming minimum 6 based on backend model, adjust if needed
      setError("Password should be at least 6 characters");
      return;
    }

    setIsLoading(true);
    const progressInterval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      const response = await adminSignin({ email, password });

      localStorage.setItem("token", response.token); // Assuming token is returned directly
      localStorage.setItem("userRole", response.role); // Assuming role is returned
      localStorage.setItem("userName", response.name); // Assuming name is returned

      setProgressValue(100);
      setSuccessMessage("Login successful! Redirecting to dashboard...");

      setTimeout(() => {
        // In a real app, use React Router useNavigate hook
        window.location.href = "/admin/dashboard"; // Redirect to admin dashboard
      }, 1500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgressValue(0);
      console.error("Admin Signin Error:", err);
      setError(
        err.response?.data?.message ||
          "An error occurred during login. Please try again.",
      );
    } finally {
      // Only set isLoading to false if no success message (meaning no redirect)
      if (!successMessage) {
        setIsLoading(false);
      }
    }
  };

  const handleForgotPasswordRequest = async () => {
    setResetError("");
    setResetCodeSent(false);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!resetEmail || !emailRegex.test(resetEmail)) {
      setResetError("Please enter a valid email address");
      return;
    }

    setIsResetting(true);
    try {
      const response = await adminForgotPassword({ email: resetEmail });
      // The backend sends a generic success message for security reasons
      // We can show a message indicating the email was *processed*
      setResetCodeSent(true);
      // Optionally auto-show the OTP modal if backend logic supports it and you desire that flow
      // For now, letting the user close the modal and enter the code manually seems safer/clearer
      // Or you could transition to the OTP modal automatically here: setShowOtpModal(true);
    } catch (err: any) {
      console.error("Forgot Password Request Error:", err);
      // Display a generic error message as well, matching backend behavior
      setResetError(
        err.response?.data?.message ||
          "An error occurred while processing your request. Please try again.",
      );
      setResetCodeSent(false); // Ensure success state is false on error
    } finally {
      setIsResetting(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail("");
    setResetError("");
    setResetCodeSent(false); // Reset this state
    // Also close OTP modal if it was open (e.g., via cancel in reset modal)
    if (showOtpModal) {
      closeOtpModal();
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpError("");
    setIsOtpLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url(https://readdy.ai/api/search-image?query=elegant%20modern%20abstract%20background%20with%20soft%20gradient%20colors%20from%20deep%20blue%20to%20purple%2C%20featuring%20flowing%20organic%20shapes%20and%20subtle%20light%20effects%2C%20creating%20a%20sophisticated%20and%20professional%20atmosphere%2C%20perfect%20for%20login%20page%20background&width=1920&height=1080&seq=2&orientation=landscape)",
      }}
    >
      <div className="w-full max-w-2xl bg-white p-12 rounded-xl shadow-lg">
        <h2 className="text-4xl font-semibold text-center text-gray-900 mb-10">
          ADMIN PANEL SIGNIN
        </h2>
        <form onSubmit={handleSubmit} className="space-y-8 relative">
          {isLoading && progressValue > 0 && (
            <div className="absolute -top-6 left-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
          )}

          <div className="group relative mb-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              disabled={isLoading}
              className={`w-full px-6 py-4 text-lg border ${
                !email && "border-gray-200"
              } ${
                email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                  ? "border-red-300 bg-red-50"
                  : email
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
              <div className="absolute -bottom-6 left-0 text-red-500 text-sm">
                <i className="fas fa-exclamation-circle mr-1"></i>
                Please enter a valid email address
              </div>
            )}
            {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                <i className="fas fa-check-circle"></i>
              </div>
            )}
          </div>

          <div className="relative group mt-10 mb-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isLoading}
              className={`w-full px-6 py-4 text-lg border ${
                !password ? "border-gray-200" : password.length < 6 ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-5 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <i
                className={`fas ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                } text-gray-400 text-xl`}
              ></i>
            </button>
            {password && password.length < 6 && (
              <div className="absolute -bottom-6 left-0 text-red-500 text-sm">
                <i className="fas fa-exclamation-circle mr-1"></i>
                Password should be at least 6 characters
              </div>
            )}
            {password && password.length >= 6 && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-green-500">
                <i className="fas fa-check-circle"></i>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="!rounded-button w-full py-4 text-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white whitespace-nowrap relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                <span>Signing in...</span>
                <span
                  className="absolute bottom-0 left-0 h-1 bg-white/30"
                  style={{
                    width: `${Math.min(
                      (Date.now() % 1500) / 15,
                      100,
                    )}%`,
                    transition: "width 0.3s ease-in-out",
                  }}
                ></span>
              </span>
            ) : (
              "SIGN IN"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg relative overflow-hidden">
            <div className="flex items-center">
              <div className="bg-green-600 text-white rounded-full p-2 mr-3">
                <i className="fas fa-check text-xl"></i>
              </div>
              <div>
                <p className="font-medium">{successMessage}</p>
                <p className="text-sm text-green-600 mt-1">
                  Redirecting you in a moment...
                </p>
              </div>
            </div>
          </div>
        )}

        {resetFlowSuccessMessage && (
           <div className="mt-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
               <div className="flex items-center">
                    <div className="bg-green-600 text-white rounded-full p-2 mr-3">
                        <i className="fas fa-check text-xl"></i>
                    </div>
                    <p className="font-medium">{resetFlowSuccessMessage}</p>
               </div>
           </div>
        )}


        <div className="mt-8 flex justify-center items-center">
          <a
            href="#"
            id="forgotPassword"
            className="text-2xl text-blue-600 cursor-pointer hover:text-blue-700 transition-colors duration-200"
            onClick={(e) => {
              e.preventDefault();
              setShowResetModal(true);
            }}
          >
            Forgot password?
          </a>
        </div>
      </div>

      {/* Password Reset Request Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            backgroundImage:
              "url(https://readdy.ai/api/search-image?query=modern%20minimalist%20abstract%20background%20with%20soft%20gradient%20colors%20in%20light%20blue%20and%20purple%2C%20featuring%20subtle%20geometric%20patterns%20and%20smooth%20transitions%2C%20perfect%20for%20modal%20overlay%20background&width=1920&height=1080&seq=3&orientation=landscape)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay",
          }}
        >
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                Reset Your Password
              </h3>
              <button
                onClick={closeResetModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {!resetCodeSent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleForgotPasswordRequest();
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="resetEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    disabled={isResetting}
                  />
                  {resetError && (
                    <p className="text-red-600 text-sm">
                      <i className="fas fa-exclamation-circle mr-1"></i>
                      {resetError}
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeResetModal}
                    className="!rounded-button flex-1 py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isResetting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="!rounded-button flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isResetting}
                  >
                    {isResetting ? (
                      <span className="flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Sending...
                      </span>
                    ) : (
                      "Send Code"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check text-green-600 text-2xl"></i>
                </div>
                <h4 className="text-xl font-medium text-gray-900 mb-2">
                  Reset Code Sent
                </h4>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset code to your email address. Please
                  check your inbox.
                </p>
                <button
                  onClick={() => setShowOtpModal(true)} // Button to open OTP modal
                  className="!rounded-button w-full py-3 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap cursor-pointer mb-3"
                >
                  Enter Code
                </button>
                 <button
                   onClick={closeResetModal} // Button to close the current modal
                   className="!rounded-button w-full py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap cursor-pointer"
                 >
                   Close
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OTP Verification and New Password Modal */}
      {showOtpModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{
            backgroundImage:
              "url(https://readdy.ai/api/search-image?query=modern%20minimalist%20abstract%20background%20with%20soft%20gradient%20colors%20in%20light%20blue%20and%20purple%2C%20featuring%20subtle%20geometric%20patterns%20and%20smooth%20transitions%2C%20perfect%20for%20modal%20overlay%20background&width=1920&height=1080&seq=3&orientation=landscape)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay",
          }}
        >
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                Enter Verification Code
              </h3>
              <button
                onClick={closeOtpModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="otpCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  disabled={isOtpLoading}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  disabled={isOtpLoading}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  disabled={isOtpLoading}
                />
              </div>
              {otpError && (
                <p className="text-red-600 text-sm">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {otpError}
                </p>
              )}
              <button
                type="submit"
                className="!rounded-button w-full py-3 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isOtpLoading}
              >
                {isOtpLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSignin;

