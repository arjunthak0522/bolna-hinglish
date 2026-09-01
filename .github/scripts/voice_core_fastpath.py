from pathlib import Path

# Patch backend
p=Path('api/gemini.js')
s=p.read_text()
s=s.replace("if (!['transcribe', 'generate', 'enrich', 'tts'].includes(body.operation))", "if (!['voice_core', 'transcribe', 'generate', 'enrich', 'tts'].includes(body.operation))")
s=s.replace("  if (body.operation === 'transcribe') {\n", "  if (body.operation === 'voice_core' || body.operation === 'transcribe') {\n", 1)
s=s.replace("    if (body.audioMime !== 'audio/wav') return 'Bolna transcription requires normalized audio/wav.';", "    if (body.audioMime !== 'audio/wav') return 'Bolna voice input requires normalized audio/wav.';\n    if (body.operation === 'voice_core') {\n      if (typeof body.prompt !== 'string' || !body.prompt.trim()) return 'prompt is required.';\n      if (body.prompt.length > LIMITS.promptChars) return 'Prompt is too large.';\n      if (!body.schema || JSON.stringify(body.schema).length > LIMITS.schemaChars) return 'Valid schema is required.';\n    }")
anchor="function providerRequest(body) {\n  if (body.operation === 'transcribe') {"
insert="function providerRequest(body) {\n  if (body.operation === 'voice_core') {\n    return {\n      timeoutMs: 6500,\n      retryTimeoutMs: 7000,\n      request: {\n        model: MODELS.generate,\n        input: [\n          { type: 'text', text: body.prompt },\n          { type: 'audio', data: body.audioData, mime_type: 'audio/wav' },\n        ],\n        generation_config: { thinking_level: 'minimal' },\n        response_format: { type: 'text', mime_type: 'application/json', schema: body.schema },\n      },\n    };\n  }\n  if (body.operation === 'transcribe') {"
if anchor not in s: raise SystemExit('backend provider anchor missing')
s=s.replace(anchor,insert,1)
s=s.replace("mimeType: req.body.operation === 'transcribe' ? 'audio/wav' : undefined,", "mimeType: ['voice_core','transcribe'].includes(req.body.operation) ? 'audio/wav' : undefined,")
s=s.replace("recordingBytesApprox: req.body.operation === 'transcribe' ? Math.floor(req.body.audioData.length * 0.75) : undefined,", "recordingBytesApprox: ['voice_core','transcribe'].includes(req.body.operation) ? Math.floor(req.body.audioData.length * 0.75) : undefined,")
p.write_text(s)

# Patch frontend
p=Path('app-runtime.js')
s=p.read_text()
core_decl="const coreSchema={type:'object',properties:{natural:{type:'string'},spokenForm:{type:'string'},phonetic:{type:'string'},meaning:{type:'string'},speechText:{type:'string'},confidence:{type:'number'},phoneticConfidence:{type:'string',enum:['high','medium']}},required:['natural','spokenForm','phonetic','meaning','speechText','confidence','phoneticConfidence'],additionalProperties:false};"
voice_decl=core_decl+"\nconst voiceCoreSchema={type:'object',properties:{transcript:{type:'string'},natural:{type:'string'},spokenForm:{type:'string'},phonetic:{type:'string'},meaning:{type:'string'},speechText:{type:'string'},confidence:{type:'number'},phoneticConfidence:{type:'string',enum:['high','medium']}},required:['transcript','natural','spokenForm','phonetic','meaning','speechText','confidence','phoneticConfidence'],additionalProperties:false};"
if core_decl not in s: raise SystemExit('core schema anchor missing')
s=s.replace(core_decl,voice_decl,1)

prompt_anchor="function corePrompt(english){return `You are Bolna's expert contemporary Hinglish speaker and Hindi pronunciation coach for American English speakers."
voice_fn="function voiceCorePrompt(){return `You are Bolna's expert contemporary Hinglish speaker and Hindi pronunciation coach for American English speakers.\nListen to the short English utterance. Return the exact English transcript plus the natural contemporary Hinglish response and learner pronunciation.\nContext: ${JSON.stringify(context)}\nReturn only: transcript, natural, spokenForm, phonetic, meaning, speechText, confidence, phoneticConfidence.\n${pronunciationRules}\nThe phonetic field is critical and must be usable even when audio is unavailable.\nReturn only requested JSON.`}\n"
if prompt_anchor not in s: raise SystemExit('core prompt anchor missing')
s=s.replace(prompt_anchor,voice_fn+prompt_anchor,1)

transcribe_anchor="async function transcribe(blob){const t0=performance.now();"
voice_process="async function voiceCore(blob){const t0=performance.now();const normalized=await normalizeRecording(blob);note('normalize',{ms:Math.round(performance.now()-t0),sourceMime:blob.type||'unknown',normalizedBytes:normalized.size});const x=await provider('voice_core',{audioData:await blob64(normalized),audioMime:'audio/wav',prompt:voiceCorePrompt(),schema:voiceCoreSchema},16000);const t=outText(x);if(!t)throw Object.assign(new Error('Gemini returned no voice result.'),{userTitle:'Empty Gemini result'});let d;try{d=JSON.parse(t)}catch{throw Object.assign(new Error('Gemini returned malformed voice data.'),{userTitle:'Invalid Gemini result'})}d.transcript=String(d.transcript||'').trim();if(!d.transcript)throw Object.assign(new Error('No speech was returned from the recording.'),{userTitle:'I didn’t hear that clearly'});return d}\n"
if transcribe_anchor not in s: raise SystemExit('transcribe anchor missing')
s=s.replace(transcribe_anchor,voice_process+transcribe_anchor,1)

old_prefetch="function prefetchVoice(text){if(text)void speech(text,false).catch(()=>{})}"
new_prefetch="function prefetchVoice(text){if(!text)return Promise.resolve(false);if(result){result._audioState='loading';render()}return speech(text,false).then(()=>{if(result&&result.speechText===text){result._audioState='ready';render()}return true}).catch(e=>{if(result&&result.speechText===text){result._audioState=e?.category==='quota_exhausted'?'quota':'unavailable';render()}return false})}"
if old_prefetch not in s: raise SystemExit('prefetch anchor missing')
s=s.replace(old_prefetch,new_prefetch,1)

old_audio="<div class=\"audioGrid\"><button class=\"hear\" id=\"hear\">${state==='playing'?'Playing…':'▶  Hear it'}</button><button class=\"slow\" id=\"slow\">½ Slow</button></div>"
new_audio="<div class=\"audioGrid\"><button class=\"hear\" id=\"hear\" ${result._audioState==='loading'?'disabled':''}>${state==='playing'?'Playing…':result._audioState==='loading'?'Preparing audio…':result._audioState==='quota'?'Audio limit reached':result._audioState==='unavailable'?'Retry audio':'▶  Hear it'}</button><button class=\"slow\" id=\"slow\" ${result._audioState==='loading'?'disabled':''}>½ Slow</button></div>"
if old_audio not in s: raise SystemExit('audio grid anchor missing')
s=s.replace(old_audio,new_audio,1)

old_flow="state='transcribing';render();transcript=await transcribe(b);if(id!==reqId)return;localStorage.setItem('bolna_voice_used','1');const inferred=infer(transcript);if(context==='General'&&inferred){context=inferred;localStorage.setItem('bolna_context',inferred)}state='generating';render();const d=await generateCore(transcript);if(id!==reqId)return;result={...d,polite:'',casual:'',moreHindi:'',words:[],_enriched:false};state='ready';remember();render();prefetchVoice(result.speechText)"
new_flow="state='transcribing';render();const d=await voiceCore(b);if(id!==reqId)return;transcript=d.transcript;localStorage.setItem('bolna_voice_used','1');const inferred=infer(transcript);if(context==='General'&&inferred){context=inferred;localStorage.setItem('bolna_context',inferred)}result={...d,polite:'',casual:'',moreHindi:'',words:[],_enriched:false,_audioState:'loading'};delete result.transcript;state='ready';remember();render();void prefetchVoice(result.speechText)"
if old_flow not in s: raise SystemExit('voice flow anchor missing')
s=s.replace(old_flow,new_flow,1)

p.write_text(s)
