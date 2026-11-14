import { test, expect } from '@playwright/test';

test('anonymous user is redirected to login from payroll', async ({ page }) => {
  await page.goto('/payroll');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('이메일')).toBeVisible();
  await expect(page.getByLabel('비밀번호')).toBeVisible();
});
