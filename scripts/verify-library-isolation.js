const fs=require('fs');
const [prodPath,curPath]=process.argv.slice(2);
const prod=fs.readFileSync(prodPath,'utf8');
const cur=fs.readFileSync(curPath,'utf8');
function withoutLibrary(s){const a=s.indexOf('function renderLibrary(){'),b=s.indexOf('function renderPhrases(){',a);if(a<0||b<0)throw new Error('renderLibrary boundaries missing');return s.slice(0,a)+s.slice(b)}
if(withoutLibrary(prod)!==withoutLibrary(cur))throw new Error('app-runtime changed outside renderLibrary');
const vp=cur.slice(cur.indexOf('function voiceCorePrompt()'),cur.indexOf('function corePrompt'));
if(vp.includes('JSON.stringify(context)'))throw new Error('context returned to voice prompt');
const flow=cur.slice(cur.indexOf('async function startListening()'),cur.indexOf('async function submitTyped()'));
if(!flow.includes('const d=await voiceCore(b)'))throw new Error('production voice flow changed');
if(flow.includes('transcript=await transcribe(b)'))throw new Error('two-stage voice regression returned');
console.log('production voice/runtime isolation PASS');
