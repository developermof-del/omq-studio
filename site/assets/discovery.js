/* OMQ — an on-device notebook for the three published visual studies. */
(() => {
  'use strict';
  const root=document.querySelector('[data-catalog]'),mount=document.querySelector('#od-explore'),empty=document.querySelector('#od-empty');
  if(!root||!mount||!empty)return;
  const cards=[...root.querySelectorAll('[data-card]')], count=root.querySelector('#catalog-count'), formGroup=root.querySelector('.oc-filter-group');
  const field = {
    fold:{name:'طَيّة',en:'FOLD',image:'hero',keys:'طية طيات حلزون حلزوني منحنى انحناءات خطوط ملتفة طبقات أبيض عاجي fold spiral ivory curves',features:['طيّة تلتفّ صعودًا','فتحة في مركز الجسم','عاجي يظهر في الضوء الجانبي','خطوط طبقية دقيقة تتبع الانحناء']},
    arch:{name:'قوس',en:'ARCH',image:'clay',keys:'قوس أقواس منحنى مفتوح فتحة ترابي برتقالي طيني فخاري arch clay terracotta orange',features:['قوس غير متناظر','فتحة واحدة بين الجانبين','ترابيّ دافئ','حافة داخلية تتغيّر سماكتها']},
    arcade:{name:'رِواق',en:'ARCADE',image:'scene',keys:'رواق أقواس قوس متدرج متكرر طبقات تدرج فراغ ظل أبيض عاجي arcade arch nested ivory arches',features:['أقواس تتناقص نحو الداخل','فراغات بين المستويات','عاجي تتدرّج عليه الظلال','تتابع الحواف يرسم عمق السطح']}
  };
  const slugs=Object.keys(field),fields=['بنية الشكل','أين يظهر الفراغ؟','اللون في الصورة','ما الذي يميّز السطح؟'];
  const nf=new Intl.NumberFormat('ar-SA'), key='omq.favorites.v1', valid=v=>slugs.includes(v);
  const sm = {
    search:'<circle cx="10" cy="10" r="6.7"/><path d="m15.1 15.1 5.6 5.6"/>',
    bookmark:'<path d="M6.3 3.8h11.4v16.4L12 16.5l-5.7 3.7z"/>',
    compare:'<rect x="3.6" y="5.7" width="6.8" height="12.6" rx="1.6"/><rect x="13.6" y="5.7" width="6.8" height="12.6" rx="1.6"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    share:'<path d="M14 4h6v6m0-6-9 9"/><path d="M11 6H5v14h14v-6"/>'
  };
  function ico(k){return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+sm[k]+'</svg>'}
  const norm=s=>String(s||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0610-\u061A\u0640]/g,'').replace(/[إأٱآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLowerCase();
  const indexes=Object.fromEntries(slugs.map(id=>[id,norm([field[id].name,field[id].keys,...field[id].features].join(' '))]));
  const readUrl=()=>new URL(location.href);
  function replaceParameters(fn){const url=readUrl();fn(url.searchParams);if(url.href!==location.href){try{history.replaceState(history.state,'',url)}catch(_){}}}
  let persistent=true;
  function readFav(){try{const raw=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(raw)?raw.filter(valid):[])}catch(_){return new Set()}}
  let favorites=readFav(), savedView=readUrl().searchParams.get('view')==='saved';
  const favoriteButtons=new Map(slugs.map(s=>[s,[]]));
  mount.innerHTML='<div class="od-query"><label class="od-query-label" for="od-search">ابحث في الأعمال</label><div class="od-input">'+ico('search')+'<input id="od-search" type="search" dir="auto" maxlength="120" autocomplete="off" placeholder="باسم القطعة أو شكلها أو لونها"><button type="button" class="od-clear" id="od-clear" aria-label="مسح البحث" hidden>'+ico('close')+'</button></div></div><div class="od-access"><button class="od-view" type="button" id="od-saved" aria-pressed="false">'+ico('bookmark')+'<span>المحفوظات</span><b id="od-total">٠</b></button><button class="od-compare-link" type="button" id="od-compare" aria-haspopup="dialog">'+ico('compare')+'<span>قارن الأعمال</span></button></div>';
  empty.innerHTML='<span class="oc-mono" lang="en" dir="ltr">OBJECT INDEX / 00</span><h2 id="od-empty-title"></h2><p></p><button type="button" class="od-reset">عرض كل الأعمال <span aria-hidden="true">←</span></button>';
  const live=document.createElement('p');live.className='od-sr';live.setAttribute('role','status');live.setAttribute('aria-live','polite');root.after(live);
  const search=mount.querySelector('#od-search'),clear=mount.querySelector('#od-clear'),saved=mount.querySelector('#od-saved'),compareButton=mount.querySelector('#od-compare'),favCount=mount.querySelector('#od-total');
  saved.title='الأعمال التي حفظتها على هذا الجهاز';
  search.value=(readUrl().searchParams.get('q')||'').slice(0,120);
  const urlSlugs=()=>[...new Set((readUrl().searchParams.get('compare')||'').split(',').filter(valid))].slice(0,3);
  let selection=[],dialog=null,opener=null;
  function syncFavButtons(){
    for(const id of slugs)for(const b of favoriteButtons.get(id)){
      const on=favorites.has(id);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',(on?'إزالة ':'حفظ ')+field[id].name+(on?' من المحفوظات':' في المحفوظات'));b.querySelector('span').textContent=on?'محفوظة':'حفظ';
    }
    favCount.textContent=nf.format(favorites.size);saved.setAttribute('aria-pressed',String(savedView));
  }
  function filter(){
    const category=formGroup.querySelector('[aria-pressed="true"]')?.dataset.filter||'all';
    const tokens=norm(search.value).split(/\s+/).filter(Boolean).map(t=>t.length>3?t.replace(/^ال/,''):t);
    let total=0;
    for(const c of cards){
      const id=c.dataset.card,ok=(category==='all'||category===c.dataset.type)&&(!savedView||favorites.has(id))&&tokens.every(t=>indexes[id].includes(t));
      c.hidden=!ok;if(ok)total++;
    }
    clear.hidden=!search.value; count.textContent=['لا توجد دراسات','دراسة واحدة','دراستان','٣ دراسات'][total];
    empty.hidden=!!total;
    if(total===0){
      const noneSaved=savedView&&!favorites.size;
      empty.querySelector('h2').textContent=noneSaved?'لم تحفظ أي قطعة بعد.':'لا توجد قطعة بهذه المواصفات.';
      empty.querySelector('p').textContent=noneSaved?'اضغط «حفظ» بجانب العمل ليبقى في قائمتك على هذا الجهاز.':'جرّب اسمًا آخر، أو اعرض المجموعة من دون تصفية.';
    }
  }
  function setFavorite(id,b){
    const on=!favorites.has(id);if(on)favorites.add(id);else favorites.delete(id);
    try{localStorage.setItem(key,JSON.stringify([...favorites]));persistent=true;}catch(_){persistent=false;}
    window.dispatchEvent(new CustomEvent('omq:favorites',{detail:[...favorites]}));
    syncFavButtons();filter();
    if(b&&b.closest('[data-card]')?.hidden)saved.focus({preventScroll:true});
    live.textContent=(on?'أُضيفت '+field[id].name+' إلى المحفوظات.':'أُزيلت '+field[id].name+' من المحفوظات.')+(!persistent?' الحفظ متاح في هذه الجلسة فقط.':'');
  }
  function actions(id,detail=false){
    const div=document.createElement('div');div.className='od-card-actions'+(detail?' od-detail-actions':'');
    const save=document.createElement('button');save.type='button';save.className='od-fave';save.innerHTML=ico('bookmark')+'<span>حفظ</span>';
    favoriteButtons.get(id).push(save);save.addEventListener('click',()=>setFavorite(id,save));
    div.append(save);
    if(!detail){const cmp=document.createElement('button');cmp.type='button';cmp.className='od-card-compare';cmp.setAttribute('aria-label','مقارنة '+field[id].name+' بعمل آخر');cmp.setAttribute('aria-haspopup','dialog');cmp.innerHTML=ico('compare')+'<span>مقارنة</span>';cmp.addEventListener('click',()=>openCompare([id,slugs.find(s=>s!==id)],cmp));div.append(cmp);}
    return div;
  }
  cards.forEach(c=>c.append(actions(c.dataset.card)));slugs.forEach(id=>document.getElementById(id)?.querySelector('.oc-facts')?.after(actions(id,true)));
  // Native form buttons keep owning form=; this enhancement composes its own criteria afterwards.
  formGroup.addEventListener('click',filter);
  search.addEventListener('input',()=>{replaceParameters(p=>{if(search.value.trim())p.set('q',search.value.trim());else p.delete('q')});filter()});
  clear.addEventListener('click',()=>{search.value='';replaceParameters(p=>p.delete('q'));filter();search.focus()});
  saved.addEventListener('click',()=>{savedView=!savedView;replaceParameters(p=>{if(savedView)p.set('view','saved');else p.delete('view')});syncFavButtons();filter()});
  empty.querySelector('button').addEventListener('click',()=>{
    search.value='';savedView=false;
    const all=formGroup.querySelector('[data-filter="all"]');all.click();replaceParameters(p=>{p.delete('q');p.delete('view');p.delete('form')});
    syncFavButtons();filter();search.focus();
  });
  function restoreFromURL(){
    savedView=readUrl().searchParams.get('view')==='saved';search.value=(readUrl().searchParams.get('q')||'').slice(0,120);
    syncFavButtons();filter();
    if(valid(location.hash.slice(1))){if(dialog?.open)dialog.close();return}
    const ids=urlSlugs();if(ids.length>=2&&!dialog?.open)openCompare(ids,compareButton,false);else if(ids.length<2&&dialog?.open)dialog.close();
  }
  window.addEventListener('storage',e=>{if(e.key===key||e.key===null){favorites=readFav();syncFavButtons();filter()}});
  window.addEventListener('popstate',restoreFromURL);window.addEventListener('hashchange',restoreFromURL);
  // Original in-page renderer also uses pushState for card and detail navigation.
  document.addEventListener('click',e=>{if(e.target.closest('a[href^="#"],a[data-back-collection]'))queueMicrotask(filter)});
  function drawTable(){
    const table=dialog.querySelector('.od-table'), num=selection.length;
    const picker=dialog.querySelector('.od-picker');
    for(const b of picker.querySelectorAll('button'))b.setAttribute('aria-pressed',String(selection.includes(b.dataset.id)));
    dialog.querySelector('.od-dialog-summary').textContent=num<2?'اختر قطعةً ثانية لإظهار المقارنة.':num===2?'تُعرض قطعتان جنبًا إلى جنب.':'تُعرض القطع الثلاث جنبًا إلى جنب.';
    dialog.querySelector('.od-share').disabled=num<2;
    if(num<2){table.hidden=true;table.replaceChildren();return}table.hidden=false;
    const heads=selection.map(id=>'<th id="od-col-'+id+'" scope="col"><img alt="" decoding="async" src="assets/images/'+field[id].image+'.webp"><span>'+field[id].name+'</span><small dir="ltr" lang="en">'+field[id].en+'</small></th>').join('');
    const body=fields.map((name,i)=>'<tbody><tr class="od-table-label"><th scope="rowgroup" colspan="'+num+'" id="od-row-'+i+'">'+name+'</th></tr><tr>'+selection.map(id=>'<td headers="od-row-'+i+' od-col-'+id+'">'+field[id].features[i]+'</td>').join('')+'</tr></tbody>').join('');
    table.innerHTML='<caption class="od-sr">مقارنة بصرية بين '+selection.map(id=>field[id].name).join(' و')+'</caption><thead><tr>'+heads+'</tr></thead>'+body;
  }
  function syncCompareURL(){
    replaceParameters(p=>{if(selection.length>=2)p.set('compare',selection.join(','));else p.delete('compare')});
  }
  function ensureDialog(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='od-compare-sheet';dialog.className='od-dialog';dialog.setAttribute('aria-labelledby','od-dialog-title');
    dialog.innerHTML='<div class="od-modal-top"><div><span class="od-rule"></span><small lang="en" dir="ltr">STUDIO / SIDE BY SIDE</small></div><button type="button" class="od-close" aria-label="إغلاق المقارنة">'+ico('close')+'</button></div><div class="od-modal-body"><h2 id="od-dialog-title">مقارنة الأعمال<span aria-hidden="true">.</span></h2><p class="od-deck">اختر قطعتين أو ثلاثًا لتقارن الشكل والفراغ وأثر الضوء.</p><div class="od-picker" role="group" aria-label="القطع التي تشملها المقارنة"></div><p class="od-dialog-summary" role="status"></p><table class="od-table"></table><div class="od-modal-end"><span>قراءة بصرية للصور التوضيحية.</span><button type="button" class="od-share">'+ico('share')+'<span>نسخ رابط المقارنة</span></button></div><p class="od-copy-state" role="status"></p><input class="od-share-manual" aria-label="رابط المقارنة للنسخ" readonly hidden dir="ltr"></div>';
    document.body.append(dialog);
    for(const id of slugs){
      const b=document.createElement('button');b.type='button';b.dataset.id=id;b.textContent=field[id].name;b.addEventListener('click',()=>{
        if(selection.includes(id))selection=selection.filter(k=>k!==id);else selection.push(id);
        drawTable();syncCompareURL();dialog.querySelector('.od-copy-state').textContent='';dialog.querySelector('.od-share-manual').hidden=true;
      });dialog.querySelector('.od-picker').append(b);
    }
    dialog.querySelector('.od-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close()}});
    dialog.addEventListener('close',()=>{
      document.documentElement.classList.remove('od-lock');
      // Keep the browser Back stack intact for deep-linked sessions and avoid new history entries.
      replaceParameters(p=>p.delete('compare'));
      if(opener&&!root.hidden&&opener.isConnected&&opener.getClientRects().length)opener.focus({preventScroll:true});
    });
    dialog.querySelector('.od-share').addEventListener('click',async()=>{
      if(selection.length<2)return;
      const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('compare',selection.join(','));
      const m=dialog.querySelector('.od-share-manual'),state=dialog.querySelector('.od-copy-state');m.hidden=true;
      try{if(!navigator.clipboard?.writeText)throw 0;await navigator.clipboard.writeText(u.href);state.textContent='نُسخ رابط المقارنة.';}
      catch(_){m.value=u.href;m.hidden=false;m.focus();m.select();state.textContent='الرابط جاهز للنسخ.';}
    });
  }
  function openCompare(ids,anchor,write=true){
    if(!('HTMLDialogElement' in window)||typeof HTMLDialogElement.prototype.showModal!=='function')return;
    ensureDialog();opener=anchor;selection=[...new Set(ids.filter(valid))].slice(0,3);drawTable();
    dialog.querySelector('.od-copy-state').textContent='';dialog.querySelector('.od-share-manual').hidden=true;
    if(write)syncCompareURL();
    if(!dialog.open){dialog.showModal();document.documentElement.classList.add('od-lock');dialog.querySelector('.od-close').focus({preventScroll:true});}
  }
  if(!('HTMLDialogElement' in window)||typeof HTMLDialogElement.prototype.showModal!=='function'){
    compareButton.hidden=true;document.querySelectorAll('.od-card-compare').forEach(b=>b.hidden=true);
  }else compareButton.addEventListener('click',()=>{const ids=cards.filter(c=>!c.hidden).map(c=>c.dataset.card);openCompare(ids.length>=2?ids.slice(0,2):ids.length===1?[ids[0],slugs.find(id=>id!==ids[0])]:['fold','arch'],compareButton)});
  mount.hidden=false;syncFavButtons();filter();
  if(!valid(location.hash.slice(1))&&urlSlugs().length>=2&&!compareButton.hidden)openCompare(urlSlugs(),compareButton,false);
})();
