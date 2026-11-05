/* Progressive homepage details: default markup is complete when script/motion are off. */
(() => {
  'use strict';
  const home=document.querySelector('main.omq-home');
  if(!home)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');

  // Mark sections on entry, never on exit; unobserved sections stay completely visible.
  const list=[...home.querySelectorAll('.selected-section .home-section-heading,.selected-section .work-item,.workshop-copy,.workshop-plate,.sig-stamp,.signature-copy')];
  const seen=new WeakSet();
  let observer=null;
  const meter=document.createElement('div');
  meter.className='omq-read-line';meter.setAttribute('aria-hidden','true');
  document.body.append(meter);
  const scrolling=document.scrollingElement || document.documentElement;
  let frame=0;
  function paint(){
    frame=0;
    const max=scrolling.scrollHeight-document.documentElement.clientHeight;
    meter.style.transform='scaleX('+(max>0?Math.max(0,Math.min(1,scrolling.scrollTop/max)):0)+')';
  }
  function queue(){if(!frame && !reduced.matches)frame=requestAnimationFrame(paint)}
  function motionMode(){
    observer?.disconnect();observer=null;
    if(reduced.matches){
      if(frame)cancelAnimationFrame(frame);frame=0;
      list.forEach(el=>el.classList.remove('pm-enter'));return;
    }
    queue();
    if(!('IntersectionObserver' in window))return;
    observer=new IntersectionObserver(entries=>{
      for(const {isIntersecting,target} of entries){
        if(!isIntersecting)continue;
        observer?.unobserve(target);seen.add(target);
        if(target.contains(document.activeElement))continue;
        target.classList.add('pm-enter');
        target.addEventListener('animationend',()=>target.classList.remove('pm-enter'),{once:true});
      }
    },{threshold:0.07});
    list.forEach(el=>{if(!seen.has(el))observer.observe(el)});
  }
  home.querySelectorAll('.selected-section .work-item').forEach((el,i)=>el.style.setProperty('--pm-delay',(i*50)+'ms'));
  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',queue,{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(queue).observe(document.body);
  if(reduced.addEventListener)reduced.addEventListener('change',motionMode);
  else if(reduced.addListener)reduced.addListener(motionMode);
  motionMode();

  // No video fetch or movement before the visitor explicitly starts the film.
  const stamp=home.querySelector('.sig-stamp'),stage=stamp?.querySelector('.sig-plate');
  if(!stamp || !stage)return;
  const video=document.createElement('video');
  if(!video.canPlayType('video/mp4'))return;
  video.className='pm-film';video.id='pm-logo-film';video.preload='none';video.playsInline=true;
  video.muted=true;video.setAttribute('aria-hidden','true');video.tabIndex=-1;
  stage.classList.add('pm-stage');stage.setAttribute('aria-hidden','true');
  stamp.removeAttribute('aria-hidden');stage.append(video);
  const bar=document.createElement('div');bar.className='pm-controls';
  const button=document.createElement('button');button.type='button';button.className='pm-play';
  button.setAttribute('aria-controls',video.id);
  button.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path class="pm-playicon" d="m6 3 10 7-10 7z"/><path class="pm-pauseicon" d="M7 4v12M13 4v12"/></svg>';
  const label=document.createElement('span');button.append(label);
  const duration=document.createElement('span');duration.className='pm-duration';duration.textContent='٤ ثوانٍ · بلا صوت';
  const status=document.createElement('span');status.className='pm-offscreen';status.setAttribute('role','status');
  const fallback=document.createElement('a');fallback.className='pm-fallback';fallback.href='assets/motion.mp4';fallback.textContent='افتح فيلم الشعار';fallback.hidden=true;
  bar.append(button,fallback,duration,status);stamp.append(bar);
  let requested=false;
  function buttonState(){
    const active=requested||(!video.paused&&!video.ended);
    button.toggleAttribute('data-playing',active);
    label.textContent=active?'إيقاف مؤقت':video.ended?'أعد تشغيل الحركة':video.currentTime>0?'تابع الحركة':'شغّل حركة الشعار';
  }
  function pause(){
    requested=false;video.pause();buttonState();
  }
  function failed(){
    requested=false;stage.classList.remove('pm-has-frame');buttonState();
    const wasFocused=document.activeElement===button;
    fallback.hidden=false;button.hidden=true;
    if(wasFocused)fallback.focus();
    status.textContent='تعذّر تشغيل الفيلم هنا. يمكنك فتح الملف مباشرةً.';
  }
  button.addEventListener('click',()=>{
    if(requested||(!video.paused&&!video.ended)){pause();return}
    if(!video.hasAttribute('src'))video.src='assets/motion.mp4';
    if(video.ended)video.currentTime=0;
    requested=true;buttonState();
    const playback=video.play();
    playback?.catch(error=>{if(error?.name==='AbortError')return;failed()});
  });
  video.addEventListener('playing',()=>{requested=false;stage.classList.add('pm-has-frame');buttonState()});
  video.addEventListener('pause',()=>{requested=false;buttonState()});
  video.addEventListener('ended',()=>{requested=false;buttonState();status.textContent='اكتملت حركة شعار عُمق.'});
  video.addEventListener('error',failed);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
  window.addEventListener('pagehide',pause);
  buttonState();
})();
