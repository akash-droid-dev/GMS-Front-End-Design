/* GMS motion: split-flap headings, image unmasking and parallax,
   magnetic buttons and a yellow cursor. Desktop-only effects switch themselves off on touch,
   in low mode and when the visitor prefers reduced motion. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var LOW = function () { return root.classList.contains('gms-low'); };

  /* ---------------- split-flap: the key word of each heading rolls into yellow scoreboard tiles ---------------- */
  var flapIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.style.setProperty('--sfl-bg', bgOf(e.target)); e.target.setAttribute('data-flap-on', ''); flapIO.unobserve(e.target); } });
  }, { threshold: 0.55 }) : null;
  function lastTextNode(el) {
    var w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return n.nodeValue.trim() && !(n.parentNode.closest && n.parentNode.closest('.hero-dot,.sfl,.sx')) ? 1 : 3; } }), n, last = null;
    while ((n = w.nextNode())) last = n; return last;
  }
  function bgOf(el) { var m = (getComputedStyle(el).color || '').match(/\d+(\.\d+)?/g) || [0, 0, 0], l = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; return l < 0.5 ? '#F2F1EC' : '#0B0B0C'; }
  function flapWord(tn) {
    var txt = tn.nodeValue, m = txt.match(/^(.*?)([A-Za-z][A-Za-z'’\-]{2,})([^A-Za-z]*)$/); if (!m) return false;
    var word = m[2], wrap = doc.createElement('span'); wrap.className = 'sfl';
    var sr = doc.createElement('span'); sr.className = 'sfl-sr'; sr.textContent = word; wrap.appendChild(sr);
    for (var i = 0; i < word.length; i++) {
      var c = doc.createElement('span'); c.className = 'sfl-c'; c.setAttribute('aria-hidden', 'true');
      var s = doc.createElement('span'); s.className = 'sfl-s'; s.style.setProperty('--i', i); s.textContent = word[i]; c.appendChild(s); wrap.appendChild(c);
    }
    var frag = doc.createDocumentFragment(); if (m[1]) frag.appendChild(doc.createTextNode(m[1])); frag.appendChild(wrap); if (m[3]) frag.appendChild(doc.createTextNode(m[3]));
    tn.parentNode.replaceChild(frag, tn); return true;
  }
  function flaps() {
    doc.querySelectorAll('main h2').forEach(function (h) {
      if (h.__flap || h.closest('[data-r=ecx],[data-r=tv-section]')) return; // live headings are redrawn by the page; leave them alone
      if (h.matches('main h2') && !h.querySelector('.gms-w') && !h.closest('.pdk,.vl')) return; // wait until the line reveal has split it
      var em = h.querySelector('em'), tn = lastTextNode(em || h); if (!tn) return;
      h.__flap = 1; if (flapWord(tn)) { h.classList.add('has-flap'); h.style.setProperty('--sfl-bg', bgOf(h)); if (flapIO && !REDUCED) flapIO.observe(h); else h.setAttribute('data-flap-on', ''); }
    });
  }

  /* weighted wheel scrolling already runs in the page (smoothInit), so it is not repeated here */

  /* ---------------- images unmask on entry; photos drift with depth ---------------- */
  var maskIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('mr-in'); maskIO.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }) : null;
  function masks() {
    if (REDUCED || !maskIO) return;
    doc.querySelectorAll('.st-card, .vl-plan, [data-r=steps-photo], .gm-ph').forEach(function (el) {
      if (el.__mr) return; el.__mr = 1; if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; el.classList.add('mr'); maskIO.observe(el);
    });
  }
  var par = [], parRaf = 0;
  function parallax() {
    parRaf = 0; if (REDUCED || LOW()) return; var vh = window.innerHeight;
    par.forEach(function (el) { if (!el.isConnected) return; var r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; var k = ((r.top + r.height / 2) - vh / 2) / vh; el.style.translate = '0 ' + (k * -28).toFixed(1) + 'px'; });
  }
  function parScan() { doc.querySelectorAll('.st-card img').forEach(function (im) { if (im.__par) return; im.__par = 1; par.push(im); }); }
  window.addEventListener('scroll', function () { if (!parRaf) parRaf = requestAnimationFrame(parallax); }, { passive: true });

  /* ---------------- magnetic buttons and the yellow cursor (desktop) ---------------- */
  var MAG = '.gms-liquid, .pd-arrow, .ld-go button, .gms-glow, .gms-cta, .nv-ic, .vl-tabs button, [data-hsw]';
  if (false) { /* magnetic buttons and the custom cursor were retired in the cleanup */
    var magEl = null;
    doc.addEventListener('pointermove', function (e) {
      var b = e.target.closest && e.target.closest(MAG);
      if (magEl && magEl !== b) { magEl.style.translate = ''; magEl = null; }
      if (!b || LOW()) return; magEl = b; var r = b.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      b.style.translate = (x * 0.18).toFixed(1) + 'px ' + (y * 0.24).toFixed(1) + 'px';
    }, { passive: true });
    doc.addEventListener('pointerleave', function () { if (magEl) { magEl.style.translate = ''; magEl = null; } });

    var cur = doc.createElement('div'); cur.className = 'gy-cur'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<i class="gy-dot"></i><i class="gy-ring"></i>';
    var dot, ring, mx = -100, my = -100, rx = -100, ry = -100, cRaf = 0;
    function place() { cRaf = 0; rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2; dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)'; ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)'; if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.5) cRaf = requestAnimationFrame(place); }
    function mount() { if (cur.isConnected || !doc.body) return; doc.body.appendChild(cur); dot = cur.firstChild; ring = cur.lastChild; root.classList.add('gy-has-cur'); }
    doc.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return; mount(); mx = e.clientX; my = e.clientY; if (!cRaf) cRaf = requestAnimationFrame(place);
      var t = e.target.closest && e.target.closest('a,button,[role=button],[data-cursor],input,select,textarea,label,[data-pd-card],[data-vl-pin]');
      cur.toggleAttribute('data-hot', !!t); cur.toggleAttribute('data-text', !!(e.target.closest && e.target.closest('input,textarea,[contenteditable]')));
    }, { passive: true });
    doc.addEventListener('mouseleave', function () { cur.setAttribute('data-out', ''); });
    doc.addEventListener('mouseenter', function () { cur.removeAttribute('data-out'); });
    doc.addEventListener('mousedown', function () { cur.setAttribute('data-down', ''); });
    doc.addEventListener('mouseup', function () { cur.removeAttribute('data-down'); });
  }

  /* ---------------- road to the podium: the active step picks its photo ---------------- */
  function stepPhoto() {
    var sec = doc.querySelector('[data-r=steps-section]'); if (!sec) return; var steps = sec.querySelectorAll('[data-step]'), k = 0;
    steps.forEach(function (st, i) { if (st.getAttribute('data-on') === '1') k = i; });
    var fig = sec.querySelector('[data-ps]'); if (!fig) return; var imgs = fig.querySelectorAll('img,video');
    var seen = fig.getBoundingClientRect(), vis = seen.bottom > 0 && seen.top < innerHeight;
    imgs.forEach(function (im, i) {
      if ((i === k) !== im.hasAttribute('data-on')) im.toggleAttribute('data-on', i === k);
      if (im.tagName !== 'VIDEO') return; im.muted = true;
      if (i === k && vis && !REDUCED) { if (im.preload !== 'auto') im.preload = 'auto'; if (im.paused) { var pr = im.play(); if (pr && pr.catch) pr.catch(function () {}); } }
      else if (!im.paused) im.pause();
    });
    var cap = fig.querySelector('figcaption'); if (cap && imgs[k] && cap.textContent !== imgs[k].getAttribute('data-cap')) cap.textContent = imgs[k].getAttribute('data-cap');
  }
  new MutationObserver(stepPhoto).observe(doc.body || root, { subtree: true, attributes: true, attributeFilter: ['data-on'] });
  var psT = 0; window.addEventListener('scroll', function () { clearTimeout(psT); psT = setTimeout(stepPhoto, 120); }, { passive: true });
  /* buttons that scroll to a section, e.g. Explore the venue */
  doc.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-goto]'); if (!b) return; var t = doc.getElementById(b.getAttribute('data-goto')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }); } });

  /* ---------------- scroll direction (phones tuck the Ask Vision button away while reading down) ---------------- */
  var lastY = window.scrollY, dirRaf = 0;
  window.addEventListener('scroll', function () { if (dirRaf) return; dirRaf = requestAnimationFrame(function () { dirRaf = 0; var y = window.scrollY, d = y - lastY; root.classList.toggle('gy-top', y < window.innerHeight * 0.6); if (Math.abs(d) > 6) { root.classList.toggle('gy-down', d > 0 && y > 200); lastY = y; } }); }, { passive: true });
  root.classList.toggle('gy-top', window.scrollY < window.innerHeight * 0.6);


  /* ---------------- Event centre: the live matches open as a 3D spiral of curved cards (pacomepertant-style) ---------------- */
  /* Event centre as a gallery corridor: the matches hang as framed prints on the outer wall of a curved room.
     The camera walks round as you scroll or drag; click a frame to walk up to it, click again to open the match. */
  function galleryRoom(stage, o) { return window.gmsRoom(stage, o); }

  /* section 07: the gallery sits in the dark; as the visitor scrolls its spotlights come on one by one, then the scroll walks the room, pausing at every print */
  function sportGallery() {
    var sec = doc.querySelector('[data-r=stories]'); if (!sec || sec.__g) return; var track = sec.querySelector('.st-track'); if (!track || !track.querySelector('.sc2')) return; sec.__g = 1;
    var wrap = doc.createElement('div'); wrap.className = 'sg-wrap'; wrap.innerHTML = '<div class="sg-pin"><div class="sg-stage"></div><div class="sg-meter" aria-hidden="true"><i></i></div></div>';
    track.parentNode.insertBefore(wrap, track); sec.setAttribute('data-in', '');
    var stage = wrap.querySelector('.sg-stage'), meter = wrap.querySelector('.sg-meter i'), LIGHTS = 0.2;
    function items() { return Array.prototype.map.call(track.querySelectorAll('.sc2'), function (c) { var im = c.querySelector('img'), nm = (c.querySelector('.sc2-n') || {}).textContent || '', m = (c.querySelector('.sc2-m') || {}).textContent || '', a = c.querySelector('.sc2-a');
      return { sig: nm + m, img: im ? im.getAttribute('src') : '', title: nm.trim(), round: '', small: m.trim(), plate: nm.trim(), href: a ? a.getAttribute('href') : '#', aria: nm.trim() + ', ' + m.trim() }; }); }
    function size() { var n = track.querySelectorAll('.sc2').length; wrap.style.height = (100 + 70 + n * 60) + 'vh'; }
    function prog() { var r = wrap.getBoundingClientRect(), vh = window.innerHeight; return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh))); }
    function sm(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
    var g = galleryRoom(stage, { items: items, capLead: 'You are standing at', openLabel: 'Open the sport page →',
      active: function () { var r = wrap.getBoundingClientRect(); return r.bottom > -200 && r.top < window.innerHeight + 200; },
      lights: function () { return REDUCED ? 1 : prog() / LIGHTS; },
      /* each print gets a dwell: the walk eases between prints and holds at each one */
      walk: function () { var p = prog(), n = Math.max(1, track.querySelectorAll('.sc2').length - 1), w = Math.max(0, (p - LIGHTS) / (1 - LIGHTS)) * n, i = Math.floor(w), f = w - i; if (meter) meter.style.transform = 'scaleX(' + p.toFixed(3) + ')'; return Math.min(n, i + sm((f - 0.2) / 0.6)) * (n + 0.55) / n / n; },
      open: function (it) { if (it.href && it.href !== '#') location.href = it.href; } });
    size(); g.build(); window.addEventListener('resize', size);
    var mt = 0; new MutationObserver(function () { if (mt) return; mt = setTimeout(function () { mt = 0; size(); g.build(); }, 300); }).observe(track, { childList: true, subtree: true });
  }

  /* section 01: each layout arrives as a rolled paper map that unrolls with the scroll; switching layouts rolls the next one out */
  function venueTurn() {
    var sec = doc.querySelector('section.vl'); if (!sec || sec.__vt || !window.gmsRoll) return; var plan = sec.querySelector('.vl-plan'); if (!plan) return;
    var figs = plan.querySelectorAll('figure'); if (!figs.length) return; sec.__vt = 1;
    figs.forEach(function (fig) { var z = fig.querySelector('.vlz'), im = z && z.querySelector('img'); if (z && im) window.gmsRoll.attach(z, { src: im.getAttribute('src') }); });
    sec.addEventListener('click', function (e) { if (!e.target.closest('[data-vl-tab]')) return; setTimeout(function () { var f = plan.querySelector('figure[data-off="0"]') || plan.querySelector('figure'), z = f && f.querySelector('.vlz'); if (z && z.__rm) z.__rm.replay(); }, 40); });
  }

  /* the event centre: a small glass orb that morphs into a dark glass panel; rows rise in one by one, scores count up */
  function ecCloud() {
    var sec = doc.querySelector('[data-r=ecx]'); if (!sec || sec.__c) return; var tog = sec.querySelector('.ecx-toggle'), panel = sec.querySelector('.ecx-panel'); if (!tog || !panel) return; sec.__c = 1;
    var orb = doc.createElement('span'); orb.className = 'ecx-orb'; orb.setAttribute('aria-hidden', 'true'); orb.innerHTML = '<i></i><b>0</b><small>LIVE</small>'; tog.appendChild(orb);
    var tip = doc.createElement('span'); tip.className = 'ecx-tip'; tip.setAttribute('aria-hidden', 'true'); tog.parentNode.insertBefore(tip, tog.nextSibling);
    tog.setAttribute('aria-label', 'Open the event centre');
    tog.addEventListener('pointerdown', function () { tog.removeAttribute('data-tap'); void tog.offsetWidth; tog.setAttribute('data-tap', ''); setTimeout(function () { tog.removeAttribute('data-tap'); }, 900); });
    var lastN = -1; function count() { var now = sec.querySelector('.ecx-now'), t = now ? now.textContent : '', m = t.match(/(\d+)\s*match/), n = m ? +m[1] : sec.querySelectorAll('[data-r=ec-row]').length; if (n === lastN) return; lastN = n; orb.querySelector('b').textContent = n; tip.textContent = 'Event centre · ' + n + ' live'; }
    function isOpen() { return panel.getAttribute('data-open') === '1'; }
    function stagger() { var k = 0; sec.querySelectorAll('.ecx-panel :is(.ec-card>h2,.ec-card>h3,.ec-card>header),.ecx-panel [data-r=ec-row]').forEach(function (el) { el.style.setProperty('--ri', k++); });
      if (REDUCED) return; sec.querySelectorAll('.ecx-panel .ec-sc').forEach(function (el, i) { var v = el.textContent.trim(); if (!/^\d+$/.test(v) || +v === 0) return; var to = +v, t0 = performance.now() + 450 + i * 50, sp = el.querySelector('span') || el; el.__cu = 1;
        (function f(now) { var p = Math.max(0, Math.min(1, (now - t0) / 700)); sp.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); else { sp.textContent = v; el.__cu = 0; } })(performance.now()); }); }
    var was = false; new MutationObserver(function () { var o = isOpen(); if (o && !was) stagger(); was = o; count(); }).observe(panel, { attributes: true, attributeFilter: ['data-open'] }); var nowEl = sec.querySelector('.ecx-now'); if (nowEl) new MutationObserver(count).observe(nowEl, { childList: true, subtree: true, characterData: true });
    count();
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) tog.click(); });
    doc.addEventListener('pointerdown', function (e) { if (isOpen() && !panel.contains(e.target) && !tog.contains(e.target) && !e.target.closest('[data-r=nav],.gp-path,[role=dialog]')) tog.click(); });
    var x = doc.createElement('button'); x.type = 'button'; x.className = 'ecx-x'; x.setAttribute('aria-label', 'Close the event centre'); x.textContent = '×'; x.addEventListener('click', function () { if (isOpen()) tog.click(); });
    var inner = sec.querySelector('.ecx-inner'); if (inner) inner.insertBefore(x, inner.firstChild);
  }

  /* the orb and greeting step aside over the footer */
  function footWatch() { var ft = doc.querySelector('footer.ft'); if (!ft || ft.__fw || !('IntersectionObserver' in window)) return; ft.__fw = 1; new IntersectionObserver(function (es) { root.classList.toggle('gy-foot', es[0].isIntersecting); }, { rootMargin: '0px 0px -30% 0px' }).observe(ft); }

  /* ---------------- cursor field: small shuttles turn to the pointer (gev.design) ---------------- */
  function field() {
    var sec = doc.querySelector('.gyf'); if (!sec || sec.__f) return; sec.__f = 1; var cv = sec.querySelector('canvas'), cx = cv.getContext('2d'), pts = [], W = 0, H = 0, dpr = 1, tx = 0, ty = 0, ax = 0, ay = 0, raf = 0, on = false;
    function size() { var r = sec.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; pts = []; var g = W < 700 ? 54 : 66;
      for (var y = g / 2; y < H; y += g) for (var x = g / 2; x < W; x += g) { var jx = ((x * 7 + y * 13) % 17) - 8, jy = ((x * 11 + y * 5) % 15) - 7; pts.push({ x: x + jx, y: y + jy, a: 0, s: 0.75 + ((x + y) % 5) / 10 }); }
      if (!on) { tx = ax = W / 2; ty = ay = H / 2; } draw(); }
    function glyph(p) { var c = cx, k = p.s; c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.beginPath(); c.arc(7 * k, 0, 3.2 * k, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(4 * k, -3 * k); c.lineTo(-8 * k, -7 * k); c.moveTo(4 * k, 0); c.lineTo(-9 * k, 0); c.moveTo(4 * k, 3 * k); c.lineTo(-8 * k, 7 * k); c.stroke(); c.restore(); }
    function draw() { raf = 0; ax += (tx - ax) * 0.18; ay += (ty - ay) * 0.18; var dark = root.getAttribute('data-theme') === 'dark', col = dark ? '#F2F1EC' : '#0B0B0C';
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H); cx.lineWidth = 1.4; cx.lineCap = 'round';
      pts.forEach(function (p) { var dx = ax - p.x, dy = ay - p.y, d = Math.hypot(dx, dy), t = Math.atan2(dy, dx), near = Math.max(0, 1 - d / 260);
        p.a = t; cx.globalAlpha = 0.22 + near * 0.78; cx.fillStyle = col; cx.strokeStyle = cx.fillStyle; glyph(p); });
      cx.globalAlpha = 1; if (Math.abs(tx - ax) + Math.abs(ty - ay) > 0.5) raf = requestAnimationFrame(draw); }
    function q() { if (!raf) raf = requestAnimationFrame(draw); }
    sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; on = true; q(); }, { passive: true });
    sec.addEventListener('pointerleave', function () { tx = W / 2; ty = H / 2; q(); });
    window.addEventListener('resize', function () { size(); }); new MutationObserver(q).observe(root, { attributes: true, attributeFilter: ['data-theme'] }); size();
  }
  /* ---------------- rotating badge: turns with the scroll, opens Live TV ---------------- */
  function badge() {
    var b = doc.querySelector('.gyb'); if (!b || b.__b) return; b.__b = 1; var r = 0;
    window.addEventListener('scroll', function () { if (r) return; r = requestAnimationFrame(function () { r = 0; b.style.setProperty('--gybr', (window.scrollY * 0.12).toFixed(1) + 'deg'); }); }, { passive: true });
    b.addEventListener('click', function () { var A = window.GMSApp; if (A && A.openTv) A.openTv('stadium'); });
  }

  /* ---------------- black and white, continuously: the page background blends from one section's tone to the next as you scroll ---------------- */
  function inverter() {
    if (root.__inv) return; var main = doc.getElementById('content'); if (!main) return; root.__inv = 1;
    var secs = [], raf = 0, last = '';
    function lum(c) { var m = c.match(/\d+(\.\d+)?/g); if (!m || m.length < 3 || (m[3] !== undefined && +m[3] < 0.5)) return null; return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; }
    function scanSecs() {
      secs = Array.prototype.slice.call(main.querySelectorAll(':scope > section')).filter(function (s) { return !s.matches('[data-hero-sec],[data-r=hero]') && s.offsetHeight > 120; });
      secs.forEach(function (s) {
        if (s.__tone === undefined) { var l = lum(getComputedStyle(s).backgroundColor); s.__tone = l === null ? null : (l < 0.5 ? 0 : 1); if (s.__tone !== null) { s.setAttribute('data-tone', s.__tone ? 'light' : 'dark'); s.style.setProperty('background-color', 'transparent', 'important'); } }
      });
      secs = secs.filter(function (s) { return s.__tone !== null; }); q();
    }
    function mix(t) { var v = Math.round(11 + (242 - 11) * t), g = Math.round(11 + (241 - 11) * t), b = Math.round(12 + (236 - 12) * t); return 'rgb(' + v + ',' + g + ',' + b + ')'; }
    function paint() {
      raf = 0; if (!secs.length) return; var vh = window.innerHeight, mid = vh * 0.5, t = secs[0].__tone, band = vh * 0.35;
      for (var i = 0; i < secs.length; i++) {
        var r = secs[i].getBoundingClientRect(); if (r.top <= mid) t = secs[i].__tone;
        var nx = secs[i + 1]; if (nx && nx.__tone !== secs[i].__tone) { var edge = nx.getBoundingClientRect().top; if (Math.abs(edge - mid) < band) { var k = (mid - edge + band) / (2 * band), e = k * k * (3 - 2 * k); t = secs[i].__tone + (nx.__tone - secs[i].__tone) * e; break; } }
      }
      var c = mix(t); if (c !== last) { last = c; root.style.setProperty('background-color', c, 'important'); doc.body.style.setProperty('background-color', c, 'important'); root.style.setProperty('--inv', t.toFixed(3)); }
    }
    function q() { if (!raf) raf = requestAnimationFrame(paint); }
    window.addEventListener('scroll', q, { passive: true }); window.addEventListener('resize', q);
    new MutationObserver(function () { setTimeout(scanSecs, 200); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    setTimeout(scanSecs, 600); window.addEventListener('gms:entered', function () { setTimeout(scanSecs, 400); });
  }

  /* ---------------- sideways card rows never stall the page: mostly vertical gestures scroll the page on ---------------- */
  function rowsPass() { doc.querySelectorAll('.st-track').forEach(function (t) { if (t.__wp) return; t.__wp = 1; t.addEventListener('wheel', function (e) { if (e.ctrlKey) return; if (Math.abs(e.deltaY) > Math.abs(e.deltaX) * 1.2) { e.preventDefault(); window.scrollBy(0, e.deltaY * (e.deltaMode === 1 ? 40 : 1)); } }, { passive: false }); }); }

  /* ---------------- the bot's greeting comes and goes every 6 seconds until it is dismissed or the chat is opened ---------------- */
  function botHello() {
    if (root.__hello) return; root.__hello = 1; try { if (sessionStorage.getItem('gms-hello') === '1') return; } catch (e) {}
    var b = null, stop = false, tm = 0;
    function chatOpen() { return !!doc.querySelector('[data-r=bot] [role=dialog], [data-r=bot][data-open="1"], [data-r=bot] [data-open="1"]'); }
    function build() {
      b = doc.createElement('div'); b.className = 'gyh'; b.setAttribute('role', 'status');
      b.innerHTML = '<button type="button" class="gyh-x" aria-label="Dismiss">×</button><button type="button" class="gyh-b"><span class="gyh-w" aria-hidden="true">👋</span><span class="gyh-t"><b>Hey!</b>How can I help?</span><span class="gyh-go">Ask Vision</span></button>';
      doc.body.appendChild(b);
      b.querySelector('.gyh-x').addEventListener('click', function () { end(true); });
      b.querySelector('.gyh-b').addEventListener('click', function () { var t = doc.querySelector('[data-r=bot] button[aria-label="Chat with Vision"]'); if (t) t.click(); end(true); });
    }
    function show() { if (stop) return; if (doc.hidden || chatOpen() || doc.querySelector('.ecx-panel[data-open="1"]')) { tm = setTimeout(show, 6000); return; } if (!b) build(); b.removeAttribute('data-off'); requestAnimationFrame(function () { b.setAttribute('data-on', ''); }); tm = setTimeout(hide, 6000); }
    function hide() { if (!b) return; b.removeAttribute('data-on'); b.setAttribute('data-off', ''); if (!stop) tm = setTimeout(show, 6000); }
    function end(forVisit) { stop = true; clearTimeout(tm); hide(); if (forVisit) try { sessionStorage.setItem('gms-hello', '1'); } catch (e) {} setTimeout(function () { if (b) { b.remove(); b = null; } }, 700); }
    var go = function () { tm = setTimeout(show, window.innerWidth <= 760 ? 12000 : 1100); };
    if (doc.getElementById('gms-ldr')) window.addEventListener('gms:entered', go, { once: true }); else go();
  }

  /* ---------------- the Games at a glance: rows fill in with the scroll ---------------- */
  function glance() {
    var sec = doc.querySelector('.gyk'); if (!sec || sec.__g) return; sec.__g = 1; var rows = sec.querySelectorAll('.gyk-row'), raf = 0;
    function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3); }
    function paint() { raf = 0; var r = sec.getBoundingClientRect(), span = Math.max(1, r.height - window.innerHeight), p = REDUCED ? 1 : Math.max(0, Math.min(1, -r.top / span)), n = rows.length;
      rows.forEach(function (row, i) { var a = i / (n + 0.4), k = ease((p * 1.15 - a) / 0.26), active = p * 1.15 >= a && (i === n - 1 || p * 1.15 < (i + 1) / (n + 0.4));
        row.style.setProperty('--in', k.toFixed(3)); row.style.setProperty('--ln', ease((p * 1.15 - a + 0.06) / 0.3).toFixed(3)); row.style.setProperty('--op', (k < 1 || active || p > 0.92 ? 1 : 0.32).toFixed(2)); }); }
    function q() { if (!raf) raf = requestAnimationFrame(paint); }
    window.addEventListener('scroll', q, { passive: true }); window.addEventListener('resize', q); paint();
  }
  /* ---------------- run as the page draws ---------------- */
  var t = 0;

  /* Registration lanyard: a strap simulated as a rope of points (verlet + distance constraints),
     the pass hangs from its last point as a damped pendulum. Grab and throw it, brush it to make it
     jiggle, a soft breeze keeps it alive when idle. */
  function lanyard() {
    var st = doc.querySelector('[data-ly-stage]'); if (!st || st.__ly) return; st.__ly = 1;
    var cv = st.querySelector('[data-ly-strap]'), bd = st.querySelector('[data-ly-badge]'), hd = st.querySelector('.ly-holder');
    if (!cv || !bd || !hd) return;
    var cx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var N = 16, P = [], rest = 0, W = 0, H = 0, UP = 0, SW = 46, BW = 300;
    var th = 0.12, om = 0, grab = null, moved = 0, lastPX = 0, lastPY = 0, vis = false, raf = 0, tPrev = 0, tAcc = 0, wind = Math.random() * 6;
    var G = 2200, DAMP = 0.988, ITERS = 10, MEND = 7, AX = null, AT = null, busy = false;
    function size() {
      var r = st.getBoundingClientRect(); W = r.width; H = r.height;
      UP = parseFloat(getComputedStyle(cv).top) * -1 || 0;
      cv.width = Math.round(W * dpr); cv.height = Math.round((H + UP) * dpr); cv.style.width = W + 'px'; cv.style.height = (H + UP) + 'px';
      BW = bd.offsetWidth || 300; SW = Math.round(BW * 0.155);
      var len = UP + Math.max(110, H * 0.14); rest = len / N;
      AX = AT = W / 2; var x0 = W / 2, y0 = 0; P = [];
      for (var i = 0; i <= N; i++) { var x = x0 + Math.sin(i * 0.3) * 2, y = y0 + i * rest; P.push({ x: x, y: y, px: x, py: y }); }
    }
    function step(dt) {
      var t = performance.now() / 1000, breeze = grab ? 0 : Math.sin(t * 0.7 + wind) * 14 + Math.sin(t * 1.9) * 6;
      for (var i = 1; i <= N; i++) {
        var q = P[i]; if (grab && i === N) continue;
        var vx = (q.x - q.px) * DAMP, vy = (q.y - q.py) * DAMP; q.px = q.x; q.py = q.y;
        q.x += vx + breeze * (i / N) * dt * dt; q.y += vy + G * dt * dt;
      }
      if (AT !== null && AX !== AT) { AX += (AT - AX) * Math.min(1, dt * 5.5); if (Math.abs(AT - AX) < 0.5) AX = AT; }
      if (grab) { var e = P[N], tx = grab.x, ty = grab.y; e.px = e.x; e.py = e.y; e.x += (tx - e.x) * 0.5; e.y += (ty - e.y) * 0.5; }
      for (var k = 0; k < ITERS; k++) {
        for (var j = 0; j < N; j++) {
          var a = P[j], b = P[j + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1e-4, diff = (d - rest) / d;
          var wa = j === 0 ? 0 : 1, wb = (j + 1 === N) ? (grab ? 0 : 1 / MEND) : 1, sum = wa + wb; if (!sum) continue;
          a.x += dx * diff * wa / sum; a.y += dy * diff * wa / sum; b.x -= dx * diff * wb / sum; b.y -= dy * diff * wb / sum;
        }
        P[0].x = AX; P[0].y = 0;
      }
      /* the pass: a pendulum hanging from the strap end, pushed by how the end accelerates */
      var e2 = P[N], f = P[N - 2], phi = Math.atan2(e2.x - f.x, e2.y - f.y), ax = (e2.x - e2.px) - (lastPX || 0); lastPX = e2.x - e2.px;
      var alpha = -38 * (th - phi * 0.8) - 3.2 * om - ax * 2.6;
      om += alpha * dt; th += om * dt; if (th > 1.25) { th = 1.25; om *= -0.3; } if (th < -1.25) { th = -1.25; om *= -0.3; }
    }
    function draw() {
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H + UP);
      cx.lineJoin = 'round'; cx.lineCap = 'butt';
      cx.beginPath(); cx.moveTo(P[0].x, P[0].y - 4); cx.lineTo(P[0].x, -UP);
      for (var i = 1; i < N; i++) { var mx = (P[i].x + P[i + 1].x) / 2, my = (P[i].y + P[i + 1].y) / 2; cx.quadraticCurveTo(P[i].x, P[i].y, mx, my); }
      cx.lineTo(P[N].x, P[N].y);
      cx.strokeStyle = '#111113'; cx.lineWidth = SW; cx.stroke();
      cx.strokeStyle = 'rgba(255,255,255,.05)'; cx.lineWidth = SW - 6; cx.stroke();
      cx.strokeStyle = '#141416'; cx.lineWidth = SW - 8; cx.stroke();
      /* woven lettering running down the strap */
      var txt = 'GMS · AIPT 2026 · AHMEDABAD · ', fs = Math.max(9, SW * 0.24);
      cx.font = '600 ' + fs + 'px "JetBrains Mono", ui-monospace, monospace'; cx.fillStyle = 'rgba(255,255,255,.13)'; cx.textBaseline = 'middle';
      var ci = 0, need = 0, acc = 0;
      for (var s = 0; s < N; s++) {
        var A = P[s], B = P[s + 1], dx = B.x - A.x, dy = B.y - A.y, L = Math.sqrt(dx * dx + dy * dy), an = Math.atan2(dy, dx);
        var pos = 0;
        while (acc + L - pos > need) {
          var u = need - acc; if (u < 0) u = 0; var x = A.x + dx * (u / L), y = A.y + dy * (u / L);
          var ch = txt[ci % txt.length]; var cw = cx.measureText(ch).width + 1.5;
          cx.save(); cx.translate(x, y); cx.rotate(an); cx.fillText(ch, 0, 0); cx.restore();
          ci++; need += cw; pos = need - acc; if (ci > 600) break;
        }
        acc += L;
      }
      var e = P[N], ry = Math.max(-16, Math.min(16, om * 9)), rx = Math.max(-8, Math.min(8, (e.y - e.py) * -0.8));
      bd.style.transform = 'translate3d(' + (e.x - BW / 2).toFixed(2) + 'px,' + (e.y - UP).toFixed(2) + 'px,0) rotate(' + (-th).toFixed(4) + 'rad) rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
      hd.style.setProperty('--shade', (0.5 + ry / 40).toFixed(3));
    }
    function loop(now) {
      raf = 0; if (!vis) return;
      var d = Math.min(0.05, (now - (tPrev || now)) / 1000); tPrev = now; tAcc += d;
      var h = 1 / 120, n = 0; while (tAcc >= h && n < 8) { step(h); tAcc -= h; n++; }
      draw(); raf = requestAnimationFrame(loop);
    }
    function go() { if (!raf && vis) { tPrev = 0; raf = requestAnimationFrame(loop); } }
    function local(e) { var r = st.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top + UP }; }
    hd.addEventListener('pointerdown', function (e) {
      if (REDUCED || e.button > 0) return; e.preventDefault(); var p = local(e), en = P[N];
      grab = { x: en.x, y: en.y, dx: en.x - p.x, dy: en.y - p.y, ox: p.x - en.x, id: e.pointerId }; moved = 0;
      try { hd.setPointerCapture(e.pointerId); } catch (x) {} st.setAttribute('data-grab', '');
    });
    hd.addEventListener('pointermove', function (e) {
      var p = local(e);
      if (grab) { var nx = p.x + grab.dx, ny = p.y + grab.dy; moved += Math.abs(nx - grab.x) + Math.abs(ny - grab.y); grab.x = nx; grab.y = Math.max(rest * 3, ny); return; }
      if (REDUCED || e.pointerType !== 'mouse') return;
      var mx = e.movementX || 0, my = e.movementY || 0, en = P[N];
      en.px -= Math.max(-6, Math.min(6, mx)) * 0.22; en.py -= Math.max(-6, Math.min(6, my)) * 0.08; om += Math.max(-8, Math.min(8, mx)) * 0.05;
    });
    function drop() { if (!grab) return; var off = P[N].x - AX; grab = null; st.removeAttribute('data-grab'); if (Math.abs(off) > W * 0.3) { moved = 99; swap(off < 0 ? 1 : -1); } }
    /* one pass at a time: the lanyard swings off one side and the next type swings in from the other */
    function tabs() { return Array.prototype.slice.call(doc.querySelectorAll('.ly-list .ly-it')); }
    function cur() { var t = tabs(); for (var i = 0; i < t.length; i++) if (t[i].getAttribute('aria-selected') === 'true') return i; return 0; }
    function count() { var c = st.querySelector('[data-ly-count]'), t = tabs(); if (c && t.length) c.textContent = String(cur() + 1).padStart(2, '0') + ' / ' + String(t.length).padStart(2, '0'); }
    function swap(dir) {
      var t = tabs(); if (busy || !t.length) return; var to = (cur() + dir + t.length) % t.length;
      if (REDUCED) { t[to].click(); setTimeout(count, 60); return; }
      busy = true; vis = true; go(); var dur = 460;
      [cv, bd].forEach(function (el) { el.style.transition = 'translate ' + dur + 'ms cubic-bezier(.7,0,.84,0)'; el.style.translate = (-dir * W * 0.9).toFixed(0) + 'px 0'; });
      om += dir * 0.9; P[N].px += dir * 6;
      setTimeout(function () {
        t[to].click(); [cv, bd].forEach(function (el) { el.style.transition = 'none'; el.style.translate = (dir * W * 0.9).toFixed(0) + 'px 0'; });
        th = -dir * 0.35; om = -dir * 0.6; P[N].px -= dir * 8; void bd.offsetWidth;
        [cv, bd].forEach(function (el) { el.style.transition = 'translate 820ms cubic-bezier(.16,1,.3,1)'; el.style.translate = '0px 0'; });
        setTimeout(function () { busy = false; count(); }, 820);
      }, dur);
    }
    var nav = doc.createElement('div'); nav.className = 'ly-nav';
    nav.innerHTML = '<button type="button" data-ly-go="-1" aria-label="Previous pass">←</button><span data-ly-count>01 / 08</span><button type="button" data-ly-go="1" aria-label="Next pass">→</button>';
    st.appendChild(nav); nav.addEventListener('click', function (e) { var b = e.target.closest('[data-ly-go]'); if (b) swap(+b.getAttribute('data-ly-go')); });
    var sw = null; st.addEventListener('pointerdown', function (e) { if (e.target.closest('.ly-holder,.ly-nav')) return; sw = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('pointerup', function (e) { if (!sw) return; var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) swap(dx < 0 ? 1 : -1); });
    st.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); swap(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); swap(-1); } });
    doc.addEventListener('click', function (e) { if (e.target.closest('.ly-list .ly-it')) setTimeout(count, 60); });
    setTimeout(count, 300);
    hd.addEventListener('pointerup', drop); hd.addEventListener('pointercancel', drop);
    hd.addEventListener('click', function (e) { if (moved > 8) { e.stopPropagation(); e.preventDefault(); } moved = 0; });
    hd.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hd.click(); } });
    window.addEventListener('gms:ly-swap', function () { om += (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random()); P[N].px -= 5; go(); });
    var io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) go(); }, { rootMargin: '120px' }); io.observe(st);
    window.addEventListener('resize', function () { size(); go(); });
    size();
    if (REDUCED) { for (var i = 0; i < 400; i++) step(1 / 120); vis = true; draw(); vis = false; io.disconnect(); }
  }

  function scan() { t = 0; flaps(); masks(); parScan(); sportGallery(); ecCloud(); venueTurn(); footWatch(); field(); badge(); inverter(); rowsPass(); glance(); lanyard(); }
  new MutationObserver(function () { if (!t) t = setTimeout(scan, 160); }).observe(doc.body || root, { childList: true, subtree: true });
  window.addEventListener('gms:entered', scan);
  scan(); botHello();
})();
