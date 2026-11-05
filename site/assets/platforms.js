(() => {
  'use strict';
  const list=[...document.querySelectorAll('[data-platform]')];
  const links=[...document.querySelectorAll('[data-platform-link]')];
  const picker=document.getElementById('op-select');
  if (!list.length || !picker) return;
  const hashes=list.map(p=>p.id),toId=()=>hashes.includes(location.hash.slice(1))?location.hash.slice(1):hashes[0];
  const next=document.querySelector('[data-next]'),prev=document.querySelector('[data-prev]');
  let current;
  function render(focus=false){
    const id=toId(),idx=hashes.indexOf(id);
    list.forEach(p=>p.hidden=p.id!==id);
    links.forEach(a=>a.dataset.platformLink===id?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
    picker.value=id;
    prev.href='#'+hashes[(idx-1+hashes.length)%hashes.length];next.href='#'+hashes[(idx+1)%hashes.length];
    const title=list[idx].querySelector('h2');
    document.title=title.textContent+' — عُمق على المنصّات';
    if(focus && current!==id){title.focus({preventScroll:true});list[idx].scrollIntoView({block:'start'});}
    current=id;
  }
  function goto(id,focus=true) {
    if(!hashes.includes(id))return;
    if(toId()!==id || !location.hash){
      try{history.pushState(null,'','#'+id);}catch(_){location.hash=id;return;}
    }
    render(focus);
  }
  document.body.classList.add('op-ready');document.querySelector('.op-mobile-picker').hidden=false;document.querySelector('.op-pager').hidden=false;
  render();
  if(hashes.includes(location.hash.slice(1)))requestAnimationFrame(()=>list[hashes.indexOf(toId())].scrollIntoView({block:'start'}));
  window.addEventListener('hashchange',()=>render(true));window.addEventListener('popstate',()=>render(true));
  picker.addEventListener('change',()=>goto(picker.value));
  const dlg=document.getElementById('op-lightbox'),btn=document.getElementById('op-close'),img=document.getElementById('op-light-img'),original=document.getElementById('op-original');
  let launcher;
  document.addEventListener('click',e=>{
    if(e.defaultPrevented || e.button!==0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)return;
    const a=e.target.closest('a');if(!a)return;
    if(a.matches('[data-platform-link],[data-prev],[data-next]')){e.preventDefault();goto(a.hash.slice(1));return;}
    if(!a.matches('[data-zoom]') || !dlg || typeof dlg.showModal!=='function')return;
    e.preventDefault();launcher=a;
    document.getElementById('op-light-title').textContent=a.dataset.caption;
    img.src=a.href;img.alt=a.dataset.caption;original.href=a.href;
    dlg.showModal();btn.focus({preventScroll:true});
  });
  function shut(){if(dlg?.open)dlg.close();}
  btn?.addEventListener('click',shut);
  dlg?.addEventListener('click',e=>{if(e.target!==dlg)return;const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)shut();});
  dlg?.addEventListener('close',()=>launcher?.focus({preventScroll:true}));
})();
