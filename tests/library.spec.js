const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('library loads expanded static phrases with Hinglish and phonetics without Gemini', async ({ page }) => {
  let geminiCalls = 0;
  await page.route('**/api/gemini', async route => { geminiCalls += 1; await route.abort(); });
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByRole('heading', { name: 'India Phrase Library' })).toBeVisible();
  await expect(page.getByText('Bhaiya, bas yahin rok dena.')).toBeVisible();
  await expect(page.getByText('BHAI-yaa, bus ya-HEE(n) rohk DAY-naa')).toBeVisible();
  expect(await page.locator('.phraseLibraryCard').count()).toBeGreaterThanOrEqual(170);
  expect(geminiCalls).toBe(0);
});

test('library search understands rough English intent and keeps reranking as query changes', async ({ page }) => {
  await page.getByRole('button', { name: 'Library' }).click();
  const search = page.getByPlaceholder('Search in English…');

  await search.fill('mall distance');
  await expect(page.locator('.phraseLibraryCard').first().getByText('How far is the mall?')).toBeVisible();

  await search.fill('mall distance walking');
  await expect(page.locator('.phraseLibraryCard').first().getByText('Is the mall within walking distance?')).toBeVisible();

  await search.fill('maid tomorrow no come');
  await expect(page.locator('.phraseLibraryCard').first().getByText('You do not need to come tomorrow.')).toBeVisible();

  await search.fill('UPI');
  await expect(page.getByText('Can I pay by UPI?')).toBeVisible();
  await expect(page.getByText('Please stop right here.')).toHaveCount(0);
});

test('library category filtering still works with intelligent search', async ({ page }) => {
  await page.getByRole('button', { name: 'Library' }).click();
  const search = page.getByPlaceholder('Search in English…');
  await search.fill('');
  await page.locator('#libraryCategory').selectOption({ label: 'Restaurants' });
  await expect(page.getByText('Can I get the bill?')).toBeVisible();
  await expect(page.getByText('Can I pay by UPI?')).toHaveCount(0);
});

test('no strong match can be handed to Speak without calling Gemini during search', async ({ page }) => {
  let geminiCalls = 0;
  await page.route('**/api/gemini', async route => { geminiCalls += 1; await route.abort(); });
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByPlaceholder('Search in English…').fill('purple submarine umbrella');
  await expect(page.getByRole('button', { name: 'Ask Bolna with this' })).toBeVisible();
  expect(geminiCalls).toBe(0);
  await page.getByRole('button', { name: 'Ask Bolna with this' }).click();
  await expect(page.locator('#typed')).toHaveValue('purple submarine umbrella');
});

test('opening a library phrase shows phonetics and can save to My Phrases', async ({ page }) => {
  await page.getByRole('button', { name: 'Library' }).click();
  const haircut = page.locator('[data-library-open]').filter({ hasText: 'Your haircut looks great.' });
  await haircut.click();
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
