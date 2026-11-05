/* Local Arabic site index: every URL is a relative, editorially curated destination. */
(()=>{'use strict';
const trigger=document.querySelector('[data-compass-open]'),badge=document.querySelector('[data-favorite-badge]'),saveLink=document.querySelector('.omq-saves-link');
function updateBadge(value){let vals=value;try{if(!Array.isArray(vals))vals=JSON.parse(localStorage.getItem('omq.favorites.v1')||'[]')}catch{vals=[]}
 const n=new Set((Array.isArray(vals)?vals:[]).filter(x=>['fold','arch','arcade'].includes(x))).size;
 if(badge){badge.textContent=n?String(n):'';badge.hidden=!n}if(saveLink)saveLink.setAttribute('aria-label',n?'الأعمال المحفوظة ('+n+')':'الأعمال المحفوظة')}
updateBadge();window.addEventListener('omq:favorites',e=>updateBadge(e.detail));window.addEventListener('pageshow',()=>updateBadge());window.addEventListener('storage',e=>{if(e.key==='omq.favorites.v1')updateBadge()});
if(!trigger || !('HTMLDialogElement' in window))return;
const rows=[
 ['استوديو الطباعة','أدوات الطباعة','fabrication.html','طباعة مجسم 3d ثلاثية الأبعاد'],
 ['قارن بين الأعمال','مجموعة الاستوديو','collection.html?compare=fold,arch','مقارنة قطعة قطعتين شكل'],
 ['دليل الهوية البصرية','دليل الهوية','brand.html','العلامة البراند brand دليل رسومي'],
 ['عرض المنصات الاجتماعية','تطبيقات الهوية','platforms.html','منصات حسابات سوشال social موك اب'],
 ['طَيّة','عمل / تكوين حلزوني','collection.html#fold','طية طيه fold منحنى لولبي حلزوني'],
 ['قوس','عمل / تكوين مفتوح','collection.html#arch','قوس اقواس arch ترابي برتقالي'],
 ['رِواق','عمل / أقواس متتابعة','collection.html#arcade','رواق arcade اقواس عاجي'],
 ['كل الأعمال','مجموعة الاستوديو','collection.html','معرض مجموعة الكتالوج'],
 ['أعمالي المحفوظة','قائمتك على الجهاز','collection.html?view=saved','مفضلة حفظ bookmark قائمة'],
 ['عارض ملفات STL','أداة محلية','fabrication.html#viewer','ملفي رفع فحص ابعاد مجسم عارض stl mesh'],
 ['تنزيل عيّنة الطباعة','ملف STL','fabrication.html#print-files','تحميل ملف للطابعة نموذج عينة الدرج عينة عمق للطباعة stl'],
 ['مختبر الملمس','تجربة تفاعلية','index.html#material-lab','صورة قريبة مقارنة ملمس طية تكبير'],
 ['جرّب بناء الطبقات','تجربة تفاعلية','index.html#form-study','نموذج تدوير طبقات تشكيل محاكاة ارتفاع'],
 ['الشعار ونسخه','دليل الهوية','brand.html#signature','svg لوقو لوجو شكل العلامة تحميل شعار'],
 ['الألوان والخطوط','دليل الهوية','brand.html#color','hex rgb cmyk لون الوان خط فونت typography'],
 ['حركة شعار عُمق','فيديو الهوية','brand.html#motion','انميشن انيميشن فيديو 4k شفاف animation mov mp4'],
 ['التغليف وبطاقة العناية','تطبيقات الهوية','brand.html#applications','علبة ملصق سلة متجر بطاقة تغليف صندوق عناية شكر'],
 ['حزمة الهوية الكاملة','تنزيل ZIP','download.html?kit=identity','تحميل تنزيل شعار ارشادات فاتورة الملفات zip'],
 ['نماذج منصات التواصل','تنزيل ZIP','download.html?kit=social','تحميل تنزيل social قوالب موك اب انستقرام zip']
];
const platforms=[['إنستقرام','instagram','انستغرام انستجرام'],['تيك توك','tiktok','تيكتوك'],['سناب شات','snapchat','سنابشات'],['يوتيوب','youtube','شورتس'],['إكس','x','تويتر twitter'],['ثريدز','threads','ثريدس'],['فيسبوك','facebook','فيس بوك'],['لينكدإن','linkedin','لينكدان'],['بنترست','pinterest','بينترست'],['بيهانس','behance','بهانس'],['واتساب للأعمال','whatsapp','واتس اب كتالوج'],['تليجرام','telegram','تلغرام تيليجرام']];
for(const [n,slug,more] of platforms)rows.push([n,'معاينة منصة','platforms.html#'+slug,slug+' '+more]);
const norm=x=>x.normalize('NFKD').toLowerCase().replace(/[\u0610-\u061a\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
const all=rows.map(r=>({title:r[0],group:r[1],url:r[2],key:norm(r.join(' ')),name:norm(r[0])}));
const dlg=document.createElement('dialog');dlg.className='ocp-dialog';dlg.setAttribute('aria-labelledby','ocp-title');
dlg.innerHTML='<div class="ocp-inner"><div class="ocp-top"><div><span class="ocp-eyebrow" lang="en" dir="ltr">OMQ / INDEX</span><h2 id="ocp-title">ابحث في عُمق</h2></div><button type="button" class="ocp-close" aria-label="إغلاق البحث">×</button></div><label class="ocp-entry"><svg class="ocp-search-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="كلمة البحث" placeholder="اسم قطعة، ملف طباعة، لون…" autocomplete="off"></label><p class="ocp-summary" role="status" aria-live="polite"></p><ul class="ocp-results"></ul><p class="ocp-empty" hidden>جرّب اسم قطعة مثل «طَيّة»، أو ابحث عن «الشعار» أو «الطباعة».</p><div class="ocp-key">استخدم الأسهم للتنقل بين النتائج، وEsc لإغلاق البحث.</div></div>';document.body.append(dlg);
const input=dlg.querySelector('input'),list=dlg.querySelector('ul'),summary=dlg.querySelector('.ocp-summary'),empty=dlg.querySelector('.ocp-empty');
function render(){const query=norm(input.value.trim()),tokens=query.split(/\s+/).filter(Boolean);const results=tokens.length?all.filter(e=>tokens.every(t=>e.key.includes(t))).sort((a,b)=>Number(b.name.startsWith(query))-Number(a.name.startsWith(query))||Number(b.name.includes(query))-Number(a.name.includes(query))):all.slice(0,4);
 list.replaceChildren();for(const e of results.slice(0,12)){const li=document.createElement('li'),a=document.createElement('a'),title=document.createElement('strong'),group=document.createElement('span');a.href=e.url;a.className='ocp-result';title.textContent=e.title;group.className='ocp-meta';group.textContent=e.group+'  ←';a.append(title,group);li.append(a);list.append(li)}
 summary.textContent=tokens.length?(results.length>12?'أول ١٢ نتيجة من '+results.length:'عدد النتائج: '+results.length):'وجهات مقترحة';empty.hidden=!!results.length}
let opener;
function open(){if(dlg.open)return;opener=document.activeElement;input.value='';render();dlg.showModal();input.focus()}
trigger.hidden=false;trigger.addEventListener('click',open);dlg.querySelector('.ocp-close').addEventListener('click',()=>dlg.close());dlg.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true})});dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});list.addEventListener('click',e=>{if(e.target.closest('a'))dlg.close()});input.addEventListener('input',render);
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&!e.altKey&&e.key.toLowerCase()==='k'){e.preventDefault();if(!dlg.open && !document.querySelector('dialog[open]'))open();else if(dlg.open)input.focus()}});
dlg.addEventListener('keydown',e=>{const links=[...list.querySelectorAll('a')],n=links.indexOf(document.activeElement);if(e.key==='ArrowDown'&&links.length){e.preventDefault();links[(n+1)%links.length].focus()}else if(e.key==='ArrowUp'&&links.length){e.preventDefault();if(n<1)input.focus();else links[n-1].focus()}else if(e.key==='Enter'&&document.activeElement===input&&links.length){e.preventDefault();links[0].click()}});
})();
