import React, { useState, useEffect } from "react";
import { GitFork, Plus, Trash2, ArrowUpRight, Lock, Globe, Loader2 } from "lucide-react";
import { api } from "../services/api";

export default function RepositoriesView({ onSelectRepoForReview, onToast, onError }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [submitting, setSubmitting] = useState(false);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const res = await api.listRepositories();
      setRepos(res.repositories || []);
    } catch (err) {
      onError(err.message || "Failed to load repositories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleAddRepo = async (e) => {
    e.preventDefault();
    if (!owner.trim() || !name.trim()) {
      onError("Repository owner and name are required.");
      return;
    }

    setSubmitting(true);
    try {
      await api.addRepository({
        owner: owner.trim(),
        name: name.trim(),
        isPrivate,
        defaultBranch: defaultBranch.trim() || "main",
      });
      onToast(`Repository ${owner}/${name} registered successfully.`, "success");
      setOwner("");
      setName("");
      setShowAddForm(false);
      fetchRepos();
    } catch (err) {
      onError(err.message || "Failed to add repository.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, repoName) => {
    if (!confirm(`Disconnect repository ${repoName}?`)) return;
    try {
      await api.deleteRepository(id);
      setRepos((prev) => prev.filter((r) => r.id !== id));
      onToast("Repository disconnected.", "info");
    } catch (err) {
      onError(err.message || "Failed to disconnect repository.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text">Connected Repositories</h2>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet hover:bg-violet-dark text-white transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Repository</span>
        </button>
      </div>

      {/* Add Repository Modal/Inline Form */}
      {showAddForm && (
        <form onSubmit={handleAddRepo} className="glass-panel p-5 space-y-4 border border-violet/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text">
            Register New GitHub Repository
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                Owner / Organization
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. facebook or acme-corp"
                required
                className="w-full px-3 py-2 rounded-lg border border-line bg-[#080918] text-xs font-mono text-text focus:outline-none focus:border-violet"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                Repository Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. react or backend-api"
                required
                className="w-full px-3 py-2 rounded-lg border border-line bg-[#080918] text-xs font-mono text-text focus:outline-none focus:border-violet"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted block mb-1">
                Default Branch
              </label>
              <input
                type="text"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 rounded-lg border border-line bg-[#080918] text-xs font-mono text-text focus:outline-none focus:border-violet"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text select-none">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-line text-violet focus:ring-violet"
                />
                <span>Private Repository (Requires GITHUB_TOKEN or PAT)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line/50">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-violet hover:bg-violet-dark text-white transition-all shadow"
            >
              {submitting ? "Saving..." : "Save Repository"}
            </button>
          </div>
        </form>
      )}

      {/* Repositories List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs text-muted flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-violet-light" />
          <span>Loading connected repositories...</span>
        </div>
      ) : repos.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted text-xs">
          No repositories connected yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="glass-panel p-5 flex flex-col justify-between space-y-3 hover:border-violet/40 transition-all text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#141738] border border-line text-violet-light">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text text-sm">
                      {repo.owner}/{repo.name}
                    </h4>
                    <span className="text-[10px] text-muted font-mono">
                      branch: {repo.defaultBranch || "main"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {repo.isPrivate ? (
                    <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border border-orange/30 bg-orange/15 text-orange">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border border-green/30 bg-green/15 text-green">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line/60">
                <button
                  onClick={() => handleDelete(repo.id, `${repo.owner}/${repo.name}`)}
                  className="p-1.5 rounded-lg text-muted hover:text-red transition-colors"
                  title="Disconnect repository"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectRepoForReview(repo)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-[#14183a] hover:bg-violet text-violet-light hover:text-white transition-all text-[11px]"
                >
                  <span>Review PRs</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
