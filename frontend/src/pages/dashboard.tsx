// frontend/src/App.tsx
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useRef, useEffect, useContext } from "react"; // Added useContext
import { useNavigate } from "react-router-dom"; // Added useNavigate
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import * as echarts from "echarts"; // Keep if you use echarts, otherwise remove
import AuthContext from "../context/AuthContext"; // Assuming path is correct

const App: React.FC = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext) as AuthContextType; // Get auth context
  const { isAuthenticated, isLoading: isAuthLoading } = authContext || {
    isAuthenticated: false,
    isLoading: true,
  };

  const [language, setLanguage] = useState<"en" | "gu">("en");
  const [showChatbot, setShowChatbot] = useState(false);
  const leaderboardChartRef = useRef<HTMLDivElement>(null);

  const translations = {
    en: {
      nav: {
        schedule: "Schedule Pickup",
        education: "Education",
        rewards: "Rewards",
        profile: "Profile",
        signIn: "Sign In",
        community: "Community",
      },
      hero: {
        title: "Dispose E-Waste Safely, Earn Rewards!",
        cta: "Schedule Pickup",
      },
      awareness: {
        fact: "Over 50 million tons of e-waste is generated globally each year",
        video: "Learn About E-Waste Impact",
        quiz: "Take Environmental Quiz",
        didYouKnow: "Did you know?",
        together: "Together we can make a difference",
        envImpact: "Environmental Impact",
        learnDispose: "Learn how to dispose responsibly",
        recyclingBenefits: "Recycling Benefits",
        startRecycling: "Start recycling today",
        toxicWaste: "70% of toxic waste in landfills comes from e-waste",
        laptopEnergy:
          "Recycling one million laptops saves energy equivalent to 3,500 homes",
      },
      stats: {
        collected: "Tons of E-Waste Collected",
        since: "Since 2024",
        users: "Active Users",
        cities: "Across 12 Cities",
        rewards: "Rewards Distributed",
        points: "In Green Points",
        recycling: "Recycling Rate",
        process: "ISO Certified Process",
        monthlyGrowth: "Monthly Growth",
        wasteCollection: "In waste collection",
        communityImpact: "Community Impact",
        localPartnerships: "Local partnerships",
        carbonOffset: "Carbon Offset",
        tonsSaved: "Tons CO₂ saved",
      },
      gamification: {
        topContributors: "Top Contributors",
        referFriend: "Refer a Friend (+100 Points)", // Corrected placeholder
        communityActivities: "Community Activities",
        contributed: "Contributed 5kg of e-waste",
        hoursAgo: "2 hours ago",
      },
      chatbot: {
        title: "DigitalDump Assistant",
        help: "How can I help you today?",
      },
      footer: {
        tagline: "Making e-waste management rewarding and sustainable.",
        quickLinks: "Quick Links",
        aboutUs: "About Us",
        howItWorks: "How It Works",
        impactReport: "Impact Report",
        contact: "Contact",
        followUs: "Follow Us",
        rights: "© 2025 DigitalDump. All rights reserved.",
      },
    },
    gu: {
      nav: {
        schedule: "પિકઅપ શેડ્યૂલ કરો",
        education: "શિક્ષણ",
        rewards: "રિવોર્ડ્સ",
        profile: "પ્રોફાઇલ",
        signIn: "સાઇન ઇન કરો",
        community: "સમુદાય",
      },
      hero: {
        title: "ઇ-કચરો સુરક્ષિત રીતે નિકાલ કરો, રિવોર્ડ્સ કમાઓ!",
        cta: "પિકઅપ શેડ્યૂલ કરો",
      },
      awareness: {
        fact: "દર વર્ષે વૈશ્વિક સ્તરે 50 મિલિયન ટન ઇ-કચરો ઉત્પન્ન થાય છે",
        video: "ઇ-કચરાની અસર વિશે જાણો",
        quiz: "પર્યાવરણ ક્વિઝ લો",
        didYouKnow: "શું તમે જાણો છો?",
        together: "સાથે મળીને આપણે ફરક પાડી શકીએ છીએ",
        envImpact: "પર્યાવરણીય અસર",
        learnDispose: "જવાબદારીપૂર્વક નિકાલ કરવાનું શીખો",
        recyclingBenefits: "રિસાયકલિંગના ફાયદા",
        startRecycling: "આજે જ રિસાયકલિંગ શરૂ કરો",
        toxicWaste: "લેન્ડફિલમાં 70% ઝેરી કચરો ઇ-કચરામાંથી આવે છે",
        laptopEnergy:
          "એક મિલિયન લેપટોપનું રિસાયકલિંગ 3,500 ઘરોની ઊર્જા બચાવે છે",
      },
      stats: {
        collected: "ઇ-કચરો એકત્રિત કર્યો",
        since: "2024થી",
        users: "સક્રિય વપરાશકર્તાઓ",
        cities: "12 શહેરોમાં",
        rewards: "વિતરિત રિવોર્ડ્સ",
        points: "ગ્રીન પોઈન્ટ્સમાં",
        recycling: "રિસાયકલિંગ દર",
        process: "ISO પ્રમાણિત પ્રક્રિયા",
        monthlyGrowth: "માસિક વૃદ્ધિ",
        wasteCollection: "કચરા સંગ્રહમાં",
        communityImpact: "સમુદાય પર અસર",
        localPartnerships: "સ્થાનિક ભાગીદારી",
        carbonOffset: "કાર્બન ઓફસેટ",
        tonsSaved: "ટન CO₂ બચાવ્યો",
      },
      gamification: {
        topContributors: "શ્રેષ્ઠ યોગદાનકર્તાઓ",
        referFriend: "મિત્રને રેફર કરો (+100 પોઈન્ટ્સ)",
        communityActivities: "સમુદાય પ્રવૃત્તિઓ",
        contributed: "5 કિલો ઇ-કચરો યોગદાન કર્યો",
        hoursAgo: "2 કલાક પહેલા",
      },
      chatbot: {
        title: "ડિજિટલડમ્પ સહાયક",
        help: "હું આજે તમારી કેવી રીતે મદદ કરી શકું?",
      },
      footer: {
        tagline: "ઇ-કચરા વ્યવસ્થાપનને ફાયદાકારક અને ટકાઉ બનાવવું.",
        quickLinks: "ઝડપી લિંક્સ",
        aboutUs: "અમારા વિશે",
        howItWorks: "કેવી રીતે કામ કરે છે",
        impactReport: "પ્રભાવ અહેવાલ",
        contact: "સંપર્ક",
        followUs: "અમને અનુસરો",
        rights: "© 2025 ડિજિટલડમ્પ. બધા હકો અનામત છે.",
      },
    },
  };

  useEffect(() => {
    if (leaderboardChartRef.current) {
      // This is static data. For dynamic data, you'd fetch from an API.
      const leaderboardData = [
        { name: "Raj Mehta", points: 2450 },
        { name: "Priya Singh", points: 2100 },
        { name: "Amit Patel", points: 1850 },
      ];
      // Consider using a proper charting library or React components for the leaderboard
      // instead of innerHTML for better performance and maintainability.
      leaderboardChartRef.current.innerHTML = `
<div class="space-y-4">
${leaderboardData
  .map(
    (user, index) => `
<div class="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
<div class="flex items-center gap-4">
<div class="w-8 h-8 flex items-center justify-center bg-emerald-600 text-white rounded-full font-bold">
${index + 1}
</div>
<div class="font-semibold">${user.name}</div>
</div>
<div class="font-bold text-emerald-600">${user.points} pts</div>
</div>
`,
  )
  .join("")}
</div>
`;
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleUserIconClick = () => {
    if (isAuthLoading) return; // Don't navigate if auth state is still loading
    if (isAuthenticated) {
      navigate("/profile");
    } else {
      navigate("/user/signin");
    }
  };

  // If AuthContext is still loading its initial state, show a simple loader or nothing
  // to prevent rendering based on potentially incorrect auth state.
  if (isAuthLoading && !isAuthenticated) { // Check !isAuthenticated to avoid flicker if already logged in
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="text-2xl font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors duration-300"
          >
            DigitalDump
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex gap-6">
              <button
                onClick={() => navigate("/schedule-pickup")}
                className="!rounded-button whitespace-nowrap cursor-pointer text-gray-600 hover:text-emerald-600"
              >
                {translations[language].nav.schedule}
              </button>
              <button
                onClick={() => navigate("/education")}
                className="!rounded-button whitespace-nowrap cursor-pointer text-gray-600 hover:text-emerald-600"
              >
                {translations[language].nav.education}
              </button>
              <button
                onClick={() => navigate("/rewards")}
                className="!rounded-button whitespace-nowrap cursor-pointer text-gray-600 hover:text-emerald-600"
              >
                {translations[language].nav.rewards}
              </button>
              <button
                onClick={() => navigate("/community")}
                className="!rounded-button whitespace-nowrap cursor-pointer text-gray-600 hover:text-emerald-600"
              >
                {translations[language].nav.community}
              </button>
            </nav>
            <button
              onClick={() => setLanguage(language === "en" ? "gu" : "en")}
              className="!rounded-button whitespace-nowrap cursor-pointer px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
            >
              <span className="transition-opacity duration-300">
                {language === "en" ? "ગુજરાતી" : "English"}
              </span>
            </button>
            <button
              onClick={handleUserIconClick}
              className="cursor-pointer hover:opacity-80 transition-opacity duration-300"
              aria-label={isAuthenticated ? translations[language].nav.profile : translations[language].nav.signIn}
            >
              <i className="fas fa-user-circle text-2xl text-gray-600 hover:text-emerald-600 transition-colors duration-300"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-emerald-50 to-emerald-100">
        <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
              {translations[language].hero.title}
            </h1>
            <button
              onClick={() => navigate("/schedule-pickup")}
              className="!rounded-button whitespace-nowrap cursor-pointer bg-emerald-600 text-white px-8 py-4 text-lg font-semibold rounded-lg hover:bg-emerald-700 hover:scale-105 transition-all duration-300 w-fit"
            >
              {translations[language].hero.cta}
            </button>
          </div>
          <div className="relative h-[300px] md:h-[400px] overflow-hidden rounded-2xl shadow-lg">
            <img
              src="https://public.readdy.ai/ai/img_res/5eb1f0ed0cf4ae633e1beda2b7cbb13a.jpg" // Replace with a relevant, high-quality image
              alt="E-waste collection and recycling concept"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Awareness Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1} // Default for mobile
            breakpoints={{
              // when window width is >= 640px
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              // when window width is >= 1024px
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
            }}
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            className="pb-12" // For pagination dots
          >
            <SwiperSlide>
              <div
                onClick={() => navigate("/education")} // Example navigation
                className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 rounded-xl h-[350px] md:h-[400px] flex flex-col justify-between group hover:shadow-xl hover:scale-105 hover:bg-gradient-to-br hover:from-emerald-100 hover:to-emerald-200 transition-all duration-300 cursor-pointer"
              >
                <div className="text-xl md:text-2xl font-semibold text-gray-900">
                  {translations[language].awareness.didYouKnow}
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-4">
                    {translations[language].awareness.fact}
                  </div>
                  <div className="text-sm text-emerald-700">
                    {translations[language].awareness.together}
                  </div>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div
                onClick={() => navigate("/education")} // Example navigation
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl h-[350px] md:h-[400px] flex flex-col justify-between group hover:shadow-xl hover:scale-105 hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 transition-all duration-300 cursor-pointer"
              >
                <div className="text-xl md:text-2xl font-semibold text-gray-900">
                  {translations[language].awareness.envImpact}
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-4">
                    {translations[language].awareness.toxicWaste}
                  </div>
                  <div className="text-sm text-blue-700">
                    {translations[language].awareness.learnDispose}
                  </div>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div
                onClick={() => navigate("/education")} // Example navigation
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl h-[350px] md:h-[400px] flex flex-col justify-between group hover:shadow-xl hover:scale-105 hover:bg-gradient-to-br hover:from-purple-100 hover:to-purple-200 transition-all duration-300 cursor-pointer"
              >
                <div className="text-xl md:text-2xl font-semibold text-gray-900">
                  {translations[language].awareness.recyclingBenefits}
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-4">
                    {translations[language].awareness.laptopEnergy}
                  </div>
                  <div className="text-sm text-purple-700">
                    {translations[language].awareness.startRecycling}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Stats items... */}
            <div className="text-center hover:transform hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-bold mb-2">15.2K</div>
              <div className="text-md md:text-lg opacity-90 transition-opacity duration-300">
                {translations[language].stats.collected}
              </div>
              <div className="mt-2 text-xs md:text-sm opacity-75 transition-opacity duration-300">
                {translations[language].stats.since}
              </div>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-bold mb-2">45K+</div>
              <div className="text-md md:text-lg opacity-90 transition-opacity duration-300">
                {translations[language].stats.users}
              </div>
              <div className="mt-2 text-xs md:text-sm opacity-75 transition-opacity duration-300">
                {translations[language].stats.cities}
              </div>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-bold mb-2">₹2.1M</div>
              <div className="text-md md:text-lg opacity-90 transition-opacity duration-300">
                {translations[language].stats.rewards}
              </div>
              <div className="mt-2 text-xs md:text-sm opacity-75 transition-opacity duration-300">
                {translations[language].stats.points}
              </div>
            </div>
            <div className="text-center hover:transform hover:scale-105 transition-transform duration-300 cursor-pointer">
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-md md:text-lg opacity-90 transition-opacity duration-300">
                {translations[language].stats.recycling}
              </div>
              <div className="mt-2 text-xs md:text-sm opacity-75 transition-opacity duration-300">
                {translations[language].stats.process}
              </div>
            </div>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* More stats items... */}
            <div className="bg-emerald-500 rounded-xl p-6 hover:bg-emerald-400 transition-colors duration-300 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <i className="fas fa-recycle text-2xl md:text-3xl"></i>
                <div className="text-lg md:text-xl font-semibold">
                  {translations[language].stats.monthlyGrowth}
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2">+25%</div>
              <div className="opacity-75 text-sm md:text-base">
                {translations[language].stats.wasteCollection}
              </div>
            </div>
            <div className="bg-emerald-500 rounded-xl p-6 hover:bg-emerald-400 transition-colors duration-300 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <i className="fas fa-users text-2xl md:text-3xl"></i>
                <div className="text-lg md:text-xl font-semibold">
                  {translations[language].stats.communityImpact}
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2">120+</div>
              <div className="opacity-75 text-sm md:text-base">
                {translations[language].stats.localPartnerships}
              </div>
            </div>
            <div className="bg-emerald-500 rounded-xl p-6 hover:bg-emerald-400 transition-colors duration-300 cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <i className="fas fa-tree text-2xl md:text-3xl"></i>
                <div className="text-lg md:text-xl font-semibold">
                  {translations[language].stats.carbonOffset}
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2">5.8K</div>
              <div className="opacity-75 text-sm md:text-base">
                {translations[language].stats.tonsSaved}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {translations[language].gamification.topContributors}
            </h2>
            <div
              ref={leaderboardChartRef}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              {/* Leaderboard will be injected here by useEffect */}
            </div>
            <button
              onClick={() => navigate("/rewards")} // Example navigation
              className="!rounded-button whitespace-nowrap cursor-pointer mt-4 w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700"
            >
              {translations[language].gamification.referFriend}
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-6">
              {translations[language].gamification.communityActivities}
            </h2>
            <div className="space-y-4">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  onClick={() => navigate("/community")} // Example navigation
                  className="bg-white p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20diverse%20person%20with%20a%20friendly%20smile%20against%20a%20neutral%20background&width=50&height=50&flag=2515d9c7511b71b005516774a12249cd&seq=${
                        index + 3 // Ensure unique images
                      }&orientation=squarish`}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">
                        {translations[language].gamification.contributed}
                      </div>
                      <div className="text-sm text-gray-500">
                        {translations[language].gamification.hoursAgo}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        {showChatbot && (
          <div className="bg-white rounded-lg shadow-xl p-4 mb-4 w-[300px] md:w-[350px] border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold text-emerald-700">
                {translations[language].chatbot.title}
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close chatbot"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="text-gray-600 text-sm">
              {translations[language].chatbot.help}
            </div>
            {/* Add chatbot interaction elements here */}
          </div>
        )}
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="!rounded-button whitespace-nowrap cursor-pointer bg-emerald-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
          aria-label="Toggle chatbot"
        >
          <i className="fas fa-comments text-2xl"></i>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div
              onClick={() => navigate("/")}
              className="text-2xl font-bold text-white mb-4 cursor-pointer"
            >
              DigitalDump
            </div>
            <p className="text-sm transition-opacity duration-300">
              {translations[language].footer.tagline}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4 transition-opacity duration-300">
              {translations[language].footer.quickLinks}
            </h3>
            <div className="space-y-2">
              {/* Placeholder navigations, update paths as needed */}
              <div
                onClick={() => navigate("/about")} // Example: /about
                className="cursor-pointer hover:text-white transition-colors duration-300"
              >
                {translations[language].footer.aboutUs}
              </div>
              <div
                onClick={() => navigate("/how-it-works")} // Example: /how-it-works
                className="cursor-pointer hover:text-white transition-colors duration-300"
              >
                {translations[language].footer.howItWorks}
              </div>
              <div
                onClick={() => navigate("/impact")} // Example: /impact
                className="cursor-pointer hover:text-white transition-colors duration-300"
              >
                {translations[language].footer.impactReport}
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4 transition-opacity duration-300">
              {translations[language].footer.contact}
            </h3>
            <div className="space-y-2">
              <div>support@digitaldump.com</div>
              <div>+91 98765 43210</div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4 transition-opacity duration-300">
              {translations[language].footer.followUs}
            </h3>
            <div className="flex gap-4 text-xl">
              {/* Replace # with actual links */}
              <a href="#" aria-label="Facebook" className="cursor-pointer hover:text-white hover:scale-110 transition-all duration-300"><i className="fab fa-facebook"></i></a>
              <a href="#" aria-label="Twitter" className="cursor-pointer hover:text-white hover:scale-110 transition-all duration-300"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="Instagram" className="cursor-pointer hover:text-white hover:scale-110 transition-all duration-300"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="LinkedIn" className="cursor-pointer hover:text-white hover:scale-110 transition-all duration-300"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-sm text-center">
          <span className="transition-opacity duration-300">
            {translations[language].footer.rights}
          </span>
        </div>
      </footer>
    </div>
  );
};
export default App;
