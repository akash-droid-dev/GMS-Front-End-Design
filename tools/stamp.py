#!/usr/bin/env python3
"""Fingerprint every local file referenced as `path?v=...` with a hash of its content,
name the service-worker cache after those hashes, and copy the page to index.html.
Run after any change (tools/release.sh does it for you), so visitors never keep stale files."""
import hashlib, os, re, shutil, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
REF = re.compile(r'''((?:\.\./|\./)?(?:assets|vendor)/[^"'?\s)]+|support\.js)\?v=[A-Za-z0-9_.-]+''')
_cache = {}

def digest(path):
    if path not in _cache:
        with open(path, 'rb') as fh:
            _cache[path] = hashlib.sha1(fh.read()).hexdigest()[:8]
    return _cache[path]

def stamp(file):
    base = os.path.dirname(file)
    text = open(file, encoding='utf-8').read()
    def sub(m):
        ref = m.group(1)
        disk = os.path.normpath(os.path.join(base if file.startswith('sports/') else '.', ref))
        return f'{ref}?v={digest(disk)}' if os.path.isfile(disk) else m.group(0)
    new = REF.sub(sub, text)
    if new != text:
        open(file, 'w', encoding='utf-8').write(new)
    return new

pages = ['GMS v2.dc.html'] + sorted(glob.glob('sports/*.html'))
for p in pages:
    stamp(p)
shutil.copyfile('GMS v2.dc.html', 'index.html')
sw = stamp('sw.js')
# the cache name changes whenever the page or anything it pins changes
h = hashlib.sha1(open('index.html', 'rb').read() + ''.join(sorted(_cache.values())).encode()).hexdigest()[:10]
sw = re.sub(r"const CACHE = '[^']*';", f"const CACHE = 'gms-{h}';", sw)
open('sw.js', 'w', encoding='utf-8').write(sw)
print(f'stamped {len(_cache)} files, cache gms-{h}')
