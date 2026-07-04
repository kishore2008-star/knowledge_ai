import React from "react";
import { Link } from "react-router-dom";
import { Shield, BrainCircuit, Cpu, Database, ChevronRight, Activity } from "lucide-react";

export const Landing: React.FC = () => {
  return (
    <div className="bg-background text-foreground min-h-screen relative overflow-hidden flex flex-col justify-between">
      {/* Glow overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between border-b border-card-border/50 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center font-bold text-white shadow-lg">
            K
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            KnowForge<span className="text-brand-blue">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            to="/login?register=true"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-sm font-semibold text-white shadow-lg hover:shadow-brand-blue/20 hover:scale-[1.02] transition-all duration-150"
          >
            Create Workspace
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-20 grid lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-7 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-card-border text-xs text-brand-blue font-medium">
            <Activity size={12} className="animate-pulse" /> Industry 4.0 Cognitive Platform
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
            Enterprise Knowledge <br />
            Forged by <span className="text-gradient">Industrial AI</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-xl font-medium">
            Ingest manual operations guides, SOPs, and repair manuals. Parse schemas, transcribe audio, generate embeddings, and allow operators to query safety-verified production procedures in real-time.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark text-white font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20 hover:scale-[1.01] transition-all"
            >
              Get Started Now <ChevronRight size={18} />
            </Link>
            <a
              href="#features"
              className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold border border-card-border transition-all"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Bento grid mockup */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="p-6 glass-panel rounded-3xl space-y-3">
            <BrainCircuit className="text-brand-blue" size={32} />
            <h3 className="font-bold text-white text-lg">Hybrid RAG</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Synthesizes technical answers using cosine similarity matching of context chunks.
            </p>
          </div>
          <div className="p-6 glass-panel rounded-3xl space-y-3 mt-4">
            <Shield className="text-brand-purple" size={32} />
            <h3 className="font-bold text-white text-lg">Granular RLS</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Row Level Security blocks staging ingestion leaks to ensure strict data validation.
            </p>
          </div>
          <div className="p-6 glass-panel rounded-3xl space-y-3">
            <Cpu className="text-brand-blue-light" size={32} />
            <h3 className="font-bold text-white text-lg">Asset Mapping</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Links ingested documents to physical machines, departments, and version histories.
            </p>
          </div>
          <div className="p-6 glass-panel rounded-3xl space-y-3 mt-4">
            <Database className="text-brand-purple-light" size={32} />
            <h3 className="font-bold text-white text-lg">Vector Stores</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Powered by pgvector extension inside secure Supabase database instances.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-card-border/50 text-center text-xs text-gray-600 font-medium relative z-10">
        &copy; {new Date().getFullYear()} KnowForge AI, Inc. All rights reserved. Built for Industry 4.0 operations.
      </footer>
    </div>
  );
};
export default Landing;
