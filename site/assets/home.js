(() => {
  const stage = document.querySelector('[data-home-stage]');
  if (!stage) return;
  const works = [
    {id:'arch',name:'قوس',photo:'clay',alt:'قوس نحتي بلون ترابي دافئ يحيط بفراغ مفتوح',position:'50% 60%'},
    {id:'fold',name:'طَيّة',photo:'hero',alt:'قطعة عاجية تلتفّ طبقات سطحها في حركة حلزونية',position:'50% 52%'},
    {id:'arcade',name:'رِواق',photo:'scene',alt:'قطعة عاجية من أقواس متدرجة داخل مساحة معيشة',position:'50% 57%'}
  ];
  const image = stage.querySelector('.stage-photo');
  const link = stage.querySelector('[data-hero-link]');
  const controls = stage.querySelector('[data-hero-controls]');
  let selected=0, request=0;
  function move(offset){
    selected=(selected+offset+works.length)%works.length;
    const current=++request, w=works[selected], index=selected;
    const next=new Image();
    next.onload=()=>{
      if(request!==current) return;
      image.src=next.src; image.alt=w.alt; image.style.objectPosition=w.position;
      link.href='collection.html#'+w.id;
      stage.querySelector('[data-hero-name]').textContent=w.name;
      stage.querySelector('[data-hero-count]').textContent=String(index+1).padStart(2,'0');
    };
    next.src='assets/images/'+w.photo+'.webp';
  }
  controls.hidden=false;
  controls.querySelector('[data-home-back]').addEventListener('click',()=>move(-1));
  controls.querySelector('[data-home-next]').addEventListener('click',()=>move(1));
})();
