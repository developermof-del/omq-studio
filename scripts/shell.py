"""Render the accessible shared navigation into plain HTML. No runtime include required."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]/'site'
pages=[('index.html','الرئيسية'),('collection.html','الأعمال'),('brand.html','دليل الهوية'),('platforms.html','المنصات')]
for p in root.glob('*.html'):
 if p.name=='404.html':continue
 def nav(cur):return ''.join('<a href="'+path+'"'+(' aria-current="page"' if cur and p.name==path else '')+'>'+label+'</a>' for path,label in pages)
 h=f'''<header data-header><a class="omq-skip" href="#main">تخطَّ إلى المحتوى</a><div class="omq-nav-shell"><a class="omq-word" href="index.html" aria-label="عُمق، الصفحة الرئيسية"><img src="assets/logo-primary.svg" width="79" height="48" alt="عُمق"><small dir="ltr" lang="en">OMQ<br>STUDIO</small></a><button class="omq-toggle" data-menu-toggle aria-controls="main-nav" aria-expanded="false"><span aria-hidden="true">☰</span> القائمة</button><nav class="omq-menu" id="main-nav" aria-label="التصفح الرئيسي">{nav(True)}</nav><a class="omq-dl" href="brand.html#downloads">ملفات الهوية <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg></a></div></header>'''
 f=f'''<footer data-footer class="omq-footer"><div class="omq-footer-inside"><div class="omq-foot-brand"><a href="index.html" aria-label="عُمق، الرئيسية"><img class="omq-foot-mark" src="assets/logo-reverse.svg" width="78" height="43" alt="عُمق"></a><p>فكرة تأخذ شكلًا.</p></div><nav aria-label="روابط التذييل">{nav(False)}</nav></div><div class="omq-foot-base"><span>استوديو عُمق للفن والتصميم</span><span lang="en" dir="ltr">OMQ STUDIO · ART &amp; OBJECTS</span></div></footer>'''
 s=p.read_text();s,n=re.subn(r'<header\b(?=[^>]*data-header)[^>]*>.*?</header>',lambda _:h,s,count=1,flags=re.S);assert n,p
 s,n=re.subn(r'<footer\b(?=[^>]*data-footer)[^>]*>.*?</footer>',lambda _:f,s,count=1,flags=re.S);assert n,p
 p.write_text(s)
