import { test, expect } from '@playwright/test';
import { fixture, login } from './helpers/fixture';

test('keyboard login and rejection modal can be completed without pointer input', async ({ page, request }) => {
  const f = await fixture(request); await f.log(); await page.goto('/login');
  await page.getByLabel('이메일').focus(); await page.keyboard.type(f.email); await page.keyboard.press('Tab');
  await expect(page.getByLabel('비밀번호', { exact: true })).toBeFocused(); await page.keyboard.type('WT002-synthetic-password'); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/dashboard$/); await page.goto(`/worklogs?date=${f.date}`);
  const reject = page.getByRole('row').filter({ hasText: f.worker.name }).getByRole('button', { name: '반려', exact: true });
  await reject.focus(); await page.keyboard.press('Enter');
  const reason = page.getByPlaceholder('반려 사유를 입력해주세요 (예: 출근 시간이 맞지 않음)');
  await reason.focus(); await page.keyboard.type('Keyboard reason'); await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '취소', exact: true })).toBeFocused(); await page.keyboard.press('Enter');
  await expect(reason).toHaveCount(0);
});

test('core payroll view reload preserves real login across browser engines', async ({ page, request }) => {
  const f = await fixture(request); await login(page, f.workerEmail); await page.goto('/my/payroll'); await page.reload();
  await expect(page.getByRole('heading', { name: '예상 급여 상세', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: `${f.worker.name} · 0원` })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeTruthy();
});
