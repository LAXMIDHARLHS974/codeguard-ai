const {
  parseDiffStats,
  parseDiffFiles,
  filterDiffForAI,
  truncateDiff,
  verifyFindingInDiff,
} = require("../src/utils/diffUtils");

describe("Diff Utilities", () => {
  const sampleDiff = `diff --git a/src/app.js b/src/app.js
index 1234567..89abcdef 100644
--- a/src/app.js
+++ b/src/app.js
@@ -10,4 +10,6 @@ function test() {
+  const token = "insecure-secret";
+  console.log(token);
 }
diff --git a/assets/logo.png b/assets/logo.png
Binary files differ`;

  test("parseDiffStats accurately counts files, additions, and deletions", () => {
    const stats = parseDiffStats(sampleDiff);
    expect(stats.filesChanged).toBe(2);
    expect(stats.linesAdded).toBe(2);
    expect(stats.linesRemoved).toBe(0);
  });

  test("parseDiffFiles extracts file hunks and identifies binary files", () => {
    const files = parseDiffFiles(sampleDiff);
    expect(files.length).toBe(2);

    const sourceFile = files[0];
    expect(sourceFile.filePath).toBe("src/app.js");
    expect(sourceFile.isBinary).toBe(false);
    expect(sourceFile.hunks.length).toBe(1);
    expect(sourceFile.hunks[0].startLine).toBe(10);

    const binaryFile = files[1];
    expect(binaryFile.isBinary).toBe(true);
  });

  test("filterDiffForAI skips binary files to save model context", () => {
    const filtered = filterDiffForAI(sampleDiff, 1000);
    expect(filtered).toContain("src/app.js");
    expect(filtered).toContain("[Binary file changed - skipped from AI review]");
    expect(filtered).not.toContain("Binary files differ");
  });

  test("truncateDiff honors maximum character constraints", () => {
    const longDiff = "a".repeat(100);
    const truncated = truncateDiff(longDiff, 40);
    expect(truncated.length).toBeGreaterThan(40);
    expect(truncated).toContain("[diff truncated");
    expect(truncated.startsWith("a".repeat(40))).toBe(true);
  });

  test("verifyFindingInDiff checks if finding line aligns with changed hunks", () => {
    const files = parseDiffFiles(sampleDiff);
    const validFinding = { file: "src/app.js", line: 11 };
    expect(verifyFindingInDiff(validFinding, files)).toBe(true);

    const distantFinding = { file: "src/app.js", line: 500 };
    expect(verifyFindingInDiff(distantFinding, files)).toBe(false);

    const nonexistentFileFinding = { file: "src/other.js", line: 10 };
    expect(verifyFindingInDiff(nonexistentFileFinding, files)).toBe(false);
  });
});
