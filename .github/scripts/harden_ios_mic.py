from pathlib import Path
p=Path('app-runtime.js')
s=p.read_text()
old="async function getMicStream(){if(micStream&&micStream.active&&micStream.getAudioTracks().some(t=>t.readyState==='live'))return micStream;note('microphone',{phase:'permission_request'});micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});localStorage.setItem('bolna_mic_setup_done','1');micSetup=false;note('microphone',{phase:'ready'});return micStream}"
new="async function getMicStream(){const reusable=micStream&&micStream.active&&micStream.getAudioTracks().some(t=>t.readyState==='live'&&t.enabled&&!t.muted);if(reusable)return micStream;if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null}note('microphone',{phase:'permission_request'});micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});const track=micStream.getAudioTracks()[0];if(!track||track.readyState!=='live'||!track.enabled){releaseMicrophone();throw Object.assign(new Error('Safari did not provide a usable microphone stream.'),{name:'NotReadableError'})}localStorage.setItem('bolna_mic_setup_done','1');micSetup=false;note('microphone',{phase:'ready',muted:!!track.muted,enabled:!!track.enabled});return micStream}"
if old not in s: raise SystemExit('getMicStream anchor not found')
s=s.replace(old,new,1)
old="const stream=await getMicStream();const mime=pickMime();recorder="
new="const stream=await getMicStream();const track=stream.getAudioTracks()[0];if(track?.muted)await new Promise(r=>setTimeout(r,220));const mime=pickMime();recorder="
if old not in s: raise SystemExit('startListening anchor not found')
s=s.replace(old,new,1)
old="if(b.size<256){error={title:'I didn’t hear any speech',detail:'Try again and start speaking after the microphone begins listening.'};state='idle';return render()}"
new="if(b.size<256){note('microphone',{phase:'empty_recording',bytes:b.size});releaseMicrophone();error={title:'Microphone wasn’t ready',detail:'Safari did not deliver audio that time. Tap the microphone and try once more.'};state='idle';return render()}"
if old not in s: raise SystemExit('empty recording anchor not found')
s=s.replace(old,new,1)
p.write_text(s)
