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

  /* section 07: the entrance to the gallery: same wall, ceiling and floor as the room, an arched doorway onto it, spotlit prints and a velvet rope */
  function sgEsc(t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sgScene(cards) {
    var im = function (i) { var c = cards[i % Math.max(1, cards.length)] || {}; return '<img src="' + sgEsc(c.img) + '" alt="" loading="lazy" decoding="async" draggable="false">'; },
      lab = function (i) { var c = cards[i] || {}; return '<span class="sg-lab"><i>' + sgEsc(c.name) + '</i><small>' + sgEsc(c.meta || 'In the gallery') + '</small></span>'; };
    return '<span class="sg-hall" aria-hidden="true">' +
      '<span class="sg-ceil"><span class="sg-rail"></span><span class="sg-spot" style="left:15%;--r:18deg"></span><span class="sg-spot" style="left:38%"></span><span class="sg-spot" style="left:60%"></span><span class="sg-spot" style="right:15%;--r:-18deg"></span></span>' +
      '<span class="sg-wall"><span class="sg-sign"><small>Veer Savarkar Sports Complex</small><b>The Sports Gallery</b></span>' +
        '<span class="sg-pf l"><span class="sg-art">' + im(0) + '</span>' + lab(0) + '</span><span class="sg-pf r"><span class="sg-art">' + im(1) + '</span>' + lab(1) + '</span>' +
        '<span class="sg-portal"><span class="sg-in"><span class="sg-mini a">' + im(2) + '</span><span class="sg-mini b">' + im(3) + '</span><span class="sg-mini c">' + im(4) + '</span></span></span></span>' +
      '<span class="sg-floor"></span><span class="sg-cone l"></span><span class="sg-cone r"></span>' +
      '<span class="sg-rope"><svg viewBox="0 0 460 120"><defs><linearGradient id="sgBrass" x1="0" x2="1"><stop offset="0" stop-color="#6B5320"/><stop offset=".45" stop-color="#E9C979"/><stop offset=".6" stop-color="#B8913E"/><stop offset="1" stop-color="#5A4519"/></linearGradient></defs>' +
        '<rect class="post" x="26" y="20" width="16" height="92" rx="4"/><circle class="post" cx="34" cy="16" r="12"/><ellipse class="post" cx="34" cy="114" rx="30" ry="7"/>' +
        '<rect class="post" x="418" y="20" width="16" height="92" rx="4"/><circle class="post" cx="426" cy="16" r="12"/><ellipse class="post" cx="426" cy="114" rx="30" ry="7"/>' +
        '<g class="swing"><path class="cord" d="M34 26C140 96 320 96 426 26"/><path class="cordhi" d="M40 28C140 90 320 90 420 28"/></g></svg></span>' +
      '</span><span class="sg-cta">Step inside the gallery <span aria-hidden="true">→</span></span><span class="sg-hint" aria-hidden="true">' + cards.length + ' sports · one room</span>';
  }
  function sportGallery() {
    var sec = doc.querySelector('[data-r=stories]'); if (!sec || sec.__g) return; var track = sec.querySelector('.st-track'); if (!track || !track.querySelector('.sc2')) return; sec.__g = 1;
    var cards = Array.prototype.map.call(track.querySelectorAll('.sc2'), function (c) { var i = c.querySelector('img'); return { img: i ? i.getAttribute('src') : '', name: ((c.querySelector('.sc2-n') || {}).textContent || '').trim(), meta: ((c.querySelector('.sc2-m') || {}).textContent || '').trim() }; });
    var gate = doc.createElement('div'); gate.className = 'sg-gate';
    gate.innerHTML = '<button type="button" class="sg-door" data-sg-enter aria-label="Step inside the sports gallery">' + sgScene(cards) + '</button>';
    var wrap = doc.createElement('div'); wrap.className = 'sg-wrap'; wrap.innerHTML = '<div class="sg-pin"><div class="sg-stage"></div><button type="button" class="sg-exit" data-sg-exit>Leave the gallery</button></div>';
    track.parentNode.insertBefore(gate, track); track.parentNode.insertBefore(wrap, track);
    var door = gate.querySelector('.sg-door'), raf = 0, tx = 0, ty = 0;
    if (window.matchMedia && matchMedia('(hover:hover)').matches && !REDUCED) {
      door.addEventListener('pointermove', function (e) { var r = door.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; if (raf) return; raf = requestAnimationFrame(function () { raf = 0; var cx = 0.5, cy = 0.55; door.style.setProperty('--mx', Math.max(-1, Math.min(1, (tx - cx) * 2)).toFixed(3)); door.style.setProperty('--my', Math.max(-1, Math.min(1, (ty - cy) * 2)).toFixed(3)); door.style.setProperty('--px', (tx * 100).toFixed(1) + '%'); door.style.setProperty('--py', (ty * 100).toFixed(1) + '%'); }); });
      door.addEventListener('pointerleave', function () { door.style.setProperty('--mx', 0); door.style.setProperty('--my', 0); });
    }
    if ('IntersectionObserver' in window) { var seen = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { gate.setAttribute('data-seen', ''); seen.disconnect(); } }, { threshold: 0.3 }); seen.observe(gate); } else gate.setAttribute('data-seen', '');
    var stage = wrap.querySelector('.sg-stage');
    function items() { return Array.prototype.map.call(track.querySelectorAll('.sc2'), function (c) { var im = c.querySelector('img'), n = (c.querySelector('.sc2-n') || {}).textContent || '', m = (c.querySelector('.sc2-m') || {}).textContent || '', a = c.querySelector('.sc2-a');
      return { sig: n + m, img: im ? im.getAttribute('src') : '', title: n.trim(), round: '', small: m.trim(), plate: n.trim(), href: a ? a.getAttribute('href') : '#', aria: n.trim() + ', ' + m.trim() }; }); }
    var g = galleryRoom(stage, { items: items, capLead: 'You are standing at', openLabel: 'Open the sport page →', active: function () { return sec.hasAttribute('data-in'); },
      walk: function () { var r = wrap.getBoundingClientRect(), vh = window.innerHeight; return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh))); },
      open: function (it) { if (it.href && it.href !== '#') location.href = it.href; } });
    function enter() { if (sec.hasAttribute('data-in') || sec.hasAttribute('data-going')) return; gate.setAttribute('data-seen', ''); sec.setAttribute('data-going', ''); setTimeout(function () { sec.removeAttribute('data-going'); sec.setAttribute('data-in', ''); g.build(); var t = wrap.getBoundingClientRect().top + window.scrollY - 70; window.scrollTo({ top: t, behavior: REDUCED ? 'auto' : 'smooth' }); }, REDUCED ? 0 : 1800); }
    function leave() { sec.removeAttribute('data-in'); door.style.setProperty('--mx', 0); door.style.setProperty('--my', 0); var t = sec.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: t, behavior: 'auto' }); }
    sec.addEventListener('click', function (e) { if (e.target.closest('[data-sg-enter]')) enter(); else if (e.target.closest('[data-sg-exit]')) leave(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sec.hasAttribute('data-in') && !stage.hasAttribute('data-focus')) leave(); });
    var mt = 0; new MutationObserver(function () { if (mt) return; mt = setTimeout(function () { mt = 0; if (sec.hasAttribute('data-in')) g.build(); }, 300); }).observe(track, { childList: true, subtree: true });
  }

  /* section 01: the chosen photo with a live line drawing of the hall; the card curls at the corner and turns like a heavy page */
  /* the venue drawings are laid out on the official plans' own coordinates (percent of the sheet), so every room and pin sits where the plan puts it */
  function vtPlan(k) {
    var o = [], q = 0, f = function (n) { return (+n).toFixed(1); }, X = function (p) { return p * 10; }, Y = function (p) { return p * 7.07; };
    function pop(svg) { o.push('<g class="pf" style="--d:' + (0.15 + (q++) * 0.03).toFixed(2) + '">' + svg + '</g>'); }
    function R(x0, y0, x1, y1, fill, st, rx) { return '<rect x="' + f(X(x0)) + '" y="' + f(Y(y0)) + '" width="' + f(X(x1 - x0)) + '" height="' + f(Y(y1 - y0)) + '" rx="' + (rx || 0) + '" fill="' + fill + '"' + (st ? ' stroke="' + st + '" stroke-width="1.2"' : '') + '/>'; }
    function L(d, st, w) { return '<path d="' + d + '" fill="none" stroke="' + (st || '#F2F1EC') + '" stroke-width="' + (w || 1) + '"/>'; }
    function T(x, y, s) { return '<text x="' + f(X(x)) + '" y="' + f(Y(y) + 4) + '" text-anchor="middle" class="lb">' + s + '</text>'; }
    function pin(n, x, y) { o.push('<g class="pin" style="--d:' + (1.5 + n * 0.06).toFixed(2) + '"><g class="pi"><circle cx="' + f(X(x)) + '" cy="' + f(Y(y)) + '" r="13"/><text x="' + f(X(x)) + '" y="' + f(Y(y) + 4.5) + '">' + n + '</text></g></g>'); }
    function arrow(x, y, dir) { var cx = X(x), cy = Y(y), p = dir === 'l' ? [[cx + 7, cy - 8], [cx - 7, cy], [cx + 7, cy + 8]] : dir === 'r' ? [[cx - 7, cy - 8], [cx + 7, cy], [cx - 7, cy + 8]] : dir === 'u' ? [[cx - 8, cy + 7], [cx, cy - 7], [cx + 8, cy + 7]] : [[cx - 8, cy - 7], [cx, cy + 7], [cx + 8, cy - 7]]; return '<path d="M' + p.map(function (a) { return f(a[0]) + ' ' + f(a[1]); }).join('L') + 'Z" fill="#E5484D"/>'; }
    function seatsP(x0, y0, x1, y1, col, gap) { var s = '', g = gap || 9; for (var y = Y(y0) + 2; y < Y(y1) - 2; y += g) for (var x = X(x0) + 2; x < X(x1) - 2; x += g) s += '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + (g * 0.66).toFixed(1) + '" height="' + (g * 0.66).toFixed(1) + '" rx="1" fill="' + col + '"/>'; return s; }
    function podium(x0, y0, x1, y1) { var w = (x1 - x0) / 3; return R(x0, y0 + (y1 - y0) * .35, x0 + w, y1, '#B8BCC6') + R(x0 + w, y0, x0 + 2 * w, y1, '#D4AF37') + R(x0 + 2 * w, y0 + (y1 - y0) * .5, x1, y1, '#B0784A'); }
    function court(x0, y0, x1, y1, op) { var x = X(x0), y = Y(y0), w = X(x1 - x0), h = Y(y1 - y0), cx = x + w / 2, my = y + h / 2, ss = h * 0.15, lb = h * 0.055, si = w * 0.075;
      return '<g' + (op ? ' opacity="' + op + '"' : '') + '><rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="#2AA58C"/>' + L('M' + f(x) + ' ' + f(y) + 'h' + f(w) + 'v' + f(h) + 'h' + f(-w) + 'Z') + L('M' + f(x + si) + ' ' + f(y) + 'v' + f(h) + 'M' + f(x + w - si) + ' ' + f(y) + 'v' + f(h) + 'M' + f(x) + ' ' + f(my - ss) + 'h' + f(w) + 'M' + f(x) + ' ' + f(my + ss) + 'h' + f(w) + 'M' + f(x) + ' ' + f(y + lb) + 'h' + f(w) + 'M' + f(x) + ' ' + f(y + h - lb) + 'h' + f(w) + 'M' + f(cx) + ' ' + f(y) + 'V' + f(my - ss) + 'M' + f(cx) + ' ' + f(my + ss) + 'V' + f(y + h), '#F2F1EC', 0.6) + L('M' + f(x - 3) + ' ' + f(my) + 'h' + f(w + 6), '#0B0B0C', 1.8) + '</g>'; }
    function hall(x0, y0, x1, y1) { return '<rect x="' + f(X(x0)) + '" y="' + f(Y(y0)) + '" width="' + f(X(x1 - x0)) + '" height="' + f(Y(y1 - y0)) + '" rx="46" fill="#1A1B20" stroke="#3A3B42" stroke-width="2"/>'; }
    var live = '', vb;
    if (k === 'tabletennis') {
      vb = '70 40 860 640';
      o.push(R(44.5, 3.5, 70, 23, '#202128', '#34353D', 4) + T(57, 13, 'PLAZA · DRIVEWAY')); o.push(hall(9.5, 25.5, 91.5, 92));
      pop(R(27, 38.5, 74, 75, '#5E6068') + T(50.5, 37.2, 'FIELD OF PLAY 39.4 × 34.2 M'));
      pop(R(39, 43, 62.5, 70, '#BBD8EE'));
      pop(R(38.8, 57.3, 62.5, 61.8, '#1F4E7F') + T(50.5, 59.6, 'CENTRAL AISLE · 5.5 M'));
      [46.7, 52.6, 65.6].forEach(function (ty) { [42.8, 48.2, 53.6, 59.0].forEach(function (tx) { pop(R(tx - 2.6, ty - 3.3, tx + 2.6, ty + 3.3, 'none', '#6B3A8A') + R(tx - 0.9, ty - 1.6, tx + 0.9, ty + 1.6, '#1D4FA3', '#F2F1EC') + L('M' + f(X(tx - 0.9)) + ' ' + f(Y(ty)) + 'h' + f(X(1.8)), '#0B0B0C', 1.6) + R(tx - 2.2, ty - 0.6, tx - 1.4, ty + 0.6, '#C9A57A')); }); });
      pop(R(43.5, 71.3, 57.5, 73, '#C9A57A', null, 2) + R(49.5, 71, 51.5, 73.4, '#E5A3A3'));
      pop(podium(45.5, 38.7, 49.5, 40.3));
      pop(R(62, 34.5, 68, 38.5, '#E8C64A', '#B89A2A', 3));
      pop(arrow(25.3, 55.2, 'r') + L('M' + f(X(10.5)) + ' ' + f(Y(56.5)) + 'H' + f(X(24)), '#E5484D', 1.5));
      pop(R(15.6, 51.5, 21.6, 61.9, '#E8C64A', '#B89A2A', 3) + T(18.6, 57, 'REG'));
      pop(R(42, 78, 50.5, 86, '#E8C64A', '#B89A2A', 3) + T(46.3, 82.4, 'MEETING'));
      pop(R(56, 78, 62.5, 86, '#E8C64A', '#B89A2A', 3) + T(59.3, 82, 'CAFÉ'));
      pop(R(21, 28, 33, 30.2, '#3E8E6A') + T(27, 29.3, 'MERCHANDISE') + arrow(52, 26.5, 'd'));
      live = '<circle r="2.4" fill="#FFF7E0" cx="' + f(X(48.2)) + '"><animate attributeName="cy" values="' + f(Y(51.2)) + ';' + f(Y(54)) + ';' + f(Y(51.2)) + '" dur="1s" repeatCount="indefinite"/></circle>';
      pin(1, 45, 49.5); pin(2, 50.5, 59.4); pin(3, 50.5, 72.3); pin(4, 65, 36); pin(5, 24.5, 55.2); pin(6, 18.3, 60.1); pin(7, 46.3, 82.4); pin(8, 59.3, 82); pin(9, 47.8, 39.8);
    } else if (k === 'ceremony') {
      vb = '50 90 900 560';
      o.push(hall(5, 13, 95, 87));
      pop(R(24.6, 29.5, 75.5, 64, '#55575F'));
      for (var c = 0; c < 9; c++) pop(court(26 + c * 5.28, 34, 26 + c * 5.28 + 3.9, 46.5, 0.85));
      [26.5, 31.6, 63, 68.2].forEach(function (cx) { pop(court(cx, 49, cx + 3.9, 61.5, 0.85)); });
      pop(R(35.2, 45.5, 62.6, 64, '#4FD1A5') + T(49, 47.5, 'CEREMONY FLOOR'));
      pop(R(46.2, 55.7, 51.6, 62.6, '#3A3326', '#D4AF37', 3) + R(46.2, 54.7, 51.6, 55.7, 'url(#led)', null, 1) + T(48.9, 59.3, 'STAGE'));
      pop(seatsP(36.5, 56.5, 45, 58.3, '#E8D9A8', 8) + seatsP(53.5, 56.5, 61, 58.3, '#E8D9A8', 8));
      pop(seatsP(36, 59.8, 45, 61.5, '#C9A14A', 8) + seatsP(53.5, 59.8, 62, 61.5, '#C9A14A', 8));
      var arc = ''; for (var a = 0; a < 3; a++) { var rx = 230 - a * 16, ry = 152 - a * 14; for (var t = 0; t <= 34; t++) { var th = Math.PI * (0.05 + 0.9 * t / 34), x = X(49) - Math.cos(th) * rx, y = Y(50.5) - Math.sin(th) * ry; arc += '<rect x="' + f(x - 3) + '" y="' + f(y - 3) + '" width="6" height="6" rx="1" fill="#E8D44A"/>'; } } pop(arc);
      pop(R(23, 18, 77, 27.5, '#2A2B33') + seatsP(23.5, 18.5, 28, 25, '#D65BC8', 8) + seatsP(28.5, 18.5, 40, 25, '#B2454E', 8) + seatsP(40.5, 18.5, 59, 25, '#3B57D6', 8) + seatsP(59.5, 18.5, 71.5, 25, '#B2454E', 8) + seatsP(72, 18.5, 77, 25, '#D65BC8', 8) + seatsP(41, 25.6, 59, 27.4, '#E5484D', 8));
      pop(R(23, 66, 77, 78.5, '#2A2B33') + seatsP(23.5, 66.5, 77, 76, '#4A6AC8', 8));
      pop(R(15.3, 34, 21.3, 64, '#2A2B33') + seatsP(15.6, 34.5, 21, 63.5, '#C9A14A', 8) + R(77.3, 34, 83.3, 64, '#2A2B33') + seatsP(77.6, 34.5, 83, 63.5, '#C9A14A', 8));
      pop(podium(74.1, 51.5, 75.4, 59));
      live = '<path d="M' + f(X(44)) + ' ' + f(Y(14)) + 'L' + f(X(46.5)) + ' ' + f(Y(55)) + 'H' + f(X(49.5)) + 'Z" fill="url(#beam)" class="beam"/><path d="M' + f(X(54)) + ' ' + f(Y(14)) + 'L' + f(X(48.5)) + ' ' + f(Y(55)) + 'H' + f(X(51.5)) + 'Z" fill="url(#beam)" class="beam b2"/>';
      pin(1, 48.9, 60.1); pin(2, 40.8, 57.6); pin(3, 57.3, 61.5); pin(4, 48.5, 35.4); pin(5, 50, 23.3); pin(6, 74.8, 55.2); pin(7, 69.5, 39.6);
    } else {
      vb = '70 40 860 620';
      o.push(R(44, 6.5, 68, 23.5, '#202128', '#34353D', 4) + T(56, 15, 'BLOCK E · PLAZA')); o.push(hall(8, 25.5, 92, 91));
      pop(R(26, 41.5, 74, 74, '#5E6068'));
      for (var j = 0; j < 18; j++) { var cc = j % 9, rw = (j / 9) | 0, x0 = 27.3 + cc * 4.94; pop(court(x0, rw ? 59.3 : 45.5, x0 + 3.75, rw ? 71.2 : 57.4)); }
      pop(seatsP(26.5, 40, 73.5, 41.4, '#3B57D6', 7) + seatsP(36, 72, 70, 73.4, '#C9A57A', 7));
      pop(R(71.3, 55, 73.3, 61.2, '#3A3326', '#D4AF37', 2) + podium(72.6, 62, 74.1, 69));
      pop(arrow(75, 58, 'l'));
      pop(arrow(77.4, 44.5, 'l') + arrow(77, 72.5, 'l'));
      pop(R(85, 53, 92, 63.5, '#E8A443', '#B87A22', 3) + T(88.5, 58.4, 'VVIP LUNCH'));
      pop(R(79, 61, 82.6, 74, '#3E8E6A', '#2C6B4E', 3) + T(80.8, 67.5, 'GREEN'));
      pop(R(79, 44, 82.6, 55, '#8E8D88', '#6B6A66', 3));
      pop(arrow(23.5, 57.6, 'r') + arrow(23, 73, 'r'));
      pop(R(8, 53, 14.6, 63.5, '#6F9BD8', '#4A72AC', 3) + T(11.3, 58.4, 'HYDRATION'));
      pop(R(8, 36, 14.6, 52, '#D86B6B', '#A84848', 3) + T(11.3, 44, 'LOCKERS') + R(8, 64, 14.6, 80, '#3B57D6', '#2A3F9E', 3) + T(11.3, 72, 'LOCKERS'));
      pop(R(18, 74.5, 24.3, 80, '#E8C64A', '#B89A2A', 3) + T(21.2, 77.4, 'KIT'));
      pop(R(17.2, 44, 21, 54, '#B48AC8', '#8A62A0', 3) + R(17.2, 61, 21, 71, '#B48AC8', '#8A62A0', 3));
      pop(R(20.5, 26.5, 44, 29, '#54D6E8') + R(56, 26.5, 79.5, 29, '#54D6E8') + R(26.5, 86.5, 79, 89, '#54D6E8') + T(52.8, 87.9, 'LUNCH & REFRESHMENT'));
      pop(arrow(50, 30, 'd'));
      live = '<circle r="2.6" fill="#FFF7E0" cx="' + f(X(27.3 + 4 * 4.94 + 1.9)) + '"><animate attributeName="cy" values="' + f(Y(47)) + ';' + f(Y(56)) + ';' + f(Y(47)) + '" dur="1.4s" repeatCount="indefinite" calcMode="spline" keySplines=".3 0 .7 1;.3 0 .7 1"/></circle>';
      pin(1, 50, 56.6); pin(2, 73.2, 66); pin(3, 75, 55); pin(4, 77.4, 42.5); pin(5, 88.4, 58); pin(6, 81.1, 65.7); pin(7, 23, 57.6); pin(8, 11.4, 56.6); pin(9, 11.4, 43.5); pin(10, 21.4, 77); pin(11, 32.5, 27.4); pin(12, 49.8, 31.3); pin(13, 81.4, 46.5);
    }
    return '<svg class="vt-vec" viewBox="' + vb + '" aria-hidden="true"><defs><linearGradient id="led" x1="0" x2="1"><stop offset="0" stop-color="#E5484D"/><stop offset=".5" stop-color="#F2F1EC"/><stop offset="1" stop-color="#3B82F6"/><animate attributeName="x1" values="0;-1;0" dur="6s" repeatCount="indefinite"/><animate attributeName="x2" values="1;2;1" dur="6s" repeatCount="indefinite"/></linearGradient><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4D6" stop-opacity=".5"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></linearGradient></defs>' + o.join('') + '<g class="lv">' + live + '</g></svg>';
  }
  function venueTurn() {
    var sec = doc.querySelector('section.vl'); if (!sec || sec.__vt) return; var plan = sec.querySelector('.vl-plan'); if (!plan) return; sec.__vt = 1;
    var C = { badminton: ['assets/venues/cover-badminton.webp?v=2', 'Badminton hall', 'Block C · first floor · 18 courts'], ceremony: ['assets/venues/cover-ceremony.webp?v=2', 'Opening ceremony', 'Block C · second floor · seating'], tabletennis: ['assets/venues/cover-tabletennis.webp?v=2', 'Table tennis hall', 'Block C · ground floor · 12 tables'] };
    var shade = doc.createElement('span'); shade.className = 'vt-shadow'; plan.appendChild(shade);
    var cv = doc.createElement('button'); cv.type = 'button'; cv.className = 'vt'; cv.setAttribute('aria-label', 'Turn the card to see the layout');
    cv.innerHTML = '<span class="vt-bg"></span><span data-vt-vec></span><span class="vt-shade"></span><span class="vt-txt"><small data-vt-k></small><b data-vt-t></b><span class="vt-cue"><i class="vt-hand" aria-hidden="true"></i>Turn to see the layout</span></span><span class="vt-sheen" aria-hidden="true"></span>';
    plan.appendChild(cv); var flap = doc.createElement('span'); flap.className = 'vt-flap'; flap.setAttribute('aria-hidden', 'true'); plan.appendChild(flap); plan.setAttribute('data-turn', '0');
    var nudgeT = 0, dx0 = null, k0 = 'badminton';
    function set(k) { var c = C[k] || C.badminton; k0 = k; cv.querySelector('[data-vt-vec]').innerHTML = vtPlan(k); cv.querySelector('[data-vt-t]').textContent = c[1]; cv.querySelector('[data-vt-k]').textContent = c[2]; if (cv.hasAttribute('data-live')) { cv.removeAttribute('data-live'); void cv.offsetWidth; cv.setAttribute('data-live', ''); } }
    function turn(open) { plan.setAttribute('data-turn', open ? '1' : '0'); cv.tabIndex = open ? -1 : 0; cv.setAttribute('aria-hidden', open ? 'true' : 'false'); if (open) { plan.classList.remove('vt-nudge'); clearTimeout(nudgeT); } }
    function nudge() { clearTimeout(nudgeT); if (plan.getAttribute('data-turn') === '1' || REDUCED) return; plan.classList.remove('vt-nudge'); void plan.offsetWidth; plan.classList.add('vt-nudge'); nudgeT = setTimeout(nudge, 6000); }
    cv.addEventListener('click', function () { if (cv.__drag) { cv.__drag = 0; return; } turn(true); });
    cv.addEventListener('pointerdown', function (e) { dx0 = e.clientX; });
    window.addEventListener('pointerup', function (e) { if (dx0 === null) return; var d = e.clientX - dx0; dx0 = null; if (d < -40) { cv.__drag = 1; turn(true); } });
    var zb = doc.createElement('span'); zb.className = 'vt-zoom'; zb.setAttribute('role', 'button'); zb.tabIndex = 0; zb.setAttribute('aria-label', 'Zoom the drawing'); zb.innerHTML = '<i aria-hidden="true">⤢</i>Zoom'; cv.appendChild(zb);
    function zoom(e) { e.stopPropagation(); e.preventDefault(); var lb = doc.createElement('div'); lb.className = 'vt-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', (C[k0] || C.badminton)[1] + ' drawing');
      lb.innerHTML = '<div class="vt-lb-top"><b>' + (C[k0] || C.badminton)[1] + '</b><span>Pinch or drag to look around</span><button type="button" class="vt-lb-x" aria-label="Close">×</button></div><div class="vt-lb-sc">' + vtPlan(k0) + '</div>';
      doc.body.appendChild(lb); doc.documentElement.style.overflow = 'hidden'; requestAnimationFrame(function () { lb.setAttribute('data-on', ''); var sc = lb.querySelector('.vt-lb-sc'); sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2; sc.scrollTop = (sc.scrollHeight - sc.clientHeight) / 2; });
      function shut() { lb.removeAttribute('data-on'); doc.documentElement.style.overflow = ''; doc.removeEventListener('keydown', esc); setTimeout(function () { lb.remove(); }, 350); zb.focus(); }
      function esc(ev) { if (ev.key === 'Escape') shut(); }
      lb.querySelector('.vt-lb-x').addEventListener('click', shut); lb.addEventListener('click', function (ev) { if (ev.target === lb) shut(); }); doc.addEventListener('keydown', esc); lb.querySelector('.vt-lb-x').focus(); }
    zb.addEventListener('click', zoom); zb.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); zb.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') zoom(e); });
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

  function scan() { t = 0; flaps(); masks(); parScan(); sportGallery(); ecCloud(); venueTurn(); field(); badge(); inverter(); rowsPass(); glance(); lanyard(); }
  new MutationObserver(function () { if (!t) t = setTimeout(scan, 160); }).observe(doc.body || root, { childList: true, subtree: true });
  window.addEventListener('gms:entered', scan);
  scan(); botHello();
})();
