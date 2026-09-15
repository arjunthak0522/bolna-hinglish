(() => {
  const kt=window.BOLNA_KEEP_TALKING;
  if(!kt)return;
  const norm=s=>String(s||'').trim().toLowerCase();

  const POOLS={
    driverSchedule:['What time will you come?','Please come at eight.','Please come ten minutes early.','I need to leave at seven thirty.','Let me know when you are downstairs.','Please wait near the entrance.','I will message you when I am ready.','Please do not leave yet.'],
    driverRoute:['We have one more stop.','First go to the pharmacy.','Please stop at the grocery store.','Please stop at the ATM.','After that, go home.','Please follow Google Maps.','Take the next right.','Take a U-turn here.'],
    driverCar:['Please stop at the petrol pump.','Please fill the tank.','Please check the tyre pressure.','Please turn the AC up a little.','Please turn the AC down a little.','Please open the trunk.','Please drive carefully.','Please avoid the rough road.'],
    househelpAttendance:['Are you coming today?','What time are you coming today?','Please come by nine.','Please tell me if you are running late.','Please tell me in advance if you cannot come.','You can take tomorrow off.','How many days will you be off?'],
    househelpCleaning:['Please clean the kitchen first.','Please sweep and mop the floor.','Please clean the bathroom properly.','Please clean under the sofa.','Please clean under the bed.','Please dust the shelves.','Please change the bedsheets.','Please take the trash out.'],
    househelpLaundry:['Please wash the towels separately.','Please hang these clothes to dry.','These clothes are still wet.','Please iron only the shirts.','Please change the bedsheets.'],
    cookMeal:['What are you cooking today?','Please make dal, rice, and one vegetable.','Please use less oil.','Please use less salt.','Please make it less spicy.','Please do not add ghee.','Please make enough for dinner too.','Please save the leftovers.','Please put the food in the fridge.'],
    groceries:['What groceries are running low?','Please make a grocery list.','Please tell me before something runs out.']
  };

  function poolFor(state,english){
    const text=norm(english),scenario=state.scenario||'',partner=state.partner||'';
    if(partner==='driver'||scenario.startsWith('driver')){
      if(/petrol|fuel|tank|tyre|car|ac|trunk|road|drive|overtake/.test(text)||/fuel|car/.test(scenario))return POOLS.driverCar;
      if(/stop|pharmacy|grocery|atm|route|maps|right|turn|home/.test(text)||/errand|route/.test(scenario))return POOLS.driverRoute;
      return POOLS.driverSchedule;
    }
    if(partner==='cook'||/cook|meal|leftover/.test(scenario)||/cook|oil|salt|spicy|ghee|dinner|food/.test(text))return POOLS.cookMeal;
    if(partner==='househelp'||partner==='housekeeper'||/househelp|housekeeper/.test(scenario)){
      if(/laundry|clothes|towel|iron|bedsheet|wet/.test(text))return POOLS.househelpLaundry;
      if(/clean|sweep|mop|kitchen|bathroom|sofa|bed|dust|trash/.test(text))return POOLS.househelpCleaning;
      return POOLS.househelpAttendance;
    }
    if(/grocery|groceries|running low|runs out/.test(text)||/grocer/.test(scenario))return POOLS.groceries;
    return [];
  }

  function collect(library,english,limit=6){
    if(!Array.isArray(library)||!library.length)return[];
    const byEnglish=new Map(library.map(item=>[norm(item?.english),item]));
    const state=kt.getConversationState(english);
    const current=norm(english),seen=new Set([current]),phrases=[];
    const push=phrase=>{const k=norm(phrase);if(!k||seen.has(k))return;seen.add(k);if(byEnglish.has(k))phrases.push(k)};

    for(const phrase of state.next||[])push(phrase);
    for(const phrase of state.next||[]){
      const child=kt.CONVERSATION_GRAPH[norm(phrase)];
      for(const next of child?.next||[])push(next);
      if(phrases.length>=limit)break;
    }
    for(const phrase of poolFor(state,english)){
      push(phrase);
      if(phrases.length>=limit)break;
    }
    return phrases.slice(0,limit).map(k=>byEnglish.get(k));
  }

  window.BOLNA_KEEP_TALKING_DEPTH={collect,poolFor};
  if(typeof document==='undefined')return;

  function upgrade(){
    const root=document.querySelector('.resultView');
    const host=root?.querySelector('.keepTalking');
    if(!root||!host||host.dataset.depthUpgraded==='1')return;
    let suggestions=[];
    try{suggestions=collect(phraseLibrary,transcript,6)}catch{return}
    if(suggestions.length<4)return;
    host.dataset.depthUpgraded='1';
    const list=host.querySelector('.keepTalkingList');
    if(!list)return;
    list.innerHTML=suggestions.map((x,i)=>`<button class="keepTalkingChoice" type="button" data-keep-talking-depth="${i}"><b>${String(x.english||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</b><em>→</em></button>`).join('');
    host.querySelector('.keepTalkingTrigger span').textContent='Likely next things you may need';
    host.querySelector('.keepTalkingHint').textContent='Choose the next thing you want to say. Bolna keeps the conversation context.';
    host.querySelectorAll('[data-keep-talking-depth]').forEach(b=>b.onclick=()=>openLibraryPhrase(suggestions[+b.dataset.keepTalkingDepth]));
  }

  const obs=new MutationObserver(()=>queueMicrotask(upgrade));
  obs.observe(document.getElementById('app'),{childList:true,subtree:true});
  queueMicrotask(upgrade);
})();