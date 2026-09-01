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
  const pcm = Buffer.alloc(24000 / 4 * 2).toString('base64'); // 250ms, 24kHz mono 16-bit PCM
  await page.route('https://generativelanguage.googleapis.com/**', async route => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.model === 'gemini-3.1-flash-tts-preview') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ output_audio: { data: pcm, mime_type: 'audio/pcm' } }),
      });
    }
    const hasAudio = Array.isArray(body.input) && body.input.some(x => x && x.type === 'audio');
    if (hasAudio) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ output_text: 'Please stop right here.' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ output_text: JSON.stringify(core) }),
    });
  });
}

async function boot(page) {
  await page.addInitScript(() => localStorage.setItem('bolna_gemini_key', 'qa-test-key'));
  await installGeminiMock(page);
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveText('bolna');
}

test('final script ownership is stable two-stage pipeline + iPhone audio layer', async ({ page }) => {
  await boot(page);
  const ownership = await page.evaluate(() => ({
    listening: startListening.toString(),
    playing: playText.toString(),
  }));
  expect(ownership.listening).toContain('transcribe');
  expect(ownership.listening).toContain('gen(transcript)');
  expect(ownership.listening).not.toContain('bolnaAudioToResult');
  expect(ownership.playing).toContain('playBlobThroughWebAudio');
});

test('transcription + generation complete quickly and return expected core result', async ({ page }) => {
  await boot(page);
  const elapsed = await page.evaluate(async () => {
    const t0 = performance.now();
    const text = await transcribe('AAAA', 'audio/webm');
    const out = await gen(text);
    return { ms: performance.now() - t0, text, out };
  });
  expect(elapsed.text).toBe('Please stop right here.');
  expect(elapsed.out.natural).toBe(core.natural);
  expect(elapsed.ms).toBeLessThan(1500);
});

test('Gemini PCM is wrapped as a valid WAV before playback', async ({ page }) => {
  await boot(page);
  const sig = await page.evaluate(async () => {
    const blob = await speech('Bhaiya, bas yahin rok dena.', false);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return String.fromCharCode(...bytes.slice(0, 12));
  });
  expect(sig.slice(0, 4)).toBe('RIFF');
  expect(sig.slice(8, 12)).toBe('WAVE');
});

test('three consecutive audio plays do not throw or leave state stuck', async ({ page }) => {
  await boot(page);
  const result = await page.evaluate(async () => {
    const failures = [];
    for (let i = 0; i < 3; i++) {
      try {
        await playText('Bhaiya, bas yahin rok dena.', false);
      } catch (e) {
        failures.push(String(e && e.message || e));
      }
    }
    return { failures, state: typeof bolnaAudioContext === 'undefined' ? 'missing' : bolnaAudioContext?.state };
  });
  expect(result.failures).toEqual([]);
  expect(result.state).not.toBe('closed');
});

test('typed phrase reaches ready UI without freezing', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Type instead' }).click();
  await page.locator('#typed').fill('Please stop right here.');
  await page.getByRole('button', { name: 'Show me how to say it' }).click();
  await expect(page.locator('.hinglish')).toHaveText(core.natural, { timeout: 3000 });
  await expect(page.getByRole('button', { name: /Hear it/i })).toBeVisible();
});
