const { test, expect } = require('@playwright/test');

test('Keep Talking appears after a Library phrase and stays fully local', async ({ page }) => {
  const requests=[];
  await page.route('https://hinglish-companion.vercel.app/api/gemini', route=>{requests.push(route.request().postData());return route.abort();});
  await page.goto('/');
  await page.getByRole('button',{name:'Library',exact:true}).click();
  await page.locator('#librarySearch').fill('stop here');
  await page.locator('[data-library-open]').first().click();
  await expect(page.locator('.hinglish')).toBeVisible();
  await expect(page.getByRole('button',{name:/Keep talking/i})).toBeVisible();
  await page.getByRole('button',{name:/Keep talking/i}).click();
  const choices=page.locator('[data-keep-talking]');
  await expect(choices).toHaveCount(5);
  await expect(choices.filter({hasText:/call me|gate|wait|location/i}).first()).toBeVisible();
  expect(requests).toHaveLength(0);
});

test('choosing a Keep Talking suggestion opens the next phrase without Gemini', async ({ page }) => {
  let requests=0;
  await page.route('https://hinglish-companion.vercel.app/api/gemini', route=>{requests++;return route.abort();});
  await page.goto('/');
  await page.getByRole('button',{name:'Library',exact:true}).click();
  await page.locator('#librarySearch').fill('plumber today');
  await page.locator('[data-library-open]').first().click();
  const before=await page.locator('.heard span').textContent();
  await page.getByRole('button',{name:/Keep talking/i}).click();
  await page.locator('[data-keep-talking]').first().click();
  await expect(page.locator('.hinglish')).toBeVisible();
  const after=await page.locator('.heard span').textContent();
  expect(after).not.toBe(before);
  await expect(page.getByRole('button',{name:/Keep talking/i})).toBeVisible();
  expect(requests).toBe(0);
});

test('Keep Talking uses communication-repair fallbacks when context is general', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Library',exact:true}).click();
  await page.locator('#librarySearch').fill('understand a little Hindi');
  await page.locator('[data-library-open]').first().click();
  await page.getByRole('button',{name:/Keep talking/i}).click();
  const text=await page.locator('.keepTalkingList').innerText();
  expect(text.toLowerCase()).toMatch(/slower|again|write|whatsapp/);
});
