(() => {
  'use strict';
  const section = document.querySelector('[data-material-lab]');
  if (!section || !window.CSS || !CSS.supports('clip-path','inset(0 50% 0 0)')) return;
  const stage = section.querySelector('[data-lab-stage]');
  const controls = section.querySelector('[data-lab-controls]');
  const range = section.querySelector('#lab-range');
  const valueLabel = section.querySelector('[data-lab-value]');
  const divider = section.querySelector('.lab-divider');
  const detail = stage.querySelector('.lab-detail');
  const wide = stage.querySelector('.lab-wide');
  const presets = Array.from(section.querySelectorAll('[data-lab-preset]'));
  if (!stage || !range || !controls || !valueLabel || !divider || !wide || !detail) return;

  const fmt = new Intl.NumberFormat('ar-SA');
  function show(raw) {
    const n = Math.max(0,Math.min(100,Math.round(Number(raw))));
    range.value = n;
    stage.style.setProperty('--lab-pos', n+'%');
    range.style.setProperty('--lab-pos', n+'%');
    valueLabel.textContent = fmt.format(n)+'٪';
    range.setAttribute('aria-valuetext',n===0?'القطعة كاملة':n===100?'لقطة الملمس كاملة':fmt.format(n)+' في المئة من لقطة الملمس');
    presets.forEach(button => button.setAttribute('aria-pressed',String(Number(button.dataset.labPreset)===n)));
    detail.toggleAttribute('data-hide-chip',n<27);
    wide.toggleAttribute('data-hide-chip',n>73);
    stage.toggleAttribute('data-edge', n===0 || n===100);
  }
  range.addEventListener('input',() => show(range.value));
  presets.forEach(btn => btn.addEventListener('click',() => show(btn.dataset.labPreset)));
  // The photo is a direct-manipulation surface. Vertical touch scrolling and pinch
  // zoom stay with the browser. A real native range gives keyboard/AT the same control.
  if ('PointerEvent' in window) {
    let gesture;
    function at(x) { const r=stage.getBoundingClientRect();if(r.width) show((x-r.left)*100/r.width); }
    stage.addEventListener('pointerdown',e=>{
      if(!e.isPrimary || e.button!==0) {gesture=null;return;}
      gesture={id:e.pointerId,x:e.clientX,y:e.clientY,horizontal:e.pointerType==='mouse'};
      if(gesture.horizontal){stage.setPointerCapture(e.pointerId);at(e.clientX);}
    });
    stage.addEventListener('pointermove',e=>{
      if(!gesture || e.pointerId!==gesture.id) return;
      if(!gesture.horizontal){
        const dx=Math.abs(e.clientX-gesture.x),dy=Math.abs(e.clientY-gesture.y);
        if(dy>6 && dy>=dx){gesture=null;return;}
        if(dx<6) return;
        stage.setPointerCapture(e.pointerId);gesture.horizontal=true;
      }
      at(e.clientX);
    });
    stage.addEventListener('pointerup',e=>{
      if(!gesture || e.pointerId!==gesture.id)return;
      if (gesture.horizontal || Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<7) at(e.clientX);
      gesture=null;
    });
    stage.addEventListener('pointercancel',() => {gesture=null;});
    stage.addEventListener('lostpointercapture',() => {gesture=null;});
  }
  show(50);section.classList.add('lab-ready');divider.hidden=false;controls.hidden=false;
})();
