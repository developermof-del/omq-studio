/* Three stills, loaded on demand. The currently visible plate remains in place
   until the visitor's last requested image is decoded. No automatic cycling. */
(() => {
  'use strict';
  const stage = document.querySelector('[data-home-stage]');
  if (!stage) return;
  const works = [
    {id:'arch',name:'قوس',note:'انحناء مفتوح',photo:'clay',alt:'قوس نحتي بلون ترابي دافئ، تحيط انحناءته بفراغ مفتوح.'},
    {id:'fold',name:'طَيّة',note:'سطح حلزوني',photo:'hero',alt:'قطعة عاجية تلتفّ طبقات سطحها في حركة حلزونية.'},
    {id:'arcade',name:'رِواق',note:'إيقاع الأقواس',photo:'scene',alt:'قطعة عاجية من أقواس متدرجة داخل مساحة معيشة.'}
  ];
  const field=stage.querySelector('[data-swipe-field]'), rail=stage.querySelector('[data-hero-indexer]');
  const controls=stage.querySelector('[data-hero-controls]'), caption=stage.querySelector('.stage-name');
  const status=stage.querySelector('[data-hero-status]'), label=stage.querySelector('[data-hero-name]');
  const note=stage.querySelector('[data-hero-note]'), link=stage.querySelector('[data-hero-link]');
  const count=stage.querySelector('[data-hero-count]'), chips=Array.from(stage.querySelectorAll('[data-work]'));
  if(!field || !rail || !controls || !caption || !link || !label || !note || !status || !count || chips.length!==works.length) return;
  const initial=field.querySelector('.stage-photo'), buffered=new Map();
  if(!initial) return;
  buffered.set(0,Promise.resolve(initial));
  let active=0, desired=0, ticket=0, cleanup=0, captionTimer=0;
  function prepare(i){
    if(buffered.has(i)) return buffered.get(i);
    const w=works[i], img=new Image();img.className='stage-photo';img.dataset.heroPhoto=w.id;
    img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';img.width=1086;img.height=1448;
    const p=new Promise((resolve,reject)=>{
      img.onload=()=>{ const decoded=typeof img.decode==='function'?img.decode():Promise.resolve();decoded.catch(()=>{}).then(()=>resolve(img)); };
      img.onerror=()=>{img.remove();buffered.delete(i);reject(new Error('Image unavailable'));};
    });
    buffered.set(i,p);field.append(img); img.src='assets/images/'+w.photo+'.webp';return p;
  }
  async function select(i) {
    const to=(i+works.length)%works.length, local=++ticket;desired=to;
    if (to===active){field.removeAttribute('aria-busy'); return;}
    field.setAttribute('aria-busy','true');
    let incoming;
    try{ incoming=await prepare(to); }catch{
      if(local===ticket){desired=active;field.removeAttribute('aria-busy');status.textContent='تعذّر تحميل صورة العمل. حاول اختياره مرة أخرى.';}
      return;
    }
    if(local!==ticket)return;
    const w=works[to];clearTimeout(cleanup);clearTimeout(captionTimer);
    for(const old of field.querySelectorAll('.is-leaving'))old.classList.remove('is-leaving');
    const last=field.querySelector('.is-shown');
    if(last&&last!==incoming){last.classList.add('is-leaving');last.classList.remove('is-shown');last.setAttribute('aria-hidden','true');last.alt='';}
    field.classList.add('has-switched');
    // Establish the buffered plate's initial style before it becomes the active layer.
    void incoming.offsetWidth;
    incoming.classList.add('is-shown');incoming.removeAttribute('aria-hidden');incoming.alt=w.alt;
    active=to;label.textContent=w.name;note.textContent=w.note;link.href='collection.html#'+w.id;
    count.textContent=String(to+1).padStart(2,'0');
    chips.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===to)));
    rail.style.setProperty('--stage-shift',(-to*100)+'%');
    caption.classList.remove('is-changing');void caption.offsetWidth;caption.classList.add('is-changing');
    captionTimer=setTimeout(()=>caption.classList.remove('is-changing'),410);
    cleanup=setTimeout(()=>field.querySelectorAll('.is-leaving').forEach(e=>e.classList.remove('is-leaving')),575);
    field.removeAttribute('aria-busy');
    status.textContent='العمل '+['الأول','الثاني','الثالث'][to]+' من ثلاثة: '+w.name+'، '+w.note+'.';
  }
  chips.forEach((b,i)=>{
    b.addEventListener('click',()=>select(i));
    const prewarm=()=>{prepare(i).catch(()=>{});};
    b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')prewarm();});b.addEventListener('focus',prewarm);
  });
  controls.querySelector('[data-home-back]').addEventListener('click',()=>select(desired-1));
  controls.querySelector('[data-home-next]').addEventListener('click',()=>select(desired+1));
  stage.addEventListener('keydown',e=>{
    if(e.altKey||e.metaKey||e.ctrlKey||e.shiftKey)return;
    const options={ArrowLeft:desired+1,ArrowRight:desired-1,Home:0,End:works.length-1};
    if(!Object.prototype.hasOwnProperty.call(options,e.key))return;
    const n=(options[e.key]+works.length)%works.length;
    e.preventDefault(); if(rail.contains(document.activeElement))chips[n].focus({preventScroll:true});
    select(n);
  });
  let touch=null;
  stage.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch' || !e.isPrimary || e.target.closest('a,button'))return;
    touch={id:e.pointerId,x:e.clientX,y:e.clientY};
  },{passive:true});
  stage.addEventListener('pointercancel',()=>{touch=null;},{passive:true});
  stage.addEventListener('pointerup',e=>{
    if(!touch||touch.id!==e.pointerId)return;
    const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;
    if(Math.abs(dx)>48 && Math.abs(dx)>1.45*Math.abs(dy))select(desired+(dx>0?1:-1));
  },{passive:true});
  rail.hidden=false;controls.hidden=false;stage.classList.add('has-indexer');
})();
