(() => {
  const norm=s=>String(s||'').trim().toLowerCase();

  const CONVERSATION_GRAPH={
    'the power keeps going out.':{scenario:'power',partner:'building-maintenance',phase:'diagnose',owner:'them',next:['Is there a scheduled power cut?','The backup power is not working.','The generator has not started.']},
    'is there a scheduled power cut?':{scenario:'power',partner:'building-maintenance',phase:'diagnose',owner:'them',next:['The backup power is not working.','The generator has not started.']},
    'the backup power is not working.':{scenario:'power',partner:'building-maintenance',phase:'escalate',owner:'them',next:['The generator has not started.','I need an electrician today.','Can someone come fix this today?']},
    'the generator has not started.':{scenario:'power',partner:'building-maintenance',phase:'arrange-service',owner:'them',next:['I need an electrician today.','Can someone come fix this today?','What time will the technician come?']},

    'the water has stopped.':{scenario:'water',partner:'building-maintenance',phase:'diagnose',owner:'them',next:['When will the water come back?','When does the water supply come?','The water tank is empty.']},
    'when will the water come back?':{scenario:'water',partner:'building-maintenance',phase:'diagnose',owner:'them',next:['When does the water supply come?','The water tank is empty.','We need a water tanker.']},
    'the water tank is empty.':{scenario:'water',partner:'building-maintenance',phase:'contingency',owner:'them',next:['We need a water tanker.','When does the water supply come?','When will the water come back?']},
    'we need a water tanker.':{scenario:'water-tanker',partner:'building-maintenance',phase:'arrange-delivery',owner:'them',next:['How long will the water tanker take?','How much will the water tanker cost?','Please call me before you come.']},
    'how long will the water tanker take?':{scenario:'water-tanker',partner:'building-maintenance',phase:'arrange-delivery',owner:'them',next:['How much will the water tanker cost?','Please call me before you come.']},
    'how much will the water tanker cost?':{scenario:'water-tanker',partner:'building-maintenance',phase:'arrange-delivery',owner:'them',next:['How long will the water tanker take?','Please call me before you come.']},

    'there is a leak under the sink.':{scenario:'plumbing',partner:'repair-tech',phase:'report-problem',owner:'them',next:['I need a plumber today.','Can someone come fix this today?','How much will the repair cost?']},
    'i need a plumber today.':{scenario:'plumbing',partner:'repair-tech',phase:'arrange-service',owner:'them',next:['What time will the technician come?','Please call me before you come.','How much will the repair cost?']},
    'i need an electrician today.':{scenario:'electrical-repair',partner:'repair-tech',phase:'arrange-service',owner:'them',next:['What time will the technician come?','Please call me before you come.','How much will the repair cost?']},
    'can someone come fix this today?':{scenario:'repair',partner:'repair-tech',phase:'arrange-service',owner:'them',next:['What time will the technician come?','Please call me before you come.','How much will the repair cost?']},
    'what time will the technician come?':{scenario:'repair',partner:'repair-tech',phase:'schedule',owner:'them',next:['Please call me before you come.','Please come after 5 PM.','How much will the repair cost?']},
    'please call me before you come.':{scenario:'repair',partner:'repair-tech',phase:'schedule',owner:'them',next:['Please come after 5 PM.','What time will the technician come?','How much will the repair cost?']},
    'please check the leak again.':{scenario:'plumbing',partner:'repair-tech',phase:'recheck',owner:'them',next:['It is still not fixed.','Please send someone else.','Can someone come fix this today?']},
    'it is still not fixed.':{scenario:'repair',partner:'repair-tech',phase:'escalate',owner:'them',next:['Please send someone else.','Can someone come fix this today?','How much will the repair cost?']},
    'someone came yesterday but it is still broken.':{scenario:'repair',partner:'repair-tech',phase:'escalate',owner:'them',next:['Please send someone else.','Can someone come fix this today?','Please call me before you come.']},

    'the driver cannot find my building.':{scenario:'driver-location',partner:'driver',phase:'locate',owner:'me',next:["I'll send you my location.",'Please come to the main gate.','Please call me when you reach.']},
    "i'll send you my location.":{scenario:'driver-location',partner:'driver',phase:'locate',owner:'me',next:['Please come to the main gate.','Please call me when you reach.','Which gate are you at?']},
    'the driver is at the wrong gate.':{scenario:'driver-location',partner:'driver',phase:'redirect',owner:'me',next:['Use the other entrance.','Please come to the main gate.','Which gate are you at?']},
    'which gate are you at?':{scenario:'driver-location',partner:'driver',phase:'clarify-location',owner:'them',next:['Use the other entrance.','Please come to the main gate.','Please call me when you reach.']},
    'please send me your location.':{scenario:'driver-location',partner:'driver',phase:'locate',owner:'them',next:['I cannot find your location.','Please come to the main gate.','Please call me when you reach.']},
    'please come to the main gate.':{scenario:'driver-location',partner:'driver',phase:'approach',owner:'them',next:['Please call me when you reach.','I am outside the building.']},
    'please wait here for ten minutes.':{scenario:'driver-wait',partner:'driver',phase:'wait',owner:'them',next:['I will be ten minutes late.','You do not need to wait.']},

    'the delivery person cannot find the building.':{scenario:'delivery-location',partner:'delivery-person',phase:'locate',owner:'me',next:["I'll send you my location.",'Please come to the main gate.','Please call me when you arrive.']},
    'the delivery person says he is outside.':{scenario:'delivery-arrival',partner:'delivery-person',phase:'arrival',owner:'me',next:['I will come downstairs in two minutes.','Please leave the package with security.','Which gate are you at?']},
    'my package says delivered but i do not have it.':{scenario:'missing-package',partner:'delivery-support',phase:'investigate',owner:'them',next:['Can you check where the package was left?','Can you check with security?','Please ask the delivery person to call me.']},
    'can you check where the package was left?':{scenario:'missing-package',partner:'delivery-support',phase:'investigate',owner:'them',next:['Can you check with security?','Please ask the delivery person to call me.']},
    'can you check with security?':{scenario:'missing-package',partner:'delivery-support',phase:'investigate',owner:'them',next:['Can you check where the package was left?','Please ask the delivery person to call me.']},
    'please ask the delivery person to call me.':{scenario:'missing-package',partner:'delivery-support',phase:'contact-driver',owner:'them',next:['Can you check where the package was left?','Can you check with security?']},

    'my guest is coming in ten minutes.':{scenario:'guest-entry',partner:'security',phase:'preauthorize',owner:'them',next:['Please let my guest in.','Please call me when my guest arrives.','Please send them up.']},
    'please let my guest in.':{scenario:'guest-entry',partner:'security',phase:'arrival',owner:'them',next:['Please call me when my guest arrives.','Please send them up.']},

    'the pharmacy does not have this medicine.':{scenario:'pharmacy-stock',partner:'pharmacist',phase:'find-alternative',owner:'them',next:['Do you have another brand of this medicine?','Do you have a generic version?','Can you call another pharmacy?']},
    'do you have another brand of this medicine?':{scenario:'pharmacy-stock',partner:'pharmacist',phase:'find-alternative',owner:'them',next:['Do you have a generic version?','When will this medicine be available?','Can you call another pharmacy?']},
    'do you have a generic version?':{scenario:'pharmacy-stock',partner:'pharmacist',phase:'find-alternative',owner:'them',next:['When will this medicine be available?','Can you call another pharmacy?','Please call me if you find this medicine.']},
    'when will this medicine be available?':{scenario:'pharmacy-stock',partner:'pharmacist',phase:'availability',owner:'them',next:['Please call me if you find this medicine.','Can you call another pharmacy?','Can you deliver this medicine tonight?']},
    'can you deliver this medicine tonight?':{scenario:'pharmacy-delivery',partner:'pharmacist',phase:'delivery',owner:'them',next:['Can you deliver the medicine to my apartment?','Please call me if you find this medicine.']},

    'please make it less spicy.':{scenario:'restaurant-order',partner:'restaurant-staff',phase:'customize',owner:'them',next:['Please use less oil.','Please pack this separately.','Can you make this fresh?']},
    'something is missing from my order.':{scenario:'restaurant-complaint',partner:'restaurant-staff',phase:'complaint',owner:'them',next:['Can you send the missing item now?','Please check the order again.']},
    'can you send the missing item now?':{scenario:'restaurant-complaint',partner:'restaurant-staff',phase:'resolve-missing',owner:'them',next:['Please check the order again.']},
    'this is not what i ordered.':{scenario:'restaurant-complaint',partner:'restaurant-staff',phase:'complaint',owner:'them',next:['Please replace this.','Please check the order again.']},
    'please replace this.':{scenario:'restaurant-complaint',partner:'restaurant-staff',phase:'replace',owner:'them',next:['Please check the order again.','Can you make this fresh?']},
    'please check the order again.':{scenario:'restaurant-complaint',partner:'restaurant-staff',phase:'verify',owner:'them',next:['Can you send the missing item now?','Please replace this.']},

    'please come later today.':{scenario:'housekeeper-schedule',partner:'housekeeper',phase:'reschedule',owner:'them',next:['Please come after 5 PM.','Please call me before you come.','Please leave the key with security.']},
    'please come tomorrow instead.':{scenario:'housekeeper-schedule',partner:'housekeeper',phase:'reschedule',owner:'them',next:['Please call me before you come.','Please leave the key with security.']},
    'please clean this again.':{scenario:'housekeeper-task',partner:'housekeeper',phase:'task',owner:'them',next:['Please do not use this cleaner.','Please change the bedsheets.','Please take the trash out.']},

    'which counter do i go to?':{scenario:'admin-process',partner:'clerk',phase:'navigate',owner:'them',next:['Where do I get a token?','What documents do I need?','Where do I sign?']},
    'what documents do i need?':{scenario:'admin-process',partner:'clerk',phase:'requirements',owner:'them',next:['Where can I get this photocopied?','Where do I sign?','How long will this take?']},
    'where do i get a token?':{scenario:'admin-process',partner:'clerk',phase:'queue',owner:'me',next:['Which counter do I go to?','How long will this take?','Where do I sign?']},

    'please speak a little slower.':{scenario:'communication-repair',partner:'any',phase:'clarify',owner:'them',next:['Can you say that again?','Please say the number again.','Please write it down for me.']},
    'can you say that again?':{scenario:'communication-repair',partner:'any',phase:'clarify',owner:'them',next:['Please speak a little slower.','Please say the number again.','Please write it down for me.']},
    'please say the number again.':{scenario:'communication-repair',partner:'any',phase:'clarify-number',owner:'them',next:['Please write it down for me.','Please send it to me on WhatsApp.','Please explain it simply.']},
    'i understand a little hindi.':{scenario:'communication-repair',partner:'any',phase:'clarify',owner:'them',next:['Please speak a little slower.','Can you say that again?','Please explain it simply.']}
  };

  const ROUGH_ROUTES=[
    [/\b(electricity|power)\b.*\b(out|off|gone|cut|keeps? going|keeps? cutting)\b|\b(no|without)\s+(electricity|power)\b/i,'the power keeps going out.'],
    [/\bbackup power\b.*\b(not working|not starting|failed|off)\b/i,'the backup power is not working.'],
    [/\bgenerator\b.*\b(not started|not starting|not working|failed)\b/i,'the generator has not started.'],
    [/\bwater\b.*\b(stopped|not coming|isn'?t coming|gone|off|no water)\b|\bno water\b/i,'the water has stopped.'],
    [/\bwhen\b.*\bwater\b.*\b(back|come|return|start)\b/i,'when will the water come back?'],
    [/\b(water )?tank\b.*\b(empty|low|finished)\b/i,'the water tank is empty.'],
    [/\bhow long\b.*\b(tanker|water tanker)\b/i,'how long will the water tanker take?'],
    [/\bhow much\b.*\b(tanker|water tanker)\b/i,'how much will the water tanker cost?'],
    [/\b(tanker|water tanker)\b/i,'we need a water tanker.'],
    [/\bwhat time\b.*\b(come|coming|arrive|technician|plumber|electrician|repair)\b/i,'what time will the technician come?'],
    [/\bcall me\b.*\bbefore\b.*\b(come|coming|arrive)\b/i,'please call me before you come.'],
    [/\b(plumber|plumbing)\b/i,'i need a plumber today.'],
    [/\b(electrician|electrical repair)\b/i,'i need an electrician today.'],
    [/\b(send|need|can).*\b(someone|technician|repair person|repairman)\b.*\b(today|now|fix|repair)\b|\bfix this today\b/i,'can someone come fix this today?'],
    [/\b(still leaking|still broken|still not fixed|not fixed yet|keeps leaking)\b/i,'it is still not fixed.'],
    [/\b(came|came yesterday|was here yesterday)\b.*\b(still|didn'?t|did not)\b.*\b(fix|fixed|broken|work)\b/i,'someone came yesterday but it is still broken.'],
    [/\bdriver\b.*\b(can'?t|cannot|couldn'?t|could not)\b.*\b(find|locate)\b.*\b(building|house|apartment|place)\b/i,'the driver cannot find my building.'],
    [/\b(i('| a)?ll|i will)\b.*\bsend\b.*\b(my )?(live )?location\b|\bsend you my location\b/i,"i'll send you my location."],
    [/\b(driver|cab|auto)\b.*\bwrong gate|wrong entrance\b/i,'the driver is at the wrong gate.'],
    [/\bwhich gate\b|\bwhat gate\b/i,'which gate are you at?'],
    [/\bsend (me )?(your )?(live )?location|share (your )?(live )?location\b/i,'please send me your location.'],
    [/\b(main gate|front gate)\b/i,'please come to the main gate.'],
    [/\b(wait here|wait for me)\b/i,'please wait here for ten minutes.'],
    [/\bdelivery\b.*\b(can'?t|cannot|couldn'?t|could not)\b.*\b(find|locate)\b.*\b(building|house|apartment|place)\b/i,'the delivery person cannot find the building.'],
    [/\bdelivery\b.*\b(outside|at the gate|downstairs)\b/i,'the delivery person says he is outside.'],
    [/\b(package|parcel)\b.*\b(delivered)\b.*\b(missing|don'?t have|do not have|not received|can'?t find)\b/i,'my package says delivered but i do not have it.'],
    [/\b(check|find out)\b.*\bwhere\b.*\b(package|parcel)\b.*\b(left|kept|delivered)\b/i,'can you check where the package was left?'],
    [/\bcheck\b.*\bsecurity\b/i,'can you check with security?'],
    [/\b(delivery person|delivery guy|driver)\b.*\bcall me\b/i,'please ask the delivery person to call me.'],
    [/\b(guest|visitor)\b.*\b(at the gate|outside|security|let .* in|entry)\b/i,'please let my guest in.'],
    [/\b(do you have|have you got|need|looking for)\b.*\b(medicine|medication|tablet|pill)\b|\bpharmacy\b.*\b(out of stock|don'?t have|doesn'?t have)\b/i,'the pharmacy does not have this medicine.'],
    [/\b(another|different) brand\b.*\b(medicine|medication)?\b/i,'do you have another brand of this medicine?'],
    [/\bgeneric\b.*\b(version|medicine|option|available)?\b/i,'do you have a generic version?'],
    [/\bwhen\b.*\b(medicine|medication)\b.*\b(available|back|come|stock)\b/i,'when will this medicine be available?'],
    [/\bdeliver\b.*\b(medicine|medication)\b.*\b(tonight|today|this evening)\b/i,'can you deliver this medicine tonight?'],
    [/\b(less|not too) spicy\b/i,'please make it less spicy.'],
    [/\b(send|bring)\b.*\bmissing item\b/i,'can you send the missing item now?'],
    [/\bcheck\b.*\border\b.*\b(again|one more time)\b/i,'please check the order again.'],
    [/\b(replace|exchange)\b.*\b(this|it|item|order)\b/i,'please replace this.'],
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

  const FALLBACK=['please speak a little slower','please say that again','please write it down for me'];

  function resolveRoughSource(english){
    const text=norm(english);
    return ROUGH_ROUTES.find(([p])=>p.test(text))?.[1]||'';
  }

  function getConversationState(english){
    const key=CONVERSATION_GRAPH[norm(english)]?norm(english):resolveRoughSource(english);
    return {key,...(CONVERSATION_GRAPH[key]||{})};
  }

  function resolveGraphSuggestions(library,english,limit=3){
    const state=getConversationState(english);
    if(!state.next?.length)return[];
    const byEnglish=new Map(library.map(item=>[norm(item?.english),item]));
    const blocked=new Set((state.block||[]).map(norm));
    const out=[];
    for(const phrase of state.next){
      const k=norm(phrase);
      if(k===norm(english)||blocked.has(k))continue;
      const item=byEnglish.get(k);
      if(item)out.push(item);
      if(out.length>=Math.min(limit,3))break;
    }
    return out;
  }

  function getSuggestionQueries(english,ctx){
    const state=getConversationState(english);
    if(state.next?.length)return state.next;
    return FALLBACK;
  }

  function resolveSuggestions(library,engine,english,ctx,limit=3){
    if(!Array.isArray(library)||!library.length)return[];
    const graph=resolveGraphSuggestions(library,english,limit);
    if(graph.length)return graph;
    if(!engine?.rank)return[];
    const current=norm(english),seen=new Set(),out=[];
    for(const query of FALLBACK){
      const ranked=engine.rank(library,query,'All')||[];
      const item=ranked.map(r=>r.item).find(x=>x&&norm(x.english)!==current&&!seen.has(norm(x.english)));
      if(!item)continue;
      seen.add(norm(item.english));out.push(item);
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
    try{suggestions=resolveSuggestions(phraseLibrary,window.BOLNA_LIBRARY_SEARCH,transcript,context,3)}catch{return}
    if(!suggestions.length)return;
    const host=document.createElement('section');host.className='keepTalking';
    host.innerHTML=`<button class="keepTalkingTrigger" type="button"><b>Keep talking →</b><span>What might you need next?</span></button><div class="keepTalkingList">${suggestions.map((x,i)=>`<button class="keepTalkingChoice" type="button" data-keep-talking="${i}"><b>${esc(x.english)}</b><em>→</em></button>`).join('')}</div><p class="keepTalkingHint">Tap the next thing you want to say. Bolna stays in the same conversation.</p>`;
    const anchor=root.querySelector('.variantActions')||root.querySelector('.tabs');
    anchor?.parentNode.insertBefore(host,anchor);
    host.querySelector('.keepTalkingTrigger').onclick=()=>host.classList.toggle('open');
    host.querySelectorAll('[data-keep-talking]').forEach(b=>b.onclick=()=>openLibraryPhrase(suggestions[+b.dataset.keepTalking]));
  }

  window.BOLNA_KEEP_TALKING={CONVERSATION_GRAPH,ROUGH_ROUTES,resolveRoughSource,getConversationState,resolveGraphSuggestions,getSuggestionQueries,resolveSuggestions};
  if(typeof document==='undefined')return;
  injectStyles();
  const obs=new MutationObserver(()=>queueMicrotask(enhance));
  obs.observe(document.getElementById('app'),{childList:true,subtree:true});
  enhance();
})();
