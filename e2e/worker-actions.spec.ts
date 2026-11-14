import { test, expect } from '@playwright/test';
import { api, fixture, login } from './helpers/fixture';

const localTime = (date: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date).replace(' ', 'T').replace(/:00$/, '');

for (const decision of ['confirm', 'reject'] as const) {
  test(`worker schedule ${decision} is submitted once through the actual UI`, async ({ page, request }) => {
    const f = await fixture(request);
    const response = await request.post(`${api}/workers/${f.worker.id}/schedules`, { headers: f.ownerHeaders,
      data: { workerId: f.worker.id, startAtUtc: f.start, endAtUtc: `${f.date}T10:00:00Z`, timezone: 'UTC', requestType: 'OWNER_PROPOSAL' } });
    expect(response.status()).toBe(201); const schedule = await response.json();
    await login(page, f.workerEmail); await page.goto('/my/schedules'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
    const row = page.getByTestId(`schedule-${schedule.id}`); let calls = 0;
    await page.route(`**/worker/schedules/${schedule.id}/${decision}`, async route => { calls++; await route.continue(); });
    await row.getByRole('button', { name: decision === 'confirm' ? '일정 승인' : '일정 거절', exact: true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
    await expect(row).toContainText(decision === 'confirm' ? 'CONFIRMED' : 'REJECTED'); expect(calls).toBe(1);
    await expect(row.getByRole('button')).toHaveCount(0);
    expect((await request.get(`${api}/schedules/${schedule.id}`, { headers: f.ownerHeaders })).status()).toBe(200);
    await page.reload(); await expect(row).toContainText(decision === 'confirm' ? 'CONFIRMED' : 'REJECTED');
  });
}

test('worker rejected record is corrected and resubmitted through the UI before owner reapproval', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  expect((await request.post(`${api}/work-logs/${log.id}/reject`, { headers: f.ownerHeaders, data: { reason: '퇴근 시간 확인', expectedCorrectionCount: 0 } })).status()).toBe(200);
  await login(page, f.workerEmail); await page.goto('/my/worklogs'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
  const article = page.getByTestId(`worklog-${log.id}`); await expect(article).toContainText('퇴근 시간 확인');
  await article.getByRole('button', { name: '정정하여 재제출' }).click();
  await expect(page.getByRole('dialog')).toContainText('퇴근 시간 확인');
  await page.getByLabel('퇴근 일시', { exact: true }).fill(localTime(new Date(`${f.date}T10:30:00Z`)));
  await page.getByLabel('정정 사유', { exact: true }).fill('실제 퇴근 시간 재제출');
  const corrected = page.waitForResponse(r => r.url().endsWith(`/worklogs/my/${log.id}/corrections`));
  await page.getByRole('button', { name: '정정 제출', exact: true }).click(); expect((await corrected).status()).toBe(200);
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(article).toContainText('승인 대기'); await expect(article).toContainText('실제 퇴근 시간 재제출');
  expect(await f.amount()).toBe(0);
  expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders, data: { expectedCorrectionCount: 1 } })).status()).toBe(200);
  await page.reload(); await expect(article).toContainText('승인 완료'); await expect(article.getByRole('button')).toHaveCount(0);
  await page.goto('/my/payroll'); await page.getByLabel('조회 월').fill(`${f.year}-06`); await expect(page.getByRole('heading', { name: `${f.worker.name} · 15,002원` })).toBeVisible();
});

test('worker correction stale revision preserves input and prevents a second stale submit', async ({ page, request }) => {
  const f = await fixture(request); const log = await f.log(); await login(page, f.workerEmail);
  await page.goto('/my/worklogs'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
  await page.getByTestId(`worklog-${log.id}`).getByRole('button', { name: '시간 정정', exact: true }).click();
  await page.getByLabel('정정 사유', { exact: true }).fill('화면 입력 유지');
  const changed = await request.post(`${api}/worklogs/my/${log.id}/corrections`, { headers: f.employeeHeaders,
    data: { clockInAt: f.start, clockOutAt: `${f.date}T10:00:00Z`, reason: '다른 세션 정정', expectedStatus: 'COMPLETED', expectedCorrectionCount: 0 } }); expect(changed.status()).toBe(200);
  const rejected = page.waitForResponse(r => r.url().endsWith(`/worklogs/my/${log.id}/corrections`));
  await page.getByRole('button', { name: '정정 제출', exact: true }).click(); expect((await rejected).status()).toBe(409);
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('입력은 유지'); await expect(page.getByLabel('정정 사유', { exact: true })).toHaveValue('화면 입력 유지');
  await expect(page.getByRole('button', { name: '정정 제출', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '닫기', exact: true }).click(); await expect(page.getByTestId(`worklog-${log.id}`)).toContainText('다른 세션 정정');
  expect((await f.saved(log.id)).correctionCount).toBe(1);
});

test('worker correction validates time and retains input after a failed request for retry', async ({ page, request }) => {
  const f = await fixture(request); const log = await f.log(); await login(page, f.workerEmail);
  await page.goto('/my/worklogs'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
  await page.getByTestId(`worklog-${log.id}`).getByRole('button', { name: '시간 정정', exact: true }).click();
  await page.getByLabel('퇴근 일시', { exact: true }).fill(localTime(new Date(f.start)));
  await page.getByLabel('정정 사유', { exact: true }).fill('재시도 입력'); await page.getByRole('button', { name: '정정 제출', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('출근 시간 이후');
  await page.getByLabel('퇴근 일시', { exact: true }).fill(localTime(new Date(`${f.date}T10:30:00Z`)));
  let calls = 0; await page.route(`**/worklogs/my/${log.id}/corrections`, async route => { calls++; if (calls === 1) await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }); else await route.continue(); });
  await page.getByRole('button', { name: '정정 제출', exact: true }).click(); await expect(page.getByRole('dialog').getByRole('alert')).toContainText('정정하지 못했습니다');
  await expect(page.getByLabel('정정 사유', { exact: true })).toHaveValue('재시도 입력');
  await page.getByRole('button', { name: '정정 제출', exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await f.saved(log.id)).toMatchObject({ correctionCount: 1, durationMinutes: 90 }); expect(calls).toBe(2);
});

test('UTC clock-in month owns all overnight payroll across year end exactly once', async ({ page, request }) => {
  const f = await fixture(request); await f.wage();
  const log = await f.log(`${f.year + 1}-01-01T08:30:00+09:00`, 90);
  expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders })).status()).toBe(200);
  for (const [year, month, expected] of [[f.year, 12, 15002], [f.year + 1, 1, 0]]) {
    const detail = await request.get(`${api}/payroll/workers/${f.worker.id}/monthly?year=${year}&month=${month}`, { headers: f.employeeHeaders }); expect(detail.status()).toBe(200); expect((await detail.json()).totalAmount).toBe(expected);
  }
  await login(page, f.email); await page.goto('/payroll'); await page.getByRole('combobox').nth(0).selectOption(String(f.year)); await page.getByRole('combobox').nth(1).selectOption('12');
  await expect(page.getByRole('row').filter({ hasText: f.worker.name })).toContainText('15,002원');
  await page.getByRole('combobox').nth(0).selectOption(String(f.year + 1)); await page.getByRole('combobox').nth(1).selectOption('1');
  await expect(page.getByRole('row').filter({ hasText: f.worker.name })).toContainText('0원');
  expect((await f.saved(log.id)).durationMinutes).toBe(90);
});

test('retired employee UI keeps historical payroll but hides clock correction and schedule actions', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  const schedule = await request.post(`${api}/workers/${f.worker.id}/schedules`, { headers: f.ownerHeaders, data: { workerId: f.worker.id, startAtUtc: `${f.date}T12:00:00Z`, endAtUtc: `${f.date}T13:00:00Z`, timezone: 'UTC', requestType: 'OWNER_PROPOSAL' } }); expect(schedule.status()).toBe(201);
  expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders })).status()).toBe(200);
  await login(page, f.workerEmail);
  expect((await request.post(`${api}/workers/${f.worker.id}/resign?resignDate=${f.date}`, { headers: f.ownerHeaders })).status()).toBe(200);
  await page.reload(); await expect(page.getByText('퇴사한 직원은 과거 기록과 급여를 조회할 수 있습니다. 신규 출퇴근은 제한됩니다.')).toBeVisible();
  await expect(page.getByRole('button', { name: '출근하기', exact: true })).toHaveCount(0);
  await page.goto('/my/schedules'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
  await expect(page.getByTestId(`schedule-${(await schedule.json()).id}`)).toContainText('PROPOSED_BY_OWNER');
  await expect(page.getByRole('button', { name: '일정 승인', exact: true })).toHaveCount(0);
  await page.goto('/my/worklogs'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
  await expect(page.getByTestId(`worklog-${log.id}`)).toContainText('승인 완료'); await expect(page.getByRole('button', { name: '시간 정정', exact: true })).toHaveCount(0);
  await page.goto('/my/payroll'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
  await expect(page.getByRole('heading', { name: `${f.worker.name} · 5,001원` })).toBeVisible();
});
