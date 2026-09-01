const { test, expect } = require('@playwright/test');

test('persists TTS audio across reload without another provider call', async ({ page }) => {
  let providerCalls = 0;
  await page.route('**/api/gemini', async route => {
    providerCalls += 1;
    await route.abort();
  });

  await page.goto('/');

  const storedSize = await page.evaluate(async () => {
    const bytes = new Uint8Array([82,73,70,70,4,0,0,0,87,65,86,69]);
    const blob = new Blob([bytes], { type: 'audio/wav' });
    await persistentVoicePut('normal:cache-test', blob);
    const cached = await persistentVoiceGet('normal:cache-test');
    return cached?.size || 0;
  });
  expect(storedSize).toBe(12);

  await page.reload();

  const replaySize = await page.evaluate(async () => {
    const blob = await speech('cache-test', false);
    return blob?.size || 0;
  });

  expect(replaySize).toBe(12);
  expect(providerCalls).toBe(0);

  const hit = await page.evaluate(() =>
    window.__bolnaDiagnostics.events.some(e => e.stage === 'tts_cache' && e.tier === 'persistent' && e.hit === true)
  );
  expect(hit).toBe(true);
});
