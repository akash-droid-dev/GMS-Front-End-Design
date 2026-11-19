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
  function ecSpiral() {
    var sec = doc.querySelector('[data-r=ecx]'); if (!sec) return; var panel = sec.querySelector('.ecx-panel'), inner = panel && panel.querySelector('.ecx-inner'), list = inner && inner.querySelector('[data-r=ec-list]');
    if (!list || panel.__sp) return; panel.__sp = 1; panel.setAttribute('data-ecs', 'spiral');
    var bar = doc.createElement('div'); bar.className = 'ecs-bar'; bar.innerHTML = '<button type="button" data-ecs="spiral" aria-pressed="true">spiral</button><i aria-hidden="true"></i><button type="button" data-ecs="list" aria-pressed="false">list</button>';
    var stage = doc.createElement('div'); stage.className = 'ecs-stage'; stage.setAttribute('aria-label', 'Matches in a spiral. Drag to turn, click a match to open it.');
    stage.innerHTML = '<div class="ecs-rot"></div><p class="ecs-hint">Drag or scroll to turn · click a match to open it</p>';
    var grid = inner.querySelector('[data-r=ec-grid]'); inner.insertBefore(bar, inner.firstChild); inner.insertBefore(stage, grid);
    var rot = stage.firstChild, cards = [], drag = 0, theta = 0, step = 48, R = 420, yStep = 66, raf = 0, dragging = null, built = '';
    function rows() { return Array.prototype.slice.call(list.querySelectorAll('[data-r=ec-row]')); }
    function build() {
      var rs = rows(), sig = rs.map(function (r) { return r.textContent; }).join('|'); if (sig === built) return; built = sig;
      var fresh = !cards.length; rot.innerHTML = ''; cards = rs.map(function (r, i) {
        var c = doc.createElement('button'); c.type = 'button'; c.className = 'ecs-card'; c.style.setProperty('--c', r.style.getPropertyValue('--c') || '#F2F1EC'); c.style.setProperty('--i', i);
        c.innerHTML = '<span class="ecs-in">' + r.innerHTML + '</span>'; if (r.querySelector('[data-live="1"]')) c.setAttribute('data-live', ''); c.setAttribute('aria-label', r.getAttribute('aria-label') || '');
        c.__row = r; c.__i = i; rot.appendChild(c); return c;
      });
      step = cards.length > 1 ? Math.max(30, Math.min(56, 300 / cards.length)) : 0; place(); if (fresh && panel.getAttribute('data-open') === '1') intro();
    }
    function scrollTheta() { var r = sec.getBoundingClientRect(), vh = window.innerHeight, k = Math.max(0, Math.min(1, (vh * 0.5 - r.top) / Math.max(1, r.height))); return -k * step * Math.max(0, cards.length - 1); }
    function place() {
      raf = 0; if (!cards.length) return; var w = stage.clientWidth; R = Math.max(240, Math.min(520, w * 0.36)); theta = scrollTheta() + drag; rot.style.transform = 'translateZ(' + (-R).toFixed(0) + 'px)';
      var front = 0, best = 1e9;
      cards.forEach(function (c, i) {
        var a = i * step + theta, n = ((a % 360) + 540) % 360 - 180, cs = Math.cos(n * Math.PI / 180), y = (i * step + theta) / step * yStep;
        c.style.transform = 'translate(-50%,-50%) translateY(' + y.toFixed(1) + 'px) rotateY(' + a.toFixed(2) + 'deg) translateZ(' + R.toFixed(0) + 'px) rotateY(' + (-n * 0.18).toFixed(2) + 'deg)'; c.style.setProperty('--n', n.toFixed(1));
        c.style.opacity = cs < -0.15 ? 0 : (0.28 + 0.72 * Math.max(0, cs)).toFixed(3); c.style.zIndex = Math.round(cs * 100) + 100; c.style.pointerEvents = cs < 0.2 ? 'none' : '';
        var d = Math.abs(n) + Math.abs(y) * 0.2; if (d < best) { best = d; front = i; }
      });
      cards.forEach(function (c, i) { c.toggleAttribute('data-front', i === front); }); stage.__front = front;
    }
    function q() { if (!raf) raf = requestAnimationFrame(place); }
    function intro() { if (REDUCED) return; stage.classList.remove('ecs-go'); void stage.offsetWidth; stage.classList.add('ecs-go'); }
    function setMode(m) { panel.setAttribute('data-ecs', m); bar.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ecs') === m ? 'true' : 'false'); }); if (m === 'spiral') { built = ''; build(); intro(); } }
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-ecs]'); if (b) setMode(b.getAttribute('data-ecs')); });
    stage.addEventListener('pointerdown', function (e) { if (e.button) return; dragging = { x: e.clientX, d: drag, moved: 0, id: e.pointerId }; });
    window.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - dragging.x; dragging.moved = Math.max(dragging.moved, Math.abs(dx)); if (dragging.moved > 4) { stage.setAttribute('data-drag', ''); drag = dragging.d + dx * 0.28; q(); } });
    window.addEventListener('pointerup', function () { if (!dragging) return; var moved = dragging.moved; dragging = null; stage.removeAttribute('data-drag'); stage.__moved = moved; });
    stage.addEventListener('click', function (e) {
      var c = e.target.closest('.ecs-card'); if (!c || stage.__moved > 4) { stage.__moved = 0; return; }
      if (c.__i !== stage.__front) { var a = c.__i * step + theta, n = ((a % 360) + 540) % 360 - 180; drag -= n; /* turn the clicked match to the front */ stage.classList.add('ecs-ease'); q(); setTimeout(function () { stage.classList.remove('ecs-ease'); }, 700); return; }
      c.setAttribute('data-fly', ''); var row = c.__row;
      setTimeout(function () { if (row && row.isConnected) row.click(); setMode('list'); c.removeAttribute('data-fly'); var d = inner.querySelector('[data-r=ec-detail]'); if (d) d.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }); }, REDUCED ? 0 : 520);
    });
    window.addEventListener('scroll', function () { if (panel.getAttribute('data-open') === '1' && panel.getAttribute('data-ecs') === 'spiral') q(); }, { passive: true });
    window.addEventListener('resize', q);
    var mt = 0; new MutationObserver(function () { if (mt) return; mt = setTimeout(function () { mt = 0; if (panel.getAttribute('data-ecs') === 'spiral') build(); }, 300); }).observe(list, { childList: true, subtree: true, characterData: true });
    new MutationObserver(function () { if (panel.getAttribute('data-open') === '1' && panel.getAttribute('data-ecs') === 'spiral') { built = ''; build(); intro(); } }).observe(panel, { attributes: true, attributeFilter: ['data-open'] });
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
