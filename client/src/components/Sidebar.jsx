import React from "react";
import {
  Home,
  FileCode,
  ShieldAlert,
  Flame,
  CheckCircle,
  History,
  GitFork,
  Bell,
  Settings,
} from "lucide-react";

export default function Sidebar({ currentView, setView, unreadCount = 0 }) {
  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "review", label: "AI Review Studio", icon: FileCode },
    { id: "findings", label: "Security Findings", icon: ShieldAlert },
    { id: "risk", label: "Risk Intelligence", icon: Flame },
    { id: "tests", label: "AI Test Lab", icon: CheckCircle },
    { id: "history", label: "Analysis History", icon: History },
    { id: "repositories", label: "Repositories", icon: GitFork },
    { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-line bg-[#080918]/90 backdrop-blur-2xl flex flex-col justify-between p-4 z-30 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet to-cyan shadow-[0_0_25px_rgba(139,92,246,0.4)] font-black text-white text-base">
            CG
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-white">CodeGuard</span>
            <span className="text-[9px] font-bold text-violet-light border border-violet/50 rounded px-1.5 py-0.5 bg-violet/10">
              AI
            </span>
          </div>
        </div>

        {/* Section: Platform Workspace */}
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-[#5c6185] uppercase tracking-wider px-3 mb-2 block">
            Workspace
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet/20 to-transparent text-white border-l-2 border-violet shadow-sm"
                    : "text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-violet-light" : "text-muted"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User profile & environment bottom tag */}
      <div className="pt-4 border-t border-line/70 px-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-violet flex items-center justify-center font-bold text-xs text-white">
            SE
          </div>
          <div>
            <span className="text-xs font-bold text-text block leading-tight">Security Eng</span>
            <span className="text-[9px] text-muted block">Enterprise Reviewer</span>
          </div>
        </div>
        <button
          onClick={() => setView("settings")}
          className="text-muted hover:text-white p-1.5 rounded-lg transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
