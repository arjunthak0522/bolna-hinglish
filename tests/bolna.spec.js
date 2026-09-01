const { test, expect } = require('@playwright/test');

async function boot(page) {
  const seen = [];
  await page.route('**/api/gemini', async route => {
    const request = route.request();
    let body = null;
    try { body = request.postDataJSON(); } catch {}
    seen.push(body);
    const operation = body?.operation;
    if (operation === 'voice_core') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_text: JSON.stringify({ transcript: 'Stop here.', natural: 'Bhaiya, yahin rok dena.', spokenForm: 'Bhaiya, yahin rok dena.', phonetic: 'BHAI-yaa, ya-HEE(n) rohk DAY-naa', meaning: 'Stop here.', speechText: 'Bhaiya, yahin rok dena.', confidence: .99, phoneticConfidence: 'high' }) } }) });
    }
    if (operation === 'transcribe') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_text: 'Stop here.' } }) });
    }
    if (operation === 'generate') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_text: JSON.stringify({ natural: 'Bhaiya, yahin rok dena.', spokenForm: 'Bhaiya, yahin rok dena.', phonetic: 'BHAI-yaa, ya-HEE(n) rohk DAY-naa', meaning: 'Stop here.', speechText: 'Bhaiya, yahin rok dena.', confidence: .99, phoneticConfidence: 'high' }) } }) });
    }
    if (operation === 'enrich') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_text: JSON.stringify({ polite: 'Yahin rok dijiye.', casual: 'Yahin rok de.', moreHindi: 'Kripya yahin rok dijiye.', words: [{ word: 'yahin', phonetic: 'ya-HEE(n)', meaning: 'right here', note: 'Lightly nasalize the last vowel.' }] }) } }) });
    }
    if (operation === 'tts') {
      const pcm = Buffer.alloc(4800).toString('base64');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_audio: { data: pcm, mime_type: 'audio/L16;rate=24000' } } }) });
    }
    return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ ok: false, category: 'invalid_client_request' }) });
  });
  await page.goto('/');
  return seen;
}

async function typePhrase(page, text) {
  if (!(await page.locator('#typed').isVisible().catch(() => false))) {
    await page.getByRole('button', { name: 'Type instead' }).click();
  }
  await page.locator('#typed').fill(text);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await expect(page.locator('.hinglish')).toBeVisible();
}

test('only one authoritative runtime is loaded and no browser Gemini key is used', async ({ page }) => {
  await boot(page);
  const ownership = await page.evaluate(() => ({
    runtime: window.__bolnaRuntime,
    runtimeScripts: [...document.scripts].map(s => s.getAttribute('src')).filter(src => src?.includes('runtime')),
    dataScripts: [...document.scripts].map(s => s.getAttribute('src')).filter(src => src?.includes('phrase-library')),
    geminiKey: localStorage.getItem('bolna_gemini_key'),
    diagnostics: window.__bolnaDiagnostics?.runtime,
  }));
  expect(ownership.runtime).toBe('single-v1');
  expect(ownership.diagnostics).toBe('single-v1');
  expect(ownership.runtimeScripts).toEqual(['./app-runtime.js']);
  expect(ownership.dataScripts).toEqual(['./phrase-library.js']);
  expect(ownership.geminiKey).toBeNull();
});

test('transcription client always sends normalized WAV to secure backend', async ({ page }) => {
  const seen = await boot(page);
  await page.evaluate(async () => {
    const wav = encodeWavFromFloat(new Float32Array(3200), 16000);
    await voiceCore(wav);
  });
  const voice = seen.find(x => x?.operation === 'voice_core');
  expect(voice).toBeTruthy();
  expect(voice.audioMime).toBe('audio/wav');
  expect(typeof voice.audioData).toBe('string');
  expect(voice.audioData.length).toBeGreaterThan(50);
});

test('five consecutive phrase cycles recover without refresh', async ({ page }) => {
  await boot(page);
  for (let i = 0; i < 5; i++) {
    await typePhrase(page, `Stop here ${i}`);
    await page.getByRole('button', { name: /Say something else/i }).click();
    await expect(page.getByRole('heading', { name: 'What do you want to say?' })).toBeVisible();
  }
});

test('five consecutive Hear It plays and repeated Slow recover', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeAudioContext {
      constructor(){this.state='running';this.destination={}}
      resume(){this.state='running';return Promise.resolve()}
      close(){this.state='closed';return Promise.resolve()}
      decodeAudioData(){return Promise.resolve({})}
      createBufferSource(){return{connect(){},start(){setTimeout(()=>this.onended?.(),0)},stop(){},onended:null,buffer:null}}
    }
    window.AudioContext=window.webkitAudioContext=FakeAudioContext;
  });
  await boot(page);
  await typePhrase(page, 'Stop here');
  await expect(page.getByRole('button', { name: /Hear it/i })).toBeEnabled({ timeout: 5000 });
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: /Hear it/i }).click();
    await expect(page.getByRole('button', { name: /Hear it/i })).toBeVisible();
  }
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /Slow/i }).click();
    await expect(page.getByRole('button', { name: /Slow/i })).toBeVisible();
  }
});

test('details keep pronunciation, meaning, polite, casual, More Hindi and breakdown', async ({ page }) => {
  await boot(page);
  await typePhrase(page, 'Stop here');
  await expect(page.getByText('BHAI-yaa, ya-HEE(n) rohk DAY-naa')).toBeVisible();
  await expect(page.getByText('Stop here.')).toBeVisible();
  await page.getByRole('button', { name: 'More polite' }).click();
  await expect(page.getByText('Yahin rok dijiye.')).toBeVisible();
  await page.getByRole('button', { name: 'More casual' }).click();
  await expect(page.getByText('Yahin rok de.')).toBeVisible();
  await page.getByRole('button', { name: 'More Hindi' }).click();
  await expect(page.getByText('Kripya yahin rok dijiye.')).toBeVisible();
  await page.getByRole('button', { name: 'Break it down' }).click();
  await expect(page.getByText(/right here/)).toBeVisible();
});

for (const [status, category, title] of [
  [400, 'provider_rejected_request', 'Provider rejected the request'],
  [403, 'invalid_api_configuration', 'Bolna is not configured'],
  [429, 'quota_exhausted', 'Gemini quota reached'],
  [500, 'provider_temporarily_unavailable', 'Gemini is temporarily unavailable'],
]) {
  test(`recovers from ${status} ${category === 'invalid_api_configuration' ? 'bad configuration' : category === 'quota_exhausted' ? 'quota' : category === 'provider_temporarily_unavailable' ? 'provider outage' : 'provider rejection'}`, async ({ page }) => {
    await page.route('**/api/gemini', route => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, category }) }));
    await page.goto('/');
    await page.getByRole('button', { name: 'Type instead' }).click();
    await page.locator('#typed').fill('Stop here');
    await page.getByRole('button', { name: 'Show me how to say it' }).click();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What do you want to say?' })).toBeVisible();
  });
}

test('diagnostics expose stage and latency metadata without secrets', async ({ page }) => {
  await boot(page);
  await typePhrase(page, 'Stop here');
  const diagnostics = await page.evaluate(() => window.__bolnaDiagnostics);
  expect(diagnostics.runtime).toBe('single-v1');
  expect(diagnostics.events.some(e => e.stage === 'generate' && Number.isFinite(e.ms))).toBeTruthy();
  expect(JSON.stringify(diagnostics)).not.toMatch(/api[_-]?key|gemini[_-]?key/i);
});
