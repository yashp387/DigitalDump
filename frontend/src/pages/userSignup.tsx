import React, { useState } from "react";
// Import the specific API function
import { userSignup } from "../services/api"; // Adjust path if needed
import { useNavigate } from "react-router-dom";

// Rename component to reflect its purpose
const UserSignup: React.FC = () => {
  const navigate = useNavigate();
  const [isEnglish, setIsEnglish] = useState(true);
  // Define the type for formData explicitly for better type safety
  interface FormDataState {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
    enteredReferralCode: string; // Keep it as string, handle empty case during submission
  }
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    enteredReferralCode: "",
  });
  const [signupError, setSignupError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const texts = {
    english: {
      title: "Digital Dump",
      login: "Login",
      signupTitle: "Join Digital Dump",
      name: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      address: "Complete Address",
      password: "Password",
      referralCode: "Referral Code (Optional)",
      signup: "Sign Up",
      footer: "© 2025 Digital Dump. All rights reserved.",
      signupSuccess: "Account created successfully! Redirecting to signin...",
      signupFailed: "Signup failed. Please try again.",
      signupFailedConsole: "Signup failed. Please check the console.",
      loading: "Signing up...",
    },
    gujarati: {
      title: "ડિજિટલ ડમ્પ",
      login: "લૉગિન",
      signupTitle: "ડિજિટલ ડમ્પમાં જોડાઓ",
      name: "પૂરું નામ",
      email: "ઇમેઇલ સરનામું",
      phone: "ફોન નંબર",
      address: "સંપૂર્ણ સરનામું",
      password: "પાસવર્ડ",
      referralCode: "રેફરલ કોડ (વૈકલ્પિક)",
      signup: "સાઇન અપ કરો",
      footer: "© 2025 ડિજિટલ ડમ્પ. બધા હકો સુરક્ષિત.",
      signupSuccess: "એકાઉન્ટ સફળતાપૂર્વક બનાવ્યું! સાઇન ઇન પર રીડાયરેક્ટ કરી રહ્યાં છીએ...",
      signupFailed: "સાઇન અપ નિષ્ફળ થયું. કૃપા કરીને ફરી પ્રયાસ કરો.",
      signupFailedConsole: "સાઇન અપ નિષ્ફળ થયું. કૃપા કરીને કન્સોલ તપાસો.",
      loading: "સાઇન અપ કરી રહ્યું છે...",
    },
  };

  const currentText = isEnglish ? texts.english : texts.gujarati;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setIsLoading(true); // Set loading true

    // --- CORRECTED DATA PREPARATION ---
    // Destructure to separate referral code from the rest
    const { enteredReferralCode, ...restOfFormData } = formData;
    // Create the base data object without the referral code initially
    const dataToSend: Omit<FormDataState, 'enteredReferralCode'> & { enteredReferralCode?: string } = {
         ...restOfFormData
    };

    // Conditionally add the referral code ONLY if it has a non-empty, trimmed value
    const trimmedCode = enteredReferralCode.trim();
    if (trimmedCode) {
      dataToSend.enteredReferralCode = trimmedCode; // Add the property if valid
    }
    // --- END CORRECTION ---

    try {
      // Use the imported API function with the correctly prepared dataToSend
      const response = await userSignup(dataToSend);

      // Assuming successful signup returns data including a token
      if (response && response.token) {
        alert(currentText.signupSuccess);
        navigate("/user/signin"); // Navigate to signin page
      } else {
        // Handle cases where backend might return 2xx but no token
        setSignupError(response?.message || currentText.signupFailed);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      // Use error message from API response if available
      if (error.response?.data?.message) {
        setSignupError(error.response.data.message);
      } else {
        setSignupError(currentText.signupFailedConsole);
      }
    } finally {
      setIsLoading(false); // Set loading false regardless of outcome
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-[#4CAF50]">
            {currentText.title}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsEnglish(!isEnglish)}
              className="px-4 py-2 text-sm font-medium text-[#4CAF50] hover:bg-[#E8F5E9] !rounded-button cursor-pointer whitespace-nowrap"
            >
              {isEnglish ? "ગુજરાતી" : "English"}
            </button>
            {/* Link to Signin page */}
            <button
              onClick={() => navigate("/user/signin")} // Navigate on click
              className="px-6 py-3 text-base font-semibold text-[#4CAF50] border border-[#4CAF50] hover:bg-[#E8F5E9] !rounded-button cursor-pointer whitespace-nowrap"
            >
              {currentText.login}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white flex items-center">
        <div className="max-w-7xl mx-auto px-4 py-12 flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
            {/* Illustration and Quote */}
            <div className="space-y-6 self-center flex flex-col justify-center">
              <div className="rounded-lg overflow-hidden shadow-md">
                <img
                  src="https://public.readdy.ai/ai/img_res/89ba3b29527000ccd3b0ccba7b566187.jpg"
                  alt="E-waste Recycling Illustration"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="bg-[#E8F5E9] p-6 rounded-lg">
                <blockquote className="relative">
                  <i className="fa-solid fa-quote-left text-[#4CAF50] text-3xl absolute -top-2 -left-2 opacity-20"></i>
                  <p className="text-gray-700 text-lg italic ml-6">
                    {isEnglish
                      ? "Join us in our mission to create a sustainable future by responsibly managing electronic waste. Every device recycled is a step towards a greener tomorrow."
                      : "ઇલેક્ટ્રોનિક કચરાનું જવાબદારીપૂર્વક સંચાલન કરીને ટકાઉ ભવિષ્ય બનાવવાના અમારા મિશનમાં જોડાઓ. રીસાયકલ કરેલું દરેક ઉપકરણ એક હરિયાળા આવતીકાલ તરફનું પગલું છે."}
                  </p>
                  <i className="fa-solid fa-quote-right text-[#4CAF50] text-3xl absolute -bottom-2 -right-2 opacity-20"></i>
                </blockquote>
              </div>
            </div>

            {/* Signup Form */}
            <div className="bg-white p-8 rounded-lg shadow-md self-center flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-[#4CAF50] mb-6">
                {currentText.signupTitle}
              </h2>
              {signupError && (
                <div className="text-red-500 mb-4 text-sm">{signupError}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">
                    {currentText.name}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base border border-[#DDDDDD] !rounded-button focus:outline-none focus:ring-1 focus:ring-[#4CAF50] focus:border-transparent"
                    required
                    disabled={isLoading}
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">
                    {currentText.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base border border-[#DDDDDD] !rounded-button focus:outline-none focus:ring-1 focus:ring-[#4CAF50] focus:border-transparent"
                    required
                    disabled={isLoading}
                  />
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">
                    {currentText.phone}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base border border-[#DDDDDD] !rounded-button focus:outline-none focus:ring-1 focus:ring-[#4CAF50] focus:border-transparent"
                    required
                    disabled={isLoading}
                  />
                </div>
                {/* Address */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">
                    {currentText.address}
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3} // Reduced rows slightly
                    className="w-full px-4 py-2 text-base border border-[#DDDDDD] !rounded-button focus:outline-none focus:ring-1 focus:ring-[#4CAF50] focus:border-transparent resize-none"
                    required
                    disabled={isLoading}
                  />
                </div>
                {/* Password */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">
                    {currentText.password}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base border border-[#DDDDDD] !rounded-button focus:outline-none focus:ring-1 focus:ring-[#4CAF50] focus:border-transparent"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Referral Code Input */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-1">
                    {currentText.referralCode}
                  </label>
                  <input
                    type="text"
                    name="enteredReferralCode" // Match state key
                    value={formData.enteredReferralCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base border border-[#DDDDDD] !rounded-button focus:outline-none focus:ring-1 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Enter code if you have one" // Optional placeholder
                    disabled={isLoading}
                    maxLength={8} // Match backend code length
                    style={{ textTransform: "uppercase" }} // Visually suggest uppercase
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading} // Disable button when loading
                  className="w-full bg-[#4CAF50] text-white py-3 px-8 !rounded-button hover:bg-[#388E3C] hover:shadow-lg transition-all duration-300 cursor-pointer whitespace-nowrap text-lg font-semibold tracking-wide disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? currentText.loading : currentText.signup}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#E8F5E9] py-4">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-gray-600">
            {currentText.footer}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default UserSignup; // Export with the correct name
