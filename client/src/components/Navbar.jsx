import React from "react";
import { Bell, RefreshCw, Settings, Sparkles, User } from "lucide-react";

export default function Navbar({
  currentView,
  health,
  onRefreshHealth,
  onOpenNotifications,
  onOpenSettings,
  onOpenAssistant,
  onOpenProfile,
  userProfile,
  unreadCount = 0,
}) {
  const isHealthy = health?.ok && health?.geminiConfigured;
  const firstName = (userProfile?.name || "Laxmidhar").split(" ")[0];

  const viewTitles = {
    overview: "Dashboard Overview",
    repositories: "Repositories",
    review: "AI Code Review",
    findings: "Security Findings",
    pulls: "Pull Requests",
    tests: "Test Lab",
    activity: "Activity & Audit Log",
    settings: "Settings",
    support: "Support & Diagnostics",
    notifications: "Notifications",
  };

  return (
    <header className="h-16 sticky top-0 z-20 flex items-center justify-between px-6 md:px-8 border-b border-line bg-sidebar/85 backdrop-blur-xl">
      {/* Left: Breadcrumbs & Welcome message */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-secondary">
            <span>CodeGuard AI</span>
            <span>/</span>
            <span className="text-white font-medium">
              {viewTitles[currentView] || "Platform"}
            </span>
          </div>
          <p className="text-xs text-secondary mt-0.5 hidden sm:block">
            Welcome back, <strong className="text-white font-semibold">{firstName}</strong>
          </p>
        </div>
      </div>

      {/* Right Actions: AI Assistant, Health, Notifs, Settings, Profile */}
      <div className="flex items-center gap-3">
        {/* Global CodeGuard AI Assistant Button */}
        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl btn-gradient text-xs font-semibold shadow-glow hover:opacity-95 transition-all cursor-pointer"
          title="Open interactive CodeGuard AI Security Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-bg" />
          <span className="hidden md:inline">AI Assistant</span>
        </button>

        {/* Backend Health Badge */}
        <div
          onClick={onRefreshHealth}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-line bg-card text-[11px] text-secondary hover:border-purple/40 cursor-pointer transition-all"
          title="Click to refresh backend health probe"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? "bg-green shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-red"
            }`}
          />
          <span>{isHealthy ? "AI Shield Active" : "Backend Offline"}</span>
          <RefreshCw className="w-3 h-3 text-secondary/60 hover:text-white transition-transform active:rotate-180" />
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-xl border border-line bg-card hover:bg-cardHover text-secondary hover:text-white transition-colors relative"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink text-bg text-[9px] font-extrabold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Settings Icon Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl border border-line bg-card hover:bg-cardHover text-secondary hover:text-white transition-colors"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar Pill */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-line bg-card hover:border-purple/40 transition-all text-left"
          title="Open User Profile & Account Settings"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-[10px] font-bold text-bg">
            {firstName[0]}
          </div>
          <span className="text-xs font-semibold text-white hidden sm:inline">
            {firstName}
          </span>
        </button>
      </div>
    </header>
  );
}
