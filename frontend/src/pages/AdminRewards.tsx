// frontend/src/pages/AdminRewards.tsx
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  // --- Corrected Import Names to match api.ts ---
  getAdminRewardsOverviewStats,
  createAdminRedeemableProduct,
  getAdminAllRedeemableProducts,
  deleteAdminRedeemableProduct,
  // --- End Corrected Import Names ---
} from "../services/api"; // Import API functions

// Define types for fetched data
interface RewardsOverviewStats {
  totalPointsSpread: number;
  totalItemsRecycled: number;
}

interface RedeemableProduct {
  _id: string;
  name: string;
  category: "Eco Product" | "Cash Voucher"
  ; // Match backend enum
  description?: string;
  costInPoints: number;
  stock: number; // Can be a number or Infinity (Number.POSITIVE_INFINITY)
  imageUrl?: string;
  isActive: boolean;
  createdAt: string; // Date string
  updatedAt: string; // Date string
}

// Define types for form state
interface RewardFormState {
  name: string;
  category: "Eco Product" | "Cash Voucher" | ""; // Include empty string for initial state
  description: string;
  costInPoints: number | ""; // Use "" for empty initial state in number input
  stock: number | "" | 'Infinity'; // Allow number, "", or the string 'Infinity' from input
  imageUrl: string;
  isActive: boolean;
}

const AdminRewards: React.FC = () => {
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("rewards");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // --- State for Rewards Overview Stats ---
  const [overviewStats, setOverviewStats] =
    useState<RewardsOverviewStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  // --- End State for Rewards Overview Stats ---

  // --- State for Add Reward Form ---
  const [newRewardForm, setNewRewardForm] = useState<RewardFormState>({
    name: "",
    category: "", // Initialize with empty string
    description: "",
    costInPoints: "", // Initialize as empty string
    stock: "", // Initialize as empty string
    imageUrl: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  // --- End State for Add Reward Form ---

  // --- State for Current Rewards List ---
  const [rewardsList, setRewardsList] = useState<RedeemableProduct[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);
  const [rewardsError, setRewardsError] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  ); // State to track which product is being deleted
  // --- End State for Current Rewards List ---


  // --- State for Toast Notification ---
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  // --- End State for Toast Notification ---


  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    // Auto-hide toast after 3 seconds
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer); // Cleanup timer
  };

  // --- Fetch Overview Stats Effect ---
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      setStatsError(null);
      try {
        // --- Corrected API function call ---
        const stats = await getAdminRewardsOverviewStats();
        setOverviewStats(stats);
      } catch (err: any) {
        console.error("Failed to fetch rewards overview stats:", err);
        setStatsError(
          err.response?.data?.message || "Failed to load overview statistics.",
        );
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []); // Empty dependency array to run once on mount

  // --- Fetch Rewards List Effect ---
  const fetchRewardsList = async () => {
    setIsLoadingRewards(true);
    setRewardsError(null);
    try {
      // --- Corrected API function call ---
      const products = await getAdminAllRedeemableProducts();
      setRewardsList(products);
    } catch (err: any) {
      console.error("Failed to fetch redeemable products:", err);
      setRewardsError(
        err.response?.data?.message || "Failed to load rewards list.",
      );
    } finally {
      setIsLoadingRewards(false);
    }
  };

  useEffect(() => {
    fetchRewardsList(); // Fetch list on mount
  }, []);


  // --- Add Reward Form Handlers ---
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type, checked } = e.target;
    let newValue: string | number | boolean = value; // Default to string value

    if (type === 'checkbox') {
        newValue = checked;
    } else if (name === 'costInPoints' || name === 'stock') {
        // For number/stock fields, handle empty string and convert to number/Infinity string
        if (value === "") {
             newValue = ""; // Keep as empty string if input is cleared
        } else if (name === 'stock' && value.toLowerCase() === 'infinity') {
             newValue = 'Infinity'; // Store 'Infinity' as a string
        } else {
             // Attempt to convert to a number, but store as number only if valid
             const numValue = Number(value);
             newValue = isNaN(numValue) ? value : numValue; // Keep as string if not a valid number
        }
    }


    setNewRewardForm({ ...newRewardForm, [name]: newValue });

    // Optional: Clear errors related to this field as user types (can be verbose)
    // setFormErrors(formErrors.filter(err => !err.toLowerCase().includes(name.toLowerCase())));
  };

   const handleCategorySelect = (category: RewardFormState['category']) => {
       setNewRewardForm({ ...newRewardForm, category });
        // Optional: Clear category-related errors
       // setFormErrors(formErrors.filter(err => !err.toLowerCase().includes('category')));
   };


  const handleAddRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]); // Clear previous errors
    setIsFormSubmitting(true);

    // --- Frontend Validation ---
    const errors: string[] = [];
    const form = newRewardForm; // Use a shorthand

    if (!form.name.trim()) errors.push("Name is required.");
    if (!form.category) errors.push("Category is required.");
    if (typeof form.costInPoints !== 'number' || form.costInPoints < 0) {
        errors.push("Valid cost in points is required (must be a non-negative number).");
    }

    // Validate stock: Must be a number >= 0 OR the string 'Infinity'
    if (typeof form.stock !== 'number' && form.stock !== 'Infinity') {
         errors.push("Valid stock is required (must be a non-negative number or 'Infinity').");
    } else if (typeof form.stock === 'number' && (form.stock < 0 || !Number.isInteger(form.stock))) {
        // Additional check for number type: must be non-negative integer
        errors.push("Valid stock must be a non-negative integer or 'Infinity'.");
    }
     // Optional: Description and imageUrl validation if needed (e.g., URL format)


    if (errors.length > 0) {
      setFormErrors(errors);
      setIsFormSubmitting(false);
      showToastMessage("Please check form for errors.", "error");
      return;
    }
    // --- End Frontend Validation ---

    // Prepare data for backend - map 'Infinity' string to Number.POSITIVE_INFINITY
    const stockForBackend = form.stock === 'Infinity' ? Number.POSITIVE_INFINITY : (form.stock as number); // Cast stock to number if not 'Infinity'

    const dataForBackend = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        costInPoints: form.costInPoints as number, // Cast costInPoints to number
        stock: stockForBackend, // Use the mapped stock value
    };


    try {
      // --- Corrected API function call ---
      const response = await createAdminRedeemableProduct(dataForBackend);

      showToastMessage(response.message || "Reward added successfully!", "success");

      // Clear the form and refetch the list
      setNewRewardForm({
        name: "",
        category: "",
        description: "",
        costInPoints: "",
        stock: "",
        imageUrl: "",
        isActive: true,
      });
      setFormErrors([]); // Clear form-specific errors
      fetchRewardsList(); // Refresh the list

    } catch (err: any) {
      console.error("Error creating reward:", err);
      const errorMsg = err.response?.data?.message || "Failed to add reward.";
      setFormErrors([errorMsg]); // Set a general error message from backend or API service
      showToastMessage(errorMsg, "error");
    } finally {
      setIsFormSubmitting(false);
    }
  };
  // --- End Add Reward Form Handlers ---


  // --- Delete Reward Handler ---
  const handleDeleteReward = async (productId: string) => {
      if (!window.confirm("Are you sure you want to remove this reward? This action cannot be undone.")) {
          return; // Cancel deletion if user doesn't confirm
      }

      setDeletingProductId(productId); // Set state to show loading for this item
      try {
          // --- Corrected API function call ---
          const response = await deleteAdminRedeemableProduct(productId);
          showToastMessage(response.message || "Reward removed successfully.", "success");
          fetchRewardsList(); // Refresh the list after deletion
      } catch (err: any) {
           console.error(`Error deleting product ${productId}:`, err);
           const errorMsg = err.response?.data?.message || "Failed to remove reward.";
           showToastMessage(errorMsg, "error");
      } finally {
           setDeletingProductId(null); // Clear deleting state
      }
  };
  // --- End Delete Reward Handler ---


   // Handler for logging out (copied from AdminDashboard)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/admin/signin");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (Keeping the structure from AdminDashboard for consistency) */}
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
            { id: "dashboard", icon: "tachometer-alt", label: "Dashboard", href: "/admin/dashboard" },
            {
              id: "users",
              icon: "users",
              label: "User Management",
              href: "/admin/users",
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
        className={`flex-1 overflow-auto ${isSidebarCollapsed ? "ml-20" : "ml-64"} min-h-screen transition-all duration-300`}
      >
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center flex-1">
               <button
                  onClick={() => navigate("/admin/dashboard")} // Use navigate
                 className="text-gray-600 hover:text-indigo-600 cursor-pointer flex items-center !rounded-button"
               >
                 <i className="fas fa-arrow-left mr-2"></i>
                 <span>Back to Dashboard</span>
               </button>
            </div>
            <div className="flex items-center space-x-4">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                   <img
                    src="https://via.placeholder.com/30" // Placeholder image
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

        {/* Rewards Content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Rewards Program Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage redeemable rewards and track overall program statistics.
            </p>
          </div>

          {/* Rewards Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6 col-span-3">
              <h3 className="text-lg font-semibold mb-4">Program Statistics</h3>
              {isLoadingStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                     <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                     <div>
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                     </div>
                  </div>
                   <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                      <div>
                         <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                         <div className="h-5 bg-gray-200 rounded w-16"></div>
                      </div>
                   </div>
                </div>
              ) : statsError ? (
                <div className="text-red-600 text-center">
                  <i className="fas fa-exclamation-circle mr-2"></i> {statsError}
                </div>
              ) : overviewStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-coins text-indigo-600"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Total Points Spread</p>
                        <h3 className="text-xl font-semibold">
                          {overviewStats.totalPointsSpread.toLocaleString()}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-recycle text-blue-600"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-500">Items Recycled</p>
                        <h3 className="text-xl font-semibold">
                           {overviewStats.totalItemsRecycled.toLocaleString()}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="text-gray-500 text-center">No statistics available.</div>
              )}
            </div>
          </div>


          {/* Add Reward Form */}
                   <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-6">Add New Reward</h3>
            <form onSubmit={handleAddRewardSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newRewardForm.name}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  placeholder="Enter reward name"
                  disabled={isFormSubmitting}
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                 <div className="flex space-x-4">
                   {['Eco Product', 'Cash Voucher'].map(cat => (
                       <button
                           key={cat}
                           type="button"
                           onClick={() => handleCategorySelect(cat as RewardFormState['category'])}
                           className={`px-4 py-2 rounded-lg !rounded-button whitespace-nowrap disabled:opacity-50 ${
                               newRewardForm.category === cat
                                   ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                   : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                           }`}
                           disabled={isFormSubmitting}
                       >
                           {cat}
                       </button>
                   ))}
                 </div>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newRewardForm.description}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  placeholder="Enter reward description"
                  disabled={isFormSubmitting}
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="costInPoints"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cost in Points
                </label>
                <input
                  type="number"
                  id="costInPoints"
                  name="costInPoints"
                  value={newRewardForm.costInPoints}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  placeholder="Enter point cost"
                  min="0"
                  disabled={isFormSubmitting}
                />
              </div>
              <div>
                <label
                  htmlFor="stock"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Stock (Enter 'Infinity' or a number)
                </label>
                <input
                  type="text"
                  id="stock"
                  name="stock"
                  value={newRewardForm.stock === Number.POSITIVE_INFINITY ? 'Infinity' : newRewardForm.stock}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  placeholder="e.g., 50 or Infinity"
                  disabled={isFormSubmitting}
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Image URL
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  value={newRewardForm.imageUrl}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  placeholder="Enter image URL for the reward"
                  disabled={isFormSubmitting}
                />
              </div>
              <div className="flex items-center md:col-span-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={newRewardForm.isActive}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 cursor-pointer"
                   disabled={isFormSubmitting}
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-700 cursor-pointer"
                >
                  Is Active
                </label>
              </div>

               {/* Form Errors Display */}
               {formErrors.length > 0 && (
                   <div className="md:col-span-2">
                       <p className="text-red-600 font-medium mb-2">Please correct the following errors:</p>
                       <ul className="list-disc list-inside text-red-600 text-sm">
                           {formErrors.map((err, index) => <li key={index}>{err}</li>)}
                       </ul>
                   </div>
               )}

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 !rounded-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormSubmitting}
                >
                   {isFormSubmitting ? (
                     <i className="fas fa-spinner fa-spin mr-2"></i>
                   ) : (
                     <i className="fas fa-plus mr-2"></i>
                   )}
                  {isFormSubmitting ? "Adding Reward..." : "Add Reward"}
                </button>
              </div>
            </form>
          </div>

          {/* Current Rewards List */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Current Rewards</h3>

            {isLoadingRewards ? (
                <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-indigo-600 text-3xl"></i>
                    <p className="mt-2 text-gray-600">Loading rewards...</p>
                </div>
            ) : rewardsError ? (
                <div className="text-red-600 text-center py-8">
                  <i className="fas fa-exclamation-circle mr-2"></i> {rewardsError}
                </div>
            ) : rewardsList.length === 0 ? (
                 <div className="text-gray-600 text-center py-8">
                     <i className="fas fa-box-open text-2xl mb-2"></i>
                     <p>No rewards found. Add a new reward using the form above.</p>
                 </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Points
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Stock
                      </th>
                       <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Active
                       </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rewardsList.map((reward) => (
                      <tr key={reward._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <div className="flex items-center">
                               {reward.imageUrl && (
                                   <img
                                       className="h-10 w-10 rounded-full mr-4 object-cover"
                                       src={reward.imageUrl}
                                       alt={reward.name}
                                   />
                               )}
                               <div className="text-sm font-medium text-gray-900">{reward.name}</div>
                           </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reward.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reward.costInPoints}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {reward.stock === Number.POSITIVE_INFINITY ? 'Unlimited' : reward.stock}
                          </div>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                               reward.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                           }`}>
                             {reward.isActive ? 'Yes' : 'No'}
                           </span>
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteReward(reward._id)}
                            className="text-red-600 hover:text-red-900 !rounded-button whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={deletingProductId === reward._id}
                          >
                             {deletingProductId === reward._id ? (
                                 <i className="fas fa-spinner fa-spin mr-1"></i>
                             ) : (
                                <i className="fas fa-trash-alt mr-1"></i>
                             )}
                             {deletingProductId === reward._id ? "Removing..." : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default AdminRewards;
