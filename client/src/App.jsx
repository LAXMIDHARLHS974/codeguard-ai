import React, { useState, useEffect } from "react";
import TopBar from "./components/TopBar";
import Toast from "./components/Toast";
import MergeDecisionModal from "./components/MergeDecisionModal";
import AIAssistantDrawer from "./components/AIAssistantDrawer";

import OverviewView from "./views/OverviewView";
import ReviewStudioView from "./views/ReviewStudioView";
import FindingsView from "./views/FindingsView";
import RiskIntelligenceView from "./views/RiskIntelligenceView";
import TestLabView from "./views/TestLabView";
import HistoryView from "./views/HistoryView";
import RepositoriesView from "./views/RepositoriesView";
import PullRequestsView from "./views/PullRequestsView";
import ActivityView from "./views/ActivityView";
import SupportView from "./views/SupportView";
import NotificationsView from "./views/NotificationsView";
import SettingsView from "./views/SettingsView";
import ProfileModal from "./components/ProfileModal";

import { api } from "./services/api";

export default function App() {
  const [currentView, setCurrentView] = useState("overview");
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [health, setHealth] = useState(null);
  const [toast, setToast] = useState(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAssistantDrawer, setShowAssistantDrawer] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const showError = (message) => {
    setToast({ message, type: "error" });
  };

  const loadHealth = async () => {
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch {
      setHealth({ ok: false });
    }
  };

  const loadUserData = async () => {
    try {
      const [histRes, notifRes, profileRes] = await Promise.all([
        api.listHistory(10, 0).catch(() => ({ history: [] })),
        api.listNotifications().catch(() => ({ notifications: [] })),
        api.getUserProfile().catch(() => null),
      ]);
      setHistoryList(histRes.history || []);
      const unread = (notifRes.notifications || []).filter((n) => !n.isRead).length;
      setUnreadCount(unread);
      if (profileRes) setUserProfile(profileRes);
    } catch (err) {
      console.warn("Failed to load initial user data:", err);
    }
  };

  useEffect(() => {
    loadHealth();
    loadUserData();
  }, []);

  const handleAnalysisCompleted = (result) => {
    setActiveAnalysis(result);
    showToast("Code review and risk calculation completed successfully.", "success");
    loadUserData();
    setCurrentView("findings");
  };

  const handleSelectHistoryItem = (item) => {
    setActiveAnalysis(item);
    setCurrentView("findings");
  };

  const handleSelectRepoForReview = (repo) => {
    setCurrentView("review");
    showToast(`Ready to review Pull Requests for ${repo.owner}/${repo.name}`, "info");
  };

  const handleSelectPrForReview = (prUrl) => {
    setCurrentView("review");
    showToast(`Loaded ${prUrl} for AI analysis`, "info");
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      {/* Top Bar Navigation */}
      <TopBar
        currentView={currentView}
        setView={setCurrentView}
        health={health}
        onRefreshHealth={loadHealth}
        onOpenNotifications={() => setCurrentView("notifications")}
        onOpenSettings={() => setCurrentView("settings")}
        onOpenAssistant={() => setShowAssistantDrawer(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        userProfile={userProfile}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === "overview" && (
            <OverviewView
              analysis={activeAnalysis}
              history={historyList}
              onNavigate={setCurrentView}
              onCheckMerge={() => setShowMergeModal(true)}
            />
          )}

          {currentView === "review" && (
            <ReviewStudioView
              onAnalysisCompleted={handleAnalysisCompleted}
              onError={showError}
            />
          )}

          {currentView === "findings" && (
            <FindingsView
              analysis={activeAnalysis}
              onNavigateToTests={() => setCurrentView("tests")}
            />
          )}

          {currentView === "risk" && (
            <RiskIntelligenceView
              analysis={activeAnalysis}
              onCheckMerge={() => setShowMergeModal(true)}
            />
          )}

          {currentView === "pulls" && (
            <PullRequestsView
              onSelectPrForReview={handleSelectPrForReview}
              onToast={showToast}
              onError={showError}
            />
          )}

          {currentView === "tests" && (
            <TestLabView
              analysis={activeAnalysis}
              onToast={showToast}
              onError={showError}
            />
          )}

          {currentView === "activity" && (
            <ActivityView
              onSelectAnalysis={handleSelectHistoryItem}
              onToast={showToast}
              onError={showError}
            />
          )}

          {currentView === "history" && (
            <HistoryView
              onSelectAnalysis={handleSelectHistoryItem}
              onToast={showToast}
              onError={showError}
            />
          )}

          {currentView === "repositories" && (
            <RepositoriesView
              onSelectRepoForReview={handleSelectRepoForReview}
              onToast={showToast}
              onError={showError}
            />
          )}

          {currentView === "support" && (
            <SupportView
              health={health}
              onRefreshHealth={loadHealth}
              onToast={showToast}
            />
          )}

          {currentView === "notifications" && (
            <NotificationsView
              onToast={showToast}
              onError={showError}
            />
          )}

          {currentView === "settings" && (
            <SettingsView
              onToast={showToast}
              onError={showError}
            />
          )}
        </main>

      {/* Global Interactive AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={showAssistantDrawer}
        onClose={() => setShowAssistantDrawer(false)}
        activeAnalysis={activeAnalysis}
      />

      {/* User Profile & Account Settings Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onToast={showToast}
        onError={showError}
        onProfileUpdated={(up) => setUserProfile(up)}
      />

      {/* Merge Decision Modal */}
      {showMergeModal && (
        <MergeDecisionModal
          score={activeAnalysis?.riskScore ?? 0}
          findings={activeAnalysis?.findings ?? []}
          onClose={() => setShowMergeModal(false)}
        />
      )}

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
