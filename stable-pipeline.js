// QA candidate: restore the previously proven fast two-stage path.
// Speech: record -> transcription -> lightweight core generation.
// TTS is prefetched after result and raw Gemini PCM is wrapped into WAV.
const bolnaStableVoiceCache=new Map();

speech=async function(text,slow=false){
  const cacheKey=`${slow?'slow':'normal'}:${text}`;
  if(bolnaStableVoiceCache.has(cacheKey))return bolnaStableVoiceCache.get(cacheKey);
  const promise=(async()=>{
    const x=await interact({
      model:'gemini-3.1-flash-tts-preview',
      input:`Synthesize speech only. VOICE: adult Indian male, warm, natural, calm, contemporary. ACCENT: natural urban Indian speech. DELIVERY: ${slow?'Speak slowly and clearly for a learner.':'Speak at a natural conversational pace.'} Handle Hindi-English code switching naturally. TRANSCRIPT TO SPEAK EXACTLY: ${text}`,
      response_format:{type:'audio'},
      generation_config:{speech_config:[{voice:'Rasalgethi'}]}
    },10000);
    const a=outAudio(x);
    if(!a?.data)throw new Error('Audio temporarily unavailable.');
    return pcmWav(a.data);
  })();
  bolnaStableVoiceCache.set(cacheKey,promise);
  try{return await promise}catch(e){bolnaStableVoiceCache.delete(cacheKey);throw e}
};

function bolnaStablePrefetch(text){if(text)void speech(text,false).catch(()=>{});}

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
      state='transcribing';render();
      try{
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
        bolnaStablePrefetch(result.speechText);
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
