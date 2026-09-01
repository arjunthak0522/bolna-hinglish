const bolnaCombinedSchema={type:'object',properties:{transcript:{type:'string'},natural:{type:'string'},spokenForm:{type:'string'},phonetic:{type:'string'},meaning:{type:'string'},speechText:{type:'string'},confidence:{type:'number'},phoneticConfidence:{type:'string',enum:['high','medium']}},required:['transcript','natural','spokenForm','phonetic','meaning','speechText','confidence','phoneticConfidence'],additionalProperties:false};
const bolnaVoiceCache=new Map();
let bolnaAudioCtx=null,bolnaSource=null;

async function bolnaFetch(body,ms=10000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{
    const r=await fetch(A,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':ensureKey()},body:JSON.stringify(body),signal:controller.signal});
    const tx=await r.text();let j;try{j=JSON.parse(tx)}catch{}
    if(!r.ok)throw new Error(j?.error?.message||`Gemini request failed (${r.status})`);
    return j;
  }catch(e){
    if(e?.name==='AbortError')throw new Error('That request took too long. Please try again.');
    if(/fetch|network|load failed/i.test(e?.message||''))throw new Error('Network connection to Gemini failed. Please try again.');
    throw e;
  }finally{clearTimeout(timer)}
}

async function bolnaAudioToResult(b64,mime){
  const prompt=`Listen to this short English utterance and do two jobs in ONE response.\n1. transcript: exactly what the speaker said in English, with normal punctuation.\n2. Create the fastest high-quality Bolna CORE answer for context ${JSON.stringify(context)}. natural = contemporary spoken Roman-script Hinglish. spokenForm = connected spoken realization. phonetic = one-line pronunciation optimized for an American English speaker. meaning = concise English meaning. speechText = exact natural wording for TTS. confidence 0-1. phoneticConfidence high or medium.\n${rules}\nExamples: \"Please stop right here.\" -> \"Bhaiya, bas yahin rok dena.\" -> \"BHAI-yaa, bus ya-HEE(n) rohk DAY-naa\". \"Turn the AC down a little.\" -> \"AC thoda kam kar dena.\" -> \"A-C, TOH-daa kum kur DAY-naa\". Return only the requested JSON.`;
  const x=await bolnaFetch({model:'gemini-3.5-flash-lite',input:[{type:'text',text:prompt},{type:'audio',data:b64,mime_type:mime}],generation_config:{thinking_level:'minimal'},response_format:{type:'text',mime_type:'application/json',schema:bolnaCombinedSchema}},10000);
  const t=outText(x);if(!t)throw new Error('I could not understand the recording.');
  return JSON.parse(t);
}

speech=async function(text,slow=false){
  const cacheKey=`${slow?'slow':'normal'}:${text}`;
  if(bolnaVoiceCache.has(cacheKey))return bolnaVoiceCache.get(cacheKey);
  const promise=(async()=>{
    const x=await bolnaFetch({model:'gemini-3.1-flash-tts-preview',input:`VOICE: adult Indian male, warm, natural, calm, contemporary. ACCENT: natural urban Indian speech. DELIVERY: ${slow?'Speak slowly and clearly for a learner.':'Speak at a natural conversational pace.'} Handle Hindi-English code switching naturally. Speak exactly this and nothing else: ${text}`,response_format:{type:'audio',mime_type:'audio/wav',delivery:'inline'},generation_config:{speech_config:[{voice:'Rasalgethi'}]}},12000);
    const a=outAudio(x);if(!a?.data)throw new Error('Audio temporarily unavailable.');
    const bin=atob(a.data),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return new Blob([bytes],{type:a.mime_type||'audio/wav'});
  })();
  bolnaVoiceCache.set(cacheKey,promise);
  try{return await promise}catch(e){bolnaVoiceCache.delete(cacheKey);throw e}
};

function bolnaPrefetchVoice(text){if(!text)return;void speech(text,false).catch(()=>{});}

playText=async function(text,slow=false){
  if(!text)return;
  try{
    if(!bolnaAudioCtx)bolnaAudioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(bolnaAudioCtx.state==='suspended')await bolnaAudioCtx.resume();
    try{bolnaSource?.stop()}catch{}
    state=result?'playing':state;render();
    const blob=await speech(text,slow),ab=await blob.arrayBuffer();
    const buffer=await bolnaAudioCtx.decodeAudioData(ab.slice(0));
    const src=bolnaAudioCtx.createBufferSource();bolnaSource=src;src.buffer=buffer;src.connect(bolnaAudioCtx.destination);
    src.onended=()=>{if(result){state='ready';render()}};
    src.start(0);
  }catch(e){error={title:'Audio temporarily unavailable',detail:e?.message||'Use the pronunciation guide for now.'};if(result){state='ready';render()}}
};

startListening=async function(){
  if(['requesting','listening','transcribing','generating'].includes(state))return;
  try{ensureKey()}catch(e){error={title:'Setup required',detail:e.message};return render()}
  error=null;result=null;transcript='';stopping=false;reqId++;const id=reqId;
  try{
    state='requesting';render();
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const mime=pickMime();recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);chunks=[];
    recorder.ondataavailable=e=>e.data?.size&&chunks.push(e.data);
    recorder.onstop=async()=>{
      const b=new Blob(chunks,{type:recorder.mimeType||mime||'audio/webm'});cleanup();
      state='generating';render();
      try{
        const data=await bolnaAudioToResult(await toB64(b),(b.type||'audio/webm').split(';')[0].replace('audio/mp4','audio/m4a'));
        if(id!==reqId)return;
        transcript=(data.transcript||'').trim();if(!transcript)throw new Error('I could not understand the recording.');
        localStorage.setItem('bolna_voice_used','1');
        const inferred=infer(transcript);if(context==='General'&&inferred){context=inferred;localStorage.setItem('bolna_context',inferred)}
        result={natural:data.natural,spokenForm:data.spokenForm,phonetic:data.phonetic,meaning:data.meaning,speechText:data.speechText,confidence:data.confidence,phoneticConfidence:data.phoneticConfidence,polite:'',casual:'',moreHindi:'',words:[],_enriched:false};
        state='ready';remember();render();bolnaPrefetchVoice(result.speechText);
      }catch(e){error={title:'Couldn’t process that',detail:e.message};state='idle';render()}
    };
    ctx=new (window.AudioContext||window.webkitAudioContext)();const src=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=1024;src.connect(analyser);noise=.012;heard=false;startAt=performance.now();speechAt=lastVoice=0;recorder.start(250);state='listening';render();raf=requestAnimationFrame(vad);
  }catch(e){cleanup();error={title:'Microphone unavailable',detail:'Allow microphone access for this site, then try again.'};state='idle';render()}
};
