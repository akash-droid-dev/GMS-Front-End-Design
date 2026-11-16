/* GMS add-ons: search (Ctrl/Cmd K), medal table + results, My Games planner, chapter rail, theme switch, installable app.
   Runs outside React: it reads the page's data through window.GMSApp and draws its own overlays, so none of it re-renders the page. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var A = null, D = null; // page bridge and its data
  var ICON = function (n) { return '<i class="gi" data-gi="' + n + '"></i>'; };

  /* ------------------------------------------------------------------ styles */
  var CSS = [
    'html.gp-lock{overscroll-behavior:none}',
    '.gp-scrim{position:fixed;inset:0;z-index:118;background:rgba(8,10,16,.52);opacity:0;transition:opacity .3s ease}',
    '.gp-scrim[data-on]{opacity:1}',
    /* toast */
    '.gp-toast{position:fixed;left:50%;bottom:28px;z-index:140;display:flex;align-items:center;gap:10px;padding:11px 12px 11px 16px;border-radius:999px;background:#0B0D12;color:#fff;font:600 14px/1.2 "Instrument Sans",system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);transform:translate(-50%,20px);opacity:0;pointer-events:none;transition:transform .45s var(--gms-ease,ease),opacity .3s}',
    '.gp-toast[data-on]{transform:translate(-50%,0);opacity:1;pointer-events:auto}',
    '.gp-toast .gi{font-size:17px;color:#E7A10E}.gp-toast button{all:unset;cursor:pointer;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.12);font-size:13px}.gp-toast button:hover{background:rgba(255,255,255,.22)}',
    'html[data-theme=dark] .gp-toast{background:#F1F3F7;color:#0B0D12}html[data-theme=dark] .gp-toast button{background:rgba(11,13,18,.08)}',
    '.gp-toast{bottom:92px}@media (max-width:1024px){.gp-toast{bottom:104px}}',
    'html.gp-lock .gp-toast{bottom:auto;top:16px;transform:translate(-50%,-20px)}html.gp-lock .gp-toast[data-on]{transform:translate(-50%,0)}',
    /* search palette */
    '.gp-pal{position:fixed;left:50%;top:min(12vh,110px);z-index:130;width:min(680px,calc(100vw - 24px));max-height:min(620px,calc(100svh - 140px));display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:var(--d-s0,#fff);color:var(--d-ink,#0B0D12);box-shadow:0 30px 80px rgba(8,10,16,.35),0 0 0 1px var(--d-line,rgba(11,13,18,.08));transform:translate(-50%,-10px) scale(.98);opacity:0;transition:transform .35s var(--gms-ease,ease),opacity .2s}',
    '.gp-pal[data-on]{transform:translate(-50%,0) scale(1);opacity:1}',
    '.gp-pal-in{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid var(--d-line,#EEF0F4)}',
    '.gp-pal-in .gi{font-size:20px;color:var(--d-ink3,#6B7180)}',
    '.gp-pal-in input{all:unset;flex:1;min-width:0;font:500 18px/1.3 "Instrument Sans",system-ui,sans-serif;color:inherit}',
    '.gp-pal-in input::placeholder{color:var(--d-ink3,#8A909C)}',
    '.gp-pal-in input::-webkit-search-cancel-button{-webkit-appearance:none;display:none}',
    '.gp-pal .gp-pal-in input:focus,.gp-pal .gp-pal-in input:focus-visible{outline:none!important}.gp-pal-in:focus-within{box-shadow:inset 0 -2px 0 #2F5BFF}',
    '.gp-clr{all:unset;box-sizing:border-box;flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer;font-size:14px;background:var(--d-tint,rgba(11,13,18,.07));color:var(--d-ink2,#4A505C)}.gp-clr:hover{background:var(--d-line,rgba(11,13,18,.12));color:var(--d-ink,#0B0D12)}.gp-clr[hidden]{display:none}',
    '.gp-cancel{all:unset;box-sizing:border-box;flex:none;cursor:pointer;border-radius:999px;color:var(--d-ink2,#4A505C)}.gp-cancel:focus-visible,.gp-clr:focus-visible{outline:2px solid #2F5BFF;outline-offset:2px}',
    '.gp-cancel-d{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 4px 0 10px;border-radius:999px;font-size:15px}.gp-cancel:hover .gp-cancel-d{background:var(--d-tint,rgba(11,13,18,.06));color:var(--d-ink,#0B0D12)}.gp-cancel-m{display:none}',
    '@media (max-width:640px),(hover:none) and (pointer:coarse){.gp-cancel-d{display:none}.gp-cancel-m{display:inline-flex;align-items:center;height:40px;padding:0 6px 0 4px;font:600 15px/1 "Instrument Sans",system-ui,sans-serif;color:#2F5BFF}}',
    '.gp-kbd{font:500 11px/1 "JetBrains Mono",monospace;padding:5px 7px;border-radius:7px;border:1px solid var(--d-line,#E3E6EB);color:var(--d-ink3,#6B7180);white-space:nowrap}',
    '.gp-pal-list{overflow:auto;overscroll-behavior:contain;padding:8px}',
    '.gp-grp{padding:12px 12px 6px;font:500 10.5px/1 "JetBrains Mono",monospace;letter-spacing:.12em;color:var(--d-ink3,#6B7180)}',
    '.gp-it{all:unset;box-sizing:border-box;width:100%;display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 12px;border-radius:14px;cursor:pointer}',
    '.gp-it[data-on]{background:var(--d-tint,#F1F3F7)}',
    '.gp-it-ic{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;font-size:18px;background:var(--d-s1,#F4F5F7);color:var(--c,#2F5BFF)}',
    '.gp-it-t{display:block;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.gp-it-s{display:block;margin-top:2px;font-size:12.5px;color:var(--d-ink2,#5B6270);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.gp-it mark{background:none;color:#2F5BFF}',
    '.gp-it-go{font-size:16px;color:var(--d-ink3,#8A909C);opacity:0}.gp-it[data-on] .gp-it-go{opacity:1}',
    '.gp-empty{padding:34px 16px;text-align:center;color:var(--d-ink2,#5B6270);font-size:14px}',
    '.gp-pal-ft{display:flex;gap:16px;padding:10px 18px;border-top:1px solid var(--d-line,#EEF0F4);font-size:12px;color:var(--d-ink3,#6B7180)}',
    '.gp-pal-ft span{display:flex;align-items:center;gap:6px}',
    '@media (max-width:640px){.gp-pal{top:12px;max-height:calc(100svh - 24px)}.gp-pal-ft{display:none}.gp-pal-in input{font-size:16px}}',
    /* sheet (medals, My Games) */
    '.gp-sheet{position:fixed;top:0;right:0;bottom:0;z-index:120;width:min(940px,100vw);display:flex;flex-direction:column;background:var(--d-s0,#fff);color:var(--d-ink,#0B0D12);box-shadow:-30px 0 80px rgba(8,10,16,.25);transform:translateX(100%);transition:transform .5s var(--gms-ease,ease)}',
    '.gp-sheet[data-on]{transform:none}',
    '@media (max-width:760px){.gp-sheet{top:auto;height:calc(100svh - 10px);border-radius:22px 22px 0 0;transform:translateY(100%)}}',
    '.gp-sh-hd{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 24px 14px;border-bottom:1px solid var(--d-line,#EEF0F4)}',
    '.gp-sh-hd h2{margin:0;font:700 26px/1.05 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.03em}',
    '.gp-sh-hd small{display:block;margin-bottom:6px;font:500 10.5px/1 "JetBrains Mono",monospace;letter-spacing:.12em;color:var(--d-ink3,#6B7180)}',
    '.gp-x{all:unset;box-sizing:border-box;flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;cursor:pointer;font-size:20px;background:var(--d-tint,rgba(11,13,18,.06))}.gp-x:hover{background:var(--d-line,rgba(11,13,18,.12))}',
    '.gp-sh-tabs{flex:none;display:flex;gap:4px;padding:10px 24px;border-bottom:1px solid var(--d-line,#EEF0F4);overflow-x:auto;scrollbar-width:none}',
    '.gp-tab{all:unset;cursor:pointer;flex:none;padding:9px 15px;border-radius:999px;font-size:14px;font-weight:600;color:var(--d-ink2,#5B6270)}.gp-tab:hover{background:var(--d-tint,#F4F5F7)}',
    '.gp-tab[data-on]{background:var(--d-inv,#0B0D12);color:var(--d-on-inv,#fff)}',
    '.gp-sh-bd{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:20px 24px 40px}',
    '@media (max-width:760px){.gp-sh-hd,.gp-sh-tabs{padding-left:16px;padding-right:16px}.gp-sh-bd{padding:16px 16px 36px}.gp-sh-hd h2{font-size:22px}}',
    '.gp-note{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;margin-bottom:18px;border-radius:14px;background:var(--d-s1,#F4F5F7);font-size:13px;line-height:1.5;color:var(--d-ink2,#4A505C)}',
    '.gp-note .gi{flex:none;font-size:16px;margin-top:1px;color:#2F5BFF}',
    '.gp-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}',
    '.gp-chip{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;font-size:13px;font-weight:600;border:1px solid var(--d-line,#E3E6EB);color:var(--d-ink2,#4A505C)}',
    '.gp-chip:hover{border-color:var(--d-ink3,#8A909C)}.gp-chip[data-on]{background:var(--d-inv,#0B0D12);border-color:transparent;color:var(--d-on-inv,#fff)}',
    '.gp-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:18px}',
    '.gp-stat{padding:14px 16px;border-radius:16px;background:var(--d-s1,#F4F5F7)}.gp-stat b{display:block;font:700 26px/1 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.02em}.gp-stat span{display:block;margin-top:6px;font-size:12.5px;color:var(--d-ink2,#5B6270)}',
    '@media (max-width:560px){.gp-stats{grid-template-columns:1fr 1fr}.gp-stat:last-child{grid-column:1/-1}}',
    /* medal table */
    '.gp-mt{width:100%;border-collapse:collapse;font-size:14px}',
    '.gp-mt th{padding:10px 8px;text-align:center;font:500 10.5px/1 "JetBrains Mono",monospace;letter-spacing:.1em;color:var(--d-ink3,#6B7180);border-bottom:1px solid var(--d-line,#EEF0F4)}',
    '.gp-mt th:nth-child(2){text-align:left}',
    '.gp-mt td{padding:12px 8px;text-align:center;border-bottom:1px solid var(--d-line,#F0F2F6);font-variant-numeric:tabular-nums}',
    '.gp-mt td:nth-child(2){text-align:left}.gp-mt td:last-child{font-weight:700}',
    '.gp-mt tr.gp-row{cursor:pointer}.gp-mt tr.gp-row:hover td{background:var(--d-s1,#F7F8FA)}',
    '.gp-rk{font:600 13px/1 "JetBrains Mono",monospace;color:var(--d-ink3,#6B7180)}',
    '.gp-nat{display:flex;align-items:center;gap:10px;font-weight:600}',
    '.gp-code{flex:none;display:inline-grid;place-items:center;min-width:38px;height:22px;padding:0 5px;border-radius:6px;font:600 10.5px/1 "JetBrains Mono",monospace;letter-spacing:.06em;background:var(--d-s1,#F1F3F7);color:var(--d-ink2,#4A505C)}',
    '.gp-m{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:1px}',
    '.gp-g{background:#D4A017}.gp-s{background:#A9B0BB}.gp-b{background:#C27C43}',
    '.gp-mt tr.gp-sub td{padding:4px 8px 14px;text-align:left;background:var(--d-s1,#F7F8FA)}',
    '.gp-mlist{display:flex;flex-wrap:wrap;gap:6px}.gp-mlist button{all:unset;cursor:pointer;display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:var(--d-s0,#fff);border:1px solid var(--d-line,#E6E9EF);font-size:12.5px}',
    /* results */
    '.gp-sport{margin:22px 0 8px;display:flex;align-items:center;gap:8px;font:700 17px/1 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.01em}.gp-sport:first-child{margin-top:4px}',
    '.gp-sport i.gi{color:var(--c)}',
    '.gp-ev{all:unset;box-sizing:border-box;width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px;margin-top:6px;border-radius:14px;border:1px solid var(--d-line,#EEF0F4);cursor:pointer;transition:border-color .2s,background .2s}',
    '.gp-ev:hover{border-color:var(--d-ink3,#C3C8D2)}',
    '.gp-ev b{display:block;font-size:15px}.gp-ev span{display:block;margin-top:3px;font-size:12.5px;color:var(--d-ink2,#5B6270)}',
    '.gp-st{flex:none;padding:5px 10px;border-radius:999px;font:600 10.5px/1 "JetBrains Mono",monospace;letter-spacing:.08em;background:var(--d-s1,#F1F3F7);color:var(--d-ink2,#4A505C)}',
    '.gp-st[data-k=live]{background:#FDECEC;color:#C8343A}.gp-st[data-k=done]{background:#E7F7EE;color:#1C8A53}',
    'html[data-theme=dark] .gp-st[data-k=live]{background:rgba(229,72,77,.18);color:#FF8A8E}html[data-theme=dark] .gp-st[data-k=done]{background:rgba(31,164,99,.18);color:#5FD49A}',
    '.gp-back{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin-bottom:14px;font-size:13.5px;font-weight:600;color:var(--d-ink2,#4A505C)}.gp-back .gi{transform:rotate(180deg)}',
    '.gp-evh{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}.gp-evh h3{margin:6px 0 0;font:700 28px/1.05 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.03em}',
    '.gp-pod{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:end;margin-bottom:22px}',
    '.gp-pc{padding:14px;border-radius:16px;background:var(--d-s1,#F4F5F7);display:flex;flex-direction:column;gap:6px;min-width:0}',
    '.gp-pc[data-p="1"]{padding-top:26px;box-shadow:inset 0 3px 0 #D4A017}.gp-pc[data-p="2"]{box-shadow:inset 0 3px 0 #A9B0BB}.gp-pc[data-p="3"]{box-shadow:inset 0 3px 0 #C27C43}',
    '.gp-pc small{font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.12em;color:var(--d-ink3,#6B7180)}',
    '.gp-pc b{font:700 18px/1.15 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.01em;overflow-wrap:anywhere}',
    '.gp-pc span{font:500 13px/1 "JetBrains Mono",monospace;color:var(--d-ink2,#4A505C)}',
    '@media (max-width:560px){.gp-pod{grid-template-columns:1fr;align-items:stretch}.gp-pc[data-p="1"]{padding-top:14px}}',
    '.gp-h4{margin:22px 0 8px;font:500 10.5px/1 "JetBrains Mono",monospace;letter-spacing:.12em;color:var(--d-ink3,#6B7180)}',
    '.gp-rt{width:100%;border-collapse:collapse;font-size:14px}.gp-rt td{padding:10px 8px;border-bottom:1px solid var(--d-line,#F0F2F6);font-variant-numeric:tabular-nums}',
    '.gp-rt td:first-child{width:36px;font:600 13px/1 "JetBrains Mono",monospace;color:var(--d-ink3,#6B7180)}.gp-rt td:last-child{text-align:right;font-family:"JetBrains Mono",monospace;font-size:13px}',
    '.gp-tag{margin-left:8px;padding:2px 6px;border-radius:5px;font:600 9.5px/1 "JetBrains Mono",monospace;letter-spacing:.06em;background:#E8EEFF;color:#2F5BFF}',
    'html[data-theme=dark] .gp-tag{background:rgba(47,91,255,.2);color:#9FB3FF}',
    /* session rows (results rounds, My Games) */
    '.gp-ses{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 4px 12px 0;border-bottom:1px solid var(--d-line,#F0F2F6)}',
    '.gp-ses time{font:700 18px/1 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.01em}',
    '.gp-ses b{display:block;font-size:15px}.gp-ses>span>span:not(.gp-clash){display:block;margin-top:3px;font-size:12.5px;color:var(--d-ink2,#5B6270)}',
    '.gp-ses-act{display:flex;align-items:center;gap:2px}',
    '.gp-ib{all:unset;box-sizing:border-box;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;cursor:pointer;font-size:17px;color:var(--d-ink3,#6B7180)}.gp-ib:hover{background:var(--d-tint,#F1F3F7);color:var(--d-ink,#0B0D12)}',
    '.gp-ib[aria-pressed="true"]{color:#E7A10E}',
    '.gp-clash{display:inline-flex;align-items:center;gap:6px;margin-top:6px;padding:4px 9px;border-radius:999px;background:#FFF4DB;color:#8A5E00;font-size:12px;font-weight:600}',
    'html[data-theme=dark] .gp-clash{background:rgba(231,161,14,.16);color:#F3C15A}',
    '.gp-day{margin:20px 0 4px;display:flex;align-items:baseline;gap:10px}.gp-day:first-child{margin-top:0}.gp-day b{font:700 18px/1 "Bricolage Grotesque",system-ui,sans-serif}.gp-day span{font:500 10.5px/1 "JetBrains Mono",monospace;letter-spacing:.12em;color:var(--d-ink3,#6B7180)}',
    '.gp-btn{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 15px;border-radius:999px;font-size:13.5px;font-weight:600;border:1px solid var(--d-line,rgba(11,13,18,.14));transition:background .25s,color .25s}',
    '.gp-btn:hover{background:var(--d-inv,#0B0D12);color:var(--d-on-inv,#fff);border-color:transparent}',
    '.gp-btn--pri{background:#2F5BFF;border-color:#2F5BFF;color:#fff}.gp-btn--pri:hover{background:#1E44DA;color:#fff}',
    '.gp-row-acts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}',
    '.gp-blank{padding:48px 18px;text-align:center}.gp-blank .gi{font-size:34px;color:#E7A10E}.gp-blank b{display:block;margin:14px 0 6px;font:700 22px/1.1 "Bricolage Grotesque",system-ui,sans-serif}.gp-blank p{margin:0 auto 18px;max-width:360px;color:var(--d-ink2,#5B6270);font-size:14px;line-height:1.5}',
    /* bracket */
    '.gb-wrap{overflow-x:auto;margin:0 -24px;padding:0 24px 4px;scrollbar-width:thin}.gb{display:grid;grid-template-columns:repeat(3,minmax(200px,1fr));gap:22px;min-width:660px}',
    '.gb-col{display:flex;flex-direction:column;gap:8px;min-width:0}.gb-h{font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.12em;color:var(--d-ink3,#6B7180)}',
    '.gb-ms{flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:12px}',
    '.gb-m{position:relative;border:1px solid var(--d-line,#E3E6EB);border-radius:12px;overflow:hidden;background:var(--d-s0,#fff);transition:border-color .25s,box-shadow .25s}',
    '.gb-col:not(:last-child) .gb-m::after{content:"";position:absolute;right:-23px;top:50%;width:22px;height:1px;background:var(--d-line,#D9DDE4)}',
    '.gb-m[data-hl]{border-color:#2F5BFF;box-shadow:0 0 0 3px rgba(47,91,255,.16)}.gb-m[data-st=live]{border-color:#E5484D}',
    '.gb-live{position:absolute;right:8px;top:-1px;padding:3px 6px;border-radius:0 0 6px 6px;background:#E5484D;color:#fff;font:600 9px/1 "JetBrains Mono",monospace;letter-spacing:.1em;font-style:normal}',
    '.gb-t{all:unset;box-sizing:border-box;width:100%;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px 10px;cursor:pointer;font-size:13.5px;color:var(--d-ink2,#4A505C)}.gb-t+.gb-t{border-top:1px solid var(--d-line,#EEF0F4)}',
    '.gb-t[disabled]{cursor:default;color:var(--d-ink3,#9AA1AD)}.gb-t[data-win]{color:var(--d-ink,#0B0D12);font-weight:700}.gb-t[data-hl]{background:rgba(47,91,255,.1)}.gb-t:focus-visible{outline:2px solid #2F5BFF;outline-offset:-2px}',
    '.gb-n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gb-t b{font:600 13px/1 "JetBrains Mono",monospace}.gb-tip{margin:10px 0 0;font-size:12px;color:var(--d-ink3,#6B7180)}',
    '@media (max-width:760px){.gb-wrap{margin:0 -16px;padding:0 16px 4px}}',
    /* venue map */
    '.gm{position:relative;aspect-ratio:100/62;border-radius:18px;overflow:hidden;background:var(--d-s1,#EEF1F5);box-shadow:inset 0 0 0 1px var(--d-line,#E3E6EB)}',
    '.gm svg{position:absolute;inset:0;width:100%;height:100%}.gm-river{fill:none;stroke:#BFD3F5;stroke-width:7;stroke-linecap:round;opacity:.9}.gm-river2{fill:none;stroke:#D9E5FA;stroke-width:3;stroke-linecap:round}',
    'html[data-theme=dark] .gm-river{stroke:#1F3566}html[data-theme=dark] .gm-river2{stroke:#2A4582}',
    '.gm-l{stroke:var(--d-ink3,#A9B0BB);stroke-width:.35;stroke-dasharray:1.2 1.2;opacity:.55;vector-effect:non-scaling-stroke}.gm-l[data-on]{stroke:#2F5BFF;stroke-width:.6;opacity:1;stroke-dasharray:none}',
    '.gm-min{position:absolute;z-index:3;transform:translate(-50%,-50%);padding:5px 9px;border-radius:999px;background:#2F5BFF;color:#fff;font:600 11px/1 "JetBrains Mono",monospace;white-space:nowrap;pointer-events:none;box-shadow:0 2px 6px rgba(8,10,16,.2)}',
    '.gm-pin{all:unset;box-sizing:border-box;position:absolute;transform:translate(-18px,-18px);display:flex;align-items:center;gap:8px;cursor:pointer;max-width:46%}',
    '.gm-dot{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:17px;background:var(--d-s0,#fff);color:var(--d-ink,#0B0D12);box-shadow:0 2px 8px rgba(8,10,16,.18),0 0 0 1px var(--d-line,rgba(11,13,18,.08));transition:background .25s,color .25s,transform .35s var(--gms-ease,ease)}',
    '.gm-pin[data-side=l]{flex-direction:row-reverse;transform:translate(18px,-18px)}@media (max-width:560px){.gm-pin[data-side=l]{transform:translate(15px,-15px)}}',
    '.gm-pin[data-st=live] .gm-dot{box-shadow:0 0 0 3px rgba(229,72,77,.35),0 2px 8px rgba(8,10,16,.18)}.gm-pin[data-on] .gm-dot{background:#2F5BFF;color:#fff;transform:scale(1.12)}',
    '.gm-lab{display:flex;flex-direction:column;gap:2px;padding:6px 10px;border-radius:10px;background:var(--d-s0,rgba(255,255,255,.94));box-shadow:0 1px 3px rgba(8,10,16,.12);min-width:0}',
    '.gm-lab b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gm-lab span{font:500 10px/1.2 "JetBrains Mono",monospace;letter-spacing:.04em;color:var(--d-ink2,#5B6270);white-space:nowrap}',
    '.gm-pin[data-st=live] .gm-lab span{color:#D93D42}.gm-pin:focus-visible .gm-dot{outline:2px solid #2F5BFF;outline-offset:3px}',
    '@media (max-width:560px){.gm-pin .gm-lab{display:none}.gm-pin[data-on]{z-index:2}.gm{aspect-ratio:100/86}.gm-lab{padding:4px 7px}.gm-lab b{font-size:11px}.gm-lab span{font-size:9px}.gm-dot{width:30px;height:30px;font-size:15px}.gm-pin{transform:translate(-15px,-15px)}}',
    /* chapter rail */
    '.gp-rail{position:fixed;left:22px;top:50%;z-index:45;display:flex;flex-direction:column;gap:2px;padding:10px 8px;border-radius:18px;background:rgba(255,255,255,.88);box-shadow:0 1px 2px rgba(15,20,40,.08),0 0 0 1px rgba(11,13,18,.06);transform:translate(-14px,-50%);opacity:0;pointer-events:none;transition:opacity .35s,transform .45s var(--gms-ease,ease),background .3s}',
    '.gp-rail[data-on]{opacity:1;transform:translate(0,-50%);pointer-events:auto}',
    '.gp-rail[data-tone=dark]{background:rgba(16,19,26,.86);box-shadow:0 0 0 1px rgba(255,255,255,.08)}',
    '.gp-rail button{all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;height:24px;padding:0 6px;border-radius:8px;color:#5B6270}',
    '.gp-rail[data-tone=dark] button{color:#AEB5C1}',
    '.gp-rail .tk{position:relative;width:14px;height:2px;border-radius:2px;background:currentColor;opacity:.4;overflow:hidden;transition:width .4s var(--gms-ease,ease),opacity .3s}',
    '.gp-rail .tk b{position:absolute;inset:0;background:#2F5BFF;transform-origin:0 50%;transform:scaleX(0)}',
    '.gp-rail button[data-on] .tk{width:26px;opacity:1;background:rgba(47,91,255,.25)}',
    '.gp-rail em{font:600 12px/1 "Instrument Sans",system-ui,sans-serif;font-style:normal;white-space:nowrap;max-width:0;overflow:hidden;opacity:0;transition:max-width .4s var(--gms-ease,ease),opacity .25s}',
    '.gp-rail em i{font:500 10px/1 "JetBrains Mono",monospace;font-style:normal;margin-right:6px;color:#2F5BFF}',
    '.gp-rail:hover em,.gp-rail:focus-within em{max-width:120px;opacity:1}',
    '.gp-rail button[data-on]{color:#0B0D12}.gp-rail[data-tone=dark] button[data-on]{color:#fff}',
    '.gp-rail button:focus-visible{outline:2px solid #2F5BFF}',
    '@media (max-width:1379px){.gp-rail{display:none}}',
    /* install banner */
    '.gp-inst{position:fixed;left:12px;right:12px;bottom:104px;z-index:125;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border-radius:18px;background:var(--d-s0,#fff);color:var(--d-ink,#0B0D12);box-shadow:0 18px 50px rgba(8,10,16,.25),0 0 0 1px var(--d-line,rgba(11,13,18,.06));transform:translateY(20px);opacity:0;transition:transform .45s var(--gms-ease,ease),opacity .3s}',
    '.gp-inst[data-on]{transform:none;opacity:1}.gp-inst img{width:40px;height:40px;border-radius:11px}.gp-inst p{margin:0;flex:1;font-size:13px;line-height:1.35;color:var(--d-ink2,#4A505C)}.gp-inst p b{display:block;font-size:14.5px;color:var(--d-ink,#0B0D12)}',
    '@media (min-width:761px){.gp-inst{left:auto;right:24px;bottom:24px;width:380px}}',
    '@media (prefers-reduced-motion:reduce){.gp-sheet,.gp-pal,.gp-toast,.gp-rail,.gp-inst{transition:none}}'
  ].join('\n');
  var st = doc.createElement('style'); st.id = 'gp-css'; st.textContent = CSS; doc.head.appendChild(st);

  /* ------------------------------------------------------------------ toast */
  var toastEl = null, toastT = 0;
  function toast(msg, opt) {
    opt = opt || {};
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'gp-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); doc.body.appendChild(toastEl); }
    toastEl.innerHTML = (opt.icon ? ICON(opt.icon) : '') + '<span>' + esc(msg) + '</span>' + (opt.action ? '<button type="button">' + esc(opt.action) + '</button>' : '');
    if (opt.action) toastEl.querySelector('button').onclick = function () { opt.onAction(); hide(); };
    function hide() { toastEl.removeAttribute('data-on'); }
    requestAnimationFrame(function () { toastEl.setAttribute('data-on', ''); });
    clearTimeout(toastT); toastT = setTimeout(hide, opt.action ? 4200 : 2400);
  }

  /* ------------------------------------------------------------------ theme */
  var Theme = {
    get: function () { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; },
    set: function (t, save) { root.setAttribute('data-theme', t); if (save) { try { localStorage.setItem('gms-theme', t); } catch (e) {} } Theme.sync(); },
    toggle: function () { var t = Theme.get() === 'dark' ? 'light' : 'dark'; Theme.set(t, true); toast(t === 'dark' ? 'Dark mode on' : 'Light mode on', { icon: t === 'dark' ? 'dark_mode' : 'light_mode' }); },
    sync: function () {
      var d = Theme.get() === 'dark';
      $$('[data-plus=theme]').forEach(function (b) { var i = b.querySelector('.gi'); if (i) i.setAttribute('data-gi', d ? 'light_mode' : 'dark_mode'); if (b.classList.contains('nv-ic')) b.setAttribute('aria-label', d ? 'Switch to light mode' : 'Switch to dark mode'); });
      $$('[data-theme-label]').forEach(function (e) { e.textContent = d ? 'Light mode' : 'Dark mode'; });
    }
  };
  try {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var follow = function (e) { var saved = null; try { saved = localStorage.getItem('gms-theme'); } catch (x) {} if (saved !== 'light' && saved !== 'dark') Theme.set(e.matches ? 'dark' : 'light', false); };
    if (mq.addEventListener) mq.addEventListener('change', follow); else if (mq.addListener) mq.addListener(follow);
  } catch (e) {}

  /* ------------------------------------------------------------------ overlay plumbing */
  var scrim = null, stack = [];
  function scrimOn(on) {
    if (!scrim) { scrim = doc.createElement('div'); scrim.className = 'gp-scrim'; scrim.addEventListener('click', function () { closeTop(); }); doc.body.appendChild(scrim); }
    if (on) { scrim.style.display = 'block'; requestAnimationFrame(function () { scrim.setAttribute('data-on', ''); }); }
    else { scrim.removeAttribute('data-on'); setTimeout(function () { if (!stack.length) scrim.style.display = 'none'; }, 300); }
  }
  // page scroll stays where it is: while a panel is open, wheel and touch outside it are cancelled before the page's own
  // smooth-scroll handler sees them, and the panel scrolls natively (overscroll-behavior keeps it from chaining)
  var inLayer = function (t) { return !!(t && t.closest && t.closest('.gp-sheet,.gp-pal,.gp-inst,.gv-box')); };
  window.addEventListener('wheel', function (e) { if (!stack.length) return; e.stopPropagation(); if (!inLayer(e.target)) e.preventDefault(); }, { capture: true, passive: false });
  window.addEventListener('touchmove', function (e) { if (stack.length && !inLayer(e.target)) e.preventDefault(); }, { capture: true, passive: false });
  function lock(on) { root.classList.toggle('gp-lock', on); }
  function openLayer(layer) {
    stack.push(layer); scrimOn(true); lock(true);
    layer.prevFocus = doc.activeElement;
    layer.el.style.display = 'flex';
    requestAnimationFrame(function () { requestAnimationFrame(function () { layer.el.setAttribute('data-on', ''); if (layer.focus) layer.focus(); }); });
  }
  function closeLayer(layer) {
    var i = stack.indexOf(layer); if (i < 0) return; stack.splice(i, 1);
    layer.el.removeAttribute('data-on');
    setTimeout(function () { if (stack.indexOf(layer) < 0) layer.el.style.display = 'none'; }, REDUCED ? 0 : 480);
    if (!stack.length) { scrimOn(false); lock(false); }
    if (layer.onClose) layer.onClose();
    try { if (layer.prevFocus && layer.prevFocus.focus) layer.prevFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  function closeTop() { if (stack.length) closeLayer(stack[stack.length - 1]); }
  function trapTab(e, el) {
    if (e.key !== 'Tab') return;
    var f = $$('button,a[href],input,[tabindex]:not([tabindex="-1"])', el).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && doc.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  /* ------------------------------------------------------------------ data helpers */
  var gLabel = function (g) { return g === 'MIXED' ? 'Mixed' : g === 'MEN' ? 'Men' : 'Women'; };
  var evBy = function (code) { return D.ALL_EVENTS.find(function (e) { return e.code === code; }); };
  var dayLabel = function (d) { var x = D.DAYS[d]; return x[2] + ' ' + x[1]; };
  var mins = function (tm) { var p = tm.split(':'); return +p[0] * 60 + +p[1]; };
  var sessKey = function (d, tm, code) { return d + '-' + tm.replace(':', '') + '-' + code; };
  function sessFromKey(k) {
    var p = String(k).split('-'); if (p.length !== 3) return null; var d = +p[0];
    var day = D.SESSIONS[d]; if (!day) return null;
    var row = day.find(function (x) { return x[0].replace(':', '') === p[1] && x[1] === p[2]; }); if (!row) return null;
    var ev = evBy(row[1]); if (!ev) return null;
    return { key: sessKey(d, row[0], row[1]), day: d, tm: row[0], code: row[1], round: row[2], ev: ev, venue: D.VENUE_OF[ev.cat.name] };
  }
  var allSessions = function () { var out = []; D.SESSIONS.forEach(function (day, d) { day.forEach(function (r) { out.push(sessFromKey(sessKey(d, r[0], r[1]))); }); }); return out.filter(Boolean); };

  /* ------------------------------------------------------------------ results (sample until competition starts) */
  var NATIONS = { IND: 'India', USA: 'United States', BRA: 'Brazil', JPN: 'Japan', GER: 'Germany', ITA: 'Italy', ESP: 'Spain', AUS: 'Australia', GBR: 'Great Britain', CHN: 'China', KEN: 'Kenya', SRB: 'Serbia', TUR: 'Türkiye', FRA: 'France', CAN: 'Canada', NED: 'Netherlands', JAM: 'Jamaica', KOR: 'Korea' };
  var NCODES = Object.keys(NATIONS);
  function rng(seed) { var h = 2166136261; for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var fmtT = function (s) { if (s < 60) return s.toFixed(2); var m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(2); };
  var RACE = { ATH100M: 9.94, ATH100W: 10.91, ATH4X4: 190.6, SWM50M: 21.71, SWM50W: 24.12, SWMMED: 219.4 };
  var DECIDED_TEAM = { BKW: ['USA', 'AUS', 'ESP', '78–71', 'SRB'], VBM: ['ITA', 'BRA', 'JPN', '3–1 (25–21, 23–25, 25–19, 25–22)', 'TUR'], BK3: ['SRB', 'NED', 'CHN', '21–17', 'USA'] };
  var LIVE_FINAL = { FBM: { field: 'stadium', ev: "Men's Tournament" }, VBW: { field: 'arena', ev: "Women's Tournament" }, TNM: { field: 'court', ev: "Men's Singles" }, FB5: { field: 'stadium', ev: 'Five-a-side' }, TNX: { field: 'court', ev: 'Mixed Doubles' } };
  var BRONZE = { FBM: 'JPN', VBW: 'CHN', TNM: 'ESP', FB5: 'BRA', TNX: 'AUS' };
  function natOf(name, code) { return { code: code, name: NATIONS[code] || name }; }
  function lastRound(code) { var last = null; D.SESSIONS.forEach(function (day, d) { day.forEach(function (r) { if (r[1] === code) last = { day: d, tm: r[0], round: r[2] }; }); }); return last; }
  function results() {
    var live = A.live() || [];
    var out = {};
    D.ALL_EVENTS.forEach(function (ev) {
      var c = ev.code, r = rng(c), res = { ev: ev, code: c, status: 'next', podium: null, table: [], note: '' };
      var lr = lastRound(c);
      if (RACE[c]) {
        var ns = shuffle(NCODES, r).slice(0, 8), t = RACE[c], rows = ns.map(function (n, i) { t += (i === 0 ? 0 : RACE[c] > 60 ? 0.25 + r() * 1.1 : 0.01 + r() * 0.07); return { pos: i + 1, nat: natOf('', n), mark: fmtT(t), tag: i === 0 && r() > 0.5 ? 'GR' : (r() > 0.85 ? 'NR' : '') }; });
        res.status = 'done'; res.table = rows; res.podium = rows.slice(0, 3); res.kind = 'race';
      } else if (DECIDED_TEAM[c]) {
        var x = DECIDED_TEAM[c]; res.status = 'done'; res.kind = 'match';
        res.podium = [{ pos: 1, nat: natOf('', x[0]), mark: 'Gold' }, { pos: 2, nat: natOf('', x[1]), mark: 'Silver' }, { pos: 3, nat: natOf('', x[2]), mark: 'Bronze' }];
        res.table = [{ pos: 'F', nat: natOf('', x[0]), vs: natOf('', x[1]), mark: x[3] }, { pos: 'B', nat: natOf('', x[2]), vs: natOf('', x[4]), mark: 'Bronze match won' }];
      } else if (LIVE_FINAL[c]) {
        var L = LIVE_FINAL[c], m = live.find(function (v) { return v.field === L.field && v.ev === L.ev && /final/i.test(v.round) && !/bronze/i.test(v.round); });
        res.kind = 'match';
        if (m) {
          var A0 = natOf(m.A0, m.A1), B0 = natOf(m.B0, m.B1);
          if (/^[A-Z]\. |\//.test(m.A0)) { A0 = { code: m.A1, name: m.A0 }; B0 = { code: m.B1, name: m.B0 }; }
          res.match = { a: A0, b: B0, sa: m.sa, sb: m.sb, status: m.status };
          if (m.state === 'final') {
            var w = m.winA ? A0 : B0, l = m.winA ? B0 : A0;
            res.status = 'done'; res.podium = [{ pos: 1, nat: w, mark: 'Gold' }, { pos: 2, nat: l, mark: 'Silver' }, { pos: 3, nat: natOf('', BRONZE[c]), mark: 'Bronze' }];
            res.table = [{ pos: 'F', nat: A0, vs: B0, mark: m.sa + '–' + m.sb }];
          } else if (m.state === 'live') { res.status = 'live'; res.note = 'Final live now: ' + A0.name + ' ' + m.sa + '–' + m.sb + ' ' + B0.name + ' (' + m.status + ')'; }
          else res.note = 'Final ' + m.status.toLowerCase().replace('next ', 'at ') + ': ' + A0.name + ' v ' + B0.name;
        }
      }
      if (res.status === 'next' && !res.note && lr) res.note = lr.round + ' on ' + dayLabel(lr.day) + ' at ' + lr.tm;
      out[c] = res;
    });
    return out;
  }
  function medalTable(R, sport) {
    var t = {};
    Object.keys(R).forEach(function (c) {
      var x = R[c]; if (x.status !== 'done' || !x.podium) return; if (sport && x.ev.cat.name !== sport) return;
      x.podium.forEach(function (p, i) {
        var k = p.nat.code, row = t[k] || (t[k] = { code: k, name: NATIONS[k] || p.nat.name, g: 0, s: 0, b: 0, list: [] });
        row[['g', 's', 'b'][i]]++; row.list.push({ code: c, name: x.ev.name, m: i });
      });
    });
    return Object.keys(t).map(function (k) { var r = t[k]; r.t = r.g + r.s + r.b; return r; });
  }

  /* ------------------------------------------------------------------ My Games store */
  var My = {
    keys: function () { var k = LS.get('gms-mygames', []); return Array.isArray(k) ? k.filter(function (x) { return typeof x === 'string'; }) : []; },
    has: function (k) { return My.keys().indexOf(k) >= 0; },
    save: function (ks) { LS.set('gms-mygames', ks); My.sync(); },
    toggle: function (k, quiet) {
      var ks = My.keys(), i = ks.indexOf(k), on = i < 0;
      if (on) ks.push(k); else ks.splice(i, 1);
      My.save(ks);
      if (!quiet) {
        var s = sessFromKey(k);
        toast(on ? 'Added to My Games' : 'Removed from My Games', { icon: 'star_fill', action: on ? 'View' : 'Undo', onAction: function () { if (on) Plus.open('mygames'); else My.toggle(k, true); } });
        if (on && s) { var cl = clashes(My.keys().map(sessFromKey).filter(Boolean))[k]; if (cl) setTimeout(function () { toast(cl, { icon: 'star' }); }, 2600); }
      }
      return on;
    },
    sync: function () {
      var ks = My.keys(), n = ks.length;
      $$('[data-my-count]').forEach(function (b) { b.textContent = n ? String(n) : ''; if (n) b.setAttribute('data-n', ''); else b.removeAttribute('data-n'); });
      $$('[data-star]').forEach(function (b) { b.setAttribute('aria-pressed', ks.indexOf(b.getAttribute('data-star')) >= 0 ? 'true' : 'false'); });
    }
  };
  function clashes(list) {
    var out = {};
    for (var d = 0; d < D.SESSIONS.length; d++) {
      var day = list.filter(function (s) { return s.day === d; }).sort(function (a, b) { return mins(a.tm) - mins(b.tm); });
      for (var i = 1; i < day.length; i++) {
        var a = day[i - 1], b = day[i], gap = mins(b.tm) - mins(a.tm);
        if (a.venue !== b.venue && gap < 120) out[b.key] = (gap === 0 ? 'Same time as ' : gap + ' min after ') + a.ev.cat.name + ' at ' + a.venue;
        else if (a.venue === b.venue && gap === 0 && a.code !== b.code) { /* same venue, back to back: fine */ }
      }
    }
    return out;
  }
  function ics(list) {
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var utc = function (d, tm, add) { var p = tm.split(':'), t = A.tour.at(d, tm) + (add || 0) * 60000, x = new Date(t); return x.getUTCFullYear() + pad(x.getUTCMonth() + 1) + pad(x.getUTCDate()) + 'T' + pad(x.getUTCHours()) + pad(x.getUTCMinutes()) + '00Z'; };
    var e = function (s) { return String(s).replace(/[\\,;]/g, function (c) { return '\\' + c; }); };
    var now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GMS//My Games//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:My ' + e(D.TOURNAMENT.name), 'X-WR-TIMEZONE:' + D.TOURNAMENT.timezone.iana];
    list.forEach(function (s) { L.push('BEGIN:VEVENT', 'UID:' + s.key + '@gms-' + A.tour.year, 'DTSTAMP:' + now, 'DTSTART:' + utc(s.day, s.tm), 'DTEND:' + utc(s.day, s.tm, 120), 'SUMMARY:' + e(s.ev.name + ', ' + s.round), 'LOCATION:' + e(s.venue + ', ' + D.TOURNAMENT.city), 'DESCRIPTION:' + e(D.TOURNAMENT.name + '. ' + s.round + ' at ' + s.venue + '.'), 'END:VEVENT'); });
    L.push('END:VCALENDAR'); return L.join('\r\n');
  }
  function download(name, text, type) {
    var b = new Blob([text], { type: type }), u = URL.createObjectURL(b), a = doc.createElement('a');
    a.href = u; a.download = name; doc.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) { try { var t = doc.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; doc.body.appendChild(t); t.select(); doc.execCommand('copy'); t.remove(); ok(); } catch (e) { no(e); } });
  }

  /* ------------------------------------------------------------------ sheet (medals / My Games) */
  var sheet = null;
  function sheetLayer() {
    if (sheet) return sheet;
    var el = doc.createElement('section'); el.className = 'gp-sheet'; el.style.display = 'none';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'gp-sh-title');
    el.innerHTML = '<header class="gp-sh-hd"><div><small data-sh-kick></small><h2 id="gp-sh-title" data-sh-title></h2></div><span style="display:flex;gap:8px"><button type="button" class="gp-x" data-act="shareview" aria-label="Share this view" title="Share">' + ICON('link') + '</button><button type="button" class="gp-x gp-x--close" aria-label="Close">' + ICON('close') + '</button></span></header><nav class="gp-sh-tabs" data-sh-tabs></nav><div class="gp-sh-bd" data-sh-body></div>';
    doc.body.appendChild(el);
    sheet = { el: el, view: null, arg: null, timer: 0, sig: '' };
    el.querySelector('.gp-x--close').onclick = function () { closeLayer(sheet); };
    el.addEventListener('keydown', function (e) { trapTab(e, el); });
    sheet.focus = function () { el.querySelector('.gp-x--close').focus({ preventScroll: true }); };
    sheet.onClose = function () { clearInterval(sheet.timer); sheet.timer = 0; };
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      var act = t.getAttribute('data-act'), v = t.getAttribute('data-v');
      if (act === 'tab') renderSheet(v, null);
      else if (act === 'sport') { sheet.arg = Object.assign({}, sheet.arg, { sport: v || null }); renderSheet(sheet.view, sheet.arg); }
      else if (act === 'sort') { sheet.arg = Object.assign({}, sheet.arg, { sort: v }); renderSheet(sheet.view, sheet.arg); }
      else if (act === 'nation') { var sub = el.querySelector('tr.gp-sub[data-for="' + v + '"]'); if (sub) sub.hidden = !sub.hidden; t.setAttribute('aria-expanded', sub && !sub.hidden ? 'true' : 'false'); }
      else if (act === 'event') renderSheet('results', { event: v });
      else if (act === 'back') renderSheet('results', null);
      else if (act === 'star') { var on = My.toggle(v); t.setAttribute('aria-pressed', on ? 'true' : 'false'); if (sheet.view === 'mygames' && !on) renderSheet('mygames', sheet.arg); }
      else if (act === 'goto') { var s = sessFromKey(v); if (s) { closeLayer(sheet); A.showSession(s.day, s.code); } }
      else if (act === 'ec') { closeLayer(sheet); A.openEc(); }
      else if (act === 'ics') { var list = My.keys().map(sessFromKey).filter(Boolean); if (list.length) { download('my-games-' + A.tour.year + '.ics', ics(list), 'text/calendar'); toast('Calendar file downloaded', { icon: 'download' }); } }
      else if (act === 'share') { var u = location.href.split('#')[0] + '#my=' + My.keys().join(','); copy(u).then(function () { toast('Link to your plan copied', { icon: 'link' }); }, function () { toast('Could not copy the link'); }); }
      else if (act === 'import') { var ks = My.keys(); (sheet.arg && sheet.arg.shared || []).forEach(function (k) { if (ks.indexOf(k) < 0) ks.push(k); }); My.save(ks); toast('Added to My Games', { icon: 'star_fill' }); renderSheet('mygames', null); }
      else if (act === 'venue') renderSheet('venues', { venue: v });
      else if (act === 'hl') { var on = t.hasAttribute('data-hl'); $$('.gb-t', el).forEach(function (b) { b.removeAttribute('data-hl'); b.closest('.gb-m').removeAttribute('data-hl'); }); if (!on) $$('.gb-t', el).forEach(function (b) { if (b.getAttribute('data-v') === v) { b.setAttribute('data-hl', ''); b.closest('.gb-m').setAttribute('data-hl', ''); } }); }
      else if (act === 'shareview') shareSpec(sheet.view === 'results' && sheet.arg.event ? 'event:' + sheet.arg.event : sheet.view === 'venues' && sheet.arg.venue ? 'venue:' + sheet.arg.venue : sheet.view);
      else if (act === 'schedule') { closeLayer(sheet); A.home(function () { A.scrollTo('schedule'); }); }
    });
    return sheet;
  }
  var TABS = [['medals', 'Medal table'], ['results', 'Results'], ['venues', 'Venues'], ['mygames', 'My Games']];
  function renderSheet(view, arg) {
    var S = sheetLayer(); S.view = view; S.arg = arg || {};
    var tn = D.TOURNAMENT.name.toUpperCase(), kick = { medals: tn, results: tn, venues: tn, mygames: 'YOUR PLAN' }[view], title = { medals: 'Medal table', results: 'Results', venues: 'Venue map', mygames: 'My Games' }[view];
    S.el.querySelector('[data-sh-kick]').textContent = kick; S.el.querySelector('[data-sh-title]').textContent = title;
    S.el.querySelector('[data-sh-tabs]').innerHTML = TABS.map(function (t) { return '<button type="button" class="gp-tab" data-act="tab" data-v="' + t[0] + '"' + (t[0] === view ? ' data-on aria-current="page"' : '') + '>' + t[1] + (t[0] === 'mygames' && My.keys().length ? ' · ' + My.keys().length : '') + '</button>'; }).join('');
    var body = S.el.querySelector('[data-sh-body]');
    body.innerHTML = view === 'medals' ? medalsHTML(S.arg) : view === 'results' ? (S.arg.event ? eventHTML(S.arg.event) : resultsHTML()) : view === 'venues' ? venuesHTML(S.arg) : myHTML(S.arg);
    body.scrollTop = 0;
    clearInterval(S.timer); S.timer = 0;
    if (view === 'medals' || view === 'results') {
      S.sig = liveSig();
      S.timer = setInterval(function () { var g = liveSig(); if (g !== S.sig) { S.sig = g; var y = body.scrollTop; body.innerHTML = S.view === 'medals' ? medalsHTML(S.arg) : S.arg.event ? eventHTML(S.arg.event) : resultsHTML(); body.scrollTop = y; } }, 3000);
    }
  }
  function liveSig() { return (A.live() || []).filter(function (m) { return /final/i.test(m.round); }).map(function (m) { return m.id + m.state + m.sa + m.sb; }).join('|'); }
  function previewNote() {
    var before = A.tour.phase() === 'before';
    return '<div class="gp-note">' + ICON('verified') + '<span>' + (before ? 'Competition starts on ' + esc(A.tour.dayLong(0)) + '. Until then these are sample results so you can see how the table works; finals still in progress update live from the Event centre.' : 'These are demo results: this preview is not connected to a results feed yet. Finals in progress update live from the Event centre.') + '</span></div>';
  }
  function medalsHTML(arg) {
    var R = results(), sport = arg.sport || null, sort = arg.sort || 'gold';
    var rows = medalTable(R, sport).sort(function (a, b) { return sort === 'total' ? (b.t - a.t || b.g - a.g || b.s - a.s || a.name.localeCompare(b.name)) : (b.g - a.g || b.s - a.s || b.b - a.b || a.name.localeCompare(b.name)); });
    var done = Object.keys(R).filter(function (k) { return R[k].status === 'done'; }).length, live = Object.keys(R).filter(function (k) { return R[k].status === 'live'; }).length;
    var lead = rows[0];
    var h = previewNote() + '<div class="gp-stats"><div class="gp-stat"><b>' + done + ' / ' + D.ALL_EVENTS.length + '</b><span>Medal events decided</span></div><div class="gp-stat"><b>' + live + '</b><span>Finals live now</span></div><div class="gp-stat"><b>' + (lead ? esc(lead.name) : '–') + '</b><span>Leading the table</span></div></div>';
    h += '<div class="gp-chips" role="group" aria-label="Sport"><button type="button" class="gp-chip" data-act="sport" data-v=""' + (!sport ? ' data-on' : '') + '>All sports</button>' + D.CATS.map(function (c) { return '<button type="button" class="gp-chip" data-act="sport" data-v="' + esc(c.name) + '"' + (sport === c.name ? ' data-on' : '') + '>' + ICON(c.icon) + esc(c.name) + '</button>'; }).join('') + '</div>';
    h += '<div class="gp-chips" role="group" aria-label="Order"><button type="button" class="gp-chip" data-act="sort" data-v="gold"' + (sort === 'gold' ? ' data-on' : '') + '>By gold</button><button type="button" class="gp-chip" data-act="sort" data-v="total"' + (sort === 'total' ? ' data-on' : '') + '>By total</button></div>';
    if (!rows.length) return h + '<div class="gp-empty">No medals decided in this sport yet.</div>';
    h += '<table class="gp-mt"><thead><tr><th scope="col">#</th><th scope="col">' + esc(D.TOURNAMENT.teamLabel || 'Team') + '</th><th scope="col"><span class="gp-m gp-g"></span>G</th><th scope="col"><span class="gp-m gp-s"></span>S</th><th scope="col"><span class="gp-m gp-b"></span>B</th><th scope="col">Total</th></tr></thead><tbody>';
    var rank = 0, prev = null;
    rows.forEach(function (r, i) {
      var key = sort === 'total' ? r.t + '/' + r.g + '/' + r.s : r.g + '/' + r.s + '/' + r.b; if (key !== prev) rank = i + 1; prev = key;
      h += '<tr class="gp-row" data-act="nation" data-v="' + r.code + '" tabindex="0" aria-expanded="false"><td class="gp-rk">' + rank + '</td><td><span class="gp-nat"><span class="gp-code">' + r.code + '</span>' + esc(r.name) + '</span></td><td>' + r.g + '</td><td>' + r.s + '</td><td>' + r.b + '</td><td>' + r.t + '</td></tr>';
      h += '<tr class="gp-sub" data-for="' + r.code + '" hidden><td></td><td colspan="5"><div class="gp-mlist">' + r.list.map(function (x) { return '<button type="button" data-act="event" data-v="' + x.code + '"><span class="gp-m ' + ['gp-g', 'gp-s', 'gp-b'][x.m] + '"></span>' + esc(x.name) + '</button>'; }).join('') + '</div></td></tr>';
    });
    return h + '</tbody></table>';
  }
  var stLabel = function (x) { return x.status === 'done' ? 'FINAL' : x.status === 'live' ? 'LIVE' : 'UPCOMING'; };
  function resultsHTML() {
    var R = results(), h = previewNote();
    D.CATS.forEach(function (c) {
      h += '<div class="gp-sport" style="--c:' + c.color + '">' + ICON(c.icon) + esc(c.name) + '</div>';
      c.events.forEach(function (e) {
        var x = R[e[2]], sub = x.status === 'done' && x.podium ? 'Gold ' + x.podium[0].nat.name + ' · Silver ' + x.podium[1].nat.name + ' · Bronze ' + x.podium[2].nat.name : x.note || gLabel(e[1]);
        h += '<button type="button" class="gp-ev" data-act="event" data-v="' + e[2] + '"><span><b>' + esc(e[0]) + '</b><span>' + esc(sub) + '</span></span><span class="gp-st" data-k="' + x.status + '">' + stLabel(x) + '</span></button>';
      });
    });
    return h;
  }
  function sesRow(s, opts) {
    opts = opts || {};
    var on = My.has(s.key);
    return '<div class="gp-ses"><time>' + s.tm + '</time><span><b>' + esc(opts.title || (s.ev.name + ' · ' + s.round)) + '</b><span>' + esc((opts.showDay ? dayLabel(s.day) + ' · ' : '') + s.venue) + '</span>' + (opts.clash ? '<span class="gp-clash">' + esc(opts.clash) + '</span>' : '') + '</span><span class="gp-ses-act">' +
      (opts.cal ? '<a class="gp-ib" href="' + esc(A.calLinks(s.ev.name + ', ' + s.round + ' (' + D.TOURNAMENT.name + ')', s.tm, s.round + ', ' + s.venue, s.day, s.venue).gcal) + '" target="_blank" rel="noopener" aria-label="Add ' + esc(s.ev.name) + ' to Google Calendar" title="Google Calendar">' + ICON('event_available') + '</a>' : '') +
      '<button type="button" class="gp-ib" data-act="goto" data-v="' + s.key + '" aria-label="Show in the schedule" title="Show in the schedule">' + ICON('arrow_outward') + '</button>' +
      '<button type="button" class="gp-ib" data-act="star" data-v="' + s.key + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove from' : 'Add to') + ' My Games" title="My Games">' + ICON('star') + '</button></span></div>';
  }
  function eventHTML(code) {
    var R = results(), x = R[code]; if (!x) return resultsHTML();
    var c = x.ev.cat, h = '<button type="button" class="gp-back" data-act="back">' + ICON('arrow_forward') + 'All results</button>';
    h += '<div class="gp-evh"><div><span class="gp-code" style="background:' + c.tint + ';color:' + c.color + '">' + esc(c.name.toUpperCase()) + '</span><h3>' + esc(x.ev.name) + '</h3></div><span class="gp-st" data-k="' + x.status + '">' + stLabel(x) + '</span></div>';
    if (x.status !== 'done') h += '<div class="gp-note">' + ICON('verified') + '<span>' + esc(x.note || 'Medals are decided in the final.') + '</span></div>';
    if (x.status === 'live') h += '<div class="gp-row-acts"><button type="button" class="gp-btn gp-btn--pri" data-act="ec">Follow it in the Event centre' + ICON('arrow_forward') + '</button></div>';
    if (x.podium) {
      var ord = [x.podium[1], x.podium[0], x.podium[2]];
      h += '<div class="gp-pod">' + ord.map(function (p) { return '<div class="gp-pc" data-p="' + p.pos + '"><small>' + ['GOLD', 'SILVER', 'BRONZE'][p.pos - 1] + '</small><b>' + esc(p.nat.name) + '</b><span>' + esc(x.kind === 'race' ? p.mark : p.nat.code) + '</span></div>'; }).join('') + '</div>';
      h += '<div class="gp-h4">' + (x.kind === 'race' ? 'FINAL' : 'MEDAL MATCHES') + '</div><table class="gp-rt"><tbody>';
      h += x.table.map(function (r) { return '<tr><td>' + r.pos + '</td><td><span class="gp-nat"><span class="gp-code">' + r.nat.code + '</span>' + esc(r.nat.name) + (r.vs ? ' <span style="color:var(--d-ink3,#6B7180);font-weight:500">v ' + esc(r.vs.name) + '</span>' : '') + (r.tag ? '<span class="gp-tag" title="' + (r.tag === 'GR' ? 'Games record' : 'National record') + '">' + r.tag + '</span>' : '') + '</span></td><td>' + esc(r.mark) + '</td></tr>'; }).join('');
      h += '</tbody></table>';
    }
    h += bracketHTML(x);
    var rounds = allSessions().filter(function (s) { return s.code === code; });
    if (rounds.length) h += '<div class="gp-h4">ROUNDS AT THE GAMES</div>' + rounds.map(function (s) { return sesRow(s, { title: s.round, showDay: true }); }).join('');
    return h;
  }
  function myHTML(arg) {
    var shared = arg && arg.shared ? arg.shared.map(sessFromKey).filter(Boolean) : null;
    if (shared && shared.length) {
      var add = shared.filter(function (s) { return !My.has(s.key); }).length;
      return '<div class="gp-note">' + ICON('link') + '<span>Someone shared their plan with you: ' + shared.length + ' session' + (shared.length > 1 ? 's' : '') + '.</span></div><div class="gp-row-acts">' + (add ? '<button type="button" class="gp-btn gp-btn--pri" data-act="import">Add ' + add + ' to my plan' + ICON('star') + '</button>' : '') + '<button type="button" class="gp-btn" data-act="tab" data-v="mygames">See my own plan</button></div>' + dayList(shared, false);
    }
    var list = My.keys().map(sessFromKey).filter(Boolean);
    if (!list.length) return '<div class="gp-blank">' + ICON('star') + '<b>Plan your Games</b><p>Tap the star on any session in the schedule. Your sessions collect here with clash warnings, and go to your calendar in one file.</p><button type="button" class="gp-btn gp-btn--pri" data-act="schedule">Open the schedule' + ICON('arrow_forward') + '</button></div>';
    var cl = clashes(list), n = Object.keys(cl).length;
    var h = '<div class="gp-stats"><div class="gp-stat"><b>' + list.length + '</b><span>Sessions in your plan</span></div><div class="gp-stat"><b>' + new Set(list.map(function (s) { return s.day; })).size + '</b><span>Days at the Games</span></div><div class="gp-stat"><b>' + n + '</b><span>' + (n === 1 ? 'Tight change' : 'Tight changes') + ' between venues</span></div></div>';
    h += '<div class="gp-row-acts"><button type="button" class="gp-btn gp-btn--pri" data-act="ics">' + ICON('download') + 'Add all to my calendar (.ics)</button><button type="button" class="gp-btn" data-act="share">' + ICON('link') + 'Copy a link to this plan</button></div>';
    return h + dayList(list, true, cl);
  }
  function dayList(list, cal, cl) {
    cl = cl || {}; var h = '';
    for (var d = 0; d < D.SESSIONS.length; d++) {
      var day = list.filter(function (s) { return s.day === d; }).sort(function (a, b) { return mins(a.tm) - mins(b.tm); });
      if (!day.length) continue;
      h += '<div class="gp-day"><b>' + esc(D.DAYS[d][2] + ' ' + D.DAYS[d][1]) + '</b><span>DAY ' + D.DAYS[d][0] + '</span></div>' + day.map(function (s) { return sesRow(s, { cal: cal, clash: cl[s.key] }); }).join('');
    }
    return h;
  }

  /* ------------------------------------------------------------------ knockout bracket (team and racket sports) */
  function bracketOf(x) {
    if (x.kind === 'race' || RACE[x.code]) return null;
    var r = rng(x.code + ':bracket'), sport = x.ev.cat.name, nat = function (c) { return natOf('', c); };
    var used = {}, take = function (n) { if (n) used[n.code] = 1; };
    // racket events are played by people, not teams: opponents get a sample player name for their country
    var solo = sport === 'Tennis', dbl = /Doubles/i.test(x.ev.name), SUR = ['Novak', 'Silva', 'Chen', 'Kaur', 'Hughes', 'Meyer', 'Tanaka', 'Okoro', 'Dubois', 'Costa', 'Larsen', 'Reyes', 'Ivanov', 'Park', 'Moreau', 'Singh'], INI = 'ABCDEJKLMNPRST';
    var person = function (n) { if (!solo || !n || !n.code || n.name !== (NATIONS[n.code] || '')) return n; var a = SUR[Math.floor(r() * SUR.length)], b = SUR[Math.floor(r() * SUR.length)]; return { code: n.code, name: dbl ? a + ' / ' + b : INI[Math.floor(r() * INI.length)] + '. ' + a }; };
    var gold = null, silver = null, bronze = null, finalScore = null, finalState = 'next';
    if (x.status === 'done' && x.podium) { gold = x.podium[0].nat; silver = x.podium[1].nat; bronze = x.podium[2].nat; finalState = 'done'; finalScore = x.table[0] && x.table[0].mark; }
    else if (x.match) { gold = x.match.a; silver = x.match.b; finalState = x.status === 'live' ? 'live' : 'next'; if (x.status === 'live') finalScore = x.match.sa + '–' + x.match.sb; bronze = BRONZE[x.code] ? nat(BRONZE[x.code]) : null; }
    [gold, silver, bronze].forEach(take);
    gold = person(gold); silver = person(silver); bronze = person(bronze);
    var pool = shuffle(NCODES, r).map(nat).filter(function (n) { return !used[n.code]; }).map(person);
    var fourth = pool.shift(), rest = pool.slice(0, 4);
    var score = function (decided) {
      if (!decided) return ['', ''];
      if (sport === 'Football') { var a = 1 + Math.floor(r() * 3); return [String(a), String(Math.floor(r() * a))]; }
      if (sport === 'Basketball') { var b = 68 + Math.floor(r() * 24); return [String(b), String(b - 2 - Math.floor(r() * 14))]; }
      if (sport === 'Volleyball') return ['3', String(Math.floor(r() * 3))];
      return ['2', String(Math.floor(r() * 2))];
    };
    var known = !!gold, m = function (a, b, decided, st) { var s = score(decided); return { a: a, b: b, sa: s[0], sb: s[1], win: decided ? 'a' : '', st: st || (decided ? 'done' : 'next') }; };
    var tbd = { code: '', name: 'To be decided' };
    var qf, sf, fin;
    if (known) {
      if (!bronze) bronze = pool[4] || tbd;
      qf = [m(gold, rest[0], 1), m(bronze, rest[1], 1), m(silver, rest[2], 1), m(fourth, rest[3], 1)];
      sf = [m(gold, bronze, 1), m(silver, fourth, 1)];
      fin = m(gold, silver, finalState === 'done', finalState);
      if (finalState === 'done' && finalScore) { var p = String(finalScore).split(' ')[0].split('–'); if (p.length === 2) { var hi = +p[0] >= +p[1] ? p[0] : p[1], lo = hi === p[0] ? p[1] : p[0]; fin.sa = hi; fin.sb = lo; } }
      if (finalState === 'live' && finalScore) { var q = finalScore.split('–'); fin.sa = q[0]; fin.sb = q[1]; }
    } else {
      var eight = shuffle(NCODES, rng(x.code + ':draw')).slice(0, 8).map(nat).map(person);
      qf = [m(eight[0], eight[1], 0), m(eight[2], eight[3], 0), m(eight[4], eight[5], 0), m(eight[6], eight[7], 0)];
      sf = [m(tbd, tbd, 0), m(tbd, tbd, 0)]; fin = m(tbd, tbd, 0);
    }
    return { qf: qf, sf: sf, fin: fin };
  }
  function bracketHTML(x) {
    var B = bracketOf(x); if (!B) return '';
    var side = function (t, sc, win, other) { var k = t.code + '|' + t.name; return '<button type="button" class="gb-t"' + (t.code || t.name !== 'To be decided' ? ' data-act="hl" data-v="' + esc(k) + '"' : ' disabled') + (win ? ' data-win' : '') + '><span class="gp-code">' + esc(t.code || '—') + '</span><span class="gb-n">' + esc(t.name) + '</span><b>' + esc(sc) + '</b></button>'; };
    var match = function (mm) { return '<div class="gb-m" data-st="' + mm.st + '">' + (mm.st === 'live' ? '<i class="gb-live">LIVE</i>' : '') + side(mm.a, mm.sa, mm.win === 'a') + side(mm.b, mm.sb, mm.win === 'b') + '</div>'; };
    var col = function (title, list) { return '<div class="gb-col"><span class="gb-h">' + title + '</span><div class="gb-ms">' + list.map(match).join('') + '</div></div>'; };
    return '<div class="gp-h4">KNOCKOUT BRACKET</div><div class="gb-wrap"><div class="gb" role="group" aria-label="Knockout bracket">' + col('QUARTER-FINALS', B.qf) + col('SEMI-FINALS', B.sf) + col('FINAL', [B.fin]) + '</div></div><p class="gb-tip">Tap a team to trace its path.</p>';
  }
  /* ------------------------------------------------------------------ venue map */
  function venueNow(name) {
    var ph = A.tour.phase(), all = allSessions().filter(function (s) { return s.venue === name; });
    if (ph === 'after') return { k: 'done', label: 'Finished', s: null };
    if (ph === 'before') return { k: 'next', label: 'First: ' + dayLabel(all[0] ? all[0].day : 0) + (all[0] ? ' ' + all[0].tm : ''), s: all[0] || null };
    var d = A.tour.dayNow(), now = A.tour.nowMin(), today = all.filter(function (s) { return s.day === d; }).sort(function (a, b) { return mins(a.tm) - mins(b.tm); });
    var on = today.filter(function (s) { return mins(s.tm) <= now && now < mins(s.tm) + 120; }).pop();
    if (on) return { k: 'live', label: 'On now', s: on };
    var nx = today.find(function (s) { return mins(s.tm) > now; }) || all.find(function (s) { return s.day > d; });
    return nx ? { k: 'next', label: 'Next ' + (nx.day === d ? nx.tm : dayLabel(nx.day) + ' ' + nx.tm), s: nx } : { k: 'done', label: 'Finished', s: null };
  }
  function venuesHTML(arg) {
    var vs = D.TOURNAMENT.venues, sel = (arg && arg.venue && vs.find(function (v) { return v.name === arg.venue; })) || vs[0], tr = D.TOURNAMENT.travel || [];
    var P = function (v, i) { return v.pos || [20 + (i % 3) * 30, 25 + Math.floor(i / 3) * 40]; }, pos = {}; vs.forEach(function (v, i) { pos[v.name] = P(v, i); });
    var lines = tr.map(function (t) {
      var a = pos[t[0]], b = pos[t[1]]; if (!a || !b) return ''; var on = t[0] === sel.name || t[1] === sel.name, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      return '<line x1="' + a[0] + '" y1="' + a[1] * 0.62 + '" x2="' + b[0] + '" y2="' + b[1] * 0.62 + '" class="gm-l"' + (on ? ' data-on' : '') + '/>';
    }).join('');
    var badges = tr.map(function (t) { var a = pos[t[0]], b = pos[t[1]]; if (!a || !b || !(t[0] === sel.name || t[1] === sel.name)) return ''; return '<span class="gm-min" style="left:' + (a[0] + b[0]) / 2 + '%;top:' + (a[1] + b[1]) / 2 + '%">' + t[2] + ' min</span>'; }).join('');
    var h = '<div class="gm" role="group" aria-label="Venue map"><svg viewBox="0 0 100 62" preserveAspectRatio="none" aria-hidden="true"><path d="M-2 50 C 18 40, 30 58, 52 46 S 86 30, 102 40" class="gm-river"/><path d="M-2 50 C 18 40, 30 58, 52 46 S 86 30, 102 40" class="gm-river2"/>' + lines + '</svg>';
    vs.forEach(function (v, i) {
      var p = pos[v.name], st = venueNow(v.name);
      h += '<button type="button" class="gm-pin" data-act="venue" data-v="' + esc(v.name) + '" data-st="' + st.k + '"' + (v.name === sel.name ? ' data-on aria-pressed="true"' : ' aria-pressed="false"') + (p[0] > 55 ? ' data-side="l"' : '') + ' style="' + (p[0] > 55 ? 'right:' + (100 - p[0]) + '%' : 'left:' + p[0] + '%') + ';top:' + p[1] + '%"><span class="gm-dot">' + ICON(v.icon || 'corporate_fare') + '</span><span class="gm-lab"><b>' + esc(v.name) + '</b><span>' + esc(st.label) + '</span></span></button>';
    });
    h += badges + '</div>';
    var st = venueNow(sel.name), sports = D.CATS.filter(function (c) { return c.venue === sel.name; }).map(function (c) { return c.name; });
    h += '<div class="gp-evh" style="margin-top:20px"><div><span class="gp-code">' + esc(sports.join(' · ').toUpperCase() || 'VENUE') + '</span><h3>' + esc(sel.name) + '</h3></div><span class="gp-st" data-k="' + (st.k === 'live' ? 'live' : st.k === 'done' ? 'done' : '') + '">' + esc(st.label.toUpperCase()) + '</span></div>';
    if (st.s) h += '<div class="gp-note">' + ICON('event_available') + '<span>' + (st.k === 'live' ? 'On now: ' : 'Next up: ') + esc(st.s.ev.name + ', ' + st.s.round) + ' (' + esc(dayLabel(st.s.day) + ' ' + st.s.tm) + ').</span></div>';
    var hops = tr.filter(function (t) { return t[0] === sel.name || t[1] === sel.name; }).map(function (t) { return { to: t[0] === sel.name ? t[1] : t[0], m: t[2] }; }).sort(function (a, b) { return a.m - b.m; });
    if (hops.length) h += '<div class="gp-chips">' + hops.map(function (x) { return '<button type="button" class="gp-chip" data-act="venue" data-v="' + esc(x.to) + '">' + x.m + ' min to ' + esc(x.to) + '</button>'; }).join('') + '</div><p class="gb-tip" style="margin-top:-8px">Shuttle times are sample figures.</p>';
    var list = allSessions().filter(function (s) { return s.venue === sel.name; });
    return h + '<div class="gp-h4">SESSIONS AT THIS VENUE</div>' + (list.length ? dayList(list, false) : '<div class="gp-empty">No sessions at this venue.</div>');
  }
  /* ------------------------------------------------------------------ sharing: links that open the exact view */
  function shareLink(hash) { return location.href.split('#')[0] + '#' + hash; }
  function share(title, hash) {
    var url = shareLink(hash), done = function () { toast('Link copied', { icon: 'link' }); };
    if (navigator.share && window.matchMedia && matchMedia('(pointer:coarse)').matches) { navigator.share({ title: title, text: title, url: url }).catch(function (e) { if (!e || e.name !== 'AbortError') copy(url).then(done, function () {}); }); return; }
    copy(url).then(done, function () { toast('Could not copy the link'); });
  }
  function shareSpec(spec) {
    var i = String(spec).indexOf(':'), k = i < 0 ? spec : spec.slice(0, i), v = i < 0 ? '' : spec.slice(i + 1), tn = D.TOURNAMENT.name;
    if (k === 'session') { var s = sessFromKey(v); if (s) share(s.ev.name + ', ' + s.round + ' · ' + dayLabel(s.day) + ' ' + s.tm + ' · ' + s.venue + ' (' + tn + ')', 'session=' + s.key); }
    else if (k === 'event') { var e = evBy(v); if (e) share(e.name + ' results (' + tn + ')', 'results=' + e.code); }
    else if (k === 'venue') share(v + ' (' + tn + ')', 'venues=' + encodeURIComponent(v));
    else if (k === 'medals') share('Medal table (' + tn + ')', 'medals');
    else if (k === 'results') share('Results (' + tn + ')', 'results');
    else if (k === 'venues') share('Venue map (' + tn + ')', 'venues');
    else if (k === 'mygames') { if (My.keys().length) share('My plan for the ' + tn, 'my=' + My.keys().join(',')); else toast('Star a session first'); }
  }
  /* ------------------------------------------------------------------ search palette */
  var pal = null;
  function buildIndex() {
    var I = [], P = function (t, s, ic, act, kw) { I.push({ g: 'Go to', t: t, s: s, ic: ic, c: '#2F5BFF', act: act, kw: kw || '' }); };
    P('Live TV', 'Three channels, one per venue, with the score beside the picture', 'live_tv', function () { A.openTv(); }, 'watch stream broadcast video channel');
    P('Event centre', 'Live scores from every venue', 'sports_score', function () { A.openEc(); }, 'scores live match');
    P('Medal table', 'Gold, silver and bronze by team', 'medal', function () { Plus.open('medals'); }, 'medals standings tally ranking');
    P('Results', 'Finals and medal matches for every event', 'sports', function () { Plus.open('results'); }, 'winners podium');
    P('My Games', 'Your starred sessions, clashes and calendar file', 'star', function () { Plus.open('mygames'); }, 'plan planner itinerary favourites saved');
    P('Venue map', 'Where each venue is, what is on now and how long between them', 'corporate_fare', function () { Plus.open('venues'); }, 'venues map location travel shuttle directions where');
    P('Schedule', 'Every session, day by day', 'event_available', function () { A.home(function () { A.scrollTo('schedule'); }); }, 'timetable programme agenda');
    P('Registration', 'Twelve ways to take part', 'badge', function () { A.home(function () { A.scrollTo('reg'); }); }, 'register sign up accreditation apply');
    P('Help desk', 'Ask Vision or reach the right desk', 'connect_without_contact', function () { A.contact(); }, 'help support contact faq question');
    P(Theme.get() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', 'Theme', Theme.get() === 'dark' ? 'light_mode' : 'dark_mode', function () { Theme.toggle(); }, 'theme dark light night');
    D.ALL_EVENTS.forEach(function (e) { I.push({ g: 'Events', t: e.name, s: e.cat.name + ' · ' + gLabel(e.gender) + ' · ' + e.code + ' · results and rounds', ic: e.cat.icon, c: e.cat.color, act: function () { Plus.open('results', { event: e.code }); }, kw: e.cat.name + ' ' + e.code + ' final medals winner podium' }); });
    allSessions().forEach(function (s) { I.push({ g: 'Sessions', t: s.ev.name + ' · ' + s.round, s: dayLabel(s.day) + ' · ' + s.tm + ' · ' + s.venue, ic: s.ev.cat.icon, c: s.ev.cat.color, act: function () { A.showSession(s.day, s.code); }, kw: s.venue + ' day ' + (s.day + 1), key: s.key }); });
    NCODES.forEach(function (k) { I.push({ g: 'Teams', t: NATIONS[k], s: k + ' · medals and results', ic: 'groups', c: '#1C8A53', act: function () { Plus.open('medals', { nation: k }); }, kw: k }); });
    D.REG_ORDER.forEach(function (ri) { var r = D.REG[ri]; I.push({ g: 'Registration', t: 'Register as ' + r.name, s: r.desc, ic: r.icon || 'badge', c: '#B07A12', act: function () { A.startReg(r.id); }, kw: 'register ' + r.id }); });
    var V = {}; Object.keys(D.VENUE_OF).forEach(function (sp) { var v = D.VENUE_OF[sp]; (V[v] = V[v] || []).push(sp); });
    Object.keys(V).forEach(function (v) { I.push({ g: 'Venues', t: v, s: V[v].join(', ') + ' · on the venue map', ic: 'corporate_fare', c: '#7A4FD6', act: function () { Plus.open('venues', { venue: v }); }, kw: 'venue stadium arena map' }); });
    return I;
  }
  var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[×]/g, 'x'); };
  function search(q, I) {
    var n = norm(q).trim(); if (!n) return null;
    var toks = n.split(/\s+/), out = [];
    I.forEach(function (it) {
      var t = norm(it.t), hay = t + ' ' + norm(it.s) + ' ' + norm(it.kw);
      for (var i = 0; i < toks.length; i++) if (hay.indexOf(toks[i]) < 0) return;
      var sc = t.indexOf(n) === 0 ? 100 : t.indexOf(n) >= 0 ? 60 : 0;
      toks.forEach(function (k) { if ((' ' + t).indexOf(' ' + k) >= 0) sc += 20; else if (t.indexOf(k) >= 0) sc += 8; });
      out.push({ it: it, sc: sc });
    });
    return out.sort(function (a, b) { return b.sc - a.sc; }).map(function (x) { return x.it; });
  }
  function hl(text, q) {
    var t = esc(text); if (!q) return t; var n = norm(q).trim(); if (!n) return t;
    var toks = n.split(/\s+/).filter(function (k) { return k.length > 1; }).sort(function (a, b) { return b.length - a.length; });
    var low = norm(text), marks = [];
    toks.forEach(function (k) { var i = low.indexOf(k); if (i >= 0) marks.push([i, i + k.length]); });
    if (!marks.length) return t;
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var res = '', at = 0; marks.forEach(function (m) { if (m[0] < at) return; res += esc(text.slice(at, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; at = m[1]; });
    return res + esc(text.slice(at));
  }
  function palLayer() {
    if (pal) return pal;
    var el = doc.createElement('div'); el.className = 'gp-pal'; el.style.display = 'none';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Search the Games');
    el.innerHTML = '<div class="gp-pal-in">' + ICON('search') + '<input type="search" placeholder="Search events, sessions, teams, venues, roles" aria-label="Search" autocomplete="off" spellcheck="false" enterkeyhint="search" role="combobox" aria-expanded="true" aria-controls="gp-pal-list" aria-autocomplete="list"><button type="button" class="gp-clr" aria-label="Clear search" hidden>' + ICON('close') + '</button><button type="button" class="gp-cancel" aria-label="Close search"><span class="gp-cancel-d">' + ICON('close') + '<span class="gp-kbd">Esc</span></span><span class="gp-cancel-m">Cancel</span></button></div><div class="gp-pal-list" id="gp-pal-list" role="listbox"></div><div class="gp-pal-ft"><span><span class="gp-kbd">↑</span><span class="gp-kbd">↓</span> move</span><span><span class="gp-kbd">Enter</span> open</span><span><span class="gp-kbd">' + (/Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘' : 'Ctrl') + ' K</span> search anywhere</span></div>';
    doc.body.appendChild(el);
    pal = { el: el, input: el.querySelector('input'), list: el.querySelector('.gp-pal-list'), items: [], idx: 0, I: null };
    pal.focus = function () { pal.input.focus({ preventScroll: true }); pal.input.select(); };
    pal.onClose = function () {};
    pal.clr = el.querySelector('.gp-clr');
    pal.input.addEventListener('input', function () { pal.clr.hidden = !pal.input.value; palRender(); });
    pal.clr.addEventListener('click', function () { pal.input.value = ''; pal.clr.hidden = true; palRender(); pal.input.focus(); });
    el.querySelector('.gp-cancel').addEventListener('click', function () { closeLayer(pal); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); palMove(e.key === 'ArrowDown' ? 1 : -1); }
      else if (e.key === 'Enter') { e.preventDefault(); palRun(pal.idx); }
      else trapTab(e, el);
    });
    pal.list.addEventListener('click', function (e) { var b = e.target.closest('.gp-it'); if (b) palRun(+b.getAttribute('data-i')); });
    pal.list.addEventListener('mousemove', function (e) { var b = e.target.closest('.gp-it'); if (b) { var i = +b.getAttribute('data-i'); if (i !== pal.idx) { pal.idx = i; palMark(false); } } });
    return pal;
  }
  function palRender() {
    var P = pal, q = P.input.value, res = search(q, P.I), groups = {}, order = ['Go to', 'Events', 'Sessions', 'Teams', 'Registration', 'Venues'], cap = { 'Go to': 5, Events: 6, Sessions: 8, Teams: 4, Registration: 4, Venues: 4 };
    if (!res) {
      var recent = LS.get('gms-recent', []).filter(function (x) { return typeof x === 'string'; }).slice(0, 4);
      res = P.I.filter(function (x) { return x.g === 'Go to'; }); cap['Go to'] = 9;
      if (recent.length) { P.items = []; var h0 = '<div class="gp-grp">RECENT SEARCHES</div>'; recent.forEach(function (r) { P.items.push({ t: r, s: 'Search again', ic: 'search', c: '#6B7180', recent: r }); }); P.recentHTML = h0; } else P.recentHTML = '';
    } else P.recentHTML = '';
    var pre = P.recentHTML ? P.items.slice() : [];
    res.forEach(function (it) { var g = groups[it.g] || (groups[it.g] = []); if (g.length < cap[it.g]) g.push(it); });
    var h = '', items = pre.slice(), i = 0;
    if (pre.length) { h += P.recentHTML; pre.forEach(function (it) { h += itemHTML(it, i++, ''); }); }
    order.forEach(function (g) { if (!groups[g]) return; h += '<div class="gp-grp" role="presentation">' + g.toUpperCase() + '</div>'; groups[g].forEach(function (it) { items.push(it); h += itemHTML(it, i++, q); }); });
    P.items = items; P.idx = 0;
    P.list.innerHTML = items.length ? h : '<div class="gp-empty">Nothing found for “' + esc(q) + '”. Try a sport, a team, a venue or a day.</div>';
    palMark(true);
  }
  function itemHTML(it, i, q) {
    return '<button type="button" class="gp-it" role="option" id="gp-o' + i + '" data-i="' + i + '" style="--c:' + (it.c || '#2F5BFF') + '"><span class="gp-it-ic">' + ICON(it.ic || 'search') + '</span><span style="min-width:0"><span class="gp-it-t">' + hl(it.t, q) + '</span><span class="gp-it-s">' + esc(it.s) + '</span></span><span class="gp-it-go">' + ICON('arrow_forward') + '</span></button>';
  }
  function palMark(scroll) {
    $$('.gp-it', pal.list).forEach(function (b) { if (+b.getAttribute('data-i') === pal.idx) { b.setAttribute('data-on', ''); b.setAttribute('aria-selected', 'true'); if (scroll !== false) b.scrollIntoView({ block: 'nearest' }); } else { b.removeAttribute('data-on'); b.setAttribute('aria-selected', 'false'); } });
    pal.input.setAttribute('aria-activedescendant', 'gp-o' + pal.idx);
  }
  function palMove(d) { var n = pal.items.length; if (!n) return; pal.idx = (pal.idx + d + n) % n; palMark(true); }
  function palRun(i) {
    var it = pal.items[i]; if (!it) return;
    if (it.recent) { pal.input.value = it.recent; pal.clr.hidden = false; palRender(); return; }
    var q = pal.input.value.trim();
    if (q) { var r = LS.get('gms-recent', []).filter(function (x) { return x !== q; }); r.unshift(q); LS.set('gms-recent', r.slice(0, 6)); }
    closeLayer(pal);
    setTimeout(function () { it.act(); }, 60);
  }
  function openSearch() {
    if (!A) return;
    var P = palLayer(); P.I = buildIndex();
    if (stack.indexOf(P) >= 0) { P.focus(); return; }
    P.input.value = ''; P.clr.hidden = true; palRender(); openLayer(P);
  }

  /* ------------------------------------------------------------------ chapter rail (desktop) */
  var rail = null;
  function railInit() {
    var secs = $$('x-dc section'), find = function (k) { return $('section[data-r="' + k + '"]'); };
    var hero = find('hero'), steps = hero && hero.nextElementSibling && hero.nextElementSibling.tagName === 'SECTION' ? hero.nextElementSibling : secs[1];
    var CH = [[hero, 'Home', 1], [steps, 'Overview', 0], [find('tv-section'), 'Live TV', 1], [find('ecx'), 'Event centre', 1], [find('ev-section'), 'Programme', 0], [find('sch-section'), 'Schedule', 0], [find('roles-section'), 'Registration', 0], [find('stories'), 'Stories', 0], [find('fn-section'), 'Finale', 1]].filter(function (c) { return c[0]; });
    if (!CH.length) return;
    var el = rail && rail.el;
    if (!el) { el = doc.createElement('nav'); el.className = 'gp-rail'; el.setAttribute('aria-label', 'Page chapters'); doc.body.appendChild(el); }
    el.innerHTML = CH.map(function (c, i) { return '<button type="button" data-i="' + i + '" aria-label="' + c[1] + '"><i class="tk"><b></b></i><em><i>' + (i < 10 ? '0' : '') + i + '</i>' + c[1] + '</em></button>'; }).join('');
    rail = { el: el, CH: CH, tops: [], idx: -1, on: false, tone: '', fill: null };
    el.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; var i = +b.getAttribute('data-i'); measureRail(); window.scrollTo({ top: Math.max(0, rail.tops[i] + (i ? 2 : 0)), behavior: REDUCED ? 'auto' : 'smooth' }); };
    measureRail(); railTick();
  }
  function measureRail() { if (!rail) return; var y = window.scrollY; rail.tops = rail.CH.map(function (c) { return c[0].isConnected ? c[0].getBoundingClientRect().top + y : 1e9; }); rail.ends = rail.CH.map(function (c, i) { return c[0].isConnected ? rail.tops[i] + c[0].offsetHeight : 1e9; }); }
  var railRaf = 0;
  function railTick() {
    railRaf = 0; if (!rail) return;
    var wide = window.innerWidth >= 1380, home = A && A.screen() === 'home', vh = window.innerHeight, y = window.scrollY;
    var show = wide && home && y > vh * 0.5 && !stack.length;
    if (show !== rail.on) { rail.on = show; if (show) { measureRail(); rail.el.setAttribute('data-on', ''); } else rail.el.removeAttribute('data-on'); }
    if (!show) return;
    var p = y + vh * 0.4, i = 0; for (var k = 0; k < rail.tops.length; k++) if (rail.tops[k] <= p) i = k;
    if (i !== rail.idx) { var bs = rail.el.children; if (bs[rail.idx]) bs[rail.idx].removeAttribute('data-on'); if (bs[i]) { bs[i].setAttribute('data-on', ''); bs[i].setAttribute('aria-current', 'true'); } if (bs[rail.idx]) bs[rail.idx].removeAttribute('aria-current'); rail.idx = i; rail.fill = bs[i] && bs[i].querySelector('.tk b'); var tone = rail.CH[i][2] || Theme.get() === 'dark' ? 'dark' : ''; if (tone !== rail.tone) { rail.tone = tone; if (tone) rail.el.setAttribute('data-tone', tone); else rail.el.removeAttribute('data-tone'); } }
    var a = rail.tops[i], b = rail.ends[i], f = b > a ? Math.max(0, Math.min(1, (p - a) / (b - a))) : 0;
    if (rail.fill) rail.fill.style.transform = 'scaleX(' + f.toFixed(3) + ')';
  }
  window.addEventListener('scroll', function () { if (rail && !railRaf) railRaf = requestAnimationFrame(railTick); }, { passive: true });
  var rzT = 0; window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { measureRail(); railTick(); }, 150); });

  /* ------------------------------------------------------------------ installable app */
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (LS.get('gms-install-no', 0) > Date.now()) return;
    setTimeout(function () {
      if (!deferred || stack.length) return;
      var b = doc.createElement('div'); b.className = 'gp-inst'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Install the GMS app');
      b.innerHTML = '<img src="assets/brand/icon-192.png" alt=""><p><b>Install GMS</b>The schedule and your plan open full screen and work with no signal at the venues.</p><button type="button" class="gp-btn gp-btn--pri" data-i="y">Install</button><button type="button" class="gp-x" data-i="n" aria-label="Not now">' + ICON('close') + '</button>';
      doc.body.appendChild(b); requestAnimationFrame(function () { b.setAttribute('data-on', ''); });
      b.onclick = function (ev) {
        var t = ev.target.closest('[data-i]'); if (!t) return;
        if (t.getAttribute('data-i') === 'y' && deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; }); }
        else LS.set('gms-install-no', Date.now() + 14 * 864e5);
        b.removeAttribute('data-on'); setTimeout(function () { b.remove(); }, 400);
      };
    }, 25000);
  });
  window.addEventListener('appinstalled', function () { deferred = null; toast('GMS is installed', { icon: 'check' }); });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () { setTimeout(function () { navigator.serviceWorker.register('sw.js').catch(function () {}); }, 3000); });
  }

  /* ------------------------------------------------------------------ public API + wiring */
  var Plus = window.GMSPlus = {
    open: function (view, arg) {
      if (!A) return;
      if (view === 'search') return openSearch();
      if (view === 'mygames' && arg && arg.shared) { renderSheet('mygames', arg); }
      else if (view === 'medals' && arg && arg.nation) { renderSheet('medals', {}); setTimeout(function () { var r = sheet.el.querySelector('tr.gp-row[data-v="' + arg.nation + '"]'); if (r) { r.click(); r.scrollIntoView({ block: 'center' }); } else toast((NATIONS[arg.nation] || arg.nation) + ' has no medals yet'); }, 60); }
      else renderSheet(view, arg);
      if (stack.indexOf(sheet) < 0) openLayer(sheet);
    },
    toggleTheme: function () { Theme.toggle(); },
    my: My
  };
  doc.addEventListener('click', function (e) {
    var s = e.target.closest('[data-star]');
    if (s) { e.preventDefault(); var on = My.toggle(s.getAttribute('data-star')); s.setAttribute('aria-pressed', on ? 'true' : 'false'); s.removeAttribute('data-pop'); void s.offsetWidth; if (on) s.setAttribute('data-pop', ''); return; }
    var sh = e.target.closest('[data-share]');
    if (sh) { e.preventDefault(); if (A) shareSpec(sh.getAttribute('data-share')); return; }
    var p = e.target.closest('[data-plus]');
    if (p) { var k = p.getAttribute('data-plus'); e.preventDefault(); if (A && A.closeMenus) A.closeMenus(); if (k === 'theme') Theme.toggle(); else Plus.open(k); }
  });
  doc.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '', typing = /INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (pal && stack.indexOf(pal) >= 0) closeLayer(pal); else openSearch(); return; }
    if (e.key === '/' && !typing && !stack.length) { e.preventDefault(); openSearch(); return; }
    if (e.key === 'Escape' && stack.length) { e.preventDefault(); closeTop(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('gp-row')) { e.preventDefault(); e.target.click(); }
  });
  /* ------------------------------------------------------------------ registration vault
     Same sections, fields, limits and options as the live GMS registration form, one section at a time, then a preview. */
  var STATES = 'Andaman & Nicobar Islands|Andhra Pradesh|Arunachal Pradesh|Assam|Bihar|Chandigarh|Chhattisgarh|Dadra & Nagar Haveli and Daman & Diu|Delhi (NCT)|Goa|Gujarat|Haryana|Himachal Pradesh|Jammu & Kashmir|Jharkhand|Karnataka|Kerala|Ladakh|Lakshadweep|Madhya Pradesh|Maharashtra|Manipur|Meghalaya|Mizoram|Nagaland|Odisha|Puducherry|Punjab|Rajasthan|Sikkim|Tamil Nadu|Telangana|Tripura|Uttar Pradesh|Uttarakhand|West Bengal'.split('|');
  var COUNTRIES = 'Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cabo Verde|Cambodia|Cameroon|Canada|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo|Costa Rica|Côte d\'Ivoire|Croatia|Cuba|Cyprus|Czechia|Democratic Republic of the Congo|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Mexico|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|Sao Tome and Principe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Türkiye|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Vatican City|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe'.split('|');
  var SHOES = (function () { var o = [], uk; for (uk = 5.5; uk <= 11.5; uk += 0.5) o.push('M-UK' + uk + ' or M-US' + (uk + 0.5)); [12.5, 13.5, 14.5, 15.5].forEach(function (u) { o.push('M-UK' + u + ' or M-US' + (u + 0.5)); }); return o; })();
  var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var DOB_MIN = '1950-01-01', DOB_MAX = (function () { var d = new Date(); d.setFullYear(d.getFullYear() - 18); return iso(d); })();
  var MB = 1048576;
  // field: k, label, t(ype), req, max, ph, opts, w ('h' = half width), hint
  function vaultSteps(role) {
    var org = role.org === 'required' ? { k: 'org', label: role.orgLabel || 'Organisation', t: 'text', req: 1, max: 150, ph: role.orgPh || 'Organisation' } : role.org === 'optional' ? { k: 'org', label: 'Organisation', t: 'text', max: 150, ph: 'Organisation' } : null;
    var name = { k: 'name', label: 'Full Name', t: 'text', req: 1, max: 200, ph: 'Full name', ac: 'name' };
    var p = [{ k: 'photo', label: 'Photo', t: 'photo', req: 1, hint: 'JPG or PNG, max 2 MB. Front-face photo required.' }];
    if (org && role.org === 'required') p.push(org, name); else { p.push(name); if (org) p.push(org); }
    p.push({ k: 'dob', label: 'Date of Birth', t: 'date', req: 1, w: 'h', min: DOB_MIN, maxd: DOB_MAX, ac: 'bday' }, { k: 'gender', label: 'Gender', t: 'select', req: 1, w: 'h', opts: ['Male', 'Female', 'Prefer Not to Say'], def: 'Male' },
      { k: 'blood', label: 'Blood Group', t: 'select', w: 'h', opts: ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'], ph: 'Select blood group' }, { k: 'designation', label: 'Designation', t: 'text', req: 1, max: 100, w: 'h', ph: 'Enter your designation', ac: 'organization-title' },
      { k: 'mobile', label: 'Mobile Number', t: 'tel', req: 1, max: 10, w: 'h', ph: '00000 00000', prefix: '+91', ac: 'tel-national' }, { k: 'email', label: 'Email Address', t: 'email', req: 1, w: 'h', ph: 'e.g. name@example.com', ac: 'email' });
    return [
      { n: 'Personal Details', f: p },
      { n: 'Emergency Contact Details', f: [{ k: 'ecName', label: 'Emergency Contact Name', t: 'text', req: 1, max: 100, ph: 'Full name' }, { k: 'ecRel', label: 'Relation', t: 'select', req: 1, w: 'h', opts: ['Father', 'Mother', 'Spouse', 'Sibling', 'Guardian', 'Other'], ph: 'Select relation' }, { k: 'ecNum', label: 'Emergency Contact Number', t: 'tel', req: 1, max: 10, w: 'h', ph: '10-digit number' }] },
      { n: 'Permanent Address', f: [{ k: 'address', label: 'Address', t: 'area', req: 1, max: 400, ph: 'Flat / House No., Street, Area, Landmark', ac: 'street-address' }, { k: 'pin', label: 'Pincode', t: 'pin', req: 1, max: 6, w: 'h', ph: '6-digit pincode', ac: 'postal-code' }, { k: 'state', label: 'State', t: 'select', req: 1, w: 'h', opts: STATES, ph: 'Select state' }, { k: 'country', label: 'Country', t: 'select', req: 1, opts: COUNTRIES, def: 'India' }] },
      { n: 'Kit Details', f: [{ k: 'kit', label: 'Kit Size', t: 'select', req: 1, w: 'h', opts: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'], ph: 'Select kit size' }, { k: 'shoe', label: 'Shoe Size (UK / US)', t: 'select', req: 1, w: 'h', opts: SHOES, ph: 'Select shoe size' }] },
      { n: 'Government ID (Optional)', note: 'Upload a government ID if available. Upload either or both sides if you choose.', f: [{ k: 'idType', label: 'ID Type (Optional)', t: 'select', opts: ['Aadhaar Card', 'Passport', 'Election ID', "Driver's License", 'School Certificate', 'Birth Certificate'], ph: 'Select ID type' }, { k: 'idFront', label: 'Front Side', t: 'file', w: 'h', when: 'idType' }, { k: 'idBack', label: 'Back Side', t: 'file', w: 'h', when: 'idType' }] }
    ];
  }
  function vErr(f, v, files) {
    if (f.t === 'photo') { var ph = files.photo; if (!ph) return 'Add a front-face photo.'; return ''; }
    if (f.t === 'file') return '';
    v = (v == null ? '' : String(v)).trim();
    if (!v) return f.req ? (f.t === 'select' ? 'Choose an option.' : f.label + ' is required.') : '';
    if (f.t === 'tel' && !/^\d{10}$/.test(v)) return 'Enter a 10-digit number.';
    if (f.t === 'pin' && !/^\d{6}$/.test(v)) return 'Enter a 6-digit pincode.';
    if (f.t === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address.';
    if (f.t === 'date') { if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || v < f.min) return 'Enter a date from 1950 onwards.'; if (v > f.maxd) return 'You must be at least 18 years old.'; }
    if (f.max && v.length > f.max) return 'Keep this under ' + f.max + ' characters.';
    return '';
  }
  var V = null; // vault state
  var GC = ['#2F5BFF', '#1C8A53', '#B07A12'];
  function roleOf(id) { return D.REG.find(function (r) { return r.id === id; }) || D.REG[0]; }
  function roleColor(id) { var g = 0; D.REG_GROUPS.forEach(function (x, i) { if (x[1].indexOf(id) >= 0) g = i; }); return GC[g] || GC[0]; }
  function vaultCSS() {
    if ($('#gv-css')) return;
    var c = [
      '.gv{position:fixed;inset:0;z-index:124;display:none;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;opacity:0;transition:opacity .3s ease}.gv[data-on]{opacity:1}',
      '.gv-box{position:relative;width:min(1180px,100%);height:100%;max-height:780px;display:grid;grid-template-columns:minmax(0,40fr) minmax(0,60fr);border-radius:26px;overflow:hidden;background:var(--d-s0,#fff);color:var(--d-ink,#0B0D12);box-shadow:0 40px 100px rgba(8,10,16,.45);transform:translateY(16px) scale(.985);transition:transform .5s var(--gms-ease,ease)}.gv[data-on] .gv-box{transform:none}',
      /* media side */
      '.gv-media{position:relative;overflow:hidden;background:#0B0D12;color:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:26px;min-height:0}',
      '.gv-media video,.gv-media .gv-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#fff}',
      '.gv-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,10,16,.72) 0%,rgba(8,10,16,.1) 30%,rgba(8,10,16,.25) 52%,rgba(8,10,16,.9) 100%)}',
      '.gv-brand,.gv-mcopy{position:relative;z-index:2}.gv-brand{display:flex;align-items:center;gap:10px;font:800 17px/1 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.02em}.gv-brand img{width:30px;height:30px}',
      '.gv-mcopy small{display:block;font:500 10.5px/1 "JetBrains Mono",monospace;letter-spacing:.14em;color:rgba(255,255,255,.7)}',
      '.gv-mcopy h2{margin:10px 0 8px;font:700 clamp(30px,3.4vw,46px)/.95 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.04em}',
      '.gv-mcopy p{margin:0;max-width:330px;font-size:14px;line-height:1.5;color:rgba(255,255,255,.78)}',
      /* accreditation card */
      '.gv-pass{position:relative;z-index:2;margin-top:18px;width:min(330px,100%);border-radius:18px;overflow:hidden;background:#fff;color:#0B0D12;box-shadow:0 18px 44px rgba(0,0,0,.4)}',
      '.gv-pass-top{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--rc,#2F5BFF);color:#fff;font:600 10px/1 "JetBrains Mono",monospace;letter-spacing:.14em}',
      '.gv-pass-top::before{content:"";position:absolute;left:50%;top:5px;width:38px;height:5px;margin-left:-19px;border-radius:5px;background:rgba(255,255,255,.55)}',
      '.gv-pass-bd{display:grid;grid-template-columns:76px minmax(0,1fr);gap:14px;padding:14px;align-items:center}',
      '.gv-pass-ph{width:76px;height:92px;border-radius:10px;background:#EEF0F4 center/cover no-repeat;display:grid;place-items:center;color:#A9B0BB;font-size:26px}',
      '.gv-pass-n{font:700 19px/1.1 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.02em;overflow-wrap:anywhere}.gv-pass-n[data-empty]{color:#A9B0BB}',
      '.gv-pass-d{margin-top:5px;font-size:12.5px;line-height:1.35;color:#4A505C;overflow-wrap:anywhere}',
      '.gv-pass-role{display:inline-block;margin-top:9px;padding:5px 9px;border-radius:6px;background:var(--rc,#2F5BFF);color:#fff;font:600 10px/1 "JetBrains Mono",monospace;letter-spacing:.1em}',
      '.gv-pass-ft{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;border-top:1px dashed #D9DDE4;font:500 10px/1 "JetBrains Mono",monospace;letter-spacing:.08em;color:#6B7180}',
      '.gv-bars{height:22px;flex:1;max-width:120px;background:repeating-linear-gradient(90deg,#0B0D12 0 2px,transparent 2px 4px,#0B0D12 4px 5px,transparent 5px 9px,#0B0D12 9px 12px,transparent 12px 14px)}',
      /* form side */
      '.gv-main{display:flex;flex-direction:column;min-width:0;min-height:0}',
      '.gv-hd{flex:none;display:flex;align-items:center;gap:10px;padding:16px 22px;border-bottom:1px solid var(--d-line,#EEF0F4)}',
      '.gv-hd b{flex:1;font:600 12px/1 "JetBrains Mono",monospace;letter-spacing:.14em}',
      '.gv-ib{all:unset;box-sizing:border-box;flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;font-size:18px;background:var(--d-tint,rgba(11,13,18,.06))}.gv-ib:hover{background:var(--d-line,rgba(11,13,18,.12))}.gv-ib[disabled]{opacity:.35;cursor:default}.gv-ib .gi-back{transform:rotate(180deg)}',
      '.gv-role{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 22px 0;padding:11px 14px;border-radius:12px;background:var(--d-s1,#F4F5F7);box-shadow:inset 3px 0 0 var(--rc,#2F5BFF)}',
      '.gv-role span{font:600 11.5px/1 "JetBrains Mono",monospace;letter-spacing:.12em}.gv-link{all:unset;cursor:pointer;font-size:13px;font-weight:600;color:#2F5BFF;text-decoration:underline;text-underline-offset:3px}html[data-theme=dark] .gv-link{color:#8FA6FF}',
      '.gv-rail{flex:none;display:flex;gap:6px;padding:14px 22px 12px;overflow-x:auto;scrollbar-width:none}.gv-rail::-webkit-scrollbar{display:none}',
      '.gv-st{all:unset;box-sizing:border-box;flex:1 0 auto;min-width:0;display:flex;align-items:center;gap:8px;padding:8px 10px 8px 8px;border-radius:999px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--d-ink3,#6B7180);white-space:nowrap}',
      '.gv-st[disabled]{cursor:default;opacity:.55}.gv-st[data-on]{background:var(--d-inv,#0B0D12);color:var(--d-on-inv,#fff)}.gv-st:not([data-on]):not([disabled]):hover{background:var(--d-tint,#F1F3F7)}',
      '.gv-ring{position:relative;flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font:600 10px/1 "JetBrains Mono",monospace;background:conic-gradient(#2F5BFF calc(var(--p,0)*1%),var(--d-line,#E3E6EB) 0)}',
      '.gv-ring::before{content:"";position:absolute;inset:2.5px;border-radius:50%;background:var(--d-s0,#fff)}.gv-st[data-on] .gv-ring::before{background:var(--d-inv,#0B0D12)}.gv-ring i{position:relative;font-style:normal}',
      '.gv-st[data-done] .gv-ring{background:#1FA463;color:#fff}.gv-st[data-done] .gv-ring::before{display:none}',
      '.gv-st em{font-style:normal}@media (max-width:1100px){.gv-st:not([data-on]) em{display:none}.gv-st{flex:0 0 auto}.gv-st[data-on]{flex:1 1 auto}}',
      '.gv-body{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:8px 22px 22px}',
      '.gv-h{display:flex;align-items:baseline;gap:12px;margin:10px 0 4px}.gv-h i{font:700 30px/1 "Bricolage Grotesque",system-ui,sans-serif;font-style:normal;color:var(--d-line,#D9DDE4)}html[data-theme=dark] .gv-h i{color:rgba(255,255,255,.22)}.gv-h h3{margin:0;font:700 19px/1.1 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.02em}',
      '.gv-left{margin:0 0 14px;font-size:12.5px;color:var(--d-ink2,#5B6270)}.gv-note{margin:0 0 14px;font-size:13.5px;line-height:1.5;color:var(--d-ink2,#4A505C)}',
      '.gv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 14px}.gv-f{grid-column:1/-1;min-width:0}.gv-f[data-w=h]{grid-column:span 1}@media (max-width:560px){.gv-f[data-w=h]{grid-column:1/-1}}',
      '.gv-f label,.gv-lab{display:block;margin-bottom:7px;font:500 10.5px/1.2 "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--d-ink2,#4A505C)}.gv-f label b,.gv-lab b{color:#E5484D;font-weight:500}',
      '.gv-in{position:relative;display:flex;align-items:stretch;border:1px solid var(--d-line,#DFE3EA);border-radius:12px;background:var(--d-s0,#fff);transition:border-color .2s,box-shadow .2s}',
      '.gv-in:focus-within{border-color:#2F5BFF;box-shadow:0 0 0 3px rgba(47,91,255,.16)}.gv-f[data-s=bad] .gv-in{border-color:#E5484D}.gv-f[data-s=ok] .gv-in{border-color:#1FA463}',
      '.gv-in input,.gv-in select,.gv-in textarea{all:unset;box-sizing:border-box;flex:1;min-width:0;width:100%;padding:13px 14px;font:500 15px/1.3 "Instrument Sans",system-ui,sans-serif;color:var(--d-ink,#0B0D12)}',
      '.gv .gv-in input:focus-visible,.gv .gv-in select:focus-visible,.gv .gv-in textarea:focus-visible{outline:none!important}',
      '.gv-in textarea{min-height:84px;resize:vertical;white-space:pre-wrap}.gv-in ::placeholder{color:var(--d-ink3,#9AA1AD)}.gv-in select{padding-right:38px;cursor:pointer}.gv-in select:invalid,.gv-in select[data-empty]{color:var(--d-ink3,#9AA1AD)}.gv-in option{color:#0B0D12;background:#fff}',
      '.gv-in input[type=date]{min-height:46px}html[data-theme=dark] .gv-in input[type=date]{color-scheme:dark}',
      '.gv-chev{position:absolute;right:13px;top:50%;margin-top:-8px;font-size:16px;pointer-events:none;color:var(--d-ink3,#6B7180)}',
      '.gv-pre{display:grid;place-items:center;padding:0 12px;border-right:1px solid var(--d-line,#DFE3EA);font:500 14px/1 "JetBrains Mono",monospace;color:var(--d-ink2,#4A505C)}',
      '.gv-tick{position:absolute;right:12px;top:50%;margin-top:-9px;width:18px;height:18px;border-radius:50%;display:none;place-items:center;font-size:11px;background:#1FA463;color:#fff}.gv-f[data-s=ok] .gv-tick{display:grid}.gv-f[data-s=ok] select~.gv-tick{right:36px}',
      '.gv-msg{display:flex;justify-content:space-between;gap:10px;margin-top:6px;min-height:15px;font-size:12px;line-height:1.25;color:var(--d-ink3,#6B7180)}.gv-msg span:first-child{color:#D93D42}html[data-theme=dark] .gv-msg span:first-child{color:#FF8A8E}',
      /* uploads */
      '.gv-photo{display:flex;align-items:center;gap:16px}.gv-ph{position:relative;flex:none;width:86px;height:86px;border-radius:50%;border:1.5px dashed var(--d-ink3,#B4BAC4);display:grid;place-items:center;font-size:24px;color:var(--d-ink3,#8A909C);background:var(--d-s1,#F7F8FA) center/cover no-repeat;overflow:hidden}',
      '.gv-ph[data-has]{border:2px solid #1FA463}.gv-ph[data-has] .gi{display:none}.gv-f[data-s=bad] .gv-ph{border-color:#E5484D}',
      '.gv-up{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:999px;background:var(--d-tint,#E8EEFF);color:#2F5BFF;font-size:13.5px;font-weight:600}html[data-theme=dark] .gv-up{color:#9FB3FF}.gv-up:hover{background:#2F5BFF;color:#fff}',
      '.gv-rm{all:unset;cursor:pointer;margin-left:10px;font-size:13px;font-weight:600;color:var(--d-ink2,#5B6270);text-decoration:underline;text-underline-offset:3px}',
      '.gv-hint{margin-top:8px;font-size:12px;color:var(--d-ink3,#6B7180)}',
      '.gv-drop{all:unset;box-sizing:border-box;width:100%;min-height:104px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px;border:1.5px dashed var(--d-ink3,#B4BAC4);border-radius:14px;cursor:pointer;text-align:center;font-size:13.5px;font-weight:600;transition:border-color .2s,background .2s}',
      '.gv-drop small{font-weight:500;font-size:12px;color:var(--d-ink3,#6B7180)}.gv-drop:hover,.gv-drop[data-over]{border-color:#2F5BFF;background:var(--d-tint,#F3F6FF)}.gv-drop .gi{font-size:20px;color:#2F5BFF}',
      '.gv-file{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px;border:1px solid #1FA463;border-radius:14px}',
      '.gv-thumb{width:52px;height:52px;border-radius:9px;background:var(--d-s1,#F1F3F7) center/cover no-repeat;display:grid;place-items:center;font:700 11px/1 "JetBrains Mono",monospace;color:#D93D42}',
      '.gv-file b{display:block;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gv-file span{font-size:12px;color:var(--d-ink3,#6B7180)}',
      /* footer + preview + role picker + done */
      '.gv-ft{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px;border-top:1px solid var(--d-line,#EEF0F4)}.gv-ft small{font-size:12px;color:var(--d-ink3,#6B7180)}',
      '.gv-go{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:9px;height:46px;padding:0 22px;border-radius:999px;background:#2F5BFF;color:#fff;font-size:15px;font-weight:600;transition:background .25s,transform .25s var(--gms-ease,ease)}.gv-go:hover{background:#1E44DA}.gv-go:active{transform:scale(.98)}',
      '.gv-sec{padding:14px 0;border-bottom:1px solid var(--d-line,#EEF0F4)}.gv-sec-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.gv-sec-h b{font:700 15px/1 "Bricolage Grotesque",system-ui,sans-serif}',
      '.gv-dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;margin:0}.gv-dl div{min-width:0}.gv-dl dt{font:500 10px/1.2 "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--d-ink3,#6B7180)}.gv-dl dd{margin:4px 0 0;font-size:14.5px;overflow-wrap:anywhere}.gv-dl dd[data-empty]{color:var(--d-ink3,#9AA1AD)}@media (max-width:560px){.gv-dl{grid-template-columns:1fr}}',
      '.gv-prev-pass{display:none;margin:6px 0 10px}.gv-prev-pass .gv-pass{margin:0;box-shadow:0 0 0 1px var(--d-line,#E3E6EB),0 10px 26px rgba(8,10,16,.12)}',
      '.gv-pick{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px}@media (max-width:560px){.gv-pick{grid-template-columns:1fr}}',
      '.gv-opt{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:40px minmax(0,1fr);gap:12px;align-items:center;padding:12px;border-radius:14px;border:1px solid var(--d-line,#E3E6EB)}.gv-opt:hover{border-color:var(--d-ink3,#8A909C)}.gv-opt[data-on]{border-color:#2F5BFF;box-shadow:0 0 0 3px rgba(47,91,255,.16)}',
      '.gv-opt-ic{width:40px;height:40px;border-radius:11px;background:var(--d-s1,#F1F3F7);color:#2F5BFF;display:grid;place-items:center;font-size:19px}',
      '.gv-opt b{display:block;font-size:14.5px}.gv-opt span span{display:block;margin-top:2px;font-size:12px;line-height:1.35;color:var(--d-ink2,#5B6270)}',
      '.gv-done{display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:26px 0}.gv-done-ic{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:#1FA463;color:#fff;font-size:26px}',
      '.gv-done h3{margin:0;font:700 30px/1.05 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.03em}.gv-done p{margin:0;max-width:460px;font-size:15px;line-height:1.55;color:var(--d-ink2,#4A505C)}',
      '.gv-ref{display:inline-flex;align-items:center;gap:12px;padding:12px 16px;border-radius:14px;background:var(--d-s1,#F4F5F7);font:600 20px/1 "JetBrains Mono",monospace;letter-spacing:.04em}',
      /* phones and tablets */
      '@media (max-width:900px){.gv{padding:0;align-items:stretch}.gv-box{width:100%;height:100%;max-height:none;border-radius:0;grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr)}.gv-media{box-sizing:border-box;flex-direction:row;align-items:flex-end;padding:14px 16px;min-height:120px;height:120px}.gv-media video,.gv-media .gv-poster{object-position:50% 22%}.gv-brand{position:absolute;left:16px;top:14px}.gv-brand img{width:24px;height:24px}.gv-mcopy h2{margin:0;font-size:26px}.gv-mcopy p,.gv-mcopy small,.gv-media .gv-pass{display:none}.gv-prev-pass{display:block}.gv-hd,.gv-ft{padding-left:16px;padding-right:16px}.gv-role{margin-left:16px;margin-right:16px}.gv-rail{padding-left:16px;padding-right:16px}.gv-body{padding:6px 16px 18px}.gv-ft{padding-bottom:max(14px,env(safe-area-inset-bottom))}}',
      '@media (max-height:640px) and (min-width:901px){.gv-mcopy p{display:none}}',
      '@media (prefers-reduced-motion:reduce){.gv,.gv-box{transition:none}}'
    ].join('\n');
    var s = doc.createElement('style'); s.id = 'gv-css'; s.textContent = c; doc.head.appendChild(s);
  }
  function fmtSize(n) { return n >= MB ? (n / MB).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function vaultLayer() {
    if (V) return V;
    vaultCSS();
    var el = doc.createElement('div'); el.className = 'gv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'gv-title');
    el.innerHTML = '<div class="gv-box"><div class="gv-media"><div class="gv-brand"><img src="assets/brand/gms-mark-dark.svg" alt="">GMS</div><div><div class="gv-mcopy"><small>REGISTRATION</small><h2 data-gv-role></h2><p data-gv-desc></p></div><div data-gv-pass></div></div></div>' +
      '<div class="gv-main"><div class="gv-hd"><button type="button" class="gv-ib" data-gv="back" aria-label="Previous step">' + ICON('arrow_forward').replace('class="gi"', 'class="gi gi-back"') + '</button><b id="gv-title">REGISTRATION VAULT</b><button type="button" class="gv-ib" data-gv="close" aria-label="Close registration">' + ICON('close') + '</button></div>' +
      '<div class="gv-role"><span data-gv-rolecap></span><button type="button" class="gv-link" data-gv="change">Change</button></div><div class="gv-rail" role="navigation" aria-label="Registration steps" data-gv-rail></div><div class="gv-body" data-gv-body></div><div class="gv-ft" data-gv-ft></div></div></div>';
    doc.body.appendChild(el);
    V = { el: el, role: null, steps: [], step: 0, max: 0, F: {}, files: {}, urls: {}, touched: {}, picking: false, done: null };
    V.focus = function () { var f = el.querySelector('.gv-body input,.gv-body select,.gv-body textarea,.gv-body button'); (f || el.querySelector('[data-gv=close]')).focus({ preventScroll: true }); };
    V.onClose = function () { var v = el.querySelector('video'); if (v) { try { v.pause(); } catch (e) {} } if (!V.done && vaultHasText()) toast('Draft saved on this device', { icon: 'check' }); };
    el.addEventListener('keydown', function (e) { trapTab(e, el); });
    el.addEventListener('click', function (e) {
      if (e.target === el) { closeLayer(V); return; }
      var t = e.target.closest('[data-gv]'); if (!t) return;
      var a = t.getAttribute('data-gv'), v = t.getAttribute('data-v');
      if (a === 'close') closeLayer(V);
      else if (a === 'back') { if (V.picking) { V.picking = false; vaultRender(); } else if (V.step > 0) vaultGo(V.step - 1); }
      else if (a === 'change') { V.picking = !V.picking; vaultRender(); }
      else if (a === 'pick') { vaultSetRole(v); V.picking = false; vaultRender(); vaultSave(); }
      else if (a === 'step') vaultGo(+v);
      else if (a === 'next') vaultNext();
      else if (a === 'submit') vaultSubmit();
      else if (a === 'upload') { var inp = el.querySelector('input[type=file][data-k="' + v + '"]'); if (inp) inp.click(); }
      else if (a === 'remove') { vaultFile(v, null); }
      else if (a === 'again') { vaultReset(); vaultRender(); }
      else if (a === 'finish') closeLayer(V);
    });
    el.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-k'); if (!k || e.target.type === 'file') return;
      var f = vaultField(k); if (!f) return;
      var val = e.target.value;
      if (f.t === 'tel' || f.t === 'pin') { var d = val.replace(/\D/g, '').slice(0, f.max); if (d !== val) e.target.value = val = d; }
      V.F[k] = val;
      if (e.target.tagName === 'SELECT') { V.touched[k] = 1; if (val) e.target.removeAttribute('data-empty'); else e.target.setAttribute('data-empty', ''); }
      if (k === 'idType') { vaultRender(true); vaultSave(); return; }
      vaultMark(k); vaultRail(); vaultPass(); vaultSave();
    });
    el.addEventListener('change', function (e) {
      var t = e.target; if (t.type !== 'file') return;
      var k = t.getAttribute('data-k'), file = t.files && t.files[0]; t.value = ''; if (file) vaultFile(k, file);
    });
    el.addEventListener('focusout', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-k'); if (k && e.target.type !== 'file') { V.touched[k] = 1; vaultMark(k); } });
    ['dragenter', 'dragover'].forEach(function (n) { el.addEventListener(n, function (e) { var d = e.target.closest && e.target.closest('.gv-drop,.gv-photo'); if (d) { e.preventDefault(); d.setAttribute('data-over', ''); } }); });
    ['dragleave', 'drop'].forEach(function (n) { el.addEventListener(n, function (e) { var d = e.target.closest && e.target.closest('.gv-drop,.gv-photo'); if (!d) return; d.removeAttribute('data-over'); if (n === 'drop') { e.preventDefault(); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) vaultFile(d.getAttribute('data-k'), f); } }); });
    return V;
  }
  function vaultField(k) { for (var i = 0; i < V.steps.length; i++) for (var j = 0; j < V.steps[i].f.length; j++) if (V.steps[i].f[j].k === k) return V.steps[i].f[j]; return null; }
  function vaultHasText() { return Object.keys(V.F).some(function (k) { var f = vaultField(k); return V.F[k] && !(f && f.def === V.F[k]); }); }
  function vaultSave() { if (!V || V.done) return; LS.set('gms-reg-draft', { role: V.role.id, F: V.F, step: V.step, max: V.max, at: Date.now() }); }
  function vaultSetRole(id) {
    V.role = roleOf(id); V.steps = vaultSteps(V.role);
    V.steps.forEach(function (s) { s.f.forEach(function (f) { if (f.def && !V.F[f.k]) V.F[f.k] = f.def; }); });
    if (V.role.org === 'none') delete V.F.org;
    V.el.style.setProperty('--rc', roleColor(V.role.id));
    var m = V.el.querySelector('.gv-media'), old = m.querySelector('video,.gv-poster'); if (old) old.remove();
    var phone = window.innerWidth <= 760, base = 'assets/rolevid/' + V.role.id, node;
    if (REDUCED) { node = doc.createElement('img'); node.className = 'gv-poster'; node.alt = ''; node.src = base + '-poster.webp?v=g1'; }
    else { node = doc.createElement('video'); node.muted = true; node.loop = true; node.playsInline = true; node.setAttribute('playsinline', ''); node.setAttribute('muted', ''); node.preload = 'metadata'; node.poster = base + '-poster.webp?v=g1'; node.src = base + (phone ? '-m' : '-d') + '.mp4?v=g1'; node.setAttribute('aria-hidden', 'true'); var p = node.play(); if (p && p.catch) p.catch(function () {}); }
    m.insertBefore(node, m.firstChild);
    V.el.querySelector('[data-gv-role]').textContent = V.role.name; V.el.querySelector('[data-gv-desc]').textContent = V.role.desc; V.el.querySelector('[data-gv-rolecap]').textContent = V.role.name.toUpperCase();
  }
  function vaultReset() { Object.keys(V.urls).forEach(function (k) { try { URL.revokeObjectURL(V.urls[k]); } catch (e) {} }); V.F = {}; V.files = {}; V.urls = {}; V.touched = {}; V.step = 0; V.max = 0; V.done = null; V.picking = false; vaultSetRole(V.role.id); }
  function stepLeft(i) { var n = 0; V.steps[i].f.forEach(function (f) { if (f.req && vErr(f, V.F[f.k], V.files)) n++; }); return n; }
  function stepReq(i) { return V.steps[i].f.filter(function (f) { return f.req; }).length; }
  function vaultRail() {
    var h = V.steps.map(function (s, i) {
      var req = stepReq(i), left = stepLeft(i), pct = req ? Math.round((req - left) / req * 100) : (i <= V.max ? 100 : 0), done = !left && i < V.max;
      return '<button type="button" class="gv-st" data-gv="step" data-v="' + i + '"' + (i === V.step ? ' data-on aria-current="step"' : '') + (done && i !== V.step ? ' data-done' : '') + (i > V.max ? ' disabled' : '') + ' aria-label="Step ' + (i + 1) + ', ' + esc(s.n) + (left ? ', ' + left + ' required left' : ', complete') + '"><span class="gv-ring" style="--p:' + pct + '"><i>' + (done && i !== V.step ? '✓' : (i + 1)) + '</i></span><em>' + esc(s.n.replace(' (Optional)', '').replace(' Details', '')) + '</em></button>';
    }).join('');
    var p = V.steps.length;
    h += '<button type="button" class="gv-st" data-gv="step" data-v="' + p + '"' + (V.step === p ? ' data-on aria-current="step"' : '') + (V.max < p ? ' disabled' : '') + '><span class="gv-ring" style="--p:' + (V.max >= p ? 100 : 0) + '"><i>' + (p + 1) + '</i></span><em>Preview</em></button>';
    var r = V.el.querySelector('[data-gv-rail]'); r.innerHTML = h;
    var on = r.querySelector('[data-on]'); if (on && on.scrollIntoView && r.scrollWidth > r.clientWidth) r.scrollLeft = Math.max(0, on.offsetLeft - 16);
    var left = V.step < V.steps.length ? stepLeft(V.step) : 0, cap = V.el.querySelector('[data-gv-left]');
    if (cap) cap.textContent = V.step >= V.steps.length ? '' : left ? left + ' required field' + (left > 1 ? 's' : '') + ' left in this section' : (stepReq(V.step) ? 'This section is complete' : 'This section is optional');
  }
  function passHTML() {
    var F = V.F, u = V.urls.photo, sub = [F.designation, F.org].filter(Boolean).join(' · ');
    return '<div class="gv-pass" aria-label="Accreditation preview"><div class="gv-pass-top"><span>GMS ACCREDITATION</span><span>' + (F.blood ? esc(F.blood) : A.tour.year) + '</span></div><div class="gv-pass-bd"><div class="gv-pass-ph"' + (u ? ' style="background-image:url(' + u + ')"' : '') + '>' + (u ? '' : ICON('badge')) + '</div><div><div class="gv-pass-n"' + (F.name ? '' : ' data-empty') + '>' + esc(F.name || 'Your name') + '</div><div class="gv-pass-d">' + esc(sub || 'Designation') + '</div><span class="gv-pass-role">' + esc(V.role.name.toUpperCase()) + '</span></div></div><div class="gv-pass-ft"><span>' + (V.done ? esc(V.done) : 'PREVIEW') + '</span><span class="gv-bars" aria-hidden="true"></span></div></div>';
  }
  function vaultPass() { $$('[data-gv-pass]', V.el).forEach(function (n) { n.innerHTML = passHTML(); }); }
  function fieldHTML(f) {
    if (f.when && !V.F[f.when]) return '';
    var v = V.F[f.k] || '', id = 'gv-' + f.k, lab = esc(f.label) + (f.req ? ' <b aria-hidden="true">*</b>' : ''), h = '<div class="gv-f" data-f="' + f.k + '"' + (f.w ? ' data-w="' + f.w + '"' : '') + '>';
    if (f.t === 'photo') {
      var u = V.urls.photo;
      return h + '<span class="gv-lab">' + lab + '</span><div class="gv-photo" data-k="photo"><div class="gv-ph"' + (u ? ' data-has style="background-image:url(' + u + ')"' : '') + '>' + ICON('badge') + '</div><div><button type="button" class="gv-up" data-gv="upload" data-v="photo">' + (u ? 'Replace photo' : 'Upload Photo') + '</button>' + (u ? '<button type="button" class="gv-rm" data-gv="remove" data-v="photo">Remove</button>' : '') + '<div class="gv-hint">' + (u && V.files.photo ? esc(V.files.photo.name) + ' · ' + fmtSize(V.files.photo.size) : esc(f.hint)) + '</div></div><input type="file" data-k="photo" accept="image/jpeg,image/png" hidden aria-label="Photo"></div><div class="gv-msg" role="alert"><span></span></div></div>';
    }
    if (f.t === 'file') {
      var fl = V.files[f.k], img = V.urls[f.k];
      return h + '<span class="gv-lab">' + lab + '</span>' + (fl ? '<div class="gv-file"><div class="gv-thumb"' + (img ? ' style="background-image:url(' + img + ')"' : '') + '>' + (img ? '' : 'PDF') + '</div><div style="min-width:0"><b>' + esc(fl.name) + '</b><span>' + fmtSize(fl.size) + '</span></div><button type="button" class="gv-rm" data-gv="remove" data-v="' + f.k + '" aria-label="Remove ' + esc(f.label) + '">Remove</button></div>' : '<button type="button" class="gv-drop" data-gv="upload" data-v="' + f.k + '" data-k="' + f.k + '">' + ICON('download').replace('class="gi"', 'class="gi" style="transform:rotate(180deg)"') + 'Click to upload<small>JPG, PNG, PDF · Max 5 MB</small></button>') + '<input type="file" data-k="' + f.k + '" accept="image/*,application/pdf" hidden aria-label="' + esc(f.label) + '"><div class="gv-msg" role="alert"><span></span></div></div>';
    }
    h += '<label for="' + id + '">' + lab + '</label><div class="gv-in">';
    var common = ' id="' + id + '" data-k="' + f.k + '"' + (f.req ? ' aria-required="true"' : '') + ' aria-describedby="' + id + '-m"' + (f.ac ? ' autocomplete="' + f.ac + '"' : ' autocomplete="off"');
    if (f.t === 'select') h += '<select' + common + (v ? '' : ' data-empty') + '>' + (f.def ? '' : '<option value="">' + esc(f.ph || 'Select') + '</option>') + f.opts.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' + ICON('expand_more').replace('class="gi"', 'class="gi gv-chev"');
    else if (f.t === 'area') h += '<textarea' + common + ' maxlength="' + f.max + '" placeholder="' + esc(f.ph) + '" rows="3">' + esc(v) + '</textarea>';
    else h += (f.prefix ? '<span class="gv-pre">' + f.prefix + '</span>' : '') + '<input' + common + ' type="' + (f.t === 'pin' ? 'text' : f.t) + '"' + (f.t === 'tel' || f.t === 'pin' ? ' inputmode="numeric" pattern="[0-9]*"' : '') + (f.max ? ' maxlength="' + f.max + '"' : '') + (f.min ? ' min="' + f.min + '" max="' + f.maxd + '"' : '') + ' placeholder="' + esc(f.ph || '') + '" value="' + esc(v) + '">';
    return h + '<span class="gv-tick" aria-hidden="true">✓</span></div><div class="gv-msg" id="' + id + '-m" role="alert"><span></span>' + (f.t === 'area' ? '<span data-count>' + String(v).length + ' / ' + f.max + '</span>' : '') + '</div></div>';
  }
  function vaultMark(k, force) {
    var f = vaultField(k), w = V.el.querySelector('.gv-f[data-f="' + k + '"]'); if (!f || !w) return '';
    var err = vErr(f, V.F[k], V.files), show = force || V.touched[k], has = f.t === 'photo' ? !!V.files.photo : !!(V.F[k] && String(V.F[k]).trim());
    if (w.getAttribute('data-custom')) { err = w.getAttribute('data-custom'); show = true; }
    w.setAttribute('data-s', show && err ? 'bad' : has && !err && (f.t !== 'select' || !f.def || V.touched[k]) ? 'ok' : '');
    var m = w.querySelector('.gv-msg span'); if (m) m.textContent = show && err ? err : '';
    var c = w.querySelector('[data-count]'); if (c) c.textContent = String(V.F[k] || '').length + ' / ' + f.max;
    var inp = w.querySelector('[data-k]:not([type=file])'); if (inp && inp.setAttribute) inp.setAttribute('aria-invalid', show && err ? 'true' : 'false');
    return err;
  }
  function vaultFile(k, file) {
    var f = vaultField(k), w = function () { return V.el.querySelector('.gv-f[data-f="' + k + '"]'); }, bad = '';
    if (file) {
      if (k === 'photo') { if (!/^image\/(jpeg|png)$/.test(file.type)) bad = 'Use a JPG or PNG photo.'; else if (file.size > 2 * MB) bad = 'That photo is ' + fmtSize(file.size) + '. The limit is 2 MB.'; }
      else { if (!/^image\/|^application\/pdf$/.test(file.type)) bad = 'Use a JPG, PNG or PDF file.'; else if (file.size > 5 * MB) bad = 'That file is ' + fmtSize(file.size) + '. The limit is 5 MB.'; }
    }
    if (bad) { var x = w(); if (x) { x.setAttribute('data-custom', bad); vaultMark(k, true); x.removeAttribute('data-custom'); } return; }
    if (V.urls[k]) { try { URL.revokeObjectURL(V.urls[k]); } catch (e) {} delete V.urls[k]; }
    if (file) { V.files[k] = file; if (/^image\//.test(file.type)) V.urls[k] = URL.createObjectURL(file); } else delete V.files[k];
    V.touched[k] = 1; vaultRender(true);
  }
  function vaultRender(keepScroll) {
    var body = V.el.querySelector('[data-gv-body]'), ft = V.el.querySelector('[data-gv-ft]'), y = body.scrollTop, n = V.steps.length;
    V.el.querySelector('[data-gv=back]').disabled = !V.picking && (V.step === 0 || !!V.done);
    V.el.querySelector('.gv-role').style.display = V.done ? 'none' : '';
    V.el.querySelector('[data-gv-rail]').style.display = V.done || V.picking ? 'none' : '';
    V.el.querySelector('[data-gv=change]').textContent = V.picking ? 'Cancel' : 'Change';
    if (V.done) {
      body.innerHTML = '<div class="gv-done"><span class="gv-done-ic">' + ICON('check') + '</span><h3>Registration submitted</h3><p>Your ' + esc(V.role.name) + ' registration is in. Keep this reference; it is how the registration desk finds your application.</p><div class="gv-ref">' + esc(V.done) + '</div><div class="gv-prev-pass" data-gv-pass></div><p>What happens next: your details are verified, then your accreditation is issued. Updates go to ' + esc(V.F.email || 'your email') + '.</p></div>';
      ft.innerHTML = '<button type="button" class="gv-link" data-gv="again">Register another person</button><button type="button" class="gv-go" data-gv="finish">Done</button>';
    } else if (V.picking) {
      body.innerHTML = '<div class="gv-h"><h3>Register as</h3></div><p class="gv-note">What you have typed stays in place when you switch.</p><div class="gv-pick">' + D.REG.map(function (r) { return '<button type="button" class="gv-opt" data-gv="pick" data-v="' + r.id + '"' + (r.id === V.role.id ? ' data-on aria-pressed="true"' : '') + '><span class="gv-opt-ic">' + ICON(r.icon) + '</span><span><b>' + esc(r.name) + '</b><span>' + esc(r.desc) + '</span></span></button>'; }).join('') + '</div>';
      ft.innerHTML = '<small></small><span></span>';
    } else if (V.step >= n) {
      var h = '<div class="gv-h"><i>' + ('0' + (n + 1)).slice(-2) + '</i><h3>Preview Registration</h3></div><p class="gv-note">Check every detail. Use Edit to go back to a section.</p><div class="gv-prev-pass" data-gv-pass></div>';
      V.steps.forEach(function (s, i) {
        h += '<section class="gv-sec"><div class="gv-sec-h"><b>' + esc(s.n) + '</b><button type="button" class="gv-link" data-gv="step" data-v="' + i + '">Edit</button></div><dl class="gv-dl">';
        s.f.forEach(function (f) {
          if (f.when && !V.F[f.when]) return;
          var val = f.t === 'photo' ? (V.files.photo ? V.files.photo.name : '') : f.t === 'file' ? (V.files[f.k] ? V.files[f.k].name + ' (' + fmtSize(V.files[f.k].size) + ')' : '') : (f.prefix && V.F[f.k] ? f.prefix + ' ' : '') + (V.F[f.k] || '');
          if (f.t === 'date' && val) { var p = val.split('-'); val = p[2] + '/' + p[1] + '/' + p[0]; }
          h += '<div><dt>' + esc(f.label.replace(' (Optional)', '')) + '</dt><dd' + (val ? '' : ' data-empty') + '>' + esc(val || 'Not provided') + '</dd></div>';
        });
        h += '</dl></section>';
      });
      body.innerHTML = h;
      ft.innerHTML = '<small>Step ' + (n + 1) + ' of ' + (n + 1) + '</small><button type="button" class="gv-go" data-gv="submit">Submit Registration' + ICON('arrow_forward') + '</button>';
    } else {
      var s = V.steps[V.step];
      body.innerHTML = '<div class="gv-h"><i>' + ('0' + (V.step + 1)).slice(-2) + '</i><h3>' + esc(s.n) + '</h3></div><p class="gv-left" data-gv-left aria-live="polite"></p>' + (s.note ? '<p class="gv-note">' + esc(s.note) + '</p>' : '') + '<div class="gv-grid">' + s.f.map(fieldHTML).join('') + '</div>';
      ft.innerHTML = '<small>Step ' + (V.step + 1) + ' of ' + (n + 1) + '</small><button type="button" class="gv-go" data-gv="next">' + (V.step === n - 1 ? 'Preview Registration' : 'Continue') + ICON('arrow_forward') + '</button>';
      s.f.forEach(function (f) { if (V.touched[f.k] || (V.F[f.k] && !f.def)) vaultMark(f.k); });
    }
    vaultRail(); vaultPass();
    body.scrollTop = keepScroll ? y : 0;
  }
  function vaultGo(i) { if (i > V.max) return; V.step = i; V.picking = false; vaultRender(); vaultSave(); V.focus(); }
  function vaultNext() {
    var s = V.steps[V.step], first = null;
    s.f.forEach(function (f) { if (f.when && !V.F[f.when]) return; V.touched[f.k] = 1; if (vaultMark(f.k, true) && !first) first = f.k; });
    if (first) {
      var w = V.el.querySelector('.gv-f[data-f="' + first + '"]'), t = w && w.querySelector('input:not([type=file]),select,textarea,button');
      if (w) w.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' }); if (t) t.focus({ preventScroll: true });
      var left = stepLeft(V.step); toast(left + ' required field' + (left > 1 ? 's' : '') + ' still to fill'); return;
    }
    V.step++; V.max = Math.max(V.max, V.step); vaultRender(); vaultSave(); V.focus();
  }
  function vaultSubmit() {
    for (var i = 0; i < V.steps.length; i++) if (stepLeft(i)) { V.step = i; vaultRender(); vaultNext(); return; }
    var id = A.register ? A.register(V.F.name, V.F.email, V.role.name) : 'GMS-26-0000';
    V.done = id; try { localStorage.removeItem('gms-reg-draft'); } catch (e) {}
    vaultRender(); V.el.querySelector('[data-gv=finish]').focus({ preventScroll: true });
  }
  function openVault(roleId) {
    if (!A) return;
    var L = vaultLayer(), d = LS.get('gms-reg-draft', null), fresh = !L.role || L.done;
    if (stack.indexOf(L) >= 0) { vaultSetRole(roleId); vaultRender(); return; }
    if (fresh) { L.role = roleOf(roleId); L.F = {}; L.files = {}; L.urls = {}; L.touched = {}; L.step = 0; L.max = 0; L.done = null; }
    var restored = false;
    if (fresh && d && d.F && typeof d.F === 'object' && Date.now() - (d.at || 0) < 14 * 864e5) {
      Object.keys(d.F).forEach(function (k) { if (typeof d.F[k] === 'string') L.F[k] = d.F[k].slice(0, 400); });
      restored = Object.keys(L.F).length > 0;
    }
    L.picking = false; vaultSetRole(roleId || (d && d.role));
    if (restored) { L.max = 0; for (var i = 0; i < L.steps.length && !stepLeft(i); i++) L.max = i + 1; L.max = Math.min(L.max, typeof d.max === 'number' ? d.max : 0, L.files.photo ? 9 : 0); L.step = Math.min(L.max, typeof d.step === 'number' ? d.step : 0); }
    vaultRender(); openLayer(L);
    if (restored) setTimeout(function () { toast('Your draft is back. Add the photo again.', { icon: 'check', action: 'Start over', onAction: function () { try { localStorage.removeItem('gms-reg-draft'); } catch (e) {} vaultReset(); vaultRender(); } }); }, 700);
  }
  Plus.vault = openVault;
  // the page re-renders its schedule rows (day switch, row open): keep stars and the theme icon in step
  var moT = 0, mo = new MutationObserver(function () { if (moT) return; moT = requestAnimationFrame(function () { moT = 0; My.sync(); Theme.sync(); }); });

  function start() {
    if (A) return; A = window.GMSApp; if (!A) return; D = A.data;
    if (D.TOURNAMENT && D.TOURNAMENT.teams) { NATIONS = D.TOURNAMENT.teams; NCODES = Object.keys(NATIONS); }
    var host = $('x-dc') || doc.body;
    mo.observe(host, { childList: true, subtree: true });
    My.sync(); Theme.sync();
    var go = function () { railInit(); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 400);
    // a shared plan (#my=...) or a deep link (#medals, #results, #mygames)
    var h = location.hash;
    if (/^#my=/.test(h)) { var ks = decodeURIComponent(h.slice(4)).split(',').map(function (k) { var x = sessFromKey(k); return x && x.key; }).filter(Boolean); try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) {} if (ks.length) setTimeout(function () { Plus.open('mygames', { shared: ks }); }, 900); }
    else if (/^#(medals|results|mygames|venues)$/.test(h)) setTimeout(function () { Plus.open(h.slice(1)); }, 900);
    else if (/^#results=/.test(h)) { var ec = evBy(decodeURIComponent(h.slice(9))); setTimeout(function () { Plus.open('results', ec ? { event: ec.code } : null); }, 900); }
    else if (/^#venues=/.test(h)) { var vn = decodeURIComponent(h.slice(8)), vv = D.TOURNAMENT.venues.find(function (x) { return x.name === vn; }); setTimeout(function () { Plus.open('venues', vv ? { venue: vv.name } : null); }, 900); }
    else if (/^#session=/.test(h)) { var ss = sessFromKey(decodeURIComponent(h.slice(9))); if (ss) setTimeout(function () { A.showSession(ss.day, ss.code); }, 900); }
  }
  Theme.sync();
  if (window.GMSApp) start(); else window.addEventListener('gms:ready', start);
})();
