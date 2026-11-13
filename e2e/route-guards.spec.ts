import { test, expect } from '@playwright/test';

// Browser-only regression tests. They do not depend on development API credentials.
for (const route of ['/dashboard', '/workers', '/schedule', '/worklogs', '/payroll']) {
  test(`anonymous access to ${route} redirects to login`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('이메일')).toBeVisible();
    await expect(page.getByLabel('비밀번호')).toBeVisible();
  });
}

test('login form requires email and password before submitting', async ({ page }) => {
  await page.goto('/login');
  const email = page.getByLabel('이메일');
  const password = page.getByLabel('비밀번호');
  const submit = page.getByRole('button', { name: '로그인', exact: true });
  await submit.click();
  await expect(email).toHaveJSProperty('validity', expect.objectContaining({ valueMissing: true }));
  await expect(page).toHaveURL(/\/login$/);
  await email.fill('synthetic@example.test');
  await submit.click();
  await expect(password).toHaveJSProperty('validity', expect.objectContaining({ valueMissing: true }));
  await expect(page).toHaveURL(/\/login$/);
});
