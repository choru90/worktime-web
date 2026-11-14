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
const required = ['owner invites worker', 'real invalid login', 'owners and workers', 'signed expired JWT'];
const missing = required.filter(title => !specs.some(s => s.title.startsWith(title)));
const message = `Playwright: passed=${stats.expected}, failed=${stats.unexpected}, skipped=${stats.skipped}, flaky=${stats.flaky}, specs=${specs.length}`;
console.log(message);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
if (missing.length || stats.expected !== 11 || stats.unexpected || stats.skipped || stats.flaky || result.errors?.length) {
  throw new Error(`Incomplete E2E execution; missing=${missing.join(',')}`);
}
