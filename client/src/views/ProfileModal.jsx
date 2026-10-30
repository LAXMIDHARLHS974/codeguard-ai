import React, { useState, useEffect } from "react";
import { X, User, Mail, Shield, Building, GitBranch, Key, LogOut, CheckCircle, Trash2, Clock } from "lucide-react";
import { api } from "../services/api";

export default function ProfileModal({ isOpen, onClose, onToast, onError, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [bio, setBio] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [githubToken, setGithubToken] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [profData, sessData] = await Promise.all([
        api.getUserProfile(),
        api.getUserSessions().catch(() => ({ sessions: [] })),
      ]);
      setProfile(profData);
      setName(profData.name || "");
      setEmail(profData.email || "");
      setRole(profData.role || "");
      setCompany(profData.company || "");
      setBio(profData.bio || "");
      setGithubUsername(profData.githubUsername || "");
      setSessions(sessData.sessions || []);
    } catch (err) {
      onError?.("Failed to load user profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      onError?.("Name is required");
      return;
    }
    try {
      setSaving(true);
      const updated = await api.updateUserProfile({
        name,
        email,
        role,
        company,
        bio,
        githubUsername,
        githubToken: githubToken ? githubToken.trim() : undefined,
      });
      setProfile(updated);
      setGithubToken("");
      onToast?.("Profile and security settings updated successfully", "success");
      onProfileUpdated?.(updated);
    } catch (err) {
      onError?.("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.revokeUserSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      onToast?.("Session revoked successfully", "info");
    } catch (err) {
      onError?.("Could not revoke session: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-card border border-line rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-line mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple to-pink flex items-center justify-center text-bg font-extrabold text-lg shadow-glow">
              {(name || "U")[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                User Profile & Security
              </h2>
              <p className="text-xs text-secondary">Manage developer credentials, GitHub sync, and active sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary hover:text-white rounded-xl hover:bg-cardHover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-secondary italic">
            Loading user profile...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1.5">Full Name</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cardHover border border-line focus-within:border-purple/60">
                    <User className="w-4 h-4 text-purple" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent text-xs text-white w-full focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1.5">Email Address</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cardHover border border-line focus-within:border-purple/60">
                    <Mail className="w-4 h-4 text-pink" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent text-xs text-white w-full focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1.5">Role / Title</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cardHover border border-line focus-within:border-purple/60">
                    <Shield className="w-4 h-4 text-purple" />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="bg-transparent text-xs text-white w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1.5">Organization</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cardHover border border-line focus-within:border-purple/60">
                    <Building className="w-4 h-4 text-pink" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="bg-transparent text-xs text-white w-full focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full bg-cardHover border border-line rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-muted focus:outline-none focus:border-purple/60 resize-none"
                />
              </div>

              {/* GitHub Connection */}
              <div className="p-4 rounded-2xl border border-line bg-sidebar/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple" />
                    <span className="text-xs font-bold text-white">GitHub Connection</span>
                  </div>
                  {profile?.hasGitHubToken ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green/20 text-green border border-green/30">
                      Connected (Token Encrypted)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">
                      Public Access Only
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-secondary block mb-1">GitHub Username</label>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="e.g. LAXMIDHARLHS974"
                      className="w-full bg-card border border-line rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple/60"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-secondary block mb-1">
                      Update Personal Access Token (Masked)
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-line focus-within:border-purple/60">
                      <Key className="w-3.5 h-3.5 text-muted" />
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full bg-transparent text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl btn-gradient text-xs font-semibold shadow-glow disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving Changes..." : "Save Profile"}
                </button>
              </div>
            </form>

            {/* Active Sessions */}
            <div className="pt-6 border-t border-line space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-purple" />
                Active Sessions ({sessions.length})
              </h3>
              <div className="space-y-2">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3 rounded-xl border border-line bg-cardHover/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{sess.userAgent}</span>
                      <span className="text-[10px] text-secondary">
                        IP: {sess.ipAddress} • Last Active: {new Date(sess.lastActive).toLocaleDateString()}
                      </span>
                    </div>
                    {sess.id !== "sess_current" ? (
                      <button
                        onClick={() => handleRevokeSession(sess.id)}
                        className="text-red hover:text-red-dark p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        title="Revoke session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple/20 text-purple border border-purple/30">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
