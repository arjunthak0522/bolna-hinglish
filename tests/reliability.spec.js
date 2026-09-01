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

async function routeApi(page, handler) {
  await page.route('https://hinglish-companion.vercel.app/api/gemini', route => handler(route, JSON.parse(route.request().postData() || '{}')));
}

async function openTyped(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Type instead' }).click();
  await page.locator('#typed').fill('Stop here.');
}

function ok(route, data) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data }) });
}

function fail(route, status, category) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ ok: false, category }) });
}

test('empty generation returns to usable idle state', async ({ page }) => {
  await routeApi(page, (route, body) => body.operation === 'generate' ? ok(route, { output_text: '' }) : ok(route, {}));
  await openTyped(page);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await expect(page.getByText('Empty Gemini result')).toBeVisible();
  await expect(page.locator('#mic')).toBeVisible();
});

test('client timeout returns to usable state', async ({ page }) => {
  await routeApi(page, async (route, body) => {
    if (body.operation === 'generate') {
      await new Promise(r => setTimeout(r, 19000));
      return ok(route, { output_text: JSON.stringify(core) });
    }
    return ok(route, {});
  });
  await openTyped(page);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await expect(page.getByText('Gemini took too long')).toBeVisible({ timeout: 22000 });
  await expect(page.locator('#mic')).toBeVisible();
});

test('empty transcript is classified and recoverable', async ({ page }) => {
  await routeApi(page, (route, body) => body.operation === 'transcribe' ? ok(route, { output_text: '' }) : ok(route, { output_text: JSON.stringify(core) }));
  await page.goto('/');
  const message = await page.evaluate(async () => {
    const wav = encodeWavFromFloat(new Float32Array(3200), 16000);
    try { await transcribe(wav); return 'unexpected-success'; }
    catch (e) { return `${e.userTitle}|${e.message}`; }
  });
  expect(message).toContain('I didn’t hear that clearly');
});

test('empty TTS is classified without breaking result screen', async ({ page }) => {
  await routeApi(page, (route, body) => {
    if (body.operation === 'generate') return ok(route, { output_text: JSON.stringify(core) });
    if (body.operation === 'tts') return ok(route, {});
    return ok(route, {});
  });
  await openTyped(page);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await page.getByRole('button', { name: /Hear it/i }).click();
  await expect(page.getByText(/Gemini returned no audio/)).toBeVisible();
  await expect(page.locator('.hinglish')).toBeVisible();
});

test('invalid PCM is rejected cleanly', async ({ page }) => {
  await routeApi(page, (route, body) => {
    if (body.operation === 'generate') return ok(route, { output_text: JSON.stringify(core) });
    if (body.operation === 'tts') return ok(route, { output_audio: { data: Buffer.from([1, 2, 3]).toString('base64'), mime_type: 'audio/pcm' } });
    return ok(route, {});
  });
  await openTyped(page);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await page.getByRole('button', { name: /Hear it/i }).click();
  await expect(page.getByText(/invalid PCM audio/)).toBeVisible();
  await expect(page.locator('.hinglish')).toBeVisible();
});

test('decodeAudioData failure is a playback problem, not a frozen app', async ({ page }) => {
  const pcm = Buffer.alloc(4800).toString('base64');
  await routeApi(page, (route, body) => {
    if (body.operation === 'generate') return ok(route, { output_text: JSON.stringify(core) });
    if (body.operation === 'tts') return ok(route, { output_audio: { data: pcm, mime_type: 'audio/pcm' } });
    return ok(route, {});
  });
  await openTyped(page);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await page.evaluate(() => {
    unlockPlayback();
    playbackCtx.decodeAudioData = async () => { throw new Error('injected decode failure'); };
  });
  await page.getByRole('button', { name: /Hear it/i }).click();
  await expect(page.getByText(/generated audio could not be decoded/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Say something else/i })).toBeVisible();
});

test('suspended AudioContext is resumed before playback attempt', async ({ page }) => {
  const pcm = Buffer.alloc(4800).toString('base64');
  await routeApi(page, (route, body) => {
    if (body.operation === 'generate') return ok(route, { output_text: JSON.stringify(core) });
    if (body.operation === 'tts') return ok(route, { output_audio: { data: pcm, mime_type: 'audio/pcm' } });
    return ok(route, {});
  });
  await openTyped(page);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  const resumed = await page.evaluate(async () => {
    const ctx = unlockPlayback();
    let called = false;
    const original = ctx.resume.bind(ctx);
    Object.defineProperty(ctx, 'state', { configurable: true, get: () => 'suspended' });
    ctx.resume = async () => { called = true; return original().catch(() => {}); };
    try { await playBlob(new Blob([new Uint8Array(44)], { type: 'audio/wav' })); } catch {}
    return called;
  });
  expect(resumed).toBe(true);
});

test('backend error leaves UI retryable rather than stale', async ({ page }) => {
  let calls = 0;
  await routeApi(page, (route, body) => {
    if (body.operation === 'generate' && calls++ === 0) return fail(route, 500, 'provider_temporarily_unavailable');
    if (body.operation === 'generate') return ok(route, { output_text: JSON.stringify(core) });
    return ok(route, {});
  });
  await openTyped(page);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await expect(page.getByText('Gemini is temporarily unavailable')).toBeVisible();
  await page.locator('#typed').fill('Stop here.');
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await expect(page.locator('.hinglish')).toBeVisible();
});
