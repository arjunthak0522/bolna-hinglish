(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.BOLNA_LIBRARY_SEARCH=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const aliasGroups=[
    ['distance','far','nearby','close','closest','nearest'],
    ['mall','shopping center','shopping centre'],
    ['cab','taxi','uber','ola','driver','ride','auto'],
    ['maid','cleaner','house help','housekeeper','domestic help'],
    ['guard','security','watchman'],
    ['chemist','pharmacy','medical store'],
    ['price','cost','expensive','cheap','amount'],
    ['high','expensive','costly','overpriced','too much'],
    ['wait','stay','hold on'],
    ['repair','fix','broken','blocked','clogged','not working','problem','issue'],
    ['delivery','package','parcel','courier'],
    ['bill','check'],
    ['food','meal','dish','restaurant'],
    ['spicy','chili','chilli','hot','mild'],
    ['not','no','without','less'],
    ['water','tap'],
    ['bathroom','toilet','washroom','restroom'],
    ['dog','pet'],
    ['medicine','tablet','medication','drug'],
    ['doctor','clinic','hospital'],
    ['traffic','jam'],
    ['home','house','apartment','flat'],
    ['garbage','trash','rubbish','waste'],
    ['electricity','power','light'],
    ['internet','wifi','wi fi'],
    ['money','cash','payment','pay'],
    ['change','coins','small notes'],
    ['vegetables','veggies','produce'],
    ['grocery','groceries','supermarket'],
    ['walking','walk','on foot'],
    ['late','delay','delayed'],
    ['upstairs','up'],
    ['downstairs','down'],
    ['arrive','reach','come'],
    ['come','enter','allowed','inside','indoors'],
    ['leave','go'],
    ['call','phone','ring'],
    ['location','address','where'],
    ['fresh','quality','good'],
    ['less','reduce','lower'],
    ['more','increase','higher'],
    ['small','smaller'],
    ['big','bigger','large','larger'],
    ['open','unlock'],
    ['close','shut','lock'],
    ['tomorrow','next day'],
    ['today','now'],
    ['morning','am'],
    ['evening','night','pm']
  ];
  const stopWords=new Set(['a','an','the','i','you','we','they','he','she','it','can','could','would','should','do','does','did','is','are','am','be','to','for','of','my','your']);
  const aliasMap=new Map();
  for(const group of aliasGroups){
    const words=group.map(normalize);
    for(const w of words)aliasMap.set(w,words.filter(x=>x!==w));
  }
  function normalize(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
  function words(s){return normalize(s).split(' ').filter(Boolean)}
  function queryWords(s){
    const all=words(s);
    const useful=all.filter(x=>!stopWords.has(x));
    return useful.length?useful:all;
  }
  function nearWord(a,b){
    if(a===b)return true;
    if(a.length<5||b.length<5||Math.abs(a.length-b.length)>1)return false;
    let i=0,j=0,d=0;
    while(i<a.length&&j<b.length){
      if(a[i]===b[j]){i++;j++;continue}
      if(++d>1)return false;
      if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}
    }
    return d+(i<a.length||j<b.length?1:0)<=1;
  }
  function expansions(token){
    const out=new Set([token]);
    for(const [key,vals] of aliasMap){
      if(key===token||key.split(' ').includes(token))for(const v of vals)for(const w of v.split(' '))out.add(w);
    }
    return [...out];
  }
  function scorePhrase(phrase,query){
    const q=normalize(query);if(!q)return 1;
    const qWords=queryWords(q);
    const english=normalize(phrase.english);
    const meta=normalize(`${phrase.search||''} ${phrase.category||''} ${phrase.context||''}`);
    const englishWords=words(english),metaWords=words(meta);
    let score=0,matched=0;
    if(english.includes(q))score+=80;
    if(meta.includes(q))score+=45;
    for(const token of qWords){
      let best=0;
      if(englishWords.includes(token))best=Math.max(best,18);
      if(metaWords.includes(token))best=Math.max(best,11);
      if(englishWords.some(w=>w.startsWith(token)||token.startsWith(w)))best=Math.max(best,10);
      if(metaWords.some(w=>w.startsWith(token)||token.startsWith(w)))best=Math.max(best,6);
      for(const ex of expansions(token)){
        if(ex===token)continue;
        if(englishWords.includes(ex))best=Math.max(best,8);
        if(metaWords.includes(ex))best=Math.max(best,5);
        if(englishWords.some(w=>w.startsWith(ex)||ex.startsWith(w)))best=Math.max(best,6);
        if(metaWords.some(w=>w.startsWith(ex)||ex.startsWith(w)))best=Math.max(best,4);
      }
      if(!best&&englishWords.some(w=>nearWord(token,w)))best=5;
      if(!best&&metaWords.some(w=>nearWord(token,w)))best=3;
      if(best){score+=best;matched++}else score-=4;
    }
    if(matched===qWords.length)score+=20+qWords.length*3;
    if(matched===0)return 0;
    score+=Math.max(0,8-Math.abs(englishWords.length-qWords.length));
    return score;
  }
  function rank(list,query,category='All'){
    const filtered=(Array.isArray(list)?list:[]).filter(x=>category==='All'||x.category===category);
    const q=normalize(query);
    if(!q)return filtered.map((x,index)=>({item:x,score:1,index}));
    return filtered.map((item,index)=>({item,score:scorePhrase(item,q),index})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
  }
  return{normalize,rank,scorePhrase};
});