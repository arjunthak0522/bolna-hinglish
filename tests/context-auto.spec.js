const { test, expect } = require('@playwright/test');

test('Talking to controls stay hidden and idle context resets automatically', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bolna_context','Delivery'));
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveText('bolna');
  await expect(page.getByText('Talking to').first()).toBeHidden();
  await expect(page.locator('.contextRow')).toBeHidden();
  await expect(page.locator('#context')).toHaveValue('General');
  await expect.poll(async()=>page.evaluate(()=>localStorage.getItem('bolna_context'))).toBe('General');
});

test('automatic context controller does not reset context during generation', async ({ page }) => {
  const seen=[];
  await page.route('https://hinglish-companion.vercel.app/api/gemini', async route => {
    const body=JSON.parse(route.request().postData()||'{}');
    seen.push(body);
    if(body.operation==='generate')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,data:{output_text:JSON.stringify({intendedEnglish:'Can I get the bill?',intentStatus:'resolved',alternatives:[],natural:'Bill le aaiye.',spokenForm:'Bill le aaiye.',phonetic:'bill lay AA-ee-yay',meaning:'Can I get the bill?',speechText:'Bill le aaiye.',confidence:.98,phoneticConfidence:'high',nextSuggestions:['Can I pay by card?','Can you split the bill?','Can I get a receipt?','Please pack this to go.','Thank you.']})}})});
    if(body.operation==='tts')return route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({ok:false,category:'quota_exhausted'})});
    return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({ok:false,category:'invalid_client_request'})});
  });
  await page.goto('/');
  await expect(page.locator('#typed')).toBeVisible();
  await page.locator('#typed').fill('Can I get the bill?');
  await page.getByRole('button',{name:'Turn this into Hinglish'}).click();
  await expect(page.locator('.hinglish')).toBeVisible();
  const generate=seen.find(x=>x.operation==='generate');
  expect(generate).toBeTruthy();
  expect(generate.prompt).toContain('Context: "Restaurant"');
  await expect(page.locator('.resultContext')).toBeHidden();
});
