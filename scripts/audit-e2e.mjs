import fs from 'node:fs';
const result = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'));
const stats = result.stats;
const database = result.config?.metadata?.database;
if (!['h2', 'mysql'].includes(database)) throw new Error('Database provenance is absent');
const specs = [];
function visit(suite) {
  specs.push(...(suite.specs ?? []));
  (suite.suites ?? []).forEach(visit);
}
result.suites.forEach(visit);
// Counts and required scenarios prevent an empty run or a narrowed test selection from passing.
const required = ['owner invites worker', 'real invalid login', 'owners and workers', 'signed expired JWT', 'stale review', 'rejection reason', 'rapid repeated approval', 'rapid repeated clock', 'split shifts', 'reload restores', 'used and unknown', 'expired invitation', 'approval 500', 'approval offline', 'delayed approval', 'older payroll', 'failed worker creation', 'worker direct owner route /workers', 'worker direct owner route /payroll', 'worker direct owner route /store/settings', 'worker direct owner route /owner/dashboard', 'two owner sessions', 'approval committed before lost', 'pending old-account', 'tampered path', 'relinked worker', 'resignation preserves', 'worker name accepts', 'rejection reason enforces', 'decimal wage', 'non-increasing schedule', 'keyboard login', 'core payroll view reload', 'mobile worker', 'mobile owner', 'worker schedule confirm', 'worker schedule reject', 'worker rejected record', 'worker correction stale', 'worker correction validates', 'UTC clock-in month', 'retired employee UI', 'mobile correction'];
const missing = required.filter(title => !specs.some(s => s.title.startsWith(title)));
const expectedProjects = { chromium: 47, firefox: 4, webkit: 4, 'mobile-chromium': 3 };
const observedProjects = {};
for (const spec of specs) for (const test of spec.tests ?? []) {
  observedProjects[test.projectName] = (observedProjects[test.projectName] ?? 0) + 1;
}
const incompleteProjects = Object.entries(expectedProjects).filter(([name, count]) => observedProjects[name] !== count);
for (const project of ['firefox', 'webkit']) for (const title of ['owner invites worker', 'real invalid login', 'keyboard login', 'core payroll view reload']) {
  if (!specs.some(spec => spec.title.startsWith(title) && spec.tests?.some(test => test.projectName === project))) {
    incompleteProjects.push([project, title]);
  }
}
const message = `Playwright (${database}): passed=${stats.expected}, failed=${stats.unexpected}, skipped=${stats.skipped}, flaky=${stats.flaky}, specs=${specs.length}`;
console.log(message);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`);
if (incompleteProjects.length || missing.length || stats.expected !== 58 || stats.unexpected || stats.skipped || stats.flaky || result.errors?.length) {
  throw new Error(`Incomplete E2E execution; missing=${missing.join(',')}`);
}
