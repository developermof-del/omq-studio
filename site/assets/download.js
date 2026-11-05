/* Same-origin static downloads. Parts are fetched in order into one bounded buffer. */
(() => {
  'use strict';
  const by=id=>document.getElementById(id);
  const start=by('kd-start'),cancel=by('kd-cancel'),save=by('kd-save'),meter=by('kd-progress'),amount=by('kd-amount'),status=by('kd-status');
  const requested=new URLSearchParams(location.search).get('kit');
  const key=requested===null?'identity':requested;
  const info={
    identity:{title:'الهوية البصرية الكاملة',desc:'الشعار، الألوان، الخطوط، أدلة الاستخدام وتطبيقات المتجر والتغليف.'},
    social:{title:'موك أب المنصات',desc:'معاينات الحساب والمحتوى للمنصات الاثنتي عشرة، والملفات القابلة للتعديل ودليل العرض.'}
  };
  const nf=new Intl.NumberFormat('ar-SA',{maximumFractionDigits:1,minimumFractionDigits:0});
  const mb=(n)=>nf.format(n/1000000)+' م.ب.';
  if(!Object.prototype.hasOwnProperty.call(info,key)){by('kd-kit-title').textContent='اختر حزمة';status.textContent='هذا الرابط لا يحدّد حزمة معروفة. اختر إحدى الحزمتين أعلاه.';return;}
  document.querySelector('[data-choice="'+key+'"]').setAttribute('aria-current','page');
  by('kd-kit-title').textContent=info[key].title;by('kd-desc').textContent=info[key].desc;
  const kit=(window.OMQ_KITS||{})[key];
  const hasKit=kit&&Number.isSafeInteger(kit.bytes)&&kit.bytes>0&&kit.bytes<=256*1024*1024&&typeof kit.filename==='string'&&/\.zip$/i.test(kit.filename)&&typeof kit.sha256==='string'&&/^[a-f\d]{64}$/i.test(kit.sha256)&&Array.isArray(kit.parts)&&kit.parts.length&&kit.parts.every(p=>p&&Number.isSafeInteger(p.size)&&p.size>0&&typeof p.url==='string'&&/^assets\/downloads\/[\w.-]+\.bin$/.test(p.url))&&kit.parts.reduce((s,p)=>s+p.size,0)===kit.bytes;
  if(!hasKit){status.textContent='تعذّر قراءة بيانات هذه الحزمة. أعد تحميل الصفحة أو افتح أحد أدلّة PDF أدناه.';return;}
  by('kd-size').textContent=mb(kit.bytes);meter.max=kit.bytes;
  function progress(n){meter.value=n;amount.textContent=mb(n)+' / '+mb(kit.bytes);}
  progress(0);
  if(location.protocol==='file:'){status.textContent='تجهيز ZIP يحتاج إلى فتح الصفحة من موقع ويب.';by('kd-local').hidden=false;return;}
  start.disabled=false;status.textContent='جاهز لتجهيز الحزمة.';
  let job=0, controller=null, blobURL=null;
  function release(){if(blobURL){URL.revokeObjectURL(blobURL);blobURL=null;}save.removeAttribute('href');save.removeAttribute('download');save.hidden=true;}
  window.addEventListener('pagehide',e=>{if(!e.persisted){if(controller)controller.abort();release();}});
  cancel.addEventListener('click',()=>{
    ++job;if(controller)controller.abort();controller=null;release();progress(0);cancel.hidden=true;
    start.hidden=false;start.disabled=false;start.textContent='إعادة المحاولة';status.textContent='أُلغي التنزيل. يمكنك البدء من جديد.';start.focus();
  });
  save.addEventListener('click',()=>{status.textContent='إذا لم يبدأ الحفظ، اضغط «حفظ ملف ZIP» مرة أخرى.';});
  start.addEventListener('click',async()=>{
    if(controller)return;
    release();progress(0);
    const current=++job, ctl=new AbortController();
    controller=ctl;start.disabled=true;start.hidden=true;cancel.hidden=false;status.textContent='يُنقل الملف إلى المتصفح…';
    let bytes=0,paint=0;
    const isStale=()=>current!==job||ctl.signal.aborted;
    function failedIntegrity(){const e=new Error('integrity');e.code='INTEGRITY';return e;}
    function update(force){const t=performance.now();if(force||t-paint>90){progress(bytes);paint=t;}}
    try{
      const archive=new Uint8Array(kit.bytes);
      for(const part of kit.parts){
        const url=new URL(part.url,document.baseURI);
        if(url.origin!==location.origin)throw failedIntegrity();
        const res=await fetch(url.href,{signal:ctl.signal});
        if(!res.ok)throw Error('response');
        const partEnd=bytes+part.size;
        const write=chunk=>{
          if(isStale())throw new DOMException('Aborted','AbortError');
          if(bytes+chunk.byteLength>partEnd)throw failedIntegrity();
          archive.set(chunk,bytes);bytes+=chunk.byteLength;update(false);
        };
        if(res.body&&typeof res.body.getReader==='function'){
          const reader=res.body.getReader();
          try{while(true){const v=await reader.read();if(v.done)break;write(v.value);}}
          finally{reader.releaseLock();}
        }else{write(new Uint8Array(await res.arrayBuffer()));}
        if(bytes!==partEnd)throw failedIntegrity();
        update(true);
      }
      if(bytes!==kit.bytes||archive[0]!==0x50||archive[1]!==0x4b)throw failedIntegrity();
      if(isStale())return;
      const canDigest=Boolean(window.crypto&&crypto.subtle&&crypto.subtle.digest);
      if(canDigest){
        status.textContent='اكتمل النقل. جارٍ التحقق من سلامة الملف…';
        const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',archive));
        const hex=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
        if(hex!==kit.sha256.toLowerCase())throw failedIntegrity();
      }
      if(isStale())return;
      blobURL=URL.createObjectURL(new Blob([archive],{type:'application/zip'}));
      save.href=blobURL;save.download=kit.filename;save.hidden=false;cancel.hidden=true;
      status.textContent=canDigest?'اكتمل التنزيل وتطابقت بصمة الملف. اضغط للحفظ إلى جهازك.':'اكتمل التنزيل وتطابق الحجم. لا يدعم هذا المتصفح فحص البصمة هنا؛ اضغط للحفظ إلى جهازك.';
      save.focus();
    }catch(err){
      if(isStale())return;
      ctl.abort();release();cancel.hidden=true;start.hidden=false;start.disabled=false;start.textContent='إعادة المحاولة';
      status.textContent=err&&err.code==='INTEGRITY'?'لم تجتز الحزمة فحص السلامة؛ لم يُجهّز ملف للحفظ. أعد المحاولة.':'تعذّر إكمال التنزيل. تحقق من الاتصال ثم أعد المحاولة، أو افتح دليل PDF أدناه.';
      start.focus();
    }finally{if(current===job)controller=null;}
  });
})();
