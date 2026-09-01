const { test, expect } = require('@playwright/test');

const core = {
  natural: 'Bhaiya, bas yahin rok dena.',
  spokenForm: 'Bhaiya, bas yahin rok dena.',
  phonetic: 'BHAI-yaa, bus ya-HEE(n) rohk DAY-naa',
  meaning: 'Please stop right here.',
  speechText: 'Bhaiya, bas yahin rok dena.',
  confidence: 0.98,
  phoneticConfidence: 'high',
};

async function installGeminiMock(page) {
  const pcm = Buffer.alloc(12000).toString('base64');
  await page.route('https://generativelanguage.googleapis.com/**', async route => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.model === 'gemini-3.1-flash-tts-preview') {
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({output_audio:{data:pcm,mime_type:'audio/pcm'}})});
    }
    const hasAudio = Array.isArray(body.input) && body.input.some(x => x && x.type === 'audio');
    if (hasAudio) {
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({output_text:'Please stop right here.'})});
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({output_text:JSON.stringify(core)})});
  });
}

async function boot(page) {
  await page.addInitScript(() => localStorage.setItem('bolna_gemini_key', 'qa-test-key'));
  await installGeminiMock(page);
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveText('bolna');
}

test('clean runtime plus API contract shim are loaded', async ({ page }) => {
  await boot(page);
  const ownership = await page.evaluate(() => ({
    runtime: window.__bolnaRuntime,
    apiFix: window.__bolnaApiContractFix,
    endpoint: GEMINI_ENDPOINT,
    scripts: [...document.scripts].map(s=>s.getAttribute('src')).filter(Boolean),
  }));
  expect(ownership.runtime).toBe('clean-v2');
  expect(ownership.apiFix).toBe('v1beta-inline-audio');
  expect(ownership.endpoint).toBe('https://generativelanguage.googleapis.com/v1/interactions');
  expect(ownership.scripts).toEqual(['./api-contract-fix.js','./app-clean.js']);
});

test('inline audio is actually sent to v1beta, never v1', async ({ page }) => {
  const urls=[];
  await page.addInitScript(() => localStorage.setItem('bolna_gemini_key', 'qa-test-key'));
  await page.route('https://generativelanguage.googleapis.com/**', async route => {
    urls.push(route.request().url());
    const body = JSON.parse(route.request().postData() || '{}');
    const hasAudio = Array.isArray(body.input) && body.input.some(x => x && x.type === 'audio');
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({output_text:hasAudio?'Please stop right here.':JSON.stringify(core)})});
  });
  await page.goto('/');
  await page.evaluate(async () => {
    const wav = new Blob([new Uint8Array(256)], {type:'audio/wav'});
    await transcribe(wav);
  });
  expect(urls.length).toBeGreaterThan(0);
  expect(urls.every(u=>u.includes('/v1beta/interactions'))).toBeTruthy();
  expect(urls.some(u=>u.includes('/v1/interactions'))).toBeFalsy();
});

test('transcription plus generation complete without state freeze', async ({ page }) => {
  await boot(page);
  const elapsed = await page.evaluate(async () => {
    const wav = new Blob([new Uint8Array(256)], {type:'audio/wav'});
    const t0 = performance.now();
    const text = await transcribe(wav);
    const out = await generateCore(text);
    return {ms:performance.now()-t0,text,out};
  });
  expect(elapsed.text).toBe('Please stop right here.');
  expect(elapsed.out.natural).toBe(core.natural);
  expect(elapsed.ms).toBeLessThan(1500);
});

test('provider failures are distinguished from quota failures', async ({ page }) => {
  await boot(page);
  const messages = await page.evaluate(() => ({
    quota: classifyError(429,{error:{message:'quota'}}).message,
    provider: classifyError(500,{error:{message:'server'}}).message,
    auth: classifyError(403,{error:{message:'denied'}}).message,
  }));
  expect(messages.quota).toContain('quota');
  expect(messages.provider).toContain('temporarily unavailable');
  expect(messages.auth).toContain('API key');
});

test('Gemini PCM is wrapped as valid WAV', async ({ page }) => {
  await boot(page);
  const sig = await page.evaluate(async () => {
    const blob = await speech('Bhaiya, bas yahin rok dena.', false);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return String.fromCharCode(...bytes.slice(0,12));
  });
  expect(sig.slice(0,4)).toBe('RIFF');
  expect(sig.slice(8,12)).toBe('WAVE');
});

test('three consecutive audio plays do not throw or close audio context', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const failures=[];
    for(let i=0;i<3;i++){
      try{await playText('Bhaiya, bas yahin rok dena.', false)}catch(e){failures.push(String(e?.message||e))}
    }
    return {failures, state: playbackCtx?.state || 'none'};
  });
  expect(result.failures).toEqual([]);
  expect(result.state).not.toBe('closed');
});

test('typed phrase reaches ready UI', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Type instead' }).click();
  await page.locator('#typed').fill('Please stop right here.');
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await expect(page.locator('.hinglish')).toHaveText(core.natural, { timeout: 3000 });
  await expect(page.getByRole('button', { name: /Hear it/i })).toBeVisible();
});
