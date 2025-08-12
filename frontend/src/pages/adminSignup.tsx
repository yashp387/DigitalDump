// frontend/src/components/AdminSignup.tsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as echarts from "echarts";

const AdminSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    if (!formData.fullName.trim()) {
      newErrors.push("Full name is required");
    }
    if (!formData.email.trim()) {
      newErrors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push("Please enter a valid email address");
    }
    if (!formData.password) {
      newErrors.push("Password is required");
    } else if (formData.password.length < 8) {
      newErrors.push("Password must be at least 8 characters long");
    }
    if (!formData.agreeToTerms) {
      newErrors.push("You must agree to the Terms and Conditions");
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]); // Clear previous errors
    setSuccessMessage(""); // Clear previous success message

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // **CHANGE:** Add the full backend URL here (including the port)
      const response = await axios.post(
        "http://localhost:5000/api/admin/signup",
        {
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
        }
      );

      setSuccessMessage(
        "Registration successful! Redirecting to sign-in page..."
      );
      // Store the token (e.g., in localStorage)
      localStorage.setItem("token", response.data.token);
      setTimeout(() => {
        navigate("/admin/signin"); // Redirect to sign-in page
      }, 2000);
    } catch (error: any) {
      console.error("Admin signup failed:", error);
      setErrors([
        error.response?.data?.message ||
          "Signup failed. Please try again later.",
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (): {
    strength: string;
    color: string;
  } => {
    const password = formData.password;
    if (password.length === 0)
      return {
        strength: "",
        color: "bg-gray-200",
      };
    if (password.length < 8)
      return {
        strength: "Weak",
        color: "bg-red-500",
      };
    if (password.length < 12)
      return {
        strength: "Medium",
        color: "bg-yellow-500",
      };
    return {
      strength: "Strong",
      color: "bg-green-500",
    };
  };

  const backgroundImageUrl =
    "https://public.readdy.ai/ai/img_res/aea4404b090b895e23c9134bf1653ce2.jpg";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${backgroundImageUrl})`,
      }}
    >
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-xl transition-all duration-300 hover:shadow-2xl hover:transform hover:scale-[1.02]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Signup
          </h1>
          <p className="text-gray-600">
            Create your admin account to get started
          </p>
        </div>
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 animate-fadeIn transition-all duration-300 hover:shadow-md">
            {errors.map((error, index) => (
              <p key={index} className="text-red-600 text-sm flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            ))}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 animate-fadeIn transition-all duration-300 hover:shadow-md">
            <p className="text-green-600 text-sm flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              {successMessage}
            </p>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-all duration-300 hover:text-blue-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    } text-gray-400 hover:text-blue-500 transition-colors duration-300`}
                  ></i>
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      getPasswordStrength().color
                    }`}
                  ></div>
                  <p className="text-sm text-gray-500 mt-1">
                    Password strength: {getPasswordStrength().strength}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer transition-all duration-300 hover:border-blue-400"
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  setFormData({ ...formData, agreeToTerms: e.target.checked })
                }
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-500 transition-colors duration-300 border-b border-transparent hover:border-blue-500"
                >
                  Terms and Conditions
                </a>
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="!rounded-button w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer whitespace-nowrap transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href="/admin/signin"
              className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer transition-all duration-300 border-b border-transparent hover:border-blue-500"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminSignup;
