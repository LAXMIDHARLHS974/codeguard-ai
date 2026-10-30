import React from "react";

export default function StatCard({ label, value, subtext, highlight = false, color = "text-text" }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#11152b] to-[#0d1020] p-4 transition-all hover:border-[#424879]">
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-violet/10 blur-xl pointer-events-none" />
      <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">
        {label}
      </span>
      <strong className={`text-2xl font-black tracking-tight block ${color}`}>
        {value ?? "—"}
      </strong>
      {subtext && (
        <span className="text-[10px] text-muted/80 block mt-1">
          {subtext}
        </span>
      )}
    </div>
  );
}
