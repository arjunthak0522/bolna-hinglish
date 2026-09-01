// Bolna consolidated QA runtime. One owner for request flow + audio.
(() => {
  const ENDPOINT='https://generativelanguage.googleapis.com/v1/interactions';
  const voiceCache=new Map();
  let playbackCtx=null;
  let playbackSource=null;

  async function request(body, timeoutMs){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const r=await fetch(ENDPOINT,{
        method:'POST',
        headers:{'content-type':'application/json','x-goog-api-key':ensureKey()},
        body:JSON.stringify(body),
        signal:controller.signal
      });
      const tx=await r.text();
      let j; try{j=JSON.parse(tx)}catch{}
      if(!r.ok) throw new Error(j?.error?.message||`Gemini request failed (${r.status})`);
      return j;
    } catch(e){
      if(e?.name==='AbortError') throw new Error('Gemini did not respond quickly enough.');
      if(/fetch|network|load failed/i.test(e?.message||'')) throw new Error('Could not reach Gemini.');
      throw e;
    } finally { clearTimeout(timer); }
  }

  interact=async function(body,ms=9000){ return request(body,ms); };

  gen=async function(e,mode='core',n='',s=''){
    const schema=mode==='core'?coreSchema:enrichSchema;
    const p=mode==='core'?corePrompt(e,context):enrichPrompt(e,context,n,s);
    const x=await request({
      model:'gemini-3.5-flash-lite',
      input:p,
      generation_config:{thinking_level:'minimal'},
      response_format:{type:'text',mime_type:'application/json',schema}
    },mode==='core'?8000:9000);
    const text=outText(x);
    if(!text) throw new Error('Gemini returned no Hinglish result.');
    return JSON.parse(text);
  };

  transcribe=async function(b64,mime){
    const x=await request({
      model:'gemini-3.5-flash-lite',
      input:[
        {type:'text',text:'Transcribe this short English utterance exactly. Return only the transcript with normal punctuation. Do not translate or explain.'},
        {type:'audio',data:b64,mime_type:mime}
      ],
      generation_config:{thinking_level:'minimal'}
    },9000);
    const t=outText(x).replace(/^[\"']|[\"']$/g,'').trim();
    if(!t) throw new Error('I could not hear that clearly.');
    return t;
  };

  function unlockPlayback(){
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C) return null;
    if(!playbackCtx) playbackCtx=new C();
    if(playbackCtx.state==='suspended') playbackCtx.resume().catch(()=>{});
    return playbackCtx;
  }

  async function playBlob(blob){
    const ac=unlockPlayback();
    if(!ac) throw new Error('Web Audio unavailable.');
    if(ac.state==='suspended') await ac.resume();
    const ab=await blob.arrayBuffer();
    const decoded=await ac.decodeAudioData(ab.slice(0));
    try{playbackSource?.stop()}catch{}
    const src=ac.createBufferSource();
    playbackSource=src;
    src.buffer=decoded;
    src.connect(ac.destination);
    src.start(0);
    return new Promise(resolve=>{
      src.onended=()=>{ if(playbackSource===src) playbackSource=null; resolve(); };
    });
  }

  speech=async function(text,slow=false){
    const k=`${slow?'slow':'normal'}:${text}`;
    if(voiceCache.has(k)) return voiceCache.get(k);
    const p=(async()=>{
      const x=await request({
        model:'gemini-3.1-flash-tts-preview',
        input:`VOICE: adult Indian male, warm, natural, calm, contemporary. ACCENT: natural urban Indian speech. DELIVERY: ${slow?'Speak slowly and clearly for a learner.':'Speak at a natural conversational pace.'} Handle Hindi-English code switching naturally. Speak exactly this and nothing else: ${text}`,
        response_format:{type:'audio'},
        generation_config:{speech_config:[{voice:'Rasalgethi'}]}
      },12000);
      const a=outAudio(x);
      if(!a?.data) throw new Error('Gemini returned no audio.');
      return pcmWav(a.data);
    })();
    voiceCache.set(k,p);
    try{return await p}catch(e){voiceCache.delete(k);throw e}
  };

  function prefetchVoice(text){ if(text) void speech(text,false).catch(()=>{}); }

  playText=async function(text,slow=false){
    if(!text)return;
    unlockPlayback();
    try{
      if(result){state='playing';error=null;render()}
      const blob=await speech(text,slow);
      await playBlob(blob);
      if(result){state='ready';render()}
    }catch(e){
      console.error('Bolna playback failed',e);
      error={title:'Audio temporarily unavailable',detail:e?.message||'Audio could not start.'};
      if(result){state='ready';render()}
    }
  };

  startListening=async function(){
    if(['requesting','listening','transcribing','generating'].includes(state))return;
    try{ensureKey()}catch(e){error={title:'Setup required',detail:e.message};return render()}
    error=null;result=null;transcript='';stopping=false;reqId++;const id=reqId;
    try{
      state='requesting';render();
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      const mime=pickMime();
      recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
      chunks=[];
      recorder.ondataavailable=e=>e.data?.size&&chunks.push(e.data);
      recorder.onstop=async()=>{
        const b=new Blob(chunks,{type:recorder.mimeType||mime||'audio/webm'});
        cleanup();
        try{
          state='transcribing';render();
          transcript=await transcribe(await toB64(b),(b.type||'audio/webm').split(';')[0].replace('audio/mp4','audio/m4a'));
          if(id!==reqId)return;
          localStorage.setItem('bolna_voice_used','1');
          const inferred=infer(transcript);
          if(context==='General'&&inferred){context=inferred;localStorage.setItem('bolna_context',inferred)}
          state='generating';render();
          const d=await gen(transcript);
          if(id!==reqId)return;
          result={...d,polite:'',casual:'',moreHindi:'',words:[],_enriched:false};
          state='ready';remember();render();
          prefetchVoice(result.speechText);
        }catch(e){
          error={title:'Couldn’t process that',detail:e?.message||'Please try again.'};
          state='idle';render();
        }
      };
      ctx=new (window.AudioContext||window.webkitAudioContext)();
      const src=ctx.createMediaStreamSource(stream);
      analyser=ctx.createAnalyser();analyser.fftSize=1024;src.connect(analyser);
      noise=.012;heard=false;startAt=performance.now();speechAt=lastVoice=0;
      recorder.start(250);state='listening';render();raf=requestAnimationFrame(vad);
    }catch(e){
      cleanup();error={title:'Microphone unavailable',detail:'Allow microphone access for this site, then try again.'};state='idle';render();
    }
  };

  document.addEventListener('pointerdown',e=>{
    if(e.target.closest('#hear,#slow,#variantPlay,[data-word],[data-recent],[data-play]')) unlockPlayback();
  },{capture:true,passive:true});

  window.__bolnaRuntime='consolidated-v1';
})();
