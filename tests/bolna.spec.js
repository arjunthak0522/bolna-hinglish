const { test, expect } = require('@playwright/test');

const core = {
  intendedEnglish: 'Please stop right here.',
  intentStatus: 'resolved',
  alternatives: [],
  natural: 'Bhaiya, bas yahin rok dena.',
  spokenForm: 'Bhaiya, bas yahin rok dena.',
  phonetic: 'BHAI-yaa, bus ya-HEE(n) rohk DAY-naa',
  meaning: 'Please stop right here.',
  speechText: 'Bhaiya, bas yahin rok dena.',
  confidence: 0.98,
  phoneticConfidence: 'high',
  nextSuggestions: [
    'Do you want anything from the frozen section?',
    'Should I get snacks too?',
    'Do you need anything for breakfast?',
    'Do you want me to send you a photo?',
    'Is there anything else you need?',
  ],
};
const enrich = {
  moreHindi: 'Bhaiya, bas yahin gaadi rok dena.',
  polite: 'Bhaiya, please yahin rok dijiye.',
  casual: 'Bhaiya, yahin rok do.',
  words: [{ word: 'Bhaiya', phonetic: 'BHAI-yaa', meaning: 'brother / respectful address', note: 'Light stress on BHAI.' }],
};

function pcmBase64() { return Buffer.alloc(4800).toString('base64'); }

async function installApiMock(page, options = {}) {
  const seen = [];
  let generateIndex = 0;
  await page.route('https://hinglish-companion.vercel.app/api/gemini', async route => {
    const body = JSON.parse(route.request().postData() || '{}');
    seen.push(body);
    const failure = options.failOperation === body.operation ? options.failure : null;
    if (failure) return route.fulfill({ status: failure.status, contentType: 'application/json', body: JSON.stringify({ ok: false, category: failure.category }) });
    if (body.operation === 'transcribe') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_text: 'Please stop right here.' } }) });
    if (body.operation === 'generate') {
      const sequence = options.generateOutputs;
      let output = Array.isArray(sequence) && sequence.length ? sequence[Math.min(generateIndex++, sequence.length - 1)] : core;
      if (!(Array.isArray(sequence) && sequence.length)) {
        const match = String(body.prompt || '').match(/User input: (\"(?:[^\"\\\\]|\\\\.)*\")/);
        let intended = core.intendedEnglish;
        if (match) { try { intended = JSON.parse(match[1]); } catch {} }
        output = { ...core, intendedEnglish: intended };
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_text: JSON.stringify(output) } }) });
    }
    if (body.operation === 'enrich') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_text: JSON.stringify(enrich) } }) });
    if (body.operation === 'tts') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: { output_audio: { data: pcmBase64(), mime_type: 'audio/pcm' } } }) });
    return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ ok: false, category: 'invalid_client_request' }) });
  });
  return seen;
}

async function boot(page, options) {
  const seen = await installApiMock(page, options);
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveText('bolna');
  return seen;
}

async function typedPhrase(page, text) {
  await expect(page.locator('#typed')).toBeVisible();
  await page.locator('#typed').fill(text);
  await page.getByRole('button', { name: 'Turn this into Hinglish' }).click();
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
  expect(ownership.dataScripts).toEqual(['./phrase-library.js', './phrase-library-expanded.js', './phrase-library-tier23-friction.js', './phrase-library-survival.js', './phrase-library-conversation.js', './phrase-library-driver-househelp.js']);
  expect(ownership.geminiKey).toBeNull();
});

test('transcription client always sends normalized WAV to secure backend', async ({ page }) => {
  const seen = await boot(page);
  await page.evaluate(async () => {
    const wav = encodeWavFromFloat(new Float32Array(3200), 16000);
    await transcribe(wav);
  });
  const req = seen.find(x => x.operation === 'transcribe');
  expect(req).toBeTruthy();
  expect(req.audioMime).toBe('audio/wav');
  expect(typeof req.audioData).toBe('string');
  expect(req.audioData.length).toBeGreaterThan(100);
  expect(req.model).toBeUndefined();
});

test('five consecutive phrase cycles recover without refresh', async ({ page }) => {
  await boot(page);
  const phrases = ['Stop here.','Can you turn the AC down a little?','Please send the location on WhatsApp.','Can I pay by UPI?','Please follow Google Maps and take the next left.'];
  for (const phrase of phrases) {
    await typedPhrase(page, phrase);
    await expect(page.getByRole('button', { name: /Hear it/i })).toBeVisible();
    await page.getByRole('button', { name: /Say something else/i }).click();
    await expect(page.locator('#mic')).toBeVisible();
    await expect(page.locator('.micLabel')).toHaveText('Tap to speak');
  }
});

test('five consecutive Hear It plays and repeated Slow recover', async ({ page }) => {
  await boot(page);
  await typedPhrase(page, 'Stop here.');
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: /Hear it/i }).click();
    await expect(page.getByRole('button', { name: /Hear it/i })).toBeVisible({ timeout: 3000 });
  }
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: /Slow/i }).click();
    await expect(page.getByRole('button', { name: /Slow/i })).toBeVisible({ timeout: 3000 });
  }
  const state = await page.evaluate(() => playbackCtx?.state || 'none');
  expect(state).not.toBe('closed');
});

test('details keep pronunciation, meaning, polite, casual, More Hindi and breakdown', async ({ page }) => {
  await boot(page);
  await typedPhrase(page, 'Stop here.');
  await expect(page.getByText('Say it like this')).toBeVisible();
  await expect(page.getByText('Meaning')).toBeVisible();
  await page.getByRole('button', { name: 'More polite' }).click();
  await expect(page.getByText(enrich.polite)).toBeVisible();
  await page.getByRole('button', { name: 'More casual' }).click();
  await expect(page.getByText(enrich.casual)).toBeVisible();
  await page.getByRole('button', { name: 'More Hindi' }).click();
  await expect(page.getByText(enrich.moreHindi)).toBeVisible();
  await page.getByRole('button', { name: 'Break it down' }).click();
  await expect(page.locator('.wordRow small')).toContainText('BHAI-yaa');
});

test('Keep Talking uses contextual model suggestions for arbitrary real conversations', async ({ page }) => {
  const seen = await boot(page);
  await typedPhrase(page, "What would you like from Trader Joe's?");
  await page.getByRole('button', { name: /Keep talking/i }).click();

  const choices = page.locator('[data-keep-talking]');
  await expect(choices).toHaveCount(5);
  await expect(choices.nth(0)).toContainText('frozen section');
  await expect(choices.nth(1)).toContainText('snacks');
  await expect(page.getByText('Please speak a little slower.')).toHaveCount(0);
  await expect(page.getByText('Can you say that again?')).toHaveCount(0);
  await expect(page.getByText('Please write it down for me.')).toHaveCount(0);

  await choices.nth(0).click();
  await expect(page.locator('.heard')).toContainText('Do you want anything from the frozen section?');
  await expect(page.locator('.hinglish')).toBeVisible();

  const generateRequests = seen.filter(x => x.operation === 'generate');
  expect(generateRequests.length).toBeGreaterThanOrEqual(2);
  expect(generateRequests.at(-1).prompt).toContain("What would you like from Trader Joe's?");
  expect(generateRequests.at(-1).prompt).toContain('Do you want anything from the frozen section?');
});

test('Roman-only guard retries bad model output before anything is rendered or stored', async ({ page }) => {
  const bad = {
    ...core,
    natural: '\u0938\u0941\u0928\u093f\u090f \u0938\u0930',
    spokenForm: '\u0938\u0941\u0928\u093f\u090f \u0938\u0930',
    speechText: '\u0938\u0941\u0928\u093f\u090f \u0938\u0930',
  };
  const seen = await boot(page, { generateOutputs: [bad, core] });
  await typedPhrase(page, "What would you like from Trader Joe's?");

  const visible = await page.locator('body').innerText();
  expect(visible).not.toMatch(/[\u0900-\u097F]/u);

  const generateRequests = seen.filter(x => x.operation === 'generate');
  expect(generateRequests).toHaveLength(2);
  expect(generateRequests[1].prompt).toContain('STRICT RETRY');

  const stored = await page.evaluate(() => localStorage.getItem('bolna_recent') || '');
  expect(stored).not.toMatch(/[\u0900-\u097F]/u);
});

test('stale Devanagari Recent and Saved entries are purged automatically', async ({ page }) => {
  await installApiMock(page);
  await page.addInitScript(() => {
    localStorage.setItem('bolna_recent', JSON.stringify([
      { natural: '\u0939\u093f\u0902\u0926\u0940', english: 'bad cached phrase', context: 'General' },
      { natural: 'Roman only', english: 'good cached phrase', context: 'General' },
    ]));
    localStorage.setItem('bolna_saved', JSON.stringify([
      { natural: '\u0928\u092e\u0938\u094d\u0924\u0947', english: 'bad saved phrase', context: 'General' },
      { natural: 'Namaste', english: 'good saved phrase', context: 'General' },
    ]));
  });
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveText('bolna');

  const visible = await page.locator('body').innerText();
  expect(visible).not.toMatch(/[\u0900-\u097F]/u);
  await expect(page.getByText('Roman only')).toBeVisible();

  const cache = await page.evaluate(() => ({
    recent: JSON.parse(localStorage.getItem('bolna_recent') || '[]'),
    saved: JSON.parse(localStorage.getItem('bolna_saved') || '[]'),
  }));
  expect(cache.recent).toHaveLength(1);
  expect(cache.saved).toHaveLength(1);
  expect(JSON.stringify(cache)).not.toMatch(/[\u0900-\u097F]/u);
});


test('non-Latin model output is retried, not rendered or stored', async ({ page }) => {
  const bad = {
    ...core,
    natural: 'Привет',
    spokenForm: 'Привет',
    speechText: 'Привет',
  };
  const seen = await boot(page, { generateOutputs: [bad, core] });
  await typedPhrase(page, 'Say hello politely.');

  const visible = await page.locator('body').innerText();
  expect(visible).not.toContain('Привет');

  const generateRequests = seen.filter(x => x.operation === 'generate');
  expect(generateRequests).toHaveLength(2);
  expect(generateRequests[1].prompt).toContain('non-Roman script');

  const stored = await page.evaluate(() => localStorage.getItem('bolna_recent') || '');
  expect(stored).not.toContain('Привет');
});

test('typed Devanagari is blocked because Bolna is Roman-script only', async ({ page }) => {
  await boot(page);
  await page.locator('#typed').fill('\u0939\u093f\u0902\u0926\u0940');
  await page.getByRole('button', { name: 'Turn this into Hinglish' }).click();
  await expect(page.getByText('Use Roman letters')).toBeVisible();
  await expect(page.locator('.hinglish')).toHaveCount(0);
});


test('typed input is first-class and shorthand uses the existing single generate call', async ({ page }) => {
  const shorthand = {
    ...core,
    intendedEnglish: 'Please make me an omelette with chillis and onions.',
    natural: 'Mere liye chillis aur onions ke saath omelette bana dijiye.',
    spokenForm: 'Mere liye chillis aur onions ke saath omelette bana dijiye.',
    speechText: 'Mere liye chillis aur onions ke saath omelette bana dijiye.',
    meaning: 'Please make me an omelette with chillis and onions.',
  };
  const seen = await boot(page, { generateOutputs: [shorthand] });
  await expect(page.locator('#typed')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Turn this into Hinglish' })).toBeVisible();
  await page.locator('#typed').fill('omelette chillis onions');
  await page.getByRole('button', { name: 'Turn this into Hinglish' }).click();
  await expect(page.locator('.heard')).toContainText('You meant');
  await expect(page.locator('.heard')).toContainText(shorthand.intendedEnglish);
  const generates = seen.filter(x => x.operation === 'generate');
  expect(generates).toHaveLength(1);
  expect(generates[0].prompt).toContain('infer the COMPLETE ENGLISH SENTENCE');
  expect(generates[0].prompt).toContain('omelette chillis onions');
});

test('genuinely ambiguous shorthand surfaces likely interpretations', async ({ page }) => {
  const ambiguous = {
    ...core,
    intendedEnglish: 'I need to go to the bank tomorrow.',
    intentStatus: 'ambiguous',
    alternatives: ['Can we stop at the bank tomorrow?', 'Is the bank open tomorrow?'],
  };
  await boot(page, { generateOutputs: [ambiguous] });
  await page.locator('#typed').fill('bank tomorrow');
  await page.getByRole('button', { name: 'Turn this into Hinglish' }).click();
  await expect(page.getByText('What did you mean?')).toBeVisible();
  await expect(page.locator('.hinglish')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'I need to go to the bank tomorrow.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Can we stop at the bank tomorrow?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Is the bank open tomorrow?' })).toBeVisible();
});

test('resolved intent becomes history for a follow-up fragment', async ({ page }) => {
  const first = { ...core, intendedEnglish: 'Please pick up my wife from the airport.' };
  const second = { ...core, intendedEnglish: 'Please pick up my wife from the airport at 6 PM.' };
  const seen = await boot(page, { generateOutputs: [first, second] });
  await page.locator('#typed').fill('airport pickup wife');
  await page.getByRole('button', { name: 'Turn this into Hinglish' }).click();
  await page.getByRole('button', { name: /Say something else/i }).click();
  await page.locator('#typed').fill('6 pm');
  await page.getByRole('button', { name: 'Turn this into Hinglish' }).click();
  const generates = seen.filter(x => x.operation === 'generate');
  expect(generates).toHaveLength(2);
  expect(generates[1].prompt).toContain('Please pick up my wife from the airport.');
  expect(generates[1].prompt).toContain('6 pm');
  await expect(page.locator('.heard')).toContainText('Please pick up my wife from the airport at 6 PM.');
});

test('complete English still goes through the same call without an added intent request', async ({ page }) => {
  const seen = await boot(page);
  await typedPhrase(page, 'Please stop right here.');
  expect(seen.filter(x => x.operation === 'generate')).toHaveLength(1);
  expect(seen.some(x => x.operation === 'enrich')).toBe(false);
});

for (const [name, failure, title] of [
  ['400 provider rejection', { status: 400, category: 'provider_rejected_request' }, 'Provider rejected the request'],
  ['403 bad configuration', { status: 403, category: 'invalid_api_configuration' }, 'Bolna is not configured'],
  ['429 quota', { status: 429, category: 'quota_exhausted' }, 'Gemini quota reached'],
  ['500 provider outage', { status: 500, category: 'provider_temporarily_unavailable' }, 'Gemini is temporarily unavailable'],
]) {
  test(`recovers from ${name}`, async ({ page }) => {
    await boot(page, { failOperation: 'generate', failure });
    await page.locator('#typed').fill('Stop here.');
    await page.getByRole('button', { name: 'Turn this into Hinglish' }).click();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.locator('#mic')).toBeVisible();
    await expect(page.locator('.micLabel')).toHaveText('Tap to speak');
  });
}

test('diagnostics expose stage and latency metadata without secrets', async ({ page }) => {
  await boot(page);
  await typedPhrase(page, 'Stop here.');
  const data = await page.evaluate(() => JSON.stringify(window.__bolnaDiagnostics));
  expect(data).toContain('generate');
  expect(data).toContain('ms');
  expect(data).not.toContain('GEMINI_API_KEY');
  expect(data).not.toMatch(/AIza[0-9A-Za-z_-]+/);
});
