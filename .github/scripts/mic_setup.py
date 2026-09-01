from pathlib import Path
p=Path('app-runtime.js')
s=p.read_text()

old="let view='speak',state='idle',transcript='',result=null,error=null,showType=false,panel='';"
new="let view='speak',state='idle',transcript='',result=null,error=null,showType=false,panel='',micSetup=!localStorage.getItem('bolna_mic_setup_done');"
if old not in s: raise SystemExit('state anchor not found')
s=s.replace(old,new,1)

old="async function getMicStream(){if(micStream&&micStream.active&&micStream.getAudioTracks().some(t=>t.readyState==='live'))return micStream;note('microphone',{phase:'permission_request'});micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});note('microphone',{phase:'ready'});return micStream}"
new="async function getMicStream(){if(micStream&&micStream.active&&micStream.getAudioTracks().some(t=>t.readyState==='live'))return micStream;note('microphone',{phase:'permission_request'});micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});localStorage.setItem('bolna_mic_setup_done','1');micSetup=false;note('microphone',{phase:'ready'});return micStream}\nasync function enableMicrophone(){error=null;try{state='requesting';render();await getMicStream();state='idle';render()}catch(e){error={title:'Microphone access needed',detail:e?.name==='NotAllowedError'?'Allow microphone access for Bolna in Safari, then tap Enable microphone again.':'The microphone could not start. Please try again.'};state='idle';render()}}"
if old not in s: raise SystemExit('getMicStream anchor not found')
s=s.replace(old,new,1)

old="<div class=\"micStage ${state==='listening'?'active':''}\"><button class=\"mic\" id=\"mic\" ${busy&&state!=='listening'?'disabled':''}>"
new="${micSetup?'<div class=\"micSetup\"><strong>Enable microphone once</strong><span>Bolna uses your microphone only when you tap to speak. Safari may show its permission prompt.</span><button id=\"enableMic\">Enable microphone</button></div>':''}<div class=\"micStage ${state==='listening'?'active':''}\"><button class=\"mic\" id=\"mic\" ${busy&&state!=='listening'?'disabled':''}>"
if old not in s: raise SystemExit('render anchor not found')
s=s.replace(old,new,1)

old="document.getElementById('mic').onclick=()=>state==='listening'?stopRecording():startListening();"
new="document.getElementById('enableMic')?.addEventListener('click',enableMicrophone);document.getElementById('mic').onclick=()=>state==='listening'?stopRecording():startListening();"
if old not in s: raise SystemExit('bind anchor not found')
s=s.replace(old,new,1)

p.write_text(s)
