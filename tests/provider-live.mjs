import assert from 'node:assert/strict';

const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error('GEMINI_API_KEY is required for real provider validation.');

const endpoint = 'https://generativelanguage.googleapis.com/v1beta/interactions';

async function call(body, label) {
  const started = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = null; }
  console.log(`${label}: status=${response.status} elapsedMs=${Date.now() - started}`);
  if (!response.ok) {
    const providerMessage = data?.error?.message || raw.slice(0, 500);
    throw new Error(`${label} rejected by Gemini: HTTP ${response.status}: ${providerMessage}`);
  }
  return data;
}

function outputText(data) {
  const parts = [];
  for (const step of data?.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const content of step?.content || []) if (content?.type === 'text' && content.text) parts.push(content.text);
  }
  return parts.join('').trim();
}

function outputAudio(data) {
  for (const step of data?.steps || []) {
    if (step?.type !== 'model_output') continue;
    for (const content of step?.content || []) if (content?.type === 'audio' && content.data) return content;
  }
  return null;
}

function pcmToWavBase64(pcmBase64, sampleRate = 24000) {
  const pcm = Buffer.from(pcmBase64, 'base64');
  assert.ok(pcm.length >= 2 && pcm.length % 2 === 0, 'TTS PCM must contain whole 16-bit samples.');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString('base64');
}

const tts = await call({
  model: 'gemini-3.1-flash-tts-preview',
  input: 'Speak clearly in natural adult Indian English: Stop here.',
  response_format: { type: 'audio' },
  generation_config: { speech_config: [{ voice: 'Rasalgethi' }] },
}, 'tts');

const audio = outputAudio(tts);
assert.ok(audio?.data, 'Gemini TTS returned no audio content.');
const wav = pcmToWavBase64(audio.data, 24000);

const transcription = await call({
  model: 'gemini-3.7-flash',
  input: [
    { type: 'text', text: 'Transcribe this short English utterance exactly. Return only the transcript with normal punctuation.' },
    { type: 'audio', data: wav, mime_type: 'audio/wav' },
  ],
  generation_config: { thinking_level: 'low' },
}, 'transcription');

const transcript = outputText(transcription);
assert.ok(transcript, 'Gemini transcription returned empty text.');
assert.match(transcript.toLowerCase(), /stop\s+here/, `Unexpected transcript: ${transcript}`);

const schema = {
  type: 'object',
  properties: {
    natural: { type: 'string' },
    phonetic: { type: 'string' },
    meaning: { type: 'string' },
  },
  required: ['natural', 'phonetic', 'meaning'],
  additionalProperties: false,
};
const generation = await call({
  model: 'gemini-3.5-flash-lite',
  input: 'English: "Stop here." Context: Driver. Return natural contemporary Roman-script Hinglish plus American-friendly learner pronunciation and meaning. No IPA.',
  generation_config: { thinking_level: 'minimal' },
  response_format: { type: 'text', mime_type: 'application/json', schema },
}, 'generation');

const generatedText = outputText(generation);
assert.ok(generatedText, 'Gemini structured generation returned empty text.');
const generated = JSON.parse(generatedText);
assert.equal(typeof generated.natural, 'string');
assert.equal(typeof generated.phonetic, 'string');
assert.equal(typeof generated.meaning, 'string');
assert.ok(generated.natural.length > 2 && generated.phonetic.length > 2);

console.log('PROVIDER_VALIDATED_CONTRACT: TTS, inline WAV transcription, thinking levels, and structured output accepted by real Gemini.');
