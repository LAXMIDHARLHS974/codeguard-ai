import React from "react";
import StatCard from "../components/StatCard";
import RiskGauge from "../components/RiskGauge";
import { ArrowRight, ShieldCheck, Zap, History, GitPullRequest } from "lucide-react";

export default function OverviewView({
  analysis,
  history = [],
  onNavigate,
  onCheckMerge,
}) {
  const findings = analysis?.findings || [];
  const score = analysis?.riskScore ?? 0;
  const level = analysis?.riskLevel ?? "LOW";
  const stats = analysis?.stats || {};

  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-text">
            Ship faster. <br />
            <span className="bg-gradient-to-r from-white via-violet-light to-cyan bg-clip-text text-transparent">
              Break less.
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate("review")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet to-indigo-600 hover:from-violet-dark hover:to-indigo-700 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
          >
            <span>Start Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate("history")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#141838] hover:bg-[#1c2250] border border-line text-text transition-all"
          >
            <History className="w-3.5 h-3.5 text-muted" />
            <span>Audit History</span>
          </button>
        </div>
      </section>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Security Posture"
          value={analysis ? level : "AWAITING"}
          subtext={analysis ? `Risk score: ${score}/100` : undefined}
          color={score >= 75 ? "text-red" : score >= 50 ? "text-orange" : "text-green"}
        />
        <StatCard
          label="Issues Detected"
          value={analysis ? findings.length : "—"}
          subtext={analysis ? `${criticalCount} critical · ${highCount} high` : undefined}
          color={criticalCount > 0 ? "text-red" : "text-text"}
        />
        <StatCard
          label="Files Changed"
          value={stats.filesChanged ?? "—"}
          subtext={analysis ? `+${stats.linesAdded ?? 0} / -${stats.linesRemoved ?? 0} lines` : undefined}
        />
        <StatCard
          label="Review Engine"
          value="Gemini AI"
          color="text-violet-light"
        />
      </section>

      {/* Active Risk Gauge */}
      <section>
        <RiskGauge
          score={score}
          level={level}
          breakdown={analysis?.riskBreakdown}
          onCheckMerge={analysis ? onCheckMerge : null}
        />
      </section>

      {/* Recent Reviews Summary */}
      <section className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text">Recent Review Activity</h3>
          </div>
          <button
            onClick={() => onNavigate("history")}
            className="text-xs text-violet-light hover:text-white font-semibold transition-colors"
          >
            View all ({history.length}) →
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-line/60 rounded-xl text-xs text-muted/60">
            No previous records
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate("history")}
                className="flex items-center justify-between p-3 rounded-xl border border-line/60 bg-[#0c0f24] hover:border-violet/40 cursor-pointer transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <GitPullRequest className="w-4 h-4 text-violet-light flex-shrink-0" />
                  <div>
                    <span className="font-bold text-text block truncate max-w-sm md:max-w-md">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(item.createdAt).toLocaleDateString()} · {item.source}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      item.riskScore >= 75
                        ? "bg-red/15 text-red border-red/30"
                        : item.riskScore >= 50
                        ? "bg-orange/15 text-orange border-orange/30"
                        : "bg-green/15 text-green border-green/30"
                    }`}
                  >
                    Risk: {item.riskScore}/100
                  </span>
                  <span className="text-[10px] text-muted font-mono">
                    {item.findingCount} finding{item.findingCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
