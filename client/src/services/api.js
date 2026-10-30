// CodeGuard AI — Centralized API Client

const SESSION_KEY = "codeguard_session_id";
const API_URL_KEY = "codeguard_api_url";
const GH_TOKEN_KEY = "codeguard_github_token";

export function getSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = "cg_session_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function getApiBaseUrl() {
  const custom = localStorage.getItem(API_URL_KEY);
  if (custom !== null && custom !== undefined && custom !== "") {
    return custom.replace(/\/+$/, "");
  }
  // Default to same origin for production and Vite proxy in dev
  return "";
}

export function setApiBaseUrl(url) {
  if (!url) {
    localStorage.removeItem(API_URL_KEY);
  } else {
    localStorage.setItem(API_URL_KEY, url.trim().replace(/\/+$/, ""));
  }
}

export function getSavedGitHubToken() {
  return localStorage.getItem(GH_TOKEN_KEY) || "";
}

export function setSavedGitHubToken(token) {
  if (!token) {
    localStorage.removeItem(GH_TOKEN_KEY);
  } else {
    localStorage.setItem(GH_TOKEN_KEY, token.trim());
  }
}

async function request(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers = {
    "Content-Type": "application/json",
    "X-Session-Id": getSessionId(),
    ...options.headers,
  };

  const savedToken = getSavedGitHubToken();
  if (savedToken && !headers["X-GitHub-Token"]) {
    headers["X-GitHub-Token"] = savedToken;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.code = data.code;
      err.details = data.details;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(`Cannot connect to CodeGuard backend at ${url || "local server"}. Verify server is running.`);
    }
    throw err;
  }
}

export const api = {
  checkHealth: () => request("/api/health"),
  checkReadiness: () => request("/api/ready"),

  analyzePr: (prUrl, githubToken = null) =>
    request("/api/analyze/pr", {
      method: "POST",
      body: JSON.stringify({ prUrl, githubToken: githubToken || undefined }),
    }),

  analyzeDiff: (diff, title = "CodeGuard Diff Review") =>
    request("/api/analyze/diff", {
      method: "POST",
      body: JSON.stringify({ diff, title }),
    }),

  getAnalysis: (id) => request(`/api/analyze/${id}`),

  generateTests: ({ analysisId, diff, findings, language }) =>
    request("/api/tests/generate", {
      method: "POST",
      body: JSON.stringify({ analysisId, diff, findings, language }),
    }),

  listHistory: (limit = 20, offset = 0) => request(`/api/history?limit=${limit}&offset=${offset}`),
  getHistoryItem: (id) => request(`/api/history/${id}`),
  deleteHistoryItem: (id) => request(`/api/history/${id}`, { method: "DELETE" }),

  listRepositories: () => request("/api/workspace/repositories"),
  addRepository: (repo) =>
    request("/api/workspace/repositories", {
      method: "POST",
      body: JSON.stringify(repo),
    }),
  deleteRepository: (id) =>
    request(`/api/workspace/repositories/${id}`, {
      method: "DELETE",
    }),

  listNotifications: () => request("/api/workspace/notifications"),
  markNotificationRead: (id) =>
    request(`/api/workspace/notifications/${id}/read`, {
      method: "PATCH",
    }),

  getSession: () => request("/api/workspace/session"),
};
