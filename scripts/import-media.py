"""Import only known public media from the OMQ studio mirror. Requires Python 3.9+."""
import concurrent.futures, hashlib, json, os, re, shutil, subprocess, tempfile, time
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, HTTPRedirectHandler, build_opener

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://omq-form-studies.surprisingherb1.chatgpt.site/"
def valid_url(url):
    p = urlsplit(url)
    return p.scheme == "https" and p.netloc == urlsplit(ORIGIN).netloc and p.path.startswith("/assets/") and not p.query and not p.fragment

class MirrorOnly(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not valid_url(newurl):
            raise ValueError("Unexpected redirect outside studio media")
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def valid(spec):
    p = spec['path']
    if not re.fullmatch(r'site/assets/(?:[a-zA-Z0-9_-]+/)*[a-zA-Z0-9_-]+\.(?:png|woff|webp|pdf|zip|bin|mp4)',p): raise ValueError('Unexpected path')
    if not re.fullmatch('[0-9a-f]{64}',spec['sha256']) or not 0 < spec['size'] <= 12*1024**2: raise ValueError('Unexpected metadata')
    if (ROOT / p).resolve()!=ROOT / p: raise ValueError('Symbolic links are not import targets')
    return p

def fingerprint(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(262144),b''): h.update(b)
    return h.hexdigest()

def retrieve(spec, scratch):
    key=valid(spec); final=ROOT/key
    if final.exists():
        if final.stat().st_size==spec['size'] and fingerprint(final)==spec['sha256']: return
        raise RuntimeError('Existing file differs: '+key)
    target=scratch/key
    target.parent.mkdir(parents=True,exist_ok=True)
    for attempt in range(3):
        try:
            req=Request(ORIGIN + key[5:],headers={'User-Agent':'OMQ-site-asset-import/1','Accept-Encoding':'identity'})
            with build_opener(MirrorOnly).open(req,timeout=40) as resp, target.open('wb') as f:
                if resp.status!=200 or not valid_url(resp.geturl()): raise RuntimeError('Unexpected mirror response: '+key)
                h=hashlib.sha256(); count=0
                for b in iter(lambda:resp.read(262144),b''):
                    count+=len(b)
                    if count>spec['size']: raise RuntimeError('Exceeded verified asset size: '+key)
                    f.write(b); h.update(b)
            if count!=spec['size'] or h.hexdigest()!=spec['sha256']: raise RuntimeError('Incorrect asset checksum: '+key)
            return
        except (URLError,TimeoutError,ConnectionError,HTTPError):
            if attempt==2: raise
            time.sleep(2**attempt)

def main():
    rows=json.loads((ROOT/'scripts/media-manifest.json').read_text())
    if len({valid(x) for x in rows})!=len(rows) or sum(x['size'] for x in rows)>150*1024**2: raise ValueError("Invalid manifest")
    with tempfile.TemporaryDirectory(prefix='omq-media-') as d,concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        scratch=Path(d);list(pool.map(lambda x:retrieve(x,scratch),rows))
        for row in rows:
            key=row['path']; temp=scratch/key; dest=ROOT/key
            if temp.is_file():
                dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(temp,dest)
        subprocess.run(['git','add','--',*[x['path'] for x in rows]],cwd=ROOT,check=True)
    print(f"Verified {len(rows)} assets.")
if __name__=='__main__':main()
