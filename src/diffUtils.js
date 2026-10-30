/**
 * CodeGuard AI — Advanced Unified Diff Parsing & Utilities
 */

const BINARY_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "svg",
  "pdf", "zip", "tar", "gz", "7z", "jar", "war",
  "exe", "dll", "so", "dylib", "wasm", "bin",
  "lock", "parquet", "mp3", "mp4", "mov"
]);

const IGNORED_FILENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "composer.lock",
  "Cargo.lock",
  "Gemfile.lock",
  "poetry.lock"
]);

/**
 * Computes files-changed, lines-added, lines-removed directly from unified diff text.
 */
function parseDiffStats(diffText) {
  const text = String(diffText || "");
  const fileMatches = text.match(/^diff --git /gm) || [];
  const filesChanged = fileMatches.length;

  let added = 0;
  let removed = 0;
  for (const line of text.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) added++;
    else if (line.startsWith("-")) removed++;
  }

  return {
    filesChanged: filesChanged || (text.trim() ? 1 : 0),
    linesAdded: added,
    linesRemoved: removed,
  };
}

/**
 * Parses individual files, their hunks, and changed line intervals from a unified diff.
 */
function parseDiffFiles(diffText) {
  const text = String(diffText || "");
  const files = [];
  const rawFileChunks = text.split(/^diff --git /m).filter(Boolean);

  for (const chunk of rawFileChunks) {
    const lines = chunk.split("\n");
    const headerLine = lines[0] || "";
    // e.g. "a/src/app.js b/src/app.js"
    const paths = headerLine.trim().split(" ");
    let filePath = "unknown";
    if (paths.length >= 2) {
      filePath = paths[1].replace(/^[b]/, "").replace(/^\//, "");
    }

    const ext = filePath.split(".").pop().toLowerCase();
    const isBinary = BINARY_EXTENSIONS.has(ext) || chunk.includes("Binary files differ");
    const isLockfile = IGNORED_FILENAMES.has(filePath.split("/").pop());

    // Parse hunks to extract valid line ranges
    const hunks = [];
    let currentHunk = null;

    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
      if (hunkMatch) {
        const start = parseInt(hunkMatch[2], 10);
        const count = hunkMatch[3] !== undefined ? parseInt(hunkMatch[3], 10) : 1;
        currentHunk = {
          startLine: start,
          endLine: start + Math.max(1, count) - 1,
        };
        hunks.push(currentHunk);
      }
    }

    files.push({
      filePath,
      isBinary,
      isLockfile,
      hunks,
      rawDiff: "diff --git " + chunk,
    });
  }

  return files;
}

/**
 * Filters out binary files and huge generated lockfiles from the diff sent to Gemini.
 */
function filterDiffForAI(diffText, maxChars = 45000) {
  const files = parseDiffFiles(diffText);
  if (!files.length) {
    return truncateDiff(diffText, maxChars);
  }

  const cleanChunks = [];
  let currentLength = 0;

  for (const f of files) {
    if (f.isBinary) {
      cleanChunks.push(`diff --git a/${f.filePath} b/${f.filePath}\n[Binary file changed - skipped from AI review]\n`);
      continue;
    }
    if (f.isLockfile) {
      cleanChunks.push(`diff --git a/${f.filePath} b/${f.filePath}\n[Package lockfile changed - skipped from AI review]\n`);
      continue;
    }

    if (currentLength + f.rawDiff.length <= maxChars) {
      cleanChunks.push(f.rawDiff);
      currentLength += f.rawDiff.length;
    } else {
      const remaining = maxChars - currentLength;
      if (remaining > 500) {
        cleanChunks.push(f.rawDiff.slice(0, remaining) + "\n... [diff truncated for size] ...");
      }
      break;
    }
  }

  return cleanChunks.join("\n");
}

/**
 * Keeps the diff sent to the model within a safe size boundary.
 */
function truncateDiff(diffText, maxChars = 45000) {
  const text = String(diffText || "");
  if (text.length <= maxChars) return text;
  return (
    text.slice(0, maxChars) +
    `\n\n... [diff truncated, ${text.length - maxChars} more characters omitted for model safety] ...`
  );
}

/**
 * Verifies if a finding's reported file and line match the actual diff.
 */
function verifyFindingInDiff(finding, diffFiles) {
  if (!diffFiles || !diffFiles.length) return true;
  const match = diffFiles.find(
    (f) => f.filePath === finding.file || f.filePath.endsWith(finding.file) || finding.file.endsWith(f.filePath)
  );
  if (!match) return false;
  if (!finding.line || finding.line <= 0) return true;

  // Check if line falls in or near any changed hunk (tolerance of +/- 15 lines)
  return match.hunks.some(
    (h) => finding.line >= h.startLine - 15 && finding.line <= h.endLine + 15
  );
}

module.exports = {
  parseDiffStats,
  parseDiffFiles,
  filterDiffForAI,
  truncateDiff,
  verifyFindingInDiff,
};
