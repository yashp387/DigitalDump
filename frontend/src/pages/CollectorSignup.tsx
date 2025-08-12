// src/pages/CollectorSignup.tsx
import React, { useState, useRef, useEffect } from "react"; // Added useRef, useEffect
import { useNavigate } from "react-router-dom";
import { collectorSignup } from "../services/api"; // Ensure this path is correct

const CollectorSignup: React.FC = () => {
  const navigate = useNavigate();
  // Ref for the file input to allow resetting it programmatically if needed
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    area: "",
    city: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    gpcbCertificate: null as File | null, // Explicitly initialize as null
  });

  // Log state changes for the file to help debug
  useEffect(() => {
    console.log(
      "[useEffect] gpcbCertificate state updated:",
      formData.gpcbCertificate
    );
  }, [formData.gpcbCertificate]);

  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    area: "",
    city: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    gpcbCertificate: "",
    terms: "",
    apiError: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- Validation Function (Ensure it checks for File instance) ---
  const validateForm = (): boolean => {
    let isValid = true;
    // Reset errors, including apiError
    const newErrors = {
      name: "",
      phone: "",
      email: "",
      street: "",
      area: "",
      city: "",
      pincode: "",
      password: "",
      confirmPassword: "",
      gpcbCertificate: "",
      terms: "",
      apiError: "",
    };

    // --- All validation checks ---
    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
      isValid = false;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\+?91[.\-\s]?\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit Indian phone number";
      isValid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }
    if (!formData.street.trim()) {
      newErrors.street = "Street is required";
      isValid = false;
    }
    if (!formData.area.trim()) {
      newErrors.area = "Area is required";
      isValid = false;
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
      isValid = false;
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
      isValid = false;
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
      isValid = false;
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (
      formData.password &&
      formData.confirmPassword !== formData.password
    ) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // --- CRITICAL: Check if gpcbCertificate is a valid File object ---
    if (
      !formData.gpcbCertificate ||
      !(formData.gpcbCertificate instanceof File)
    ) {
      console.error(
        "[validateForm] Validation failed: gpcbCertificate is not a File object or is null.",
        formData.gpcbCertificate
      );
      newErrors.gpcbCertificate =
        "GPCB Certificate file is required and must be a valid file.";
      isValid = false;
    } else {
      console.log(
        "[validateForm] Validation check: gpcbCertificate is a valid File object."
      );
    }

    if (!formData.agreeToTerms) {
      newErrors.terms = "You must agree to the terms";
      isValid = false;
    }
    // --- End validation checks ---

    setErrors(newErrors); // Set errors regardless of validity to clear old ones
    return isValid;
  };

  // --- Input Change Handler (Standard) ---
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const inputValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;

    setFormData((prev) => ({ ...prev, [name]: inputValue }));

    // Clear validation error for the specific field being changed
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Clear general API error when user interacts with the form
    if (errors.apiError) {
      setErrors((prev) => ({ ...prev, apiError: "" }));
    }
    // Clear terms error when checkbox is changed
    if (name === "agreeToTerms") {
      setErrors((prev) => ({ ...prev, terms: "" }));
    }
  };

  // --- File Change Handler (Focus on setting state correctly) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Get the first file selected
    console.log("[handleFileChange] File input changed. Selected file:", file);

    // Clear previous file error immediately
    setErrors((prev) => ({ ...prev, gpcbCertificate: "" }));

    // Check if a file was selected and it's actually a File object
    if (file && file instanceof File) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];

      // Perform validations (size, type)
      if (file.size > maxSize) {
        console.warn("[handleFileChange] File size validation failed.");
        setErrors((prev) => ({
          ...prev,
          gpcbCertificate: "File size exceeds 5MB limit.",
        }));
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input visually
        setFormData((prev) => ({ ...prev, gpcbCertificate: null })); // Reset state
      } else if (!allowedTypes.includes(file.type)) {
        console.warn(
          `[handleFileChange] File type validation failed: ${file.type}`
        );
        setErrors((prev) => ({
          ...prev,
          gpcbCertificate: `Invalid file type (${file.type}). Only PDF, JPG, PNG allowed.`,
        }));
        if (fileInputRef.current) fileInputRef.current.value = "";
        setFormData((prev) => ({ ...prev, gpcbCertificate: null }));
      } else {
        // --- Set state ONLY if file is valid ---
        console.log("[handleFileChange] File is valid. Setting state.");
        setFormData((prev) => ({ ...prev, gpcbCertificate: file }));
      }
    } else {
      // No file selected or invalid object
      console.warn(
        "[handleFileChange] No valid file selected or object is not a File."
      );
      setFormData((prev) => ({ ...prev, gpcbCertificate: null })); // Reset state if no file
    }
  };

  // --- Form Submission Handler (Focus on FormData append) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    console.log("[handleSubmit] Submit button clicked.");
    setErrors((prev) => ({ ...prev, apiError: "" })); // Clear previous API error

    // --- Log state right before validation ---
    console.log(
      "[handleSubmit] State BEFORE validation:",
      JSON.stringify(
        formData,
        (key, value) => {
          if (value instanceof File)
            return { name: value.name, size: value.size, type: value.type };
          return value;
        },
        2
      )
    );
    console.log(
      "[handleSubmit] Actual File object in state BEFORE validation:",
      formData.gpcbCertificate
    );

    // Run validation - this now includes the instanceof File check
    if (!validateForm()) {
      console.error(
        "[handleSubmit] Form validation failed. Submission stopped."
      );
      // Try to focus the first field with an error
      const firstErrorKey = Object.keys(errors).find(
        (key) => errors[key as keyof typeof errors] && key !== "apiError"
      );
      if (firstErrorKey) {
        const element = document.getElementById(firstErrorKey);
        element?.focus();
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return; // Stop if validation fails
    }

    console.log("[handleSubmit] Form validation passed.");
    setIsLoading(true); // Set loading state

    // --- Create FormData ---
    const data = new FormData();

    // Append all text fields
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("phoneNumber", formData.phone); // Key must match backend expectation
    data.append("street", formData.street);
    data.append("area", formData.area);
    data.append("city", formData.city);
    data.append("pincode", formData.pincode);
    data.append("password", formData.password);

    // --- CRITICAL: Append the File object ---
    // Double-check the state variable holds a File object before appending
    if (formData.gpcbCertificate && formData.gpcbCertificate instanceof File) {
      // Key 'certificateFile' MUST match backend: upload.single('certificateFile')
      data.append("certificateFile", formData.gpcbCertificate);
      console.log(
        `[handleSubmit] Appended file "${formData.gpcbCertificate.name}" to FormData.`
      );
    } else {
      // This case should be caught by validation, but is a final safeguard
      console.error(
        "[handleSubmit] CRITICAL ERROR: Cannot append file, state is invalid:",
        formData.gpcbCertificate
      );
      setErrors((prev) => ({
        ...prev,
        apiError:
          "Internal error: Invalid file state. Please re-select the file.",
      }));
      setIsLoading(false);
      return; // Stop submission
    }

    // Log keys being sent for confirmation
    console.log(
      "[handleSubmit] Sending FormData with keys:",
      Array.from(data.keys())
    );

    // --- API Call ---
    try {
      console.log("[handleSubmit] Calling collectorSignup API service...");
      const response = await collectorSignup(data); // Send the FormData
      console.log("[handleSubmit] API call successful:", response);
      setIsLoading(false);
      setShowSuccessModal(true); // Show success modal
    } catch (error: any) {
      console.error("[handleSubmit] API call failed:", error);
      setIsLoading(false);
      // Extract error message from backend or provide default
      const message =
        error.response?.data?.message ||
        "Signup failed. Please check your connection or contact support.";
      setErrors((prev) => ({ ...prev, apiError: message }));
      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to show error
    }
  };

  // --- Close Modal Handler ---
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate("/collector/signin"); // Redirect after closing modal
  };

  // --- JSX ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="w-full px-8 py-5 flex justify-between items-center bg-white shadow-sm backdrop-blur-sm bg-opacity-90 fixed top-0 z-50">
        <div
          className="text-3xl font-bold tracking-tight cursor-pointer"
          onClick={() => navigate("/")}
        >
          <i className="fas fa-recycle mr-3 text-green-600"></i>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-green-500 to-green-400">
            DigitalDump
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/collector/signin")}
            className="!rounded-button px-8 py-2.5 text-green-600 border-2 border-green-600 hover:bg-green-600 hover:text-white transition-all duration-300 font-semibold cursor-pointer whitespace-nowrap"
          >
            Login
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-32 pb-16">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-start">
          {/* Hero Section (Left) */}
          <div className="w-full md:w-1/2 space-y-10 sticky top-32 self-start">
            <div className="relative">
              <img
                src="https://public.readdy.ai/ai/img_res/cb3c20f227a44a8034b52be3d43793ac.jpg"
                alt="E-waste Collection Agent"
                className="w-full h-[450px] md:h-[500px] rounded-2xl shadow-2xl object-cover transform hover:scale-[1.02] transition-transform duration-300"
              />
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 px-6 py-2 rounded-full text-white text-sm font-medium shadow-lg">
                Join Our Network
              </div>
            </div>
            <div className="text-center space-y-6 pt-6 md:pt-10">
              <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800 leading-tight">
                Become a Door-to-Door
                <br />
                E-waste Collection Agent
              </h2>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
                Be part of our growing network making a positive impact on the
                environment and earning flexibly.
              </p>
              <div className="flex justify-center gap-6 md:gap-12 pt-6 md:pt-8">
                <div className="text-center bg-white p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-28 md:w-32">
                  <i className="fas fa-clock text-green-500 text-2xl md:text-3xl mb-2 md:mb-3"></i>
                  <p className="text-xs md:text-sm font-medium text-gray-700">
                    Flexible Hours
                  </p>
                </div>
                <div className="text-center bg-white p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-28 md:w-32">
                  <i className="fas fa-money-bill-wave text-green-500 text-2xl md:text-3xl mb-2 md:mb-3"></i>
                  <p className="text-xs md:text-sm font-medium text-gray-700">
                    Great Earnings
                  </p>
                </div>
                <div className="text-center bg-white p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-28 md:w-32">
                  <i className="fas fa-leaf text-green-500 text-2xl md:text-3xl mb-2 md:mb-3"></i>
                  <p className="text-xs md:text-sm font-medium text-gray-700">
                    Eco-Friendly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Signup Form (Right) */}
          <div className="w-full md:w-1/2 bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
            <div className="text-center mb-10 md:mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-green-500 to-green-400">
                  Agent Registration
                </span>
              </h1>
              <p className="text-gray-500 text-base md:text-lg">
                Complete the form to start your journey
              </p>
            </div>

            {/* Display API Error */}
            {errors.apiError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
                role="alert"
              >
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{errors.apiError}</span>
              </div>
            )}

            {/* Use noValidate to rely on custom validation */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 md:space-y-6"
              noValidate
            >
              {/* Name */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                  htmlFor="name"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                  placeholder="Enter your full name"
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
              {/* Phone */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                  htmlFor="phone"
                >
                  Phone Number (+91)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.phone ? "border-red-500" : "border-gray-200"
                  } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
              {/* Email */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                  placeholder="your.email@example.com"
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              {/* Address Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Street */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                    htmlFor="street"
                  >
                    Street
                  </label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.street ? "border-red-500" : "border-gray-200"
                    } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                    placeholder="Street name"
                    required
                  />
                  {errors.street && (
                    <p className="text-red-500 text-xs mt-1">{errors.street}</p>
                  )}
                </div>
                {/* Area */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                    htmlFor="area"
                  >
                    Area
                  </label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.area ? "border-red-500" : "border-gray-200"
                    } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                    placeholder="Area name"
                    required
                  />
                  {errors.area && (
                    <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                  )}
                </div>
                {/* City */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                    htmlFor="city"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.city ? "border-red-500" : "border-gray-200"
                    } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                    placeholder="City name"
                    required
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>
                {/* Pincode */}
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                    htmlFor="pincode"
                  >
                    Pincode
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    maxLength={6}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.pincode ? "border-red-500" : "border-gray-200"
                    } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                    placeholder="6-digit pincode"
                    required
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.pincode}
                    </p>
                  )}
                </div>
              </div>
              {/* Password */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                  placeholder="Enter a secure password (min. 6 characters)"
                  required
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              {/* Confirm Password */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-200"
                  } focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300 text-sm bg-gray-50 hover:bg-white`}
                  placeholder="Re-enter your password"
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              {/* GPCB Certificate Upload */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                  htmlFor="gpcbCertificate"
                >
                  GPCB Certificate (PDF, JPG, PNG - Max 5MB)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="gpcbCertificate"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 ${
                      errors.gpcbCertificate
                        ? "border-red-400"
                        : "border-green-200"
                    } border-dashed rounded-lg cursor-pointer ${
                      errors.gpcbCertificate ? "bg-red-50" : "bg-green-50"
                    } hover:bg-green-100 transition-all duration-300`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-2">
                      <i
                        className={`fas fa-cloud-upload-alt text-3xl ${
                          errors.gpcbCertificate
                            ? "text-red-400"
                            : "text-gray-400"
                        } mb-2`}
                      ></i>
                      {/* Display filename if state holds a valid File object */}
                      {formData.gpcbCertificate &&
                      formData.gpcbCertificate instanceof File ? (
                        <p className="text-sm text-gray-600 font-semibold truncate max-w-xs">
                          {formData.gpcbCertificate.name}
                        </p>
                      ) : (
                        <>
                          <p className="mb-1 text-sm text-gray-500">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag & drop
                          </p>
                          <p className="text-xs text-gray-500">
                            Required Certificate File
                          </p>
                        </>
                      )}
                    </div>
                    {/* Add the ref to the input */}
                    <input
                      ref={fileInputRef}
                      id="gpcbCertificate"
                      name="gpcbCertificate"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      required
                    />
                  </label>
                </div>
                {errors.gpcbCertificate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.gpcbCertificate}
                  </p>
                )}
              </div>
              {/* Terms and Conditions */}
              <div
                className={`flex items-center gap-3 ${
                  errors.terms
                    ? "bg-red-50 p-3 rounded-lg border border-red-300"
                    : "bg-gray-50 p-3 rounded-lg"
                }`}
              >
                <input
                  type="checkbox"
                  id="terms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-xs md:text-sm text-gray-600 font-medium"
                >
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    Terms and Conditions
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-500 text-xs -mt-4 mb-2 px-1">
                  {errors.terms}
                </p>
              )}
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="!rounded-button w-full py-3.5 md:py-4 text-base md:text-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold hover:from-green-700 hover:to-green-600 transition-all transform hover:scale-[1.02] duration-200 shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    {" "}
                    <i className="fas fa-spinner fa-spin mr-2"></i>{" "}
                    Submitting...{" "}
                  </>
                ) : (
                  "Sign Up Now"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white p-8 md:p-10 rounded-2xl max-w-md w-[90%] mx-4 transform transition-all duration-300 scale-100 shadow-2xl">
            <div className="text-center">
              <i className="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                Registration Submitted!
              </h3>
              <p className="text-gray-600 mb-6 text-sm md:text-base">
                Thank you for registering. Your application is under review.
                We'll contact you shortly via email or phone.
              </p>
              <button
                onClick={handleCloseModal}
                className="!rounded-button px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorSignup;
