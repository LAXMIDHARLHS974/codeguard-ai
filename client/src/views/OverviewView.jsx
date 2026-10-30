import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Sparkles,
  TrendingUp,
  FileCode,
  Activity as ActivityIcon,
} from "lucide-react";
import { api } from "../services/api";

export default function OverviewView({
  analysis,
  history = [],
  onNavigate,
  onCheckMerge,
}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.warn("Could not load dashboard stats:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [analysis]);

  // Aggregate values from backend or fallback to analysis prop
  const totalScans = stats?.totalScans ?? history.length;
  const secOverview = stats?.securityOverview || {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    passRate: 100,
  };
  const recentPRs = stats?.recentPullRequests || [];
  const aiInsights = stats?.aiInsights || [];
  const riskTrend = stats?.riskTrend && stats.riskTrend.length > 0
    ? stats.riskTrend
    : [
        { scan: "Initial", date: "Baseline", score: analysis?.riskScore ?? 0, findings: analysis?.findings?.length ?? 0 },
      ];
  const recentActivity = stats?.recentActivity || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white">
            Autonomous Code Defense. <br />
            <span className="gradient-text">Enterprise Grade.</span>
          </h1>
          <p className="text-xs text-secondary mt-2 max-w-lg">
            Continuous AI-powered static analysis, vulnerability detection, and regression test synthesis.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate("review")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold btn-gradient shadow-glow cursor-pointer"
          >
            <span>Start AI Review</span>
            <ArrowRight className="w-4 h-4 text-bg" />
          </button>

          <button
            onClick={() => onNavigate("pulls")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-card hover:bg-cardHover border border-line text-secondary hover:text-white transition-all cursor-pointer"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-purple" />
            <span>Browse PRs</span>
          </button>
        </div>
      </section>

      {/* 6 Core Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WIDGET 1: Total Code Scans */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              Total Code Scans
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple/15 flex items-center justify-center text-purple">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="my-4">
            <div className="text-4xl font-black text-white">{totalScans}</div>
            <p className="text-xs text-secondary mt-1">
              Autonomous reviews executed across repos and unified diffs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-pink font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pass Rate: {secOverview.passRate}% passing security threshold</span>
          </div>
        </div>

        {/* WIDGET 2: Security Overview Breakdown */}
        <div className="glass-panel p-6 flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              Security Overview
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                secOverview.critical > 0
                  ? "bg-red/20 text-red border border-red/30"
                  : "bg-green/20 text-green border border-green/30"
              }`}
            >
              {secOverview.critical > 0 ? "Action Required" : "Shield Healthy"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 my-4">
            <div className="p-3 rounded-2xl bg-cardHover/50 border border-line text-center">
              <span className="text-2xl font-black text-red block">{secOverview.critical}</span>
              <span className="text-[10px] font-bold text-muted uppercase">Critical</span>
            </div>
            <div className="p-3 rounded-2xl bg-cardHover/50 border border-line text-center">
              <span className="text-2xl font-black text-orange block">{secOverview.high}</span>
              <span className="text-[10px] font-bold text-muted uppercase">High</span>
            </div>
            <div className="p-3 rounded-2xl bg-cardHover/50 border border-line text-center">
              <span className="text-2xl font-black text-yellow block">{secOverview.medium}</span>
              <span className="text-[10px] font-bold text-muted uppercase">Medium</span>
            </div>
            <div className="p-3 rounded-2xl bg-cardHover/50 border border-line text-center">
              <span className="text-2xl font-black text-secondary block">{secOverview.low}</span>
              <span className="text-[10px] font-bold text-muted uppercase">Low</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-secondary">
            <span>Total Identified Vulnerabilities: <strong className="text-white">{secOverview.totalFindings || 0}</strong></span>
            <button
              onClick={() => onNavigate("findings")}
              className="text-purple hover:text-pink font-semibold transition-colors"
            >
              View Findings →
            </button>
          </div>
        </div>

        {/* WIDGET 5: Security Risk Trend (Recharts Area Chart) */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Security Risk Trend
              </span>
            </div>
            <span className="text-[10px] font-semibold text-secondary">
              Risk Score (0–100) vs Timeline
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C78BCB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F0A4D9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#7E788B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#7E788B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#17131D",
                    borderColor: "rgba(199,139,203,0.3)",
                    borderRadius: "12px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#F0A4D9" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#C78BCB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#riskGradient)"
                  dot={{ stroke: "#F0A4D9", strokeWidth: 2, r: 3, fill: "#17131D" }}
                  activeDot={{ r: 5, stroke: "#FFFFFF", fill: "#C78BCB" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WIDGET 4: AI Insights */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-pink" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                AI Insights & Guardrails
              </span>
            </div>

            <div className="space-y-3">
              {aiInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-cardHover/60 border border-line space-y-1"
                >
                  <span className="text-xs font-bold text-white block">
                    {insight.title}
                  </span>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    {insight.advice}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate("tests")}
            className="w-full mt-4 py-2 rounded-xl bg-purple/15 hover:bg-purple/25 text-purple font-semibold text-xs border border-purple/30 transition-all text-center block"
          >
            Launch AI Test Lab →
          </button>
        </div>

        {/* WIDGET 2: Recent Pull Requests */}
        <div className="glass-panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-purple" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Pull Requests
              </span>
            </div>
            <button
              onClick={() => onNavigate("pulls")}
              className="text-xs text-purple hover:text-pink font-semibold transition-colors"
            >
              View all PRs →
            </button>
          </div>

          {recentPRs.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-line/60 rounded-2xl text-xs text-secondary">
              No recent Pull Requests analyzed yet. Trigger a PR analysis in Review Studio.
            </div>
          ) : (
            <div className="space-y-2">
              {recentPRs.slice(0, 4).map((pr) => (
                <div
                  key={pr.id}
                  onClick={() => onNavigate("findings")}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-cardHover/40 hover:border-purple/30 border border-line cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-purple flex-shrink-0" />
                    <span className="font-semibold text-white truncate max-w-md">
                      {pr.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pr.riskScore >= 70
                          ? "bg-red/20 text-red border border-red/30"
                          : pr.riskScore >= 40
                          ? "bg-orange/20 text-orange border border-orange/30"
                          : "bg-green/20 text-green border border-green/30"
                      }`}
                    >
                      Risk: {pr.riskScore}/100
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(pr.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WIDGET 6: Recent Activity */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-pink" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Activity
              </span>
            </div>
            <button
              onClick={() => onNavigate("activity")}
              className="text-xs text-purple hover:text-pink font-semibold transition-colors"
            >
              Audit log →
            </button>
          </div>

          <div className="space-y-3">
            {recentActivity.slice(0, 4).map((act, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs">
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    act.type === "danger" ? "bg-red" : "bg-purple"
                  }`}
                />
                <div className="min-w-0">
                  <span className="text-white font-medium block truncate">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-secondary">
                    {act.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
