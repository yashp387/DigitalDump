// src/pages/Gamification.tsx

import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext"; // Adjust path if needed
import {
  getUserGamificationStatus,
  getAvailableProducts,
  redeemProductById,
  getUserRedemptionHistory,
} from "../services/api"; // Adjust path if needed

// --- Interfaces ---
interface UserStatus {
  points: number;
  tier: "Normal" | "Bronze" | "Silver" | "Gold"; // Match backend tier names
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  category: "Eco Product" | "Cash Voucher"; // Match backend enum
  costInPoints: number;
  stock: number; // Can be Infinity
  imageUrl?: string;
}

interface Redemption {
  _id: string;
  productName: string;
  pointsSpent: number;
  status: string; // e.g., 'Completed', 'Pending Shipment'
  createdAt: string; // ISO date string
}

interface TierInfo {
  name: string;
  minPoints: number;
  icon: string;
  colorClass: string; // Tailwind classes for styling
  bonusInfo?: string; // Optional bonus description
}

// --- NEW: Interface for Category Button Data ---
interface CategoryButtonInfo {
  id: "Eco Product" | "Cash Voucher"; // Explicitly define the possible ID types
  name: string;
  icon: string;
}
// --- END NEW ---

// --- Tier Configuration ---
const TIER_LEVELS: { [key: string]: TierInfo } = {
  Normal: { name: "Normal", minPoints: 0, icon: "fa-seedling", colorClass: "text-gray-500 bg-gray-100 border-gray-300" },
  Bronze: { name: "Bronze", minPoints: 1200, icon: "fa-medal", colorClass: "text-amber-700 bg-amber-100 border-amber-600", bonusInfo: "30 bonus points" },
  Silver: { name: "Silver", minPoints: 3500, icon: "fa-medal", colorClass: "text-gray-700 bg-gray-200 border-gray-600", bonusInfo: "80 bonus points" },
  Gold: { name: "Gold", minPoints: 5500, icon: "fa-medal", colorClass: "text-yellow-700 bg-yellow-100 border-yellow-600", bonusInfo: "150 bonus points" },
};

const TIER_ORDER: (keyof typeof TIER_LEVELS)[] = ["Normal", "Bronze", "Silver", "Gold"];


// --- Component ---
const Gamification: React.FC = () => {
  // --- State ---
  const [language, setLanguage] = useState<"en" | "gu">("en");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "Eco Product" | "Cash Voucher">("all");

  // Data State
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<Redemption[]>([]);

  // Loading State
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null); // Store productId being redeemed

  // Error State
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [errorRedeem, setErrorRedeem] = useState<string | null>(null);

  // Modal State
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Product | null>(null);

  // --- Context ---
  const { isAuthenticated } = useContext(AuthContext);

  // --- Translations ---
  const translations = {
    en: {
      welcome: "Welcome to Rewards Center",
      subtitle: "Turn your learning achievements into exciting rewards!",
      availablePoints: "Available Points",
      currentTier: "Current Tier",
      nextTier: "Next Tier",
      pointsNeeded: "points needed",
      itemsAvailable: "items available",
      redeem: "Redeem",
      tierLevels: "Tier Levels",
      startsAt: "Starts at",
      bonusPoints: "bonus points per product", // Keep generic, specific bonus in TIER_LEVELS
      recentRedemptions: "Recent Redemptions",
      confirmRedemption: "Confirm Redemption",
      confirmMessage: "Are you sure you want to redeem",
      forPoints: "for",
      points: "points",
      cancel: "Cancel",
      confirm: "Confirm",
      home: "Home",
      loading: "Loading...",
      errorOccurred: "An error occurred",
      insufficientPoints: "Insufficient points",
      outOfStock: "Out of stock",
      allCategories: "All Categories",
      ecoProducts: "Eco Products",
      cashVouchers: "Cash Vouchers",
      redemptionSuccessful: "Redemption successful!",
      noRedemptions: "You haven't redeemed any items yet.",
      noProducts: "No rewards available in this category currently.",
      status: "Status",
      date: "Date",
      item: "Item",
      pointsSpent: "Points Spent",
    },
    gu: {
      welcome: "રિવોર્ડ્સ સેન્ટરમાં આપનું સ્વાગત છે",
      subtitle: "તમારી શીખવાની સિદ્ધિઓને રોમાંચક ઇનામોમાં ફેરવો!",
      availablePoints: "ઉપલબ્ધ પોઈન્ટ્સ",
      currentTier: "વર્તમાન ટાયર",
      nextTier: "આગામી ટાયર",
      pointsNeeded: "પોઈન્ટ્સ જરૂરી",
      itemsAvailable: "આઇટમ્સ ઉપલબ્ધ",
      redeem: "રિડીમ કરો",
      tierLevels: "ટાયર લેવલ્સ",
      startsAt: "શરૂ થાય છે",
      bonusPoints: "દરેક પ્રોડક્ટ પર બોનસ પોઈન્ટ્સ",
      recentRedemptions: "તાજેતરના રિડેમ્પશન્સ",
      confirmRedemption: "રિડેમ્પશનની પુષ્ટિ કરો",
      confirmMessage: "શું તમે ખરેખર રિડીમ કરવા માંગો છો",
      forPoints: "માટે",
      points: "પોઈન્ટ્સ",
      cancel: "રદ કરો",
      confirm: "પુષ્ટિ કરો",
      home: "હોમ",
      loading: "લોડ થઈ રહ્યું છે...",
      errorOccurred: "એક ભૂલ આવી",
      insufficientPoints: "અપૂરતા પોઈન્ટ્સ",
      outOfStock: "સ્ટોક નથી",
      allCategories: "બધી શ્રેણીઓ",
      ecoProducts: "ઇકો પ્રોડક્ટ્સ",
      cashVouchers: "કેશ વાઉચર્સ",
      redemptionSuccessful: "રિડેમ્પશન સફળ!",
      noRedemptions: "તમે હજી સુધી કોઈ આઇટમ રિડીમ કરી નથી.",
      noProducts: "આ શ્રેણીમાં હાલમાં કોઈ રિવોર્ડ્સ ઉપલબ્ધ નથી.",
      status: "સ્થિતિ",
      date: "તારીખ",
      item: "આઇટમ",
      pointsSpent: "ખર્ચાયેલા પોઈન્ટ્સ",
    },
  };
  const T = translations[language];

  // --- NEW: Define the category buttons array using the interface ---
  const categoryButtons: CategoryButtonInfo[] = [
    { id: "Eco Product", name: T.ecoProducts, icon: "fas fa-leaf" },
    { id: "Cash Voucher", name: T.cashVouchers, icon: "fas fa-ticket-alt" },
  ];
  // --- END NEW ---

  // --- Fetch Data ---
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("User not authenticated. Cannot load gamification data.");
      setIsLoadingStatus(false);
      setIsLoadingProducts(false);
      setIsLoadingHistory(false);
      return;
    }

    const loadData = async () => {
      // Fetch Status
      setIsLoadingStatus(true);
      setErrorStatus(null);
      try {
        const statusData = await getUserGamificationStatus();
        setUserStatus(statusData);
      } catch (error) {
        console.error("Failed to fetch user status:", error);
        setErrorStatus(T.errorOccurred);
      } finally {
        setIsLoadingStatus(false);
      }

      // Fetch Products
      setIsLoadingProducts(true);
      setErrorProducts(null);
      try {
        const productData = await getAvailableProducts();
        setProducts(productData || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setErrorProducts(T.errorOccurred);
      } finally {
        setIsLoadingProducts(false);
      }

      // Fetch History
      setIsLoadingHistory(true);
      setErrorHistory(null);
      try {
        const historyData = await getUserRedemptionHistory();
        setRedemptionHistory(historyData || []);
      } catch (error) {
        console.error("Failed to fetch redemption history:", error);
        setErrorHistory(T.errorOccurred);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadData();
  }, [isAuthenticated, T.errorOccurred]); // Re-fetch if auth status changes

  // --- Calculations ---
  const getCurrentTierInfo = (): TierInfo | null => {
    return userStatus ? TIER_LEVELS[userStatus.tier] : null;
  };

  const getNextTierInfo = (): TierInfo | null => {
    if (!userStatus) return null;
    const currentTierIndex = TIER_ORDER.indexOf(userStatus.tier);
    if (currentTierIndex < TIER_ORDER.length - 1) {
      const nextTierKey = TIER_ORDER[currentTierIndex + 1];
      return TIER_LEVELS[nextTierKey];
    }
    return null; // Already at highest tier
  };

  const pointsToNextTier = (): number => {
    const nextTier = getNextTierInfo();
    if (nextTier && userStatus) {
      return Math.max(0, nextTier.minPoints - userStatus.points);
    }
    return 0;
  };

  const progressToNextTierPercent = (): number => {
     const currentTier = getCurrentTierInfo();
     const nextTier = getNextTierInfo();
     if (currentTier && nextTier && userStatus) {
        const pointsInCurrentTier = userStatus.points - currentTier.minPoints;
        const pointsRange = nextTier.minPoints - currentTier.minPoints;
        if (pointsRange <= 0) return 100; // Avoid division by zero if tiers have same minPoints
        return Math.min(100, Math.max(0, (pointsInCurrentTier / pointsRange) * 100));
     }
     if (userStatus?.tier === "Gold") return 100; // Max tier
     return 0;
  };

  const filteredProducts = products.filter(
    (product) =>
      selectedCategory === "all" || product.category === selectedCategory
  );

  const categoryCounts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as { [key in Product['category']]: number });


  // --- Handlers ---
  const handleOpenRedeemModal = (product: Product) => {
    if ((userStatus?.points ?? 0) < product.costInPoints) {
        setErrorRedeem(T.insufficientPoints); // Show error immediately if not enough points
        setTimeout(() => setErrorRedeem(null), 3000);
        return;
    }
    if (product.stock !== Infinity && product.stock <= 0) {
        setErrorRedeem(T.outOfStock); // Show error immediately if out of stock
        setTimeout(() => setErrorRedeem(null), 3000);
        return;
    }
    setSelectedReward(product);
    setErrorRedeem(null); // Clear previous errors
    setShowRedeemModal(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward || isRedeeming) return;

    setIsRedeeming(selectedReward._id);
    setErrorRedeem(null);

    try {
      const result = await redeemProductById(selectedReward._id);

      // Success!
      setShowRedeemModal(false);
      setSelectedReward(null);
      // Optionally show a success message (e.g., using a toast library)
      console.log(T.redemptionSuccessful, result);

      // Refetch status and history to show updates
      const statusData = await getUserGamificationStatus();
      setUserStatus(statusData);
      const historyData = await getUserRedemptionHistory();
      setRedemptionHistory(historyData || []);
      // Optionally refetch products if stock changes are critical to display immediately
      // const productData = await getAvailableProducts();
      // setProducts(productData || []);

    } catch (error: any) {
      console.error("Redemption failed:", error);
      setErrorRedeem(error.response?.data?.message || T.errorOccurred);
      // Keep modal open to show error
    } finally {
      setIsRedeeming(null);
    }
  };

  // --- Render ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please log in to view Rewards.
      </div>
    );
  }

  const currentTierInfo = getCurrentTierInfo();
  const nextTierInfo = getNextTierInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-600">DigitalDump</div>
          <nav className="flex gap-6 items-center">
            <a href="/dashboard" className="text-gray-600 hover:text-emerald-600">
              Home
            </a>
            {/* Add links to Education, etc. */}
             <a href="/education" className="text-gray-600 hover:text-emerald-600">
              Education
            </a>
             <button className="!rounded-button whitespace-nowrap text-emerald-600 font-semibold">
              Rewards
            </button>
                         <a href="/community" className="text-gray-600 hover:text-emerald-600">Community</a>
            {/* Language Switcher */}
            <div className="flex items-center gap-2 ml-6">
              <button
                onClick={() => setLanguage("en")}
                className={`!rounded-button whitespace-nowrap px-3 py-1 text-sm ${
                  language === "en"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("gu")}
                className={`!rounded-button whitespace-nowrap px-3 py-1 text-sm ${
                  language === "gu"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                ગુજરાતી
              </button>
              {/* Profile Icon (Placeholder) */}
            <button className="cursor-pointer">
              <a href="/profile" className="text-gray-600 hover:text-emerald-600"><i className="fas fa-user-circle text-2xl"></i></a>
            </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* User Status Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8">
          {isLoadingStatus ? (
            <div className="text-center p-8">{T.loading}</div>
          ) : errorStatus ? (
            <div className="text-center p-8 text-red-500">{errorStatus}</div>
          ) : userStatus && currentTierInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
              {/* Welcome & Points */}
              <div className="md:col-span-2">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{T.welcome}</h1>
                <p className="text-gray-600 mb-6">{T.subtitle}</p>
                <div className="flex items-center gap-6 md:gap-8">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-emerald-600 mb-1">
                      {userStatus.points}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      {T.availablePoints}
                    </div>
                  </div>
                  <div>
                    <div className={`text-3xl md:text-4xl font-bold mb-1 ${currentTierInfo.colorClass.split(' ')[0]}`}> {/* Use text color */}
                      {currentTierInfo.name}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      {T.currentTier}
                    </div>
                  </div>
                </div>
              </div>
              {/* Next Tier Progress */}
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-50 rounded-xl"></div>
                <div className="relative p-4 md:p-6">
                  {nextTierInfo ? (
                    <>
                      <div className="text-base md:text-lg font-semibold mb-1 md:mb-2">
                        {T.nextTier}: {nextTierInfo.name}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                        {pointsToNextTier()} {T.pointsNeeded}
                      </div>
                      <div className="h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${progressToNextTierPercent()}%` }}
                        ></div>
                      </div>
                    </>
                  ) : (
                     <div className="text-center text-emerald-600 font-semibold">
                        You've reached the highest tier! 🎉
                     </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Category Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
           {/* All Categories Button */}
           <button
              onClick={() => setSelectedCategory("all")}
              className={`!rounded-button whitespace-nowrap p-4 md:p-6 text-left bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                selectedCategory === "all" ? "border-2 border-emerald-500" : ""
              }`}
            >
              <i className={`fas fa-star text-xl md:text-2xl text-emerald-600 mb-3 md:mb-4`}></i>
              <div className="text-base md:text-lg font-semibold mb-1">{T.allCategories}</div>
              <div className="text-xs md:text-sm text-gray-500">
                {products.length} {T.itemsAvailable}
              </div>
            </button>
           {/* --- UPDATED: Map over the explicitly typed categoryButtons array --- */}
          {categoryButtons.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)} // This should no longer cause a type error
              className={`!rounded-button whitespace-nowrap p-4 md:p-6 text-left bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                selectedCategory === category.id ? "border-2 border-emerald-500" : ""
              }`}
            >
              <i className={`${category.icon} text-xl md:text-2xl text-emerald-600 mb-3 md:mb-4`}></i>
              <div className="text-base md:text-lg font-semibold mb-1">{category.name}</div>
              <div className="text-xs md:text-sm text-gray-500">
                {categoryCounts[category.id] || 0} {T.itemsAvailable}
              </div>
            </button>
          ))}
          {/* --- END UPDATED --- */}
        </div>

        {/* Redeemable Products Grid */}
        {isLoadingProducts ? (
           <div className="text-center p-8">{T.loading}</div>
        ) : errorProducts ? (
           <div className="text-center p-8 text-red-500">{errorProducts}</div>
        ) : (
          <>
            {/* Display general redeem error if any */}
            {errorRedeem && !showRedeemModal && <div className="text-center text-red-500 mb-4">{errorRedeem}</div>}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
                  >
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/300x200?text=Reward'} // Fallback image
                      alt={product.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Reward'; }}
                    />
                    <div className="p-5 md:p-6 flex flex-col flex-grow">
                      <h3 className="text-lg md:text-xl font-semibold mb-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                          {product.description}
                        </p>
                      )}
                       {product.stock !== Infinity && product.stock < 10 && product.stock > 0 && (
                          <p className="text-sm text-orange-600 mb-2 font-medium">Only {product.stock} left!</p>
                       )}
                       {product.stock === 0 && (
                          <p className="text-sm text-red-600 mb-2 font-medium">{T.outOfStock}</p>
                       )}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-emerald-600 font-semibold">
                          {product.costInPoints} {T.points}
                        </div>
                        <button
                          onClick={() => handleOpenRedeemModal(product)}
                          className={`!rounded-button whitespace-nowrap bg-emerald-600 text-white px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm hover:bg-emerald-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed`}
                          disabled={
                            (userStatus?.points ?? 0) < product.costInPoints ||
                            product.stock === 0 ||
                            isRedeeming === product._id // Disable while this specific item is redeeming
                          }
                        >
                          {isRedeeming === product._id ? T.loading : T.redeem}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">{T.noProducts}</div>
            )}
          </>
        )}


        {/* Tier Levels & Recent Redemptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tier Levels */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">{T.tierLevels}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {TIER_ORDER.map(tierKey => {
                 const tier = TIER_LEVELS[tierKey];
                 const isCurrent = userStatus?.tier === tier.name;
                 return (
                    <div
                      key={tier.name}
                      className={`p-4 rounded-xl ${isCurrent ? tier.colorClass : 'bg-gray-50'}`} // Highlight current tier
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <i className={`fas ${tier.icon} ${isCurrent ? tier.colorClass.split(' ')[0] : 'text-gray-400'} text-xl`}></i>
                        <h3 className="text-base font-semibold">{tier.name}</h3>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">
                          {T.startsAt} {tier.minPoints.toLocaleString()} {T.points}
                        </p>
                        {tier.bonusInfo && (
                           <p className={`text-xs font-medium ${isCurrent ? tier.colorClass.split(' ')[0] : 'text-gray-500'}`}>
                              {tier.bonusInfo}
                           </p>
                        )}
                      </div>
                    </div>
                 );
              })}
            </div>
          </div>

          {/* Recent Redemptions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">{T.recentRedemptions}</h2>
             {isLoadingHistory ? (
               <div className="text-center p-4">{T.loading}</div>
             ) : errorHistory ? (
               <div className="text-center p-4 text-red-500">{errorHistory}</div>
             ) : redemptionHistory.length > 0 ? (
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2"> {/* Limit height and add scroll */}
                  {redemptionHistory.map((redemption) => (
                    <div
                      key={redemption._id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
                    >
                      <div>
                        <div className="font-semibold text-sm">{redemption.productName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(redemption.createdAt).toLocaleDateString()} {/* Format date */}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs sm:text-sm whitespace-nowrap">
                        <div className="text-emerald-600 font-medium">
                          {redemption.pointsSpent} {T.points}
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-xs ${
                            redemption.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            redemption.status === 'Pending Shipment' ? 'bg-yellow-100 text-yellow-700' :
                            redemption.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700' // Default/Cancelled
                        }`}>
                          {redemption.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="text-center py-4 text-gray-500">{T.noRedemptions}</div>
             )}
          </div>
        </div>
      </div>

      {/* Redemption Confirmation Modal */}
      {showRedeemModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 md:p-8 max-w-md w-full">
            <h3 className="text-xl md:text-2xl font-bold mb-4">{T.confirmRedemption}</h3>
            <p className="text-gray-600 mb-6">
              {T.confirmMessage}{" "}
              <span className="font-semibold">{selectedReward.name}</span>{" "}
              {T.forPoints}{" "}
              <span className="font-semibold text-emerald-600">{selectedReward.costInPoints}</span>{" "}
              {T.points}?
            </p>
            {/* Display error within modal */}
            {errorRedeem && <p className="text-red-500 text-sm mb-4">{errorRedeem}</p>}
            <div className="flex justify-end gap-3 md:gap-4">
              <button
                onClick={() => { setShowRedeemModal(false); setErrorRedeem(null); }} // Clear error on cancel
                disabled={!!isRedeeming} // Disable cancel while redeeming
                className="!rounded-button whitespace-nowrap px-5 py-2 border border-gray-300 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
              >
                {T.cancel}
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={!!isRedeeming} // Disable confirm while redeeming
                className="!rounded-button whitespace-nowrap bg-emerald-600 text-white px-5 py-2 hover:bg-emerald-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isRedeeming ? T.loading : T.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Assuming you rename the component if the original file was App.tsx
// export default App;
export default Gamification;
