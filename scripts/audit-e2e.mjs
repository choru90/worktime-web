import fs from 'node:fs';
const result = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'));
const stats = result.stats;
const specs = [];
function visit(suite) {
  specs.push(...(suite.specs ?? []));
  (suite.suites ?? []).forEach(visit);
}
result.suites.forEach(visit);
// Counts and required scenarios prevent an empty run or a narrowed test selection from passing.
const required = ['owner invites worker', 'real invalid login', 'owners and workers', 'signed expired JWT', 'stale review', 'rejection reason', 'rapid repeated approval', 'rapid repeated clock', 'split shifts', 'reload restores', 'used and unknown', 'expired invitation', 'approval 500', 'approval offline', 'delayed approval', 'older payroll', 'failed worker creation', 'worker direct owner route /workers', 'worker direct owner route /payroll', 'worker direct owner route /store/settings', 'worker direct owner route /owner/dashboard'];
const missing = required.filter(title => !specs.some(s => s.title.startsWith(title)));
const message = `Playwright: passed=${stats.expected}, failed=${stats.unexpected}, skipped=${stats.skipped}, flaky=${stats.flaky}, specs=${specs.length}`;
console.log(message);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
if (missing.length || stats.expected !== 28 || stats.unexpected || stats.skipped || stats.flaky || result.errors?.length) {
  throw new Error(`Incomplete E2E execution; missing=${missing.join(',')}`);
}
