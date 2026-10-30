import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import MergeDecisionModal from "./components/MergeDecisionModal";

import OverviewView from "./views/OverviewView";
import ReviewStudioView from "./views/ReviewStudioView";
import FindingsView from "./views/FindingsView";
import RiskIntelligenceView from "./views/RiskIntelligenceView";
import TestLabView from "./views/TestLabView";
import HistoryView from "./views/HistoryView";
import RepositoriesView from "./views/RepositoriesView";
import NotificationsView from "./views/NotificationsView";
import SettingsView from "./views/SettingsView";

import { api } from "./services/api";

export default function App() {
  const [currentView, setCurrentView] = useState("overview");
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [health, setHealth] = useState(null);
  const [toast, setToast] = useState(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
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

  const loadHistoryAndNotifications = async () => {
    try {
      const [histRes, notifRes] = await Promise.all([
        api.listHistory(10, 0).catch(() => ({ history: [] })),
        api.listNotifications().catch(() => ({ notifications: [] })),
      ]);
      setHistoryList(histRes.history || []);
      const unread = (notifRes.notifications || []).filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn("Failed to load initial history/notifications:", err);
    }
  };

  useEffect(() => {
    loadHealth();
    loadHistoryAndNotifications();
  }, []);

  const handleAnalysisCompleted = (result) => {
    setActiveAnalysis(result);
    showToast("Code review and risk calculation completed successfully.", "success");
    loadHistoryAndNotifications();
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

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentView={currentView}
          health={health}
          onRefreshHealth={loadHealth}
          onOpenNotifications={() => setCurrentView("notifications")}
          onOpenSettings={() => setCurrentView("settings")}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
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

          {currentView === "tests" && (
            <TestLabView
              analysis={activeAnalysis}
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
      </div>

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
