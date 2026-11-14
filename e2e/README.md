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

## WT-002 concurrent sessions and browser compatibility (second follow-up)

Current matrix: **42 distinct scenarios / 50 executions**: desktop Chromium 40,
Firefox 4 core flows, WebKit 4 core flows, mobile Chromium 2. The earlier 11/28
results remain historical records. `npx playwright test` runs the entire matrix;
`--project=chromium --project=mobile-chromium` runs the local 42-case subset.
The CI audit requires the full matrix, project counts and core scenarios in each
alternative browser; a local subset cannot certify full completion.

Added coverage includes two isolated sessions of the same authorized owner racing
approve/reject (a foreign owner still has no review rights); server-side approval
committed before the browser loses its response and subsequent retry; logout and
another account login with an old in-flight response; path/body/store/contract ID
tampering; account unlink/relink revoking the old session's resource ownership;
name/blank/reason-length/decimal-wage/time bounds; keyboard and mobile controls.

A new test-classpath-only owner-authorized fixture unlinks one synthetic worker
account for the relink scenario:
`POST /api/e2e/fixtures/workers/{id}/unlink-account`. Public application code and
production JAR do not include either fixture. The workflow pins backend commit
`e74daa78d3150659edd5cdae5af0762789162f79`.

Name bounds now match the existing DB limit of 100 characters and return 400
instead of an SQL error. An explicitly supplied rejection reason must contain a
non-whitespace character; an omitted/null reason retains the existing optional
API contract. Browser hourly wage input accepts 0.01 increments, matching the
existing two-decimal DB field. Boundary tests exercise both accepted and rejected
values and verify unchanged state after failure.

Resignation is a **characterization** while policy is pending: active becomes
false, owner historical payroll is retained, and the currently linked employee's
old token still reads historical data. This is not a claim that post-resignation
write rights/session revocation are approved or fixed. No unapproved policy is
inferred. Month-crossing attribution remains the earlier open decision.

Some local managed environments lack root access and WebKit/Firefox shared
libraries. Record that limitation separately; CI installs all three engines with
system dependencies and must execute every matrix case without skips. Deliberate
lost-response injection executes the real backend first, then aborts delivery;
this is distinct from the earlier pre-commit 500/offline tests.

## Approved UTC payroll/retirement policies and completed worker actions

The user selected full attribution to the **UTC clock-in month** and historical
read access with **no employee work/correction/schedule mutations after retirement**.
Those previously open decisions are now resolved. Existing reports remain a
history of what was measured at each commit, not the current implementation.

Worker `/my/schedules` now approves/rejects proposed schedules. `/my/worklogs`
shows rejection/correction reasons and provides time correction/resubmission with
revision/status checks, immediate duplicate guard, retained input on error,
stale-revision lockout, keyboard focus/escape and mobile layout. Selected months
are preserved in the URL. Inactive workers see historical views with mutation
controls hidden; the server is authoritative and checks after worker lock/refresh.
The complete core owner→worker→review→payroll flow uses real UI for both worker
schedule approval and correction. APIs remain fixture setup for targeted tests.

Current browser matrix is **59 executions per DB**: Chromium 48, Firefox 4,
WebKit 4, mobile Chromium 3 (51 distinct scenarios). CI independently runs H2 and
MySQL: **118 browser executions total**. Each DB artifact contains its own
JUnit/JSON/HTML and server log, plus failure trace/screenshot/video. Audit requires
all cases/projects and DB provenance, without skips/flaky results.

The MySQL job provisions a disposable service on loopback 13308 and runs real
Flyway migrations + Hibernate schema validation through:
`bash ./gradlew e2eServer -PwtE2eDatabase=mysql --no-daemon`.
Only that fixed synthetic schema/credential target is supported. Browser global
setup checks the actual DB product from health; metadata records h2/mysql.
Default local reproduction remains `e2eServer` (H2) plus `npx playwright test`.
A local Chromium/mobile subset is 51 executions and is not a full-matrix pass.
The pinned backend is `ea08b173920bf992d110bc8a4b2166f97e0b5eb8`.

New regression cases cover schedule approve/reject, rejected-time resubmission,
stale correction input retention, failed correction retry/validation, year-end
UTC month attribution without double pay, inactive worker UI and mobile correction
focus/cancel. Backend independently verifies 13 forbidden write routes, retained
historical reads and owner review, and leap/year/offset monthly amounts across
three payroll APIs plus dashboard.

An additional regression preserves original subsecond timestamps when a correction does not change the displayed time, avoiding an unintended change in payable minutes.
