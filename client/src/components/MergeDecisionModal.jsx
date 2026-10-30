import React from "react";
import { X, ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";

export default function MergeDecisionModal({ score = 0, findings = [], onClose }) {
  const numScore = Number(score) || 0;
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;

  let decision = "PASSED";
  let title = "Merge Permitted";
  let color = "text-green";
  let icon = <ShieldCheck className="w-8 h-8 text-green" />;
  let description = "This code change meets the automated security criteria. No critical or high-risk blockers were detected.";

  if (criticalCount > 0 || numScore >= 75) {
    decision = "BLOCKED";
    title = "Merge Blocked — Critical Risk";
    color = "text-red";
    icon = <ShieldAlert className="w-8 h-8 text-red" />;
    description = `Merge is strictly blocked because ${criticalCount} critical vulnerability was detected or risk score (${numScore}/100) exceeds threshold (75).`;
  } else if (highCount >= 2 || numScore >= 50) {
    decision = "REVIEW_REQUIRED";
    title = "Mandatory Peer Review Required";
    color = "text-orange";
    icon = <AlertTriangle className="w-8 h-8 text-orange" />;
    description = `Elevated risk detected (${highCount} high findings, score: ${numScore}/100). Requires documented security sign-off before merge.`;
  }

  const rules = [
    {
      label: "Zero Critical Vulnerabilities",
      met: criticalCount === 0,
      actual: `${criticalCount} critical`,
    },
    {
      label: "Risk Score Under 75/100",
      met: numScore < 75,
      actual: `${numScore}/100`,
    },
    {
      label: "High Severity Findings <= 1",
      met: highCount <= 1,
      actual: `${highCount} high`,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="glass-panel w-full max-w-lg p-6 relative border border-line shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted hover:text-text hover:bg-[#1a1f3d] transition-colors"
          aria-label="Close merge decision modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          {icon}
          <div>
            <h3 className={`text-base font-bold ${color}`}>{title}</h3>
            <span className="text-[10px] uppercase font-bold text-muted">
              Policy Evaluation Status: {decision}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed mb-5">
          {description}
        </p>

        <div className="space-y-2 mb-6">
          <span className="text-[10px] uppercase font-bold text-muted block mb-1">
            Gating Rules Verification
          </span>
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-line bg-[#0a0d20] text-xs"
            >
              <div className="flex items-center gap-2">
                {rule.met ? (
                  <CheckCircle2 className="w-4 h-4 text-green" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red" />
                )}
                <span className={rule.met ? "text-text" : "text-red font-semibold"}>
                  {rule.label}
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted">{rule.actual}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#141838] hover:bg-[#1f2552] border border-line text-text transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
