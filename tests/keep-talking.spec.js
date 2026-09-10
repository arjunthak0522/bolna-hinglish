const { test, expect } = require('@playwright/test');

function pcmBase64(){return Buffer.alloc(4800).toString('base64');}

async function openLibraryPhrase(page,query){
  await page.getByRole('button',{name:'Library',exact:true}).click();
  await page.locator('#librarySearch').fill(query);
  await page.locator('[data-library-open]').first().click();
  await expect(page.locator('.hinglish')).toBeVisible();
}

async function keepChoices(page){
  await expect(page.getByRole('button',{name:/Keep talking/i})).toBeVisible();
  await page.getByRole('button',{name:/Keep talking/i}).click();
  return page.locator('[data-keep-talking]');
}

test('Keep Talking shows coherent water continuations and stays fully local', async ({ page }) => {
  const requests=[];
  await page.route('**/api/gemini', route=>{requests.push(route.request().postData());return route.abort();});
  await page.goto('/');
  await openLibraryPhrase(page,'water stopped');
  const choices=await keepChoices(page);
  await expect(choices).toHaveCount(3);
  const text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).toContain('when will the water come back');
  expect(text).toContain('when does the water supply come');
  expect(text).toContain('water tank is empty');
  expect(text).not.toContain('repair cost');
  expect(requests).toHaveLength(0);
});

test('driver flow never reverses location ownership and stays local', async ({ page }) => {
  let requests=0;
  await page.route('**/api/gemini', route=>{requests++;return route.abort();});
  await page.goto('/');
  await openLibraryPhrase(page,'driver cannot find building');
  let choices=await keepChoices(page);
  await expect(choices).toHaveCount(3);
  let text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).not.toContain('send me your location');
  expect(text).toContain('come to the main gate');
  await choices.filter({hasText:'Please come to the main gate.'}).click();
  await expect(page.locator('.heard span')).toContainText('Please come to the main gate.');
  choices=await keepChoices(page);
  await expect(choices).toHaveCount(3);
  text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).toContain('call me when you reach');
  expect(requests).toBe(0);
});

test('tanker flow does not jump into repair conversation', async ({ page }) => {
  await page.route('**/api/gemini', route=>route.abort());
  await page.goto('/');
  await openLibraryPhrase(page,'water tanker');
  const choices=await keepChoices(page);
  const text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).toContain('call me before you come');
  expect(text).not.toContain('repair cost');
  expect(text).not.toContain('plumber');
});

test('selected Keep Talking phrase can be saved, found in My Phrases, and returns to Speak cleanly', async ({ page }) => {
  await page.route('**/api/gemini', route=>route.abort());
  await page.goto('/');
  await openLibraryPhrase(page,'plumber today');
  const choices=await keepChoices(page);
  await choices.filter({hasText:'What time will the technician come?'}).click();
  await expect(page.locator('.heard span')).toContainText('What time will the technician come?');
  await page.getByRole('button',{name:/Save/i}).click();
  await expect(page.getByRole('button',{name:/Saved/i})).toBeVisible();
  await page.getByRole('button',{name:'My Phrases',exact:true}).click();
  await expect(page.getByRole('button',{name:/What time will the technician come\?/i})).toBeVisible();
  await page.getByRole('button',{name:'Speak',exact:true}).click();
  await expect(page.locator('#mic')).toBeVisible();
  await expect(page.locator('.micLabel')).toHaveText('Tap to speak');
});

test('Hear It still works after Keep Talking selection and only TTS calls Gemini', async ({ page }) => {
  const ops=[];
  await page.route('**/api/gemini', async route=>{
    const body=JSON.parse(route.request().postData()||'{}');
    ops.push(body.operation);
    if(body.operation==='tts')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,data:{output_audio:{data:pcmBase64(),mime_type:'audio/pcm'}}})});
    return route.abort();
  });
  await page.goto('/');
  await openLibraryPhrase(page,'medicine another brand');
  const choices=await keepChoices(page);
  await choices.filter({hasText:'Do you have a generic version?'}).click();
  expect(ops).toEqual([]);
  await page.getByRole('button',{name:/Hear it/i}).click();
  await expect.poll(()=>ops.filter(x=>x==='tts').length).toBeGreaterThan(0);
  expect(ops.every(x=>x==='tts')).toBeTruthy();
  await expect(page.getByRole('button',{name:/Hear it/i})).toBeVisible();
});

test('medicine delivery stays with pharmacy logistics rather than dosing advice', async ({ page }) => {
  await page.goto('/');
  await openLibraryPhrase(page,'deliver this medicine tonight');
  const choices=await keepChoices(page);
  const text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).not.toContain('times a day');
  expect(text).not.toContain('with food');
  expect(text).not.toContain('empty stomach');
});

test('Keep Talking uses communication-repair flow when context is general', async ({ page }) => {
  await page.goto('/');
  await openLibraryPhrase(page,'understand a little Hindi');
  const choices=await keepChoices(page);
  await expect(choices).toHaveCount(3);
  const text=(await page.locator('.keepTalkingList').innerText()).toLowerCase();
  expect(text).toMatch(/slower/);
  expect(text).toMatch(/again/);
  expect(text).toMatch(/simply/);
});
