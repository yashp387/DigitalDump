// Import necessary hooks
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
// ... (other imports like echarts, Swiper, etc.)

interface LanguageContent {
  [key: string]: {
    [key: string]: string;
  };
}
const App: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  const [language, setLanguage] = useState<"en" | "gu">("en");
  const [showChatbot, setShowChatbot] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([
    { name: "Rajesh Patel", points: 2500, badge: "🏆 Elite Recycler" },
    { name: "Priya Sharma", points: 2200, badge: "⭐ Pro Contributor" },
    { name: "Amit Desai", points: 2100, badge: "🌟 Green Champion" },
    { name: "Meera Joshi", points: 1900, badge: "🌱 Eco Warrior" },
    { name: "Vikram Singh", points: 1800, badge: "♻️ Earth Guardian" },
  ]);
  const [achievements, setAchievements] = useState([
    {
      title: "Super Recycler",
      description: "Recycled 100kg of e-waste",
      icon: "🏆",
      points: 500,
      date: "2025-03-20",
    },
    {
      title: "Community Leader",
      description: "Invited 10 friends to join",
      icon: "👥",
      points: 300,
      date: "2025-03-19",
    },
    {
      title: "Knowledge Master",
      description: "Completed all awareness quizzes",
      icon: "🎓",
      points: 200,
      date: "2025-03-18",
    },
  ]);
  const [impactStats, setImpactStats] = useState({
    treesPlanted: 1520,
    carbonOffset: 25600,
    waterSaved: 45000,
    energyConserved: 35000,
  });
  const content: LanguageContent = {
    en: {
      tagline: "Dispose E-Waste Safely, Earn Rewards!",
      joinUser: "Join as User",
      joinAgent: "Join as Collection Agent",
      awareness: "Awareness",
      impact: "DigitalDump Impact",
      community: "Community Activities",
      chatbotWelcome: "Hi! How can I help you today?",
      transform:
        "Transform your electronic waste into rewards while protecting our environment",
      environmentalImpact: "Environmental Impact & Education",
      topContributors: "Top Contributors",
      inviteFriends: "{content[language].inviteFriends}",
      shareAchievement: "{content[language].shareAchievement}",
      yourImpact: "Your Environmental Impact",
      impactDesc: "Your contributions are making a real difference",
      treesSaved: "Trees Saved",
      carbonOffset: "Carbon Offset",
      waterSaved: "Water Saved",
      energySaved: "Energy Saved",
      lastUpdated: "Last updated",
      shareImpact: "{content[language].shareImpact}",
      quickLinks: "Quick Links",
      aboutUs: "About Us",
      howItWorks: "How It Works",
      contact: "Contact",
      blog: "Blog",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookie: "Cookie Policy",
      connect: "Connect",
      rights: "All rights reserved.",
      recyclingGuide: "Recycling Guide",
      findCenters: "Find Centers",
      rewardsInfo: "Rewards Info",
      thisMonth: "This month",
      points: "pts",
    },
    gu: {
      tagline: "ઇ-કચરો સુરક્ષિત રીતે નિકાલ કરો, રિવોર્ડ્સ કમાઓ!",
      joinUser: "વપરાશકર્તા તરીકે જોડાઓ",
      joinAgent: "કલેક્શન એજન્ટ તરીકે જોડાઓ",
      awareness: "જાગૃતિ",
      impact: "ડિજિટલડમ્પ પ્રભાવ",
      community: "સમુદાય પ્રવૃત્તિઓ",
      chatbotWelcome: "નમસ્તે! હું આજે કેવી રીતે મદદ કરી શકું?",
      transform:
        "પર્યાવરણની રક્ષા કરતી વખતે તમારા ઇલેક્ટ્રોનિક કચરાને રિવોર્ડ્સમાં રૂપાંતરિત કરો",
      environmentalImpact: "પર્યાવરણીય પ્રભાવ અને શિક્ષણ",
      topContributors: "શ્રેષ્ઠ યોગદાનકર્તાઓ",
      inviteFriends: "મિત્રોને આમંત્રિત કરો (+૧૦૦ પોઈન્ટ્સ)",
      shareAchievement: "સિદ્ધિ શેર કરો",
      yourImpact: "તમારો પર્યાવરણીય પ્રભાવ",
      impactDesc: "તમારું યોગદાન વાસ્તવિક તફાવત લાવી રહ્યું છે",
      treesSaved: "બચાવેલા વૃક્ષો",
      carbonOffset: "કાર્બન ઓફસેટ",
      waterSaved: "બચાવેલું પાણી",
      energySaved: "બચાવેલી ઊર્જા",
      lastUpdated: "છેલ્લું અપડેટ",
      shareImpact: "પ્રભાવ શેર કરો",
      quickLinks: "ઝડપી લિંક્સ",
      aboutUs: "અમારા વિશે",
      howItWorks: "કેવી રીતે કામ કરે છે",
      contact: "સંપર્ક",
      blog: "બ્લોગ",
      legal: "કાનૂની",
      privacy: "ગોપનીયતા નીતિ",
      terms: "સેવાની શરતો",
      cookie: "કૂકી નીતિ",
      connect: "જોડાઓ",
      rights: "બધા હક્કો સુરક્ષિત.",
      recyclingGuide: "રીસાયકલિંગ માર્ગદર્શિકા",
      findCenters: "કેન્દ્રો શોધો",
      rewardsInfo: "રિવોર્ડ્સ માહિતી",
      thisMonth: "આ મહિને",
      points: "પોઈન્ટ્સ",
    },
  };
  const heroImage =
    "https://public.readdy.ai/ai/img_res/821ff44ba871abdc2296d0eb12863592.jpg";
  const awarenessCards = [
    {
      type: "fact",
      image:
        "https://public.readdy.ai/ai/img_res/d8947320644b263f70b4cab5f3092999.jpg",
      title: language === "en" ? "Did You Know?" : "શું તમે જાણો છો?",
      content:
        language === "en"
          ? "50 million tons of e-waste is generated globally each year"
          : "દર વર્ષે વૈશ્વિક સ્તરે 50 મિલિયન ટન ઇ-કચરો ઉત્પન્ન થાય છે",
    },
    {
      type: "video",
      image:
        "https://public.readdy.ai/ai/img_res/255b8cb75dbbd9988ab6fe90f5c5564b.jpg",
      title: language === "en" ? "Recycling Process" : "રીસાયકલિંગ પ્રક્રિયા",
    },
    {
      type: "quiz",
      image:
        "https://public.readdy.ai/ai/img_res/42e2d3a3dacf271c64ccc20e41d114b4.jpg",
      title: language === "en" ? "Test Your Knowledge" : "તમારું જ્ઞાન ચકાસો",
      points: "50",
    },
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-green-700">DigitalDump</div>
          <button
            onClick={() => setLanguage(language === "en" ? "gu" : "en")}
            className="px-4 py-2 bg-green-50 text-green-700 rounded-button cursor-pointer hover:bg-green-100 transition-all duration-300"
          >
            {language === "en" ? "ગુજરાતી" : "English"}
          </button>
        </div>
      </header>
      {/* Hero Section */}
      <section className="pt-24 relative bg-gradient-to-r from-green-50 to-green-100">
        <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 gap-8">
          <div className="flex flex-col justify-center">
            <h1 className="text-6xl font-bold text-gray-800 mb-6 leading-tight">
              {content[language].tagline}
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              {content[language].transform}
            </p>
            <div className="flex space-x-6">
              {/* Modified Join as User Button */}
              <button
                onClick={() => navigate('/user/signup')} // Added onClick for navigation
                className="px-8 py-4 bg-green-700 text-white text-lg font-medium rounded-button cursor-pointer transition-all duration-300 hover:bg-green-800 hover:shadow-lg whitespace-nowrap flex items-center justify-center min-w-[200px]"
              >
                <i className="fas fa-user-plus mr-2"></i>
                {content[language].joinUser}
              </button>
              {/* Modified Join as Collection Agent Button */}
              <button
                 onClick={() => navigate('/collector/signup')} // Added onClick for navigation
                className="px-8 py-4 border-2 border-green-700 text-green-700 text-lg font-medium rounded-button cursor-pointer transition-all duration-300 hover:bg-green-50 hover:shadow-lg whitespace-nowrap flex items-center justify-center min-w-[200px]"
              >
                <i className="fas fa-building mr-2"></i>
                {content[language].joinAgent}
              </button>
            </div>
          </div>
          <div className="relative h-[400px] overflow-hidden rounded-xl">
            <img
              src="https://public.readdy.ai/ai/img_res/9a0f3eeb4712a4c305d9d6810bdb4945.jpg"
              alt="Hero"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </section>
      {/* Awareness Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="space-y-12">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
              🌍 {content[language].environmentalImpact} 📚
            </h2>
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://public.readdy.ai/ai/img_res/f0a13f22441768ccfe73c59bff57a080.jpg"
                    alt="Environmental Impact"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      🌱 Environmental Impact
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                      <p>50 million tons of e-waste generated yearly</p>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-water text-blue-500 mr-3"></i>
                      <p>70% of toxic waste in landfills is e-waste</p>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-seedling text-green-500 mr-3"></i>
                      <p>Proper recycling can save 35% resources</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://public.readdy.ai/ai/img_res/a27cfe29ffeab238eb64d80bd017f3cf.jpg"
                    alt="Smart Recycling"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      ♻️ Smart Recycling
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-check-circle text-teal-500 mr-3"></i>
                      <p>Certified recycling processes</p>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-gift text-teal-500 mr-3"></i>
                      <p>Earn rewards for contributions</p>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-map-marker-alt text-teal-500 mr-3"></i>
                      <p>25 collection centers nationwide</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://public.readdy.ai/ai/img_res/b2de591f1f9777d71ef806fa206067cc.jpg"
                    alt="Knowledge Check"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      🎓 Knowledge Check
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-star text-yellow-500 mr-3"></i>
                      <p>Earn 50 points per quiz</p>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-book text-cyan-500 mr-3"></i>
                      <p>Learn recycling best practices</p>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <i className="fas fa-trophy text-cyan-500 mr-3"></i>
                      <p>Unlock achievement badges</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-emerald-100">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                15,230 kg
              </div>
              <div className="text-emerald-600 font-medium">
                E-Waste Collected
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-emerald-100">
              <div className="text-3xl font-bold text-gray-800 mb-2">₹1.2M</div>
              <div className="text-emerald-600 font-medium">
                Rewards Generated
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-emerald-100">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                5,400+
              </div>
              <div className="text-emerald-600 font-medium">Active Users</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-emerald-100">
              <div className="text-3xl font-bold text-gray-800 mb-2">25</div>
              <div className="text-emerald-600 font-medium">
                Collection Centers
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Gamification Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              {content[language].impact}
            </h2>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                {content[language].topContributors}
              </h3>
              {leaderboardData.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 border-b last:border-0 hover:bg-emerald-50 transition-all duration-300 rounded-lg px-3"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-full flex items-center justify-center mr-4 text-lg font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="font-semibold">{user.name}</span>
                        <span className="ml-2 text-sm text-emerald-600">
                          {user.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-600 font-bold">
                      {user.points.toLocaleString()} pts
                    </div>
                    <div className="text-xs text-gray-500">
                      {content[language].thisMonth}
                    </div>
                  </div>
                </div>
              ))}
              <button className="mt-6 w-full py-3 bg-green-700 text-white rounded-button cursor-pointer hover:bg-green-800 transition-all duration-300 hover:shadow-lg flex items-center justify-center whitespace-nowrap">
                <i className="fas fa-user-plus mr-2"></i>
                {language === "en"
                  ? "Invite Friends (+100 points)"
                  : "મિત્રોને આમંત્રિત કરો (+૧૦૦ પોઈન્ટ્સ)"}
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              {content[language].community}
            </h2>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:scale-102 hover:shadow-xl"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl rounded-full mr-4 flex items-center justify-center text-white">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg">
                          {achievement.title}
                        </h4>
                        <span className="text-emerald-600 font-semibold">
                          +{achievement.points} pts
                        </span>
                      </div>
                      <p className="text-gray-600">{achievement.description}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {achievement.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="flex-1 py-2 bg-emerald-600 text-white rounded-button cursor-pointer hover:bg-emerald-700 transition-all duration-300 hover:shadow-md flex items-center justify-center whitespace-nowrap">
                      <i className="fas fa-share-alt mr-2"></i>
                      {language === "en"
                        ? "Share Achievement"
                        : "સિદ્ધિ શેર કરો"}
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center border border-emerald-600 text-emerald-600 rounded-button cursor-pointer hover:bg-emerald-50 transition-colors duration-300">
                      <i className="fas fa-medal"></i>
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-8 bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="relative h-40 bg-gradient-to-r from-green-700 to-green-500 p-6">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "url('https://public.readdy.ai/ai/img_res/1f08ceeb749a861cf0222e57f1095623.jpg')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: "0.2",
                    }}
                  ></div>
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {content[language].yourImpact}
                    </h3>
                    <p className="text-emerald-50 text-sm">
                      {content[language].impactDesc}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-emerald-50 rounded-xl p-4 transform transition-all duration-300 hover:scale-105">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                          <i className="fas fa-tree text-2xl text-white"></i>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-emerald-700">
                            {impactStats.treesPlanted}
                          </div>
                          <div className="text-sm text-emerald-600">
                            {content[language].treesSaved}
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                          style={{ width: "75%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4 transform transition-all duration-300 hover:scale-105">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mr-4">
                          <i className="fas fa-globe-americas text-2xl text-white"></i>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-teal-700">
                            {impactStats.carbonOffset}kg
                          </div>
                          <div className="text-sm text-teal-600">
                            {content[language].carbonOffset}
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-teal-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-400 to-teal-600"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-4 transform transition-all duration-300 hover:scale-105">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mr-4">
                          <i className="fas fa-tint text-2xl text-white"></i>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-cyan-700">
                            {impactStats.waterSaved}L
                          </div>
                          <div className="text-sm text-cyan-600">
                            {content[language].waterSaved}
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-cyan-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600"
                          style={{ width: "85%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 transform transition-all duration-300 hover:scale-105">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-4">
                          <i className="fas fa-bolt text-2xl text-white"></i>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-blue-700">
                            {impactStats.energyConserved}kWh
                          </div>
                          <div className="text-sm text-blue-600">
                            {content[language].energySaved}
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                          style={{ width: "70%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {content[language].lastUpdated}: March 21, 2025
                    </div>
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-button hover:bg-emerald-700 transition-all duration-300 hover:shadow-md flex items-center justify-center whitespace-nowrap">
                      <i className="fas fa-share-alt mr-2"></i>
                      {language === "en" ? "Share Impact" : "પ્રભાવ શેર કરો"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Chatbot */}
      <div className="fixed bottom-4 right-4 z-50">
        {showChatbot && (
          <div className="bg-white rounded-xl shadow-xl p-4 mb-4 w-96 transform transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mr-3 flex items-center justify-center">
                  <i className="fas fa-robot text-white text-lg"></i>
                </div>
                <div>
                  <span className="font-bold text-gray-800">EcoBot</span>
                  <div className="text-xs text-emerald-600">
                    Online • Ready to help
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowChatbot(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors duration-300"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 mb-4">
              <p className="text-gray-700">
                {content[language].chatbotWelcome}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm hover:bg-emerald-200 transition-all duration-300 hover:shadow-md flex items-center justify-center whitespace-nowrap">
                <i className="fas fa-recycle mr-2"></i>
                {content[language].recyclingGuide}
              </button>
              <button className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm hover:bg-emerald-200 transition-all duration-300 hover:shadow-md flex items-center justify-center whitespace-nowrap">
                <i className="fas fa-map-marker-alt mr-2"></i>
                {content[language].findCenters}
              </button>
              <button className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm hover:bg-emerald-200 transition-all duration-300 hover:shadow-md flex items-center justify-center whitespace-nowrap">
                <i className="fas fa-gift mr-2"></i>
                {content[language].rewardsInfo}
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="w-14 h-14 bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-green-800"
        >
          <i
            className={`fas ${
              showChatbot ? "fa-times" : "fa-comments"
            } text-xl`}
          ></i>
        </button>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">DigitalDump</h3>
            <p className="text-gray-400">
              Making e-waste recycling rewarding and accessible for everyone.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">
              {content[language].quickLinks}
            </h4>
            <ul className="space-y-2 text-gray-400">
               {/* Replace with actual links or navigate */}
              <li>{content[language].aboutUs}</li>
              <li>{content[language].howItWorks}</li>
              <li>{content[language].contact}</li>
              <li>{content[language].blog}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{content[language].legal}</h4>
            <ul className="space-y-2 text-gray-400">
              {/* Replace with actual links or navigate */}
              <li>{content[language].privacy}</li>
              <li>{content[language].terms}</li>
              <li>{content[language].cookie}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{content[language].connect}</h4>
            <div className="flex space-x-4 text-xl">
              {/* Replace # with actual social media links */}
              <i className="fab fa-facebook cursor-pointer"></i>
              <i className="fab fa-twitter cursor-pointer"></i>
              <i className="fab fa-instagram cursor-pointer"></i>
              <i className="fab fa-linkedin cursor-pointer"></i>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2025 DigitalDump. {content[language].rights}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

