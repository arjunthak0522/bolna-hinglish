const { test, expect } = require('@playwright/test');

test('reuses one live microphone stream during a page session', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    let stopped = 0;
    const track = {
      readyState: 'live',
      stop() { this.readyState = 'ended'; stopped += 1; },
    };
    const stream = {
      active: true,
      getAudioTracks: () => [track],
      getTracks: () => [track],
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => { calls += 1; return stream; },
      },
    });
    window.__micProbe = {
      calls: () => calls,
      stopped: () => stopped,
      resetTrack: () => { track.readyState = 'live'; },
    };
  });

  await page.goto('/');

  const first = await page.evaluate(async () => {
    const a = await getMicStream();
    const b = await getMicStream();
    return {
      same: a === b,
      calls: window.__micProbe.calls(),
      trackState: a.getAudioTracks()[0].readyState,
    };
  });

  expect(first.same).toBe(true);
  expect(first.calls).toBe(1);
  expect(first.trackState).toBe('live');

  const released = await page.evaluate(() => {
    releaseMicrophone();
    return { stopped: window.__micProbe.stopped(), micCleared: micStream === null };
  });
  expect(released.stopped).toBe(1);
  expect(released.micCleared).toBe(true);
});
