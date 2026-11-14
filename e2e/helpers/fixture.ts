import { expect, APIRequestContext, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
export const api = 'http://127.0.0.1:8080/api';
export const password = 'WT002-synthetic-password';
export async function fixture(request: APIRequestContext) {
  const email = `${randomUUID()}@example.test`, workerEmail = `${randomUUID()}@example.test`;
  const signup = await request.post(`${api}/auth/owners/signup`, { data: { email, password, name: 'Regression owner' } });
  expect(signup.status()).toBe(201);
  const owner = await signup.json(), ownerHeaders = { Authorization: `Bearer ${owner.accessToken}` };
  const created = await request.post(`${api}/workers`, { headers: ownerHeaders, data: { name: `WT-${randomUUID().slice(0,8)}`, phoneNumber: '00000000000' } });
  expect(created.status()).toBe(201);
  const worker = await created.json();
  const invitation = await request.post(`${api}/workers/${worker.id}/invite`, { headers: ownerHeaders });
  expect(invitation.status()).toBe(200);
  const code = (await invitation.json()).inviteCode;
  const joined = await request.post(`${api}/auth/workers/signup`, { data: { email: workerEmail, password, inviteCode: code } });
  expect(joined.status()).toBe(201);
  const employee = await joined.json(), employeeHeaders = { Authorization: `Bearer ${employee.accessToken}` };
  const now = new Date(), year = now.getUTCFullYear() - 1;
  const date = `${year}-06-15`, start = `${date}T09:00:00Z`;
  async function log(at = start, minutes = 30) {
    const response = await request.post(`${api}/workers/${worker.id}/clock-in`, { headers: employeeHeaders, data: { clockInAt: at } });
    expect(response.status()).toBe(201);
    const record = await response.json();
    const out = await request.post(`${api}/workers/${worker.id}/clock-out`, { headers: employeeHeaders, data: { clockOutAt: new Date(Date.parse(at) + minutes * 60000).toISOString() } });
    expect(out.status()).toBe(200);
    return { ...record, ...await out.json() };
  }
  async function wage(amount = 10001, startDate = '2020-01-01') {
    const response = await request.post(`${api}/workers/${worker.id}/wage-contracts`, { headers: ownerHeaders, data: { hourlyWage: amount, startDate } });
    expect(response.status()).toBe(201);
  }
  async function saved(id: string) {
    const response = await request.get(`${api}/work-logs/${id}`, { headers: ownerHeaders });
    expect(response.status()).toBe(200); return response.json();
  }
  async function amount() {
    const response = await request.get(`${api}/payroll/workers/${worker.id}/monthly?year=${year}&month=6`, { headers: ownerHeaders });
    expect(response.status()).toBe(200); return (await response.json()).totalAmount;
  }
  return { email, workerEmail, worker, ownerHeaders, employeeHeaders, code, date, start, year, log, wage, saved, amount };
}
export async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
