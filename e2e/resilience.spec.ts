import { test, expect } from '@playwright/test';
import { api, fixture, login, password } from './helpers/fixture';
import { randomUUID } from 'node:crypto';

for (const path of ['/workers', '/payroll', '/store/settings', '/owner/dashboard']) {
  test(`worker direct owner route ${path} never renders management controls`, async ({ page, request }) => {
    const f = await fixture(request); await login(page, f.workerEmail);
    page.on('dialog', d => d.accept());
    await page.goto(path); await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('button', { name: '+ 알바생 추가' })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeTruthy();
  });
}

test('reload restores session and logout plus back navigation cannot restore protected content', async ({ page, request }) => {
  const f = await fixture(request); await login(page, f.email);
  await page.goto('/workers'); await page.reload(); await expect(page.getByText(f.worker.name, { exact: true })).toBeVisible();
  page.on('dialog', d => d.accept()); await page.getByRole('button', { name: '로그아웃' }).click();
  await expect(page).toHaveURL(/\/login$/); await page.goBack(); await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull();
  await page.goto('/payroll'); await expect(page).toHaveURL(/\/login$/);
});

test('used and unknown invitation codes cannot create a second worker account', async ({ page, request }) => {
  const f = await fixture(request);
  for (const code of [f.code, 'ZZZZZZ']) {
    await page.goto('/signup/worker'); await page.getByLabel('초대 코드').fill(code);
    await page.getByLabel('이메일').fill(`${randomUUID()}@example.test`);
    await page.getByLabel('비밀번호', { exact: true }).fill(password); await page.getByLabel('비밀번호 확인').fill(password);
    const response = page.waitForResponse(r => r.url().endsWith('/auth/workers/signup'));
    await page.getByRole('button', { name: '회원가입', exact: true }).click();
    expect((await response).status()).toBe(404); await expect(page).toHaveURL(/\/signup\/worker$/);
  }
  const profile = await request.get(`${api}/workers/my`, { headers: f.employeeHeaders }); expect(profile.status()).toBe(200);
  expect((await profile.json()).id).toBe(f.worker.id);
});

for (const failure of ['500', 'offline']) {
  test(`approval ${failure} keeps unconfirmed payroll and permits one successful retry`, async ({ page, request }) => {
    const f = await fixture(request); await f.wage(); const log = await f.log();
    await login(page, f.email); await page.goto(`/worklogs?date=${f.date}`);
    const dialogs: string[] = []; page.on('dialog', d => { dialogs.push(d.message()); return d.accept(); });
    let attempts = 0;
    await page.route(`**/work-logs/${log.id}/confirm`, async route => {
      attempts++;
      if (attempts === 1) {
        if (failure === '500') await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"synthetic failure"}' });
        else await route.abort('internetdisconnected');
      } else await route.continue();
    });
    const row = page.getByRole('row').filter({ hasText: f.worker.name });
    await row.getByRole('button', { name: '확정', exact: true }).click();
    await expect.poll(() => dialogs.some(s => s.includes('다시 조회'))).toBe(true);
    await expect(row.getByRole('button', { name: '확정', exact: true })).toBeVisible();
    expect(await f.amount()).toBe(0); expect((await f.saved(log.id)).status).toBe('COMPLETED');
    await row.getByRole('button', { name: '확정', exact: true }).click(); await expect.poll(f.amount).toBe(5001);
    expect(attempts).toBe(2); expect((await f.saved(log.id)).status).toBe('CONFIRMED');
  });
}

test('delayed approval stays pending and repeated clicks cannot submit a duplicate', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  await login(page, f.email); await page.goto(`/worklogs?date=${f.date}`); page.on('dialog', d => d.accept());
  let release!: () => void; const hold = new Promise<void>(resolve => { release = resolve; }); let calls = 0;
  await page.route(`**/work-logs/${log.id}/confirm`, async route => { calls++; await hold; await route.continue(); });
  try {
    await page.getByRole('row').filter({ hasText: f.worker.name }).getByRole('button', { name: '확정', exact: true })
      .evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
    await expect.poll(() => calls).toBe(1); expect(await f.amount()).toBe(0);
    expect((await f.saved(log.id)).status).toBe('COMPLETED');
  } finally { release(); }
  await expect.poll(f.amount).toBe(5001); expect(calls).toBe(1);
});

test('older payroll responses cannot overwrite the latest year month and worker filters', async ({ page, request }) => {
  const f = await fixture(request); await f.wage(); const log = await f.log();
  expect((await request.post(`${api}/work-logs/${log.id}/confirm`, { headers: f.ownerHeaders })).status()).toBe(200);
  await login(page, f.email); await page.goto('/payroll'); await expect(page.getByRole('combobox')).toHaveCount(3);
  let release!: () => void; const hold = new Promise<void>(resolve => { release = resolve; }); let held = false;
  await page.route('**/api/payroll/owner/monthly?*', async route => {
    const url = new URL(route.request().url()); const response = await route.fetch();
    if (url.searchParams.get('month') === '5' && !held) { held = true; await hold; }
    await route.fulfill({ response });
  });
  try {
    await page.getByRole('combobox').nth(0).selectOption(String(f.year));
    await page.getByRole('combobox').nth(1).selectOption('5'); await expect.poll(() => held).toBe(true);
    await page.getByRole('combobox').nth(1).selectOption('6');
    await page.getByRole('combobox').nth(2).selectOption(f.worker.id);
    await expect(page.getByRole('row').filter({ hasText: f.worker.name })).toContainText('5,001원');
  } finally { release(); }
  // Wait for the held real response to reach the page before checking for stale overwrite.
  await page.waitForResponse(r => r.url().includes('/payroll/owner/monthly') && new URL(r.url()).searchParams.get('month') === '5');
  await expect(page.getByRole('combobox').nth(1)).toHaveValue('6');
  await expect(page.getByRole('row').filter({ hasText: f.worker.name })).toContainText('5,001원');
});

test('expired invitation fails signup without linking or creating an account', async ({ page, request }) => {
  const f = await fixture(request);
  const created = await request.post(`${api}/workers`, { headers: f.ownerHeaders, data: { name: 'Expired invitation', phoneNumber: '00000000000' } });
  expect(created.status()).toBe(201); const worker = await created.json();
  const invitation = await request.post(`${api}/workers/${worker.id}/invite`, { headers: f.ownerHeaders });
  expect(invitation.status()).toBe(200); const code = (await invitation.json()).inviteCode;
  // A test-classpath, disposable-profile-only fixture expires this one invitation.
  const endpoint = `${api}/e2e/fixtures/workers/${worker.id}/expire-invite`;
  expect((await request.post(endpoint, { headers: f.employeeHeaders })).status()).toBe(403);
  expect((await request.post(endpoint, { headers: f.ownerHeaders })).status()).toBe(200);
  const email = `${randomUUID()}@example.test`;
  await page.goto('/signup/worker'); await page.getByLabel('초대 코드').fill(code); await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호', { exact: true }).fill(password); await page.getByLabel('비밀번호 확인').fill(password);
  const rejected = page.waitForResponse(r => r.url().endsWith('/auth/workers/signup'));
  await page.getByRole('button', { name: '회원가입', exact: true }).click(); expect((await rejected).status()).toBe(400);
  await expect(page).toHaveURL(/\/signup\/worker$/);
  expect((await (await request.get(`${api}/workers/${worker.id}`, { headers: f.ownerHeaders })).json()).worker.hasAccount).toBe(false);
  expect((await request.post(`${api}/auth/login`, { data: { email, password } })).status()).toBe(401);
});

test('failed worker creation retains form input and retry creates one worker', async ({ page, request }) => {
  const f = await fixture(request); await login(page, f.email); await page.goto('/workers');
  await page.getByRole('button', { name: '+ 알바생 추가' }).click();
  const name = `Retry-${randomUUID().slice(0,8)}`;
  await page.getByPlaceholder('홍길동').fill(name); await page.getByPlaceholder('01012345678').fill('00000000000');
  let calls = 0;
  await page.route('**/api/workers', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    calls++;
    if (calls === 1) await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    else await route.continue();
  });
  await page.getByRole('button', { name: '추가', exact: true }).click();
  await expect(page.getByText('알바생 추가에 실패했습니다.', { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('홍길동')).toHaveValue(name); await expect(page.getByPlaceholder('01012345678')).toHaveValue('00000000000');
  const response = page.waitForResponse(r => r.url().endsWith('/api/workers') && r.request().method() === 'POST');
  await page.getByRole('button', { name: '추가', exact: true }).click(); expect((await response).status()).toBe(201);
  await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(1);
  const workers = await request.get(`${api}/workers`, { headers: f.ownerHeaders }); expect(workers.status()).toBe(200);
  expect((await workers.json()).filter((w: { name: string }) => w.name === name)).toHaveLength(1); expect(calls).toBe(2);
});
