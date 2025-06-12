// The exported code uses Tailwind CSS. Install Tailwind CSS in
// your dev environment to ensure all styles work.
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CollectorSignin: React.FC = () => {
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.emailOrPhone || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/collection-agent/signin", {
        email: formData.emailOrPhone, // Assuming email is used for login
        password: formData.password,
      });

      // Store the token
      localStorage.setItem("token", response.data.token);

      // Redirect to the collection agent dashboard
      navigate("/collector/dashboard");
    } catch (err: any) {
      console.error("Collector sign-in failed:", err);
      setError(
        err.response?.data?.message || "Sign-in failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center border-b border-gray-100">
        <div className="text-xl font-semibold text-green-600">
          <i className="fas fa-recycle mr-2"></i>
          DigitalDump
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-12 flex items-center justify-center gap-16">
        {/* Left Side - Hero Image */}
        <div className="hidden lg:block w-[450px]">
          <img
            src="https://public.readdy.ai/ai/img_res/cb3c20f227a44a8034b52be3d43793ac.jpg"
            alt="Login Hero"
            className="w-full h-[500px] rounded-2xl shadow-xl object-cover"
          />
        </div>
        {/* Right Side - Login Form */}
        <div className="w-[450px]">
          <div className="w-full bg-white p-12 rounded-2xl shadow-xl border border-gray-100">
            <h1 className="text-4xl font-bold text-gray-800 mb-12">
              Welcome Back
            </h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  className="block text-gray-700 text-lg mb-3"
                  htmlFor="emailOrPhone"
                >
                  Email
                </label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                  <input
                    type="email"
                    id="emailOrPhone"
                    value={formData.emailOrPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, emailOrPhone: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors text-base"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <label
                  className="block text-gray-700 text-lg mb-3"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors text-base"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i
                      className={`fas ${
                        showPassword ? "fa-eye-slash" : "fa-eye"
                      } text-lg`}
                    ></i>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="!rounded-button w-full py-5 bg-green-600 text-white text-lg font-semibold hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Reset Password
            </h3>
            <p className="text-gray-600 mb-6">
              Enter your email address and we'll send you instructions to reset
              your password.
            </p>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors text-sm mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowForgotModal(false)}
                className="!rounded-button flex-1 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button className="!rounded-button flex-1 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap">
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorSignin;
