import { test, expect } from '@playwright/test';

test('anonymous user is redirected to login from payroll', async ({ page }) => {
  await page.goto('/payroll');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('이메일')).toBeVisible();
  await expect(page.getByLabel('비밀번호')).toBeVisible();
});

test('invalid credentials do not open an authenticated session', async ({ page }) => {
  test.skip(!process.env.WT_E2E_INVALID_EMAIL || !process.env.WT_E2E_INVALID_PASSWORD,
    'Provide deliberately invalid, synthetic credentials to run against a development API');
  await page.goto('/login');
  await page.getByLabel('이메일').fill(process.env.WT_E2E_INVALID_EMAIL!);
  await page.getByLabel('비밀번호').fill(process.env.WT_E2E_INVALID_PASSWORD!);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('owner can open monthly payroll after real API login', async ({ page }) => {
  test.skip(!process.env.WT_E2E_OWNER_EMAIL || !process.env.WT_E2E_OWNER_PASSWORD,
    'Isolated development owner account is required; never use production credentials');
  await page.goto('/login');
  await page.getByLabel('이메일').fill(process.env.WT_E2E_OWNER_EMAIL!);
  await page.getByLabel('비밀번호').fill(process.env.WT_E2E_OWNER_PASSWORD!);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/payroll');
  await expect(page.getByText('월별 급여 요약')).toBeVisible();
});
