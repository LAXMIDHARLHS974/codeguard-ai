import React from "react";
import {
  LayoutDashboard,
  GitFork,
  FileCode,
  ShieldAlert,
  GitPullRequest,
  CheckCircle,
  Activity,
  Settings,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export default function Sidebar({
  currentView,
  setView,
  unreadCount = 0,
  userProfile,
  onOpenProfile,
}) {
  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "repositories", label: "Repositories", icon: GitFork },
    { id: "review", label: "AI Code Review", icon: FileCode },
    { id: "findings", label: "Security Findings", icon: ShieldAlert },
    { id: "pulls", label: "Pull Requests", icon: GitPullRequest },
    { id: "tests", label: "Test Lab", icon: CheckCircle },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "support", label: "Support", icon: HelpCircle },
  ];

  const displayName = userProfile?.name || "Security Engineer";
  const displayRole = userProfile?.role || "Security Lead";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-line bg-sidebar flex flex-col justify-between p-4 z-30 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple to-pink shadow-glow font-black text-bg text-base">
            CG
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-text">CodeGuard</span>
            <span className="text-[10px] font-bold text-pink border border-purple/40 rounded px-1.5 py-0.5 bg-purple/10">
              AI
            </span>
          </div>
        </div>

        {/* Section: Platform Navigation */}
        <nav className="space-y-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2 block">
            Navigation
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-purple/20 via-pink/10 to-transparent text-white border-l-2 border-purple font-semibold shadow-[0_0_20px_rgba(199,139,203,0.15)]"
                    : "text-secondary hover:text-white hover:bg-cardHover/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-pink" : "text-secondary"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.id === "notifications" && unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile & environment bottom card */}
      <div className="pt-4 border-t border-line/70 px-2 flex items-center justify-between">
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 text-left group hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center font-bold text-xs text-bg shadow-sm">
            {initials}
          </div>
          <div className="truncate max-w-[130px]">
            <span className="text-xs font-semibold text-text block leading-tight truncate group-hover:text-pink transition-colors">
              {displayName}
            </span>
            <span className="text-[10px] text-muted block truncate">{displayRole}</span>
          </div>
        </button>
        <button
          onClick={() => setView("settings")}
          className="text-secondary hover:text-white p-1.5 rounded-lg hover:bg-cardHover transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
