import React, { useState, useEffect } from "react";
import { Bell, Check, ShieldAlert, Info, AlertTriangle, CheckCheck, Loader2 } from "lucide-react";
import { api } from "../services/api";

export default function NotificationsView({ onToast, onError }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.listNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      onError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      onToast("Marked notification as read.", "info");
    } catch (err) {
      onError(err.message || "Failed to update notification.");
    }
  };

  const getIcon = (type) => {
    if (type === "warning" || type === "critical") {
      return <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0" />;
    }
    return <Info className="w-4 h-4 text-cyan flex-shrink-0" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text">Workspace Notifications</h2>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-violet-light" />
          <span>Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted text-xs">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-panel p-4 flex items-start justify-between gap-4 transition-all text-xs ${
                n.isRead ? "opacity-70 bg-[#090b1c]" : "border-violet/40 bg-[#0e122b]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(n.type)}</div>
                <div>
                  <h4 className="font-bold text-text text-xs">{n.title}</h4>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-muted/70 block mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#1a1f42] hover:bg-violet text-muted hover:text-white transition-colors flex-shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
