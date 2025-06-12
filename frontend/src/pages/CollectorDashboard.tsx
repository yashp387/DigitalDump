// src/pages/CollectorDashboard.tsx
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
// --- CORRECTED IMPORT: Use getAgentPickupsByStatus ---
import { getAgentPickupsByStatus } from "../services/api"; // Import the correct API function

// Define interfaces (assuming these are correct)
interface PickupRequest {
  _id: string;
  userId: { _id: string; name: string; phoneNumber?: string };
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  preferredDateTime: string;
  ewasteType: string;
  ewasteSubtype?: string;
  quantity: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
}

interface DashboardStats {
  totalItemsCollected: number;
  pickupsCompleted: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

const CollectorDashboard: React.FC = () => {
  const { user, logout } = useContext(AuthContext) as {
    user: User | null;
    logout: () => void;
  };
  const navigate = useNavigate();

  // --- State Variables ---
  const [currentDate, setCurrentDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  // const [activeTab, setActiveTab] = useState<string>("dashboard"); // Removed if not used for styling/logic

  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalItemsCollected: 0,
    pickupsCompleted: 0,
  });
  const [upcomingPickup, setUpcomingPickup] = useState<PickupRequest | null>(
    null
  );
  const [recentHistory, setRecentHistory] = useState<PickupRequest[]>([]);

  // --- Fetch Data Effect ---
  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    const updateClock = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateClock();
    const timerId = setInterval(updateClock, 60000);

    const fetchDashboardData = async () => {
      setError(null);
      setIsLoadingStats(true);
      setIsLoadingUpcoming(true);
      setIsLoadingHistory(true);

      try {
        // --- CORRECTED API CALL for Completed Pickups ---
        const completedPickupsResponse = await getAgentPickupsByStatus(
          "completed"
        );
        const completedPickups: PickupRequest[] =
          completedPickupsResponse?.requests || [];

        const totalItems = completedPickups.reduce(
          (sum, pickup) => sum + (pickup.quantity || 0),
          0
        );
        setDashboardStats({
          totalItemsCollected: totalItems,
          pickupsCompleted: completedPickups.length,
        });
        setIsLoadingStats(false);

        const sortedHistory = [...completedPickups].sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        );
        setRecentHistory(sortedHistory.slice(0, 5));
        setIsLoadingHistory(false);

        // --- CORRECTED API CALL for Accepted Pickups ---
        const acceptedPickupsResponse = await getAgentPickupsByStatus(
          "accepted"
        );
        const acceptedPickups: PickupRequest[] =
          acceptedPickupsResponse?.requests || [];

        if (acceptedPickups.length > 0) {
          const sortedUpcoming = [...acceptedPickups].sort(
            (a, b) =>
              new Date(a.preferredDateTime).getTime() -
              new Date(b.preferredDateTime).getTime()
          );
          setUpcomingPickup(sortedUpcoming[0]);
        } else {
          setUpcomingPickup(null);
        }
        setIsLoadingUpcoming(false);
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load dashboard data."
        );
        setIsLoadingStats(false);
        setIsLoadingUpcoming(false);
        setIsLoadingHistory(false);
      }
    };

    fetchDashboardData();
    return () => clearInterval(timerId);
  }, []);

  // --- Helper Functions ---
  const formatPickupDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const formatPickupDateTime = (
    dateString: string
  ): { date: string; time: string } => {
    if (!dateString) return { date: "N/A", time: "N/A" };
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch (e) {
      return { date: "Invalid Date", time: "" };
    }
  };

  // --- Handle Logout ---
  const handleLogout = () => {
    logout();
    navigate("/collector/signin");
  };

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                to="/collector/dashboard"
                className="text-xl font-semibold text-green-600 flex items-center"
              >
                <i className="fas fa-recycle mr-2"></i>DigitalDump
              </Link>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/collector/dashboard"
                className={`!rounded-button cursor-pointer whitespace-nowrap text-sm font-medium px-3 py-2 transition-colors ${
                  window.location.pathname === "/collector/dashboard"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-green-600"
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/collector/pickups"
                className={`!rounded-button cursor-pointer whitespace-nowrap text-sm font-medium px-3 py-2 transition-colors ${
                  window.location.pathname.startsWith("/collector/pickups")
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-green-600"
                }`}
              >
                Manage Pickups
              </Link>
            </nav>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4 hidden md:inline">
                {user?.name || "Agent"}
              </span>
              <button
                onClick={handleLogout}
                className="!rounded-button cursor-pointer whitespace-nowrap text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center"
              >
                <i className="fas fa-sign-out-alt mr-1"></i>
                <span className="hidden md:inline">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 md:p-8 mb-8 shadow-lg text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome back, {user?.name || "Agent"}!
              </h1>
              <p className="text-green-100 mb-6 text-sm md:text-base">
                {currentDate} • {currentTime}
              </p>
              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm"
                  role="alert"
                >
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="absolute top-0 bottom-0 right-0 px-4 py-3"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-4 md:gap-8">
                {/* Total Items Collected Stat - CORRECTED STYLES */}
                <div className="bg-green-700 bg-opacity-20 backdrop-blur-sm rounded-xl p-4 flex items-center min-w-[180px] md:min-w-[200px]">
                  <div className="mr-3 md:mr-4 bg-white bg-opacity-30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-box text-lg md:text-xl text-black"></i>{" "}
                    {/* Explicit text-white */}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-white opacity-80">
                      {" "}
                      {/* Changed to white+opacity */}
                      Total Items Collected
                    </p>
                    {
                      isLoadingStats ? (
                        <div className="h-6 md:h-8 w-12 md:w-16 bg-white/30 rounded animate-pulse mt-1"></div>
                      ) : (
                        <p className="text-xl md:text-2xl font-bold text-white">
                          {dashboardStats.totalItemsCollected}
                        </p>
                      ) /* Explicit text-white */
                    }
                  </div>
                </div>
                {/* Pickups Completed Stat - CORRECTED STYLES */}
                <div className="bg-green-700 bg-opacity-20 backdrop-blur-sm rounded-xl p-4 flex items-center min-w-[180px] md:min-w-[200px]">
                  <div className="mr-3 md:mr-4 bg-white bg-opacity-30 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-truck text-lg md:text-xl text-black"></i>{" "}
                    {/* Explicit text-white */}
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-white opacity-80">
                      {" "}
                      {/* Changed to white+opacity */}
                      Pickups Completed
                    </p>
                    {
                      isLoadingStats ? (
                        <div className="h-6 md:h-8 w-10 md:w-12 bg-white/30 rounded animate-pulse mt-1"></div>
                      ) : (
                        <p className="text-xl md:text-2xl font-bold text-white">
                          {dashboardStats.pickupsCompleted}
                        </p>
                      ) /* Explicit text-white */
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Upcoming Pickups Card */}
            <div className="bg-white rounded-2xl shadow-md p-5 md:p-6 border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  Next Upcoming Pickup
                </h2>
                <Link
                  to="/collector/pickups"
                  className="!rounded-button cursor-pointer whitespace-nowrap text-xs md:text-sm text-green-600 hover:text-green-700 transition-colors font-medium"
                >
                  View All Assigned
                </Link>
              </div>
              <div className="flex-grow">
                {isLoadingUpcoming ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                    <div className="h-8 bg-gray-100 rounded-xl animate-pulse w-3/4"></div>
                    <div className="h-8 bg-gray-100 rounded-xl animate-pulse w-1/2"></div>
                  </div>
                ) : upcomingPickup ? (
                  <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-500 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 flex-shrink-0">
                          <i className="fas fa-calendar-alt"></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm md:text-base">
                            {
                              formatPickupDateTime(
                                upcomingPickup.preferredDateTime
                              ).date
                            }
                          </p>
                          <p className="text-xs md:text-sm text-gray-500">
                            {
                              formatPickupDateTime(
                                upcomingPickup.preferredDateTime
                              ).time
                            }
                          </p>
                        </div>
                      </div>
                      <div className="pl-0 md:pl-13 mb-3 text-xs md:text-sm space-y-1">
                        <p
                          className="text-gray-600 truncate"
                          title={`${upcomingPickup.streetAddress}, ${upcomingPickup.city}`}
                        >
                          <i className="fas fa-map-marker-alt w-4 mr-2 text-gray-400 text-center"></i>
                          {upcomingPickup.streetAddress}, {upcomingPickup.city}
                        </p>
                        <p
                          className="text-gray-600 truncate"
                          title={`${upcomingPickup.ewasteType} (${
                            upcomingPickup.ewasteSubtype || "N/A"
                          })`}
                        >
                          <i className="fas fa-box w-4 mr-2 text-gray-400 text-center"></i>
                          {upcomingPickup.ewasteType} ({upcomingPickup.quantity}{" "}
                          items)
                        </p>
                        <p className="text-gray-600">
                          <i className="fas fa-user w-4 mr-2 text-gray-400 text-center"></i>
                          {upcomingPickup.fullName}
                        </p>
                        <p className="text-gray-600">
                          <i className="fas fa-phone w-4 mr-2 text-gray-400 text-center"></i>
                          {upcomingPickup.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/collector/pickups`)}
                      className="!rounded-button cursor-pointer whitespace-nowrap w-full py-2 mt-3 bg-white border border-green-500 text-green-600 text-xs md:text-sm font-medium hover:bg-green-50 transition-colors"
                    >
                      Go to Manage Pickups
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8 h-full flex items-center justify-center">
                    <p>No upcoming pickups assigned.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Collection History */}
            <div className="bg-white rounded-2xl shadow-md p-5 md:p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  Recent Collections
                </h2>
              </div>
              {isLoadingHistory ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                        <div>
                          <div className="h-3 md:h-4 w-20 md:w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="h-2 md:h-3 w-12 md:w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-3 md:h-4 w-10 md:w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="h-2 md:h-3 w-16 md:w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentHistory.length > 0 ? (
                <div className="space-y-3">
                  {recentHistory.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center overflow-hidden mr-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 flex-shrink-0">
                          <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="overflow-hidden">
                          <p
                            className="font-medium text-gray-800 truncate text-sm md:text-base"
                            title={item.ewasteType}
                          >
                            {item.ewasteType}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPickupDate(item.updatedAt || item.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <p className="font-medium text-green-600 text-sm md:text-base">
                          {item.quantity} items
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {item.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No collection history yet.
                </p>
              )}
            </div>

            {/* Activity Overview Card */}
            <div className="bg-white rounded-2xl shadow-md p-5 md:p-6 border border-gray-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6">
                Activity Overview
              </h2>
              <div className="space-y-3 md:space-y-4">
                <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3 flex-shrink-0">
                      <i className="fas fa-calendar-check"></i>
                    </div>
                    <p className="font-medium text-gray-800 text-sm md:text-base">
                      Completed Today
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-700">0</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 flex-shrink-0">
                      <i className="fas fa-calendar-day"></i>
                    </div>
                    <p className="font-medium text-gray-800 text-sm md:text-base">
                      Scheduled Today
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-700">
                    {upcomingPickup &&
                    new Date(
                      upcomingPickup.preferredDateTime
                    ).toDateString() === new Date().toDateString()
                      ? 1
                      : 0}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 md:p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3 flex-shrink-0">
                      <i className="fas fa-star"></i>
                    </div>
                    <p className="font-medium text-gray-800 text-sm md:text-base">
                      Agent Rating
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-700">N/A</p>
                </div>
              </div>
            </div>

            {/* Environmental Impact Card */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-md p-5 md:p-6 border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-0">
                  Environmental Impact (Estimate)
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Based on completed pickups
                </p>
              </div>
              {isLoadingStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-100 rounded-xl p-4 md:p-6 text-center animate-pulse"
                    >
                      <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-gray-200 rounded-full mb-3 md:mb-4"></div>
                      <div className="h-6 md:h-8 w-20 md:w-24 bg-gray-200 rounded mx-auto mb-2"></div>
                      <div className="h-3 md:h-4 w-24 md:w-32 bg-gray-200 rounded mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : dashboardStats.pickupsCompleted > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3 md:mb-4">
                      <i className="fas fa-leaf text-xl md:text-2xl"></i>
                    </div>
                    <p className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">
                      ~{(dashboardStats.totalItemsCollected * 1.5).toFixed(1)}{" "}
                      kg
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      CO₂ Prevented (Est.)
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 md:mb-4">
                      <i className="fas fa-recycle text-xl md:text-2xl"></i>
                    </div>
                    <p className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">
                      ~{(dashboardStats.totalItemsCollected * 0.8).toFixed(1)}{" "}
                      kg
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      Materials Recovered (Est.)
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 md:p-6 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-3 md:mb-4">
                      <i className="fas fa-tree text-xl md:text-2xl"></i>
                    </div>
                    <p className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">
                      ~{(dashboardStats.totalItemsCollected * 0.1).toFixed(1)}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      Trees Saved Eq. (Est.)
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Complete pickups to see your environmental impact.
                </p>
              )}
              <p className="text-xs text-center text-gray-400 mt-4">
                *Impact figures are estimates.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} DigitalDump. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default CollectorDashboard;
