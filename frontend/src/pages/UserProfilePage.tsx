// frontend/src/pages/UserProfilePage.tsx
import React, { useState, useEffect } from "react";
import {
  getProfileData,
  getUserScheduledPickups,
  getUserRedemptionHistory,
} from "../services/api"; // Adjust path if necessary
// Assuming you have Font Awesome imported globally or via react-fontawesome
// import '@fortawesome/fontawesome-free/css/all.min.css';

// Define interfaces for the fetched data shape (These are correct based on backend response)
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  referralCode?: string; // Optional if not always present
}

interface UserStats {
  ecoPoints: number;
  tier: string;
  wasteRecycled: number;
  totalPickupsMade: number; // Completed pickups
  totalPickupsScheduled: number; // Pending/Accepted pickups
  co2Reduced: number; // Placeholder
}

interface ScheduledPickup {
  _id: string; // Use backend _id
  preferredDateTime: string; // Backend sends as string
  ewasteType: string;
  ewasteSubtype: string;
  quantity: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  assignedAgentId: { name: string; phoneNumber: string } | null; // Populate details
  streetAddress: string;
  city: string;
  zipCode: string;
}

interface RedemptionItem {
  _id: string; // Use backend _id
  productName: string;
  category: string;
  pointsSpent: number;
  status: string; // Backend Redemption status (e.g., "Completed")
  createdAt: string; // Backend timestamp
}

const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [scheduledPickups, setScheduledPickups] = useState<
    ScheduledPickup[]
  >([]);
  const [redemptionHistory, setRedemptionHistory] = useState<
    RedemptionItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assume you have a way to get the logged-in user's token/status,
  // e.g., from AuthContext or localStorage
  // const { user, token } = useAuth(); // Example if using AuthContext

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use Promise.all to fetch data concurrently
        const [profileResponse, pickupsResponse, redemptionsResponse] =
          await Promise.all([
            getProfileData(), // This returns the DATA object { profile: {}, stats: {} }
            getUserScheduledPickups(), // This returns the DATA object { scheduledPickupsList: [] }
            getUserRedemptionHistory(), // This returns the DATA object { redemptionHistory: [] }
          ]);

        // Update state with fetched data - Access properties DIRECTLY from the response data object
        setProfile(profileResponse.profile); // CORRECTED: Removed .data
        setStats(profileResponse.stats);     // CORRECTED: Removed .data
        setScheduledPickups(pickupsResponse.scheduledPickupsList); // CORRECTED: Removed .data
        setRedemptionHistory(redemptionsResponse.redemptionHistory); // CORRECTED: Removed .data


      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError(err.message || "Failed to load profile data.");
        // Optional: Handle specific error codes like 401 (redirect to login)
        // if (err.response && err.response.status === 401) {
        //   // Redirect to login page (implement logic here)
        // }
      } finally {
        setLoading(false);
      }
    };

    // Fetch data when the component mounts
    fetchProfileData();
  }, []); // Empty dependency array means this effect runs once on mount

  // --- Helper functions for formatting data ---

  // Function to format date string (e.g., "May 10, 2025")
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
       console.error("Error formatting date:", dateString, e);
       return "Invalid Date";
    }
  };

  // Function to format time string (e.g., "10:00 AM")
  const formatTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
       const options: Intl.DateTimeFormatOptions = {
         hour: '2-digit',
         minute: '2-digit',
         hour12: true
       };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    } catch (e) {
        console.error("Error formatting time:", dateString, e);
        return "Invalid Time";
    }
  };

  // Function to format combined address
   const formatAddress = (pickup: ScheduledPickup) => {
       if (!pickup) return "N/A";
       // Filter out any null/undefined/empty parts before joining
       const parts = [pickup.streetAddress, pickup.city, pickup.zipCode].filter(part => part && part.trim() !== '');
       return parts.join(', ');
   }

  // --- Conditional Rendering for Loading/Error States ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Loading profile...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700">
        <p className="text-xl">Error: {error}</p>
      </div>
    );
  }

  // Render null or a message if profile/stats somehow end up null after loading
   if (!profile || !stats) {
       return (
           <div className="min-h-screen flex items-center justify-center bg-yellow-100 text-yellow-700">
               <p className="text-xl">Could not load profile details.</p>
           </div>
       );
   }

  // --- Main Render (using fetched data) ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f5e9] to-[#f1f8f2] text-gray-800 pb-8">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#43A047] via-[#388E3C] to-[#43A047] text-white py-16 px-8 rounded-b-[40px] shadow-xl">
        {/* Background Image - Keep as is */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "url('https://readdy.ai/api/search-image?query=modern%20abstract%20waves%20and%20geometric%20patterns%2C%20minimalist%20turquoise%20design%2C%20soft%20flowing%20shapes%2C%20professional%20clean%20background%20texture%2C%20contemporary%20minimal%20theme%2C%20very%20light%20and%20subtle%20design&width=1440&height=400&seq=2&orientation=landscape')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        </div>
        <div className="flex flex-col items-start relative z-10 max-w-6xl mx-auto pl-16">
          <h1 className="text-5xl font-bold mb-8 tracking-tight">
            {profile.name}
          </h1>
          <div className="flex flex-col space-y-5">
            <p className="text-2xl text-white/90 flex items-center">
              <i className="fas fa-envelope w-8 text-white/80"></i>
              <span className="font-light ml-2">{profile.email}</span>
            </p>
            <p className="text-2xl text-white/90 flex items-center">
              <i className="fas fa-phone w-8 text-white/80"></i>
              <span className="font-light ml-2">{profile.phone}</span>
            </p>
            {/* Display Referral Code if available */}
            {profile.referralCode && (
                <p className="text-2xl text-white/90 flex items-center">
                 <i className="fas fa-share-alt w-8 text-white/80"></i>
                 <span className="font-light ml-2">Referral Code: {profile.referralCode}</span>
               </p>
            )}
             {/* Display Address if available - assuming address is a single string field */}
             {profile.address && (
                <p className="text-2xl text-white/90 flex items-center">
                  <i className="fas fa-map-marker-alt w-8 text-white/80"></i>
                  <span className="font-light ml-2">{profile.address}</span>
                </p>
             )}
          </div>
        </div>
      </div>

      {/* Points & Stats Section */}
      <div className="px-16 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-10 mb-8 border border-green-100 hover:shadow-xl transition-all duration-300">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#43A047] mb-2">Eco Points</h2>
            <p className="text-6xl font-bold text-[#43A047]">
              {stats.ecoPoints}
            </p>
             {/* Display Tier */}
            <p className="text-xl font-semibold text-gray-700 mt-2">Tier: {stats.tier}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Added responsiveness */}
            <div className="bg-gradient-to-br from-[#e8f5e9] to-[#f1f8f2] rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <i className="fas fa-weight text-[#43A047] text-3xl mb-3"></i>
              <p className="text-lg text-gray-600 mb-2">Waste Recycled</p>
              <p className="text-2xl font-bold text-[#2E7D32]">
                {stats.wasteRecycled} kg
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#e8f5e9] to-[#f1f8f2] rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <i className="fas fa-truck text-[#43A047] text-3xl mb-3"></i>
              <div className="flex justify-between items-center">
                <div className="border-r border-[#43A047]/20 pr-4">
                  <p className="text-lg text-gray-600 mb-2">Completed Pickups</p> {/* Added "Pickups" for clarity */}
                  <p className="text-2xl font-bold text-[#43A047]">
                    {stats.totalPickupsMade}
                  </p>
                </div>
                <div className="pl-4">
                  <p className="text-lg text-gray-600 mb-2">Scheduled Pickups</p> {/* Added "Pickups" for clarity */}
                  <p className="text-2xl font-bold text-[#43A047]">
                    {stats.totalPickupsScheduled}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#e8f5e9] to-[#f1f8f2] rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <i className="fas fa-cloud text-[#43A047] text-3xl mb-3"></i>
              <p className="text-lg text-gray-600 mb-2">CO₂ Reduced</p>
              <p className="text-2xl font-bold text-[#43A047]">
                {stats.co2Reduced} kg
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Pickups List */}
      <div className="px-16">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-[#43A047] flex items-center">
            <i className="fas fa-calendar-check mr-4 text-[#43A047]"></i>
            Scheduled Pickups List {/* Added "List" for clarity */}
          </h2>
        </div>
        <div className="space-y-6">
          {scheduledPickups.length > 0 ? (
            scheduledPickups.map((pickup) => (
              <div
                key={pickup._id} // Use backend _id as key
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border-l-4 cursor-pointer hover:shadow-xl hover:transform hover:translate-x-1 transition-all duration-300"
                // Adjust border color logic based on backend status
                style={{
                  borderLeftColor:
                    pickup.status === "accepted" ? "#43A047" : "#FFA000", // Green for accepted, Amber for pending
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                       {formatDate(pickup.preferredDateTime)} - {formatTime(pickup.preferredDateTime)}
                    </h3>
                    <p className="text-lg text-gray-600 mb-3">
                       {formatAddress(pickup)} {/* Use helper for combined address */}
                    </p>
                    <div className="flex items-center text-lg text-gray-600">
                      <i className="fas fa-recycle mr-3 text-[#43A047] text-xl"></i>
                      <span>
                        {pickup.quantity} kg of {pickup.ewasteSubtype || pickup.ewasteType} {/* Display quantity and subtype/type */}
                      </span>
                    </div>
                     {/* Display Assigned Agent if available */}
                     {pickup.assignedAgentId && (
                        <div className="flex items-center text-md text-gray-500 mt-2">
                            <i className="fas fa-user-tie mr-3 text-gray-500"></i>
                            <span>Assigned: {pickup.assignedAgentId.name} ({pickup.assignedAgentId.phoneNumber})</span>
                        </div>
                     )}
                  </div>
                  <div className="flex flex-col items-end space-y-4">
                    <span
                      className={`text-lg font-medium px-4 py-2 rounded-full ${
                        pickup.status === "accepted"
                          ? "bg-[#e8f5e9] text-[#43A047]" // Green for accepted
                          : pickup.status === "pending"
                          ? "bg-amber-100 text-amber-700" // Amber for pending
                          : "bg-gray-100 text-gray-700" // Default for other statuses (though shouldn't be here)
                      }`}
                    >
                      {/* Capitalize the first letter of the status for display */}
                      {pickup.status.charAt(0).toUpperCase() +
                        pickup.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No scheduled pickups found.</p>
          )}
        </div>
      </div>

      {/* Redeem History */}
      <div className="px-16 mt-12">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-[#43A047] flex items-center">
            <i className="fas fa-history mr-4 text-[#43A047]"></i>
            Redemption History {/* Added "Redemption" for clarity */}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Added responsive grid */}
          {redemptionHistory.length > 0 ? (
            redemptionHistory.map((redeem) => (
              <div
                key={redeem._id} // Use backend _id as key
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-green-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-lg font-bold text-[#43A047]">
                    -{redeem.pointsSpent} pts {/* Use pointsSpent */}
                  </span>
                   <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                       redeem.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700' // Basic status styling
                   }`}>
                       {redeem.status} {/* Display redemption status */}
                   </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {redeem.productName} {/* Use productName */}
                </h3>
                 <p className="text-gray-600 text-sm mb-2">{redeem.category}</p> {/* Display category */}
                <p className="text-gray-600 text-sm">
                  <i className="far fa-calendar-alt mr-2"></i>
                  {formatDate(redeem.createdAt)} {/* Format creation date */}
                </p>
              </div>
            ))
          ) : (
             <div className="col-span-full"> {/* Center text in the grid area */}
                <p className="text-center text-gray-500">No redemption history found.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Ensure you export the component properly for routing
export default UserProfilePage;
