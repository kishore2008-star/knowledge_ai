import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Upload, ChevronRight, CheckCircle, HelpCircle } from "lucide-react";

export const UploadDoc: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [departmentId, setDepartmentId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFormDependencies();
  }, []);

  const fetchFormDependencies = async () => {
    try {
      const deptsRes = await api.get("/admin/departments");
      setDepartments(deptsRes.data.departments);
      if (deptsRes.data.departments.length > 0) {
        setDepartmentId(deptsRes.data.departments[0].id);
      }

      const machRes = await api.get("/machines");
      setMachines(machRes.data.machines);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !departmentId) {
      setError("Title and Department are required fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("version", version);
      formData.append("departmentId", departmentId);
      if (machineId) formData.append("machineId", machineId);
      if (tags) {
        // split tags string by comma
        const tagArr = tags.split(",").map((t) => t.trim());
        tagArr.forEach((t) => formData.append("tags", t));
      }

      if (file) {
        formData.append("file", file);
      } else {
        formData.append("rawText", rawText);
      }

      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      // Reset form
      setTitle("");
      setDescription("");
      setTags("");
      setVersion("1.0.0");
      setRawText("");
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Ingestion dispatch failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none">
      <div>
        <h2 className="text-3xl font-extrabold text-white">Upload Knowledge</h2>
        <p className="text-sm text-gray-400 font-medium">Feed Operational Guidelines into the AI pipeline.</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-pulse">
            <CheckCircle size={16} /> Knowledge upload dispatched successfully. Processing in background staging.
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
            <HelpCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
              <input
                type="text"
                required
                placeholder="Error E102 Valve calibration guide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Version</label>
              <input
                type="text"
                required
                placeholder="1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
            <input
              type="text"
              placeholder="Corrective operations instructions for exhaust valves..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-background border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs font-medium"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Asset / Machine</label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-background border border-card-border focus:border-brand-blue focus:outline-none text-white text-xs font-medium"
              >
                <option value="">-- None / General --</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.machineId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Search Tags (comma separated)</label>
            <input
              type="text"
              placeholder="Pneumatic, Maintenance, Safety"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-sm"
            />
          </div>

          {/* Toggle between raw text input and file upload */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Knowledge Payload</label>
            <div className="grid grid-cols-2 gap-4 bg-white/5 p-1 rounded-xl border border-card-border mb-3">
              <button
                type="button"
                onClick={() => setFile(null)}
                className={`py-2 text-xs font-bold rounded-lg ${
                  !file ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Paste Manual Text
              </button>
              <button
                type="button"
                onClick={() => setFile(null)} // triggers click on hidden file input
                className={`py-2 text-xs font-bold rounded-lg relative ${
                  file ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Upload Document File
                <input
                  type="file"
                  id="file-input-field"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </button>
            </div>

            {!file ? (
              <textarea
                required={!file}
                rows={6}
                placeholder="Paste the raw markdown, text guide, or procedure notes here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-white/5 border border-card-border text-sm focus:border-brand-blue focus:outline-none text-white resize-none"
              />
            ) : (
              <div className="p-8 border border-dashed border-card-border rounded-xl text-center flex flex-col items-center justify-center gap-2">
                <Upload className="text-brand-blue" size={32} />
                <p className="text-sm font-bold text-white">File selected: {file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-red-400 font-bold mt-2 hover:underline"
                >
                  Remove File
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple hover:scale-[1.01] active:scale-[0.99] font-bold text-white text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Initializing AI Pipeline..." : "Submit to Ingestion Staging"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default UploadDoc;
