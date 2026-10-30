const { parsePrUrl } = require("../src/githubService");

describe("GitHub Service URL Parsing", () => {
  test("successfully parses standard GitHub PR URL", () => {
    const res = parsePrUrl("https://github.com/expressjs/express/pull/5800");
    expect(res.owner).toBe("expressjs");
    expect(res.repo).toBe("express");
    expect(res.number).toBe(5800);
  });

  test("successfully parses URL with trailing slash or sub-path", () => {
    const res = parsePrUrl("https://github.com/facebook/react/pull/1234/files");
    expect(res.owner).toBe("facebook");
    expect(res.repo).toBe("react");
    expect(res.number).toBe(1234);
  });

  test("strips .git suffix from repo name", () => {
    const res = parsePrUrl("https://github.com/owner/repo.git/pull/42");
    expect(res.repo).toBe("repo");
    expect(res.number).toBe(42);
  });

  test("throws ValidationError on non-GitHub domain", () => {
    expect(() => parsePrUrl("https://gitlab.com/owner/repo/pull/42")).toThrow(
      "Only github.com repository URLs are supported"
    );
  });

  test("throws ValidationError on invalid URL pattern", () => {
    expect(() => parsePrUrl("https://github.com/owner/repo/issues/42")).toThrow(
      "Expected format: https://github.com/owner/repository/pull/42"
    );
  });

  test("throws ValidationError on empty or missing URL", () => {
    expect(() => parsePrUrl("")).toThrow("PR URL is required");
    expect(() => parsePrUrl(null)).toThrow("PR URL is required");
  });
});
