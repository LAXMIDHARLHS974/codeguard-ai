const { detectLanguageAndFramework } = require("../src/services/testGenService");

describe("Test Generation Service", () => {
  test("detects Python and pytest from python diff", () => {
    const pythonDiff = "diff --git a/app.py b/app.py\n+def login_user(username):\n+    return True";
    const res = detectLanguageAndFramework(pythonDiff);
    expect(res.language).toBe("python");
    expect(res.framework).toBe("pytest");
  });

  test("detects Java and JUnit 5 from java diff", () => {
    const javaDiff = "diff --git a/App.java b/App.java\n+public class App {\n+    public void execute() {}\n+}";
    const res = detectLanguageAndFramework(javaDiff);
    expect(res.language).toBe("java");
    expect(res.framework).toBe("junit5");
  });

  test("detects TypeScript and Jest from typescript diff", () => {
    const tsDiff = "diff --git a/app.ts b/app.ts\n+interface UserProfile {\n+  id: string;\n+}";
    const res = detectLanguageAndFramework(tsDiff);
    expect(res.language).toBe("typescript");
    expect(res.framework).toBe("jest");
  });

  test("defaults to JavaScript and Jest for standard JS diffs", () => {
    const jsDiff = "diff --git a/app.js b/app.js\n+function test() {}";
    const res = detectLanguageAndFramework(jsDiff);
    expect(res.language).toBe("javascript");
    expect(res.framework).toBe("jest");
  });

  test("honors explicit language override", () => {
    const res = detectLanguageAndFramework("random text", "python");
    expect(res.language).toBe("python");
    expect(res.framework).toBe("pytest");
  });
});
