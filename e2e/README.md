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

## WT-002 continuation (supersedes the historical execution commands above)

PRs #6/#7 are merged on web main and their anonymous/form cases remain. The two
credential-gated tests are replaced by always-executed synthetic local scenarios;
no missing-secret skip is needed. WT-001 issue/history is not closed or deleted.

1. Check out backend WT-002 PR https://github.com/choru90/worktime/pull/16.
2. In backend: `bash ./gradlew e2eServer --no-daemon`.
3. In web: `npm ci && npx playwright install chromium`.
4. Run `npx playwright test && node scripts/audit-e2e.mjs`.
5. Stop the backend; its H2 memory DB and all generated accounts disappear.

CI pins the backend to an exact SHA in `.github/workflows/e2e.yml`. It launches the
same disposable server and runs 11 Chromium tests, with zero skip/flaky tolerance,
required scenario titles, exact count, JUnit/JSON/HTML and failure trace/video/
screenshot evidence. No production deployment is invoked. `WT_E2E_BASE_URL` is
rejected because these fixtures must only target the disposable loopback server.
Do not run this suite against an unrelated service already listening on 8080.

Flow mapping:

| Step | Verification |
| --- | --- |
| Owner login, worker registration, invitation, wage contract | Real browser UI and real HTTP responses |
| Worker invitation signup/login | Separate browser context; no injected session |
| Owner schedule creation | Real browser form |
| Worker schedule confirmation | Real API; `/my/schedules` has no approval control |
| Worker clock-in/out | Real browser dashboard |
| Set deterministic 90-minute past work | Real correction API; worker correction UI missing |
| Owner sees correction reason and approves current revision | Real browser worklog table/dialog |
| Payroll 15002 = HALF_UP(10001 * 1.5) | Independent expectation, owner and worker browser detail + real API |
| Persistence | Read-after-write API shows CONFIRMED, correctionCount=1, durationMinutes=90; direct DB assertions live in backend JUnit |
| Tenant/worker isolation, write rejection, JWT expiry/relogin | Real API matrix and browser Axios/session handling |

Per-test UUID emails and fresh contexts isolate parallel/repeated executions.
The full suite uses a single worker and no retries so transient failures are
reported. A previous-month mid-month date avoids waiting and midnight/month-end
races. Backend retains separate raw coverage and MySQL concurrency/migration
checks. No break/night/overtime/weekly holiday premiums are claimed; these rules
are not implemented/confirmed. Cross-month payroll attribution remains a reported
backend decision, not a completed browser scenario. Android and load/recovery
checks are follow-up work after these web/backend gates.

## WT-002 additional regression (user follow-up)

The current full suite is **28 tests** (17 added to the initial 11); the previous
11-case results remain historical evidence. `scripts/audit-e2e.mjs` now requires
28 passing cases and every added scenario, with zero failures/skips/flaky results.
The workflow pins backend `e76b9b251421a841c21c6c02bc0e0a4610083f2a`.

Added scenarios:
- Stale owner review after worker correction returns 409, displays the refreshed
  revision and does not change payroll until a current-revision approval.
- Owner rejection reason survives reload; corrected resubmission is excluded from
  pay until browser reapproval.
- Repeated approval and clock-in/out clicks create one operation/record/pay item.
- Split shifts at a changed historical contract produce the same independently
  expected 15002 in owner summary/detail and worker detail.
- Worker direct visits to owner workers/payroll/store/dashboard pages are blocked
  before management components mount, preserving login.
- Reload restores login; logout/back/direct navigation cannot restore it.
- Used/unknown/expired invitation codes reject signup and retain account isolation.
- Approval 500, disconnected network and delayed response never report false
  success; retry commits exactly once. Failed worker creation retains form input.
- Deliberately reversed real payroll HTTP responses cannot replace the last
  selected year/month/worker result.

Fault tests intentionally intercept only the selected failed/delayed response;
all successful business operations use the real local backend. Worker correction
remains an API step because its UI is absent. Invitation expiry uses an authenticated
owner-only fixture in **backend src/test**, active solely under `wt002-e2e`:
`POST /api/e2e/fixtures/workers/{id}/expire-invite`. It expires one synthetic code,
requires production ownership authorization and is absent from the production
JAR. No global clock mutation or 24-hour wait is needed.

Regression tests reproduced two UI defects and the PR fixes them: owner-only
routes previously mounted management pages for workers, and older payroll
responses overwrote newer filter results. Clock actions also use an immediate
in-flight guard to reject repeated events before React rerenders.

Month-crossing payroll attribution is still an open rule decision from the
initial report. No expected policy has been invented and no skipped case hides
that decision. Merge/deployment/coverage exclusions remain prohibited without
CEO approval.
