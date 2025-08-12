// frontend/src/AppRoutes.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import App from "./App";
import UserSignup from "./pages/userSignup";
import UserSignin from "./pages/userSignin";
import AdminSignin from "./pages/adminSignin";
import AdminSignup from "./pages/adminSignup";
import CollectorSignin from "./pages/CollectorSignin";
import CollectorSignup from "./pages/CollectorSignup";
import CollectorDashboard from "./pages/CollectorDashboard";
import CollectorPickupManagement from "./pages/CollectorPickupManagement";
import SchedulePickup from "./pages/pickup";
import Education from "./pages/Education";
import Gamification from "./pages/Gamification";
import Community from "./pages/Community";
import Dashboard from "./pages/dashboard";
import UserProfile from "./pages/UserProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEducationalContent from "./pages/AdminEducationalContent";
import AdminRewards from "./pages/AdminRewards";
// --- NEW: Import AdminManagement component ---
import AdminManagement from "./pages/AdminManagement";
// --- END NEW ---


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<App />} />
      <Route path="/user/signup" element={<UserSignup />} />
      <Route path="/user/signin" element={<UserSignin />} />
      <Route path="/collector/signin" element={<CollectorSignin />} />
      <Route path="/collector/signup" element={<CollectorSignup />} />

      {/* User Routes (potentially need authentication middleware/wrappers) */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/schedule-pickup" element={<SchedulePickup />} />
      <Route path="/education" element={<Education />} />
      <Route path="/rewards" element={<Gamification />} />
      <Route path="/community" element={<Community />} />
      <Route path="/profile" element={<UserProfile />} />

      {/* Admin Routes (potentially need authentication and authorization middleware/wrappers) */}
      <Route path="/admin/signin" element={<AdminSignin />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/educational" element={<AdminEducationalContent />} />
      <Route path="/admin/rewards" element={<AdminRewards />} />
       {/* --- NEW: Add route for AdminManagement --- */}
       <Route path="/admin/management" element={<AdminManagement />} />
       {/* --- END NEW --- */}

      {/* Collector Routes (potentially need authentication and authorization middleware/wrappers) */}
      <Route path="/collector/dashboard" element={<CollectorDashboard />} />
      <Route path="/collector/pickups" element={<CollectorPickupManagement />} />

      {/* Add routes for other parts of your application */}
    </Routes>
  );
};

export default AppRoutes;
