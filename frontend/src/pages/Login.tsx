import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { ShieldAlert, Key, Mail } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegisterParam = searchParams.get("register") === "true";

  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(isRegisterParam);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sign In states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register Company states
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Manufacturing");
  const [country, setCountry] = useState("United States");
  const [timezone, setTimezone] = useState("UTC");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", {
        companyName,
        industry,
        country,
        timezone,
        adminEmail,
        adminPassword,
        adminFirstName,
        adminLastName,
      });

      // After registration, auto login
      await login(adminEmail, adminPassword);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow layers */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-brand-blue/10 rounded-full blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center font-bold text-white mb-2.5">
            K
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isRegister ? "Forge Custom Tenant" : "Authenticate Session"}
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {isRegister ? "Establish workspace and default admin user" : "Sign in to access your dashboard"}
          </p>
        </div>

        {/* Tab triggers */}
        <div className="grid grid-cols-2 bg-white/5 border border-card-border p-1 rounded-xl mb-6">
          <button
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${
              !isRegister ? "bg-brand-blue text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            User Login
          </button>
          <button
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-colors ${
              isRegister ? "bg-brand-blue text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            Register Company
          </button>
        </div>

        {/* Error notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2"
            >
              <ShieldAlert size={14} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms */}
        {!isRegister ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-sm transition-colors placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
                  <Key size={16} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-sm transition-colors placeholder:text-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-sm shadow-lg shadow-brand-blue/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Authorizing..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-brand-blue uppercase tracking-wider border-b border-card-border pb-1">
              Company Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="Company Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-2 py-2.5 rounded-lg bg-background border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
                >
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Energy">Energy & Power</option>
                  <option value="Aviation">Aviation</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="IT Services">IT Services</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
                />
              </div>
            </div>

            <h4 className="text-xs font-bold text-brand-blue uppercase tracking-wider border-b border-card-border pb-1 pt-2">
              Administrator Setup
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane"
                  value={adminFirstName}
                  onChange={(e) => setAdminFirstName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={adminLastName}
                  onChange={(e) => setAdminLastName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Admin Email</label>
              <input
                type="email"
                required
                placeholder="admin@company.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs shadow-lg shadow-brand-blue/20 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {loading ? "Registering..." : "Provision Tenant"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
export default Login;
