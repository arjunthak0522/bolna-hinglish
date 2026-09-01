from pathlib import Path

p=Path('app-runtime.js')
s=p.read_text()

anchor="const situations={"
if anchor not in s: raise SystemExit('situations anchor missing')
# Insert phrase library binding after situations object closes, using coreSchema as stable next anchor.
needle="const coreSchema="
insert="const phraseLibrary=Array.isArray(window.BOLNA_PHRASE_LIBRARY)?window.BOLNA_PHRASE_LIBRARY:[];\n"
if insert not in s:
    s=s.replace(needle,insert+needle,1)

old="document.addEventListener('pointerdown',e=>{if(e.target.closest('#hear,#slow,#variantPlay,[data-word],[data-recent],[data-play-stored]'))unlockPlayback()},{capture:true,passive:true});"
new="document.addEventListener('pointerdown',e=>{if(e.target.closest('#hear,#slow,#variantPlay,[data-word],[data-recent],[data-play-stored],[data-lib-play]'))unlockPlayback()},{capture:true,passive:true});"
if old not in s: raise SystemExit('pointerdown anchor missing')
s=s.replace(old,new,1)

old="function nav(){return `<nav class=\"tabs\"><button data-view=\"speak\" class=\"${view==='speak'?'on':''}\">Speak</button><button data-view=\"phrases\" class=\"${view==='phrases'?'on':''}\">My Phrases</button><button data-view=\"situations\" class=\"${view==='situations'?'on':''}\">Situations</button></nav>`}"
new="function nav(){return `<nav class=\"tabs\"><button data-view=\"speak\" class=\"${view==='speak'?'on':''}\">Speak</button><button data-view=\"library\" class=\"${view==='library'?'on':''}\">Library</button><button data-view=\"phrases\" class=\"${view==='phrases'?'on':''}\">My Phrases</button><button data-view=\"situations\" class=\"${view==='situations'?'on':''}\">Situations</button></nav>`}"
if old not in s: raise SystemExit('nav anchor missing')
s=s.replace(old,new,1)

old="function render(){if(view==='phrases')return renderPhrases();if(view==='situations')return renderSituations();"
new="function render(){if(view==='library')return renderLibrary();if(view==='phrases')return renderPhrases();if(view==='situations')return renderSituations();"
if old not in s: raise SystemExit('render routing anchor missing')
s=s.replace(old,new,1)

anchor="function renderPhrases(){"
if anchor not in s: raise SystemExit('renderPhrases anchor missing')
lib="""function openLibraryPhrase(x){
  if(!x)return;
  context=x.context||'General';localStorage.setItem('bolna_context',context);
  transcript=x.english||'';
  result={natural:x.natural,spokenForm:x.natural,phonetic:x.phonetic,speechText:x.natural,meaning:x.english,polite:'',casual:'',moreHindi:'',words:[],_enriched:false,_audioState:null};
  view='speak';state='ready';error=null;panel='';render();
}
function renderLibrary(){
  app.className='app libraryView phraseLibraryView';
  const cats=['All',...new Set(phraseLibrary.map(x=>x.category).filter(Boolean))];
  app.innerHTML=`<header><div class="brand">bolna</div></header><h1 class="pageTitle">Phrase Library</h1><p class="pageSub">Useful Hinglish for everyday life in India. Tap a phrase for pronunciation, meaning, audio, and Save.</p><div class="libraryTools"><input id="librarySearch" class="librarySearch" type="search" placeholder="Search English or Hinglish…" autocomplete="off"><select id="libraryCategory" class="libraryFilter">${cats.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div><div id="libraryCount" class="libraryCount"></div><section class="phraseLibraryList">${phraseLibrary.map((x,i)=>`<article class="phraseLibraryCard" data-lib-card="${i}"><button class="phraseLibraryMain" data-lib-open="${i}"><span class="phraseLibraryMeta">${esc(x.category)} · ${esc(x.context)}</span><span class="phraseLibraryEnglish">${esc(x.english)}</span><strong>${esc(x.natural)}</strong><span class="phraseLibraryPhonetic">${esc(x.phonetic)}</span></button><button class="roundPlay" data-lib-play="${i}" aria-label="Play ${esc(x.english)}">▶</button></article>`).join('')}</section>${nav()}`;
  const search=document.getElementById('librarySearch'),filter=document.getElementById('libraryCategory'),count=document.getElementById('libraryCount');
  const apply=()=>{const q=search.value.trim().toLowerCase(),cat=filter.value;let shown=0;document.querySelectorAll('[data-lib-card]').forEach(el=>{const x=phraseLibrary[+el.dataset.libCard];const hay=`${x.english} ${x.natural} ${x.phonetic}`.toLowerCase();const ok=(!q||hay.includes(q))&&(cat==='All'||x.category===cat);el.hidden=!ok;if(ok)shown++});count.textContent=`${shown} phrase${shown===1?'':'s'}`};
  search.addEventListener('input',apply);filter.addEventListener('change',apply);apply();
  document.querySelectorAll('[data-lib-open]').forEach(b=>b.onclick=()=>openLibraryPhrase(phraseLibrary[+b.dataset.libOpen]));
  document.querySelectorAll('[data-lib-play]').forEach(b=>b.onclick=()=>playText(phraseLibrary[+b.dataset.libPlay].natural,false));
  bindNav();
}
"""
s=s.replace(anchor,lib+anchor,1)
p.write_text(s)

p=Path('style.css')
css=p.read_text()
old=".tabs{position:absolute;left:0;right:0;bottom:0;height:68px;display:grid;grid-template-columns:repeat(3,1fr);"
new=".tabs{position:absolute;left:0;right:0;bottom:0;height:68px;display:grid;grid-template-columns:repeat(4,1fr);"
if old not in css: raise SystemExit('tabs CSS anchor missing')
css=css.replace(old,new,1)
extra="""
.libraryTools{display:grid;grid-template-columns:1fr 132px;gap:9px;margin:0 0 10px}.librarySearch,.libraryFilter{min-width:0;border:1px solid #ddd7ce;background:#fff;border-radius:14px;padding:12px 13px;color:#302c27;outline:none}.librarySearch{font-size:14px}.libraryFilter{font-size:12px;font-weight:700}.libraryCount{font-size:11px;color:#958c82;margin:0 0 8px}.phraseLibraryList{display:grid}.phraseLibraryCard{display:grid;grid-template-columns:1fr 42px;gap:8px;border-top:1px solid #e4ded5;padding:12px 0}.phraseLibraryCard[hidden]{display:none}.phraseLibraryMain{display:grid;gap:4px;text-align:left;border:0;background:transparent;padding:1px 0;color:#29251f}.phraseLibraryMeta{font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#9a9187}.phraseLibraryEnglish{font-size:12px;color:#746d64}.phraseLibraryMain strong{font-size:17px;line-height:1.25}.phraseLibraryPhonetic{font-size:12px;line-height:1.35;color:#c75b38;font-weight:680}.phraseLibraryView .pageSub{margin-bottom:18px}@media(max-width:380px){.libraryTools{grid-template-columns:1fr}.libraryFilter{width:100%}}
"""
if '.libraryTools{' not in css: css += extra
p.write_text(css)
