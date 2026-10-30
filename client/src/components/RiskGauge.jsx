import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Shield } from "lucide-react";

export default function RiskGauge({ score = 0, level = "LOW", breakdown = null, onCheckMerge }) {
  const numScore = Math.max(0, Math.min(100, Number(score) || 0));

  let color = "#34d399"; // green
  let textColor = "text-green";
  let icon = <ShieldCheck className="w-5 h-5 text-green" />;
  let postureBadge = "bg-green/15 text-green border-green/30";

  if (numScore >= 75 || level === "CRITICAL") {
    color = "#fb7185"; // red
    textColor = "text-red";
    icon = <ShieldAlert className="w-5 h-5 text-red" />;
    postureBadge = "bg-red/15 text-red border-red/30";
  } else if (numScore >= 50 || level === "HIGH") {
    color = "#fb923c"; // orange
    textColor = "text-orange";
    icon = <AlertTriangle className="w-5 h-5 text-orange" />;
    postureBadge = "bg-orange/15 text-orange border-orange/30";
  } else if (numScore >= 25 || level === "MEDIUM") {
    color = "#facc15"; // yellow
    textColor = "text-yellow";
    icon = <Shield className="w-5 h-5 text-yellow" />;
    postureBadge = "bg-yellow/15 text-yellow border-yellow/30";
  }

  // Circular gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numScore / 100) * circumference;

  return (
    <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Circle Gauge */}
      <div className="relative flex items-center justify-center">
        <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="#1b203d"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${textColor}`}>
            {numScore}
          </span>
          <span className="text-[10px] uppercase font-bold text-muted">/ 100</span>
        </div>
      </div>

      {/* Narrative & Details */}
      <div className="flex-1 space-y-2 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2">
          {icon}
          <h3 className="text-base font-bold text-text">
            Risk Classification: <span className={textColor}>{level}</span>
          </h3>
          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${postureBadge}`}>
            {level === "CRITICAL" ? "Blocked" : level === "HIGH" ? "Review" : "Passing"}
          </span>
        </div>

        {breakdown?.explanation && (
          <p className="text-xs text-muted leading-relaxed max-w-xl">
            {breakdown.explanation}
          </p>
        )}

        {breakdown?.primaryDrivers?.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] font-semibold text-muted block mb-1">Primary Risk Drivers:</span>
            <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
              {breakdown.primaryDrivers.map((driver, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#181d3d] border border-line text-violet-light font-mono"
                >
                  {driver}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      {onCheckMerge && (
        <div className="flex-shrink-0">
          <button
            onClick={onCheckMerge}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#141838] hover:bg-[#1d2350] border border-line hover:border-violet transition-all text-text shadow-lg"
          >
            Check Merge Policy →
          </button>
        </div>
      )}
    </div>
  );
}
