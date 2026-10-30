import React from "react";
import { Bell, RefreshCw, Settings, ShieldCheck, AlertCircle } from "lucide-react";

export default function Navbar({ currentView, health, onRefreshHealth, onOpenNotifications, onOpenSettings }) {
  const isHealthy = health?.ok && health?.geminiConfigured;

  const viewTitles = {
    overview: "Platform Overview",
    review: "AI Review Studio",
    findings: "Security Findings & Intelligence",
    risk: "Risk Intelligence & Blast Radius",
    tests: "AI Test Lab",
    history: "Analysis History",
    repositories: "Connected Repositories",
    notifications: "System Notifications",
    settings: "Settings & API Configuration",
  };

  return (
    <header className="h-16 sticky top-0 z-20 flex items-center justify-between px-8 border-b border-line bg-[#080918]/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>CodeGuard</span>
        <span>/</span>
        <strong className="text-text font-bold capitalize">
          {viewTitles[currentView] || currentView}
        </strong>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend Health Badge */}
        <div
          onClick={onRefreshHealth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-line bg-[#10132a] text-[11px] text-muted hover:border-violet/40 cursor-pointer transition-all"
          title="Click to refresh backend health probe"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? "bg-green shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-red"
            }`}
          />
          <span>
            {isHealthy
              ? health?.githubTokenConfigured
                ? "Backend + GitHub Online"
                : "Backend Online"
              : "Backend Offline"}
          </span>
          <RefreshCw className="w-3 h-3 text-muted/60 hover:text-text transition-transform active:rotate-180" />
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-xl border border-line bg-panel hover:bg-[#1a1f3d] text-muted hover:text-text transition-colors relative"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Settings Icon Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl border border-line bg-panel hover:bg-[#1a1f3d] text-muted hover:text-text transition-colors"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
