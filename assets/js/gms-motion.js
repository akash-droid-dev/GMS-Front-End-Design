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
    es.forEach(function (e) { if (e.isIntersecting) { e.target.setAttribute('data-flap-on', ''); flapIO.unobserve(e.target); } });
  }, { threshold: 0.55 }) : null;
  function lastTextNode(el) {
    var w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return n.nodeValue.trim() && !(n.parentNode.closest && n.parentNode.closest('.hero-dot,.sfl,.sx')) ? 1 : 3; } }), n, last = null;
    while ((n = w.nextNode())) last = n; return last;
  }
  function flapWord(tn) {
    var txt = tn.nodeValue, m = txt.match(/^(.*?)([A-Za-z][A-Za-z'’\-]{2,})([^A-Za-z]*)$/); if (!m) return false;
    var word = m[2], wrap = doc.createElement('span'); wrap.className = 'sfl';
    var sr = doc.createElement('span'); sr.className = 'sfl-sr'; sr.textContent = word; wrap.appendChild(sr);
    for (var i = 0; i < word.length; i++) {
      var c = doc.createElement('span'); c.className = 'sfl-c'; c.setAttribute('aria-hidden', 'true');
      c.innerHTML = '<span class="sfl-s" style="--i:' + i + '"><span class="sfl-a"></span><span class="sfl-b"></span></span>';
      c.querySelector('.sfl-a').textContent = word[i]; c.querySelector('.sfl-b').textContent = word[i]; wrap.appendChild(c);
    }
    var frag = doc.createDocumentFragment(); if (m[1]) frag.appendChild(doc.createTextNode(m[1])); frag.appendChild(wrap); if (m[3]) frag.appendChild(doc.createTextNode(m[3]));
    tn.parentNode.replaceChild(frag, tn); return true;
  }
  function flaps() {
    doc.querySelectorAll('main h2').forEach(function (h) {
      if (h.__flap || h.closest('[data-r=ecx],[data-r=tv-section]')) return; // live headings are redrawn by the page; leave them alone
      if (h.matches('main h2') && !h.querySelector('.gms-w') && !h.closest('.pdk,.vl')) return; // wait until the line reveal has split it
      var em = h.querySelector('em'), tn = lastTextNode(em || h); if (!tn) return;
      h.__flap = 1; if (flapWord(tn)) { h.classList.add('has-flap'); if (flapIO && !REDUCED) flapIO.observe(h); else h.setAttribute('data-flap-on', ''); }
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

  /* section 07: a line-drawn gallery arch; it tilts to the cursor, its doors part on hover and swing open on click */
  var SG_IC = {
    badminton: '<path d="M12 21v-3"/><path d="M9 18h6l3-12-6 3-6-3z"/><path d="M12 9v9M9 6l1.5 12M15 6l-1.5 12"/>',
    tennis: '<circle cx="12" cy="12" r="8"/><path d="M5.5 7.5c3 2 3 7 0 9M18.5 7.5c-3 2-3 7 0 9"/>',
    table: '<circle cx="9.5" cy="9.5" r="5.5"/><path d="M13.5 13.5l5 5"/><circle cx="18.5" cy="5.5" r="1.6"/>',
    athletics: '<rect x="3" y="6" width="18" height="12" rx="6"/><rect x="6.5" y="9" width="11" height="6" rx="3"/>',
    swim: '<path d="M3 15c2 0 2-1.5 4.5-1.5S9.5 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15"/><path d="M3 19c2 0 2-1.5 4.5-1.5S9.5 19 12 19s2.5-1.5 4.5-1.5S19 19 21 19"/><circle cx="15" cy="6" r="1.8"/><path d="M6 12l4-4 3 2"/>',
    basket: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4v16M6.3 6.3c3 2.2 3 9.2 0 11.4M17.7 6.3c-3 2.2-3 9.2 0 11.4"/>',
    volley: '<circle cx="12" cy="12" r="8"/><path d="M12 4c-1 4 0 7 3 9M4.5 9.5c4 0 7 1.5 8.5 4.5M7 18.5c2-3.5 5-5 9-4.5"/>',
    football: '<circle cx="12" cy="12" r="8"/><path d="M12 8.5l3 2.2-1.1 3.5h-3.8L9 10.7z"/><path d="M12 4v4.5M15 10.7l4.3-1.3M13.9 14.2l2.6 3.6M10.1 14.2l-2.6 3.6M9 10.7L4.7 9.4"/>'
  };
  function sgIcon(n) { n = (n || '').toLowerCase(); return SG_IC[/table/.test(n) ? 'table' : /badm/.test(n) ? 'badminton' : /tennis/.test(n) ? 'tennis' : /athl|run|track/.test(n) ? 'athletics' : /swim|aqua/.test(n) ? 'swim' : /basket/.test(n) ? 'basket' : /volley/.test(n) ? 'volley' : /foot|soccer/.test(n) ? 'football' : 'badminton']; }
  function sgScene(names) {
    // room 264 x 480: back wall 92..172 x 170..260; four frames on each side wall, smaller as they recede
    var W = 264, H = 480, bx0 = 92, bx1 = 172, by0 = 170, by1 = 260, o = [], fr = [], lines = [];
    function wy(x, side, f) { var t = side ? (W - x) / (W - bx1) * 0 : 0; var xx = side ? W - x : x, top = by0 * xx / bx0, bot = H - (H - by1) * xx / bx0; return top + (bot - top) * f; }
    for (var i = 0; i <= 6; i++) { var bxp = bx0 + (bx1 - bx0) * i / 6; lines.push('M' + (W * i / 6).toFixed(1) + ' ' + H + 'L' + bxp.toFixed(1) + ' ' + by1); lines.push('M' + (W * i / 6).toFixed(1) + ' 0L' + bxp.toFixed(1) + ' ' + by0); }
    [0.62, 0.78, 0.88].forEach(function (k) { var y = by1 + (H - by1) * (1 - k) * 2.2; if (y < H) { var xl = bx0 * (H - y) / (H - by1), xr = W - xl; lines.push('M' + xl.toFixed(1) + ' ' + y.toFixed(1) + 'L' + xr.toFixed(1) + ' ' + y.toFixed(1)); } });
    lines.push('M0 0L' + bx0 + ' ' + by0 + 'M' + W + ' 0L' + bx1 + ' ' + by0 + 'M' + bx0 + ' ' + by0 + 'H' + bx1 + 'V' + by1 + 'H' + bx0 + 'Z');
    var xs = [[8, 30], [36, 54], [58, 72], [76, 86]];
    for (var s = 0; s < 2; s++) xs.forEach(function (r, j) {
      var a = r[0], b = r[1], f0 = 0.3, f1 = 0.6, n = names[s * 4 + j] || '';
      function P(x, f) { var y = (by0 * x / bx0) + ((H - (H - by1) * x / bx0) - by0 * x / bx0) * f; return [s ? W - x : x, y]; }
      var p = [P(a, f0), P(b, f0), P(b, f1), P(a, f1)];
      fr.push('<path class="sg-fr" pathLength="1" style="transition-delay:' + (0.6 + (s * 4 + j) * 0.08).toFixed(2) + 's" d="M' + p.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z"/>');
      var cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, cy = (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4, hgt = ((p[3][1] - p[0][1]) + (p[2][1] - p[1][1])) / 2, sc = hgt * 0.5 / 24, slope = ((p[1][1] - p[0][1]) / (p[1][0] - p[0][0])), sx = sc * Math.min(1, Math.abs(p[1][0] - p[0][0]) / hgt * 1.25);
      fr.push('<g class="sg-ic" style="transition-delay:' + (1.2 + (s * 4 + j) * 0.08).toFixed(2) + 's" transform="matrix(' + sx.toFixed(3) + ' ' + (slope * sx).toFixed(3) + ' 0 ' + sc.toFixed(3) + ' ' + (cx - 12 * sx).toFixed(1) + ' ' + (cy - 12 * sc - 12 * slope * sx).toFixed(1) + ')">' + sgIcon(n) + '</g>');
    });
    var dust = ''; for (var d = 0; d < 9; d++) dust += '<circle r="' + (0.6 + (d % 3) * 0.35) + '" cx="' + (100 + d * 8 + (d % 2) * 14) + '" cy="' + (250 + (d * 37) % 160) + '" style="animation-delay:' + (-d * 0.8) + 's"/>';
    return '<span class="sg-room" aria-hidden="true">' +
      '<svg class="sg-l1" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="sgGlow"><stop offset="0" stop-color="#FFF1D6" stop-opacity=".9"/><stop offset="1" stop-color="#FFF1D6" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse class="sg-glow" cx="132" cy="215" rx="70" ry="60"/>' + lines.map(function (l, i) { return '<path class="sg-ln" pathLength="1" style="transition-delay:' + (i * 0.03).toFixed(2) + 's" d="' + l + '"/>'; }).join('') + '<g class="sg-dust">' + dust + '</g></svg>' +
      '<svg class="sg-l2" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice">' + fr.join('') + '</svg></span>' +
      '<span class="sg-leaves" aria-hidden="true"><span class="sg-leaf l"></span><span class="sg-leaf r"></span></span>' +
      '<svg class="sg-archline" viewBox="0 0 300 500" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M18 500V164A132 144 0 0 1 282 164V500"/><path class="thin" pathLength="1" d="M6 500V160A144 156 0 0 1 294 160V500"/><path class="thin" pathLength="1" d="M138 4l12 14 12-14M0 500H300"/></svg>';
  }
  function sportGallery() {
    var sec = doc.querySelector('[data-r=stories]'); if (!sec || sec.__g) return; var track = sec.querySelector('.st-track'); if (!track || !track.querySelector('.sc2')) return; sec.__g = 1;
    var names = Array.prototype.map.call(track.querySelectorAll('.sc2 .sc2-n'), function (n) { return n.textContent.trim(); });
    var gate = doc.createElement('div'); gate.className = 'sg-gate';
    gate.innerHTML = '<button type="button" class="sg-door" data-sg-enter aria-label="Enter the sports gallery"><span class="sg-arch">' + sgScene(names) + '</span><span class="sg-word"><small>' + (names.length || 8) + ' sports · one room</small><b>Enter the sports gallery</b><em>Every sport of the Games hangs in a curved room. Step through the doors and walk round.</em><i>Open the doors <span aria-hidden="true">→</span></i></span></button>';
    var wrap = doc.createElement('div'); wrap.className = 'sg-wrap'; wrap.innerHTML = '<div class="sg-pin"><div class="sg-stage"></div><button type="button" class="sg-exit" data-sg-exit>Leave the gallery</button></div>';
    track.parentNode.insertBefore(gate, track); track.parentNode.insertBefore(wrap, track);
    var door = gate.querySelector('.sg-door'), raf = 0, tx = 0, ty = 0;
    if (window.matchMedia && matchMedia('(hover:hover)').matches && !REDUCED) {
      door.addEventListener('pointermove', function (e) { var r = door.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var a = gate.querySelector('.sg-arch').getBoundingClientRect(), cx = (a.left + a.width / 2 - r.left) / r.width, cy = (a.top + a.height / 2 - r.top) / r.height; door.style.setProperty('--mx', Math.max(-1, Math.min(1, (tx - cx) * 2.4)).toFixed(3)); door.style.setProperty('--my', Math.max(-1, Math.min(1, (ty - cy) * 2.4)).toFixed(3)); door.style.setProperty('--px', (tx * 100).toFixed(1) + '%'); door.style.setProperty('--py', (ty * 100).toFixed(1) + '%'); }); });
      door.addEventListener('pointerleave', function () { door.style.setProperty('--mx', 0); door.style.setProperty('--my', 0); });
    }
    if ('IntersectionObserver' in window) { var seen = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { gate.setAttribute('data-seen', ''); seen.disconnect(); } }, { threshold: 0.3 }); seen.observe(gate); } else gate.setAttribute('data-seen', '');
    var stage = wrap.querySelector('.sg-stage');
    function items() { return Array.prototype.map.call(track.querySelectorAll('.sc2'), function (c) { var im = c.querySelector('img'), n = (c.querySelector('.sc2-n') || {}).textContent || '', m = (c.querySelector('.sc2-m') || {}).textContent || '', a = c.querySelector('.sc2-a');
      return { sig: n + m, img: im ? im.getAttribute('src') : '', title: n.trim(), round: '', small: m.trim(), plate: n.trim(), href: a ? a.getAttribute('href') : '#', aria: n.trim() + ', ' + m.trim() }; }); }
    var g = galleryRoom(stage, { items: items, capLead: 'You are standing at', openLabel: 'Open the sport page →', active: function () { return sec.hasAttribute('data-in'); },
      walk: function () { var r = wrap.getBoundingClientRect(), vh = window.innerHeight; return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh))); },
      open: function (it) { if (it.href && it.href !== '#') location.href = it.href; } });
    function enter() { if (sec.hasAttribute('data-in') || sec.hasAttribute('data-going')) return; gate.setAttribute('data-seen', ''); sec.setAttribute('data-going', ''); setTimeout(function () { sec.removeAttribute('data-going'); sec.setAttribute('data-in', ''); g.build(); var t = wrap.getBoundingClientRect().top + window.scrollY - 70; window.scrollTo({ top: t, behavior: REDUCED ? 'auto' : 'smooth' }); }, REDUCED ? 0 : 1350); }
    function leave() { sec.removeAttribute('data-in'); door.style.setProperty('--mx', 0); door.style.setProperty('--my', 0); var t = sec.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: t, behavior: 'auto' }); }
    sec.addEventListener('click', function (e) { if (e.target.closest('[data-sg-enter]')) enter(); else if (e.target.closest('[data-sg-exit]')) leave(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sec.hasAttribute('data-in') && !stage.hasAttribute('data-focus')) leave(); });
    var mt = 0; new MutationObserver(function () { if (mt) return; mt = setTimeout(function () { mt = 0; if (sec.hasAttribute('data-in')) g.build(); }, 300); }).observe(track, { childList: true, subtree: true });
  }

  /* section 01: the chosen photo with a live line drawing of the hall; the card curls at the corner and turns like a heavy page */
  function vtPlan(k) {
    var o = [], dw = function (cls, d, del) { o.push('<path class="' + cls + '" data-dw pathLength="1" style="--d:' + del.toFixed(2) + '" d="' + d + '"/>'); }, R = function (x, y, w, h) { return 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'Z'; }, dot = function (x, y, r, del) { o.push('<circle class="d" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" style="--d:' + del.toFixed(2) + '"/>'); };
    dw('o', R(20, 20, 960, 660), 0);
    if (k === 'tabletennis') {
      for (var i = 0; i < 12; i++) { var c = i % 6, r = (i / 6) | 0, x = 50 + c * 152, y = 50 + r * 320, del = 0.25 + i * 0.06; dw('f', R(x, y, 140, 280), del); dw('o', R(x + 47, y + 98, 46, 84), del + 0.2); dw('k', 'M' + (x + 47) + ' ' + (y + 140) + 'h46M' + (x + 70) + ' ' + (y + 98) + 'v84', del + 0.35); }
      o.push('<circle class="hot" cx="' + (50 + 2 * 152 + 70) + '" cy="' + (50 + 140) + '" r="6"/>');
      for (var s = 0; s < 22; s++) { dot(60 + s * 40, 32, 3, 1 + s * 0.05); dot(60 + s * 40, 668, 3, 1.2 + s * 0.05); }
    } else if (k === 'ceremony') {
      dw('o', R(330, 40, 340, 90), 0.2); dw('k', 'M380 130v40h240v-40', 0.35);
      for (var a = 0; a < 7; a++) { var rr = 200 + a * 62; dw('f', 'M' + (500 - rr) + ' 170A' + rr + ' ' + rr * 0.92 + ' 0 0 0 ' + (500 + rr) + ' 170', 0.4 + a * 0.1); for (var q = 1; q < 14; q++) { var th = Math.PI * q / 14; dot(500 - Math.cos(th) * rr, 170 + Math.sin(th) * rr * 0.92, 2.6, 1 + a * 0.12 + q * 0.03); } }
      [-0.5, 0, 0.5].forEach(function (t, i) { dw('k', 'M500 170L' + (500 + Math.sin(t) * 620).toFixed(0) + ' ' + (170 + Math.cos(t) * 560).toFixed(0), 0.9 + i * 0.1); });
      o.push('<circle class="hot" cx="500" cy="85" r="7"/>');
    } else {
      for (var j = 0; j < 18; j++) { var cc = j % 9, rw = (j / 9) | 0, x2 = 44 + cc * 104, y2 = 60 + rw * 330, d2 = 0.2 + j * 0.05; dw('o', R(x2, y2, 88, 250), d2); dw('k', 'M' + x2 + ' ' + (y2 + 125) + 'h88M' + (x2 + 44) + ' ' + y2 + 'v95M' + (x2 + 44) + ' ' + (y2 + 155) + 'v95M' + x2 + ' ' + (y2 + 95) + 'h88M' + x2 + ' ' + (y2 + 155) + 'h88', d2 + 0.3); }
      o.push('<circle class="hot" cx="' + (44 + 4 * 104 + 44) + '" cy="' + (60 + 125) + '" r="7"/>');
      for (var e = 0; e < 24; e++) { dot(40 + e * 40, 36, 3, 1 + e * 0.04); dot(40 + e * 40, 664, 3, 1.2 + e * 0.04); }
    }
    return '<svg class="vt-vec" viewBox="0 0 1000 700" aria-hidden="true"><defs><linearGradient id="vtSw" x1="0" x2="1"><stop offset="0" stop-color="#F2F1EC" stop-opacity="0"/><stop offset=".5" stop-color="#F2F1EC" stop-opacity=".22"/><stop offset="1" stop-color="#F2F1EC" stop-opacity="0"/></linearGradient></defs>' + o.join('') + '<rect class="vt-sweep" x="-220" y="20" width="220" height="660" fill="url(#vtSw)"/></svg>';
  }
  function venueTurn() {
    var sec = doc.querySelector('section.vl'); if (!sec || sec.__vt) return; var plan = sec.querySelector('.vl-plan'); if (!plan) return; sec.__vt = 1;
    var C = { badminton: ['assets/venues/cover-badminton.webp?v=2', 'Badminton hall', 'Block C · first floor · 18 courts'], ceremony: ['assets/venues/cover-ceremony.webp?v=2', 'Opening ceremony', 'Block C · second floor · seating'], tabletennis: ['assets/venues/cover-tabletennis.webp?v=2', 'Table tennis hall', 'Block C · ground floor · 12 tables'] };
    var shade = doc.createElement('span'); shade.className = 'vt-shadow'; plan.appendChild(shade);
    var cv = doc.createElement('button'); cv.type = 'button'; cv.className = 'vt'; cv.setAttribute('aria-label', 'Turn the card to see the layout');
    cv.innerHTML = '<span class="vt-img"><img alt="" decoding="async" draggable="false"></span><span class="vt-shade"></span><span data-vt-vec></span><span class="vt-txt"><small data-vt-k></small><b data-vt-t></b><span class="vt-cue"><i class="vt-hand" aria-hidden="true"></i>Turn to see the layout</span></span><span class="vt-sheen" aria-hidden="true"></span>';
    plan.appendChild(cv); var flap = doc.createElement('span'); flap.className = 'vt-flap'; flap.setAttribute('aria-hidden', 'true'); plan.appendChild(flap); plan.setAttribute('data-turn', '0');
    var img = cv.querySelector('img'), nudgeT = 0, dx0 = null, k0 = 'badminton';
    function set(k) { var c = C[k] || C.badminton; k0 = k; img.src = c[0]; cv.querySelector('[data-vt-vec]').innerHTML = vtPlan(k); cv.querySelector('[data-vt-t]').textContent = c[1]; cv.querySelector('[data-vt-k]').textContent = c[2]; if (cv.hasAttribute('data-live')) { cv.removeAttribute('data-live'); void cv.offsetWidth; cv.setAttribute('data-live', ''); } }
    function turn(open) { plan.setAttribute('data-turn', open ? '1' : '0'); cv.tabIndex = open ? -1 : 0; cv.setAttribute('aria-hidden', open ? 'true' : 'false'); if (open) { plan.classList.remove('vt-nudge'); clearTimeout(nudgeT); } }
    function nudge() { clearTimeout(nudgeT); if (plan.getAttribute('data-turn') === '1' || REDUCED) return; plan.classList.remove('vt-nudge'); void plan.offsetWidth; plan.classList.add('vt-nudge'); nudgeT = setTimeout(nudge, 6000); }
    cv.addEventListener('click', function () { if (cv.__drag) { cv.__drag = 0; return; } turn(true); });
    cv.addEventListener('pointerdown', function (e) { dx0 = e.clientX; });
    window.addEventListener('pointerup', function (e) { if (dx0 === null) return; var d = e.clientX - dx0; dx0 = null; if (d < -40) { cv.__drag = 1; turn(true); } });
    var close = doc.createElement('button'); close.type = 'button'; close.className = 'vt-back'; close.innerHTML = '↺ Turn back'; close.addEventListener('click', function () { turn(false); setTimeout(nudge, 1400); }); plan.appendChild(close);
    sec.addEventListener('click', function (e) { var tb = e.target.closest('[data-vl-tab]'); if (tb) { var k = tb.getAttribute('data-vl-tab'); if (k !== k0) { set(k); turn(false); nudge(); } } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) { cv.setAttribute('data-live', ''); setTimeout(nudge, 1800); } else { clearTimeout(nudgeT); } }, { threshold: 0.35 }).observe(plan); else cv.setAttribute('data-live', '');
    set('badminton');
  }

  /* the event centre: a small glass orb that morphs into a dark glass panel; rows rise in one by one, scores count up */
  function ecCloud() {
    var sec = doc.querySelector('[data-r=ecx]'); if (!sec || sec.__c) return; var tog = sec.querySelector('.ecx-toggle'), panel = sec.querySelector('.ecx-panel'); if (!tog || !panel) return; sec.__c = 1;
    var orb = doc.createElement('span'); orb.className = 'ecx-orb'; orb.setAttribute('aria-hidden', 'true'); orb.innerHTML = '<i></i><b>0</b><small>LIVE</small>'; tog.appendChild(orb);
    var tip = doc.createElement('span'); tip.className = 'ecx-tip'; tip.setAttribute('aria-hidden', 'true'); tog.parentNode.insertBefore(tip, tog.nextSibling);
    tog.setAttribute('aria-label', 'Open the event centre');
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

  /* ---------------- the bot says hello once per visit ---------------- */
  function botHello() {
    if (root.__hello) return; root.__hello = 1; try { if (sessionStorage.getItem('gms-hello') === '1') return; } catch (e) {}
    function show() {
      if (doc.querySelector('.gyh')) return; var b = doc.createElement('div'); b.className = 'gyh'; b.setAttribute('role', 'status');
      b.innerHTML = '<button type="button" class="gyh-x" aria-label="Dismiss">×</button><button type="button" class="gyh-b"><span class="gyh-w" aria-hidden="true">👋</span><span class="gyh-t"><b>Hey!</b>How can I help?</span><span class="gyh-go">Ask Vision</span></button>';
      doc.body.appendChild(b); requestAnimationFrame(function () { b.setAttribute('data-on', ''); });
      function bye() { b.removeAttribute('data-on'); b.setAttribute('data-off', ''); try { sessionStorage.setItem('gms-hello', '1'); } catch (e) {} setTimeout(function () { b.remove(); }, 600); }
      b.querySelector('.gyh-x').addEventListener('click', bye);
      b.querySelector('.gyh-b').addEventListener('click', function () { var t = doc.querySelector('[data-r=bot] button[aria-label="Chat with Vision"]'); if (t) t.click(); bye(); });
      setTimeout(function () { if (b.isConnected) bye(); }, 12000);
    }
    var go = function () { setTimeout(show, 1100); };
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

  function scan() { t = 0; flaps(); masks(); parScan(); sportGallery(); ecCloud(); venueTurn(); field(); badge(); inverter(); rowsPass(); glance(); lanyard(); }
  new MutationObserver(function () { if (!t) t = setTimeout(scan, 160); }).observe(doc.body || root, { childList: true, subtree: true });
  window.addEventListener('gms:entered', scan);
  scan(); botHello();
})();
