import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  Users,
  Layers,
  Cpu,
  Database,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  FileX,
  FileClock,
  Clock,
  Search,
  BookMarked,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Colors for Pie Charts
const COLORS = ["#3b82f6", "#a855f7", "#60a5fa", "#c084fc", "#1d4ed8"];

export const Dashboards: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      let endpoint = "/analytics/employee"; // default mock mapping
      if (user?.role === "ADMIN") endpoint = "/analytics/admin";
      else if (user?.role === "MANAGER") endpoint = "/analytics/manager";
      else if (user?.role === "EXPERT") endpoint = "/analytics/expert";

      if (user?.role !== "EMPLOYEE") {
        const res = await api.get(endpoint);
        setData(res.data);
      } else {
        // Mock Employee dashboard states since it reads search history locally/session
        setData({
          chatHistory: [
            { id: 1, title: "Calibration of Pressure Valve E20", date: "2 hours ago" },
            { id: 2, title: "Hydraulic Pump Gasket Replacement", date: "Yesterday" },
          ],
          bookmarks: [
            { id: 10, title: "Safety standard LOTO guide.pdf", code: "SOP-SAF-02" },
            { id: 11, title: "IT VPN Setup Manual", code: "SOP-IT-09" }
          ],
        });
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-t-brand-blue border-white/5 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-gray-500 font-semibold tracking-widest uppercase">Compiling Metrics...</p>
      </div>
    );
  }

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  const renderAdmin = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-white font-sans">Tenant Administration</h2>
        <p className="text-sm text-gray-400 font-medium">Global status, metrics, and operations registry.</p>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 glass-panel rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Users</span>
            <p className="text-3xl font-black text-white">{data?.totalUsers || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="p-6 glass-panel rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Departments</span>
            <p className="text-3xl font-black text-white">{data?.totalDepartments || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
            <Layers size={22} />
          </div>
        </div>

        <div className="p-6 glass-panel rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Machines Registered</span>
            <p className="text-3xl font-black text-white">{data?.totalMachines || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Cpu size={22} />
          </div>
        </div>

        <div className="p-6 glass-panel rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Storage Managed</span>
            <p className="text-3xl font-black text-white">{data?.storageUsedMb || 0} MB</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Database size={22} />
          </div>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 glass-panel rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-1.5">
              <TrendingUp size={18} className="text-brand-blue" /> Ingestion Growth
            </h3>
            <span className="text-xs text-gray-500 font-medium">Monthly updates</span>
          </div>
          <div className="h-64">
            {data?.growthArray?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">No documents ingested yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.growthArray || [{ date: "Jul", count: 2 }]}>
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={11} />
                  <YAxis stroke="#4b5563" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Most Active Users */}
        <div className="p-6 glass-panel rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-base">Key Contributors</h3>
          <div className="divide-y divide-card-border/50">
            {data?.activeUsersList?.map((u: any, i: number) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">{u.name}</p>
                  <p className="text-gray-500 mt-0.5">{u.email}</p>
                </div>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-card-border font-bold text-brand-blue">
                  {u.actionsCount} logs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderManager = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-white font-sans">Manager Oversight</h2>
        <p className="text-sm text-gray-400 font-medium">Control production quality, pending approvals, and coverage stats.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/staging" className="p-6 glass-panel-interactive rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pending Staging Reviews</span>
            <p className="text-3xl font-black text-brand-blue">{data?.pendingReviews || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <FileClock size={22} />
          </div>
        </Link>

        <div className="p-6 glass-panel rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Ingestion Approval Rate</span>
            <p className="text-3xl font-black text-white">{data?.approvalRate || 100}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <FileCheck size={22} />
          </div>
        </div>

        <div className="p-6 glass-panel rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Rejected Entries</span>
            <p className="text-3xl font-black text-red-400">{data?.rejectedCount || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
            <FileX size={22} />
          </div>
        </div>
      </div>

      {/* Coverage Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coverage Chart */}
        <div className="lg:col-span-2 p-6 glass-panel rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-base">Department Knowledge Coverage</h3>
          <div className="h-64 flex justify-center items-center">
            {data?.departmentCoverage?.length === 0 ? (
              <p className="text-sm text-gray-500">No coverage data.</p>
            ) : (
              <div className="w-full h-full flex flex-col md:flex-row items-center justify-around">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.departmentCoverage || []}
                        dataKey="articles"
                        nameKey="department"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {data?.departmentCoverage?.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {data?.departmentCoverage?.map((entry: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-gray-400">{entry.department}:</span>
                      <span className="font-bold text-white">{entry.articles} items</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Low Rated Alert */}
        <div className="p-6 glass-panel rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Quality Warnings
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Articles flagged with low star reviews or marked not helpful by employees.
          </p>

          <div className="space-y-3">
            {data?.lowRatedArticles?.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">Excellent! All articles pass helpfulness filters.</p>
            ) : (
              data?.lowRatedArticles?.map((art: any) => (
                <div key={art.id} className="p-3 bg-white/5 border border-card-border/50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-bold text-white truncate max-w-[150px]">{art.title}</p>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-extrabold">
                      ★ {art.averageRating}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">Department: {art.department}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpert = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-white font-sans">Ingestion Control</h2>
        <p className="text-sm text-gray-400 font-medium">Manage and update technical procedures, guides, and manuals.</p>
      </div>

      {/* Action panel */}
      <div className="p-6 glass-panel rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-base">New Operational Document?</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-lg">
            Upload text, DOCX, safety PDFs, audio files, or troubleshooting manuals. The pipeline handles OCR, transcription, and vector embedding generation in the background.
          </p>
        </div>
        <Link
          to="/upload"
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-xs font-bold text-white shadow hover:scale-[1.02] transition-transform"
        >
          Launch Upload Pipeline
        </Link>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 glass-panel rounded-2xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">My Uploads</span>
          <p className="text-3xl font-black text-white">{data?.totalUploads || 0}</p>
        </div>
        <div className="p-5 glass-panel rounded-2xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Published</span>
          <p className="text-3xl font-black text-emerald-400">{data?.publishedCount || 0}</p>
        </div>
        <div className="p-5 glass-panel rounded-2xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">In Review</span>
          <p className="text-3xl font-black text-brand-blue">{data?.pendingCount || 0}</p>
        </div>
        <div className="p-5 glass-panel rounded-2xl text-center space-y-1">
          <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Needs Correction</span>
          <p className="text-3xl font-black text-red-400">{data?.rejectedCount || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderEmployee = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-tr from-brand-blue/30 via-brand-purple/10 to-transparent border border-brand-blue/20 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-xs text-brand-blue font-bold">
            <Sparkles size={13} /> Cognitive RAG Active
          </div>
          <h2 className="text-3xl font-extrabold text-white">How can I help you operate today?</h2>
          <p className="text-xs text-gray-400 leading-relaxed font-medium">
            Search procedures, diagnose error flags, or synthesize steps using context retrieved solely from production-grade safety manuals.
          </p>
        </div>

        <Link
          to="/chat"
          className="px-6 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <Search size={16} /> Ask AI Assistant
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bookmarked SOPs */}
        <div className="p-6 glass-panel rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <BookMarked size={18} className="text-brand-purple" /> Saved Documents
          </h3>
          <div className="space-y-2">
            {data?.bookmarks?.map((b: any) => (
              <div key={b.id} className="p-3 bg-white/5 border border-card-border/50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{b.title}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{b.code}</p>
                </div>
                <Link to="/library" className="text-brand-blue hover:underline font-semibold flex items-center gap-1">
                  View <ArrowUpRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Search Enquiries */}
        <div className="p-6 glass-panel rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Clock size={18} className="text-brand-blue" /> Recent Enquiries
          </h3>
          <div className="space-y-2">
            {data?.chatHistory?.map((h: any) => (
              <div key={h.id} className="p-3 bg-white/5 border border-card-border/50 rounded-xl flex items-center justify-between text-xs">
                <span className="font-medium text-gray-300 truncate max-w-[250px]">{h.title}</span>
                <span className="text-[10px] text-gray-500 font-medium">{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {user?.role === "ADMIN" && renderAdmin()}
      {user?.role === "MANAGER" && renderManager()}
      {user?.role === "EXPERT" && renderExpert()}
      {user?.role === "EMPLOYEE" && renderEmployee()}
    </>
  );
};
export default Dashboards;
