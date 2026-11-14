import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// This suite creates accounts only in the disposable local backend launched by CI.
const password = 'WT002-synthetic-password';
const apiURL = 'http://127.0.0.1:8080';
async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function auth(page: Page) {
  return { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}` };
}
async function owner(request: APIRequestContext) {
  const email = `wt002-${randomUUID()}@example.test`;
  const response = await request.post(`${apiURL}/api/auth/owners/signup`, { data: { email, password, name: 'Synthetic owner' } });
  expect(response.status()).toBe(201);
  return email;
}

test('owner invites worker, proposes schedule, worker clocks, owner approves and both see payroll', async ({ page, browser, request }) => {
  const ownerEmail = await owner(request);
  const workerEmail = `wt002-${randomUUID()}@example.test`;
  const name = `WT002-${randomUUID().slice(0, 8)}`;
  page.on('dialog', dialog => dialog.accept());
  await login(page, ownerEmail);
  await page.goto('/workers');
  await page.getByRole('button', { name: '+ 알바생 추가' }).click();
  await page.getByPlaceholder('홍길동').fill(name);
  await page.getByPlaceholder('01012345678').fill('00000000000');
  const created = page.waitForResponse(r => r.url().endsWith('/api/workers') && r.request().method() === 'POST');
  await page.getByRole('button', { name: '추가', exact: true }).click();
  const response = await created; expect(response.status()).toBe(201);
  const worker = await response.json();
  await page.getByRole('row').filter({ hasText: name }).getByRole('button', { name: '상세보기' }).click();
  const invited = page.waitForResponse(r => r.url().endsWith(`/workers/${worker.id}/invite`));
  await page.getByRole('button', { name: '초대 코드 생성' }).click();
  const invite = await invited; expect(invite.status()).toBe(200);
  const code = (await invite.json()).inviteCode;
  // Contract is created through the real owner UI.
  await page.getByPlaceholder('10000').fill('10001');
  await page.locator('form input[type=date]').fill('2020-01-01');
  const contract = page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/wage-contracts'));
  await page.getByRole('button', { name: '시급 계약 추가', exact: true }).click();
  expect((await contract).status()).toBe(201);

  const context = await browser.newContext({ timezoneId: 'Asia/Seoul' });
  const employee = await context.newPage();
  try {
    await employee.goto('http://127.0.0.1:3000/signup/worker');
    await employee.getByLabel('초대 코드').fill(code);
    await employee.getByLabel('이메일').fill(workerEmail);
    await employee.getByLabel('비밀번호', { exact: true }).fill(password);
    await employee.getByLabel('비밀번호 확인').fill(password);
    await employee.getByRole('button', { name: '회원가입', exact: true }).click();
    await expect(employee).toHaveURL(/\/login\?registered=true$/);
    await login(employee, workerEmail);
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
    await page.goto('/schedule');
    await page.getByRole('button', { name: '+ 스케줄 추가' }).click();
    const form = page.locator('form');
    await form.locator('select').selectOption(worker.id);
    await form.locator('input[type=date]').fill(day);
    const proposed = page.waitForResponse(r => r.url().endsWith(`/workers/${worker.id}/schedules`) && r.request().method() === 'POST');
    await page.getByRole('button', { name: '스케줄 제안', exact: true }).click();
    const proposal = await proposed; expect(proposal.status()).toBe(201);
    const schedule = await proposal.json();
    await employee.goto('/my/schedules');
    const approved = employee.waitForResponse(r => r.url().endsWith(`/worker/schedules/${schedule.id}/confirm`));
    await employee.getByTestId(`schedule-${schedule.id}`).getByRole('button', { name: '일정 승인', exact: true }).click();
    expect((await approved).status()).toBe(200);
    await expect(employee.getByTestId(`schedule-${schedule.id}`)).toContainText('CONFIRMED');
    await employee.goto('/dashboard');
    const clocked = employee.waitForResponse(r => r.url().endsWith('/worklogs/my/clock-in'));
    await employee.getByRole('button', { name: /출근하기/ }).click();
    const clock = await clocked; expect(clock.status()).toBe(201);
    const log = await clock.json();
    const checkout = employee.waitForResponse(r => r.url().endsWith('/worklogs/my/clock-out'));
    await employee.getByRole('button', { name: /퇴근하기/ }).click();
    expect((await checkout).status()).toBe(200);
    // Avoid real waiting: the correction UI supplies a completed 90 minute record in the past.
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15, 12));
    const start = new Date(end.getTime() - 90 * 60000);
    await employee.goto('/my/worklogs');
    await employee.getByTestId(`worklog-${log.id}`).getByRole('button', { name: '시간 정정', exact: true }).click();
    const localInput = (date: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(date).replace(' ', 'T').replace(/:00$/, '');
    await employee.getByLabel('출근 일시', { exact: true }).fill(localInput(start));
    await employee.getByLabel('퇴근 일시', { exact: true }).fill(localInput(end));
    await employee.getByLabel('정정 사유', { exact: true }).fill('WT002 synthetic duration');
    const correction = employee.waitForResponse(r => r.url().endsWith(`/worklogs/my/${log.id}/corrections`));
    await employee.getByRole('button', { name: '정정 제출', exact: true }).click();
    expect((await correction).status()).toBe(200);
    const year = start.getUTCFullYear(), month = start.getUTCMonth() + 1;
    const detailURL = `${apiURL}/api/payroll/workers/${worker.id}/monthly?year=${year}&month=${month}`;
    expect((await (await request.get(detailURL, { headers: await auth(employee) })).json()).totalAmount).toBe(0);
    await page.goto(`/worklogs?date=${start.toISOString().slice(0, 10)}`);
    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toContainText('WT002 synthetic duration');
    const confirmed = page.waitForResponse(r => r.url().endsWith(`/work-logs/${log.id}/confirm`));
    await row.getByRole('button', { name: '확정', exact: true }).click();
    expect((await confirmed).status()).toBe(200);
    // Independent expectation: 10001 * 1.5 = 15001.5 -> HALF_UP 15002.
    const detail = await request.get(detailURL, { headers: await auth(employee) });
    expect(detail.status()).toBe(200);
    expect(await detail.json()).toMatchObject({ totalWorkMinutes: 90, totalAmount: 15002 });
    await page.goto('/payroll');
    await page.getByRole('combobox').nth(0).selectOption(String(year));
    await page.getByRole('combobox').nth(1).selectOption(String(month));
    const payrollRow = page.getByRole('row').filter({ hasText: name });
    await expect(payrollRow).toContainText('15,002원');
    await expect(payrollRow).toContainText('1시간 30분');
    await payrollRow.getByRole('button', { name: '상세보기', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/payroll/workers/${worker.id}\\?year=${year}&month=${month}$`));
    await expect(page.getByRole('heading', { name: `${name} · 15,002원` })).toBeVisible();
    await employee.goto('/my/payroll');
    await employee.getByLabel('조회 월').fill(`${year}-${String(month).padStart(2, '0')}`);
    await expect(employee.getByRole('heading', { name: `${name} · 15,002원` })).toBeVisible();
    const saved = await request.get(`${apiURL}/api/work-logs/${log.id}`, { headers: await auth(page) });
    expect(await saved.json()).toMatchObject({ status: 'CONFIRMED', correctionCount: 1, durationMinutes: 90 });
  } finally { await context.close(); }
});

test('real invalid login remains unauthenticated', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(`missing-${randomUUID()}@example.test`);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.locator('.text-red-600')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull();
});
