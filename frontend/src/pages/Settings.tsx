import React from "react";
import { useAuth } from "../context/AuthContext";
import { Shield, Key, Bell, CreditCard, Laptop } from "lucide-react";

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none">
      <div>
        <h2 className="text-3xl font-extrabold text-white">System Settings</h2>
        <p className="text-sm text-gray-400 font-medium">Manage preferences, API tokens, and credentials.</p>
      </div>

      <div className="glass-panel rounded-3xl divide-y divide-card-border/50 overflow-hidden">
        {/* Profile Details */}
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Laptop size={18} className="text-brand-blue" /> Profile Configuration
          </h3>
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-wider">Full Name</p>
              <p className="text-white mt-1 text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-wider">Email Address</p>
              <p className="text-white mt-1 text-sm font-semibold">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-wider">Access Scope</p>
              <p className="text-white mt-1 text-sm font-semibold">{user?.role}</p>
            </div>
            <div>
              <p className="text-gray-500 font-bold uppercase tracking-wider">Affiliated Organization</p>
              <p className="text-white mt-1 text-sm font-semibold">{user?.company}</p>
            </div>
          </div>
        </div>

        {/* API Tokens config */}
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Key size={18} className="text-brand-purple" /> API Integrations
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
            Integrate with third-party cognitive endpoints. Leave blank to trigger default system fallback models.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">OpenAI Key Override</label>
              <input
                type="password"
                disabled
                placeholder="sk-proj-••••••••••••••••••••"
                className="w-full max-w-md px-3.5 py-2.5 rounded-xl bg-white/5 border border-card-border text-xs text-gray-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security / RBAC description */}
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Shield size={18} className="text-emerald-400" /> Compliance & Security
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
            This workspace operates under strict enterprise guidelines. Row Level Security (RLS) is active. Ingestions undergo mandatory supervisor checks prior to production deployment.
          </p>
        </div>
      </div>
    </div>
  );
};
export default Settings;
