(() => {
  const kt=window.BOLNA_KEEP_TALKING;
  if(!kt)return;
  const norm=s=>String(s||'').trim().toLowerCase();
  const memory={partner:'',flow:'',time:'',history:[]};

  const FLOWS={
    driverPickup:['Please come ten minutes early.','Let me know when you are downstairs.','Please wait near the entrance.','I will message you when I am ready.','We have one more stop.','You do not need to wait after dropping me.'],
    driverArrival:['Please wait near the entrance.','Please wait in the car.','Please bring the car around.','I will message you when I am ready.','Please do not leave yet.','We have one more stop.'],
    driverErrands:['First go to the pharmacy.','Please stop at the grocery store.','Please stop at the ATM.','Please stop at the petrol pump.','After that, go home.','Wait until I call you.'],
    driverFuel:['Please fill the tank.','Please check the tyre pressure.','I transferred your payment.','Please wait in the car.','After that, go home.','Please drive carefully.'],
    driverRoute:['Please follow Google Maps.','Take the next right.','Take a U-turn here.','Stay in the left lane.','Please avoid the rough road.','Please drive carefully.'],
    driverWait:['Please wait in the car.','Please do not leave yet.','I will be fifteen minutes.','Wait until I call you.','I will message you when I am ready.','You do not need to wait after dropping me.'],
    househelpAttendance:['What time are you coming today?','Please tell me if you are running late.','Please tell me in advance if you cannot come.','Please come by nine.','You can take tomorrow off.','How many days will you be off?'],
    househelpCleaning:['Please clean the bathroom properly.','Please sweep and mop the floor.','Please clean under the sofa.','Please clean under the bed.','Please dust the shelves.','Please take the trash out.'],
    househelpKitchen:['Please finish the kitchen before you leave.','Please clean the bathroom properly.','Please take the trash out.','Please sweep and mop the floor.','Please change the bedsheets.','Please tell me before you leave.'],
    househelpLaundry:['Please wash the towels separately.','Please hang these clothes to dry.','Please iron only the shirts.','Please change the bedsheets.','These clothes are still wet.'],
    cookPlan:['Please use less oil.','Please use less salt.','Please make it less spicy.','Please do not add ghee.','Please make enough for dinner too.','Please save the leftovers.'],
    cookCustomize:['Please use less salt.','Please do not add ghee.','Please make enough for dinner too.','Please save the leftovers.','Please put the food in the fridge.','What groceries are running low?'],
    cookLeftovers:['Please save the leftovers.','Please put the food in the fridge.','Please do not throw away the leftovers.','What groceries are running low?','Please make a grocery list.'],
    groceries:['Please make a grocery list.','Please tell me before something runs out.','What groceries are running low?']
  };

  function extractTime(text){
    const t=norm(text);
    const m=t.match(/\b(?:at|by|around|pickup at|pick me up at)\s+((?:\d{1,2})(?::\d{2})?\s*(?:am|pm)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?:\s+thirty)?\b/);
    return m?.[1]||'';
  }

  function detectFlow(english,state={}){
    const t=norm(english),scenario=state.scenario||'',partner=state.partner||'';
    if(partner==='driver'||scenario.startsWith('driver')||/\b(driver|chauffeur|car|pickup|pick me up)\b/.test(t)){
      memory.partner='driver';
      if(/petrol|fuel|tank|tyre|tire/.test(t)||/fuel/.test(scenario))return'driverFuel';
      if(/one more stop|pharmacy|grocery|atm|errand/.test(t)||/errand/.test(scenario))return'driverErrands';
      if(/maps|u-turn|next right|left lane|rough road|route|road blocked/.test(t))return'driverRoute';
      if(/wait|do not leave|fifteen minutes|message you when i am ready/.test(t))return'driverWait';
      if(/downstairs|entrance|bring the car around|when you reach|main gate/.test(t))return'driverArrival';
      return'driverPickup';
    }
    if(partner==='cook'||/cook|meal|leftover/.test(scenario)||/\b(cook|cooking|oil|salt|spicy|ghee|dinner|leftovers?|food in the fridge)\b/.test(t)){
      memory.partner='cook';
      if(/leftover|fridge|dinner too/.test(t))return'cookLeftovers';
      if(/less oil|less salt|less spicy|not add ghee|no ghee/.test(t))return'cookCustomize';
      return'cookPlan';
    }
    if(partner==='househelp'||partner==='housekeeper'||/househelp|housekeeper/.test(scenario)||/\b(maid|bai|didi|househelp|house help)\b/.test(t)){
      memory.partner='househelp';
      if(/laundry|clothes|towel|iron|bedsheet|wet/.test(t))return'househelpLaundry';
      if(/kitchen/.test(t))return'househelpKitchen';
      if(/clean|sweep|mop|bathroom|sofa|bed|dust|trash/.test(t))return'househelpCleaning';
      return'househelpAttendance';
    }
    if(/grocery|groceries|running low|runs out/.test(t)||/grocer/.test(scenario))return'groceries';
    return memory.flow||'';
  }

  function ingest(english){
    const state=kt.getConversationState(english);
    const foundTime=extractTime(english);
    if(foundTime)memory.time=foundTime;
    const flow=detectFlow(english,state);
    if(flow)memory.flow=flow;
    const key=norm(english);
    if(key&&!memory.history.includes(key))memory.history.push(key);
    if(memory.history.length>12)memory.history.shift();
    return state;
  }

  function isContradictory(phrase){
    if(!memory.time)return false;
    const p=norm(phrase);
    return /please come at eight|please come by nine|i need to leave at seven thirty/.test(p);
  }

  function collect(library,english,limit=6){
    if(!Array.isArray(library)||!library.length)return[];
    const byEnglish=new Map(library.map(item=>[norm(item?.english),item]));
    const state=ingest(english);
    const current=norm(english),seen=new Set([current,...memory.history]),phrases=[];
    const push=phrase=>{
      const k=norm(phrase);
      if(!k||seen.has(k)||isContradictory(phrase))return;
      const item=byEnglish.get(k);
      if(!item)return;
      seen.add(k);phrases.push(item);
    };

    for(const phrase of state.next||[])push(phrase);
    const primary=FLOWS[memory.flow]||[];
    for(const phrase of primary){push(phrase);if(phrases.length>=limit)break;}

    if(phrases.length<limit){
      const adjacent=memory.partner==='driver'?['driverArrival','driverErrands','driverWait']:
        memory.partner==='househelp'?['househelpCleaning','househelpLaundry','househelpAttendance']:
        memory.partner==='cook'?['cookCustomize','cookLeftovers','groceries']:[];
      for(const flow of adjacent){
        if(flow===memory.flow)continue;
        for(const phrase of FLOWS[flow]||[]){push(phrase);if(phrases.length>=limit)break;}
        if(phrases.length>=limit)break;
      }
    }
    return phrases.slice(0,limit);
  }

  function choose(item){
    const english=item?.english||'';
    ingest(english);
    return item;
  }

  function reset(){memory.partner='';memory.flow='';memory.time='';memory.history=[];}

  window.BOLNA_KEEP_TALKING_DEPTH={collect,detectFlow,extractTime,choose,reset,memory,FLOWS};
  if(typeof document==='undefined')return;

  function escText(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function upgrade(){
    const root=document.querySelector('.resultView');
    const host=root?.querySelector('.keepTalking');
    if(!root||!host||host.dataset.statefulFor===norm(transcript))return;
    let suggestions=[];
    try{suggestions=collect(phraseLibrary,transcript,6)}catch{return}
    if(suggestions.length<4)return;
    host.dataset.statefulFor=norm(transcript);
    const list=host.querySelector('.keepTalkingList');
    if(!list)return;
    list.innerHTML=suggestions.map((x,i)=>`<button class="keepTalkingChoice" type="button" data-keep-talking-stateful="${i}"><b>${escText(x.english)}</b><em>→</em></button>`).join('');
    const label=host.querySelector('.keepTalkingTrigger span');
    if(label)label.textContent='Likely next things you may need';
    const hint=host.querySelector('.keepTalkingHint');
    if(hint)hint.textContent='Choose what comes next. Bolna keeps the conversation state and adapts the next options.';
    host.querySelectorAll('[data-keep-talking-stateful]').forEach(b=>b.onclick=()=>openLibraryPhrase(choose(suggestions[+b.dataset.keepTalkingStateful])));
  }

  const obs=new MutationObserver(()=>queueMicrotask(upgrade));
  obs.observe(document.getElementById('app'),{childList:true,subtree:true});
  queueMicrotask(upgrade);
})();