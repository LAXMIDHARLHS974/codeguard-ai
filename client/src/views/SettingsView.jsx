import React, { useState, useEffect } from "react";
import {
  Settings,
  Server,
  Key,
  Database,
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  getApiBaseUrl,
  setApiBaseUrl,
  getSavedGitHubToken,
  setSavedGitHubToken,
  api,
} from "../services/api";

export default function SettingsView({ onToast, onError }) {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [ghToken, setGhToken] = useState(getSavedGitHubToken());
  const [diagnostics, setDiagnostics] = useState(null);
  const [testingHealth, setTestingHealth] = useState(false);

  const runDiagnostics = async () => {
    setTestingHealth(true);
    try {
      const health = await api.checkHealth();
      const ready = await api.checkReadiness();
      setDiagnostics({ health, ready, timestamp: new Date().toLocaleTimeString() });
      onToast("Diagnostic check passed successfully.", "success");
    } catch (err) {
      setDiagnostics({ error: err.message, timestamp: new Date().toLocaleTimeString() });
      onError(`Diagnostics failed: ${err.message}`);
    } finally {
      setTestingHealth(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setApiBaseUrl(apiUrl);
    setSavedGitHubToken(ghToken);
    onToast("Settings saved successfully.", "success");
    runDiagnostics();
  };

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-text">Settings</h2>
      </div>

      <form onSubmit={handleSave} className="glass-panel p-6 space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
          <Server className="w-4 h-4 text-violet-light" />
          <span>Backend Configuration</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-text uppercase tracking-wider block mb-1">
              Backend API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="Leave empty for local server or enter https://codeguard-lhs.onrender.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-[#070918] text-xs font-mono text-text placeholder:text-muted/50 focus:outline-none focus:border-violet"
            />
            <span className="text-[10px] text-muted block mt-1">
              Leave blank for default relative requests (<code className="text-violet-light">/api</code>), or specify your production Render backend URL.
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-text uppercase tracking-wider block mb-1">
              GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional for private repos)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-[#070918] text-xs font-mono text-text placeholder:text-muted/50 focus:outline-none focus:border-violet"
            />
            <span className="text-[10px] text-muted block mt-1">
              Stored locally in your browser's encrypted localStorage and sent in the <code className="text-violet-light">X-GitHub-Token</code> header. Never exposed publicly.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-line/60">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-bold bg-violet hover:bg-violet-dark text-white transition-all shadow"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Live Backend Telemetry & Diagnostic Report */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text">
              Live Backend Diagnostics
            </h3>
          </div>

          <button
            type="button"
            onClick={runDiagnostics}
            disabled={testingHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#131733] hover:bg-[#1c224a] border border-line text-muted hover:text-text transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingHealth ? "animate-spin" : ""}`} />
            <span>Recheck</span>
          </button>
        </div>

        {diagnostics?.error ? (
          <div className="p-3.5 rounded-xl border border-red/40 bg-red/10 flex items-start gap-2 text-xs text-red">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Backend Diagnostic Failure:</strong>
              <p className="mt-0.5">{diagnostics.error}</p>
            </div>
          </div>
        ) : diagnostics?.health ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0b0e24] border border-line">
                <span className="text-[10px] text-muted uppercase font-bold block mb-1">Status</span>
                <span className="font-bold text-green flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Healthy
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0e24] border border-line">
                <span className="text-[10px] text-muted uppercase font-bold block mb-1">Gemini AI</span>
                <span className={`font-bold ${diagnostics.health.geminiConfigured ? "text-green" : "text-red"}`}>
                  {diagnostics.health.geminiConfigured ? `Configured (${diagnostics.health.geminiModel || "gemini-2.5-flash"})` : "Missing Key"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0e24] border border-line">
                <span className="text-[10px] text-muted uppercase font-bold block mb-1">Database</span>
                <span className={`font-bold ${diagnostics.health.databaseConfigured ? "text-green" : "text-cyan"}`}>
                  {diagnostics.health.databaseConfigured ? "PostgreSQL Connected" : "Local Store Active"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0e24] border border-line">
                <span className="text-[10px] text-muted uppercase font-bold block mb-1">Uptime</span>
                <span className="font-mono font-bold text-text">
                  {diagnostics.health.uptime}s
                </span>
              </div>
            </div>

            <pre className="p-3 rounded-xl border border-line bg-[#060714] text-[11px] font-mono text-muted/80 overflow-x-auto">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted">
            Checking backend status...
          </div>
        )}
      </div>
    </div>
  );
}
