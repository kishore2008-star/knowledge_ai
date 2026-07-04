import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Check, X, FileText, Calendar, User, Eye, Layers } from "lucide-react";

export const StagingReviews: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchStagingDocs();
  }, []);

  const fetchStagingDocs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents?stage=STAGING");
      setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      await api.post(`/documents/${docId}/approve`);
      setSelectedDoc(null);
      fetchStagingDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedDoc) return;
    try {
      await api.post(`/documents/${selectedDoc.id}/reject`, {
        reason: rejectReason,
      });
      setShowRejectModal(false);
      setSelectedDoc(null);
      setRejectReason("");
      fetchStagingDocs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 select-none relative">
      {/* Pending queue */}
      <div className="lg:col-span-5 space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white">Staging Reviews</h2>
          <p className="text-sm text-gray-400 font-medium">Verify AI ingestion metadata prior to publishing.</p>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-t-brand-blue border-white/5 rounded-full animate-spin"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl text-xs text-gray-500">
            No pending reviews in Staging.
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-4 rounded-2xl glass-panel-interactive cursor-pointer border ${
                  selectedDoc?.id === doc.id ? "border-brand-blue" : "border-card-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{doc.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    doc.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" : "bg-brand-blue/10 text-brand-blue"
                  }`}>
                    {doc.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[10px] text-gray-500 mt-4 border-t border-card-border/50 pt-3">
                  <div className="flex items-center gap-1">
                    <Layers size={11} />
                    <span>{doc.department.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={11} />
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Focus details panel */}
      <div className="lg:col-span-7">
        {selectedDoc ? (
          <div className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-card-border/50 pb-4">
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Review Mode</span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{selectedDoc.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{selectedDoc.description}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => handleApprove(selectedDoc.id)}
                  className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors"
                >
                  <Check size={18} />
                </button>
              </div>
            </div>

            {/* Ingestion results */}
            <div className="space-y-5">
              {/* Summary */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Summary</span>
                <p className="p-3 bg-white/5 border border-card-border text-xs text-gray-300 rounded-xl leading-relaxed">
                  {selectedDoc.versions?.[0]?.summary || "No summary generated. Processing..."}
                </p>
              </div>

              {/* Keywords */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Keywords</span>
                <div className="flex flex-wrap gap-2">
                  {selectedDoc.versions?.[0]?.keywords?.map((k: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-brand-blue/10 border border-brand-blue/20 text-[10px] font-bold text-brand-blue rounded-lg">
                      #{k}
                    </span>
                  )) || <span className="text-xs text-gray-600">None</span>}
                </div>
              </div>

              {/* Parsed text details */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <FileText size={12} /> Document Content Chunks
                </span>
                <div className="max-h-60 overflow-y-auto divide-y divide-card-border/50 border border-card-border rounded-xl">
                  {selectedDoc.versions?.[0]?.chunks?.map((c: any, index: number) => (
                    <div key={index} className="p-3 bg-white/5 text-xs text-gray-400 leading-relaxed font-medium">
                      <span className="text-[9px] text-brand-blue font-bold block mb-1">Chunk #{index + 1}</span>
                      {c.content}
                    </div>
                  )) || <div className="p-4 text-center text-xs text-gray-600">Chunks loading...</div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[400px] border border-dashed border-card-border rounded-3xl flex flex-col justify-center items-center text-center p-6">
            <Eye className="text-gray-600" size={36} />
            <p className="text-sm font-semibold text-white mt-2">No Document Selected</p>
            <p className="text-xs text-gray-500 max-w-xs mt-1">
              Select an operational document from the pending staging queue on the left to start checking metadata.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Reject Knowledge Intake</h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reason for rejection / required changes</label>
              <textarea
                required
                rows={4}
                placeholder="Indicate incorrect calibration parameters, missing sections, or safety updates..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-xs text-white resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-xs font-bold text-white shadow transition-colors disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StagingReviews;
