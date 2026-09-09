(() => {
  const CHAINS = [
    {id:'power',match:/\b(electricity|power|generator|backup power|power cut)\b/i,queries:['when will electricity come back','is there a scheduled power cut','backup power not working','can someone come fix this today']},
    {id:'water',match:/\b(water|tank|tanker|pressure|tap|faucet|leak|toilet|sink)\b/i,queries:['when does water supply come','need a water tanker','leak under sink','toilet clogged','can someone come fix this today']},
    {id:'repair',match:/\b(ac|air conditioner|refrigerator|fridge|washing machine|repair|plumber|electrician|fix|broken|not working|cooling|drain)\b/i,queries:['can someone come fix this today','how much will repair cost','call me before you come','it is still not working','please send someone else']},
    {id:'driver',context:'Driver',queries:['call me when you arrive','you are at the wrong gate','come to the other entrance','wait here for five minutes','send me your location']},
    {id:'delivery',context:'Delivery',queries:['call me when you arrive','delivery person cannot find my building','leave package with security','package says delivered but I do not have it','send me your location']},
    {id:'security',context:'Security',queries:['please let my guest inside','leave the package with security','where is visitor parking','someone parked in my spot','call me when they arrive']},
    {id:'household',context:'Household',queries:['please come a little later','please clean this again','change the bedsheets','take the trash out','please call before you come']},
    {id:'restaurant',context:'Restaurant',queries:['please make it less spicy','please pack the leftovers','something is missing from my order','can you make it fresh','can I get the bill']},
    {id:'medicine',match:/\b(medicine|pharmacy|prescription|tablet|pill|doctor|generic|dose|food)\b/i,queries:['do you have this medicine','another brand is okay','is there a generic version','when will this medicine be available','can you deliver the medicine']},
    {id:'shopping',context:'Shopkeeper',queries:['do you have another brand','do you have a cheaper option','can you deliver this today','when will new stock come','can I return this']},
    {id:'admin',match:/\b(counter|document|form|photocopy|token|office|sign|appointment)\b/i,queries:['which counter do I go to','what document do I need','do I need a photocopy','where do I sign','how long will it take']}
  ];

  const FALLBACK = ['please speak a little slower','please say that again','please write it down for me','please send it on WhatsApp'];
  const norm = s => String(s || '').trim().toLowerCase();

  function getSuggestionQueries(english,ctx){
    const text=norm(english);
    const contextual=CHAINS.find(c=>c.match?.test(text)) || CHAINS.find(c=>c.context===ctx);
    return [...(contextual?.queries||[]),...FALLBACK].filter((q,i,a)=>a.indexOf(q)===i).slice(0,7);
  }

  function resolveSuggestions(library,engine,english,ctx,limit=5){
    if(!Array.isArray(library)||!library.length||!engine?.rank)return[];
    const current=norm(english),seen=new Set(),out=[];
    for(const query of getSuggestionQueries(english,ctx)){
      const ranked=engine.rank(library,query,'All')||[];
      const match=ranked.map(r=>r.item).find(item=>item&&norm(item.english)!==current&&!seen.has(norm(item.english)));
      if(!match)continue;
      seen.add(norm(match.english));out.push(match);
      if(out.length>=limit)break;
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

  window.BOLNA_KEEP_TALKING={getSuggestionQueries,resolveSuggestions};
  if(typeof document==='undefined')return;
  injectStyles();
  const obs=new MutationObserver(()=>queueMicrotask(enhance));
  obs.observe(document.getElementById('app'),{childList:true,subtree:true});
  enhance();
})();
