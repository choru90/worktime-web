import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { api, fixture, login, password } from './helpers/fixture';

 test('two owner sessions racing approval and rejection commit one decision and refresh the loser', async ({ page, browser, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3000', timezoneId: 'Asia/Seoul' });
  const other = await context.newPage();
  let release!: () => void; const hold = new Promise<void>(r => { release = r; }); let arrived = 0;
  try {
    await login(page, f.email); await login(other, f.email);
    for (const p of [page, other]) {
      p.on('dialog', d => d.accept()); await p.goto(`/worklogs?date=${f.date}`);
      await expect(p.getByRole('row').filter({ hasText: f.worker.name })).toContainText('검수대기');
      await p.route(new RegExp(`/api/work-logs/${log.id}/(confirm|reject)$`), async route => { arrived++; await hold; await route.continue(); });
    }
    const confirmed = page.waitForResponse(r => r.url().endsWith(`/work-logs/${log.id}/confirm`));
    const rejected = other.waitForResponse(r => r.url().endsWith(`/work-logs/${log.id}/reject`));
    await page.getByRole('row').filter({ hasText: f.worker.name }).getByRole('button', { name: '확정', exact: true }).click();
    await other.getByRole('row').filter({ hasText: f.worker.name }).getByRole('button', { name: '반려', exact: true }).click();
    await other.getByPlaceholder('반려 사유를 입력해주세요 (예: 출근 시간이 맞지 않음)').fill('Concurrent rejection');
    await other.getByRole('button', { name: '반려 확정', exact: true }).click();
    await expect.poll(() => arrived).toBe(2); release();
    const responses = await Promise.all([confirmed, rejected]); expect(responses.map(r => r.status()).sort()).toEqual([200, 400]);
    const saved = await f.saved(log.id); expect(['CONFIRMED', 'REJECTED']).toContain(saved.status);
    expect(await f.amount()).toBe(saved.status === 'CONFIRMED' ? 5001 : 0);
    // Both clients reload the canonical decision; the losing client already refreshes on error.
    for (const p of [page, other]) {
      await p.reload(); const row = p.getByRole('row').filter({ hasText: f.worker.name });
      await expect(row.getByRole('button', { name: '확정', exact: true })).toHaveCount(0);
      await expect(row).toContainText(saved.status === 'CONFIRMED' ? '확정' : 'Concurrent rejection');
    }
  } finally { release(); await context.close(); }
});

test('approval committed before lost response recovers confirmed state and retry cannot duplicate payroll', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  await login(page, f.email); await page.goto(`/worklogs?date=${f.date}`); page.on('dialog', d => d.accept());
  let committed = false;
  await page.route(`**/work-logs/${log.id}/confirm`, async route => {
    const response = await route.fetch(); expect(response.status()).toBe(200); committed = true;
    await route.abort('connectionreset');
  });
  const row = page.getByRole('row').filter({ hasText: f.worker.name });
  await row.getByRole('button', { name: '확정', exact: true }).click();
  await expect.poll(() => committed).toBe(true); await expect(row).toContainText('확정');
  await expect(row.getByRole('button', { name: '확정', exact: true })).toHaveCount(0);
  expect(await f.amount()).toBe(5001); await page.reload(); await expect(row).toContainText('확정');
  expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders })).status()).toBe(400);
  const payroll = await request.get(`${api}/workers/${f.worker.id}/payroll?from=${f.year}-06-01&to=${f.year}-06-30`, { headers: f.ownerHeaders });
  expect(payroll.status()).toBe(200); const body = await payroll.json(); expect(body.totalPay).toBe(5001); expect(body.wageDetails).toHaveLength(1);
});

test('pending old-account payroll cannot appear after logout and another account login', async ({ page, request }) => {
  const old = await fixture(request), next = await fixture(request); await old.wage(); const log = await old.log();
  expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: old.ownerHeaders })).status()).toBe(200);
  await login(page, old.email);
  const oldSession = await page.evaluate(() => localStorage.getItem('accessToken'));
  let held = false, release!: () => void; const hold = new Promise<void>(r => { release = r; });
  await page.route('**/api/payroll/owner/monthly?*', async route => {
    const headers = route.request().headers();
    if (headers.authorization === `Bearer ${oldSession}`) {
      const response = await route.fetch(); held = true; await hold;
      // A full logout navigation may cancel the request before it can be delivered.
      try { await route.fulfill({ response }); } catch { /* navigation canceled old document */ }
    } else await route.continue();
  });
  try {
    await page.goto('/payroll'); await expect.poll(() => held).toBe(true);
    page.on('dialog', d => d.accept()); await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login$/); await login(page, next.email); await page.goto('/payroll');
    await expect(page.getByRole('row').filter({ hasText: next.worker.name })).toBeVisible(); release();
    await expect(page.getByText(old.worker.name, { exact: true })).toHaveCount(0);
    expect(JSON.parse((await page.evaluate(() => localStorage.getItem('user')))! ).email).toBe(next.email);
  } finally { release(); }
});

test('tampered path body and contract identifiers cannot cross workers or stores', async ({ request }) => {
  const f = await fixture(request), foreign = await fixture(request); await f.wage(); const log = await f.log();
  const scheduleBody = { workerId: foreign.worker.id, startAtUtc: f.start, endAtUtc: `${f.date}T10:00:00Z`, timezone: 'UTC', requestType: 'OWNER_PROPOSAL' };
  expect((await request.post(`${api}/workers/${f.worker.id}/schedules`, { headers: f.ownerHeaders, data: scheduleBody })).status()).toBe(404);
  const stores = await request.post(`${api}/stores`, { headers: foreign.ownerHeaders, data: { name: 'Foreign store' } }); expect(stores.status()).toBe(201);
  const store = await stores.json();
  expect((await request.put(`${api}/workers/${f.worker.id}`, { headers: f.ownerHeaders, data: { name: 'tampered', phoneNumber: '00000000000', storeId: store.id } })).status()).toBe(404);
  const contracts = await request.get(`${api}/workers/${f.worker.id}/wage-contracts`, { headers: f.ownerHeaders }); expect(contracts.status()).toBe(200);
  const contract = (await contracts.json())[0];
  const peerResponse = await request.post(`${api}/workers`, { headers: f.ownerHeaders, data: { name: 'Same-owner peer', phoneNumber: '00000000000' } }); expect(peerResponse.status()).toBe(201);
  const peer = await peerResponse.json();
  const end = await request.patch(`${api}/workers/${peer.id}/wage-contracts/${contract.id}/terminate?endDate=${f.date}`, { headers: f.ownerHeaders });
  expect(end.status()).toBe(404);
  expect((await request.post(`${api}/worklogs/my/${log.id}/corrections`, { headers: foreign.employeeHeaders, data: { clockInAt: f.start, clockOutAt: `${f.date}T10:00:00Z`, reason: 'tampered', expectedStatus: 'COMPLETED', expectedCorrectionCount: 0 } })).status()).toBe(404);
  expect(await f.saved(log.id)).toMatchObject({ status: 'COMPLETED', correctionCount: 0, durationMinutes: 30 });
  const saved = await request.get(`${api}/workers/${f.worker.id}`, { headers: f.ownerHeaders }); expect(saved.status()).toBe(200);
  expect((await saved.json()).worker).toMatchObject({ name: f.worker.name, storeId: null });
  const unchangedContracts = await request.get(`${api}/workers/${f.worker.id}/wage-contracts`, { headers: f.ownerHeaders });
  expect(unchangedContracts.status()).toBe(200);
  expect((await unchangedContracts.json()).find((c: { id: string }) => c.id === contract.id).endDate).toBeNull();
});

test('relinked worker account revokes the previous session ownership without changing historical payroll', async ({ request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders })).status()).toBe(200);
  const unlink = `${api}/e2e/fixtures/workers/${f.worker.id}/unlink-account`;
  expect((await request.post(unlink, { headers: f.employeeHeaders })).status()).toBe(403);
  expect((await request.post(unlink, { headers: f.ownerHeaders })).status()).toBe(200);
  const invitation = await request.post(`${api}/workers/${f.worker.id}/invite`, { headers: f.ownerHeaders }); expect(invitation.status()).toBe(200);
  const signup = await request.post(`${api}/auth/workers/signup`, { data: { email: `${randomUUID()}@example.test`, password, inviteCode: (await invitation.json()).inviteCode } }); expect(signup.status()).toBe(201);
  const newHeaders = { Authorization: `Bearer ${(await signup.json()).accessToken}` };
  for (const path of ['/workers/my', `/work-logs/${log.id}`, `/payroll/workers/${f.worker.id}/monthly?year=${f.year}&month=6`]) {
    expect((await request.get(`${api}${path}`, { headers: f.employeeHeaders })).status(), path).toBe(404);
  }
  const payroll = await request.get(`${api}/payroll/workers/${f.worker.id}/monthly?year=${f.year}&month=6`, { headers: newHeaders }); expect(payroll.status()).toBe(200);
  expect((await payroll.json()).totalAmount).toBe(5001); expect(await f.amount()).toBe(5001);
});

test('resignation preserves historical reads and blocks old-session work and schedule writes', async ({ request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders })).status()).toBe(200);
  const resignation = await request.post(`${api}/workers/${f.worker.id}/resign?resignDate=${f.date}`, { headers: f.ownerHeaders });
  expect(resignation.status()).toBe(200); expect((await resignation.json()).active).toBe(false);
  expect(await f.amount()).toBe(5001);
  // Approved policy: historical reads survive; employee writes are blocked.
  const current = await request.get(`${api}/workers/my`, { headers: f.employeeHeaders });
  expect(current.status()).toBe(200); expect(await current.json()).toMatchObject({ id: f.worker.id, active: false });
  const historical = await request.get(`${api}/payroll/workers/${f.worker.id}/monthly?year=${f.year}&month=6`, { headers: f.employeeHeaders });
  expect(historical.status()).toBe(200); expect((await historical.json()).totalAmount).toBe(5001);
  expect((await request.post(`${api}/worklogs/my/clock-in`, { headers: f.employeeHeaders })).status()).toBe(403);
  expect((await request.post(`${api}/worklogs/my/clock-out`, { headers: f.employeeHeaders })).status()).toBe(403);
  expect((await request.post(`${api}/worklogs/my/${log.id}/corrections`, { headers: f.employeeHeaders, data: { clockInAt: f.start, clockOutAt: `${f.date}T10:30:00Z`, reason: 'inactive edit', expectedStatus: 'CONFIRMED', expectedCorrectionCount: 0 } })).status()).toBe(403);
  expect((await request.post(`${api}/workers/${f.worker.id}/schedules`, { headers: f.employeeHeaders, data: { workerId: f.worker.id, startAtUtc: f.start, endAtUtc: `${f.date}T10:00:00Z`, timezone: 'UTC', requestType: 'WORKER_REQUEST' } })).status()).toBe(403);
  expect(await f.amount()).toBe(5001);
});
