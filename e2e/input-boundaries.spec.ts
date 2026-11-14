import { test, expect } from '@playwright/test';
import { api, fixture, login } from './helpers/fixture';

test('worker name accepts 100 characters but rejects whitespace and 101 without corrupting data', async ({ page, request }) => {
  const f = await fixture(request); const longName = '가'.repeat(100);
  const tooLong = await request.post(`${api}/workers`, { headers: f.ownerHeaders, data: { name: '가'.repeat(101), phoneNumber: '00000000000' } });
  expect(tooLong.status()).toBe(400);
  expect((await request.put(`${api}/workers/${f.worker.id}`, { headers: f.ownerHeaders, data: { name: '가'.repeat(101), phoneNumber: '00000000000' } })).status()).toBe(400);
  await login(page, f.email); await page.goto('/workers'); await page.getByRole('button', { name: '+ 알바생 추가' }).click();
  await page.getByPlaceholder('홍길동').fill('   '); await page.getByPlaceholder('01012345678').fill('00000000000');
  await page.getByRole('button', { name: '추가', exact: true }).click(); await expect(page.getByText('이름을 입력해주세요.', { exact: true })).toBeVisible();
  await page.getByPlaceholder('홍길동').fill(longName);
  const created = page.waitForResponse(r => r.url().endsWith('/api/workers') && r.request().method() === 'POST');
  await page.getByRole('button', { name: '추가', exact: true }).click(); expect((await created).status()).toBe(201);
  await expect(page.getByText(longName, { exact: true })).toBeVisible();
  const saved = await request.get(`${api}/workers/${f.worker.id}`, { headers: f.ownerHeaders }); expect((await saved.json()).worker.name).toBe(f.worker.name);
});

test('rejection reason enforces blank and 500 character boundaries before preserving exact accepted text', async ({ page, request }) => {
  const f = await fixture(request); const log = await f.log();
  for (const reason of [' ', 'x'.repeat(501)]) {
    expect((await request.post(`${api}/work-logs/${log.id}/reject`, { headers: f.ownerHeaders, data: { reason, expectedCorrectionCount: 0 } })).status()).toBe(400);
    expect((await f.saved(log.id)).status).toBe('COMPLETED');
  }
  await login(page, f.email); await page.goto(`/worklogs?date=${f.date}`);
  await page.getByRole('row').filter({ hasText: f.worker.name }).getByRole('button', { name: '반려', exact: true }).click();
  const reason = '검'.repeat(500); await page.getByPlaceholder('반려 사유를 입력해주세요 (예: 출근 시간이 맞지 않음)').fill(reason);
  const response = page.waitForResponse(r => r.url().endsWith(`/work-logs/${log.id}/reject`));
  await page.getByRole('button', { name: '반려 확정', exact: true }).click(); expect((await response).status()).toBe(200);
  expect((await f.saved(log.id)).rejectionReason).toBe(reason);
});

test('decimal wage entered in the browser is stored precisely and rounds payroll half up', async ({ page, request }) => {
  const f = await fixture(request); await login(page, f.email); await page.goto(`/workers/${f.worker.id}`);
  await page.getByPlaceholder('10000').fill('10000.50'); await page.locator('form input[type=date]').fill('2020-01-01');
  const response = page.waitForResponse(r => r.url().endsWith('/wage-contracts') && r.request().method() === 'POST');
  await page.getByRole('button', { name: '시급 계약 추가', exact: true }).click(); const contract = await response;
  expect(contract.status()).toBe(201); expect((await contract.json()).hourlyWage).toBe(10000.5);
  const log = await f.log(f.start, 60); expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders })).status()).toBe(200);
  expect(await f.amount()).toBe(10001);
});

test('non-increasing schedule and correction times are rejected and preserve the original record', async ({ page, request }) => {
  const f = await fixture(request); const log = await f.log();
  for (const end of [f.start, `${f.date}T08:00:00Z`]) {
    expect((await request.post(`${api}/worklogs/my/${log.id}/corrections`, { headers: f.employeeHeaders, data: { clockInAt: f.start, clockOutAt: end, reason: 'invalid time', expectedStatus: 'COMPLETED', expectedCorrectionCount: 0 } })).status()).toBe(400);
  }
  await login(page, f.email); await page.goto('/schedule'); await page.getByRole('button', { name: '+ 스케줄 추가' }).click();
  const form = page.locator('form'); await form.locator('select').selectOption(f.worker.id); await form.locator('input[type=date]').fill(f.date);
  await form.locator('input[type=time]').nth(0).fill('09:00'); await form.locator('input[type=time]').nth(1).fill('08:00');
  await page.getByRole('button', { name: '스케줄 제안', exact: true }).click(); await expect(page.getByText('종료 시간은 시작 시간보다 늦어야 합니다.', { exact: true })).toBeVisible();
  expect(await f.saved(log.id)).toMatchObject({ durationMinutes: 30, correctionCount: 0, status: 'COMPLETED' });
});
