/* GMS curved gallery room: items hang as framed prints on the outer wall of a curved room (home section 07, sport pages) */
(function () {
  'use strict';
  var doc = document, REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* ---------------- curved gallery room (shutabug): items hang as framed prints on the outer wall of a curved room ---------------- */
  window.gmsRoom = function (stage, o) {
    stage.classList.add('ecg'); stage.innerHTML = '<div class="ecg-room"></div><div class="ecg-cap" aria-live="polite"><small>' + (o.capLead || 'You are walking past') + '</small><b data-ecg-t></b><button type="button" class="ecg-open" data-ecg-open>' + (o.openLabel || 'Open →') + '</button></div>' +
      '<div class="ecg-nav"><button type="button" data-ecg-step="-1" aria-label="Previous">←</button><button type="button" data-ecg-step="1" aria-label="Next">→</button></div><p class="ecg-hint">Scroll or drag to walk round<br>Click a frame to look closer</p>';
    var room = stage.firstChild, frames = [], walls = [], built = '', raf = 0, dragging = null, drag = 0, focus = -1, camNow = null;
    var R = 2400, GAP = 13, WH = 520, FW = 300, P = 800;
    function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function build() {
      var its = o.items(), sig = its.map(function (x) { return x.sig; }).join('|'); if (sig === built) return; built = sig;
      room.innerHTML = ''; walls = []; frames = [];
      var n = its.length, span = Math.max(80, (n + 2) * GAP);
      for (var a = -GAP * 2; a <= span; a += 5) { var w = doc.createElement('i'); w.className = 'ecg-wall'; w.__a = a; w.__w = 1; room.appendChild(w); walls.push(w); }
      for (var a2 = -GAP * 2; a2 <= span; a2 += 8) { var w2 = doc.createElement('i'); w2.className = 'ecg-wall ecg-in'; w2.__a = a2; w2.__w = 1; w2.__in = 1; room.appendChild(w2); walls.push(w2); }
      its.forEach(function (it, i) {
        var f = doc.createElement('button'); f.type = 'button'; f.className = 'ecg-f'; f.__a = i * GAP; f.__i = i; f.__it = it; f.__t = it.title + (it.round ? ' · ' + it.round : '');
        if (it.live) f.setAttribute('data-live', ''); f.setAttribute('aria-label', (it.aria || it.title) + '. Click to look closer.');
        var sc = it.scores ? '<span class="ecg-sc"><span><em>' + esc(it.scores[0]) + '</em><b>' + esc(it.scores[1]) + '</b></span><span><em>' + esc(it.scores[2]) + '</em><b>' + esc(it.scores[3]) + '</b></span></span>' : (it.plate ? '<span class="ecg-pl">' + esc(it.plate) + '</span>' : '');
        f.innerHTML = '<span class="ecg-glow" aria-hidden="true"></span><span class="ecg-art"><img src="' + esc(it.img) + '" alt="" loading="lazy" decoding="async" draggable="false">' + sc + (it.live ? '<span class="ecg-live">Live</span>' : '') + '</span>' +
          '<span class="ecg-lab"><i>' + esc(it.title) + '</i>' + (it.round ? '<i class="ecg-r">' + esc(it.round) + '</i>' : '') + '<small>' + esc(it.small) + '</small></span>';
        room.appendChild(f); frames.push(f);
      });
      if (focus >= frames.length) focus = -1; place();
    }
    function walkA() { return (o.walk ? o.walk() : 0) * GAP * Math.max(0, frames.length - 1) + drag; }
    function cam() {
      if (focus >= 0 && frames[focus]) { var fa = frames[focus].__a * Math.PI / 180, d = R - FW * 2.9, hh = stage.clientHeight; return { x: -d * Math.sin(fa), z: -d * Math.cos(fa), yaw: fa, y: -hh * 0.13 }; }
      var w = Math.max(-GAP, Math.min(GAP * (frames.length + 0.2), walkA() - GAP * 1.6)) * Math.PI / 180, rc = R * 0.7;
      return { x: -rc * Math.sin(w), z: -rc * Math.cos(w), yaw: w + Math.PI / 2 - 0.55, y: 0 };
    }
    function lerp(a, b, k) { return a + (b - a) * k; }
    function place() {
      raf = 0; if (!frames.length || !stage.clientWidth) return;
      var W = stage.clientWidth, H = stage.clientHeight; R = Math.max(1150, Math.min(2400, W * 1.7)); P = Math.max(520, W * 0.62);
      FW = Math.max(200, Math.min(360, W * 0.24)); WH = Math.max(380, H * 0.82);
      var t = cam(), L = o.lights ? Math.max(0, Math.min(1, o.lights())) : 1;
      var sz = P + '|' + FW + '|' + WH; if (stage.__sz !== sz) { stage.__sz = sz; room.style.perspective = P + 'px'; stage.style.setProperty('--fw', FW + 'px'); stage.style.setProperty('--wh', WH + 'px'); } if (!camNow || REDUCED) camNow = t; else { var k = 0.12; camNow = { x: lerp(camNow.x, t.x, k), z: lerp(camNow.z, t.z, k), yaw: lerp(camNow.yaw, t.yaw, k), y: lerp(camNow.y, t.y, k) }; }
      var c = camNow, fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = -fz, rz = fx, near = -1, best = 1e9;
      function put(el, a, r, inward, yo) {
        var ar = a * Math.PI / 180, px = -r * Math.sin(ar), pz = -r * Math.cos(ar), dx = px - c.x, dz = pz - c.z;
        var xc = dx * rx + dz * rz, zc = -(dx * fx + dz * fz);
        if (zc > -160 || zc < -9000) { if (!el.__hid) { el.__hid = 1; el.style.visibility = 'hidden'; } return null; }
        var nx = inward ? Math.sin(ar) : -Math.sin(ar), nz = inward ? Math.cos(ar) : -Math.cos(ar), nxc = nx * rx + nz * rz, nzc = -(nx * fx + nz * fz);
        if (el.__hid) { el.__hid = 0; el.style.visibility = ''; } el.style.transform = 'translate(-50%,-50%) translate3d(' + xc.toFixed(1) + 'px,' + ((yo || 0) - c.y).toFixed(1) + 'px,' + (zc + P).toFixed(1) + 'px) rotateY(' + (Math.atan2(nxc, nzc) * 180 / Math.PI).toFixed(2) + 'deg)';
        var fg = Math.round(Math.min(1, Math.max(0, (-zc - 900) / 4200)) * 25) / 25; if (el.__fg !== fg) { el.__fg = fg; if (el.__w) { var dk = String(Math.round((1 - (1 - fg * 0.78) * (0.14 + 0.86 * L)) / 0.9 * 24)); if (el.__dk !== dk) { el.__dk = dk; el.setAttribute('data-d', dk); } } else el.style.setProperty('--fog', fg); } return { xc: xc, zc: zc };
      }
      var Lq = Math.round(L * 50) / 50; if (stage.__L !== Lq) { stage.__L = Lq; walls.forEach(function (w) { w.__fg = -1; }); }
      var yw = -H * 0.1, yf = -H * 0.17; walls.forEach(function (w) { put(w, w.__a, w.__in ? R * 0.5 : R, !w.__in, yw); });
      frames.forEach(function (f, i) { var q2 = put(f, f.__a, R - 2, true, yf); if (q2) { var sx = q2.xc * P / Math.max(1, -q2.zc), d = Math.abs(q2.zc) + (Math.abs(sx) > W * 0.42 ? 1e6 : 0); if (d < best) { best = d; near = i; } } });
      frames.forEach(function (f, i) { if (f.hasAttribute('data-near') !== (i === near)) f.toggleAttribute('data-near', i === near); if (f.hasAttribute('data-focus') !== (i === focus)) f.toggleAttribute('data-focus', i === focus); });
      if (o.lights) { if (!stage.hasAttribute('data-lights')) stage.setAttribute('data-lights', ''); frames.forEach(function (f, i) { var on = L >= (i + 0.6) / frames.length; if (f.hasAttribute('data-lit') !== on) f.toggleAttribute('data-lit', on); }); }
      var cur = frames[focus >= 0 ? focus : near]; if (cur) { var tt = stage.querySelector('[data-ecg-t]'); if (tt.textContent !== cur.__t) tt.textContent = cur.__t; stage.__cur = cur.__i; }
      if (stage.hasAttribute('data-focus') !== (focus >= 0)) stage.toggleAttribute('data-focus', focus >= 0);
      if (!REDUCED && (Math.abs(camNow.x - t.x) > 0.5 || Math.abs(camNow.z - t.z) > 0.5 || Math.abs(camNow.yaw - t.yaw) > 0.001)) q();
    }
    function q() { if (!raf) raf = requestAnimationFrame(place); }
    function open(i) { var f = frames[i]; if (!f) return; f.setAttribute('data-fly', ''); setTimeout(function () { f.removeAttribute('data-fly'); o.open(f.__it); }, REDUCED ? 0 : 380); }
    stage.addEventListener('pointerdown', function (e) { if (e.button || e.target.closest('button:not(.ecg-f)')) return; dragging = { x: e.clientX, d: drag, moved: 0 }; });
    window.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - dragging.x; dragging.moved = Math.max(dragging.moved, Math.abs(dx)); if (dragging.moved > 4) { stage.setAttribute('data-drag', ''); focus = -1; drag = dragging.d - dx * 0.06; q(); } });
    window.addEventListener('pointerup', function () { if (!dragging) return; stage.__moved = dragging.moved; dragging = null; stage.removeAttribute('data-drag'); });
    stage.addEventListener('click', function (e) {
      if (e.target.closest('[data-ecg-open]')) { open(stage.__cur); return; }
      var s = e.target.closest('[data-ecg-step]'); if (s) { var to = Math.max(0, Math.min(frames.length - 1, (stage.__cur || 0) + (+s.getAttribute('data-ecg-step')))); focus = -1; drag += (to - (stage.__cur || 0)) * GAP; q(); return; }
      var f = e.target.closest('.ecg-f'); if (!f || stage.__moved > 4) { stage.__moved = 0; if (!f && focus >= 0) { focus = -1; q(); } return; }
      if (focus === f.__i) open(f.__i); else { focus = f.__i; stage.__fy = window.scrollY; q(); }
    });
    doc.addEventListener('keydown', function (e) { if (!o.active()) return; if (e.key === 'Escape' && focus >= 0) { focus = -1; q(); } });
    stage.addEventListener('wheel', function (e) { if (e.ctrlKey || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.2) return; e.preventDefault(); focus = -1; drag += e.deltaX * 0.03; q(); }, { passive: false });
    window.addEventListener('scroll', function () { if (!o.active()) return; if (focus >= 0 && Math.abs(window.scrollY - (stage.__fy || 0)) > 120) focus = -1; q(); }, { passive: true });
    window.addEventListener('resize', q);
    return { build: function () { built = ''; camNow = null; build(); }, q: q };
  };
})();
