import React, { useState } from "react";
import { GitPullRequest, FileCode, Play, RotateCcw, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "../services/api";

const SAMPLE_DIFF = `diff --git a/src/auth/authHandler.js b/src/auth/authHandler.js
index 83a21bc..91cf23a 100644
--- a/src/auth/authHandler.js
+++ b/src/auth/authHandler.js
@@ -14,6 +14,14 @@ async function authenticateUser(req, res) {
   const { username, password } = req.body;
+  // Vulnerability: raw SQL query vulnerable to injection
+  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
+  const user = await db.raw(query);
+
+  if (user) {
+    // Hardcoded JWT signing secret
+    const token = jwt.sign({ id: user.id }, "default-insecure-secret-12345");
+    return res.json({ token });
+  }
   return res.status(401).json({ error: "Invalid credentials" });
 }`;

export default function ReviewStudioView({ onAnalysisCompleted, onError }) {
  const [mode, setMode] = useState("pr"); // "pr" | "diff"
  const [prUrl, setPrUrl] = useState("");
  const [customToken, setCustomToken] = useState("");
  const [diffText, setDiffText] = useState("");
  const [diffTitle, setDiffTitle] = useState("CodeGuard Diff Review");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState("");

  const handleAnalyzePr = async () => {
    if (!prUrl.trim()) {
      onError("Please enter a valid GitHub Pull Request URL.");
      return;
    }

    setLoading(true);
    setProgressStep("Fetching PR metadata and diff from GitHub...");
    try {
      setTimeout(() => setProgressStep("Scanning changes with Gemini AI & enforcing safety boundaries..."), 1200);
      const res = await api.analyzePr(prUrl.trim(), customToken.trim() || null);
      setProgressStep("Calculating risk score & validating findings...");
      onAnalysisCompleted(res);
    } catch (err) {
      onError(err.message || "Failed to analyze Pull Request.");
    } finally {
      setLoading(false);
      setProgressStep("");
    }
  };

  const handleAnalyzeDiff = async () => {
    if (!diffText.trim()) {
      onError("Please paste a unified git diff first.");
      return;
    }

    setLoading(true);
    setProgressStep("Parsing unified diff hunks & filtering binary artifacts...");
    try {
      setTimeout(() => setProgressStep("Invoking Gemini structured review engine..."), 1200);
      const res = await api.analyzeDiff(diffText.trim(), diffTitle.trim());
      setProgressStep("Computing explainable risk posture...");
      onAnalysisCompleted(res);
    } catch (err) {
      onError(err.message || "Failed to analyze git diff.");
    } finally {
      setLoading(false);
      setProgressStep("");
    }
  };

  const loadExamplePr = () => {
    setPrUrl("https://github.com/expressjs/express/pull/5800");
    setMode("pr");
  };

  const loadSampleDiff = () => {
    setDiffText(SAMPLE_DIFF);
    setDiffTitle("Auth SQL Injection & Weak JWT Diff");
    setMode("diff");
  };

  const handleClear = () => {
    setPrUrl("");
    setDiffText("");
    setCustomToken("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-text">AI Review Studio</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl border border-line bg-[#090b1c] w-max">
        <button
          onClick={() => setMode("pr")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === "pr" ? "bg-[#1d2247] text-white shadow" : "text-muted hover:text-white"
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>GitHub Pull Request</span>
        </button>

        <button
          onClick={() => setMode("diff")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            mode === "diff" ? "bg-[#1d2247] text-white shadow" : "text-muted hover:text-white"
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Unified Git Diff</span>
        </button>
      </div>

      {/* Form Panel */}
      <div className="glass-panel p-6 space-y-5">
        {mode === "pr" ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="prUrlInput" className="text-[11px] font-bold text-text uppercase tracking-wider block mb-1.5">
                Pull Request URL
              </label>
              <input
                id="prUrlInput"
                type="url"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repository/pull/42"
                disabled={loading}
                className="w-full px-3.5 py-3 rounded-xl border border-line bg-[#070918] text-xs font-mono text-text placeholder:text-muted/60 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-all"
              />
            </div>

            <div>
              <label htmlFor="tokenInput" className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
                GitHub Personal Access Token <span className="text-[10px] lowercase font-normal">(optional for private repos)</span>
              </label>
              <input
                id="tokenInput"
                type="password"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Never stored on server)"
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-[#070918] text-xs font-mono text-text placeholder:text-muted/60 focus:outline-none focus:border-violet transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="diffTitleInput" className="text-[11px] font-bold text-text uppercase tracking-wider block mb-1.5">
                Review Session Title
              </label>
              <input
                id="diffTitleInput"
                type="text"
                value={diffTitle}
                onChange={(e) => setDiffTitle(e.target.value)}
                placeholder="e.g. Hotfix Payment Processor Diff"
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-[#070918] text-xs font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-violet transition-all"
              />
            </div>

            <div>
              <label htmlFor="diffTextArea" className="text-[11px] font-bold text-text uppercase tracking-wider block mb-1.5">
                Unified Diff Content
              </label>
              <textarea
                id="diffTextArea"
                rows={10}
                value={diffText}
                onChange={(e) => setDiffText(e.target.value)}
                placeholder="Paste unified git diff (e.g. diff --git a/app.js b/app.js ...)"
                disabled={loading}
                className="w-full px-3.5 py-3 rounded-xl border border-line bg-[#070918] text-xs font-mono text-text placeholder:text-muted/60 focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-all resize-y leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
          <div className="flex items-center gap-2">
            <button
              onClick={mode === "pr" ? handleAnalyzePr : handleAnalyzeDiff}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet to-indigo-600 hover:from-violet-dark hover:to-indigo-700 text-white shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reviewing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run AI Review →</span>
                </>
              )}
            </button>

            <button
              onClick={mode === "pr" ? loadExamplePr : loadSampleDiff}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#131733] hover:bg-[#1a2047] border border-line text-muted hover:text-text transition-colors"
            >
              Load Example
            </button>

            <button
              onClick={handleClear}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-text transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Active Progress Status Banner */}
        {loading && (
          <div className="p-3.5 rounded-xl border border-violet/40 bg-violet/10 flex items-center gap-3 text-xs text-violet-light animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span className="font-medium">{progressStep}</span>
          </div>
        )}
      </div>
    </div>
  );
}
