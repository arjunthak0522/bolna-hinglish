const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('library loads static phrases with Hinglish and phonetics without Gemini', async ({ page }) => {
  let geminiCalls = 0;
  await page.route('**/api/gemini', async route => { geminiCalls += 1; await route.abort(); });
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByRole('heading', { name: 'India Phrase Library' })).toBeVisible();
  await expect(page.getByText('Bhaiya, bas yahin rok dena.')).toBeVisible();
  await expect(page.getByText('BHAI-yaa, bus ya-HEE(n) rohk DAY-naa')).toBeVisible();
  await expect(page.locator('.phraseLibraryCard')).toHaveCount(72);
  expect(geminiCalls).toBe(0);
});

test('library search and category filtering work', async ({ page }) => {
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByPlaceholder('Search phrases…').fill('UPI');
  await expect(page.getByText('Can I pay by UPI?')).toBeVisible();
  await expect(page.getByText('Please stop right here.')).toHaveCount(0);
  await page.getByPlaceholder('Search phrases…').fill('');
  await page.locator('#libraryCategory').selectOption({ label: 'Restaurants' });
  await expect(page.getByText('Can I get the bill?')).toBeVisible();
  await expect(page.getByText('Can I pay by UPI?')).toHaveCount(0);
});

test('opening a library phrase shows phonetics and can save to My Phrases', async ({ page }) => {
  await page.getByRole('button', { name: 'Library' }).click();
  await page.locator('[data-library-open="70"]').click();
  await expect(page.getByRole('heading', { name: 'Bhai, haircut mast hai!' })).toBeVisible();
  await expect(page.getByText('bhai, HAIR-cut must hai')).toBeVisible();
  await page.getByRole('button', { name: /Save/ }).click();
  await page.getByRole('button', { name: 'My Phrases' }).click();
  await expect(page.getByText('Bhai, haircut mast hai!')).toBeVisible();
});

test('existing Speak flow remains available after visiting library', async ({ page }) => {
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('button', { name: 'Speak' }).click();
  await expect(page.getByRole('heading', { name: 'What do you want to say?' })).toBeVisible();
  await expect(page.locator('#mic')).toBeVisible();
  await expect(page.locator('.micLabel')).toHaveText('Tap to speak');
});
