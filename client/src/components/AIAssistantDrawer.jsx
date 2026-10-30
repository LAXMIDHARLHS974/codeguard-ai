import React, { useState } from "react";
import { X, Send, Sparkles, ShieldAlert, CheckCircle2, Terminal } from "lucide-react";
import { api } from "../services/api";

export default function AIAssistantDrawer({ isOpen, onClose, activeAnalysis }) {
  const [messages, setMessages] = useState([
    {
      id: "m_welcome",
      role: "assistant",
      text: "Hello! I am **CodeGuard AI**, your autonomous Application Security Architect. Ask me about remediating vulnerabilities, writing test suites, reviewing pull request diffs, or hardening your production APIs.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    "How do I secure an Express API against SSRF & injection?",
    "Explain the highest risk vulnerabilities found in recent scans.",
    "Draft a Jest regression test for an authentication bypass edge case.",
  ];

  const handleSend = async (messageText = input) => {
    if (!messageText || !messageText.trim() || isLoading) return;
    const textToSend = messageText.trim();
    setInput("");

    const userMsg = {
      id: `u_${Date.now()}`,
      role: "user",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.chatWithAssistant(textToSend, {
        diff: activeAnalysis?.diff || "",
        findings: activeAnalysis?.findings || [],
      });

      const assistantMsg = {
        id: `a_${Date.now()}`,
        role: "assistant",
        text: res.reply || "Analysis completed.",
        recommendations: res.recommendations || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          text: `⚠️ **Error connecting to AI:** ${err.message}. Please check your backend connection and API keys.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-card border-l border-line h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-sidebar/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-pink flex items-center justify-center text-bg shadow-glow">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                CodeGuard AI Assistant
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-pink/20 text-pink border border-pink/30">
                  Gemini
                </span>
              </h3>
              <p className="text-[11px] text-secondary">Defensive Code Intelligence & Review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-cardHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-purple text-bg font-medium"
                    : "glass-panel text-secondary border border-line"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Recommendations list */}
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-line/60">
                    <span className="text-[10px] font-bold text-purple uppercase tracking-wider block mb-1">
                      Actionable Guardrails
                    </span>
                    <ul className="space-y-1">
                      {m.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-secondary">
                          <CheckCircle2 className="w-3.5 h-3.5 text-pink flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-secondary italic p-3 glass-panel rounded-2xl w-fit">
              <Sparkles className="w-3.5 h-3.5 text-pink animate-spin" />
              <span>Analyzing code and synthesizing defensive response...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="p-4 border-t border-line bg-sidebar/50">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">
            Suggested Security Prompts
          </span>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="text-[11px] text-secondary bg-cardHover/70 hover:text-white hover:border-purple/40 border border-line px-2.5 py-1 rounded-lg transition-all text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CodeGuard AI about vulnerabilities, diffs, tests..."
              className="flex-1 bg-card border border-line rounded-xl px-3.5 py-2 text-xs text-white placeholder-muted focus:outline-none focus:border-purple/60"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 rounded-xl btn-gradient text-bg disabled:opacity-40 transition-all cursor-pointer shadow-glow"
              title="Send question"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
