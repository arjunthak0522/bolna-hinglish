const { test, expect } = require('@playwright/test');

async function openLibraryPhrase(page, query) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Library', exact: true }).click();
  await page.locator('#librarySearch').fill(query);
  await page.locator('[data-library-open]').first().click();
  await expect(page.locator('.hinglish')).toBeVisible();
}

async function capture(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

test('visual QA - Keep Talking collapsed and expanded', async ({ page }, testInfo) => {
  await openLibraryPhrase(page, 'driver cannot find building');
  await expect(page.getByRole('button', { name: /Keep talking/i })).toBeVisible();
  await capture(page, testInfo, '01-result-collapsed');

  await page.getByRole('button', { name: /Keep talking/i }).click();
  await expect(page.locator('[data-keep-talking]')).toHaveCount(3);
  await capture(page, testInfo, '02-driver-expanded');
});

test('visual QA - two-choice complaint state', async ({ page }, testInfo) => {
  await openLibraryPhrase(page, 'something is missing from my order');
  await page.getByRole('button', { name: /Keep talking/i }).click();
  await expect(page.locator('[data-keep-talking]')).toHaveCount(2);
  await capture(page, testInfo, '03-two-choice-expanded');
});
