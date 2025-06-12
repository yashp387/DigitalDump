// frontend/src/pages/AdminDashboard.tsx
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
import {
  getAdminOverviewStats,
  getAdminMonthlyUserSignups,
  getAdminCategoryDistribution,
  // Removed import for getAdminMonthlyScheduledPickups as we're replacing the chart data source
  getAdminMonthlyTotalPickups, // Import the new API function
} from "../services/api";
import { useNavigate } from "react-router-dom";

// Define types for the fetched data based on backend controller response
interface OverviewStats {
  totalUsers: number;
  scheduledPickups: number;
  completedPickups: number;
  totalEwasteCollected: number; // Assuming this is a number/quantity, adjust if string
}

interface MonthlyData {
  year: number;
  month: number;
  count: number;
}

interface CategoryDistribution {
  category: string;
  count: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // State for fetched data
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(
    null,
  );
  const [monthlyUserSignups, setMonthlyUserSignups] = useState<
    MonthlyData[] | null
  >(null);
  const [categoryDistribution, setCategoryDistribution] = useState<
    CategoryDistribution[] | null
  >(null);
  // --- Updated state variable for total pickups ---
  const [monthlyTotalPickups, setMonthlyTotalPickups] = useState<
    MonthlyData[] | null
  >(null);
  // --- End Updated ---


  // State for loading and errors
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Refs for ECharts containers
  const userChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null); // This will now be for total pickups


  // --- Fetch Data Effect ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingStats(true);
      setIsLoadingCharts(true);
      setStatsError(null);
      setChartsError(null);

      try {
        // Fetch all data concurrently
        const [stats, signups, categories, totalPickups] = await Promise.all([ // Fetch totalPickups instead of scheduledPickups
          getAdminOverviewStats(),
          getAdminMonthlyUserSignups(),
          getAdminCategoryDistribution(),
          getAdminMonthlyTotalPickups(), // Call the new API function
        ]);

        setOverviewStats(stats);
        setMonthlyUserSignups(signups);
        setCategoryDistribution(categories);
        setMonthlyTotalPickups(totalPickups); // Set the new state variable
        console.log("Fetched monthlyTotalPickups:", totalPickups); // Keep for debugging


        setIsLoadingStats(false);
        setIsLoadingCharts(false);
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setStatsError(
          err.response?.data?.message || "Failed to load statistics.",
        );
        setChartsError(
          err.response?.data?.message || "Failed to load chart data.",
        );
        setIsLoadingStats(false);
        setIsLoadingCharts(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- ECharts Effect for User Signups (Line Chart) ---
  // (No changes needed here - uses monthlyUserSignups state)
  useEffect(() => {
    console.log("User chart useEffect running...");
    console.log("monthlyUserSignups in useEffect:", monthlyUserSignups);

    if (userChartRef.current && monthlyUserSignups && monthlyUserSignups.length > 0) {
      console.log("Ref and data available, initializing user chart.");
      const userChart = echarts.init(userChartRef.current);

      const dates = monthlyUserSignups
        .sort((a, b) => {
           if (a.year !== b.year) return a.year - b.year;
           return a.month - b.month;
        })
        .map(
          (item) => `${item.year}-${String(item.month).padStart(2, "0")}`,
        );
      const counts = monthlyUserSignups
         .sort((a, b) => {
           if (a.year !== b.year) return a.year - b.year;
           return a.month - b.month;
        })
        .map((item) => item.count);

      console.log("Prepared user dates:", dates);
      console.log("Prepared user counts:", counts);

      const option = {
        animation: true,
        tooltip: {
          trigger: "axis",
          formatter: (params: any) => {
            const param = params[0];
            if (!param) return "";
            const dateParts = param.name.split('-');
             const year = parseInt(dateParts[0]);
             const month = parseInt(dateParts[1]) - 1;
             const date = new Date(year, month);

            const monthName = date.toLocaleString("default", { month: "long" });
            return `${monthName}, ${year}<br/>Signups: ${param.value}`;
          },
        },
        xAxis: {
          type: "category",
          data: dates,
          axisLabel: {
            formatter: (value: string) => {
               const dateParts = value.split('-');
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]) - 1;
               const date = new Date(year, month);
               return date.toLocaleString('default', { month: 'short' });
            }
          },
          axisTick: {
              alignWithLabel: true
          }
        },
        yAxis: {
          type: "value",
          minInterval: 1,
        },
        series: [
          {
            name: "User Signups",
            data: counts,
            type: "line",
            smooth: true,
            color: "#6366f1",
             symbol: 'circle',
             symbolSize: 8
          },
        ],
      };
      userChart.setOption(option);

      return () => {
         console.log("Disposing user chart.");
        userChart.dispose();
      };
    } else {
         console.log("User chart skipped: Ref not ready or no data.", { refReady: !!userChartRef.current, hasData: !!monthlyUserSignups && monthlyUserSignups.length > 0 });
    }
  }, [monthlyUserSignups]);

  // --- ECharts Effect for Category Distribution (Pie Chart) ---
  // (No changes needed here - uses categoryDistribution state)
  useEffect(() => {
     console.log("Pie chart useEffect running...");
     console.log("categoryDistribution in useEffect:", categoryDistribution);

    if (pieChartRef.current && categoryDistribution && categoryDistribution.length > 0) {
         console.log("Ref and data available, initializing pie chart.");
      const pieChart = echarts.init(pieChartRef.current);

      const pieData = categoryDistribution.map((item) => ({
        value: item.count,
        name: item.category,
      }));

       console.log("Prepared pie data:", pieData);

      const pieOption = {
        animation: true,
        tooltip: {
          trigger: "item",
          formatter: '{a} <br/>{b} : {c} ({d}%)',
        },
        legend: {
          orient: "vertical",
          left: "left",
          data: pieData.map((item) => item.name),
        },
        series: [
          {
            name: "Pickup Categories",
            type: "pie",
            radius: "70%",
            center: ["50%", "60%"],
            data: pieData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
            label: {
              formatter: "{b}: {c}",
            },
          },
        ],
      };
      pieChart.setOption(pieOption);

      return () => {
          console.log("Disposing pie chart.");
        pieChart.dispose();
      };
    } else {
        console.log("Pie chart skipped: Ref not ready or no data.", { refReady: !!pieChartRef.current, hasData: !!categoryDistribution && categoryDistribution.length > 0 });
    }
  }, [categoryDistribution]);

  // --- UPDATED: ECharts Effect for Monthly Total Pickups (Bar Chart) ---
  useEffect(() => {
    console.log("Bar chart (Total Pickups) useEffect running..."); // Updated log message
    console.log("monthlyTotalPickups in useEffect:", monthlyTotalPickups); // Using the new state variable

    // Check if ref is ready AND data is available (length > 0)
    if (barChartRef.current && monthlyTotalPickups && monthlyTotalPickups.length > 0) {
      console.log("Ref and data available, initializing bar chart for total pickups."); // Updated log message
      const barChart = echarts.init(barChartRef.current);

      // Prepare data for ECharts
      // Use monthlyTotalPickups instead of monthlyScheduledPickups
      const dates = monthlyTotalPickups
        .sort((a, b) => { // Ensure data is sorted chronologically
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
         })
         .map(
           (item) => `${item.year}-${String(item.month).padStart(2, "0")}`,
         );
      const counts = monthlyTotalPickups
         .sort((a, b) => { // Ensure data is sorted chronologically
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
         })
         .map((item) => item.count);

      console.log("Prepared bar dates:", dates);
      console.log("Prepared bar counts:", counts);

      const barOption = {
        animation: true,
        tooltip: {
          trigger: "axis",
          formatter: (params: any) => {
            const param = params[0];
            if (!param) return "";
            const dateParts = param.name.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const date = new Date(year, month);

            const monthName = date.toLocaleString("default", { month: "long" });
            // Updated tooltip label
            return `${monthName}, ${year}<br/>Total Pickups: ${param.value}`;
          },
        },
        xAxis: {
          type: "category",
          data: dates,
          axisLabel: {
             formatter: (value: string) => {
                const dateParts = value.split('-');
                 const year = parseInt(dateParts[0]);
                 const month = parseInt(dateParts[1]) - 1;
                const date = new Date(year, month);
                return date.toLocaleString('default', { month: 'short' });
             }
           },
           axisTick: {
               alignWithLabel: true
           }
        },
        yAxis: {
          type: "value",
          minInterval: 1,
        },
        series: [
          {
            name: "Total Pickups", // Updated series name
            data: counts,
            type: "bar",
            color: "#6366f1",
            itemStyle: {
              borderRadius: [5, 5, 0, 0],
            },
          },
        ],
      };
      barChart.setOption(barOption);

      // Cleanup function
      return () => {
         console.log("Disposing bar chart for total pickups."); // Updated log message
        barChart.dispose();
      };
    } else {
      console.log("Bar chart (Total Pickups) skipped: Ref not ready or no data.", { refReady: !!barChartRef.current, hasData: !!monthlyTotalPickups && monthlyTotalPickups.length > 0 }); // Updated log message for skipped case
    }
  }, [monthlyTotalPickups]); // Dependency is now on monthlyTotalPickups


  // Handler for logging out
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/admin/signin");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${isSidebarCollapsed ? "w-20" : "w-64"} bg-white shadow-lg transition-all duration-300 fixed h-full z-10`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
                        {!isSidebarCollapsed && (
              <span className="text-xl font-bold text-indigo-600">
                AdminPro
              </span>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <i
                className={`fas fa-${isSidebarCollapsed ? "arrow-right" : "arrow-left"} ${isSidebarCollapsed ? "text-xl" : ""}`}
              ></i>
            </button>
          </div>
        </div>
        <nav className="mt-4">
          {[
            { id: "dashboard", icon: "tachometer-alt", label: "Dashboard", href: "/admin/dashboard" }, // Added href for consistency
            {
              id: "users",
              icon: "users",
              label: "User Management",
              href: "/admin/management",
            },
            {
              id: "educational",
              icon: "book-open",
              label: "Educational Content",
              href: "/admin/educational",
            },
            {
              id: "rewards",
              icon: "gift",
              label: "Rewards Management",
              href: "/admin/rewards",
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedMenu(item.id);
                if (item.href) {
                  navigate(item.href);
                }
              }}
              className={`flex items-center px-4 py-3 cursor-pointer ${
                selectedMenu === item.id
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <i
                className={`fas fa-${item.icon} ${isSidebarCollapsed ? "text-xl" : ""}`}
              ></i>
              {!isSidebarCollapsed && (
                <span className="ml-3">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
        {/* Profile placeholder at the bottom */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center">
            <img
              src="https://a.imagem.app/BnNS9E.jpeg" // Placeholder image
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            {!isSidebarCollapsed && (
              <div className="ml-3">
                {/* Display logged-in admin's name */}
                <p className="text-sm font-medium text-gray-700">
                  {localStorage.getItem("userName") || "Admin User"}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 overflow-auto ${isSidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center flex-1">
              {/* Add a Search bar or other header elements here */}
            </div>
            <div className="flex items-center space-x-4">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <img
                    src="https://a.imagem.app/BnNS9E.jpeg" // Placeholder image
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <i className="fas fa-chevron-down text-gray-600 text-sm"></i>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                    <div className="py-1">
                      <a
                        href="#" // Replace with actual profile route if exists
                        onClick={(e) => { e.preventDefault(); navigate('/admin/profile'); /* Example */ }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </a>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Display Errors */}
          {(statsError || chartsError) && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline">
                {" "}
                {statsError || chartsError}
              </span>
            </div>
          )}

          {/* Key Metrics - Show loading or data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {isLoadingStats ? (
              // Loading state for stats
              <>
                <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mt-4"></div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mt-4"></div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mt-4"></div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4 mt-4"></div>
                </div>
              </>
            ) : overviewStats ? (
              // Display fetched stats
              <>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Users</p>
                      <h3 className="text-2xl font-semibold mt-1">
                        {overviewStats.totalUsers}
                      </h3>
                      <p className="text-sm text-green-500 mt-2">
                        <i className="fas fa-arrow-up mr-1"></i>
                        12.5% {/* Static % - replace with dynamic if needed */}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users text-indigo-600 text-xl"></i>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Scheduled Pickups</p>
                      <h3 className="text-2xl font-semibold mt-1">
                        {overviewStats.scheduledPickups}
                      </h3>
                      <p className="text-sm text-green-500 mt-2">
                        <i className="fas fa-arrow-up mr-1"></i>
                         8.2% {/* Static % - replace with dynamic if needed */}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-clipboard-list text-green-600 text-xl"></i>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Completed Pickups</p>
                      <h3 className="text-2xl font-semibold mt-1">
                        {overviewStats.completedPickups}
                      </h3>
                      <p className="text-sm text-green-500 mt-2">
                        <i className="fas fa-arrow-up mr-1"></i>
                        15.3% {/* Static % - replace with dynamic if needed */}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-check-circle text-blue-600 text-xl"></i>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        Total E-waste Collected (items)
                      </p>
                      <h3 className="text-2xl font-semibold mt-1">
                        {overviewStats.totalEwasteCollected}
                      </h3>
                       <p className="text-sm text-green-500 mt-2">
                        <i className="fas fa-arrow-up mr-1"></i>
                         18.7% {/* Static % - replace with dynamic if needed */}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-weight-hanging text-purple-600 text-xl"></i>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Error state for stats
              <div className="lg:col-span-4 bg-red-100 rounded-lg shadow-sm p-6 text-red-700 text-center">
                <i className="fas fa-exclamation-circle mr-2"></i> Failed to load
                overview statistics.
              </div>
            )}
          </div>

          {/* Charts Section - Show loading or data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {isLoadingCharts ? (
              // Loading state for charts
              <>
                <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </>
            ) : chartsError ? (
              // Error state for charts
              <>
                 <div className="bg-red-100 rounded-lg shadow-sm p-6 text-red-700 text-center">
                  <i className="fas fa-exclamation-circle mr-2"></i> Failed to load
                  chart data.
                </div>
                <div className="bg-red-100 rounded-lg shadow-sm p-6 text-red-700 text-center">
                  <i className="fas fa-exclamation-circle mr-2"></i> Failed to load
                  chart data.
                </div>
              </>
            ) : (
              // Display charts if data is available
              <>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Monthly User Signups
                  </h3>
                  <div ref={userChartRef} style={{ height: "300px" }}></div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Completed Pickup Categories
                  </h3>
                  <div ref={pieChartRef} style={{ height: "300px" }}></div>
                </div>
              </>
            )}
          </div>

          {/* Activity Chart (Now showing Total Pickups) - Show loading or data */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            {isLoadingCharts ? (
              // Loading state for bar chart
              <>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </>
            ) : chartsError ? (
              // Error state for bar chart
               <div className="bg-red-100 rounded-lg shadow-sm p-6 text-red-700 text-center">
                <i className="fas fa-exclamation-circle mr-2"></i> Failed to load
                monthly total pickups chart.
              </div>
            ) : (
              // Display bar chart if data is available (using monthlyTotalPickups)
              <>
                <h3 className="text-lg font-semibold mb-4">
                  Monthly Total Pickups
                </h3> {/* Updated title */}
                <div ref={barChartRef} style={{ height: "300px" }}></div>
              </>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
