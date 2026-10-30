import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, ShieldAlert, Bug, Sparkles, Check } from "lucide-react";

export default function FindingCard({ finding }) {
  const [isOpen, setIsOpen] = useState(false);

  const severityStyles = {
    critical: "bg-red/15 text-red border-red/30",
    high: "bg-orange/15 text-orange border-orange/30",
    medium: "bg-yellow/15 text-yellow border-yellow/30",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };

  const borderLeftColors = {
    critical: "border-l-red",
    high: "border-l-orange",
    medium: "border-l-yellow",
    low: "border-l-blue-400",
  };

  const categoryIcons = {
    security: <ShieldAlert className="w-3.5 h-3.5 text-red" />,
    bugs: <Bug className="w-3.5 h-3.5 text-orange" />,
    quality: <Sparkles className="w-3.5 h-3.5 text-yellow" />,
    testing: <Check className="w-3.5 h-3.5 text-blue-400" />,
  };

  const confidencePct = Math.round((Number(finding.confidence) || 0.9) * 100);

  return (
    <article
      className={`rounded-xl border border-line bg-[#0d1024]/90 backdrop-blur-sm overflow-hidden border-l-4 ${
        borderLeftColors[finding.severity] || "border-l-blue-400"
      } transition-all duration-150 hover:border-violet/40`}
    >
      {/* Header Row */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${
                severityStyles[finding.severity] || severityStyles.medium
              }`}
            >
              {finding.severity}
            </span>

            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#171b38] border border-line text-muted">
              {categoryIcons[finding.category] || null}
              <span className="capitalize">{finding.category || "quality"}</span>
            </span>

            <span className="text-[10px] text-muted font-mono">
              Confidence: <strong className="text-text">{confidencePct}%</strong>
            </span>
          </div>

          <h4 className="text-xs font-bold text-text truncate mb-0.5">
            {finding.title}
          </h4>

          <div className="text-[10px] font-mono text-muted/80 flex items-center gap-2">
            <span>{finding.file}</span>
            <span>:</span>
            <span className="text-violet-light font-bold">L{finding.line || 1}</span>
          </div>
        </div>

        <button
          className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-[#1a1f3d] transition-colors"
          aria-label={isOpen ? "Collapse finding details" : "Expand finding details"}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Details */}
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-line/60 space-y-3 bg-[#080a18]/60 text-xs text-muted">
          <div>
            <span className="text-[10px] uppercase font-bold text-violet-light block mb-1">
              Defect Description
            </span>
            <p className="leading-relaxed text-[#c3c8e2]">{finding.description}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-orange block mb-1">
              Security & Operational Impact
            </span>
            <p className="leading-relaxed text-[#c3c8e2]">{finding.why}</p>
          </div>

          {finding.recommendation && (
            <div>
              <span className="text-[10px] uppercase font-bold text-green block mb-1">
                Remediation Guidance
              </span>
              <p className="leading-relaxed text-[#c3c8e2]">{finding.recommendation}</p>
            </div>
          )}

          {/* Evidence Code Snippet */}
          {(finding.evidence || (finding.badCode && finding.badCode.length > 0)) && (
            <div>
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">
                Code Context
              </span>
              <div className="rounded-lg border border-line bg-[#05060f] p-3 font-mono text-[11px] leading-relaxed overflow-x-auto space-y-1">
                {finding.evidence && (
                  <div className="text-red/90 whitespace-pre">
                    <span className="text-muted mr-2 select-none">-</span>
                    {finding.evidence}
                  </div>
                )}
                {Array.isArray(finding.badCode) &&
                  finding.badCode.map((line, idx) => (
                    <div key={idx} className="text-red/90 whitespace-pre">
                      <span className="text-muted mr-2 select-none">-</span>
                      {line.t}
                    </div>
                  ))}
                {Array.isArray(finding.fixCode) &&
                  finding.fixCode.map((line, idx) => (
                    <div key={idx} className="text-green/90 whitespace-pre">
                      <span className="text-muted mr-2 select-none">+</span>
                      {line.t}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
