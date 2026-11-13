# WT-001 browser automation (Issue #15)

Run against a **separate development environment**, never production:

```bash
npm ci
npm install --no-save --package-lock=false @playwright/test@1.56.1
npx playwright install chromium
npx playwright test
```

Local Vite serves the frontend and proxies /api to localhost:8080. The anonymous redirect smoke test does not require a backend. API-backed login tests require a running backend, an isolated development DB, and optional environment variables `WT_E2E_OWNER_EMAIL`, `WT_E2E_OWNER_PASSWORD`. Invalid-login test uses `WT_E2E_INVALID_EMAIL` and `WT_E2E_INVALID_PASSWORD`. Never print or commit credentials. CI without a backend runs only the anonymous smoke test; skipped tests are **not** passes.

`WT_E2E_BASE_URL` may point at a separately approved dev web URL; no production URL is allowed. Do not run destructive fixtures against shared data. Browser traces, screenshots and video are retained only on failure and GitHub Actions artifacts expire after 7 days. Treat artifacts as potentially sensitive; do not supply real customer data.

WT-001 original execution logs and defect ledger were not located during initial GitHub investigation. Do not close or delete WT-001. Full owner→worker→schedule→clock-in/out→approval→payroll E2E remains blocked until isolated test data and cleanup are available. Kotlin/JUnit tests live in the API repository. Legal payroll calculations are outside the scope of the current estimated-pay implementation.
