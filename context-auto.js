(function(){
  const style=document.createElement('style');
  style.textContent='.contextRow,.resultContext{display:none!important}';
  document.head.appendChild(style);

  const baseInfer=window.infer;
  window.infer=function(text){
    const t=String(text||'').toLowerCase();
    if(/\b(maid|househelp|house help|bai|didi|cook|cooking|kitchen|jhaadu|jhadu|pocha|mop|sweep|dust|bedsheet|bedsheets|laundry|iron|roti|chapati|sabzi|dal|chawal|leftover|groceries|grocery list|cleaner|bathroom clean)\b/.test(t))return'Household';
    if(/\b(driver|chauffeur|gaadi|car|pickup|pick me up|drop me|parking|petrol|fuel|tyre|tire|route|lane|u-turn|overtake|trunk|dicky|wait downstairs)\b/.test(t))return'Driver';
    return typeof baseInfer==='function'?baseInfer(text):null;
  };

  function resetIdleContext(){
    const select=document.getElementById('context');
    const label=document.querySelector('.micLabel');
    if(!select||!label||label.textContent.trim()!=='Tap to speak')return;
    if(select.value!=='General'){
      select.value='General';
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  const observer=new MutationObserver(resetIdleContext);
  observer.observe(document.getElementById('app'),{childList:true,subtree:true});
  resetIdleContext();
})();
