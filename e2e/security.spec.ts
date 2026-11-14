import { test, expect } from '@playwright/test';
import { randomUUID, createHmac } from 'node:crypto';

const api = 'http://127.0.0.1:8080/api';
const password = 'WT002-synthetic-password';

test('owners and workers cannot read or change another tenant and forbidden access preserves login', async ({ request, page }) => {
  async function owner() {
    const email = `${randomUUID()}@example.test`;
    const r = await request.post(`${api}/auth/owners/signup`, { data: { email, password, name: 'Synthetic' } });
    expect(r.status()).toBe(201);
    return { email, ...await r.json() };
  }
  const first = await owner(), other = await owner();
  const headers = { Authorization: `Bearer ${first.accessToken}` };
  const foreign = { Authorization: `Bearer ${other.accessToken}` };
  const storeResponse = await request.post(`${api}/stores`, { headers, data: { name: 'WT002 private store' } });
  expect(storeResponse.status()).toBe(201);
  const store = await storeResponse.json();
  const workerResponse = await request.post(`${api}/workers`, { headers, data: { name: 'Private worker', phoneNumber: '00000000000', storeId: store.id } });
  expect(workerResponse.status()).toBe(201);
  const worker = await workerResponse.json();
  const invitation = await request.post(`${api}/workers/${worker.id}/invite`, { headers });
  expect(invitation.status()).toBe(200);
  const workerEmail = `${randomUUID()}@example.test`;
  const signup = await request.post(`${api}/auth/workers/signup`, { data: { email: workerEmail, password, inviteCode: (await invitation.json()).inviteCode } });
  expect(signup.status()).toBe(201);
  const linked = await signup.json();
  for (const path of [`/stores/${store.id}`, `/workers/${worker.id}`, `/workers/${worker.id}/wage-contracts`, `/payroll/workers/${worker.id}/monthly?year=2026&month=1`]) {
    expect((await request.get(`${api}${path}`, { headers: foreign })).status(), path).toBe(404);
  }
  const denied = await request.put(`${api}/workers/${worker.id}`, { headers: foreign, data: { name: 'Intruder', phoneNumber: '99999999999' } });
  expect(denied.status()).toBe(404);
  // Another linked worker under the same owner must not inherit this worker's reads.
  const peerResponse = await request.post(`${api}/workers`, { headers, data: { name: 'Peer worker', phoneNumber: '00000000001' } });
  expect(peerResponse.status()).toBe(201);
  const peer = await peerResponse.json();
  const peerInvite = await request.post(`${api}/workers/${peer.id}/invite`, { headers });
  expect(peerInvite.status()).toBe(200);
  const peerSignup = await request.post(`${api}/auth/workers/signup`, { data: { email: `${randomUUID()}@example.test`, password, inviteCode: (await peerInvite.json()).inviteCode } });
  expect(peerSignup.status()).toBe(201);
  const peerHeaders = { Authorization: `Bearer ${(await peerSignup.json()).accessToken}` };
  for (const path of [`/workers/${worker.id}/wage-contracts`, `/payroll/workers/${worker.id}/monthly?year=2026&month=1`, `/workers/${worker.id}/work-logs`]) {
    expect((await request.get(`${api}${path}`, { headers: peerHeaders })).status(), path).toBe(404);
  }
  const workerHeaders = { Authorization: `Bearer ${linked.accessToken}` };
  expect((await request.post(`${api}/workers/${worker.id}/wage-contracts`, { headers: workerHeaders, data: { hourlyWage: 1, startDate: '2020-01-01' } })).status()).toBe(403);
  expect((await request.get(`${api}/payroll/owner/monthly?year=2026&month=1`, { headers: workerHeaders })).status()).toBe(403);
  expect(await (await request.get(`${api}/workers/${worker.id}`, { headers })).json()).toMatchObject({ worker: { name: 'Private worker', phoneNumber: '00000000000' } });
  const ownWorkers = await request.get(`${api}/workers`, { headers: foreign });
  expect(await ownWorkers.json()).toEqual([]);
  // Real browser session: a 403 from Axios must retain the worker session.
  await page.goto('/login');
  await page.getByLabel('이메일').fill(workerEmail);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  const status = await page.evaluate(async () => {
    const { default: client } = await import('/src/lib/apiClient.ts');
    try { await client.get('/payroll/owner/monthly?year=2026&month=1'); return 200; }
    catch (error: any) { return error.response.status; }
  });
  expect(status).toBe(403);
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBe(token);
});

test('signed expired JWT is rejected and real login restores the browser session', async ({ request, page }) => {
  const email = `${randomUUID()}@example.test`;
  const signup = await request.post(`${api}/auth/owners/signup`, { data: { email, password, name: 'Expiry test' } });
  expect(signup.status()).toBe(201);
  const account = await signup.json();
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: account.userId, role: 'OWNER', exp: Math.floor(Date.now() / 1000) - 60 })}`;
  const expired = `${unsigned}.${createHmac('sha256', 'wt002-disposable-e2e-signing-key-at-least-32-bytes').update(unsigned).digest('base64url')}`;
  expect((await request.get(`${api}/workers`, { headers: { Authorization: `Bearer ${expired}` } })).status()).toBe(401);
  await page.goto('/login');
  await page.evaluate(({ expired, account, email }) => {
    localStorage.setItem('accessToken', expired);
    localStorage.setItem('user', JSON.stringify({ userId: account.userId, ownerId: account.ownerId, role: 'OWNER', email }));
  }, { expired, account, email });
  await page.goto('/workers');
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull();
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).not.toBe(expired);
  await page.goto('/workers');
  await expect(page.getByRole('heading', { name: '알바생 관리' })).toBeVisible();
});
