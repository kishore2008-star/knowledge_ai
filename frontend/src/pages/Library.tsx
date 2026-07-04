import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Search, Filter, ChevronRight, BookOpen } from "lucide-react";

export const Library: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      const docRes = await api.get("/documents?stage=PRODUCTION");
      setDocuments(docRes.data.documents);

      const deptRes = await api.get("/admin/departments");
      setDepartments(deptRes.data.departments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) || 
      (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = selectedDept ? doc.departmentId === selectedDept : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="grid lg:grid-cols-12 gap-6 select-none relative">
      {/* Search & Listing */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Knowledge Library</h2>
          <p className="text-sm text-gray-400 font-medium">Browse verified operational procedures, SOPs, and manual records.</p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search library documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-card-border px-3 py-2 rounded-xl">
            <Filter size={14} className="text-gray-500" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-background">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-t-brand-blue border-white/5 rounded-full animate-spin"></div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-2xl text-xs text-gray-500">
            No matching documents found in production library.
          </div>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-4 rounded-xl glass-panel-interactive cursor-pointer border ${
                  selectedDoc?.id === doc.id ? "border-brand-blue" : "border-card-border"
                } flex items-center justify-between gap-4`}
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white text-sm truncate">{doc.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 truncate">{doc.description || "No description provided."}</p>

                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-3">
                    <span className="px-1.5 py-0.5 rounded bg-brand-blue/15 text-brand-blue font-bold uppercase">
                      {doc.department.name}
                    </span>
                    {doc.machine && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-card-border text-gray-400 font-bold">
                        {doc.machine.name}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-600 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Side Panel */}
      <div className="lg:col-span-5">
        {selectedDoc ? (
          <div className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="border-b border-card-border/50 pb-4">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Document Details</span>
              <h3 className="text-lg font-extrabold text-white mt-1">{selectedDoc.title}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{selectedDoc.description}</p>
            </div>

            <div className="space-y-4">
              {/* Summary */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Summary Analysis</span>
                <p className="p-3 bg-white/5 border border-card-border text-xs text-gray-300 rounded-xl leading-relaxed">
                  {selectedDoc.versions?.[0]?.summary || "Summary loading..."}
                </p>
              </div>

              {/* Version History */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Document History</span>
                <div className="space-y-2 text-[10px] text-gray-500">
                  <div className="p-3 bg-white/5 border border-card-border/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Version {selectedDoc.versions?.[0]?.version || "1.0.0"}</p>
                      <p className="text-gray-500 mt-0.5">{selectedDoc.versions?.[0]?.fileName}</p>
                    </div>
                    <span className="text-gray-600">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[400px] border border-dashed border-card-border rounded-3xl flex flex-col justify-center items-center text-center p-6">
            <BookOpen className="text-gray-600" size={36} />
            <p className="text-sm font-semibold text-white mt-2">No Document Selected</p>
            <p className="text-xs text-gray-500 max-w-xs mt-1">
              Select an operational document from the library listing to inspect full versions, details, and summaries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Library;
