/* Interactive parametric study; everything is local and rendering sleeps when idle.
   World coordinates: Y up, Z towards the viewer; rotate around Y, project at a
   fixed elevation. A separate inner lip closes the cut at every build height. */
(() => {
  'use strict';
  const section=document.querySelector('.workshop-feature'),visual=section?.querySelector('.workshop-visual'),copy=section?.querySelector('.workshop-copy');
  if(!visual||!copy)return;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  const launch=document.createElement('button');
  launch.type='button';launch.className='fs-launch';launch.textContent='جرّب التشكيل';
  launch.setAttribute('aria-expanded','false');launch.setAttribute('aria-controls','fs-live-view');
  const view=document.createElement('div');view.className='fs-view';view.id='fs-live-view';view.hidden=true;
  view.setAttribute('role','region');view.setAttribute('aria-label','استكشاف نموذج التشكيل');
  view.innerHTML='<div class="fs-cap"><strong>دراسة حلزونية</strong><div class="fs-tray"><small lang="en" dir="ltr">FORM STUDY / 01</small><button type="button" class="fs-close" aria-label="إغلاق النموذج والعودة إلى صورة الورشة" title="العودة إلى الصورة">×</button></div></div><div class="fs-stage"><span class="fs-note">نموذج تجريبي · اسحب أفقيًا لتديره</span></div><div class="fs-palette"><label class="fs-range"><span>زاوية الدوران <b dir="ltr" data-fs-angle>32°</b></span><input type="range" min="0" max="360" step="1" value="32" dir="ltr" aria-label="زاوية دوران النموذج"></label><label class="fs-range"><span>ارتفاع البناء <b dir="ltr" data-fs-height>100%</b></span><input type="range" min="5" max="100" step="1" value="100" dir="ltr" aria-label="نسبة ارتفاع البناء"></label><button class="fs-build" type="button"></button></div>';
  const stage=view.querySelector('.fs-stage'),[rotation,build]=view.querySelectorAll('input'),ang=view.querySelector('[data-fs-angle]'),height=view.querySelector('[data-fs-height]'),run=view.querySelector('.fs-build');
  canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','نموذج حلزوني توضيحي قابل للدوران؛ استخدم السهمين الأيمن والأيسر أو شريط زاوية الدوران.');
  stage.prepend(canvas);visual.append(view);copy.insertBefore(launch,copy.querySelector('a'));
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)'),TAU=Math.PI*2,SECTORS=68,LEVELS=54;
  let degree=32,percent=100,open=false,playing=false,frame=0,startTime=0,startHeight=5,lastPaint=-1,lastHeight=-1,onScreen=true,drag=null;
  const ar=new Intl.NumberFormat('ar-SA',{maximumFractionDigits:0});
  function labels(){
    const a=Math.round(degree),h=Math.round(percent);
    rotation.value=String(a);build.value=String(h);ang.textContent=a+'°';height.textContent=h+'%';
    rotation.setAttribute('aria-valuetext',ar.format(a)+' درجة');build.setAttribute('aria-valuetext',ar.format(h)+' بالمئة');
    run.textContent=reduce.matches?(h===100?'ابدأ بطبقات القاعدة':'أضف ربع الارتفاع'):(playing?'أوقف البناء':h===100?'شاهد بناء الطبقات':'تابع بناء الطبقات');
  }
  // Five helical ribs and a breathing radius: the silhouette changes as it rotates.
  function point(t,s,radScale,yOffset){
    const a=s/SECTORS*TAU, r0=.638+.115*Math.sin(t*TAU-.27)+.16*t*t;
    const phase=5*a-4.15*t;
    const r=radScale*r0*(1+.122*Math.cos(phase)+.027*Math.cos(2*phase+.38));
    const u=r*Math.cos(a)+.08*t*t,v=r*Math.sin(a);
    return [u,2.15*t+.105*t*t*t*Math.sin(a-.3)+yOffset,v];
  }
  function rgb(bright,inner,line){const base=inner?[172,87,53]:[221,132,82];return 'rgb('+base.map((n,i)=>Math.max(0,Math.min(255,Math.round(n*bright+[15,15,16][i]-(line?12:0))))).join(',')+')'}
  const outer=Array.from({length:LEVELS+1},(_,j)=>Array.from({length:SECTORS+1},(_,i)=>point(j/LEVELS,i,1,0)));
  function paint(){
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    const ratio=Math.min(window.devicePixelRatio||1,1.65),pw=Math.round(w*ratio),ph=Math.round(h*ratio);
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
    const yaw=degree*TAU/360,co=Math.cos(yaw),si=Math.sin(yaw),ec=.955,es=.297;
    const scale=Math.min(w/2.6,h/2.94),cx=w*.5,baseY=h*.85;
    function project(raw){
      const [u,y,v]=raw,x=u*co+v*si,z=-u*si+v*co;
      return {x:cx+x*scale,y:baseY-(y*ec-z*es)*scale,d:y*es+z*ec,X:x,Y:y,Z:z};
    }
    // Soft contact shadow and a single etched placement circle.
    ctx.save();ctx.translate(cx,baseY+1);ctx.scale(1,.17);const glow=ctx.createRadialGradient(0,0,scale*.08,0,0,scale*1.13);
    glow.addColorStop(0,'rgba(7,8,8,.68)');glow.addColorStop(.68,'rgba(7,8,8,.26)');glow.addColorStop(1,'rgba(7,8,8,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,scale*1.13,0,TAU);ctx.fill();ctx.restore();
    ctx.strokeStyle='rgba(231,227,213,.19)';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(cx,baseY,scale*1.055,es*scale*1.055,0,0,TAU);ctx.stroke();
    const stop=percent/100,levels=Math.min(LEVELS,Math.floor(stop*LEVELS+1e-7));
    const rings=outer.slice(0,levels+1).map(r=>r.map(project));
    if(levels<LEVELS && stop-levels/LEVELS>.00001)rings.push(Array.from({length:SECTORS+1},(_,i)=>project(point(stop,i,1,0))));
    const top=rings[rings.length-1],inner0=[],inner1=[];
    for(let i=0;i<=SECTORS;i++){inner0.push(project(point(stop,i,.898,-.013)));inner1.push(project(point(stop,i,.86,-Math.min(.18,stop*.64))))}
    const faces=[];
    function face(a,b,c,d,kind){
      const ax=b.X-a.X,ay=b.Y-a.Y,az=b.Z-a.Z,bx=d.X-a.X,by=d.Y-a.Y,bz=d.Z-a.Z;
      // Tangent cross vertical is inward; orient normal outward for exterior.
      const side=kind===1?1:-1;
      let nx=(ay*bz-az*by)*side,ny=(az*bx-ax*bz)*side,nz=(ax*by-ay*bx)*side;
      const mag=Math.hypot(nx,ny,nz)||1;nx/=mag;ny/=mag;nz/=mag;
      if(kind===0 && ny*es+nz*ec<-.04)return;
      if(kind===1 && ny*es+nz*ec<-.04)return;
      if(kind===2){nx=0;ny=1;nz=0}
      const light=Math.max(0,-.63*nx+.62*ny+.46*nz),sideglow=Math.max(0,.68*nx+.08*ny-.60*nz);
      const value=kind===2?.99:.46+.55*light+.11*sideglow;
      faces.push({p:[a,b,c,d],z:(a.d+b.d+c.d+d.d)/4,fill:rgb(value,kind===1,false),seam:kind===0?rgb(value, false,true):null});
    }
    for(let j=1;j<rings.length;j++)for(let i=0;i<SECTORS;i++)face(rings[j-1][i],rings[j-1][i+1],rings[j][i+1],rings[j][i],0);
    faces.push({p:inner1.slice(0,-1),z:inner1.reduce((s,p)=>s+p.d,0)/inner1.length-.01,fill:'#643d2f',seam:null});
    for(let i=0;i<SECTORS;i++){face(inner1[i],inner1[i+1],inner0[i+1],inner0[i],1);face(top[i],top[i+1],inner0[i+1],inner0[i],2)}
    faces.sort((a,b)=>a.z-b.z);
    ctx.lineJoin='round';
    for(const f of faces){const p=f.p;ctx.fillStyle=f.fill;ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let j=1;j<p.length;j++)ctx.lineTo(p[j].x,p[j].y);ctx.closePath();ctx.fill();
      // Same-color hairline prevents antialias cracks; only layer edges have contrast.
      ctx.lineWidth=.66;ctx.strokeStyle=f.fill;ctx.stroke();
      if(f.seam){ctx.strokeStyle=f.seam;ctx.lineWidth=.42;ctx.beginPath();ctx.moveTo(p[2].x,p[2].y);ctx.lineTo(p[3].x,p[3].y);ctx.stroke()}
    }
  }
  let dirty=true;
  function tick(now){
    frame=0;if(!open||!onScreen||document.hidden)return;
    if(playing){
      if(!startTime)startTime=now;
      percent=Math.min(100,startHeight+(now-startTime)/54);
      if(percent>=100){playing=false;labels()}
      // 24 fps for rasterized toolpath, updating controls only when percentage changes.
      if(now-lastPaint>41||!playing)dirty=true;
      if(Math.round(percent)!==lastHeight){lastHeight=Math.round(percent);labels()}
    }
    if(dirty){paint();lastPaint=now;dirty=false}
    if(playing)frame=requestAnimationFrame(tick);
  }
  function requestPaint(){dirty=true;if(!frame&&open&&onScreen&&!document.hidden)frame=requestAnimationFrame(tick)}
  function endPlay(){playing=false;startTime=0;labels()}
  function setOpen(next){
    open=next;view.hidden=!next;section.classList.toggle('fs-open',next);launch.setAttribute('aria-expanded',String(next));launch.textContent=next?'العودة إلى صورة الورشة':'جرّب التشكيل';
    if(next){onScreen=true;labels();requestPaint()}else{endPlay();if(frame)cancelAnimationFrame(frame);frame=0}
  }
  launch.addEventListener('click',()=>{setOpen(!open);if(open)canvas.focus()});
  function closeToPhoto(){setOpen(false);launch.focus()}
  view.querySelector('.fs-close').addEventListener('click',closeToPhoto);
  view.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();closeToPhoto()}});
  document.querySelectorAll('[data-launch-form]').forEach(a=>a.addEventListener('click',ev=>{if(!(ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)){setOpen(true)}}));
  rotation.addEventListener('input',()=>{degree=Number(rotation.value);labels();requestPaint()});
  build.addEventListener('input',()=>{percent=Number(build.value);endPlay();requestPaint()});
  run.addEventListener('click',()=>{
    if(reduce.matches){percent=percent>=100?25:Math.min(100,percent+25);endPlay();requestPaint();return}
    if(playing){endPlay();requestPaint();return}
    if(percent>=100)percent=5;
    startHeight=percent;startTime=0;playing=true;labels();requestPaint();
  });
  canvas.addEventListener('pointerdown',ev=>{if(ev.button!==0||!ev.isPrimary)return;drag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,degree,active:false}});
  canvas.addEventListener('pointermove',ev=>{
    if(!drag||ev.pointerId!==drag.id)return;
    if(ev.pointerType==='mouse' && !(ev.buttons&1)){drag=null;return}
    const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;
    if(!drag.active){if(Math.abs(dy)>Math.abs(dx)+5){drag=null;return}if(Math.abs(dx)<5)return;drag.active=true;canvas.setPointerCapture(ev.pointerId)}
    degree=((drag.degree+dx*.73)%360+360)%360;labels();requestPaint();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,()=>{drag=null}));
  canvas.addEventListener('keydown',ev=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(ev.key))return;ev.preventDefault();degree=ev.key==='Home'?0:ev.key==='End'?360:(degree+(ev.key==='ArrowRight'?5:-5)+360)%360;labels();requestPaint()});
  if('ResizeObserver' in window)new ResizeObserver(requestPaint).observe(stage);else window.addEventListener('resize',requestPaint,{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;if(!onScreen&&playing)endPlay();if(onScreen)requestPaint()}).observe(section);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(playing)endPlay()}else requestPaint()});
  reduce.addEventListener?.('change',()=>{endPlay();requestPaint()});
  labels();
  if (location.hash === '#form-study') setOpen(true);
})();
