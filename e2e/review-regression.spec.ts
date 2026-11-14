import { test, expect } from '@playwright/test';
import { api, fixture, login } from './helpers/fixture';

test('stale review refreshes corrected time and only the latest revision can be approved', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  await login(page, f.email); await page.goto(`/worklogs?date=${f.date}`);
  const row = page.getByRole('row').filter({ hasText: f.worker.name });
  await expect(row).toContainText('검수대기');
  const correction = await request.post(`${api}/worklogs/my/${log.id}/corrections`, { headers: f.employeeHeaders,
    data: { clockInAt: f.start, clockOutAt: `${f.date}T10:30:00Z`, reason: 'New revision', expectedStatus: 'COMPLETED', expectedCorrectionCount: 0 } });
  expect(correction.status()).toBe(200);
  const dialogs: string[] = []; page.on('dialog', d => { dialogs.push(d.message()); return d.accept(); });
  const rejected = page.waitForResponse(r => r.url().endsWith(`/work-logs/${log.id}/confirm`));
  await row.getByRole('button', { name: '확정', exact: true }).click();
  expect((await rejected).status()).toBe(409);
  await expect(row).toContainText('New revision');
  expect(dialogs.some(s => s.includes('다시 조회'))).toBe(true);
  expect(await f.amount()).toBe(0);
  expect(await f.saved(log.id)).toMatchObject({ status: 'COMPLETED', correctionCount: 1, durationMinutes: 90 });
  const approved = page.waitForResponse(r => r.url().endsWith(`/work-logs/${log.id}/confirm`));
  await row.getByRole('button', { name: '확정', exact: true }).click();
  expect((await approved).status()).toBe(200); expect(await f.amount()).toBe(15002);
});

test('rejection reason survives reload and corrected resubmission changes payroll only after approval', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  await login(page, f.email); await page.goto(`/worklogs?date=${f.date}`);
  const row = page.getByRole('row').filter({ hasText: f.worker.name });
  await row.getByRole('button', { name: '반려', exact: true }).click();
  await page.getByPlaceholder('반려 사유를 입력해주세요 (예: 출근 시간이 맞지 않음)').fill('Please correct checkout');
  const rejected = page.waitForResponse(r => r.url().endsWith(`/work-logs/${log.id}/reject`));
  await page.getByRole('button', { name: '반려 확정', exact: true }).click();
  expect((await rejected).status()).toBe(200);
  await page.reload(); await expect(row).toContainText('Please correct checkout'); expect(await f.amount()).toBe(0);
  const response = await request.post(`${api}/worklogs/my/${log.id}/corrections`, { headers: f.employeeHeaders,
    data: { clockInAt: f.start, clockOutAt: `${f.date}T10:30:00Z`, reason: 'Corrected checkout', expectedStatus: 'REJECTED', expectedCorrectionCount: 0 } });
  expect(response.status()).toBe(200); expect(await f.amount()).toBe(0);
  await page.reload(); await expect(row).toContainText('Corrected checkout');
  page.on('dialog', d => d.accept());
  await row.getByRole('button', { name: '확정', exact: true }).click();
  await expect(row).toContainText('확정');
  await expect.poll(f.amount).toBe(15002);
  expect(await f.saved(log.id)).toMatchObject({ status: 'CONFIRMED', correctionCount: 1, durationMinutes: 90 });
});

test('rapid repeated approval clicks submit once and create one payroll item', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  await login(page, f.email); await page.goto(`/worklogs?date=${f.date}`);
  page.on('dialog', d => d.accept());
  let submissions = 0;
  await page.route(`**/work-logs/${log.id}/confirm`, async route => { submissions++; await route.continue(); });
  await page.getByRole('row').filter({ hasText: f.worker.name }).getByRole('button', { name: '확정', exact: true })
    .evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect.poll(f.amount).toBe(5001); expect(submissions).toBe(1);
  expect(await f.saved(log.id)).toMatchObject({ status: 'CONFIRMED', correctionCount: 0 });
});

test('rapid repeated clock clicks keep exactly one completed record', async ({ page, request }) => {
  const f = await fixture(request); await login(page, f.workerEmail); page.on('dialog', d => d.accept());
  const calls = { in: 0, out: 0 };
  await page.route('**/worklogs/my/clock-in', async route => { calls.in++; await route.continue(); });
  await page.route('**/worklogs/my/clock-out', async route => { calls.out++; await route.continue(); });
  await page.getByRole('button', { name: '출근하기', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  await expect(page.getByRole('button', { name: '퇴근하기', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '퇴근하기', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
  await expect(page.getByRole('button', { name: '출근하기', exact: true })).toBeVisible();
  const today = new Date(); const from = new Date(today.getTime() - 86400000).toISOString().slice(0, 10); const to = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
  const response = await request.get(`${api}/worklogs/my?fromDate=${from}&toDate=${to}`, { headers: f.employeeHeaders }); expect(response.status()).toBe(200);
  const logs = await response.json(); expect(logs).toHaveLength(1); expect(logs[0].status).toBe('COMPLETED'); expect(calls).toEqual({ in: 1, out: 1 });
});

test('split shifts and changed contracts agree across owner summary and worker detail', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(10000); await f.wage(10001, f.date);
  const logs = [await f.log(`${f.year}-06-14T09:00:00Z`), await f.log(), await f.log(`${f.date}T11:00:00Z`)];
  for (const log of logs) expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders })).status()).toBe(200);
  await login(page, f.email); await page.goto('/payroll');
  await page.getByRole('combobox').nth(0).selectOption(String(f.year)); await page.getByRole('combobox').nth(1).selectOption('6');
  const row = page.getByRole('row').filter({ hasText: f.worker.name }); await expect(row).toContainText('15,002원');
  await row.getByRole('button', { name: '상세보기' }).click(); await expect(page.getByRole('heading', { name: `${f.worker.name} · 15,002원` })).toBeVisible();
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: '로그아웃' }).click(); await expect(page).toHaveURL(/\/login$/);
  await login(page, f.workerEmail); await page.goto('/my/payroll'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
  await expect(page.getByRole('heading', { name: `${f.worker.name} · 15,002원` })).toBeVisible(); expect(await f.amount()).toBe(15002);
});
