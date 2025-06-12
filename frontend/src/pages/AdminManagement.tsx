// frontend/src/pages/AdminManagement.tsx
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { useNavigate } from 'react-router-dom';
import {
    getAdminManagementOverviewStats,
    getAdminMonthlyUserGrowth,
    getAdminAllUsers,
    getAdminAllAgents,
    updateAdminUserStatus,
    updateAdminAgentStatus,
    deleteAdminUser,
    deleteAdminAgent,
} from '../services/api';

// Define types for fetched data
interface ManagementOverviewStats {
    totalUsers: number;
    totalAgents: number;
    suspendedUsers: number;
    suspendedAgents: number;
}

interface MonthlyUserGrowthData {
    year: number;
    month: number;
    count: number;
}

interface UserData {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    points: number;
    status: 'active' | 'suspended'; // Assuming backend always sends one of these or null/undefined
    createdAt: string;
    // Include other user-specific fields if needed
}

interface AgentData {
     _id: string;
     name: string;
     email: string;
     phoneNumber: string;
     address: { street: string, area: string, city: string, pincode: string };
     location?: { type: string, coordinates: number[] };
     isVerified: boolean;
     status: 'active' | 'suspended'; // Assuming backend always sends one of these or null/undefined
     createdAt: string;
     // Include other agent-specific fields if needed
}

// Define a combined type for the table - make status potentially undefined for old data
interface CombinedUserAgentData {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'agent';
    status?: 'active' | 'suspended'; // Status might be undefined for old entries
    phoneOrNumber: string;
    isAgentVerified?: boolean;
}


const AdminManagement: React.FC = () => {
    const navigate = useNavigate();
    // Ensure you store these in localStorage upon admin signin
    const loggedInAdminId = localStorage.getItem('userId');
    const loggedInAdminEmail = localStorage.getItem('userEmail');


    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState('management'); // Set current menu item
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // --- State for Overview Stats ---
    const [overviewStats, setOverviewStats] = useState<ManagementOverviewStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);
    // --- End State for Overview Stats ---

    // --- State for User Growth Chart ---
    const [monthlyUserGrowthData, setMonthlyUserGrowthData] = useState<MonthlyUserGrowthData[] | null>(null);
    const [isLoadingUserGrowth, setIsLoadingUserGrowth] = useState(true);
    const [userGrowthError, setUserGrowthError] = useState<string | null>(null);
    const userStatsChartRef = useRef<HTMLDivElement>(null); // Ref for the chart
    // --- End State for User Growth Chart ---

    // --- State for User and Agent Lists ---
    const [usersList, setUsersList] = useState<UserData[]>([]);
    const [agentsList, setAgentsList] = useState<AgentData[]>([]);
    const [isLoadingLists, setIsLoadingLists] = useState(true);
    const [listsError, setListsError] = useState<string | null>(null);
    const [updatingItemId, setUpdatingItemId] = useState<string | null>(null); // Track item being suspended/activated
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null); // Track item being deleted
    // --- End State for User and Agent Lists ---

    // --- State for Filtering and Pagination ---
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'agent'>('all'); // Filter by role
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all'); // Filter by status
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Number of items per page
    // --- End State for Filtering and Pagination ---


    // --- State for Toast Notification ---
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
     const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // --- End State for Toast Notification ---

    const showToastMessage = (message: string, type: 'success' | 'error') => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3000);
    };

    // --- Fetch All Data Effect ---
    const fetchManagementData = async () => {
        setIsLoadingStats(true);
        setIsLoadingUserGrowth(true);
        setIsLoadingLists(true);
        setStatsError(null);
        setUserGrowthError(null);
        setListsError(null);

        try {
            const [stats, userGrowth, users, agents] = await Promise.all([
                getAdminManagementOverviewStats(),
                getAdminMonthlyUserGrowth(),
                getAdminAllUsers(),
                getAdminAllAgents(),
            ]);

            setOverviewStats(stats);
            setMonthlyUserGrowthData(userGrowth);
            setUsersList(users);
            setAgentsList(agents);

        } catch (err: any) {
            console.error("Failed to fetch management data:", err);
            setStatsError(err.response?.data?.message || "Failed to load statistics.");
            setUserGrowthError(err.response?.data?.message || "Failed to load user growth data.");
            setListsError(err.response?.data?.message || "Failed to load users and agents list.");
        } finally {
            setIsLoadingStats(false);
            setIsLoadingUserGrowth(false);
            setIsLoadingLists(false);
        }
    };

    useEffect(() => {
        fetchManagementData();
    }, []);


    // --- ECharts Effect for User Growth Chart ---
    useEffect(() => {
        console.log("User growth chart useEffect running...");
        console.log("monthlyUserGrowthData in useEffect:", monthlyUserGrowthData);

        if (userStatsChartRef.current && monthlyUserGrowthData && monthlyUserGrowthData.length > 0) {
             console.log("Ref and data available, initializing user growth chart.");
            const chart = echarts.init(userStatsChartRef.current);

             const sortedData = monthlyUserGrowthData.sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
             });

            const dates = sortedData.map(
                (item) => `${item.year}-${String(item.month).padStart(2, "0")}`,
            );
            const counts = sortedData.map((item) => item.count);

            console.log("Prepared user growth dates:", dates);
            console.log("Prepared user growth counts:", counts);


            const option = {
                animation: true,
                tooltip: {
                    trigger: 'axis',
                     formatter: (params: any) => {
                        const param = params[0];
                        if (!param) return "";
                        const dateParts = param.name.split('-');
                        const year = parseInt(dateParts[0]);
                        const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
                        const date = new Date(year, month);
                        const monthName = date.toLocaleString("default", { month: "long" });
                        return `${monthName}, ${year}<br/>New Users: ${param.value}`;
                    },
                },
                xAxis: {
                    type: 'category',
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
                    type: 'value',
                    name: 'New Users',
                     minInterval: 1,
                },
                series: [{
                    name: 'New Users',
                    data: counts,
                    type: 'line',
                    smooth: true,
                    color: '#6366f1',
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [{
                                offset: 0, color: 'rgba(99, 102, 241, 0.5)'
                            }, {
                                offset: 1, color: 'rgba(99, 102, 241, 0.05)'
                            }]
                        }
                    },
                     symbol: 'circle',
                     symbolSize: 8
                }]
            };
            chart.setOption(option);

            const handleResize = () => {
                chart.resize();
            };
            window.addEventListener('resize', handleResize);

            return () => {
                console.log("Disposing user growth chart.");
                window.removeEventListener('resize', handleResize);
                chart.dispose();
            };
        } else {
             console.log("User growth chart skipped: Ref not ready or no data.", { refReady: !!userStatsChartRef.current, hasData: !!monthlyUserGrowthData && monthlyUserGrowthData.length > 0 });
        }
    }, [monthlyUserGrowthData]);


    // --- Combine Users and Agents for Table Display ---
    const combinedList = useMemo(() => {
        const combined: CombinedUserAgentData[] = [];
        // Add users
        usersList.forEach(user => {
            combined.push({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: 'user',
                status: user.status,
                phoneOrNumber: user.phone,
            });
        });
        // Add agents
        agentsList.forEach(agent => {
            combined.push({
                _id: agent._id,
                name: agent.name,
                email: agent.email,
                role: 'agent',
                status: agent.status,
                phoneOrNumber: agent.phoneNumber,
                isAgentVerified: agent.isVerified
            });
        });
         combined.sort((a, b) => a.name.localeCompare(b.name));

        return combined;
    }, [usersList, agentsList]);


    // --- Filtering and Searching Logic ---
    const filteredAndSearchedList = useMemo(() => {
        return combinedList.filter(item => {
            const matchesSearch = searchTerm.trim() === '' ||
                                  item.name.toLowerCase().includes(searchTerm.toLowerCase())
                                  || item.email.toLowerCase().includes(searchTerm.toLowerCase())
                                  || item.phoneOrNumber.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole = roleFilter === 'all' || item.role === roleFilter;

            // Check item.status defensively before filtering
            const matchesStatus = statusFilter === 'all' ||
                                  (item.status && item.status === statusFilter); // Added check for item.status existence


            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [combinedList, searchTerm, roleFilter, statusFilter]);


    // --- Pagination Logic ---
    const totalItems = filteredAndSearchedList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedList = filteredAndSearchedList.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
     useEffect(() => {
         setCurrentPage(1);
     }, [searchTerm, roleFilter, statusFilter]);


    // --- Action Handlers (Status Update & Delete) ---

    const handleUpdateStatus = async (item: CombinedUserAgentData) => {
        // Determine the new status - default to active if status is currently null/undefined
        const currentStatus = item.status || 'active';
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        const itemType = item.role;

        if (!window.confirm(`Are you sure you want to ${newStatus} this ${itemType}?`)) {
            return;
        }

        setUpdatingItemId(item._id);
        try {
            let response;
            if (itemType === 'user') {
                response = await updateAdminUserStatus(item._id, newStatus);
            } else { // itemType === 'agent'
                response = await updateAdminAgentStatus(item._id, newStatus);
            }

            showToastMessage(response.message || `${itemType} status updated successfully.`, 'success');

            // Optimistically update the local state
            if (itemType === 'user') {
                setUsersList(usersList.map(user =>
                    user._id === item._id ? { ...user, status: newStatus } : user
                ));
            } else { // itemType === 'agent'
                setAgentsList(agentsList.map(agent =>
                    agent._id === item._id ? { ...agent, status: newStatus } : agent
                ));
            }

        } catch (err: any) {
            console.error(`Error updating ${itemType} status for ${item._id}:`, err);
             const errorMsg = err.response?.data?.message || `Failed to update ${itemType} status.`;
            showToastMessage(errorMsg, 'error');
        } finally {
            setUpdatingItemId(null);
        }
    };

    const handleDeleteItem = async (item: CombinedUserAgentData) => {
        const itemType = item.role;

         // Prevent admin from deleting themselves - use _id comparison for safety
         if (itemType === 'user' && item._id === loggedInAdminId) {
             showToastMessage("You cannot delete your own admin account.", "error");
             return;
         }


        if (!window.confirm(`Are you sure you want to permanently remove this ${itemType}? This action cannot be undone.`)) {
            return;
        }

        setDeletingItemId(item._id);
        try {
            let response;
            if (itemType === 'user') {
                response = await deleteAdminUser(item._id);
            } else { // itemType === 'agent'
                response = await deleteAdminAgent(item._id);
            }

            showToastMessage(response.message || `${itemType} removed successfully.`, 'success');

            // Remove the item from the local state
            if (itemType === 'user') {
                setUsersList(usersList.filter(user => user._id !== item._id));
            } else { // itemType === 'agent'
                 setAgentsList(agentsList.filter(agent => agent._id !== item._id));
            }

        } catch (err: any) {
            console.error(`Error deleting ${itemType} ${item._id}:`, err);
             const errorMsg = err.response?.data?.message || `Failed to remove ${itemType}.`;
            showToastMessage(errorMsg, 'error');
        } finally {
            setDeletingItemId(null);
        }
    };


    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
       localStorage.removeItem("userId");
       localStorage.removeItem("userEmail");
      navigate("/admin/signin");
    };


    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div
                className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg transition-all duration-300 fixed h-full z-10`}
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
                    { id: "dashboard", icon: "tachometer-alt", label: "Dashboard", href: "/admin/dashboard" },
                    { id: "management", icon: "users", label: "User Management", href: "/admin/management" }, // This page
                    { id: "educational", icon: "book-open", label: "Educational Content", href: "/admin/educational" },
                    { id: "rewards", icon: "gift", label: "Rewards Management", href: "/admin/rewards" },
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
                <div className="absolute bottom-0 w-full p-4 border-t">
                  <div className="flex items-center">
                    <img
                      src="https://a.imagem.app/BnNS9E.jpeg"
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {!isSidebarCollapsed && (
                      <div className="ml-3">
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
            <div className={`flex-1 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} min-h-screen transition-all duration-300`}>
                {/* Header */}
                <header className="bg-white shadow-sm sticky top-0 z-0">
                  <div className="flex items-center justify-between px-6 py-4">
                    <h1 className="text-2xl font-semibold text-gray-800">User & Agent Management</h1>
                     <div className="flex items-center space-x-4">
                       {/* Profile Dropdown */}
                       <div className="relative">
                         <button
                           onClick={() => setShowProfileMenu(!showProfileMenu)}
                           className="flex items-center space-x-2 cursor-pointer"
                         >
                            <img
                             src="https://a.imagem.app/BnNS9E.jpeg"
                             alt="Profile"
                             className="w-8 h-8 rounded-full object-cover"
                           />
                           <i className="fas fa-chevron-down text-gray-600 text-sm"></i>
                         </button>
                         {showProfileMenu && (
                           <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                             <div className="py-1">
                               <a
                                 href="#"
                                 onClick={(e) => { e.preventDefault(); navigate('/admin/profile'); }}
                                 className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                               >
                                 Profile
                               </a>
                                <a
                                 href="#"
                                  onClick={(e) => { e.preventDefault(); navigate('/admin/settings'); }}
                                 className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                               >
                                 Settings
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

                {/* Main Content */}
                <main className="p-6">
                    {/* Display Errors */}
                     {(statsError || userGrowthError || listsError) && (
                         <div
                             className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                             role="alert"
                         >
                             <strong className="font-bold">Error!</strong>
                             <span className="block sm:inline">
                                {" "}
                                {statsError || userGrowthError || listsError}
                             </span>
                         </div>
                     )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                       {isLoadingStats ? (
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
                           <>
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Total Users</p>
                                            <h3 className="text-2xl font-semibold mt-1">{overviewStats.totalUsers}</h3>
                                            <p className="text-sm text-green-500 mt-2">
                                                <i className="fas fa-arrow-up mr-1"></i>12.5% {/* Static percentage change - replace if backend provides */}
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
                                            <p className="text-sm text-gray-500">Total Agents</p>
                                            <h3 className="text-2xl font-semibold mt-1">{overviewStats.totalAgents}</h3>
                                            {/* Static percentage change - replace if backend provides */}
                                             <p className="text-sm text-green-500 mt-2"><i className="fas fa-arrow-up mr-1"></i>15.7%</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-headset text-blue-600 text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Suspended Users</p>
                                            <h3 className="text-2xl font-semibold mt-1">{overviewStats.suspendedUsers}</h3>
                                             {/* Static percentage change - replace if backend provides */}
                                             <p className="text-sm text-red-500 mt-2"><i className="fas fa-arrow-down mr-1"></i>5.2%</p>
                                        </div>
                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-user-slash text-red-600 text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Suspended Agents</p>
                                            <h3 className="text-2xl font-semibold mt-1">{overviewStats.suspendedAgents}</h3>
                                             {/* Static percentage change - replace if backend provides */}
                                            <p className="text-sm text-red-500 mt-2"><i className="fas fa-arrow-down mr-1"></i>3.1%</p>
                                        </div>
                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-user-slash text-red-600 text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                            </>
                       ) : (
                            <div className="lg:col-span-4 text-gray-500 text-center">No statistics available.</div>
                       )}
                    </div>

                    {/* User Growth Chart */}
                     <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                       <h3 className="text-lg font-semibold mb-4">User Growth Trend (Monthly Signups)</h3>
                       {isLoadingUserGrowth ? (
                            <div className="text-center py-8 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                                <div className="h-64 bg-gray-200 rounded"></div>
                            </div>
                       ) : userGrowthError ? (
                           <div className="text-red-600 text-center py-8">
                             <i className="fas fa-exclamation-circle mr-2"></i> {userGrowthError}
                           </div>
                       ) : monthlyUserGrowthData && monthlyUserGrowthData.length > 0 ? (
                          <div ref={userStatsChartRef} style={{ height: '300px' }}></div>
                       ) : (
                           <div className="text-gray-500 text-center py-8">
                               <i className="fas fa-chart-line text-2xl mb-2"></i>
                               <p>No user growth data available yet.</p>
                           </div>
                       )}
                    </div>

                    {/* User & Agent Table Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold mb-4">User & Agent List</h3>
                        {/* Controls (Search, Filter, Add) */}
                        <div className="flex flex-wrap items-center justify-between mb-6">
                            <div className="flex items-center space-x-4 mb-4 md:mb-0">
                                {/* Search Input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search users/agents..."
                                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>

                                {/* Role Filter */}
                                <div className="relative">
                                     <select
                                         value={roleFilter}
                                         onChange={(e) => setRoleFilter(e.target.value as 'all' | 'user' | 'agent')}
                                         className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                     >
                                         <option value="all">All Roles</option>
                                         <option value="user">Users</option>
                                         <option value="agent">Agents</option>
                                          {/* Add option for admin if admins are listed here */}
                                         {/* <option value="admin">Admins</option> */}
                                     </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <i className="fas fa-chevron-down"></i>
                                    </div>
                                </div>

                                {/* Status Filter */}
                                 <div className="relative">
                                      <select
                                          value={statusFilter}
                                          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
                                          className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                      >
                                          <option value="all">All Statuses</option>
                                          <option value="active">Active</option>
                                          <option value="suspended">Suspended</option>
                                      </select>
                                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                         <i className="fas fa-chevron-down"></i>
                                     </div>
                                 </div>

                            </div>
                             {/* Add User/Agent Button (Optional - signup handled elsewhere) */}
                             {/* <button
                                onClick={() => setShowAddUserModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap !rounded-button"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Add New User
                            </button> */}
                        </div>

                        {/* User/Agent Table */}
                        {isLoadingLists ? (
                             <div className="text-center py-8">
                                 <i className="fas fa-spinner fa-spin text-indigo-600 text-3xl"></i>
                                 <p className="mt-2 text-gray-600">Loading users and agents...</p>
                             </div>
                        ) : listsError ? (
                                                        <div className="text-red-600 text-center py-8">
                              <i className="fas fa-exclamation-circle mr-2"></i> {listsError}
                            </div>
                        ) : filteredAndSearchedList.length === 0 ? (
                             <div className="text-gray-600 text-center py-8">
                                 <i className="fas fa-users-slash text-2xl mb-2"></i>
                                 <p>No users or agents match the current filters/search.</p>
                             </div>
                        ) : (
                           <div className="overflow-x-auto">
                             <table className="w-full divide-y divide-gray-200">
                               <thead>
                                 <tr className="bg-gray-50">
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User/Agent</th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                   {roleFilter !== 'user' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                                    )}
                                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                 </tr>
                               </thead>
                               <tbody className="bg-white divide-y divide-gray-200">
                                 {paginatedList.map((item) => (
                                   <tr key={item._id} className="hover:bg-gray-50">
                                     <td className="px-6 py-4 whitespace-nowrap">
                                       <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                       <div className="text-sm text-gray-500">{item.email}</div>
                                     </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.phoneOrNumber}
                                      </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                             item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                         }`}>
                                            {/* FIX: Safely access status before using charAt */}
                                            {item.status && typeof item.status === 'string'
                                              ? (item.status.charAt(0).toUpperCase() + item.status.slice(1))
                                              : 'Unknown'}
                                        </span>
                                     </td>
                                      {roleFilter !== 'user' && (
                                          <td className="px-6 py-4 whitespace-nowrap">
                                             {item.role === 'agent' ? (
                                                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                      item.isAgentVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                  }`}>
                                                     {item.isAgentVerified ? 'Yes' : 'No'}
                                                  </span>
                                             ) : (
                                                 '-'
                                             )}
                                         </td>
                                     )}
                                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {/* Suspend/Activate Button */}
                                         <button
                                            onClick={() => handleUpdateStatus(item)}
                                             className={`!rounded-button text-sm px-3 py-1 ${
                                                item.status === 'active' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                                'bg-green-100 text-green-800 hover:bg-green-200'
                                             } transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                                              disabled={updatingItemId === item._id}
                                         >
                                             {updatingItemId === item._id ? (
                                                 <i className="fas fa-spinner fa-spin mr-1"></i>
                                             ) : (
                                                <i className={`fas fa-${item.status === 'active' ? 'pause' : 'play'} mr-1`}></i>
                                             )}
                                             {updatingItemId === item._id ? "Updating..." : (item.status === 'active' ? 'Suspend' : 'Activate')}
                                         </button>

                                         {/* Remove Button - Prevent deleting themselves */}
                                          {/* Added check to ensure item.role is not undefined if combining diverse types */}
                                          {(item.role !== 'user' || item._id !== loggedInAdminId) && (
                                              <button
                                                  onClick={() => handleDeleteItem(item)}
                                                  className="!rounded-button text-sm px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                  disabled={deletingItemId === item._id}
                                              >
                                                   {deletingItemId === item._id ? (
                                                        <i className="fas fa-spinner fa-spin mr-1"></i>
                                                    ) : (
                                                       <i className="fas fa-trash-alt mr-1"></i>
                                                    )}
                                                  {deletingItemId === item._id ? "Removing..." : "Remove"}
                                              </button>
                                          )}
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                        )}

                        {/* Pagination */}
                        {filteredAndSearchedList.length > 0 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-500">
                                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                     {/* Simple Pagination: Show current page and a couple around it */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                         .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                                         .map((page, index, arr) => (
                                            <React.Fragment key={page}>
                                                 {/* Add ellipsis if there's a gap */}
                                                 {index > 0 && page > arr[index - 1] + 1 && (
                                                     <span className="px-3 py-1 text-gray-500">...</span>
                                                 )}
                                                 <button
                                                    onClick={() => handlePageChange(page)}
                                                    className={`px-3 py-1 border rounded-lg text-sm ${
                                                         currentPage === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                                                     } cursor-pointer`}
                                                 >
                                                     {page}
                                                 </button>
                                            </React.Fragment>
                                        ))
                                    }
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                         )}
                    </div>
                </main>
            </div>

             {/* Toast Notification */}
             {showToast && (
                 <div
                     className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
                       toastType === "success" ? "bg-green-600" : "bg-red-600"
                     }`}
                     style={{ zIndex: 100 }}
                   >
                     {toastMessage}
                 </div>
             )}

        </div>
    );
};

export default AdminManagement;
