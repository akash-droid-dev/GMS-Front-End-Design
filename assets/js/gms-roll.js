/* Venue maps arrive rolled up: the real plan is printed on paper and unrolls from a paper roll as it scrolls into view.
   When it is fully open the paper gives way to the live plan underneath (the same picture), so pins and zoom just work. */
(function () {
  if (window.gmsRoll) return;
  var D = document, REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = [
    '.rm{position:absolute;inset:0;z-index:7;overflow:hidden;border-radius:inherit;pointer-events:auto;--u:0;transition:opacity .45s ease}',
    '.rm[data-done]{opacity:0;pointer-events:none}',
    '.rm-table{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 0%,#232326 0%,#0E0E10 70%),#0B0B0C}',
    '.rm-table::after{content:"";position:absolute;inset:0;opacity:.35;background:repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0 1px,transparent 1px 7px)}',
    '.rm-sheet{position:absolute;inset:0;clip-path:inset(0 0 calc(100% - var(--u) * 100%) 0);background:#F4F1E8}',
    '.rm-sheet img{position:absolute;inset:0;width:100%;height:100%;object-fit:var(--fit,cover);filter:sepia(.06) contrast(1.02)}',
    '.rm-sheet::before{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;mix-blend-mode:multiply;opacity:.5;background:radial-gradient(140% 100% at 50% 0%,transparent 55%,rgba(120,100,70,.18)),url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'.8\' numOctaves=\'3\'/%3E%3CfeColorMatrix values=\'0 0 0 0 .55 0 0 0 0 .5 0 0 0 0 .42 0 0 0 .22 0\'/%3E%3C/filter%3E%3Crect width=\'140\' height=\'140\' filter=\'url(%23n)\'/%3E%3C/svg%3E")}',
    '.rm-sheet::after{content:"";position:absolute;left:0;right:0;z-index:2;height:90px;top:calc(var(--u) * 100% - 90px);pointer-events:none;background:linear-gradient(180deg,transparent,rgba(30,24,14,.32))}',
    '.rm-roll{position:absolute;left:-1.5%;right:-1.5%;z-index:3;height:calc(var(--rh,46px) * (1 - var(--u) * .42));top:calc(var(--u) * 100% - var(--rh,46px) * (1 - var(--u) * .42) * .5);border-radius:10px/50%;',
    'background:linear-gradient(180deg,#77736A 0%,#C9C4B6 12%,#F3EFE4 30%,#FFFDF6 42%,#E6E1D3 62%,#B3AE9F 82%,#6E6A60 100%);box-shadow:0 14px 22px -6px rgba(0,0,0,.55),0 3px 6px rgba(0,0,0,.35)}',
    '.rm-roll::before,.rm-roll::after{content:"";position:absolute;top:0;bottom:0;width:22px;border-radius:50%;background:radial-gradient(circle at 50% 50%,#4E4A42 0 10%,#D8D2C3 11% 22%,#9E998B 23% 30%,#E8E3D6 31% 44%,#A7A294 45% 52%,#EFEADE 53% 70%,#8A8579 71%)}',
    '.rm-roll::before{left:-4px}.rm-roll::after{right:-4px}',
    '.rm-hint{position:absolute;left:50%;bottom:16%;z-index:4;transform:translateX(-50%);display:inline-flex;align-items:center;gap:10px;padding:11px 18px;border-radius:999px;background:rgba(242,241,236,.1);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px rgba(242,241,236,.22);color:#F2F1EC;font:600 13px/1 Inter,system-ui,sans-serif;white-space:nowrap;opacity:calc(1 - var(--u) * 2.5);transition:opacity .2s}',
    '.rm-hint i{width:14px;height:20px;border-radius:8px;box-shadow:inset 0 0 0 1.5px #F2F1EC;position:relative}.rm-hint i::after{content:"";position:absolute;left:50%;top:4px;width:2px;height:5px;margin-left:-1px;border-radius:2px;background:#F2F1EC;animation:rmWheel 1.6s ease-in-out infinite}',
    '@keyframes rmWheel{0%{transform:translateY(0);opacity:1}70%{transform:translateY(6px);opacity:0}100%{opacity:0}}',
    '.rm-t{position:absolute;left:clamp(16px,3vw,32px);top:calc(var(--rh,46px) + 14px);z-index:4;color:#F2F1EC;display:flex;flex-direction:column;gap:6px;opacity:calc(1 - var(--u) * 3)}',
    '.rm-t small{font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.18em;text-transform:uppercase;opacity:.6}.rm-t b{font:400 clamp(26px,3.6vw,52px)/.9 Anton,Impact,sans-serif;text-transform:uppercase}',
    '@media (max-width:760px){.rm{--rh:30px}.rm-hint{font-size:12px;padding:9px 14px}}'
  ].join('\n');
  var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);

  var all = [], raf = 0;
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function tick() {
    raf = 0; var vh = window.innerHeight, now = performance.now(), more = false;
    all.forEach(function (c) {
      if (!c.host.isConnected) return;
      var r = c.host.getBoundingClientRect(); if (!r.height) return;
      var target;
      if (c.anim) { var p = clamp((now - c.anim.t0) / c.anim.dur); target = c.anim.from + (c.anim.to - c.anim.from) * ease(p); if (p >= 1) { c.anim = null; } else more = true; c.u = target; }
      else { target = REDUCED ? 1 : clamp((vh * 0.92 - r.top) / (vh * 0.5)); c.u += (target - c.u) * 0.2; if (Math.abs(target - c.u) < 0.002) c.u = target; else more = true; }
      c.el.style.setProperty('--u', c.u.toFixed(4));
      if (c.u >= 0.999) c.el.setAttribute('data-done', ''); else c.el.removeAttribute('data-done');
    });
    if (more) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  window.addEventListener('scroll', kick, { passive: true }); window.addEventListener('resize', kick);

  window.gmsRoll = {
    attach: function (host, o) {
      o = o || {}; if (host.__rm) return host.__rm; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var el = D.createElement('div'); el.className = 'rm'; el.setAttribute('aria-hidden', 'true'); if (o.fit) el.style.setProperty('--fit', o.fit);
      el.innerHTML = '<div class="rm-table"></div><div class="rm-sheet"><img alt="" decoding="async" draggable="false"></div><div class="rm-roll"></div>' +
        (o.title ? '<div class="rm-t"><small></small><b></b></div>' : '') + '<span class="rm-hint"><i></i>Scroll to unroll the map</span>';
      el.querySelector('img').src = o.src || ''; if (o.title) { el.querySelector('.rm-t small').textContent = o.kicker || ''; el.querySelector('.rm-t b').textContent = o.title; }
      host.appendChild(el);
      var c = { host: host, el: el, u: 0, anim: null,
        setSrc: function (s) { el.querySelector('img').src = s; },
        replay: function () { if (REDUCED) { c.u = 1; kick(); return; } c.anim = { from: 0, to: 1, t0: performance.now(), dur: 1300 }; c.u = 0; kick(); } };
      host.__rm = c; all.push(c); kick(); return c;
    },
    kick: kick
  };
})();
