import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboards from "./pages/Dashboards";
import AIChat from "./pages/AIChat";
import UploadDoc from "./pages/UploadDoc";
import StagingReviews from "./pages/StagingReviews";
import Library from "./pages/Library";
import Settings from "./pages/Settings";

// Simple fallback for 404 Pages
const NotFound: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col justify-center items-center text-center space-y-3">
    <h2 className="text-4xl font-extrabold text-white">404</h2>
    <p className="text-sm text-gray-500 font-semibold uppercase tracking-widest">Workspace section not found</p>
    <a href="/dashboard" className="text-xs text-brand-blue font-bold hover:underline">
      Return to Operations
    </a>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboards />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/upload" element={<UploadDoc />} />
            <Route path="/staging" element={<StagingReviews />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<Settings />} />

            {/* Path backups to prevent dead-links */}
            <Route path="/machines" element={<Navigate to="/dashboard" replace />} />
            <Route path="/users" element={<Navigate to="/dashboard" replace />} />
            <Route path="/departments" element={<Navigate to="/dashboard" replace />} />
            <Route path="/activities" element={<Navigate to="/dashboard" replace />} />

            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
