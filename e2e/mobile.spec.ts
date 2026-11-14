import { test, expect } from '@playwright/test';
import { fixture, login } from './helpers/fixture';

test('mobile worker can reach clock controls and payroll navigation without horizontal page overflow', async ({ page, request }) => {
  const f = await fixture(request); await login(page, f.workerEmail);
  await expect(page.getByRole('button', { name: '출근하기', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /예상 급여/ }).click(); await expect(page.getByRole('heading', { name: '예상 급여 상세' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('mobile owner rejection modal and buttons stay within the viewport and can submit', async ({ page, request }) => {
  const f = await fixture(request); const log = await f.log(); await login(page, f.email); await page.goto(`/worklogs?date=${f.date}`);
  await page.getByRole('row').filter({ hasText: f.worker.name }).getByRole('button', { name: '반려', exact: true }).click();
  const reason = page.getByPlaceholder('반려 사유를 입력해주세요 (예: 출근 시간이 맞지 않음)'); await reason.fill('Mobile rejection');
  const button = page.getByRole('button', { name: '반려 확정', exact: true }); const box = await button.boundingBox();
  expect(box).not.toBeNull(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await button.click(); await expect.poll(async () => (await f.saved(log.id)).status).toBe('REJECTED');
});

test('mobile correction dialog fits viewport and keyboard escape preserves the record', async ({ page, request }) => {
  const f = await fixture(request); const log = await f.log(); await login(page, f.workerEmail);
  await page.goto('/my/worklogs'); await page.getByLabel('조회 월').fill(`${f.year}-06`);
  const button = page.getByTestId(`worklog-${log.id}`).getByRole('button', { name: '시간 정정', exact: true }); await button.click();
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect(page.getByLabel('출근 일시', { exact: true })).toBeFocused();
  await page.getByLabel('정정 사유', { exact: true }).fill('취소할 입력'); await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0); await expect(button).toBeFocused(); expect((await f.saved(log.id)).correctionCount).toBe(0);
});
