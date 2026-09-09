(() => {
  const CURATED_CHAINS = {
    'the power keeps going out.':['Is there a scheduled power cut?','The backup power is not working.','Can someone come fix this today?'],
    'is there a scheduled power cut?':['The backup power is not working.','The generator has not started.','Can someone come fix this today?'],
    'the backup power is not working.':['The generator has not started.','I need an electrician today.','Can someone come fix this today?'],
    'the generator has not started.':['I need an electrician today.','Can someone come fix this today?','Please call me before you come.'],
    'the water has stopped.':['When will the water come back?','When does the water supply come?','We need a water tanker.'],
    'when will the water come back?':['When does the water supply come?','The water tank is empty.','We need a water tanker.'],
    'the water tank is empty.':['We need a water tanker.','When does the water supply come?','I need a plumber today.'],
    'we need a water tanker.':['When does the water supply come?','Please call me before you come.','How much will the repair cost?'],
    'i need a plumber today.':['What time will the technician come?','Please call me before you come.','How much will the repair cost?'],
    'i need an electrician today.':['What time will the technician come?','Please call me before you come.','How much will the repair cost?'],
    'can someone come fix this today?':['What time will the technician come?','Please call me before you come.','How much will the repair cost?'],
    'what time will the technician come?':['Please call me before you come.','How much will the repair cost?','Please come after 5 PM.'],
    'please call me before you come.':['How much will the repair cost?','It is still not fixed.','Please send someone else.'],
    'there is a leak under the sink.':['I need a plumber today.','Please check the leak again.','Can someone come fix this today?'],
    'please check the leak again.':['It is still not fixed.','Someone came yesterday but it is still broken.','Please send someone else.'],
    'it is still not fixed.':['Someone came yesterday but it is still broken.','Please send someone else.','How much will the repair cost?'],
    'someone came yesterday but it is still broken.':['Please send someone else.','Please call me before you come.','How much will the repair cost?'],
    'the driver cannot find my building.':['Please send me your location.','Please come to the main gate.','Please call me when you reach.'],
    'the driver is at the wrong gate.':['Please come to the main gate.','Use the other entrance.','Please call me when you reach.'],
    'please send me your location.':['Please come to the main gate.','Please call me when you reach.','Please wait here for ten minutes.'],
    'please come to the main gate.':['Please call me when you reach.','Please wait here for ten minutes.','Please come back at 6 PM.'],
    'please wait here for ten minutes.':['Please call me when you reach.','Please come back at 6 PM.','You do not need to wait.'],
    'the delivery person cannot find the building.':['Please send your location on WhatsApp.','Please leave the package with security.','Please call me when you arrive.'],
    'the delivery person says he is outside.':['Please leave the package with security.','The delivery person can come up.','I will come downstairs in two minutes.'],
    'my package says delivered but i do not have it.':['Please leave the package with security.','Ask them to call me.','Please call me when they arrive.'],
    'please let my guest in.':['Please send them up.','Please call me when my guest arrives.','Please do not send them up yet.'],
    'my guest is coming in ten minutes.':['Please let my guest in.','Please call me when my guest arrives.','Please send them up.'],
    'the pharmacy does not have this medicine.':['Do you have another brand of this medicine?','Do you have a generic version?','Can you call another pharmacy?','When will this medicine be available?'],
    'do you have another brand of this medicine?':['Do you have a generic version?','When will this medicine be available?','Can you deliver this medicine tonight?'],
    'do you have a generic version?':['When will this medicine be available?','Can you deliver this medicine tonight?','Can you call another pharmacy?'],
    'when will this medicine be available?':['Can you deliver this medicine tonight?','Please call me if you find this medicine.','Can you call another pharmacy?'],
    'can you deliver this medicine tonight?':['How many times a day should I take this?','Should I take this with food?','Should I take this on an empty stomach?'],
    'please make it less spicy.':['No sugar, please.','Please pack this separately.','Can you make this fresh?'],
    'something is missing from my order.':['This is not what I ordered.','Can you make this fresh?','Please pack this separately.'],
    'this is not what i ordered.':['Something is missing from my order.','Can you make this fresh?','Please pack this separately.'],
    'please come later today.':['Please come tomorrow instead.','Please clean this again.','Please leave the key with security.'],
    'please come tomorrow instead.':['Please clean this again.','Please change the bedsheets.','Please take the trash out.'],
    'please clean this again.':['Please change the bedsheets.','Please take the trash out.','Please leave the key with security.'],
    'which counter do i go to?':['What documents do I need?','Where do I get a token?','Where do I sign?'],
    'what documents do i need?':['Where can I get this photocopied?','Where do I sign?','How long will this take?'],
    'where do i get a token?':['Which counter do I go to?','Where do I sign?','How long will this take?'],
    'please speak a little slower.':['Can you say that again?','Please say the number again.','Please write it down for me.'],
    'can you say that again?':['Please speak a little slower.','Please say the number again.','Please send it to me on WhatsApp.'],
    'please say the number again.':['Please write it down for me.','Please send it to me on WhatsApp.','Please explain it simply.'],
    'i understand a little hindi.':['Please speak a little slower.','Can you say that again?','Please explain it simply.']
  };

  const ROUGH_ROUTES = [
    [/\b(electricity|power)\b.*\b(out|off|gone|cut|keeps? going|keeps? cutting)\b|\b(no|without)\s+(electricity|power)\b/i,'the power keeps going out.'],
    [/\bbackup power\b.*\b(not working|not starting|failed|off)\b/i,'the backup power is not working.'],
    [/\bgenerator\b.*\b(not started|not starting|not working|failed)\b/i,'the generator has not started.'],
    [/\bwater\b.*\b(stopped|not coming|isn'?t coming|gone|off|no water)\b|\bno water\b/i,'the water has stopped.'],
    [/\bwhen\b.*\bwater\b.*\b(back|come|return|start)\b/i,'when will the water come back?'],
    [/\b(water )?tank\b.*\b(empty|low|finished)\b/i,'the water tank is empty.'],
    [/\b(tanker|water tanker)\b/i,'we need a water tanker.'],
    [/\bwhat time\b.*\b(come|coming|arrive|technician|plumber|electrician|repair)\b/i,'what time will the technician come?'],
    [/\bcall me\b.*\bbefore\b.*\b(come|coming|arrive)\b/i,'please call me before you come.'],
    [/\b(plumber|plumbing)\b/i,'i need a plumber today.'],
    [/\b(electrician|electrical repair)\b/i,'i need an electrician today.'],
    [/\b(send|need|can).*\b(someone|technician|repair person|repairman)\b.*\b(today|now|fix|repair)\b|\bfix this today\b/i,'can someone come fix this today?'],
    [/\b(still leaking|still broken|still not fixed|not fixed yet|keeps leaking)\b/i,'it is still not fixed.'],
    [/\b(came|came yesterday|was here yesterday)\b.*\b(still|didn'?t|did not)\b.*\b(fix|fixed|broken|work)\b/i,'someone came yesterday but it is still broken.'],
    [/\bdriver\b.*\b(can'?t|cannot|couldn'?t|could not)\b.*\b(find|locate)\b.*\b(building|house|apartment|place)\b/i,'the driver cannot find my building.'],
    [/\b(driver|cab|auto)\b.*\bwrong gate|wrong entrance\b/i,'the driver is at the wrong gate.'],
    [/\bsend (me )?(your )?(live )?location|share (your )?(live )?location\b/i,'please send me your location.'],
    [/\b(main gate|front gate)\b/i,'please come to the main gate.'],
    [/\b(wait here|wait for me)\b/i,'please wait here for ten minutes.'],
    [/\bdelivery\b.*\b(can'?t|cannot|couldn'?t|could not)\b.*\b(find|locate)\b.*\b(building|house|apartment|place)\b/i,'the delivery person cannot find the building.'],
    [/\bdelivery\b.*\b(outside|at the gate|downstairs)\b/i,'the delivery person says he is outside.'],
    [/\b(package|parcel)\b.*\b(delivered)\b.*\b(missing|don'?t have|do not have|not received|can'?t find)\b/i,'my package says delivered but i do not have it.'],
    [/\b(guest|visitor)\b.*\b(at the gate|outside|security|let .* in|entry)\b/i,'please let my guest in.'],
    [/\b(do you have|have you got|need|looking for)\b.*\b(medicine|medication|tablet|pill)\b|\bpharmacy\b.*\b(out of stock|don'?t have|doesn'?t have)\b/i,'the pharmacy does not have this medicine.'],
    [/\b(another|different) brand\b.*\b(medicine|medication)?\b/i,'do you have another brand of this medicine?'],
    [/\bgeneric\b.*\b(version|medicine|option|available)?\b/i,'do you have a generic version?'],
    [/\bwhen\b.*\b(medicine|medication)\b.*\b(available|back|come|stock)\b/i,'when will this medicine be available?'],
    [/\bdeliver\b.*\b(medicine|medication)\b.*\b(tonight|today|this evening)\b/i,'can you deliver this medicine tonight?'],
    [/\b(less|not too) spicy\b/i,'please make it less spicy.'],
    [/\b(missing item|item missing|something missing|missing from .*order)\b/i,'something is missing from my order.'],
    [/\b(wrong order|not what i ordered|different order)\b/i,'this is not what i ordered.'],
    [/\b(housekeeper|maid)\b.*\b(later|come later|today)\b/i,'please come later today.'],
    [/\b(housekeeper|maid)\b.*\b(tomorrow|come tomorrow)\b/i,'please come tomorrow instead.'],
    [/\bclean\b.*\b(again|properly|one more time)\b/i,'please clean this again.'],
    [/\bwhich counter|what counter|where.*counter\b/i,'which counter do i go to?'],
    [/\bwhat documents|which documents|documents do i need|papers do i need\b/i,'what documents do i need?'],
    [/\b(token|queue number)\b.*\b(where|get|need)\b|\bwhere.*token\b/i,'where do i get a token?'],
    [/\b(speak|talk)\b.*\bslower|slow down\b/i,'please speak a little slower.'],
    [/\b(say|tell me)\b.*\b(again|one more time)|\brepeat that\b/i,'can you say that again?'],
    [/\brepeat\b.*\b(number|phone|amount)|\bnumber again\b/i,'please say the number again.'],
    [/\b(i )?(understand|know|speak)\b.*\b(little|some)\b.*\bhindi\b/i,'i understand a little hindi.']
  ];

  const CHAINS = [
    {id:'power',match:/\b(electricity|power|generator|backup power|power cut)\b/i,queries:['is there a scheduled power cut','backup power not working','can someone come fix this today']},
    {id:'water',match:/\b(water|tank|tanker|pressure|tap|faucet|leak|toilet|sink)\b/i,queries:['when will the water come back','when does water supply come','need a water tanker']},
    {id:'repair',match:/\b(ac|air conditioner|refrigerator|fridge|washing machine|repair|plumber|electrician|fix|broken|not working|cooling|drain)\b/i,queries:['what time will the technician come','call me before you come','how much will repair cost']},
    {id:'driver',context:'Driver',queries:['send me your location','come to the main gate','call me when you reach']},
    {id:'delivery',context:'Delivery',queries:['call me when you arrive','leave package with security','send your location on whatsapp']},
    {id:'security',context:'Security',queries:['please let my guest inside','please send them up','call me when my guest arrives']},
    {id:'household',match:/\b(housekeeper|maid|clean|bedsheet|trash|garbage|key)\b/i,queries:['please come later today','please clean this again','leave key with security']},
    {id:'restaurant',context:'Restaurant',queries:['please make it less spicy','something is missing from my order','please pack this separately']},
    {id:'medicine',match:/\b(medicine|pharmacy|prescription|tablet|pill|generic|dose)\b/i,queries:['another brand of this medicine','generic version','when will this medicine be available']},
    {id:'admin',match:/\b(counter|document|form|photocopy|token|office|sign|appointment)\b/i,queries:['which counter do i go to','what documents do i need','where do i sign']}
  ];

  const FALLBACK = ['please speak a little slower','please say that again','please write it down for me'];
  const norm = s => String(s || '').trim().toLowerCase();

  function resolveRoughSource(english){
    const text=norm(english);
    const match=ROUGH_ROUTES.find(([pattern])=>pattern.test(text));
    return match?.[1]||'';
  }

  function getSuggestionQueries(english,ctx){
    const text=norm(english);
    const contextual=CHAINS.find(c=>c.match?.test(text)) || CHAINS.find(c=>c.context===ctx);
    return [...(contextual?.queries||[]),...FALLBACK].filter((q,i,a)=>a.indexOf(q)===i).slice(0,5);
  }

  function resolveCuratedSuggestions(library,english,limit=5){
    const source=CURATED_CHAINS[norm(english)] ? norm(english) : resolveRoughSource(english);
    const targets=CURATED_CHAINS[source];
    if(!targets?.length)return[];
    const byEnglish=new Map(library.map(item=>[norm(item?.english),item]));
    return targets.map(t=>byEnglish.get(norm(t))).filter(Boolean).slice(0,limit);
  }

  function resolveSuggestions(library,engine,english,ctx,limit=5){
    if(!Array.isArray(library)||!library.length)return[];
    const curated=resolveCuratedSuggestions(library,english,limit);
    if(curated.length)return curated;
    if(!engine?.rank)return[];
    const current=norm(english),seen=new Set(),out=[];
    for(const query of getSuggestionQueries(english,ctx)){
      const ranked=engine.rank(library,query,'All')||[];
      const match=ranked.map(r=>r.item).find(item=>item&&norm(item.english)!==current&&!seen.has(norm(item.english)));
      if(!match)continue;
      seen.add(norm(match.english));out.push(match);
      if(out.length>=Math.min(limit,3))break;
    }
    return out;
  }

  function injectStyles(){
    if(document.getElementById('keepTalkingStyles'))return;
    const s=document.createElement('style');s.id='keepTalkingStyles';s.textContent=`
      .keepTalking{margin:18px 0 6px;border:1px solid rgba(33,31,27,.12);border-radius:18px;background:#fff;padding:14px}
      .keepTalkingTrigger{width:100%;border:0;background:transparent;display:flex;align-items:center;justify-content:space-between;padding:3px 1px;font:inherit;font-weight:750;color:#25221e;text-align:left}
      .keepTalkingTrigger span{font-size:13px;font-weight:600;color:#7a736a;margin-left:8px}
      .keepTalkingList{display:none;margin-top:10px;gap:8px}.keepTalking.open .keepTalkingList{display:grid}
      .keepTalkingChoice{border:1px solid rgba(33,31,27,.11);border-radius:13px;background:#faf8f3;padding:11px 12px;text-align:left;font:inherit;color:#25221e;display:flex;justify-content:space-between;gap:10px;align-items:center}
      .keepTalkingChoice b{font-weight:650}.keepTalkingChoice em{font-style:normal;color:#b66024;font-weight:800}
      .keepTalkingHint{font-size:12px;color:#7a736a;margin:7px 1px 0}
    `;document.head.appendChild(s);
  }

  function enhance(){
    const root=document.querySelector('.resultView');
    if(!root||root.querySelector('.keepTalking'))return;
    let suggestions=[];
    try{suggestions=resolveSuggestions(phraseLibrary,window.BOLNA_LIBRARY_SEARCH,transcript,context,5)}catch{return}
    if(!suggestions.length)return;
    const host=document.createElement('section');host.className='keepTalking';
    host.innerHTML=`<button class="keepTalkingTrigger" type="button"><b>Keep talking →</b><span>What might you need next?</span></button><div class="keepTalkingList">${suggestions.map((x,i)=>`<button class="keepTalkingChoice" type="button" data-keep-talking="${i}"><b>${esc(x.english)}</b><em>→</em></button>`).join('')}</div><p class="keepTalkingHint">Tap the next thing you want to say. Bolna stays in the same conversation.</p>`;
    const anchor=root.querySelector('.variantActions')||root.querySelector('.tabs');
    anchor?.parentNode.insertBefore(host,anchor);
    host.querySelector('.keepTalkingTrigger').onclick=()=>host.classList.toggle('open');
    host.querySelectorAll('[data-keep-talking]').forEach(b=>b.onclick=()=>openLibraryPhrase(suggestions[+b.dataset.keepTalking]));
  }

  window.BOLNA_KEEP_TALKING={CURATED_CHAINS,ROUGH_ROUTES,resolveRoughSource,getSuggestionQueries,resolveCuratedSuggestions,resolveSuggestions};
  if(typeof document==='undefined')return;
  injectStyles();
  const obs=new MutationObserver(()=>queueMicrotask(enhance));
  obs.observe(document.getElementById('app'),{childList:true,subtree:true});
  enhance();
})();