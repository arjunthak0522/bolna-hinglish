from pathlib import Path

p=Path('app-runtime.js')
s=p.read_text()
old_get="async function persistentVoiceGet(key){try{const db=await ttsDb();if(!db)return null;return await new Promise(resolve=>{const tx=db.transaction(TTS_STORE,'readwrite'),st=tx.objectStore(TTS_STORE),r=st.get(key);r.onsuccess=()=>{const row=r.result;if(row?.blob instanceof Blob){row.ts=Date.now();st.put(row);resolve(row.blob)}else resolve(null)};r.onerror=()=>resolve(null)})}catch{return null}}"
new_get="async function persistentVoiceGet(key){try{const db=await ttsDb();if(!db)return null;return await new Promise(resolve=>{const tx=db.transaction(TTS_STORE,'readwrite'),st=tx.objectStore(TTS_STORE),r=st.get(key);r.onsuccess=()=>{const row=r.result;if(row?.bytes&&Number.isFinite(row.bytes.byteLength)){row.ts=Date.now();st.put(row);resolve(new Blob([row.bytes],{type:row.type||'audio/wav'}))}else resolve(null)};r.onerror=()=>resolve(null)})}catch{return null}}"
old_put="async function persistentVoicePut(key,blob){try{const db=await ttsDb();if(!db||!(blob instanceof Blob))return;await new Promise(resolve=>{const tx=db.transaction(TTS_STORE,'readwrite'),r=tx.objectStore(TTS_STORE).put({key,blob,ts:Date.now()});r.onsuccess=r.onerror=()=>resolve()});void trimPersistentVoices(db)}catch{}}"
new_put="async function persistentVoicePut(key,blob){try{const db=await ttsDb();if(!db||!(blob instanceof Blob))return;const bytes=await blob.arrayBuffer();await new Promise(resolve=>{const tx=db.transaction(TTS_STORE,'readwrite'),r=tx.objectStore(TTS_STORE).put({key,bytes,type:blob.type||'audio/wav',ts:Date.now()});r.onsuccess=r.onerror=()=>resolve()});void trimPersistentVoices(db)}catch{}}"
if old_get not in s: raise SystemExit('persistentVoiceGet anchor not found')
if old_put not in s: raise SystemExit('persistentVoicePut anchor not found')
s=s.replace(old_get,new_get,1).replace(old_put,new_put,1)
p.write_text(s)
