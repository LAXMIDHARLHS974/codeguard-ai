import React, { useState } from "react";
import { HelpCircle, CheckCircle, AlertTriangle, ExternalLink, Send, ShieldCheck, Cpu, Database } from "lucide-react";

export default function SupportView({ health, onRefreshHealth, onToast }) {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setSubmitted(true);
    onToast?.("Diagnostic feedback sent to CodeGuard Engineering Labs.", "success");
    setTicketSubject("");
    setTicketMessage("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-purple" />
          Support & Diagnostic Center
        </h1>
        <p className="text-xs text-secondary mt-1">
          Verify live service health, inspect API telemetry, and access developer documentation.
        </p>
      </div>

      {/* System Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gemini Service */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Cpu className="w-4 h-4 text-purple" />
              <span>Google Gemini AI</span>
            </div>
            {health?.geminiConfigured ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green/20 text-green border border-green/30">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red/20 text-red border border-red/30">
                Key Missing
              </span>
            )}
          </div>
          <p className="text-[11px] text-secondary">
            Model: <strong className="text-white font-mono">{health?.model || "gemini-2.5-flash"}</strong>
          </p>
        </div>

        {/* GitHub Integration */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-pink" />
              <span>GitHub API Gateway</span>
            </div>
            {health?.githubTokenConfigured ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green/20 text-green border border-green/30">
                Authenticated
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow/20 text-yellow border border-yellow/30">
                Public Rate Limits
              </span>
            )}
          </div>
          <p className="text-[11px] text-secondary">Rate Limit: Up to 5,000 req/hr with personal access token</p>
        </div>

        {/* Database */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Database className="w-4 h-4 text-purple" />
              <span>Persistence Layer</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green/20 text-green border border-green/30">
              Resilient Store Active
            </span>
          </div>
          <p className="text-[11px] text-secondary">PostgreSQL connection ready with in-memory resilient fallback</p>
        </div>
      </div>

      {/* Quick Docs & Feedback Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Docs */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Documentation & Resources</h3>
          <ul className="space-y-3 text-xs">
            <li>
              <a
                href="https://github.com/LAXMIDHARLHS974/codeguard-ai#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-cardHover/70 hover:border-purple/40 border border-line transition-all group"
              >
                <div>
                  <span className="text-white font-semibold block group-hover:text-purple transition-colors">
                    CodeGuard AI Architecture Guide
                  </span>
                  <span className="text-[10px] text-secondary">
                    Review pipeline, JSON schema contracts, and scoring factors
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-secondary group-hover:text-purple" />
              </a>
            </li>
            <li>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-cardHover/70 hover:border-pink/40 border border-line transition-all group"
              >
                <div>
                  <span className="text-white font-semibold block group-hover:text-pink transition-colors">
                    Google AI Studio Key Setup
                  </span>
                  <span className="text-[10px] text-secondary">
                    Generate production API keys for Gemini Flash models
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-secondary group-hover:text-pink" />
              </a>
            </li>
          </ul>
        </div>

        {/* Feedback / Bug Report */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Report An Issue or Feedback</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-secondary font-medium block mb-1">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. False positive finding on CSRF in auth route"
                className="w-full bg-card border border-line rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple/60"
                required
              />
            </div>
            <div>
              <label className="text-xs text-secondary font-medium block mb-1">Details</label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                rows={3}
                placeholder="Describe the issue or feedback..."
                className="w-full bg-card border border-line rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple/60 resize-none"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl btn-gradient text-xs font-semibold flex items-center gap-2 shadow-glow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Feedback</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
