import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import {
  Send,
  Wrench,
  AlertTriangle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Star,
  FileText,
  BookOpen
} from "lucide-react";

export const AIChat: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Feedback Modal states
  const [feedbackMsgId, setFeedbackMsgId] = useState<string | null>(null);
  const [feedbackDocId, setFeedbackDocId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [helpful, setHelpful] = useState(true);
  const [comment, setComment] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/chat/sessions");
      setSessions(res.data.sessions);
      if (res.data.sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(res.data.sessions[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (sid: string) => {
    try {
      const res = await api.get(`/chat/sessions/${sid}/messages`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query;
    setQuery("");
    setLoading(true);

    // Optimistically inject user's message
    setMessages((prev) => [...prev, { id: "temp-usr", sender: "USER", message: userMsg }]);

    try {
      const res = await api.post("/chat/ask", {
        query: userMsg,
        sessionId: activeSessionId,
      });

      // Update active session and refresh list
      if (!activeSessionId) {
        setActiveSessionId(res.data.sessionId);
        fetchSessions();
      } else {
        fetchMessages(activeSessionId);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { id: "temp-err", sender: "AI", message: "Failed to connect to AI pipeline. Please retry." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openFeedback = (msg: any) => {
    if (msg.metadata && msg.metadata.sources && msg.metadata.sources.length > 0) {
      setFeedbackMsgId(msg.id);
      setFeedbackDocId(msg.metadata.sources[0].documentId); // default link to first source
      setRating(5);
      setHelpful(true);
      setComment("");
      setFeedbackSuccess(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackDocId) return;
    try {
      await api.post("/feedback", {
        rating,
        isHelpful: helpful,
        comment,
        documentId: feedbackDocId,
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackMsgId(null);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-6 select-none relative">
      {/* Sessions Sidebar */}
      <div className="w-64 glass-panel rounded-2xl p-4 flex flex-col justify-between hidden md:flex">
        <div className="space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">Conversations</h3>
          <button
            onClick={() => {
              setActiveSessionId(null);
              setMessages([]);
            }}
            className="w-full py-2.5 rounded-xl border border-dashed border-card-border hover:border-brand-blue text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            + New Chat Session
          </button>

          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs truncate transition-colors ${
                  activeSessionId === s.id
                    ? "bg-white/5 border border-card-border font-semibold text-brand-blue"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Frame */}
      <div className="flex-1 glass-panel rounded-2xl p-4 flex flex-col justify-between">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-2 p-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <h3 className="font-bold text-white text-base">Industrial Knowledge Lookup</h3>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Enter queries like "How to calibrate pneumatic pressure limit?" or "Verify safety steps for valve replacement".
              </p>
            </div>
          )}

          {messages.map((m) => {
            const isAI = m.sender === "AI";
            const meta = m.metadata;

            return (
              <div key={m.id} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                  isAI
                    ? "bg-white/5 border border-card-border/70 text-gray-300"
                    : "bg-brand-blue text-white shadow-lg shadow-brand-blue/15"
                }`}>
                  <p className="font-medium whitespace-pre-line">{m.message}</p>

                  {/* Structured RAG Response Metadata details */}
                  {isAI && meta && (
                    <div className="mt-4 pt-4 border-t border-card-border/50 space-y-4 text-xs">
                      {/* Cause */}
                      {meta.cause && (
                        <div>
                          <span className="font-bold text-white block">Potential Cause</span>
                          <p className="text-gray-400 mt-0.5">{meta.cause}</p>
                        </div>
                      )}

                      {/* Repair steps */}
                      {meta.repairSteps && meta.repairSteps.length > 0 && (
                        <div>
                          <span className="font-bold text-white flex items-center gap-1">
                            <Wrench size={13} className="text-brand-blue" /> Recommended Action Steps
                          </span>
                          <ol className="list-decimal pl-4 mt-1 text-gray-400 space-y-1 font-medium">
                            {meta.repairSteps.map((step: string, i: number) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Safety warnings */}
                      {meta.safetyPrecautions && meta.safetyPrecautions.length > 0 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl space-y-1">
                          <span className="font-bold flex items-center gap-1">
                            <AlertTriangle size={13} /> Mandatory Safety Precautions
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 text-amber-200">
                            {meta.safetyPrecautions.map((prec: string, i: number) => (
                              <li key={i}>{prec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tools & Duration */}
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500">
                        {meta.requiredTools && meta.requiredTools.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">Tools:</span>
                            {meta.requiredTools.map((t: string, idx: number) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-white/5 border border-card-border text-gray-400">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {meta.estimatedTime && (
                          <div className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>Duration: {meta.estimatedTime}</span>
                          </div>
                        )}
                      </div>

                      {/* Citations */}
                      {meta.sources && meta.sources.length > 0 && (
                        <div className="pt-2 border-t border-card-border/30">
                          <span className="font-bold text-white block mb-1">Source Manuals</span>
                          <div className="space-y-1">
                            {meta.sources.map((src: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[10px] text-brand-blue">
                                <FileText size={11} />
                                <span className="font-medium underline">{src.title}</span>
                                <span className="text-gray-600">({Math.round(src.similarity * 100)}% match)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-card-border/30">
                        <span className="text-[10px] text-gray-500">How helpful is this information?</span>
                        <button
                          onClick={() => openFeedback(m)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-card-border hover:bg-brand-blue/10 hover:text-brand-blue text-[10px] font-bold transition-colors"
                        >
                          Submit Rating
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="glass-panel p-4 rounded-2xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Query Input */}
        <form onSubmit={handleAsk} className="flex gap-3">
          <input
            type="text"
            required
            disabled={loading}
            placeholder="Query operational manual databases..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-card-border focus:border-brand-blue focus:outline-none text-white text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-12 h-12 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white flex items-center justify-center shadow-lg shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Star Rating Modal overlay */}
      {feedbackMsgId && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Rate AI Helpfulness</h3>

            {feedbackSuccess ? (
              <div className="py-6 text-center text-xs text-emerald-400 font-semibold uppercase tracking-wider animate-pulse">
                Feedback Recorded!
              </div>
            ) : (
              <>
                {/* Star rating selection */}
                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${
                        star <= rating ? "text-amber-400" : "text-gray-600"
                      }`}
                    >
                      <Star fill={star <= rating ? "#fbbf24" : "none"} size={28} />
                    </button>
                  ))}
                </div>

                {/* Helpful toggle */}
                <div className="flex items-center justify-around bg-white/5 p-1.5 rounded-xl border border-card-border">
                  <button
                    type="button"
                    onClick={() => setHelpful(true)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                      helpful ? "bg-brand-blue text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <ThumbsUp size={13} /> Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => setHelpful(false)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                      !helpful ? "bg-red-500/80 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <ThumbsDown size={13} /> Unhelpful
                  </button>
                </div>

                {/* Comment area */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Comment details</label>
                  <textarea
                    rows={3}
                    placeholder="Provide troubleshooting notes or corrections..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-card-border text-xs focus:border-brand-blue focus:outline-none text-white resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setFeedbackMsgId(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFeedback}
                    className="flex-1 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-xs font-bold text-white shadow transition-colors"
                  >
                    Submit Details
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AIChat;
