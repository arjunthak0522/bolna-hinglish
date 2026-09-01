const { test, expect } = require('@playwright/test');

test('reuses one healthy live microphone stream during a page session', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    let stopped = 0;
    const track = {
      readyState: 'live',
      enabled: true,
      muted: false,
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
      resetTrack: () => { track.readyState = 'live'; track.enabled = true; track.muted = false; },
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

test('reacquires a Safari microphone stream that is live but muted', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    let firstStopped = 0;
    const staleTrack = {
      readyState: 'live', enabled: true, muted: true,
      stop() { this.readyState = 'ended'; firstStopped += 1; },
    };
    const freshTrack = {
      readyState: 'live', enabled: true, muted: false,
      stop() { this.readyState = 'ended'; },
    };
    const staleStream = { active: true, getAudioTracks: () => [staleTrack], getTracks: () => [staleTrack] };
    const freshStream = { active: true, getAudioTracks: () => [freshTrack], getTracks: () => [freshTrack] };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => { calls += 1; return calls === 1 ? staleStream : freshStream; } },
    });
    window.__micProbe = { calls: () => calls, firstStopped: () => firstStopped };
  });

  await page.goto('/');

  const result = await page.evaluate(async () => {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const acquired = await getMicStream();
    const track = acquired.getAudioTracks()[0];
    return {
      calls: window.__micProbe.calls(),
      firstStopped: window.__micProbe.firstStopped(),
      muted: track.muted,
      enabled: track.enabled,
      state: track.readyState,
    };
  });

  expect(result.calls).toBe(2);
  expect(result.firstStopped).toBe(1);
  expect(result.muted).toBe(false);
  expect(result.enabled).toBe(true);
  expect(result.state).toBe('live');
});
