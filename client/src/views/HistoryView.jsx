import React, { useState, useEffect } from "react";
import { GitPullRequest, Trash2, ArrowRight, RefreshCw, Loader2, Calendar } from "lucide-react";
import { api } from "../services/api";

export default function HistoryView({ onSelectAnalysis, onToast, onError }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.listHistory(50, 0);
      setHistory(res.history || []);
    } catch (err) {
      onError(err.message || "Failed to fetch analysis history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleInspect = async (id) => {
    try {
      const detail = await api.getHistoryItem(id);
      onSelectAnalysis(detail);
      onToast("Loaded review from persistent history.", "info");
    } catch (err) {
      onError(err.message || "Could not load analysis details.");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this analysis record from persistent history?")) return;

    setDeletingId(id);
    try {
      await api.deleteHistoryItem(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      onToast("Analysis record removed from history.", "info");
    } catch (err) {
      onError(err.message || "Failed to delete record.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text">Analysis History</h2>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#131733] hover:bg-[#1b2149] border border-line text-muted hover:text-text transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-violet-light" />
          <span>Loading...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted text-xs">
          No previous reviews
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => {
            const isDeleting = deletingId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleInspect(item.id)}
                className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-violet/50 transition-all text-xs"
              >
                <div className="flex items-start md:items-center gap-3">
                  <GitPullRequest className="w-4 h-4 text-violet-light mt-0.5 md:mt-0 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-text text-xs md:text-sm">
                      {item.title || "Review Session"}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] text-muted mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      <span>·</span>
                      <span className="uppercase font-semibold text-violet-light">{item.source}</span>
                      <span>·</span>
                      <span>
                        +{item.stats?.linesAdded ?? 0} / -{item.stats?.linesRemoved ?? 0} lines
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.riskScore >= 75
                          ? "bg-red/15 text-red border-red/30"
                          : item.riskScore >= 50
                          ? "bg-orange/15 text-orange border-orange/30"
                          : "bg-green/15 text-green border-green/30"
                      }`}
                    >
                      Score: {item.riskScore}/100 ({item.riskLevel || "LOW"})
                    </span>

                    <span className="text-[10px] text-muted font-mono px-2 py-0.5 rounded bg-[#131733] border border-line">
                      {item.findingCount} finding{item.findingCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-muted hover:text-red hover:bg-red/10 transition-colors"
                      title="Delete record"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>

                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-[#171b3d] hover:bg-violet text-text hover:text-white transition-colors text-[11px]">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
