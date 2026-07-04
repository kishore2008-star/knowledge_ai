import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Settings,
  MessageSquare,
  FileSpreadsheet,
  Cpu,
  Layers,
  LogOut,
  Activity,
  FolderLock
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Determine navigation items based on role
  const getNavItems = () => {
    const common = [{ name: "Settings", path: "/settings", icon: Settings }];

    switch (user.role) {
      case "ADMIN":
        return [
          { name: "Admin Panel", path: "/dashboard", icon: LayoutDashboard },
          { name: "User Directory", path: "/users", icon: Users },
          { name: "Departments", path: "/departments", icon: Layers },
          { name: "Equipment Logs", path: "/machines", icon: Cpu },
          { name: "System Logs", path: "/activities", icon: Activity },
          ...common,
        ];
      case "MANAGER":
        return [
          { name: "Manager Board", path: "/dashboard", icon: LayoutDashboard },
          { name: "Staging Reviews", path: "/staging", icon: FolderLock },
          { name: "Knowledge Hub", path: "/library", icon: FileSpreadsheet },
          { name: "Asset Registry", path: "/machines", icon: Cpu },
          ...common,
        ];
      case "EXPERT":
        return [
          { name: "Expert Board", path: "/dashboard", icon: LayoutDashboard },
          { name: "Knowledge Library", path: "/library", icon: FileSpreadsheet },
          { name: "Ingest Docs", path: "/upload", icon: FolderLock },
          { name: "Machines List", path: "/machines", icon: Cpu },
          ...common,
        ];
      case "EMPLOYEE":
        return [
          { name: "Workspace", path: "/dashboard", icon: LayoutDashboard },
          { name: "AI Chat Assistant", path: "/chat", icon: MessageSquare },
          { name: "Knowledge Library", path: "/library", icon: FileSpreadsheet },
          { name: "Browse Machines", path: "/machines", icon: Cpu },
          ...common,
        ];
      default:
        return common;
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 min-h-screen bg-background border-r border-card-border p-4 flex flex-col justify-between select-none">
      <div>
        {/* Platform Title */}
        <div className="flex items-center gap-2 px-3 py-4 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center font-bold text-white shadow-glass">
            K
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white font-sans">
            KnowForge<span className="text-brand-blue">AI</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-brand-blue/20 to-brand-purple/10 text-brand-blue border-l-2 border-brand-blue font-semibold shadow-glass-inset"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-brand-blue" : "text-gray-400"} />
                  {item.name}
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Actions Footer */}
      <div className="border-t border-card-border pt-4 space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white font-bold font-sans text-sm shadow-md">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 font-medium truncate">
              {user.role} ({user.company})
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-150 border border-transparent hover:border-red-500/20"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
