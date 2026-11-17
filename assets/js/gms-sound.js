/* GMS ambient sound: a slow, warm pad generated in the browser (no audio file).
   Starts only after a tap (browser rule), fades in and out, pauses while the tab is hidden,
   and remembers the visitor's choice. Any element with [data-snd] toggles it. */
(function () {
  'use strict';
  var KEY = 'gms-sound', ctx = null, master = null, bus = null, timer = 0, bell = 0, on = false, step = 0;
  // chord loop (MIDI notes): D maj9, B min11, G maj9, A 6/9; root an octave down as a soft sine
  var CH = [[50, 57, 62, 66, 69, 76], [47, 54, 61, 62, 66, 73], [43, 50, 57, 59, 62, 69], [45, 52, 59, 61, 64, 71]];
  var BELL = [74, 76, 78, 81, 83, 86];
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function save(v) { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) {} }
  function impulse(c, sec, decay) {
    var n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    var cv = c.createConvolver(); cv.buffer = b; return cv;
  }
  function build() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.Q.value = 0.4;
    var rv = impulse(ctx, 4.5, 2.4), wet = ctx.createGain(), dry = ctx.createGain(); wet.gain.value = 0.6; dry.gain.value = 0.45;
    bus = ctx.createGain(); bus.gain.value = 1;
    bus.connect(lp); lp.connect(dry); lp.connect(rv); rv.connect(wet); dry.connect(comp); wet.connect(comp); comp.connect(master); master.connect(ctx.destination);
    // the filter breathes slowly so the pad never sounds static
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.045; lg.gain.value = 650; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    return true;
  }
  function chord(notes, t) {
    notes.forEach(function (m, j) {
      var low = j === 0, peak = low ? 0.13 : 0.045 - j * 0.003;
      [-7, 7].forEach(function (det) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = low ? 'sine' : (j % 2 ? 'triangle' : 'sine'); o.frequency.value = hz(low ? m - 12 : m); o.detune.value = det;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 4.5); g.gain.setValueAtTime(peak, t + 8.5); g.gain.linearRampToValueAtTime(0, t + 14);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + 14.2);
      });
    });
  }
  function ding() {
    if (!on || !ctx) return; var t = ctx.currentTime + 0.05, m = BELL[Math.floor(Math.random() * BELL.length)];
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 5.2);
    bell = setTimeout(ding, 5000 + Math.random() * 7000);
  }
  function loop() { if (!on) return; chord(CH[step % CH.length], ctx.currentTime + 0.05); step++; timer = setTimeout(loop, 9000); }
  function sync() {
    document.querySelectorAll('[data-snd]').forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on'); b.title = on ? 'Sound on' : 'Sound off';
      var i = b.querySelector('.gi'); if (i) i.setAttribute('data-gi', on ? 'volume_up' : 'volume_off');
      b.toggleAttribute('data-on', on);
    });
  }
  function start() {
    if (on) return; if (!ctx && !build()) return;
    on = true; save(true); if (ctx.state !== 'running') ctx.resume();
    var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0.55, t + 3);
    clearTimeout(timer); clearTimeout(bell); loop(); bell = setTimeout(ding, 3500); sync();
  }
  function stop(keep) {
    if (!on) { sync(); return; } on = false; if (!keep) save(false); clearTimeout(timer); clearTimeout(bell);
    if (ctx) { var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + 0.9); setTimeout(function () { if (!on && ctx) ctx.suspend(); }, 1000); }
    sync();
  }
  var hiddenStop = false;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && on) { hiddenStop = true; stop(true); }
    else if (!document.hidden && hiddenStop) { hiddenStop = false; start(); }
  });
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-snd]'); if (!b) return; e.preventDefault(); if (on) stop(); else start(); });
  var pend = 0; // re-sync buttons the page draws later (one check per frame at most)
  new MutationObserver(function () { if (!pend) pend = setTimeout(function () { pend = 0; sync(); }, 250); }).observe(document.body || document.documentElement, { childList: true, subtree: true });
  window.GMSSound = { start: start, stop: stop, toggle: function () { if (on) stop(); else start(); }, get on() { return on; },
    wanted: function () { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } } };
  sync();
})();
