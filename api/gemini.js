const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const ALLOWED_ORIGINS = new Set([
  'https://arjunthak0522.github.io',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
]);

const MODELS = Object.freeze({
  transcribe: 'gemini-3.7-flash',
  generate: 'gemini-3.5-flash-lite',
  enrich: 'gemini-3.5-flash-lite',
  tts: 'gemini-3.1-flash-tts-preview',
});

function cors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function send(res, status, body) {
  res.status(status).json(body);
}

function classifyProviderStatus(status) {
  if (status === 400) return 'provider_rejected_request';
  if (status === 401 || status === 403) return 'invalid_api_configuration';
  if (status === 429) return 'quota_exhausted';
  if (status >= 500) return 'provider_temporarily_unavailable';
  return 'provider_error';
}

async function callGemini(apiKey, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const raw = await response.text();
    let data = null;
    try { data = JSON.parse(raw); } catch {}
    return { response, data, elapsedMs: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

function validateOperation(body) {
  if (!body || typeof body !== 'object') return 'Request body must be JSON.';
  if (!['transcribe', 'generate', 'enrich', 'tts'].includes(body.operation)) return 'Unsupported operation.';
  if (body.operation === 'transcribe') {
    if (typeof body.audioData !== 'string' || !body.audioData) return 'audioData is required.';
    if (body.audioMime !== 'audio/wav') return 'Bolna transcription requires normalized audio/wav.';
  }
  if ((body.operation === 'generate' || body.operation === 'enrich') && typeof body.prompt !== 'string') return 'prompt is required.';
  if (body.operation === 'tts' && typeof body.text !== 'string') return 'text is required.';
  return null;
}

function providerRequest(body) {
  if (body.operation === 'transcribe') {
    return {
      timeoutMs: 15000,
      request: {
        model: MODELS.transcribe,
        input: [
          { type: 'text', text: 'Transcribe this short English utterance exactly. Return only the transcript with normal punctuation. Do not translate or explain.' },
          { type: 'audio', data: body.audioData, mime_type: 'audio/wav' },
        ],
        generation_config: { thinking_level: 'low' },
      },
    };
  }
  if (body.operation === 'generate' || body.operation === 'enrich') {
    return {
      timeoutMs: 15000,
      request: {
        model: MODELS[body.operation],
        input: body.prompt,
        generation_config: { thinking_level: 'minimal' },
        ...(body.schema ? { response_format: { type: 'text', mime_type: 'application/json', schema: body.schema } } : {}),
      },
    };
  }
  return {
    timeoutMs: 18000,
    request: {
      model: MODELS.tts,
      input: `Synthesize speech only. Voice character: adult Indian male, warm, natural, calm, contemporary. Accent: natural urban Indian speech. ${body.slow ? 'Speak slowly and clearly for a learner.' : 'Speak at a natural conversational pace.'} Handle Hindi-English code switching naturally. Spoken transcript begins now: ${body.text}`,
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice: 'Rasalgethi' }] },
    },
  };
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { ok: false, category: 'method_not_allowed' });

  const origin = req.headers.origin || '';
  if (origin && !ALLOWED_ORIGINS.has(origin)) return send(res, 403, { ok: false, category: 'origin_not_allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send(res, 500, { ok: false, category: 'invalid_api_configuration', message: 'Gemini provider is not configured.' });

  const validationError = validateOperation(req.body);
  if (validationError) return send(res, 400, { ok: false, category: 'invalid_client_request', message: validationError });

  const { request, timeoutMs } = providerRequest(req.body);
  const diagnostics = {
    operation: req.body.operation,
    endpoint: GEMINI_ENDPOINT,
    model: request.model,
    mimeType: req.body.operation === 'transcribe' ? 'audio/wav' : undefined,
    recordingBytesApprox: req.body.operation === 'transcribe' ? Math.floor(req.body.audioData.length * 0.75) : undefined,
  };

  try {
    const { response, data, elapsedMs } = await callGemini(apiKey, request, timeoutMs);
    diagnostics.status = response.status;
    diagnostics.elapsedMs = elapsedMs;
    if (!response.ok) {
      const category = classifyProviderStatus(response.status);
      console.error('bolna.provider', { ...diagnostics, category });
      return send(res, response.status, { ok: false, category, diagnostics });
    }
    console.info('bolna.provider', { ...diagnostics, category: 'ok' });
    return send(res, 200, { ok: true, data, diagnostics });
  } catch (error) {
    const category = error?.name === 'AbortError' ? 'timeout' : 'network_or_provider_transport';
    console.error('bolna.provider', { ...diagnostics, category });
    return send(res, category === 'timeout' ? 504 : 502, { ok: false, category, diagnostics });
  }
};
