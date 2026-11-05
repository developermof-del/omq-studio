"""Validate local URLs, element targets, both content archives and the project's portable deployment."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json,re,hashlib
root=Path(__file__).resolve().parents[1]/'site'
class Parser(HTMLParser):
 def __init__(self):super().__init__(); self.urls=[]; self.ids=set();self.errors=[];self.rtl=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='html':self.rtl=a.get('lang')=='ar' and a.get('dir')=='rtl'
  if a.get('id'):
   if a['id'] in self.ids:self.errors.append('duplicate id: '+a['id'])
   self.ids.add(a['id'])
  if tag=='img' and 'alt' not in a:self.errors.append('image without alt: '+str(a.get('src')))
  for u in ['href','src','poster']: 
   if a.get(u): self.urls.append(a[u])
pages={p:Parser() for p in root.glob('*.html')}
errors=[]
for p,v in pages.items():
 v.feed(p.read_text());errors.extend(str(p.name)+': '+x for x in v.errors)
 if not v.rtl:errors.append(p.name+' missing Arabic RTL')
for p,pg in pages.items():
 for raw in pg.urls:
  u=urlsplit(raw);uri=unquote(u.path)
  if u.scheme or u.netloc:continue
  if uri.startswith('/'):errors.append(p.name+' breaks project Pages subpath: '+raw);continue
  target=(p.parent/(uri or p.name)).resolve()
  if not target.is_file():errors.append(p.name+' missing '+raw)
  elif target in pages and u.fragment and u.fragment not in pages[target].ids:errors.append(p.name+' missing anchor '+raw)
for p in (root/'assets').glob('*.css'):
 for url in re.findall(r'url\(\s*["\']?([^)"\']+)["\']?\s*\)',p.read_text()):
  if ':' not in url and not (p.parent/url).is_file():errors.append(p.name+' missing CSS asset '+url)
kits=json.loads((root/'assets/kit-index.js').read_text().split('=',1)[1].rstrip(';\n'))
for id,item in kits.items():
 dig=hashlib.sha256();total=0
 for part in item['parts']:
  p=root/part['url']; data=p.read_bytes()
  if len(data)!=part['size']:errors.append('wrong part size '+p.name)
  dig.update(data);total+=len(data)
 if dig.hexdigest()!=item['sha256'] or total!=item['bytes']:errors.append('kit does not match '+id)
if errors:raise SystemExit('\n'.join(errors))
print(f'{len(pages)} Arabic pages; local references, hash destinations and complete archive checksums verified.')
