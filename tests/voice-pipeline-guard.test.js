const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('microphone flow must remain transcribe then generate, never voice_core',()=>{
  const s=fs.readFileSync('app-runtime.js','utf8');
  const start=s.indexOf('async function startListening()');
  const end=s.indexOf('async function submitTyped()',start);
  assert.ok(start>=0&&end>start,'startListening block missing');
  const block=s.slice(start,end);
  assert.match(block,/transcript=await transcribe\\(b(?:,speechWindow)?\\)/);
  assert.match(block,/const d=await generateCore\(transcript\)/);
  assert.doesNotMatch(block,/await voiceCore\(b\)/);
});
