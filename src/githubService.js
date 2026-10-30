const config = require("./config/env");
const { ValidationError, NotFoundError, RateLimitError, ExternalServiceError } = require("./utils/errors");

/**
 * Validates and parses a GitHub Pull Request URL.
 * Example: https://github.com/owner/repo/pull/42
 */
function parsePrUrl(prUrl) {
  if (!prUrl || typeof prUrl !== "string") {
    throw new ValidationError("PR URL is required");
  }

  const clean = prUrl.trim();
  let parsedUrl;
  try {
    parsedUrl = new URL(clean);
  } catch {
    throw new ValidationError("Invalid URL format. Expected https://github.com/owner/repo/pull/42");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new ValidationError("Only HTTP(S) GitHub URLs are supported");
  }

  if (parsedUrl.hostname !== "github.com" && parsedUrl.hostname !== "www.github.com") {
    throw new ValidationError("Only github.com repository URLs are supported");
  }

  const match = parsedUrl.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/.*)?$/);
  if (!match) {
    throw new ValidationError(
      "That doesn't look like a GitHub PR URL. Expected format: https://github.com/owner/repository/pull/42"
    );
  }

  const [, owner, rawRepo, numberStr] = match;
  const repo = rawRepo.replace(/\.git$/, "");
  const number = parseInt(numberStr, 10);

  if (isNaN(number) || number <= 0) {
    throw new ValidationError("Invalid Pull Request number in URL");
  }

  return { owner, repo, number };
}

/**
 * Constructs sanitized authorization headers for GitHub REST API calls.
 */
function getAuthHeaders(accept, customToken = null) {
  const token = customToken || config.GITHUB_TOKEN || "";
  const headers = {
    Accept: accept,
    "User-Agent": "CodeGuard-AI-Production/2.0",
  };
  if (token) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

/**
 * Checks GitHub response for rate limits and errors.
 */
function handleGitHubResponseErrors(res, owner, repo, number, operation = "metadata") {
  if (res.status === 404) {
    throw new NotFoundError(
      `Pull Request not found: ${owner}/${repo}#${number}. If this is a private repository, provide a valid GitHub Personal Access Token or OAuth connection.`
    );
  }

  if (res.status === 403 || res.status === 429) {
    const rateLimitRemaining = res.headers.get("x-ratelimit-remaining");
    const rateLimitReset = res.headers.get("x-ratelimit-reset");
    const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset, 10) * 1000).toLocaleTimeString() : "soon";

    if (rateLimitRemaining === "0" || res.status === 429) {
      throw new RateLimitError(
        `GitHub API rate limit exceeded. Rate limit resets at ${resetDate}. Configure a GITHUB_TOKEN to increase your limit to 5,000 requests/hour.`
      );
    }

    throw new ExternalServiceError(
      `GitHub API access forbidden for ${owner}/${repo}#${number}. Check token permissions.`,
      403
    );
  }

  if (!res.ok) {
    throw new ExternalServiceError(
      `GitHub API returned status ${res.status} while fetching PR ${operation}`,
      res.status >= 500 ? 502 : res.status
    );
  }
}

/**
 * Fetches all changed files for a PR, handling pagination.
 */
async function fetchPullRequestFiles(owner, repo, number, token = null) {
  const files = [];
  let page = 1;
  const perPage = 100;
  const maxPages = 3; // Safety cap: up to 300 files

  while (page <= maxPages) {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files?per_page=${perPage}&page=${page}`;
    const res = await fetch(url, { headers: getAuthHeaders("application/vnd.github+json", token) });
    handleGitHubResponseErrors(res, owner, repo, number, "files list");

    const pageFiles = await res.json();
    if (!Array.isArray(pageFiles) || pageFiles.length === 0) break;

    for (const f of pageFiles) {
      files.push({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
      });
    }

    if (pageFiles.length < perPage) break;
    page++;
  }

  return files;
}

/**
 * Fetches PR metadata and unified diff for a PR.
 */
async function fetchPullRequest(prUrl, customToken = null) {
  const { owner, repo, number } = parsePrUrl(prUrl);
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;

  const [metaRes, diffRes] = await Promise.all([
    fetch(apiUrl, { headers: getAuthHeaders("application/vnd.github+json", customToken) }),
    fetch(apiUrl, { headers: getAuthHeaders("application/vnd.github.v3.diff", customToken) }),
  ]);

  handleGitHubResponseErrors(metaRes, owner, repo, number, "metadata");
  handleGitHubResponseErrors(diffRes, owner, repo, number, "diff");

  const meta = await metaRes.json();
  const diff = await diffRes.text();

  let filesList = [];
  try {
    filesList = await fetchPullRequestFiles(owner, repo, number, customToken);
  } catch (err) {
    console.warn(`[GitHub] Could not fetch detailed file list: ${err.message}`);
  }

  return {
    pr: {
      number,
      title: meta.title || `${owner}/${repo}#${number}`,
      owner,
      repo,
      author: meta.user?.login || "unknown",
      htmlUrl: meta.html_url || prUrl,
      baseBranch: meta.base?.ref || "main",
      headBranch: meta.head?.ref || "feature",
      isDraft: Boolean(meta.draft),
    },
    stats: {
      filesChanged: meta.changed_files ?? filesList.length,
      linesAdded: meta.additions ?? 0,
      linesRemoved: meta.deletions ?? 0,
    },
    files: filesList,
    diff,
  };
}

/**
 * Fetches pull requests for a given repository (owner/repo).
 */
async function fetchRepoPullRequests(owner, repo, state = "open", customToken = null) {
  if (!owner || !repo) {
    throw new ValidationError("Owner and repository name are required");
  }

  const cleanOwner = String(owner).trim();
  const cleanRepo = String(repo).trim().replace(/\.git$/, "");
  const url = `https://api.github.com/repos/${cleanOwner}/${cleanRepo}/pulls?state=${encodeURIComponent(state)}&per_page=30`;

  const res = await fetch(url, { headers: getAuthHeaders("application/vnd.github+json", customToken) });
  if (!res.ok) {
    if (res.status === 404) {
      throw new NotFoundError(`Repository ${cleanOwner}/${cleanRepo} not found or inaccessible`);
    }
    if (res.status === 403) {
      throw new RateLimitError("GitHub API rate limit exceeded or access forbidden");
    }
    throw new ExternalServiceError(`Failed to fetch pull requests from GitHub (${res.status})`);
  }

  const prs = await res.json();
  if (!Array.isArray(prs)) return [];

  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user?.login || "unknown",
    state: pr.state,
    htmlUrl: pr.html_url,
    baseBranch: pr.base?.ref || "main",
    headBranch: pr.head?.ref || "feature",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    isDraft: Boolean(pr.draft),
  }));
}

module.exports = {
  parsePrUrl,
  fetchPullRequest,
  fetchPullRequestFiles,
  fetchRepoPullRequests,
};
