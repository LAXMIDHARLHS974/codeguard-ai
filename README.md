# CodeGuard AI — Intelligent Security & Code Review Platform

CodeGuard AI is an automated, AI-powered security and code review platform designed for enterprise engineering teams. It analyzes GitHub Pull Requests and unified git diffs, detects vulnerabilities with Gemini, calculates explainable multi-dimensional risk scores, generates regression test suites across multiple frameworks, and enforces automated merge gating policies.

---

## Key Capabilities

- **Automated Pull Request Review:** Evaluates public and private GitHub pull requests directly through the GitHub REST API with pagination, rate limit awareness, and binary artifact filtering.
- **Unified Diff Security Engine:** Detects OWASP Top 10 vulnerabilities (SQLi, XSS, SSRF, hardcoded secrets, authentication/authorization flaws), runtime logic defects, missing null guards, and missing validation.
- **Adversarial Prompt-Injection Guardrails:** Isolates untrusted repository code inside strict delimiter boundaries and system instructions, preventing prompt injection attacks from malicious PR comments.
- **Explainable Risk Intelligence:** Generates an explainable 0–100 risk score factoring severity base weight, exploitability scaling, model confidence, duplicate dampening, and code churn blast radius.
- **AI Test Lab:** Synthesizes framework-specific unit and regression tests for **JavaScript/TypeScript (Jest)**, **Python (pytest)**, and **Java (JUnit 5)** with verified test names.
- **Persistent Database & Tenancy:** Full PostgreSQL schema with tables for users, repositories, pull requests, analyses, findings, tests, and notifications, with zero-config local fallback for development.
- **Modern React & Tailwind UI:** Sleek, responsive, high-performance interface with dark mode, interactive findings filters, animated circular risk gauge, copy/download actions, and audit history.

---

## Architecture Overview

```
                                      +-----------------------------------+
                                      |     React 18 + Tailwind Client    |
                                      | (Vite SPA served from /client/dist)|
                                      +-----------------+-----------------+
                                                        |  HTTP / JSON
                                                        v
                                      +-----------------+-----------------+
                                      |     Express.js API Server         |
                                      |  (Helmet, CORS, Rate Limiters)    |
+--------------------------+          +--------+--------+--------+--------+
|    GitHub REST API       |<------------------+        |        |
| (PR Metadata, Diff, Files|                            |        |
+--------------------------+                            |        +---------------------------+
                                                        v                                    v
                                      +-----------------+-----------------+    +-------------+-------------+
                                      |    Google Gemini AI Engine        |    |    PostgreSQL Database    |
                                      | (@google/genai / Structured JSON) |    | (Tenants, History, Alerts)|
                                      +-----------------------------------+    +---------------------------+
```

---

## API Specifications

### 1. Health & Readiness Probes
- `GET /api/health`: Returns service health status, configured credentials, uptime, and database connectivity.
- `GET /api/ready`: Readiness probe for cloud orchestrators (Render / Kubernetes).

### 2. Analysis Endpoints
- `POST /api/analyze/pr`:
  ```json
  {
    "prUrl": "https://github.com/owner/repository/pull/42",
    "githubToken": "optional_pat_for_private_repos"
  }
  ```
  Returns: `{ analysisId, pr, stats, riskScore, riskLevel, riskBreakdown, findings, source: "github" }`

- `POST /api/analyze/diff`:
  ```json
  {
    "diff": "diff --git a/app.js b/app.js ...",
    "title": "Optional Review Session Title"
  }
  ```
  Returns: `{ analysisId, pr, stats, riskScore, riskLevel, riskBreakdown, findings, source: "diff" }`

- `GET /api/analyze/:id`: Retrieves a specific analysis and its associated findings.

### 3. AI Test Lab
- `POST /api/tests/generate`:
  ```json
  {
    "analysisId": "uuid-of-existing-analysis",
    "language": "javascript | typescript | python | java"
  }
  ```
  Returns: `{ language, framework, testNames: [...], code: "...", executed: false, status: "generated_ready_for_execution" }`

### 4. History & Workspace Management
- `GET /api/history`: Lists persistent analysis records for the authenticated session.
- `DELETE /api/history/:id`: Removes an analysis record.
- `GET /api/workspace/repositories`: Lists connected repositories.
- `POST /api/workspace/repositories`: Registers a new repository.
- `GET /api/workspace/notifications`: Fetches security notifications and alerts.
- `PATCH /api/workspace/notifications/:id/read`: Marks notification as read.

---

## Local Development Quickstart

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/LAXMIDHARLHS974/codeguard-ai.git
cd codeguard-ai

# Install backend dependencies
npm install

# Install client dependencies
npm --prefix client install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate `.env` with your credentials:
```env
PORT=8787
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GITHUB_TOKEN=
DATABASE_URL=
JWT_SECRET=super-secret-local-jwt-token
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 3. Build & Run
```bash
# Build the production React frontend bundle
npm run build

# Start the unified production server
npm start
```
Visit `http://localhost:8787` in your browser.

### 4. Development Mode (Hot Reload)
```bash
# Terminal 1: Run Express backend with auto-reload
npm run dev

# Terminal 2: Run Vite client dev server (proxies /api to 8787)
cd client && npm run dev
```

---

## Automated Test Suite

CodeGuard includes comprehensive unit and integration tests powered by **Jest** and **Supertest**:

```bash
npm test
```

### Test Coverage Highlights:
- **Diff Parsing (`tests/diffUtils.test.js`):** Unified diff stats, file extraction, lockfile/binary filtering, hunk boundaries, and line validation.
- **Risk Scoring (`tests/riskScorer.test.js`):** Severity weighting, exploitability scaling, duplicate dampening, code churn blast radius, and risk tiering.
- **GitHub Integration (`tests/githubService.test.js`):** PR URL parsing, SSRF domain validation, rate limit responses.
- **Gemini Engine (`tests/analysisService.test.js`):** JSON array extraction, markdown fence stripping, deduplication, schema validation.
- **Test Lab (`tests/testGenService.test.js`):** Multi-language detection (Jest, Pytest, JUnit 5) and test name alignment.
- **Database & Isolation (`tests/dbService.test.js`):** Analysis persistence, foreign key relationships, cross-user data isolation.
- **API Endpoints (`tests/api.test.js`):** Health and readiness probes, input validation, 400/404 error schemas, history API.
- **User & AI Assistant (`tests/userAssistant.test.js`):** Profile management, session revocation, real-time defensive assistant queries, dashboard stats.

---

## Production Deployment to Render

### Option A: Render Blueprint (Infrastructure-as-Code)
The repository includes a ready-to-use `render.yaml` blueprint:
1. In your Render Dashboard, click **Blueprints** -> **New Blueprint Instance**.
2. Connect your `codeguard-ai` repository.
3. Render automatically provisions:
   - **Web Service:** `codeguard-ai` (Node.js runtime, build: `npm install && npm run build`, start: `node server.js`).
   - **PostgreSQL Database:** `codeguard-postgres` (Managed database, connection string linked automatically).
4. Supply your `GEMINI_API_KEY` in the environment settings prompt.
5. Deploy.

### Option B: Manual Web Service
1. **Runtime:** Node
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `node server.js`
4. **Health Check Path:** `/api/ready`
5. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: `<your_key>`
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `GITHUB_TOKEN`: `<your_pat>` (optional)
   - `DATABASE_URL`: `<render_internal_postgres_url>`

---

## Security & Reliability Design Rules

1. **No Hardcoded Secrets:** Credentials never enter client-side bundles.
2. **No Global State Leaks:** The legacy `lastAnalysis` global variable has been replaced with immutable UUID analysis records tied to tenant sessions.
3. **Graceful Degeneration:** If PostgreSQL is temporarily unavailable, the service continues to operate locally without downtime.
4. **Adversarial Resistance:** All user-supplied diffs are treated as untrusted code data.
5. **Explainable Metrics:** The risk score is explainable with a full breakdown of contributing factors.
