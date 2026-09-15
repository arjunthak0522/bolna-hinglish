(() => {
  const kt=window.BOLNA_KEEP_TALKING;
  if(!kt)return;
  const norm=s=>String(s||'').trim().toLowerCase();
  const g=kt.CONVERSATION_GRAPH;

  const DRIVER_SCHEDULE=['Please come ten minutes early.','Let me know when you are downstairs.','Please wait near the entrance.','Please wait in the car.','I will message you when I am ready.','Wait until I call you.'];
  const DRIVER_ROUTE=['Please follow Google Maps.','Take the next right.','Take a U-turn here.','Stay in the left lane.','Please avoid the rough road.','Please drive carefully.'];
  const DRIVER_ERRANDS=['We have one more stop.','Please stop at the grocery store.','Please stop at the ATM.','Please stop at the petrol pump.','First go to the pharmacy.','After that, go home.'];
  const DRIVER_CAR=['Please turn the AC up a little.','Please turn the AC down a little.','Please close the windows.','Please open the trunk.','Please put this bag in the trunk.','Please bring the umbrella.'];
  const HOUSE_ATTENDANCE=['What time are you coming today?','Please come by nine.','Please tell me if you are running late.','Please tell me in advance if you cannot come.','How many days will you be off?','You can take tomorrow off.'];
  const HOUSE_CLEAN=['Please clean the kitchen first.','Please sweep and mop the floor.','Please clean the bathroom properly.','Please clean under the sofa.','Please dust the shelves.','Please take the trash out.'];
  const HOUSE_LAUNDRY=['Please change the bedsheets.','Please wash the towels separately.','Please hang these clothes to dry.','Please iron only the shirts.','These clothes are still wet.','Please lock the door when you leave.'];
  const COOK_PLAN=['What are you cooking today?','Please make dal, rice, and one vegetable.','Please make four rotis.','Please use less oil.','Please use less salt.','Please make it less spicy.'];
  const COOK_STORE=['Please make enough for dinner too.','Please save the leftovers.','Please put the food in the fridge.','Please do not throw away the leftovers.','Please turn off the gas when you finish.','Please use filtered water for cooking.'];
  const GROCERIES=['What groceries are running low?','Please make a grocery list.','Please tell me before something runs out.','Please wash the vegetables first.','Please use filtered water for cooking.','Please call me if there is any problem.'];

  Object.assign(g,{
    'please come ten minutes early.':{scenario:'driver-pickup',partner:'driver',phase:'schedule',owner:'them',next:DRIVER_SCHEDULE},
    'please wait in the car.':{scenario:'driver-pickup',partner:'driver',phase:'wait',owner:'them',next:['I will message you when I am ready.','Please do not leave yet.','Wait until I call you.','Please bring the car around.','Pick me up from the same place.','Drop me at the other gate.']},
    'i will message you when i am ready.':{scenario:'driver-pickup',partner:'driver',phase:'standby',owner:'them',next:['Wait until I call you.','Please wait in the car.','Please bring the car around.','Pick me up from the same place.','Please do not leave yet.','Let me know when you are downstairs.']},
    'wait until i call you.':{scenario:'driver-pickup',partner:'driver',phase:'standby',owner:'them',next:['Please wait in the car.','Please do not leave yet.','I will message you when I am ready.','Please bring the car around.','Pick me up from the same place.']},
    'please follow google maps.':{scenario:'driver-route',partner:'driver',phase:'navigate',owner:'them',next:DRIVER_ROUTE},
    'please drive carefully.':{scenario:'driver-route',partner:'driver',phase:'safety',owner:'them',next:['Please avoid the rough road.','Please do not overtake so much.','Please follow Google Maps.','Stay in the left lane.','Take the next right.','Take a U-turn here.']},
    'please stop at the grocery store.':{scenario:'driver-errands',partner:'driver',phase:'stop',owner:'them',next:['We have one more stop.','Please stop at the ATM.','Please stop at the petrol pump.','After that, go home.','First go to the pharmacy.','Wait until I call you.']},
    'please stop at the atm.':{scenario:'driver-errands',partner:'driver',phase:'stop',owner:'them',next:['We have one more stop.','Please stop at the grocery store.','Please stop at the petrol pump.','After that, go home.','Wait until I call you.']},
    'please check the tyre pressure.':{scenario:'driver-fuel',partner:'driver',phase:'service',owner:'them',next:['Please fill the tank.','I transferred your payment.','Please drive carefully.','Please stop at the petrol pump.','After that, go home.']},
    'please open the trunk.':{scenario:'driver-car',partner:'driver',phase:'luggage',owner:'them',next:['Please put this bag in the trunk.','Please bring the umbrella.','Please wait near the entrance.','Please wait in the car.','Please do not leave yet.']},

    'please come by nine.':{scenario:'househelp-attendance',partner:'househelp',phase:'schedule',owner:'them',next:HOUSE_ATTENDANCE},
    'please tell me in advance if you cannot come.':{scenario:'househelp-attendance',partner:'househelp',phase:'expectation',owner:'them',next:['How many days will you be off?','What time are you coming today?','Please tell me if you are running late.','You can take tomorrow off.','Please call me if there is any problem.']},
    'how many days will you be off?':{scenario:'househelp-attendance',partner:'househelp',phase:'leave',owner:'them',next:['Please tell me in advance if you cannot come.','What time are you coming today?','You can take tomorrow off.','Please call me if there is any problem.']},
    'please clean the bathroom properly.':{scenario:'househelp-cleaning',partner:'househelp',phase:'cleaning',owner:'them',next:HOUSE_CLEAN},
    'please clean under the sofa.':{scenario:'househelp-cleaning',partner:'househelp',phase:'detail',owner:'them',next:['Please clean under the bed.','Please dust the shelves.','Please sweep and mop the floor.','Please clean the bathroom properly.','Please take the trash out.','Please use less water when mopping.']},
    'please change the bedsheets.':{scenario:'househelp-laundry',partner:'househelp',phase:'laundry',owner:'them',next:HOUSE_LAUNDRY},
    'please wash the towels separately.':{scenario:'househelp-laundry',partner:'househelp',phase:'laundry',owner:'them',next:HOUSE_LAUNDRY},
    'please hang these clothes to dry.':{scenario:'househelp-laundry',partner:'househelp',phase:'dry',owner:'them',next:['These clothes are still wet.','Please iron only the shirts.','Please wash the towels separately.','Please change the bedsheets.','Please lock the door when you leave.']},

    'please make four rotis.':{scenario:'cook-meal',partner:'cook',phase:'quantity',owner:'them',next:COOK_PLAN},
    'please use less salt.':{scenario:'cook-meal',partner:'cook',phase:'customize',owner:'them',next:['Please make it less spicy.','Please use less oil.','Please do not add ghee.','Please do not fry this.','Please make enough for dinner too.','Please turn off the gas when you finish.']},
    'please make it less spicy.':{scenario:'cook-meal',partner:'cook',phase:'customize',owner:'them',next:['Please use less oil.','Please use less salt.','Please do not add ghee.','Please do not fry this.','Please make enough for dinner too.','Please use filtered water for cooking.']},
    'please save the leftovers.':{scenario:'cook-leftovers',partner:'cook',phase:'store',owner:'them',next:COOK_STORE},
    'please put the food in the fridge.':{scenario:'cook-leftovers',partner:'cook',phase:'store',owner:'them',next:COOK_STORE},
    'please turn off the gas when you finish.':{scenario:'cook-safety',partner:'cook',phase:'finish',owner:'them',next:['Please put the food in the fridge.','Please save the leftovers.','Please lock the door when you leave.','Please call me if there is any problem.','Please tell me before something runs out.']},
    'please tell me before something runs out.':{scenario:'household-groceries',partner:'househelp',phase:'inventory',owner:'them',next:GROCERIES}
  });

  const choosePool=(english,context,state)=>{
    const t=norm(`${english} ${state?.scenario||''} ${state?.partner||''}`);
    const c=norm(context);
    if(c==='driver'||/driver|chauffeur|pickup|drop|car|petrol|fuel|route|road|gate|maps|traffic|atm|pharmacy/.test(t)){
      if(/petrol|fuel|tyre|tank/.test(t))return [...DRIVER_ERRANDS,...DRIVER_CAR];
      if(/road|route|maps|turn|lane|drive|overtake/.test(t))return [...DRIVER_ROUTE,...DRIVER_SCHEDULE];
      if(/stop|errand|grocery|atm|pharmacy/.test(t))return [...DRIVER_ERRANDS,...DRIVER_SCHEDULE];
      if(/trunk|bag|umbrella|ac|window/.test(t))return [...DRIVER_CAR,...DRIVER_SCHEDULE];
      return [...DRIVER_SCHEDULE,...DRIVER_ERRANDS];
    }
    if(c==='household'||/househelp|housekeeper|maid|bai|didi|cook|clean|kitchen|laundry|grocery|roti|dal|food|oil|salt|spicy/.test(t)){
      if(/cook|meal|roti|dal|food|oil|salt|spicy|ghee|fry/.test(t))return [...COOK_PLAN,...COOK_STORE];
      if(/grocery|suppl|running low|runs out/.test(t))return [...GROCERIES,...COOK_PLAN];
      if(/laundry|bedsheet|towel|clothes|iron|wet/.test(t))return [...HOUSE_LAUNDRY,...HOUSE_CLEAN];
      if(/clean|mop|sweep|bathroom|kitchen|sofa|bed|dust|trash/.test(t))return [...HOUSE_CLEAN,...HOUSE_LAUNDRY];
      return [...HOUSE_ATTENDANCE,...HOUSE_CLEAN,...COOK_PLAN];
    }
    return [];
  };

  function enhancedSuggestions(library,english,context,limit=6){
    if(!Array.isArray(library)||!library.length)return[];
    const state=kt.getConversationState(english);
    const byEnglish=new Map(library.map(item=>[norm(item?.english),item]));
    const seen=new Set([norm(english)]),out=[];
    const add=phrase=>{
      const k=norm(phrase);if(!k||seen.has(k))return;
      const item=byEnglish.get(k);if(!item)return;
      seen.add(k);out.push(item);
    };
    (state.next||[]).forEach(add);
    choosePool(english,context,state).forEach(add);
    return out.slice(0,limit);
  }

  kt.enhancedSuggestions=enhancedSuggestions;
  kt.chooseDepthPool=choosePool;
  if(typeof document==='undefined')return;

  function upgradeCard(){
    const root=document.querySelector('.resultView');
    const card=root?.querySelector('.keepTalking');
    if(!card||card.dataset.depthUpgraded==='1')return;
    let suggestions=[];
    try{suggestions=enhancedSuggestions(window.phraseLibrary||phraseLibrary,window.transcript||transcript,window.context||context,6)}catch{return}
    if(!suggestions.length)return;
    const list=card.querySelector('.keepTalkingList');
    if(!list)return;
    list.innerHTML=suggestions.map((x,i)=>`<button class="keepTalkingChoice" type="button" data-keep-talking-depth="${i}"><b>${typeof esc==='function'?esc(x.english):x.english}</b><em>→</em></button>`).join('');
    card.querySelectorAll('[data-keep-talking-depth]').forEach(b=>b.onclick=()=>openLibraryPhrase(suggestions[+b.dataset.keepTalkingDepth]));
    const hint=card.querySelector('.keepTalkingHint');
    if(hint)hint.textContent='Choose what you need next. Bolna keeps the same conversation and shows the next useful step.';
    card.dataset.depthUpgraded='1';
  }

  const obs=new MutationObserver(()=>queueMicrotask(upgradeCard));
  obs.observe(document.getElementById('app'),{childList:true,subtree:true});
  upgradeCard();
})();
