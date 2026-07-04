import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        {/* Loading Spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-t-brand-blue border-white/5 animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500 font-semibold uppercase tracking-wider animate-pulse">
          Retrieving Workspace...
        </p>
      </div>
    );
  }

  // Redirect to login if user session is absent
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-background text-foreground min-h-screen">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto relative">
          {/* Subtle glowing elements */}
          <div className="glow-blur-blue -top-20 -right-20"></div>
          <div className="glow-blur-purple -bottom-40 -left-20"></div>
          
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
