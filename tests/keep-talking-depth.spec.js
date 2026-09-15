const { test, expect } = require('@playwright/test');

async function openLibraryPhrase(page,query){
  await page.getByRole('button',{name:'Library',exact:true}).click();
  await page.locator('#librarySearch').fill(query);
  await page.locator('[data-library-open]').first().click();
  await expect(page.locator('.hinglish')).toBeVisible();
}

async function expandedChoices(page){
  const trigger=page.getByRole('button',{name:/Keep talking/i});
  await expect(trigger).toBeVisible();
  await trigger.click();
  return page.locator('[data-keep-talking-depth]');
}

test('driver Keep Talking renders six useful next actions and continues deeply', async ({ page }) => {
  await page.route('**/api/gemini', route=>route.abort());
  await page.goto('/');
  await openLibraryPhrase(page,'what time will driver come');
  let choices=await expandedChoices(page);
  await expect(choices).toHaveCount(6);
  let text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).toContain('come ten minutes early');
  expect(text).toContain('downstairs');
  expect(text).toContain('wait near the entrance');
  expect(text).toContain('wait in the car');
  await choices.filter({hasText:'Please come ten minutes early.'}).click();
  choices=await expandedChoices(page);
  await expect(choices).toHaveCount(6);
  text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).toContain('wait until i call you');
  expect(text).toContain('message you when i am ready');
});

test('cook Keep Talking renders six contextual next actions instead of communication fallback', async ({ page }) => {
  await page.route('**/api/gemini', route=>route.abort());
  await page.goto('/');
  await openLibraryPhrase(page,'cook less salt');
  const choices=await expandedChoices(page);
  await expect(choices).toHaveCount(6);
  const text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).toContain('less spicy');
  expect(text).toContain('less oil');
  expect(text).toContain('do not add ghee');
  expect(text).toContain('enough for dinner');
  expect(text).not.toContain('speak a little slower');
  expect(text).not.toContain('say that again');
});

test('maid cleaning Keep Talking renders six practical household continuations', async ({ page }) => {
  await page.route('**/api/gemini', route=>route.abort());
  await page.goto('/');
  await openLibraryPhrase(page,'clean bathroom properly');
  const choices=await expandedChoices(page);
  await expect(choices).toHaveCount(6);
  const text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).toContain('clean the kitchen first');
  expect(text).toContain('sweep and mop');
  expect(text).toContain('clean under the sofa');
  expect(text).toContain('dust the shelves');
});
