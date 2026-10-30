import React, { useState } from "react";
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
  Bell,
  RefreshCw,
  Menu,
  X,
  User,
} from "lucide-react";

export default function TopBar({
  currentView,
  setView,
  health,
  onRefreshHealth,
  onOpenNotifications,
  onOpenSettings,
  onOpenAssistant,
  onOpenProfile,
  userProfile,
  unreadCount = 0,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHealthy = health?.ok && health?.geminiConfigured;
  const firstName = (userProfile?.name || "Laxmidhar").split(" ")[0];

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "repositories", label: "Repositories", icon: GitFork },
    { id: "review", label: "AI Review", icon: FileCode },
    { id: "findings", label: "Findings", icon: ShieldAlert },
    { id: "pulls", label: "Pull Requests", icon: GitPullRequest },
    { id: "tests", label: "Test Lab", icon: CheckCircle },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "support", label: "Support", icon: HelpCircle },
  ];

  const handleNavClick = (id) => {
    setView(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-sidebar/95 backdrop-blur-2xl border-b border-line shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Left: Brand Logo & Title */}
          <div
            onClick={() => handleNavClick("overview")}
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple to-pink shadow-glow font-black text-bg text-sm group-hover:scale-105 transition-transform">
              CG
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-pink transition-colors">
                CodeGuard
              </span>
              <span className="text-[9px] font-bold text-pink border border-purple/40 rounded px-1.5 py-0.5 bg-purple/10">
                AI
              </span>
            </div>
          </div>

          {/* Center: Desktop Navigation Bar */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-purple/20 via-pink/15 to-purple/10 text-white border border-purple/40 shadow-[0_0_15px_rgba(199,139,203,0.2)] font-semibold"
                      : "text-secondary hover:text-white hover:bg-cardHover/70"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? "text-pink" : "text-secondary"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Actions, AI Assistant, Notifications, Profile, Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Global AI Assistant Trigger */}
            <button
              onClick={onOpenAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-gradient text-xs font-semibold shadow-glow hover:opacity-95 transition-all cursor-pointer"
              title="Open CodeGuard AI Defensive Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-bg" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* Health probe status */}
            <div
              onClick={onRefreshHealth}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line bg-card text-[11px] text-secondary hover:border-purple/40 cursor-pointer transition-all"
              title="Click to refresh backend health probe"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? "bg-green shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-red"
                }`}
              />
              <span>{isHealthy ? "Active" : "Offline"}</span>
              <RefreshCw className="w-3 h-3 text-secondary/60 hover:text-white transition-transform active:rotate-180" />
            </div>

            {/* Notifications Button */}
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

            {/* Settings Gear */}
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex p-2 rounded-xl border border-line bg-card hover:bg-cardHover text-secondary hover:text-white transition-colors"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Avatar Pill */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-xl border border-line bg-card hover:border-purple/40 transition-all text-left group"
              title="User Profile & Settings"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center text-[10px] font-bold text-bg shadow-sm">
                {firstName[0]}
              </div>
              <span className="text-xs font-semibold text-white hidden md:inline group-hover:text-pink transition-colors">
                {firstName}
              </span>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl border border-line bg-card hover:bg-cardHover text-secondary hover:text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Secondary Sub-Navbar for medium screens (between md and xl) */}
        <div className="hidden md:flex xl:hidden items-center justify-start gap-1 py-2 border-t border-line/60 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-purple/20 text-white border border-purple/40 font-semibold shadow-sm"
                    : "text-secondary hover:text-white hover:bg-cardHover/60"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${isActive ? "text-pink" : "text-secondary"}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown Menu (below md) */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-line space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-purple/20 text-white border border-purple/40 font-semibold"
                        : "text-secondary hover:text-white hover:bg-cardHover/70"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${isActive ? "text-pink" : "text-secondary"}`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-secondary px-2">
              <span className="text-[11px]">Logged in as <strong className="text-white">{firstName}</strong></span>
              <button
                onClick={() => {
                  onOpenProfile();
                  setMobileMenuOpen(false);
                }}
                className="text-purple hover:text-pink font-semibold text-[11px]"
              >
                Manage Profile →
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
