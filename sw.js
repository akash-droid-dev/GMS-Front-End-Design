/* GMS service worker: the page and its code work offline (schedule, My Games, results), media stays network-only.
   Pages are network-first so a new deploy shows up on the next visit; versioned files are cache-first. */
const CACHE = 'gms-v1';
const SHELL = ['./', 'index.html', 'support.js', 'vendor/react.production.min.js', 'vendor/react-dom.production.min.js', 'assets/js/gms-plus.js?v=5',
  'assets/fonts/bricolage-grotesque-latin.woff2', 'assets/fonts/instrument-sans-latin.woff2', 'assets/fonts/jetbrains-mono-latin.woff2',
  'assets/brand/gms-mark.svg', 'assets/brand/gms-mark-dark.svg', 'assets/brand/icon-192.png', 'assets/hero-poster.webp?v=g1', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const SKIP = /\.(mp4|webm|m4v)(\?|$)|\/kickfull\/|\/rolevid\//;
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || r.headers.has('range') || SKIP.test(u.pathname)) return;
  if (r.mode === 'navigate') {
    e.respondWith((async () => {
      try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000); const res = await fetch(r, { signal: ctl.signal }); clearTimeout(t);
        if (res.ok) { const c = await caches.open(CACHE); c.put('index.html', res.clone()); } return res; }
      catch (err) { return (await caches.match('index.html')) || (await caches.match('./')) || Response.error(); }
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(r);
    if (hit && (u.search.includes('v=') || /\.(woff2|svg|png)$/.test(u.pathname))) return hit; // versioned: cache-first
    const net = fetch(r).then(res => { if (res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; });
    if (hit) { net.catch(() => {}); return hit; } // everything else: stale-while-revalidate
    return net;
  })());
});
