"""Builds sports/<key>.html from one template. Run from the repo root: python3 sports.py badminton [tabletennis ...]"""
import re, sys, html, os

SRC = open("GMS v2.dc.html").read()

def cats():
    out = {}
    for m in re.finditer(r"\{name:'([^']+)',venue:'([^']+)',icon:'([^']+)',color:'[^']*',tint:'[^']*',outdoor:\w+,events:\[(.*?)\]\]\}", SRC):
        evs = re.findall(r"\['((?:[^'\\]|\\.)*)','(MEN|WOMEN|MIXED|OPEN)','([A-Z0-9]+)','((?:[^'\\]|\\.)*)'\]", m.group(4) + "]")
        out[m.group(1)] = dict(venue=m.group(2), events=[(e[3].replace("\\'", "’"), e[1], e[2]) for e in evs])
    return out

def plan_key(k):
    i = SRC.find(f'data-vl-key="{k}"'); j = SRC.find("</ol>", i); seg = SRC[i:j]
    return re.findall(r'data-vl-item="(\d+)"><b>\d+</b><span><strong>([^<]+)</strong><small>([^<]+)</small>', seg)

def plan_pins(k):
    i = SRC.find(f'<figure data-vl-plan="{k}"'); j = SRC.find("</figure>", i)
    return re.findall(r'data-vl-pin="(\d+)" style="left:([\d.]+)%;top:([\d.]+)%"', SRC[i:j])

SPORTS = {
 "badminton": dict(
   name="Badminton", sport="Badminton", photo="badminton", kicker="Featured sport", plan="badminton",
   plan_label="Badminton hall, Block C first floor", pdf="2.0 MB",
   lead="Eighteen courts under one roof on the first floor of Block C. Singles, doubles and mixed doubles, played to 21 by police shuttlers from every unit in the country.",
   facts=[("18", "courts"), ("5", "medal events"), ("21", "points a game"), ("19–24", "Nov 2026")],
   big="21", big_label="points to win a game",
   rules=[("Rally-point scoring", "Every rally scores a point, whoever served."),
          ("Win by two", "A game goes to 21, but must be won by two clear points. At 29–29 the next point wins it, 30 caps the game."),
          ("Best of three games", "The first player or pair to take two games wins the match."),
          ("Intervals", "A 60-second break when the leader reaches 11, and up to two minutes between games. Ends change after each game, and at 11 in a deciding game."),
          ("Knockout draw", "Rounds of 16, quarter-finals, semi-finals and a final for every event.")],
   arrive=[("Athletes", "Two athletes’ entries at the far end of the hall, straight from the team locker rooms and hydration area."),
           ("VIP and VVIP guests", "VIP entries either side of the stage end; the VVIP route comes onto the floor beside the stage."),
           ("Spectators", "Enter from the plaza on the first floor of Block C. Lunch and refreshment areas run along both long sides.")],
   next_="tabletennis"),
}

VENUE_PHOTO={"Table Tennis Hall":"tabletennis","Aquatic Stadium":"aquatics","Outdoor Sports Ground":"ground","Community Sports Centre":"community","Tennis Courts":"tennis","Badminton Hall":"badminton"}
TRAVEL=[('Badminton Hall','Table Tennis Hall',4),('Badminton Hall','Tennis Courts',6),('Badminton Hall','Community Sports Centre',5),('Table Tennis Hall','Aquatic Stadium',5),('Table Tennis Hall','Outdoor Sports Ground',7),('Aquatic Stadium','Community Sports Centre',6),('Aquatic Stadium','Outdoor Sports Ground',5),('Tennis Courts','Community Sports Centre',4)]
GEN_ARRIVE=lambda v:[("Athletes","Enter through the athletes’ entrance of the "+v+" with your accreditation card; warm-up and call room are signposted from the door."),("Officials and guests","Technical officials and VIP guests use the officials’ entrance; volunteers at the door direct you to your seats."),("Spectators","Follow the signs from the main plaza of the complex. Seating is first come, first served for every session.")]
SPORTS.update({
 "tabletennis": dict(name="Table Tennis", sport="Table Tennis", photo="tabletennis", kicker="Featured sport", plan="tabletennis", plan_label="Table tennis hall, Block C ground floor", pdf="",
   lead="Twelve tables on the ground floor of Block C. Singles, mixed doubles and team events, played to 11 at the speed of a rally.",
   facts=[("12","tables"),("5","medal events"),("11","points a game"),("19–24","Nov 2026")], big="11", big_label="points to win a game",
   rules=[("Games to 11","A game goes to 11 points and must be won by two clear points."),("Best of five games","The first player or pair to take three games wins the match."),("Service","Service passes every two points, and every point once the game reaches 10–10."),("Team events","Players from the same unit meet another unit in a series of singles and doubles matches."),("Knockout draw","Rounds of 16, quarter-finals, semi-finals and a final for every event.")],
   arrive=[("Athletes","The athletes’ entrance on the side of Block C leads past the registration desk to the team and players’ rooms."),("VIP and media","The VIP and media entrance is on the far side of the hall, with its own reception and waiting area."),("Spectators","Enter from the plaza through the VIP/athletes’ entry; the merchandise stalls sit along the passage.")], next_="athletics"),
 "athletics": dict(name="Athletics", sport="Athletics", photo="athletics", kicker="On the track", plan=None,
   lead="Sprints and the relay on the outdoor ground: the 100m for men and women, then the 4×400m to close the meet.",
   facts=[("3","medal events"),("100m","sprint finals"),("4×400m","relay"),("19–24","Nov 2026")], big="100", big_label="metres, start to finish",
   rules=[("Heats, then a final","Sprinters run heats; the fastest times go through to the final."),("One false start","A false start disqualifies the athlete who made it."),("Lanes","Each runner stays in their own lane for the 100m."),("Relay changeovers","The baton must change hands inside the takeover zone; drop it and the team must pick it up."),("Photo finish","Places are decided by the torso crossing the line, read from the finish camera.")],
   arrive=None, next_="swimming"),
 "swimming": dict(name="Swimming", sport="Swimming", photo="swimming", kicker="In the pool", plan=None,
   lead="Fifty metres of freestyle for men and women, and a medley relay, in the competition pool of the Aquatic Stadium.",
   facts=[("3","medal events"),("50m","freestyle sprints"),("Medley","relay"),("19–24","Nov 2026")], big="50", big_label="metres, one length",
   rules=[("Heats and a final","Swimmers race in heats; the fastest eight swim the final."),("Freestyle","Any stroke is allowed; most swimmers choose front crawl."),("Medley relay","Four swimmers race backstroke, breaststroke, butterfly and freestyle, in that order."),("Touch to finish","The race ends when the swimmer touches the wall pad; times are read to the hundredth."),("One start","A swimmer who leaves the block before the signal is disqualified.")],
   arrive=None, next_="basketball"),
 "basketball": dict(name="Basketball", sport="Basketball", photo="basketball", kicker="On the court", plan=None,
   lead="Men’s and women’s tournaments and a 3×3 mixed event on the courts of the Community Sports Centre.",
   facts=[("3","medal events"),("4×10","minute quarters"),("3×3","mixed event"),("19–24","Nov 2026")], big="40", big_label="minutes of play",
   rules=[("Four quarters","A game is four quarters of 10 minutes; the most points wins."),("Overtime","A tied game goes to five-minute periods until there is a winner."),("Shot clock","A team has 24 seconds to take a shot."),("3×3","Half court, one basket; first to 21 points or the leader after 10 minutes wins."),("Knockout rounds","Group games lead into semi-finals and the medal games.")],
   arrive=None, next_="volleyball"),
 "volleyball": dict(name="Volleyball", sport="Volleyball", photo="volleyball", kicker="At the net", plan=None,
   lead="Men’s and women’s indoor tournaments and a beach mixed event, played at the Community Sports Centre.",
   facts=[("3","medal events"),("25","points a set"),("Best of 5","sets"),("19–24","Nov 2026")], big="25", big_label="points to win a set",
   rules=[("Sets to 25","Sets go to 25 points, won by two; a fifth set goes to 15."),("Best of five sets","The first team to win three sets wins the match."),("Three touches","A team may touch the ball three times before it crosses the net."),("Beach mixed","Pairs of one man and one woman; sets to 21, best of three."),("Knockout rounds","Pool games lead into semi-finals and the medal matches.")],
   arrive=None, next_="tennis"),
 "tennis": dict(name="Tennis", sport="Tennis", photo="tennis", kicker="On the courts", plan=None,
   lead="Singles for men and women and a mixed doubles event on the outdoor Tennis Courts of the complex.",
   facts=[("3","medal events"),("6","games a set"),("Best of 3","sets"),("19–24","Nov 2026")], big="6", big_label="games to win a set",
   rules=[("Sets to six games","A set goes to six games, won by two; at 6–6 a tie-break decides it."),("Best of three sets","The first player or pair to win two sets wins the match."),("Scoring","Points run 15, 30, 40 and game; at 40–40 a player needs two clear points."),("Mixed doubles","One man and one woman per side, serving in turn."),("Knockout draw","Rounds of 16, quarter-finals, semi-finals and a final for every event.")],
   arrive=None, next_="football"),
 "football": dict(name="Football", sport="Football", photo="football", kicker="On the pitch", plan=None,
   lead="Men’s and women’s tournaments and a five-a-side event on the Outdoor Sports Ground.",
   facts=[("3","medal events"),("2×45","minute halves"),("5-a-side","event"),("19–24","Nov 2026")], big="90", big_label="minutes of play",
   rules=[("Two halves","A match is two halves of 45 minutes; the team with more goals wins."),("Knockout ties","A drawn knockout match goes to a penalty shoot-out."),("Five-a-side","Smaller pitch, five players a side including the goalkeeper, rolling substitutions."),("Cards","Two yellow cards in a match mean a red; a red card rules the player out of the next match."),("Groups, then knockouts","Group games lead into semi-finals and the medal matches.")],
   arrive=None, next_="badminton"),
})
NAMES = {"badminton": "Badminton", "tabletennis": "Table Tennis", "athletics": "Athletics", "swimming": "Swimming",
         "basketball": "Basketball", "volleyball": "Volleyball", "tennis": "Tennis", "football": "Football"}
CAT_LABEL = {"MEN": "Men", "WOMEN": "Women", "MIXED": "Mixed", "OPEN": "Open"}
MAPS = "https://www.google.com/maps/search/?api=1&query=Veer+Savarkar+Sports+Complex+Naranpura+Ahmedabad"

CSS = r"""
@font-face{font-family:'Instrument Serif';src:url(../assets/fonts/instrument-serif-latin.woff2) format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'Instrument Serif';src:url(../assets/fonts/instrument-serif-italic-latin.woff2) format('woff2');font-weight:400;font-style:italic;font-display:swap}
@font-face{font-family:'Archivo Expanded';src:url(../assets/fonts/archivo-expanded-latin.woff2) format('woff2');font-weight:100 900;font-display:swap}
@font-face{font-family:'Inter';src:url(../assets/fonts/inter-latin.woff2) format('woff2');font-weight:100 900;font-display:swap}
@font-face{font-family:'JetBrains Mono';src:url(../assets/fonts/jetbrains-mono-latin.woff2) format('woff2');font-weight:100 900;font-display:swap}
:root{--navy:#0B0B0C;--deep:#070708;--navy-2:#141416;--ivory:#F2F1EC;--paper-2:#E7E5DE;--acc:#4F33FF;--acc-on:#FFFFFF;--gold:var(--acc);--gold-d:var(--acc);--steel:var(--acc);--ink2:#55555C;
--ease:cubic-bezier(.16,1,.3,1);--wrap:1240px;--gut:clamp(20px,5vw,64px);--h2:400 clamp(44px,5.4vw,86px)/.96 'Instrument Serif',Georgia,serif;--kick:500 11.5px/1.4 'JetBrains Mono',ui-monospace,monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--ivory);color:var(--navy);font:16px/1.55 'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit}
.wrap{max-width:var(--wrap);margin:0 auto;padding:0 var(--gut)}
.kick{font:var(--kick);letter-spacing:.14em;text-transform:uppercase;display:inline-flex;align-items:center;gap:12px;color:var(--acc)}
.kick::after{content:"";width:40px;height:1px;background:currentColor;opacity:.5}
.dark .kick{color:var(--acc)}
h2{font:var(--h2);letter-spacing:-.018em;margin:14px 0 0}
.hero,.dark,.deep,.top,footer{--acc:#C8FF3D;--acc-on:#0B0B0C}
h2 em{font-style:italic}h2 em{font-style:normal;color:var(--acc)}.dark h2 em{color:var(--acc)}
.top{position:fixed;inset:14px var(--gut) auto;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 8px 16px;border-radius:999px;background:rgba(11,11,12,.72);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);border:1px solid rgba(244,239,230,.1);color:var(--ivory);max-width:var(--wrap);margin:0 auto}
.top-l{display:flex;align-items:center;gap:14px;text-decoration:none}.top-l img{height:28px;width:auto}.top-l b{font:800 15px 'Archivo Expanded';letter-spacing:-.02em}
.top-r{display:flex;gap:8px;align-items:center}
.btn{display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 20px;border-radius:999px;font:600 14px 'Inter';text-decoration:none;transition:background .4s var(--ease),color .4s,border-color .4s,transform .4s var(--ease);white-space:nowrap}
.btn-g{background:#F2F1EC;color:#0B0B0C}.btn-g::after{content:'';width:6px;height:6px;border-radius:50%;background:#0B0B0C;transition:background .35s,transform .35s}.btn-g:hover{background:#fff}.btn-g:hover::after{background:#C8FF3D;transform:scale(1.6)}
.btn-o{border:1px solid rgba(244,239,230,.28);color:var(--ivory)}.btn-o:hover{border-color:var(--acc);color:var(--acc)}
.btn-n{background:#0B0B0C;color:#F2F1EC}.btn-n:hover{background:var(--acc);color:var(--acc-on)}
.btn.sm{height:38px;padding:0 16px;font-size:13px}
.back{font-size:13px;color:rgba(244,239,230,.75);text-decoration:none;padding:0 10px}.back:hover{color:var(--acc)}
.hero{position:relative;min-height:100svh;display:flex;align-items:flex-end;color:var(--ivory);overflow:hidden;background:var(--deep)}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;scale:1.08;animation:kb 9s var(--ease) forwards}
@keyframes kb{to{scale:1}}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,7,8,.9) 0%,rgba(7,7,8,.5) 45%,rgba(7,7,8,.12) 100%),linear-gradient(0deg,rgba(7,7,8,.95) 0%,rgba(7,7,8,0) 55%)}
.hero .wrap{position:relative;z-index:1;width:100%;padding-bottom:clamp(28px,5vh,56px)}
.hero h1{font:400 clamp(72px,13vw,210px)/.86 'Instrument Serif',Georgia,serif;letter-spacing:-.025em;margin:18px 0 22px}
.hero p.lead{max-width:560px;font-size:clamp(16px,1.4vw,19px);color:rgba(244,239,230,.82);margin:0 0 28px}
.cta{display:flex;gap:10px;flex-wrap:wrap}
.facts{display:grid;grid-template-columns:repeat(4,1fr);margin-top:clamp(36px,7vh,72px);border-top:1px solid rgba(244,239,230,.16)}
.facts div{padding:18px 18px 0 0}.facts b{display:block;font:800 clamp(24px,2.6vw,38px)/1 'Archivo Expanded';letter-spacing:-.03em}.facts span{font:var(--kick);letter-spacing:.1em;text-transform:uppercase;color:rgba(244,239,230,.6)}
.facts div+div{padding-left:18px;border-left:1px solid rgba(244,239,230,.12)}
section.s{padding:clamp(80px,12vh,140px) 0}
.dark{background:#0B0B0C;color:var(--ivory);background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:72px 72px}.deep{background:var(--deep);color:var(--ivory)}
.head{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:end;margin-bottom:48px}.head p{margin:0;color:var(--ink2);max-width:440px}.dark .head p{color:rgba(244,239,230,.7)}
.ev{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.ev a{position:relative;display:flex;flex-direction:column;gap:20px;min-height:250px;padding:22px;border-radius:20px;background:#FBF8F2;border:1px solid rgba(15,27,45,.08);text-decoration:none;transition:transform .6s var(--ease),box-shadow .6s var(--ease),border-color .4s}
.ev a:hover{transform:translateY(-4px);box-shadow:0 24px 50px rgba(15,27,45,.12);border-color:var(--acc)}
.ev code{font:var(--kick);letter-spacing:.12em;color:var(--ink2)}.ev .pill{align-self:flex-start;font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;background:var(--paper-2)}
.ev h3{font:400 30px/1 'Instrument Serif',serif;letter-spacing:-.01em;margin:auto 0 0}
.ev .md{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--ink2)}.ev .md i{width:12px;height:12px;border-radius:50%}
.ev .go{font-weight:600;font-size:13.5px;color:var(--acc)}
.fmt{display:grid;grid-template-columns:.8fr 1.2fr;gap:clamp(32px,6vw,96px);align-items:start}
.big{font:400 clamp(140px,20vw,300px)/.8 'Instrument Serif',serif;letter-spacing:-.03em;color:var(--acc)}.big+p{font:var(--kick);letter-spacing:.12em;text-transform:uppercase;color:rgba(244,239,230,.6);margin:16px 0 0}
.rules{list-style:none;margin:0;padding:0}.rules li{display:grid;grid-template-columns:42px 1fr;gap:16px;padding:22px 0;border-top:1px solid rgba(244,239,230,.12)}
.rules li b{font:var(--kick);color:var(--acc);padding-top:4px}.rules h3{margin:0 0 6px;font:700 18px 'Inter'}.rules p{margin:0;color:rgba(244,239,230,.72)}
.medals{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:56px}
.medals div{padding:22px;border-radius:18px;background:rgba(244,239,230,.05);border:1px solid rgba(244,239,230,.1)}
.medals i{display:block;width:34px;height:34px;border-radius:50%;margin-bottom:16px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18)}
.medals b{display:block;font:800 20px 'Archivo Expanded'}.medals span{font-size:13.5px;color:rgba(244,239,230,.65)}
.mt{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:14px;padding:20px 22px;border-radius:18px;background:#C8FF3D;color:#0B0B0C}.mt p{margin:0;font-weight:600}
.plan{display:grid;grid-template-columns:1.45fr .55fr;gap:20px}
.vlz{position:relative;overflow:hidden;border-radius:18px;background:#fff;aspect-ratio:1400/989;cursor:grab;touch-action:pan-y;border:1px solid rgba(15,27,45,.08)}
.vlz[data-drag] .in{transition:none}.in{position:absolute;inset:0;transform-origin:0 0;transition:transform .55s var(--ease)}.in img{width:100%;height:100%;pointer-events:none;user-select:none}
.pin{all:unset;box-sizing:border-box;position:absolute;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;display:grid;place-items:center;background:#0B0B0C;color:#F2F1EC;font:700 11px/1 'JetBrains Mono';box-shadow:0 0 0 3px var(--acc),0 6px 16px rgba(15,27,45,.3);cursor:pointer;scale:calc(1/var(--z,1));transition:background .3s,color .3s}
.pin:hover,.pin[data-on]{background:var(--acc);color:var(--acc-on)}
.bar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 2px 0;font-size:12.5px;color:var(--ink2)}.ctl{display:flex;gap:6px}
.ctl button,.ctl a{all:unset;cursor:pointer;height:32px;min-width:32px;padding:0 10px;box-sizing:border-box;display:grid;place-items:center;border-radius:999px;border:1px solid rgba(15,27,45,.15);font-weight:600;font-size:12.5px}.ctl a{background:var(--navy);color:var(--ivory)}
.key{list-style:none;margin:0;padding:6px;border-radius:18px;background:#FBF8F2;border:1px solid rgba(15,27,45,.08);max-height:560px;overflow:auto}
.key button{all:unset;box-sizing:border-box;cursor:pointer;width:100%;display:grid;grid-template-columns:26px 1fr;gap:12px;padding:11px 12px;border-radius:12px}
.key button:hover{background:var(--paper-2)}.key button[data-on]{background:var(--navy);color:var(--ivory)}.key button[data-on] small{color:rgba(244,239,230,.7)}
.key b{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--acc);color:var(--acc-on);font:700 11px 'JetBrains Mono'}
.key strong{display:block;font-size:14.5px}.key small{font-size:13px;color:var(--ink2)}
.vph{display:grid;grid-template-columns:1.45fr .55fr;gap:20px}.vph figure{margin:0;border-radius:18px;overflow:hidden;position:relative;aspect-ratio:16/10}.vph img{width:100%;height:100%;object-fit:cover}
.vph figcaption{position:absolute;left:14px;bottom:14px;padding:7px 12px;border-radius:999px;background:rgba(11,11,12,.72);color:#F2F1EC;font:500 11px 'JetBrains Mono',monospace;letter-spacing:.08em}
.vph-k{padding:22px;border-radius:18px;background:#F7F6F2;border:1px solid rgba(11,11,12,.08)}.vph-k ul{list-style:none;margin:16px 0;padding:0}.vph-k li{display:flex;gap:14px;align-items:baseline;padding:12px 0;border-top:1px solid rgba(11,11,12,.1)}
.vph-k li b{font:400 30px/1 'Instrument Serif',serif;min-width:84px}.vph-k p{margin:0;font-size:13px;color:var(--ink2)}
@media (max-width:1000px){.vph{grid-template-columns:1fr}}
.arrive{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
.arrive div{--acc:#C8FF3D;padding:22px;border-radius:18px;background:#0B0B0C;color:#F2F1EC}.arrive h3{margin:0 0 8px;font:700 16px 'Inter';color:var(--acc)}.arrive p{margin:0;font-size:14.5px;color:rgba(244,239,230,.75)}
.addr{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin-top:14px;padding:22px;border-radius:18px;border:1px solid rgba(15,27,45,.12)}
.addr b{display:block;font:800 18px 'Archivo Expanded';letter-spacing:-.02em}.addr span{color:var(--ink2);font-size:14px}
.next{display:flex;justify-content:space-between;align-items:center;gap:20px;text-decoration:none;padding:clamp(48px,8vh,88px) 0}
.next span{font:var(--kick);letter-spacing:.14em;text-transform:uppercase;color:var(--acc)}.next b{display:block;font:400 clamp(56px,9vw,150px)/.9 'Instrument Serif',serif;letter-spacing:-.02em;transition:color .5s}
.next:hover b{color:var(--acc)}.next i{font-style:normal;font-size:clamp(40px,6vw,90px);transition:transform .6s var(--ease)}.next:hover i{transform:translateX(12px)}
footer{border-top:1px solid rgba(244,239,230,.1);padding:28px 0;font-size:13px;color:rgba(244,239,230,.55)}footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
.rv{opacity:0;translate:0 28px;transition:opacity 1.1s var(--ease),translate 1.1s var(--ease)}.rv.in-v{opacity:1;translate:0 0}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;translate:none}.hero>img{animation:none;scale:1}}
@media (max-width:1000px){.ev{grid-template-columns:repeat(2,1fr)}.plan,.fmt,.head{grid-template-columns:1fr}.key{max-height:none}}
@media (max-width:640px){.top{inset:10px 12px auto}.top .back{display:none}.facts{grid-template-columns:repeat(2,1fr)}.facts div:nth-child(3){padding-left:0;border-left:0}.ev{grid-template-columns:1fr}.ev a{min-height:0}.medals,.arrive{grid-template-columns:1fr}.mt{flex-direction:column;align-items:flex-start}.pin{width:22px;height:22px;margin:-11px 0 0 -11px;font-size:10px}.bar{flex-direction:column;align-items:flex-start}}
"""

JS = r"""
(function(){var R=matchMedia('(prefers-reduced-motion: reduce)').matches;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-v');io.unobserve(e.target);}});},{threshold:.15});
document.querySelectorAll('.rv').forEach(function(el){R?el.classList.add('in-v'):io.observe(el);});
var v=document.querySelector('[data-vlz]');if(!v)return;var inner=v.firstElementChild,st={z:1,x:0,y:0};
function ap(no){var w=v.clientWidth,h=v.clientHeight;st.z=Math.max(1,Math.min(5,st.z));st.x=Math.min(0,Math.max(w-w*st.z,st.x));st.y=Math.min(0,Math.max(h-h*st.z,st.y));if(no)v.setAttribute('data-drag','');inner.style.transform='translate('+st.x+'px,'+st.y+'px) scale('+st.z+')';inner.style.setProperty('--z',st.z);v.style.touchAction=st.z>1.01?'none':'pan-y';var im=inner.querySelector('img[data-hi]');if(st.z>1.3&&im){var hi=im.getAttribute('data-hi');im.removeAttribute('data-hi');var p=new Image();p.onload=function(){im.src=hi;};p.src=hi;}}
function zat(f,cx,cy,no){var nz=Math.max(1,Math.min(5,st.z*f)),k=nz/st.z;st.x=cx-(cx-st.x)*k;st.y=cy-(cy-st.y)*k;st.z=nz;ap(no);}
function sel(n,zoom){document.querySelectorAll('[data-pin],[data-item]').forEach(function(x){x.toggleAttribute('data-on',(x.getAttribute('data-pin')||x.getAttribute('data-item'))===n);});var p=inner.querySelector('[data-pin="'+n+'"]');if(zoom&&p){var w=v.clientWidth,h=v.clientHeight;st.z=2.4;st.x=w/2-parseFloat(p.style.left)/100*w*2.4;st.y=h/2-parseFloat(p.style.top)/100*h*2.4;ap();}}
document.addEventListener('click',function(e){var a=e.target.closest('[data-act]');if(a){var w=v.clientWidth,h=v.clientHeight,t=a.getAttribute('data-act');if(t==='fit'){st={z:1,x:0,y:0};ap();}else zat(t==='in'?1.6:1/1.6,w/2,h/2);return;}
var p=e.target.closest('[data-pin]');if(p){sel(p.getAttribute('data-pin'));var b=document.querySelector('[data-item="'+p.getAttribute('data-pin')+'"]');if(b)b.scrollIntoView({block:'nearest',behavior:R?'auto':'smooth'});return;}
var it=e.target.closest('[data-item]');if(it){sel(it.getAttribute('data-item'),true);}});
v.addEventListener('dblclick',function(e){var r=v.getBoundingClientRect();zat(1.8,e.clientX-r.left,e.clientY-r.top);});
v.addEventListener('wheel',function(e){if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();var r=v.getBoundingClientRect();zat(Math.exp(-e.deltaY*.01),e.clientX-r.left,e.clientY-r.top,true);clearTimeout(v.t);v.t=setTimeout(function(){v.removeAttribute('data-drag');},120);},{passive:false});
var pts={},last=null;function mid(){var k=Object.keys(pts),a=pts[k[0]],b=pts[k[1]]||a;return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)};}
v.addEventListener('pointerdown',function(e){if(e.target.closest('.pin'))return;pts[e.pointerId]={x:e.clientX,y:e.clientY};last=mid();if(e.pointerType==='mouse'||st.z>1.01||Object.keys(pts).length>1){try{v.setPointerCapture(e.pointerId);}catch(_){}}});
v.addEventListener('pointermove',function(e){if(!pts[e.pointerId])return;var n=Object.keys(pts).length;if(e.pointerType!=='mouse'&&n<2&&st.z<=1.01)return;pts[e.pointerId]={x:e.clientX,y:e.clientY};var m=mid(),r=v.getBoundingClientRect();if(n>1&&last.d>0)zat(m.d/last.d,m.x-r.left,m.y-r.top,true);st.x+=m.x-last.x;st.y+=m.y-last.y;ap(true);last=m;});
function up(e){delete pts[e.pointerId];if(!Object.keys(pts).length)v.removeAttribute('data-drag');else last=mid();}
v.addEventListener('pointerup',up);v.addEventListener('pointercancel',up);addEventListener('resize',function(){ap(true);});})();
"""

def page(key):
    d = SPORTS[key]; c = cats()[d["sport"]]; e = html.escape
    evs = "".join(
        f'<a class="rv" style="transition-delay:{i*90}ms" href="../index.html#register"><code>{code}</code><span class="pill">{CAT_LABEL[cat]}</span>'
        f'<h3>{e(title)}</h3><span class="md"><i style="background:#D4A63A"></i><i style="background:#B9BEC7"></i><i style="background:#B07A4A"></i>Gold, silver, bronze</span><span class="go">Register for this event →</span></a>'
        for i, (title, cat, code) in enumerate(c["events"]))
    rules = "".join(f'<li class="rv"><b>{i+1:02d}</b><div><h3>{e(t)}</h3><p>{e(p)}</p></div></li>' for i, (t, p) in enumerate(d["rules"]))
    facts = "".join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in d["facts"])
    plan = ""
    if d.get("plan"):
        pins = "".join(f'<button type="button" class="pin" data-pin="{n}" style="left:{x}%;top:{y}%" aria-label="Point {n}">{n}</button>' for n, x, y in plan_pins(d["plan"]))
        keyl = "".join(f'<li><button type="button" data-item="{n}"><b>{n}</b><span><strong>{t}</strong><small>{s}</small></span></button></li>' for n, t, s in plan_key(d["plan"]))
        plan = (f'<div class="plan rv"><figure style="margin:0"><div class="vlz" data-vlz tabindex="0" aria-label="{d["plan_label"]}. Pinch or Ctrl+scroll to zoom, drag to move.">'
                f'<div class="in"><img src="../assets/plans/{d["plan"]}-sm.webp" data-hi="../assets/plans/{d["plan"]}.webp" alt="{d["plan_label"]}" width="1400" height="989">{pins}</div></div>'
                f'<figcaption class="bar"><span>{d["plan_label"]} · from the organising team</span><span class="ctl"><button type="button" data-act="out" aria-label="Zoom out">−</button><button type="button" data-act="in" aria-label="Zoom in">+</button><button type="button" data-act="fit">Fit</button><a href="../assets/plans/{d["plan"]}.pdf" download>Download PDF</a></span></figcaption></figure>'
                f'<ol class="key">{keyl}</ol></div>')
    if not d.get("plan"):
        v = c["venue"]; ph = VENUE_PHOTO.get(v, "ground")
        near = sorted([(m, b if a_ == v else a_) for a_, b, m in TRAVEL if v in (a_, b)])
        nl = "".join(f'<li><b>{m} min</b><span>to the {e(o)}</span></li>' for m, o in near)
        plan = (f'<div class="vph rv"><figure><img src="../assets/venues/{ph}.webp" alt="{e(v)}" loading="lazy"><figcaption>{e(v)} · Veer Savarkar Sports Complex</figcaption></figure>'
                f'<div class="vph-k"><span class="kick">On foot from here</span><ul>{nl}</ul><p>Walking times inside the complex, from the organising team’s venue guide.</p></div></div>')
    arr = d["arrive"] or GEN_ARRIVE(c["venue"])
    arrive = "".join(f'<div class="rv"><h3>{e(t)}</h3><p>{e(p)}</p></div>' for t, p in arr)
    nx = d["next_"]
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{d['name']} · All India Police Tournament 2026 · Veer Savarkar Sports Complex</title>
<meta name="description" content="{e(d['lead'])}">
<meta name="theme-color" content="#0B0B0C"><link rel="icon" href="../assets/apple-touch-icon.png">
<link rel="preload" as="image" href="../assets/sports/{d['photo']}.webp">
<style>{CSS}</style></head><body>
<header class="top"><a class="top-l" href="../index.html"><img src="../assets/brand/gobananas-mark.webp" alt="Gobananas" width="520" height="238"><b>GMS</b></a>
<nav class="top-r"><a class="back" href="../index.html#sports">← All sports</a><a class="btn btn-g sm" href="../index.html#register">Register</a></nav></header>
<main>
<section class="hero"><img src="../assets/sports/{d['photo']}.webp" alt="" fetchpriority="high"><div class="wrap">
<span class="kick">{d['kicker']} · {c['venue']}</span><h1>{d['name']}</h1><p class="lead">{e(d['lead'])}</p>
<div class="cta"><a class="btn btn-g" href="../index.html#register">Register to compete →</a><a class="btn btn-o" href="#venue">{"See the hall plan" if d.get("plan") else "Find the venue"}</a></div>
<div class="facts">{facts}</div></div></section>
<section class="s"><div class="wrap"><div class="head"><div><span class="kick">01 · Medal events</span><h2>{len(c['events'])} events, <em>one</em> venue</h2></div>
<p>Every event is open to accredited police athletes from each unit. Pick an event to start your registration.</p></div><div class="ev">{evs}</div></div></section>
<section class="s dark"><div class="wrap"><div class="fmt"><div class="rv"><span class="kick">02 · Format &amp; rules</span><h2>How a match is <em>won</em></h2><div class="big" style="margin-top:40px">{d['big']}</div><p>{d['big_label']}</p></div>
<ol class="rules">{rules}</ol></div>
<div class="medals"><div class="rv"><i style="background:#D4A63A"></i><b>Gold</b><span>Winner of the final</span></div><div class="rv" style="transition-delay:90ms"><i style="background:#B9BEC7"></i><b>Silver</b><span>Runner-up in the final</span></div><div class="rv" style="transition-delay:180ms"><i style="background:#B07A4A"></i><b>Bronze</b><span>Awarded from the semi-finals</span></div></div>
<div class="mt rv"><p>The live medal table opens with the first {d['name'].lower()} final on 24 November.</p><a class="btn btn-n sm" href="../index.html#medals">Open the medal table</a></div></div></section>
<section class="s" id="venue"><div class="wrap"><div class="head"><div><span class="kick">03 · The venue</span><h2>{('Inside the <em>'+c['venue'].split()[0].lower()+'</em> hall') if d.get('plan') else ('Find the <em>'+c['venue'].lower()+'</em>')}</h2></div>
<p>{'The real layout from the organising team. Tap a number to zoom to it, pinch or Ctrl+scroll to zoom, and drag to look around.' if d.get('plan') else 'Where the '+e(d['name'].lower())+' is played inside the complex, and how far it is from the other venues.'}</p></div>{plan}
<div class="arrive">{arrive}</div>
<div class="addr rv"><div><b>Veer Savarkar Sports Complex</b><span>Naranpura, Ahmedabad, Gujarat · Accreditation card required at every entry</span></div><a class="btn btn-n" href="{MAPS}" target="_blank" rel="noopener">Directions in Google Maps ↗</a></div></div></section>
<section class="deep"><div class="wrap"><a class="next" href="{nx}.html"><span style="display:block">Next sport<b>{NAMES[nx]}</b></span><i>→</i></a></div>
<footer><div class="wrap"><span>All India Police Tournament 2026 · Badminton &amp; Table Tennis Cluster · 19–24 Nov 2026</span><a href="../index.html">Back to the Games</a></div></footer></section>
</main><script>{JS}</script></body></html>"""

os.makedirs("sports", exist_ok=True)
for k in sys.argv[1:]:
    open(f"sports/{k}.html", "w").write(page(k)); print("sports/" + k + ".html", len(cats()[SPORTS[k]['sport']]['events']), "events")
