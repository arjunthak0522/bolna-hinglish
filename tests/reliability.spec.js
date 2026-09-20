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
  const audioButton = page.getByRole('button', { name: /Hear it|Retry audio/i });
  await expect(audioButton).toBeEnabled({ timeout: 5000 });
  await audioButton.click();
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
  const audioButton = page.getByRole('button', { name: /Hear it|Retry audio/i });
  await expect(audioButton).toBeEnabled({ timeout: 5000 });
  await audioButton.click();
  await expect(page.getByText(/invalid PCM audio/)).toBeVisible();
  await expect(page.locator('.hinglish')).toBeVisible();
});

test('decodeAudioData failure falls back to native HTML audio instead of losing playback', async ({ page }) => {
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
    window.__htmlFallbackUsed = false;
    window.playBlobHtml = playBlobHtml = async () => { window.__htmlFallbackUsed = true; };
  });
  await page.getByRole('button', { name: /Hear it/i }).click();
  await expect.poll(() => page.evaluate(() => window.__htmlFallbackUsed)).toBe(true);
  await expect(page.getByRole('button', { name: /Say something else/i })).toBeVisible();
  await expect(page.locator('.inlineError')).toHaveCount(0);
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

test('speech-window normalization removes dead air before transcription upload', async ({ page }) => {
  await routeApi(page, (route, body) => ok(route, {}));
  await page.goto('/');
  const sizes = await page.evaluate(async () => {
    const source = encodeWavFromFloat(new Float32Array(16000 * 4), 16000);
    const full = await normalizeRecording(source);
    const trimmed = await normalizeRecording(source, { startMs: 1000, endMs: 2200 });
    return { full: full.size, trimmed: trimmed.size };
  });
  expect(sizes.trimmed).toBeLessThan(sizes.full * 0.5);
});

test('Hear it remains tappable while TTS prefetch is still in flight', async ({ page }) => {
  const pcm = Buffer.alloc(4800).toString('base64');
  await routeApi(page, async (route, body) => {
    if (body.operation === 'generate') return ok(route, { output_text: JSON.stringify(core) });
    if (body.operation === 'tts') {
      await new Promise(r => setTimeout(r, 1500));
      return ok(route, { output_audio: { data: pcm, mime_type: 'audio/pcm' } });
    }
    return ok(route, {});
  });
  await openTyped(page);
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  const hear = page.getByRole('button', { name: /Hear it/i });
  await expect(hear).toBeEnabled();
});

test('voice latency guard keeps post-speech VAD wait at or below 500ms', async ({ page }) => {
  await routeApi(page, (route, body) => ok(route, {}));
  await page.goto('/');
  const runtime = await page.evaluate(async () => (await fetch('./app-runtime.js')).text());
  expect(runtime).toContain('now-lastVoice>500');
  expect(runtime).not.toContain('now-lastVoice>700');
  expect(runtime).toContain('speechAt-startAt-180');
  expect(runtime).toContain('lastVoice-startAt+220');
});

test('HTML audio priming cannot pause the real cached clip', async ({ page }) => {
  await routeApi(page, (route, body) => ok(route, {}));
  await page.goto('/');
  const result = await page.evaluate(async () => {
    let resolvePrime, plays = 0, pauses = 0;
    const primePending = new Promise(resolve => { resolvePrime = resolve; });
    const fake = {
      volume: 1, src: '', currentTime: 0, preload: '', style: {},
      setAttribute() {},
      play() { plays++; return plays === 1 ? primePending : Promise.resolve(); },
      pause() { pauses++; },
      onended: null,
      onerror: null,
    };
    htmlAudio = fake;
    htmlAudioPrimed = false;
    htmlAudioPrimeToken = 0;
    primeHtmlAudio();
    const actual = playBlobHtml(new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/wav' }));
    resolvePrime();
    await Promise.resolve();
    const pausesBeforeEnd = pauses;
    fake.onended?.();
    await actual;
    return { pausesBeforeEnd, plays };
  });
  expect(result.plays).toBe(2);
  expect(result.pausesBeforeEnd).toBe(1);
});

test('stopping native fallback playback settles the pending playback promise', async ({ page }) => {
  await routeApi(page, (route, body) => ok(route, {}));
  await page.goto('/');
  const settled = await page.evaluate(async () => {
    const fake = {
      volume: 1, src: '', currentTime: 0, preload: '', style: {},
      setAttribute() {},
      play() { return Promise.resolve(); },
      pause() {},
      onended: null,
      onerror: null,
    };
    htmlAudio = fake;
    htmlAudioPrimed = true;
    htmlAudioPrimeToken = 0;
    let resolved = false;
    const p = playBlobHtml(new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/wav' })).then(() => { resolved = true; });
    await Promise.resolve();
    stopPlayback();
    await p;
    return resolved;
  });
  expect(settled).toBe(true);
});

test('starting a new recording always stops existing playback first', async ({ page }) => {
  await routeApi(page, (route, body) => ok(route, {}));
  await page.goto('/');
  const stopped = await page.evaluate(async () => {
    let calls = 0;
    stopPlayback = () => { calls++; };
    getMicStream = async () => { throw new Error('injected mic stop'); };
    await startListening();
    return calls;
  });
  expect(stopped).toBe(1);
});

test('double tapping Hear it cannot start overlapping result playback', async ({ page }) => {
  await routeApi(page, (route, body) => ok(route, {}));
  await page.goto('/');
  const calls = await page.evaluate(async () => {
    result = { natural: 'Test', spokenForm: 'Test', phonetic: 'Test', meaning: 'Test' };
    state = 'playing';
    let n = 0;
    speech = async () => { n++; return new Blob(); };
    await playText('Test', false);
    return n;
  });
  expect(calls).toBe(0);
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
