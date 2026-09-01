let bolnaAudioContext=null,bolnaSource=null;
function unlockBolnaAudio(){
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return null;
  if(!bolnaAudioContext)bolnaAudioContext=new C();
  if(bolnaAudioContext.state==='suspended')bolnaAudioContext.resume().catch(()=>{});
  return bolnaAudioContext;
}
async function playBlobThroughWebAudio(blob){
  const ac=unlockBolnaAudio();
  if(!ac)throw new Error('Web Audio unavailable');
  if(ac.state==='suspended')await ac.resume();
  const buf=await blob.arrayBuffer();
  const audioBuf=await ac.decodeAudioData(buf.slice(0));
  try{bolnaSource?.stop()}catch{}
  const src=ac.createBufferSource();
  bolnaSource=src;
  src.buffer=audioBuf;
  src.connect(ac.destination);
  src.start(0);
  return new Promise(resolve=>{src.onended=()=>{if(bolnaSource===src)bolnaSource=null;resolve()}});
}
playText=async function(text,slow=false){
  if(!text)return;
  const ac=unlockBolnaAudio();
  if(ac?.state==='suspended')ac.resume().catch(()=>{});
  try{
    try{player?.pause()}catch{}
    try{bolnaSource?.stop()}catch{}
    if(result){state='playing';error=null;render()}
    const blob=await speech(text,slow);
    await playBlobThroughWebAudio(blob);
    if(result){state='ready';render()}
  }catch(e){
    console.error('Bolna audio playback failed',e);
    error={title:'Audio temporarily unavailable',detail:'Audio could not start on this device. Tap Hear it again.'};
    if(result){state='ready';render()}
  }
};

document.addEventListener('pointerdown',e=>{
  if(e.target.closest('#hear,#slow,#variantPlay,[data-word],[data-recent],[data-play]'))unlockBolnaAudio();
},{capture:true,passive:true});
