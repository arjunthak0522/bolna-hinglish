const assert = require('assert');

process.env.GEMINI_API_KEY = 'test-key';
let calls = 0;
global.fetch = async () => {
  calls += 1;
  if (calls === 1) {
    const e = new Error('simulated timeout');
    e.name = 'AbortError';
    throw e;
  }
  return {
    status: 200,
    ok: true,
    async text() {
      return JSON.stringify({ output_text: 'Stop here.' });
    },
  };
};

const handler = require('../api/gemini.js');
const req = {
  method: 'POST',
  headers: { origin: 'http://127.0.0.1:4173' },
  body: {
    operation: 'transcribe',
    audioData: 'AAAA',
    audioMime: 'audio/wav',
  },
};
let statusCode = 200;
let body = null;
const headers = {};
const res = {
  setHeader(k, v) { headers[k] = v; },
  status(code) { statusCode = code; return this; },
  json(value) { body = value; return this; },
  end() { return this; },
};

(async () => {
  await handler(req, res);
  assert.equal(calls, 2, 'transcription should retry exactly once after a timeout');
  assert.equal(statusCode, 200);
  assert.equal(body?.ok, true);
  assert.equal(body?.diagnostics?.attempt, 2);
  console.log('TRANSCRIPTION_TIMEOUT_RETRY: PASS');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
