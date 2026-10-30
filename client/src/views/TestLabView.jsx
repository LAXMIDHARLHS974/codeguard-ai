import React, { useState } from "react";
import { Copy, Download, Check, Play, Loader2, FileCode, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

export default function TestLabView({ analysis, onToast, onError }) {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!analysis) {
      onError("Please run a Pull Request or diff review before generating regression tests.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.generateTests({
        analysisId: analysis.analysisId || analysis.id,
        diff: analysis.diff || "",
        findings: analysis.findings || [],
        language: selectedLanguage,
      });
      setGeneratedResult(res);
      onToast("Generated tests ready for inspection.", "success");
    } catch (err) {
      onError(err.message || "Failed to generate tests.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult?.code) return;
    navigator.clipboard.writeText(generatedResult.code);
    setCopied(true);
    onToast("Test code copied to clipboard.", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedResult?.code) return;
    const extensions = {
      javascript: "test.js",
      typescript: "test.ts",
      python: "test_review.py",
      java: "ReviewTest.java",
    };
    const ext = extensions[generatedResult.language] || "test.txt";
    const filename = `codeguard_${generatedResult.framework}_${ext}`;
    const blob = new Blob([generatedResult.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast(`Downloaded ${filename}`, "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text">AI Test Lab</h2>
        </div>

        {/* Framework Selector & Trigger Button */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl border border-line bg-[#090b1c]">
            {[
              { id: "javascript", label: "Jest (JS)" },
              { id: "typescript", label: "Jest (TS)" },
              { id: "python", label: "pytest" },
              { id: "java", label: "JUnit 5" },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedLanguage === lang.id
                    ? "bg-[#1f2552] text-white shadow"
                    : "text-muted hover:text-white"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-violet hover:bg-violet-dark text-white transition-all shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Generate Tests</span>
          </button>
        </div>
      </div>

      {/* Generated Results Container */}
      {generatedResult ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Test Cases Checklist */}
          <div className="glass-panel p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                Synthesized Tests ({generatedResult.testNames?.length || 0})
              </h3>
              <span className="text-[10px] text-muted font-mono block">
                Framework: {generatedResult.framework} ({generatedResult.language})
              </span>
            </div>

            <div className="space-y-2">
              {generatedResult.testNames?.map((testName, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg bg-[#0b0e24] border border-line text-xs font-mono text-[#c5cbe3]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green flex-shrink-0 mt-0.5" />
                  <span className="break-all">{testName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code Viewer Panel */}
          <div className="md:col-span-2 glass-panel p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-violet-light" />
                <span className="text-xs font-bold text-text">Generated Test File</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#131733] hover:bg-[#1a2047] border border-line text-muted hover:text-text transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#131733] hover:bg-[#1a2047] border border-line text-muted hover:text-text transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl border border-line bg-[#060714] text-xs font-mono text-[#d6dbf0] overflow-x-auto max-h-[500px] leading-relaxed select-all">
              {generatedResult.code}
            </pre>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center text-xs text-muted">
          No tests generated yet
        </div>
      )}
    </div>
  );
}
