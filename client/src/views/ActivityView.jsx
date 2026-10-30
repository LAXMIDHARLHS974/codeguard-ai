import React, { useState, useEffect } from "react";
import { Activity, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Clock, FileCode } from "lucide-react";
import { api } from "../services/api";

export default function ActivityView({ onSelectAnalysis, onToast, onError }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadActivityData = async () => {
    try {
      setLoading(true);
      const stats = await api.getDashboardStats();
      const list = stats.recentActivity || [];
      setActivities(list);
    } catch (err) {
      onError?.("Failed to load activity logs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivityData();
  }, []);

  const filtered = activities.filter((act) => {
    if (filter === "all") return true;
    if (filter === "scans") return act.action.includes("SCAN") || act.action.includes("REVIEW");
    if (filter === "security") return act.type === "danger";
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-purple" />
            Activity & Audit Log
          </h1>
          <p className="text-xs text-secondary mt-1">
            Real-time audit trail of security analyses, regression test generations, and pipeline decisions.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center rounded-xl bg-card border border-line p-1 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filter === "all" ? "bg-purple text-bg font-bold shadow-sm" : "text-secondary hover:text-white"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter("scans")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filter === "scans" ? "bg-purple text-bg font-bold shadow-sm" : "text-secondary hover:text-white"
            }`}
          >
            Code Scans
          </button>
          <button
            onClick={() => setFilter("security")}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filter === "security" ? "bg-purple text-bg font-bold shadow-sm" : "text-secondary hover:text-white"
            }`}
          >
            Flagged Risks
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-secondary italic">
          Loading audit trail...
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-secondary">
          No audit events recorded yet. Perform an AI code review to start logging telemetry.
        </div>
      ) : (
        <div className="glass-panel p-6 space-y-4">
          {filtered.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex items-start justify-between gap-4 py-3 border-b border-line/60 last:border-b-0 hover:bg-cardHover/30 px-3 rounded-xl transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.type === "danger"
                      ? "bg-red/20 text-red border border-red/30"
                      : "bg-purple/20 text-purple border border-purple/30"
                  }`}
                >
                  {item.type === "danger" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary font-mono">
                      {item.action}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(item.time).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {item.id && (
                <button
                  onClick={() => onSelectAnalysis?.({ id: item.id })}
                  className="p-2 text-secondary hover:text-purple rounded-xl hover:bg-card transition-colors flex items-center gap-1 text-xs"
                  title="Inspect Analysis"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
