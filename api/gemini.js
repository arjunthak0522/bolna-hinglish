const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const ALLOWED_ORIGINS = new Set([
  'https://hinglish-companion.vercel.app',
  'https://arjunthak0522.github.io',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
]);
const BOLNA_PREVIEW_ORIGIN = /^https:\/\/hinglish-companion-[a-z0-9-]+-arjunthak-4571\.vercel\.app$/;
function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.has(origin) || BOLNA_PREVIEW_ORIGIN.test(origin);
}

const LIMITS = Object.freeze({
  audioBase64Chars: 1_000_000,
  promptChars: 12_000,
  ttsChars: 1_000,
  schemaChars: 16_000,
});

const MODELS = Object.freeze({
  transcribe: 'gemini-3.5-flash-lite',
  generate: 'gemini-3.5-flash-lite',
  enrich: 'gemini-3.5-flash-lite',
  tts: 'gemini-3.1-flash-tts-preview',
});

function cors(req, res) {
  const origin = req.headers.origin || '';
  if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
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
  if (!['voice_core', 'transcribe', 'generate', 'enrich', 'tts'].includes(body.operation)) return 'Unsupported operation.';

  if (body.operation === 'voice_core' || body.operation === 'transcribe') {
    if (typeof body.audioData !== 'string' || !body.audioData) return 'audioData is required.';
    if (body.audioMime !== 'audio/wav') return 'Bolna voice input requires normalized audio/wav.';
    if (body.operation === 'voice_core') {
      if (typeof body.prompt !== 'string' || !body.prompt.trim()) return 'prompt is required.';
      if (body.prompt.length > LIMITS.promptChars) return 'Prompt is too large.';
      if (!body.schema || JSON.stringify(body.schema).length > LIMITS.schemaChars) return 'Valid schema is required.';
    }
    if (body.audioData.length > LIMITS.audioBase64Chars) return 'Recording is too large.';
  }

  if (body.operation === 'generate' || body.operation === 'enrich') {
    if (typeof body.prompt !== 'string' || !body.prompt.trim()) return 'prompt is required.';
    if (body.prompt.length > LIMITS.promptChars) return 'Prompt is too large.';
    if (body.schema && JSON.stringify(body.schema).length > LIMITS.schemaChars) return 'Schema is too large.';
  }

  if (body.operation === 'tts') {
    if (typeof body.text !== 'string' || !body.text.trim()) return 'text is required.';
    if (body.text.length > LIMITS.ttsChars) return 'Speech text is too large.';
  }

  return null;
}

function providerRequest(body) {
  if (body.operation === 'voice_core') {
    return {
      timeoutMs: 6500,
      retryTimeoutMs: 7000,
      request: {
        model: MODELS.generate,
        input: [
          { type: 'text', text: body.prompt },
          { type: 'audio', data: body.audioData, mime_type: 'audio/wav' },
        ],
        generation_config: { thinking_level: 'minimal' },
        response_format: { type: 'text', mime_type: 'application/json', schema: body.schema },
      },
    };
  }
  if (body.operation === 'transcribe') {
    return {
      timeoutMs: 5500,
      retryTimeoutMs: 8000,
      request: {
        model: MODELS.transcribe,
        input: [
          { type: 'text', text: 'Transcribe this short English utterance exactly. Return only the transcript with normal punctuation. Do not translate or explain.' },
          { type: 'audio', data: body.audioData, mime_type: 'audio/wav' },
        ],
        generation_config: { thinking_level: 'minimal' },
      },
    };
  }
  if (body.operation === 'generate' || body.operation === 'enrich') {
    return {
      timeoutMs: 15000,
      retryTimeoutMs: 0,
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
    retryTimeoutMs: 0,
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
  if (!isAllowedOrigin(origin)) return send(res, 403, { ok: false, category: 'origin_not_allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return send(res, 500, { ok: false, category: 'invalid_api_configuration', message: 'Gemini provider is not configured.' });

  const validationError = validateOperation(req.body);
  if (validationError) return send(res, 400, { ok: false, category: 'invalid_client_request', message: validationError });

  const { request, timeoutMs, retryTimeoutMs } = providerRequest(req.body);
  const diagnostics = {
    operation: req.body.operation,
    endpoint: GEMINI_ENDPOINT,
    model: request.model,
    mimeType: ['voice_core','transcribe'].includes(req.body.operation) ? 'audio/wav' : undefined,
    recordingBytesApprox: ['voice_core','transcribe'].includes(req.body.operation) ? Math.floor(req.body.audioData.length * 0.75) : undefined,
  };

  let attempt = 1;
  let totalElapsedMs = 0;
  while (true) {
    try {
      const currentTimeout = attempt === 1 ? timeoutMs : retryTimeoutMs;
      const { response, data, elapsedMs } = await callGemini(apiKey, request, currentTimeout);
      totalElapsedMs += elapsedMs;
      diagnostics.status = response.status;
      diagnostics.elapsedMs = totalElapsedMs;
      diagnostics.attempt = attempt;
      if (!response.ok) {
        const category = classifyProviderStatus(response.status);
        console.error('bolna.provider', { ...diagnostics, category });
        return send(res, response.status, { ok: false, category, diagnostics });
      }
      console.info('bolna.provider', { ...diagnostics, category: 'ok' });
      return send(res, 200, { ok: true, data, diagnostics });
    } catch (error) {
      const timedOut = error?.name === 'AbortError';
      totalElapsedMs += attempt === 1 ? timeoutMs : retryTimeoutMs;
      if (timedOut && attempt === 1 && retryTimeoutMs > 0) {
        console.warn('bolna.provider.retry', { ...diagnostics, attempt, category: 'timeout', elapsedMs: totalElapsedMs });
        attempt = 2;
        continue;
      }
      diagnostics.elapsedMs = totalElapsedMs;
      diagnostics.attempt = attempt;
      const category = timedOut ? 'timeout' : 'network_or_provider_transport';
      console.error('bolna.provider', { ...diagnostics, category });
      return send(res, category === 'timeout' ? 504 : 502, { ok: false, category, diagnostics });
    }
  }
};