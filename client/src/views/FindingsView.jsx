import React, { useState } from "react";
import FindingCard from "../components/FindingCard";
import { Search, Filter, ShieldCheck, ArrowRight, CheckCircle } from "lucide-react";

export default function FindingsView({ analysis, onNavigateToTests }) {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const findings = analysis?.findings || [];

  const filtered = findings.filter((f) => {
    const matchesSev = severityFilter === "all" || f.severity === severityFilter;
    const matchesCat = categoryFilter === "all" || (f.category || "quality") === categoryFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesCat && matchesQuery;
  });

  const counts = {
    all: findings.length,
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text">Security & Code Findings</h2>
          {analysis && (
            <p className="text-xs text-muted mt-0.5">
              {analysis.title || analysis.pr?.title || "Latest Review"} ({findings.length} findings)
            </p>
          )}
        </div>

        {findings.length > 0 && onNavigateToTests && (
          <button
            onClick={onNavigateToTests}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-violet hover:bg-violet-dark text-white transition-all shadow-md self-start md:self-auto"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Generate Tests from Findings →</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Severity Pills */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {["all", "critical", "high", "medium", "low"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all flex items-center gap-1.5 ${
                  severityFilter === sev
                    ? "bg-[#252b57] text-white border border-violet/50"
                    : "text-muted hover:text-text hover:bg-white/5 border border-transparent"
                }`}
              >
                <span>{sev}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#121630]">
                  {counts[sev]}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings, files, or keywords..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-line bg-[#090b1c] text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-violet"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-line/50 text-xs">
          <span className="text-[10px] uppercase font-bold text-muted flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {["all", "security", "bugs", "quality", "testing"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs capitalize px-2 py-0.5 rounded transition-colors ${
                categoryFilter === cat ? "text-cyan font-bold underline" : "text-muted hover:text-text"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {findings.length === 0 ? (
          <div className="glass-panel p-12 text-center text-xs text-muted">
            No analysis data available
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-muted">
            No findings match current filter
          </div>
        ) : (
          filtered.map((finding) => <FindingCard key={finding.id} finding={finding} />)
        )}
      </div>
    </div>
  );
}
