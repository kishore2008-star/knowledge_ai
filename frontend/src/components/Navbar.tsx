import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, Search, Calendar, ChevronDown, Check } from "lucide-react";
import api from "../services/api";

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 border-b border-card-border px-6 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Date display */}
      <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
        <Calendar size={16} />
        <span>
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Action utilities */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white border border-card-border transition-colors duration-150 relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-blue text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-card-border flex items-center justify-between">
                <span className="font-semibold text-xs text-white uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-brand-blue hover:text-white font-medium flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-card-border/50">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">No new notifications.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs leading-relaxed transition-colors ${
                        n.isRead ? "bg-transparent text-gray-400" : "bg-brand-blue/5 text-white"
                      }`}
                    >
                      <p className="font-semibold">{n.title}</p>
                      <p className="mt-0.5 text-gray-400 font-normal">{n.message}</p>
                      <p className="mt-1 text-[10px] text-gray-600 font-medium">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="h-10 rounded-xl bg-white/5 border border-card-border px-3.5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-blue/30 text-brand-blue flex items-center justify-center font-bold text-xs">
            {user?.firstName[0]}
          </div>
          <span className="text-xs font-semibold text-gray-300">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[9px] font-bold tracking-wider">
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
