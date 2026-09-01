// Reliability patch: keep fast normal responses, stop aborting healthy Gemini requests on iPhone Safari.
interact = async function(body, ms = 12000) {
  const apiKey = ensureKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(A, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
        'x-goog-api-client': 'bolna-web/1.0'
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store'
    });
    const text = await response.text();
    let json;
    try { json = JSON.parse(text); } catch {}
    if (!response.ok) throw new Error(json?.error?.message || `Gemini request failed (${response.status})`);
    return json;
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('Gemini took too long to respond. Please try again.');
    if (err instanceof TypeError) throw new Error('Could not reach Gemini. Please try again.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// These are maximum wait limits only. A 2-second Gemini response still returns in 2 seconds.
const _bolnaGen = gen;
gen = async function(e, mode='core', n='', s='') {
  const schema = mode === 'core' ? coreSchema : enrichSchema;
  const p = mode === 'core' ? corePrompt(e, context) : enrichPrompt(e, context, n, s);
  const x = await interact({
    model:'gemini-3.5-flash-lite',
    input:p,
    generation_config:{thinking_level:'minimal'},
    response_format:{type:'text',mime_type:'application/json',schema}
  }, mode === 'core' ? 12000 : 12000);
  return JSON.parse(outText(x));
};

transcribe = async function(b64, mime) {
  const x = await interact({
    model:'gemini-3.5-flash-lite',
    input:[
      {type:'text',text:'Transcribe this short English utterance exactly. Return only the transcript, with normal punctuation. Do not translate or explain.'},
      {type:'audio',data:b64,mime_type:mime}
    ],
    generation_config:{thinking_level:'low'}
  }, 12000);
  const t = outText(x).replace(/^[\"']|[\"']$/g,'').trim();
  if (!t) throw new Error('I could not hear that clearly.');
  return t;
};
