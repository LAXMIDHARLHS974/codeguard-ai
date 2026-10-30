const { extractJsonArray, deduplicateFindings } = require("../src/services/analysisService");

describe("Analysis Service Utilities", () => {
  test("extractJsonArray extracts array from markdown fenced code block", () => {
    const raw = "```json\n[{\"title\": \"SQL Injection\", \"severity\": \"critical\"}]\n```";
    const parsed = extractJsonArray(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe("SQL Injection");
  });

  test("extractJsonArray extracts array surrounded by extraneous model conversational text", () => {
    const raw = "Here are your findings:\n\n[{\"title\": \"XSS\", \"severity\": \"high\"}]\n\nHope this helps!";
    const parsed = extractJsonArray(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe("XSS");
  });

  test("extractJsonArray returns empty array for empty JSON array string", () => {
    expect(extractJsonArray("[]")).toEqual([]);
    expect(extractJsonArray("```json\n[]\n```")).toEqual([]);
  });

  test("extractJsonArray returns null for non-JSON or malformed syntax", () => {
    expect(extractJsonArray("This is not JSON at all")).toBeNull();
    expect(extractJsonArray("[{ unclosed json")).toBeNull();
  });

  test("deduplicateFindings eliminates duplicate findings on same file, line, and title", () => {
    const findings = [
      { file: "src/app.js", line: 10, category: "security", title: "SQL Injection" },
      { file: "src/app.js", line: 10, category: "security", title: "SQL Injection" },
      { file: "src/app.js", line: 20, category: "security", title: "SQL Injection" },
    ];

    const deduped = deduplicateFindings(findings);
    expect(deduped.length).toBe(2);
  });
});
