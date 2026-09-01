from pathlib import Path

# index: load static curated data before runtime
p=Path('index.html'); s=p.read_text()
old='  <script src="./app-runtime.js"></script>'
new='  <script src="./phrase-library.js"></script>\n  <script src="./app-runtime.js"></script>'
assert old in s
p.write_text(s.replace(old,new,1))

# runtime: isolated library view, no changes to mic/provider/TTS internals
p=Path('app-runtime.js'); s=p.read_text()
old="let view='speak',state='idle',transcript='',result=null,error=null,showType=false,panel='',micSetup=!localStorage.getItem('bolna_mic_setup_done');"
new="let view='speak',state='idle',transcript='',result=null,error=null,showType=false,panel='',micSetup=!localStorage.getItem('bolna_mic_setup_done');\nconst phraseLibrary=Array.isArray(window.BOLNA_PHRASE_LIBRARY)?window.BOLNA_PHRASE_LIBRARY:[];\nlet libraryCategory='All',librarySearch='';"
assert old in s
s=s.replace(old,new,1)

old="document.addEventListener('pointerdown',e=>{if(e.target.closest('#hear,#slow,#variantPlay,[data-word],[data-recent],[data-play-stored]'))unlockPlayback()},{capture:true,passive:true});"
new="document.addEventListener('pointerdown',e=>{if(e.target.closest('#hear,#slow,#variantPlay,[data-word],[data-recent],[data-play-stored],[data-library-play]'))unlockPlayback()},{capture:true,passive:true});"
assert old in s
s=s.replace(old,new,1)

old="function nav(){return `<nav class=\"tabs\"><button data-view=\"speak\" class=\"${view==='speak'?'on':''}\">Speak</button><button data-view=\"phrases\" class=\"${view==='phrases'?'on':''}\">My Phrases</button><button data-view=\"situations\" class=\"${view==='situations'?'on':''}\">Situations</button></nav>`}"
new="function nav(){return `<nav class=\"tabs\"><button data-view=\"speak\" class=\"${view==='speak'?'on':''}\">Speak</button><button data-view=\"library\" class=\"${view==='library'?'on':''}\">Library</button><button data-view=\"phrases\" class=\"${view==='phrases'?'on':''}\">My Phrases</button><button data-view=\"situations\" class=\"${view==='situations'?'on':''}\">Situations</button></nav>`}"
assert old in s
s=s.replace(old,new,1)

old="function render(){if(view==='phrases')return renderPhrases();if(view==='situations')return renderSituations();"
new="function render(){if(view==='library')return renderLibrary();if(view==='phrases')return renderPhrases();if(view==='situations')return renderSituations();"
assert old in s
s=s.replace(old,new,1)

anchor="function renderPhrases(){"
assert anchor in s
library_code=r'''function openLibraryPhrase(x){context=x.context||'General';localStorage.setItem('bolna_context',context);transcript=x.english;result={natural:x.natural,spokenForm:x.natural,phonetic:x.phonetic,speechText:x.natural,meaning:x.english,polite:'',casual:'',moreHindi:'',words:[],_enriched:false,_audioState:'ready'};view='speak';state='ready';panel='';error=null;render()}
function renderLibrary(){const cats=['All',...new Set(phraseLibrary.map(x=>x.category))],q=librarySearch.trim().toLowerCase(),rows=phraseLibrary.filter(x=>(libraryCategory==='All'||x.category===libraryCategory)&&(!q||`${x.english} ${x.natural} ${x.phonetic} ${x.category}`.toLowerCase().includes(q)));app.className='app libraryView phraseLibraryView';app.innerHTML=`<header><div class="brand">bolna</div></header><h1 class="pageTitle">India Phrase Library</h1><p class="pageSub">Useful everyday Hinglish, ready whenever you need it.</p><div class="libraryTools"><input id="librarySearch" value="${esc(librarySearch)}" placeholder="Search phrases…" autocomplete="off"><select id="libraryCategory">${cats.map(c=>`<option ${c===libraryCategory?'selected':''}>${esc(c)}</option>`).join('')}</select></div><p class="libraryCount">${rows.length} phrase${rows.length===1?'':'s'}</p><section class="phraseLibraryList">${rows.length?rows.map((x,i)=>`<article class="phraseLibraryCard"><button class="phraseLibraryMain" data-library-open="${phraseLibrary.indexOf(x)}"><small>${esc(x.category)} · ${esc(x.context)}</small><strong>${esc(x.english)}</strong><span>${esc(x.natural)}</span><em>${esc(x.phonetic)}</em></button><button class="roundPlay" data-library-play="${phraseLibrary.indexOf(x)}" aria-label="Play ${esc(x.english)}">▶</button></article>`).join(''):'<p class="empty">No phrases match that search.</p>'}</section>${nav()}`;document.getElementById('librarySearch').oninput=e=>{librarySearch=e.target.value;renderLibrary();const el=document.getElementById('librarySearch');el.focus();el.setSelectionRange(el.value.length,el.value.length)};document.getElementById('libraryCategory').onchange=e=>{libraryCategory=e.target.value;renderLibrary()};document.querySelectorAll('[data-library-open]').forEach(b=>b.onclick=()=>openLibraryPhrase(phraseLibrary[+b.dataset.libraryOpen]));document.querySelectorAll('[data-library-play]').forEach(b=>b.onclick=e=>{e.stopPropagation();const x=phraseLibrary[+b.dataset.libraryPlay];playText(x.natural,false)});bindNav()}
'''
s=s.replace(anchor,library_code+anchor,1)
p.write_text(s)

# style: four-tab nav and isolated library styling
p=Path('style.css'); s=p.read_text()
s=s.replace('grid-template-columns:repeat(3,1fr)','grid-template-columns:repeat(4,1fr)',1)
append='''.libraryTools{display:grid;grid-template-columns:1fr 145px;gap:8px;margin:0 0 10px}.libraryTools input,.libraryTools select{min-width:0;border:1px solid #ddd7ce;background:#fff;border-radius:14px;padding:12px 13px;color:#302c27;outline:none}.libraryTools input{font-size:15px}.libraryTools select{font-size:12px;font-weight:720}.libraryCount{margin:12px 0 4px;color:#958c82;font-size:12px}.phraseLibraryList{padding-bottom:10px}.phraseLibraryCard{display:grid;grid-template-columns:1fr 42px;gap:8px;border-top:1px solid #e4ded5;padding:13px 0}.phraseLibraryMain{display:grid;gap:5px;text-align:left;border:0;background:transparent;padding:0;color:#27231f}.phraseLibraryMain small{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9a9187}.phraseLibraryMain strong{font-size:14px;color:#6e675e;font-weight:650}.phraseLibraryMain span{font-size:18px;line-height:1.28;font-weight:790}.phraseLibraryMain em{font-size:13px;line-height:1.35;color:#c75b38;font-style:normal;font-weight:680}.phraseLibraryView .pageTitle{margin-bottom:9px}.phraseLibraryView .pageSub{margin-bottom:20px}@media(max-width:390px){.libraryTools{grid-template-columns:1fr 128px}.tabs button{font-size:11px}}
'''
s += '\n'+append
p.write_text(s)
