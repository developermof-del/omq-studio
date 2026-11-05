"""Render the accessible shared navigation into plain HTML. No runtime include required."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]/'site'
pages=[('index.html','الرئيسية'),('collection.html','الأعمال'),('fabrication.html','استوديو الطباعة'),('brand.html','دليل الهوية'),('platforms.html','المنصات')]
for p in root.glob('*.html'):
 if p.name=='404.html':continue
 def nav(cur):return ''.join('<a href="'+path+'"'+(' aria-current="page"' if cur and p.name==path else '')+'>'+label+'</a>' for path,label in pages)
 h=f'''<header data-header><a class="omq-skip" href="#main">تخطَّ إلى المحتوى</a><div class="omq-nav-shell"><a class="omq-word" href="index.html" aria-label="عُمق، الصفحة الرئيسية"><img src="assets/logo-primary.svg" width="79" height="48" alt="عُمق"><small dir="ltr" lang="en">OMQ<br>STUDIO</small></a><button class="omq-toggle" data-menu-toggle aria-controls="main-nav" aria-expanded="false"><span aria-hidden="true">☰</span> القائمة</button><nav class="omq-menu" id="main-nav" aria-label="التصفح الرئيسي">{nav(True)}</nav><div class="omq-head-tools"><a class="omq-saves-link" href="collection.html?view=saved" aria-label="الأعمال المحفوظة" title="الأعمال المحفوظة"><svg width="20" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-4-6 4z"/></svg><span data-favorite-badge hidden></span></a><button type="button" class="omq-search-trigger" aria-label="ابحث في الموقع" aria-haspopup="dialog" data-compass-open hidden><svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>بحث</span></button></div></div></header>'''
 f=f'''<footer data-footer class="omq-footer"><div class="omq-footer-inside"><div class="omq-foot-brand"><a href="index.html" aria-label="عُمق، الرئيسية"><img class="omq-foot-mark" src="assets/logo-reverse.svg" width="78" height="43" alt="عُمق"></a><p>فكرة تأخذ شكلًا.</p></div><nav aria-label="روابط التذييل">{nav(False)}</nav></div><div class="omq-foot-base"><span>استوديو عُمق للفن والتصميم</span><span lang="en" dir="ltr">OMQ STUDIO · ART &amp; OBJECTS</span></div></footer>'''
 s=p.read_text();s,n=re.subn(r'<header\b(?=[^>]*data-header)[^>]*>.*?</header>',lambda _:h,s,count=1,flags=re.S);assert n,p
 s,n=re.subn(r'<footer\b(?=[^>]*data-footer)[^>]*>.*?</footer>',lambda _:f,s,count=1,flags=re.S);assert n,p
 if 'href="assets/compass.css"' not in s:s=s.replace('</head>','<link rel="stylesheet" href="assets/compass.css"><script defer src="assets/compass.js"></script></head>')
 p.write_text(s)
