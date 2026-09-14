(function(){
  const style=document.createElement('style');
  style.textContent='.contextRow,.resultContext{display:none!important}';
  document.head.appendChild(style);

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
