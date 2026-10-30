import React, { useState, useEffect } from "react";
import { GitPullRequest, ArrowRight, RefreshCw, Search, ShieldCheck, GitFork, ExternalLink } from "lucide-react";
import { api } from "../services/api";

export default function PullRequestsView({ onSelectPrForReview, onToast, onError }) {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterState, setFilterState] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");

  const loadRepositories = async () => {
    try {
      const data = await api.listRepositories();
      const list = data.repositories || [];
      setRepos(list);
      if (list.length > 0 && !selectedRepo) {
        setSelectedRepo(`${list[0].owner}/${list[0].name}`);
      } else if (!selectedRepo) {
        setSelectedRepo("LAXMIDHARLHS974/codeguard-ai");
      }
    } catch (err) {
      onError?.("Failed to load repositories: " + err.message);
    }
  };

  const fetchPRs = async (repoString = selectedRepo, state = filterState) => {
    if (!repoString) return;
    const [owner, name] = repoString.split("/");
    if (!owner || !name) return;

    try {
      setLoading(true);
      const res = await api.listRepoPullRequests(owner, name, state);
      setPullRequests(res.pullRequests || []);
    } catch (err) {
      onError?.(`Could not fetch PRs for ${owner}/${name}: ${err.message}`);
      setPullRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchPRs(selectedRepo, filterState);
    }
  }, [selectedRepo, filterState]);

  const filteredPRs = pullRequests.filter((pr) =>
    (pr.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(pr.number).includes(searchQuery) ||
    (pr.author || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GitPullRequest className="w-6 h-6 text-purple" />
            Pull Requests
          </h1>
          <p className="text-xs text-secondary mt-1">
            Browse, inspect, and trigger autonomous security reviews on GitHub Pull Requests.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Repo Selector */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="bg-card border border-line rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple/60"
          >
            {repos.map((r) => (
              <option key={r.id || `${r.owner}/${r.name}`} value={`${r.owner}/${r.name}`}>
                {r.owner}/{r.name}
              </option>
            ))}
            <option value="LAXMIDHARLHS974/codeguard-ai">LAXMIDHARLHS974/codeguard-ai</option>
          </select>

          {/* State Filter Buttons */}
          <div className="flex items-center rounded-xl bg-card border border-line p-1 text-xs">
            <button
              onClick={() => setFilterState("open")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterState === "open"
                  ? "bg-purple text-bg font-bold shadow-sm"
                  : "text-secondary hover:text-white"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilterState("closed")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterState === "closed"
                  ? "bg-purple text-bg font-bold shadow-sm"
                  : "text-secondary hover:text-white"
              }`}
            >
              Closed
            </button>
          </div>

          <button
            onClick={() => fetchPRs(selectedRepo, filterState)}
            className="p-2 rounded-xl bg-card border border-line text-secondary hover:text-white hover:border-purple/40 transition-all"
            title="Refresh Pull Requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter pull requests by title, author, or #PR number..."
          className="w-full bg-card border border-line rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-muted focus:outline-none focus:border-purple/60"
        />
      </div>

      {/* PR Cards List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-secondary italic">
          Fetching pull requests from GitHub repository...
        </div>
      ) : filteredPRs.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-secondary">
          No {filterState} pull requests found matching criteria for {selectedRepo}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredPRs.map((pr) => (
            <div
              key={pr.number}
              className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple/30 transition-all group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-purple font-bold">
                    #{pr.number}
                  </span>
                  <span className="text-xs font-semibold text-white group-hover:text-purple transition-colors truncate">
                    {pr.title}
                  </span>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                      pr.state === "open"
                        ? "bg-green/20 text-green border border-green/30"
                        : "bg-secondary/20 text-secondary"
                    }`}
                  >
                    {pr.state}
                  </span>
                  {pr.isDraft && (
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-muted">
                      Draft
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-secondary">
                  <span>Author: @{pr.author}</span>
                  <span>•</span>
                  <span>
                    {pr.baseBranch} ← {pr.headBranch}
                  </span>
                  <span>•</span>
                  <span>Updated {new Date(pr.updatedAt || pr.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <a
                  href={pr.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-secondary hover:text-white rounded-xl hover:bg-cardHover border border-line transition-colors"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => onSelectPrForReview?.(pr.htmlUrl)}
                  className="px-3.5 py-1.5 rounded-xl btn-gradient text-xs font-semibold flex items-center gap-1.5 shadow-glow"
                >
                  <span>Review with AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
