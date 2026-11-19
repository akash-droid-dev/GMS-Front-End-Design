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
    var fig = sec.querySelector('[data-ps]'); if (!fig) return; var imgs = fig.querySelectorAll('img');
    imgs.forEach(function (im, i) { if ((i === k) !== im.hasAttribute('data-on')) im.toggleAttribute('data-on', i === k); });
    var cap = fig.querySelector('figcaption'); if (cap && imgs[k] && cap.textContent !== imgs[k].getAttribute('data-cap')) cap.textContent = imgs[k].getAttribute('data-cap');
  }
  new MutationObserver(stepPhoto).observe(doc.body || root, { subtree: true, attributes: true, attributeFilter: ['data-on'] });
  /* buttons that scroll to a section, e.g. Explore the venue */
  doc.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-goto]'); if (!b) return; var t = doc.getElementById(b.getAttribute('data-goto')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }); } });

  /* ---------------- scroll direction (phones tuck the Ask Vision button away while reading down) ---------------- */
  var lastY = window.scrollY, dirRaf = 0;
  window.addEventListener('scroll', function () { if (dirRaf) return; dirRaf = requestAnimationFrame(function () { dirRaf = 0; var y = window.scrollY, d = y - lastY; root.classList.toggle('gy-top', y < window.innerHeight * 0.6); if (Math.abs(d) > 6) { root.classList.toggle('gy-down', d > 0 && y > 200); lastY = y; } }); }, { passive: true });
  root.classList.toggle('gy-top', window.scrollY < window.innerHeight * 0.6);


  /* ---------------- Event centre: the live matches open as a 3D spiral of curved cards (pacomepertant-style) ---------------- */
  /* Event centre as a gallery corridor: the matches hang as framed prints on the outer wall of a curved room.
     The camera walks round as you scroll or drag; click a frame to walk up to it, click again to open the match. */
  function ecSpiral() {
    var sec = doc.querySelector('[data-r=ecx]'); if (!sec) return; var panel = sec.querySelector('.ecx-panel'), inner = panel && panel.querySelector('.ecx-inner'), list = inner && inner.querySelector('[data-r=ec-list]');
    if (!list || panel.__sp) return; panel.__sp = 1; panel.setAttribute('data-ecs', 'spiral');
    var bar = doc.createElement('div'); bar.className = 'ecs-bar'; bar.innerHTML = '<span class="ecg-sw"><button type="button" data-ecs="spiral" aria-pressed="true">Gallery</button><button type="button" data-ecs="list" aria-pressed="false">List</button></span>';
    var stage = doc.createElement('div'); stage.className = 'ecs-stage ecg'; stage.setAttribute('aria-label', 'Matches hung in a gallery. Scroll or drag to walk round, click a match to look closer.');
    stage.innerHTML = '<div class="ecg-room"></div><div class="ecg-cap" aria-live="polite"><small>You are walking past</small><b data-ecg-t></b><button type="button" class="ecg-open" data-ecg-open>Open the match →</button></div>' +
      '<div class="ecg-nav"><button type="button" data-ecg-step="-1" aria-label="Previous match">←</button><button type="button" data-ecg-step="1" aria-label="Next match">→</button></div><p class="ecg-hint" data-ecg-hint>Scroll or drag to walk round<br>Click a match to look closer</p>';
    var grid = inner.querySelector('[data-r=ec-grid]'); inner.insertBefore(bar, inner.firstChild); inner.insertBefore(stage, grid);
    var room = stage.firstChild, frames = [], walls = [], built = '', raf = 0, dragging = null, drag = 0, focus = -1, camT = null, camNow = null;
    var R = 2400, GAP = 13, WH = 520, FW = 300, P = 800;
    var SPORT = [['table tennis', 'tabletennis'], ['badminton', 'badminton'], ['basketball', 'basketball'], ['volleyball', 'volleyball'], ['tennis', 'tennis'], ['football', 'football'], ['swim', 'swimming'], ['medley', 'swimming'], ['free', 'swimming'], ['relay', 'athletics'], ['100m', 'athletics'], ['m ', 'athletics']];
    function sportOf(t) { t = t.toLowerCase(); for (var i = 0; i < SPORT.length; i++) if (t.indexOf(SPORT[i][0]) >= 0) return SPORT[i][1]; return 'badminton'; }
    function txt(r, q) { var e = r.querySelector(q); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
    function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function rows() { return Array.prototype.slice.call(list.querySelectorAll('[data-r=ec-row]')); }
    function build() {
      var rs = rows(), sig = rs.map(function (r) { return r.textContent; }).join('|'); if (sig === built) return; built = sig;
      room.innerHTML = ''; walls = []; frames = [];
      var n = rs.length, span = Math.max(80, (n + 2) * GAP);
      for (var a = -GAP * 2; a <= span; a += 4) { var w = doc.createElement('i'); w.className = 'ecg-wall'; w.__a = a; w.__r = R; room.appendChild(w); walls.push(w); }
      for (var a2 = -GAP * 2; a2 <= span; a2 += 6) { var w2 = doc.createElement('i'); w2.className = 'ecg-wall ecg-in'; w2.__a = a2; w2.__r = R * 0.5; w2.__in = 1; room.appendChild(w2); walls.push(w2); }
      rs.forEach(function (r, i) {
        var ev = txt(r, '.ec-ev'), meta = r.querySelectorAll('.ec-meta>span'), where = meta[0] ? meta[0].textContent.trim() : '', st = txt(r, '.pill'), live = !!r.querySelector('[data-live="1"]');
        var nm = r.querySelectorAll('.ec-nm'), sc = r.querySelectorAll('.ec-sc'), A = nm[0] ? (nm[0].querySelector('small') || {}).textContent || '' : '', B = nm[1] ? (nm[1].querySelector('small') || {}).textContent || '' : '';
        var An = nm[0] ? nm[0].textContent.replace(A, '').trim() : '', Bn = nm[1] ? nm[1].textContent.replace(B, '').trim() : '';
        var sa = sc[0] ? sc[0].textContent.trim() : '', sb = sc[1] ? sc[1].textContent.trim() : '', parts = ev.split('·'), title = parts[0].trim(), round = (parts[1] || '').trim();
        var f = doc.createElement('button'); f.type = 'button'; f.className = 'ecg-f'; f.__a = i * GAP; f.__i = i; f.__row = r; f.__t = title + (round ? ' · ' + round : '');
        if (live) f.setAttribute('data-live', '');
        f.setAttribute('aria-label', (r.getAttribute('aria-label') || title) + '. Click to look closer.');
        f.innerHTML = '<span class="ecg-glow" aria-hidden="true"></span><span class="ecg-art"><img src="assets/sports/' + sportOf(ev) + '.webp?v=s1" alt="" loading="lazy" decoding="async" draggable="false"><span class="ecg-sc"><span><em>' + esc(A || An) + '</em><b>' + esc(sa) + '</b></span><span><em>' + esc(B || Bn) + '</em><b>' + esc(sb) + '</b></span></span>' + (live ? '<span class="ecg-live">Live</span>' : '') + '</span>' +
          '<span class="ecg-lab"><i>' + esc(title) + '</i><i class="ecg-r">' + esc(round || st) + '</i><small>' + esc(where) + ' · ' + esc(st) + '</small></span>';
        room.appendChild(f); frames.push(f);
      });
      if (focus >= frames.length) focus = -1; place();
    }
    function walkA() { var r = sec.getBoundingClientRect(), vh = window.innerHeight, k = Math.max(0, Math.min(1, (vh * 0.45 - r.top) / Math.max(1, r.height))); return k * GAP * Math.max(0, frames.length - 1) + drag; }
    function cam() {
      /* camera on an inner track, looking along the corridor and turned toward the outer wall */
      if (focus >= 0 && frames[focus]) { var fa = frames[focus].__a * Math.PI / 180, d = R - FW * 2.9, hh = stage.clientHeight; return { x: -d * Math.sin(fa), z: -d * Math.cos(fa), yaw: fa, y: -hh * 0.13 }; }
      var w = Math.max(-GAP, Math.min(GAP * (frames.length + 0.2), walkA() - GAP * 1.6)) * Math.PI / 180, rc = R * 0.7;
      return { x: -rc * Math.sin(w), z: -rc * Math.cos(w), yaw: w + Math.PI / 2 - 0.55, y: 0 };
    }
    function lerp(a, b, k) { return a + (b - a) * k; }
    function place() {
      raf = 0; if (!frames.length) return;
      var W = stage.clientWidth, H = stage.clientHeight; R = Math.max(1150, Math.min(2400, W * 1.7)); P = Math.max(520, W * 0.62); room.style.perspective = P + 'px';
      FW = Math.max(200, Math.min(360, W * 0.24)); WH = Math.max(380, H * 0.82); stage.style.setProperty('--fw', FW + 'px'); stage.style.setProperty('--wh', WH + 'px');
      var t = cam(); if (!camNow || REDUCED) camNow = t; else { var k = 0.14; camNow = { x: lerp(camNow.x, t.x, k), z: lerp(camNow.z, t.z, k), yaw: lerp(camNow.yaw, t.yaw, k), y: lerp(camNow.y, t.y, k) }; }
      var c = camNow, fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = -fz, rz = fx, near = -1, best = 1e9;
      function put(el, a, r, inward, yo) {
        var ar = a * Math.PI / 180, px = -r * Math.sin(ar), pz = -r * Math.cos(ar), dx = px - c.x, dz = pz - c.z;
        var xc = dx * rx + dz * rz, zc = -(dx * fx + dz * fz);
        if (zc > -160 || zc < -9000) { el.style.visibility = 'hidden'; return null; }
        var nx = inward ? Math.sin(ar) : -Math.sin(ar), nz = inward ? Math.cos(ar) : -Math.cos(ar), nxc = nx * rx + nz * rz, nzc = -(nx * fx + nz * fz);
        el.style.visibility = ''; el.style.transform = 'translate(-50%,-50%) translate3d(' + xc.toFixed(1) + 'px,' + ((yo || 0) - c.y).toFixed(1) + 'px,' + (zc + P).toFixed(1) + 'px) rotateY(' + (Math.atan2(nxc, nzc) * 180 / Math.PI).toFixed(2) + 'deg)';
        el.style.setProperty('--fog', Math.min(1, Math.max(0, (-zc - 900) / 4200)).toFixed(3)); return { xc: xc, zc: zc };
      }
      var yw = -H * 0.1, yf = -H * 0.17; walls.forEach(function (w) { put(w, w.__a, w.__in ? R * 0.5 : R, !w.__in, yw); });
      frames.forEach(function (f, i) { var q = put(f, f.__a, R - 2, true, yf); if (q) { var d = Math.abs(q.xc) + Math.abs(q.zc + 1200) * 0.4; if (d < best) { best = d; near = i; } } });
      frames.forEach(function (f, i) { f.toggleAttribute('data-near', i === near); f.toggleAttribute('data-focus', i === focus); });
      var cur = frames[focus >= 0 ? focus : near]; if (cur) { var tt = stage.querySelector('[data-ecg-t]'); if (tt.textContent !== cur.__t) tt.textContent = cur.__t; stage.__cur = cur.__i; }
      stage.toggleAttribute('data-focus', focus >= 0);
      if (!REDUCED && (Math.abs(camNow.x - t.x) > 0.5 || Math.abs(camNow.z - t.z) > 0.5 || Math.abs(camNow.yaw - t.yaw) > 0.001)) q();
    }
    function q() { if (!raf) raf = requestAnimationFrame(place); }
    function open(i) { var f = frames[i]; if (!f) return; var row = f.__row; f.setAttribute('data-fly', ''); setTimeout(function () { f.removeAttribute('data-fly'); if (row && row.isConnected) row.click(); setMode('list'); var d = inner.querySelector('[data-r=ec-detail]'); if (d) d.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }); }, REDUCED ? 0 : 380); }
    function setMode(m) { panel.setAttribute('data-ecs', m); focus = -1; bar.querySelectorAll('[data-ecs]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ecs') === m ? 'true' : 'false'); }); if (m === 'spiral') { built = ''; build(); } }
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-ecs]'); if (b) setMode(b.getAttribute('data-ecs')); });
    stage.addEventListener('pointerdown', function (e) { if (e.button || e.target.closest('button:not(.ecg-f)')) return; dragging = { x: e.clientX, d: drag, moved: 0 }; });
    window.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - dragging.x; dragging.moved = Math.max(dragging.moved, Math.abs(dx)); if (dragging.moved > 4) { stage.setAttribute('data-drag', ''); focus = -1; drag = dragging.d - dx * 0.06; q(); } });
    window.addEventListener('pointerup', function () { if (!dragging) return; stage.__moved = dragging.moved; dragging = null; stage.removeAttribute('data-drag'); });
    stage.addEventListener('click', function (e) {
      if (e.target.closest('[data-ecg-open]')) { open(stage.__cur); return; }
      var s = e.target.closest('[data-ecg-step]'); if (s) { var to = Math.max(0, Math.min(frames.length - 1, (stage.__cur || 0) + (+s.getAttribute('data-ecg-step')))); focus = -1; drag += (to - (stage.__cur || 0)) * GAP; q(); return; }
      var f = e.target.closest('.ecg-f'); if (!f || stage.__moved > 4) { stage.__moved = 0; if (!f && focus >= 0) { focus = -1; q(); } return; }
      if (focus === f.__i) open(f.__i); else { focus = f.__i; q(); }
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && focus >= 0) { focus = -1; q(); } });
    stage.addEventListener('wheel', function (e) { if (e.ctrlKey || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.2) return; e.preventDefault(); focus = -1; drag += e.deltaX * 0.03; q(); }, { passive: false });
    window.addEventListener('scroll', function () { if (panel.getAttribute('data-open') === '1' && panel.getAttribute('data-ecs') === 'spiral') { if (focus >= 0 && Math.abs(window.scrollY - (stage.__fy || 0)) > 120) focus = -1; q(); } }, { passive: true });
    stage.addEventListener('click', function () { stage.__fy = window.scrollY; }, true);
    window.addEventListener('resize', q);
    var mt = 0; new MutationObserver(function () { if (mt) return; mt = setTimeout(function () { mt = 0; if (panel.getAttribute('data-ecs') === 'spiral') build(); }, 300); }).observe(list, { childList: true, subtree: true, characterData: true });
    new MutationObserver(function () { if (panel.getAttribute('data-open') === '1' && panel.getAttribute('data-ecs') === 'spiral') { built = ''; camNow = null; build(); } }).observe(panel, { attributes: true, attributeFilter: ['data-open'] });
    build();
    var userClosed = false; try { userClosed = sessionStorage.getItem('gms-ec-closed') === '1'; } catch (e) {}
    var tog = sec.querySelector('.ecx-toggle'), auto = false;
    if (tog) tog.addEventListener('click', function () { if (auto) { auto = false; return; } var closing = panel.getAttribute('data-open') === '1'; userClosed = closing; try { sessionStorage.setItem('gms-ec-closed', closing ? '1' : '0'); } catch (e) {} }, true);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !userClosed && panel.getAttribute('data-open') !== '1' && tog) { auto = true; tog.click(); } }); }, { threshold: 0.2 }).observe(sec);
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
    var G = 2200, DAMP = 0.988, ITERS = 10, MEND = 7;
    function size() {
      var r = st.getBoundingClientRect(); W = r.width; H = r.height;
      UP = parseFloat(getComputedStyle(cv).top) * -1 || 0;
      cv.width = Math.round(W * dpr); cv.height = Math.round((H + UP) * dpr); cv.style.width = W + 'px'; cv.style.height = (H + UP) + 'px';
      BW = bd.offsetWidth || 300; SW = Math.round(BW * 0.155);
      var len = UP + Math.max(110, H * 0.14); rest = len / N;
      var x0 = W / 2, y0 = 0; P = [];
      for (var i = 0; i <= N; i++) { var x = x0 + Math.sin(i * 0.3) * 2, y = y0 + i * rest; P.push({ x: x, y: y, px: x, py: y }); }
    }
    function step(dt) {
      var t = performance.now() / 1000, breeze = grab ? 0 : Math.sin(t * 0.7 + wind) * 14 + Math.sin(t * 1.9) * 6;
      for (var i = 1; i <= N; i++) {
        var q = P[i]; if (grab && i === N) continue;
        var vx = (q.x - q.px) * DAMP, vy = (q.y - q.py) * DAMP; q.px = q.x; q.py = q.y;
        q.x += vx + breeze * (i / N) * dt * dt; q.y += vy + G * dt * dt;
      }
      if (grab) { var e = P[N], tx = grab.x, ty = grab.y; e.px = e.x; e.py = e.y; e.x += (tx - e.x) * 0.5; e.y += (ty - e.y) * 0.5; }
      for (var k = 0; k < ITERS; k++) {
        for (var j = 0; j < N; j++) {
          var a = P[j], b = P[j + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1e-4, diff = (d - rest) / d;
          var wa = j === 0 ? 0 : 1, wb = (j + 1 === N) ? (grab ? 0 : 1 / MEND) : 1, sum = wa + wb; if (!sum) continue;
          a.x += dx * diff * wa / sum; a.y += dy * diff * wa / sum; b.x -= dx * diff * wb / sum; b.y -= dy * diff * wb / sum;
        }
        P[0].x = W / 2; P[0].y = 0;
      }
      /* the pass: a pendulum hanging from the strap end, pushed by how the end accelerates */
      var e2 = P[N], f = P[N - 2], phi = Math.atan2(e2.x - f.x, e2.y - f.y), ax = (e2.x - e2.px) - (lastPX || 0); lastPX = e2.x - e2.px;
      var alpha = -38 * (th - phi * 0.8) - 3.2 * om - ax * 2.6;
      om += alpha * dt; th += om * dt; if (th > 1.25) { th = 1.25; om *= -0.3; } if (th < -1.25) { th = -1.25; om *= -0.3; }
    }
    function draw() {
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H + UP);
      cx.lineJoin = 'round'; cx.lineCap = 'butt';
      cx.beginPath(); cx.moveTo(P[0].x, P[0].y - 4);
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
    function drop() { if (!grab) return; grab = null; st.removeAttribute('data-grab'); }
    hd.addEventListener('pointerup', drop); hd.addEventListener('pointercancel', drop);
    hd.addEventListener('click', function (e) { if (moved > 8) { e.stopPropagation(); e.preventDefault(); } moved = 0; });
    hd.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hd.click(); } });
    window.addEventListener('gms:ly-swap', function () { om += (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random()); P[N].px -= 5; go(); });
    var io = new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) go(); }, { rootMargin: '120px' }); io.observe(st);
    window.addEventListener('resize', function () { size(); go(); });
    size();
    if (REDUCED) { for (var i = 0; i < 400; i++) step(1 / 120); vis = true; draw(); vis = false; io.disconnect(); }
  }

  function scan() { t = 0; flaps(); masks(); parScan(); ecSpiral(); field(); badge(); inverter(); rowsPass(); glance(); lanyard(); }
  new MutationObserver(function () { if (!t) t = setTimeout(scan, 160); }).observe(doc.body || root, { childList: true, subtree: true });
  window.addEventListener('gms:entered', scan);
  scan(); botHello();
})();
