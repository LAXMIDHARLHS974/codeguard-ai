import React from "react";
import RiskGauge from "../components/RiskGauge";
import { ShieldCheck, AlertCircle, Scale, ShieldAlert, Cpu } from "lucide-react";

export default function RiskIntelligenceView({ analysis, onCheckMerge }) {
  const score = analysis?.riskScore ?? 0;
  const level = analysis?.riskLevel ?? "LOW";
  const breakdown = analysis?.riskBreakdown;
  const counts = breakdown?.findingCounts || { critical: 0, high: 0, medium: 0, low: 0 };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-text">Risk Intelligence</h2>
      </div>

      {/* Main Gauge */}
      <RiskGauge
        score={score}
        level={level}
        breakdown={breakdown}
        onCheckMerge={onCheckMerge}
      />

      {/* Breakdown Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 space-y-2">
          <div className="flex items-center gap-2 text-violet-light">
            <Scale className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Severity Weighting</h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Base severity score: <strong className="text-text">{breakdown?.severityScore ?? 0} pts</strong>.
            Critical vulnerabilities (35 pts) and High findings (20 pts) carry primary weight.
          </p>
          <div className="text-[10px] text-muted/80 font-mono pt-1">
            {counts.critical} critical · {counts.high} high · {counts.medium} medium · {counts.low} low
          </div>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="flex items-center gap-2 text-cyan">
            <ShieldAlert className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Exploitability Factor</h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Multiplier: <strong className="text-text">{breakdown?.exploitabilityFactor ?? 1.0}x</strong>.
            Authentication bypass, SQL injection, and secrets leakage trigger higher exploitability scaling than stylistic issues.
          </p>
        </div>

        <div className="glass-panel p-5 space-y-2">
          <div className="flex items-center gap-2 text-orange">
            <Cpu className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Churn Blast Radius</h4>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Penalty: <strong className="text-text">+{breakdown?.churnPenalty ?? 0} pts</strong>.
            Large PRs with high lines added/removed expand the testing blast radius and risk of regression.
          </p>
        </div>
      </div>

      {/* Methodology & Policy Explanation */}
      <div className="glass-panel p-6 space-y-3">
        <h4 className="text-sm font-bold text-text">Scoring Methodology</h4>
        <div className="text-xs text-muted space-y-2 leading-relaxed">
          <p>
            CodeGuard AI does not use a simplistic linear sum. The intelligence engine applies diminishing returns to duplicate findings of the same category, factors in model confidence (0.10 to 1.00), and classifies scores into 4 operational tiers:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#c0c5de]">
            <li><strong className="text-red">Critical (75-100 pts):</strong> Blocked from merge. Automated merge gate prevents deployment without remediation.</li>
            <li><strong className="text-orange">High (50-74 pts):</strong> Mandatory peer review required. High-severity issues present.</li>
            <li><strong className="text-yellow">Medium (25-49 pts):</strong> Review recommended. Correctness or code maintainability issues identified.</li>
            <li><strong className="text-green">Low (0-24 pts):</strong> Passing score. Minor or zero defects detected.</li>
          </ul>
        </div>

        {/* Mandatory Disclaimer */}
        <div className="p-3 rounded-xl border border-line bg-[#090c1f] text-[11px] text-muted italic">
          <strong>Note:</strong> {breakdown?.disclaimer || "The risk score reflects automated static heuristic analysis and does not guarantee complete application security."}
        </div>
      </div>
    </div>
  );
}
