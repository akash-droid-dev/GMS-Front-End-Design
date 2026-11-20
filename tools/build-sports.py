"""Builds sports/<key>.html from one template. Run from the repo root: python3 sports.py badminton [tabletennis ...]"""
import json, re, sys, html, os

SRC = open("GMS v2.dc.html").read()

def cats():
    out = {}
    for m in re.finditer(r"\{name:'([^']+)',venue:'([^']+)',icon:'([^']+)',color:'[^']*',tint:'[^']*',outdoor:\w+,events:\[(.*?)\]\]\}", SRC):
        evs = re.findall(r"\['((?:[^'\\]|\\.)*)','(MEN|WOMEN|MIXED|OPEN)','([A-Z0-9]+)','((?:[^'\\]|\\.)*)'\]", m.group(4) + "]")
        out[m.group(1)] = dict(venue=m.group(2), events=[(e[3].replace("\\'", "’"), e[1], e[2]) for e in evs])
    return out

DAYS=[("Thu","19 Nov","2026-11-19"),("Fri","20 Nov","2026-11-20"),("Sat","21 Nov","2026-11-21"),("Sun","22 Nov","2026-11-22"),("Mon","23 Nov","2026-11-23"),("Tue","24 Nov","2026-11-24")]
def sessions():
    i = SRC.find("sessions:["); j = SRC.find("]]]", i)
    block = SRC[i:j+3]; days = re.findall(r"\[(\['[^\]]*'\](?:,\['[^\]]*'\])*)\]", block)
    return [re.findall(r"\['([\d:]+)','([A-Z0-9]+)','([^']+)'\]", d) for d in days]

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
          ("Knockout draw", "Knockout from the first round to the final, for every event.")],
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
   rules=[("Games to 11","A game goes to 11 points and must be won by two clear points."),("Best of five games","The first player or pair to take three games wins the match."),("Service","Service passes every two points, and every point once the game reaches 10–10."),("Team events","Players from the same unit meet another unit in a series of singles and doubles matches."),("Knockout draw","Knockout from the first round to the final, for every event.")],
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
   rules=[("Sets to six games","A set goes to six games, won by two; at 6–6 a tie-break decides it."),("Best of three sets","The first player or pair to win two sets wins the match."),("Scoring","Points run 15, 30, 40 and game; at 40–40 a player needs two clear points."),("Mixed doubles","One man and one woman per side, serving in turn."),("Knockout draw","Knockout from the first round to the final, for every event.")],
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

ECG = "\n".join(l for l in SRC.split("\n") if l.startswith((".ecg",".ecg-")) and "ecx" not in l)
CSS = r"""
.btabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}
.bt-t{all:unset;cursor:pointer;padding:9px 16px;border-radius:999px;border:1px solid rgba(11,11,12,.18);font:500 14px/1 Inter,system-ui,sans-serif}
.bt-t[aria-pressed="true"]{background:#0B0B0C;color:#F2F1EC;border-color:#0B0B0C}
.br{display:flex;gap:18px;overflow-x:auto;padding-bottom:12px;scroll-snap-type:x proximity;overscroll-behavior-x:contain}
.bc{flex:0 0 230px;scroll-snap-align:start;display:flex;flex-direction:column}
.bc h4{margin:0 0 12px;font:500 11px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;opacity:.55}
.bs{flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:12px}
.bm{border:1px solid rgba(11,11,12,.14);border-radius:12px;overflow:hidden;background:#fff}
.bm span{display:flex;align-items:center;gap:10px;padding:11px 12px;font-size:13.5px;color:rgba(11,11,12,.45)}
.bm span+span{border-top:1px solid rgba(11,11,12,.08)}
.bm i{width:6px;height:6px;border-radius:50%;border:1px solid rgba(11,11,12,.3)}
.bsum{border:1px dashed rgba(11,11,12,.2);border-radius:12px;padding:18px 14px;display:flex;flex-direction:column;gap:6px}
.bsum b{font:400 40px/1 'Anton',serif}
.bsum span{font-size:13px;opacity:.6}
@media (max-width:640px){.bc{flex-basis:78vw}.btabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-inline:-20px;padding-inline:20px}.btabs::-webkit-scrollbar{display:none}.bt-t{flex:none}}

@font-face{font-family:'Anton';src:url(../assets/fonts/anton-latin.woff2) format('woff2');font-weight:100 900;font-style:normal;font-display:swap}
:root{--f-display:'Anton',Impact,'Arial Narrow',sans-serif}
:is(h1,h2,h3):not(.ly *){letter-spacing:.004em!important;text-transform:uppercase;line-height:.94!important;font-weight:400!important}
:is(h1,h2,h3) em{font-style:normal}
html{font-synthesis:none}

@font-face{font-family:'Inter';src:url(../assets/fonts/inter-latin.woff2) format('woff2');font-weight:100 900;font-display:swap}
@font-face{font-family:'JetBrains Mono';src:url(../assets/fonts/jetbrains-mono-latin.woff2) format('woff2');font-weight:100 900;font-display:swap}
:root{--navy:#0B0B0C;--deep:#070708;--navy-2:#141416;--ivory:#F2F1EC;--paper-2:#E7E5DE;--acc:#0B0B0C;--acc-on:#F2F1EC;--gold:var(--acc);--gold-d:var(--acc);--steel:var(--acc);--ink2:#55555C;
--ease:cubic-bezier(.16,1,.3,1);--wrap:1240px;--gut:clamp(20px,5vw,64px);--h2:400 clamp(44px,5.4vw,86px)/.96 'Anton',Georgia,serif;--kick:500 11.5px/1.4 'JetBrains Mono',ui-monospace,monospace}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--ivory);color:var(--navy);font:16px/1.55 'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit}
.wrap{max-width:var(--wrap);margin:0 auto;padding:0 var(--gut)}
.kick{font:var(--kick);letter-spacing:.14em;text-transform:uppercase;display:inline-flex;align-items:center;gap:12px;color:var(--acc)}
.kick::after{content:"";width:40px;height:1px;background:currentColor;opacity:.5}
.dark .kick{color:var(--acc)}
h2{font:var(--h2);letter-spacing:-.018em;margin:14px 0 0}
.hero,.dark,.deep,.top,footer{--acc:#F2F1EC;--acc-on:#0B0B0C}
h2 em{font-style:italic}h2 em{font-style:normal;color:var(--acc)}.dark h2 em{color:var(--acc)}
.top{position:fixed;inset:14px var(--gut) auto;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 8px 16px;border-radius:999px;background:rgba(0,0,0,.94);border:1px solid rgba(242,241,236,.1);backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3);border:1px solid rgba(244,239,230,.1);color:var(--ivory);max-width:var(--wrap);margin:0 auto}
.top-l{display:flex;align-items:center;gap:14px;text-decoration:none}.top-l img{height:28px;width:auto}.top-l b{font:800 15px 'Anton';letter-spacing:-.02em}
.top-r{display:flex;gap:8px;align-items:center}
.btn{display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 20px;border-radius:999px;font:600 14px 'Inter';text-decoration:none;transition:background .4s var(--ease),color .4s,border-color .4s,transform .4s var(--ease);white-space:nowrap}
.btn-g{background:#F2F1EC;color:#0B0B0C}.btn-g::after{content:'';width:6px;height:6px;border-radius:50%;background:#0B0B0C;transition:background .35s,transform .35s}.btn-g:hover{background:#fff}.btn-g:hover::after{transform:scale(1.8)}
.btn-o{border:1px solid rgba(244,239,230,.28);color:var(--ivory)}.btn-o:hover{border-color:var(--acc);color:var(--acc)}
.btn-n{background:#0B0B0C;color:#F2F1EC}.btn-n:hover{background:var(--acc);color:var(--acc-on)}
.btn.sm{height:38px;padding:0 16px;font-size:13px}
.back{font-size:13px;color:rgba(244,239,230,.75);text-decoration:none;padding:0 10px}.back:hover{color:var(--acc)}
.hero{position:relative;min-height:100svh;display:flex;align-items:flex-end;color:var(--ivory);overflow:hidden;background:var(--deep)}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;scale:1.08;animation:kb 9s var(--ease) forwards}
@keyframes kb{to{scale:1}}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,7,8,.9) 0%,rgba(7,7,8,.5) 45%,rgba(7,7,8,.12) 100%),linear-gradient(0deg,rgba(7,7,8,.95) 0%,rgba(7,7,8,0) 55%)}
.hero .wrap{position:relative;z-index:1;width:100%;padding-bottom:clamp(28px,5vh,56px)}
.hero h1{font:400 clamp(56px,13vw,210px)/.86 'Anton',Georgia,serif;letter-spacing:-.025em;margin:18px 0 22px;overflow-wrap:normal;word-break:keep-all;hyphens:none}
@media (max-width:640px){.hero h1{font-size:clamp(52px,17vw,96px)}}
.hero p.lead{max-width:560px;font-size:clamp(16px,1.4vw,19px);color:rgba(244,239,230,.82);margin:0 0 28px}
.cta{display:flex;gap:10px;flex-wrap:wrap}
.facts{display:grid;grid-template-columns:repeat(4,1fr);margin-top:clamp(36px,7vh,72px);border-top:1px solid rgba(244,239,230,.16)}
.facts div{padding:18px 18px 0 0}.facts b{display:block;font:800 clamp(24px,2.6vw,38px)/1 'Anton';letter-spacing:-.03em}.facts span{font:var(--kick);letter-spacing:.1em;text-transform:uppercase;color:rgba(244,239,230,.6)}
.facts div+div{padding-left:18px;border-left:1px solid rgba(244,239,230,.12)}
section.s{padding:clamp(80px,12vh,140px) 0}
.dark{background:#0B0B0C;color:var(--ivory);background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:72px 72px}.deep{background:var(--deep);color:var(--ivory)}
.head{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:end;margin-bottom:48px}.head p{margin:0;color:var(--ink2);max-width:440px}.dark .head p{color:rgba(244,239,230,.7)}
.ev{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.ev a{position:relative;display:flex;flex-direction:column;gap:20px;min-height:250px;padding:22px;border-radius:20px;background:#FBF8F2;border:1px solid rgba(15,27,45,.08);text-decoration:none;transition:transform .6s var(--ease),box-shadow .6s var(--ease),border-color .4s}
.ev a:hover{transform:translateY(-4px);box-shadow:0 24px 50px rgba(15,27,45,.12);border-color:var(--acc)}
.ev code{font:var(--kick);letter-spacing:.12em;color:var(--ink2)}.ev .pill{align-self:flex-start;font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;background:var(--paper-2)}
.ev h3{font:400 30px/1 'Anton',serif;letter-spacing:-.01em;margin:auto 0 0}
.ev .md{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--ink2)}.ev .md i{width:12px;height:12px;border-radius:50%}
.ev .go{font-weight:600;font-size:13.5px;color:var(--acc)}
.fmt{display:grid;grid-template-columns:.8fr 1.2fr;gap:clamp(32px,6vw,96px);align-items:start}
.big{font:400 clamp(140px,20vw,300px)/.8 'Anton',serif;letter-spacing:-.03em;color:var(--acc)}.big+p{font:var(--kick);letter-spacing:.12em;text-transform:uppercase;color:rgba(244,239,230,.6);margin:16px 0 0}
.rules{list-style:none;margin:0;padding:0}.rules li{display:grid;grid-template-columns:42px 1fr;gap:16px;padding:22px 0;border-top:1px solid rgba(244,239,230,.12)}
.rules li b{font:var(--kick);color:var(--acc);padding-top:4px}.rules h3{margin:0 0 6px;font:700 18px 'Inter'}.rules p{margin:0;color:rgba(244,239,230,.72)}
.medals{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:56px}
.medals div{padding:22px;border-radius:18px;background:rgba(244,239,230,.05);border:1px solid rgba(244,239,230,.1)}
.medals i{display:block;width:34px;height:34px;border-radius:50%;margin-bottom:16px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18)}
.medals b{display:block;font:800 20px 'Anton'}.medals span{font-size:13.5px;color:rgba(244,239,230,.65)}
.mt{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:14px;padding:20px 22px;border-radius:18px;background:var(--acc);color:var(--acc-on)}.mt p{margin:0;font-weight:600}
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
.vph-k li b{font:400 30px/1 'Anton',serif;min-width:84px}.vph-k p{margin:0;font-size:13px;color:var(--ink2)}
@media (max-width:1000px){.vph{grid-template-columns:1fr}}
.sub{position:fixed;left:50%;top:78px;z-index:19;display:flex;gap:4px;padding:5px;border-radius:999px;background:rgba(242,241,236,.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 0 0 1px rgba(11,11,12,.1),0 10px 30px rgba(0,0,0,.12);transform:translate(-50%,-14px);opacity:0;pointer-events:none;transition:opacity .45s var(--ease),transform .6s var(--ease);overflow:hidden}
.sub.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}.sub a{padding:8px 14px;border-radius:999px;font:600 13px 'Inter';text-decoration:none;color:#0B0B0C;transition:background .3s,color .3s}.sub a[aria-current]{background:#0B0B0C;color:#F2F1EC}
.sub .prog{position:absolute;left:0;bottom:0;height:2px;width:100%;background:#0B0B0C;transform-origin:0 50%;transform:scaleX(var(--p,0))}
.hx2{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:22px}
.cd{display:inline-flex;align-items:baseline;gap:12px;padding:10px 16px;border-radius:999px;border:1px solid rgba(242,241,236,.25)}.cd-k{font:var(--kick);letter-spacing:.12em;text-transform:uppercase;color:rgba(242,241,236,.6)}.cd-v{font:400 24px/1 'Anton',serif;font-variant-numeric:tabular-nums}
.fol{all:unset;cursor:pointer;padding:12px 18px;border-radius:999px;font:600 13px 'Inter';color:#F2F1EC;border:1px solid rgba(242,241,236,.25);transition:background .3s,color .3s}.fol[aria-pressed=true]{background:#F2F1EC;color:#0B0B0C}
[data-split] .ch{display:inline-block;transform:translateY(105%);opacity:0;animation:chIn 1.1s var(--ease) forwards;animation-delay:calc(var(--i) * 45ms + .15s)}[data-split]{overflow:hidden;padding-bottom:.06em}
@keyframes chIn{to{transform:none;opacity:1}}
.ev .nx{font:500 11.5px/1.4 'JetBrains Mono',monospace;letter-spacing:.06em;color:var(--ink2)}
.sch{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.sd{padding:22px;border-radius:20px;background:#F7F6F2;border:1px solid rgba(11,11,12,.08)}.sd h3{margin:0 0 10px;display:flex;align-items:baseline;gap:12px;font:400 28px/1 'Anton',serif}.sd h3 span{font:var(--kick);letter-spacing:.12em;text-transform:uppercase;color:var(--ink2)}
.sd ol{list-style:none;margin:0;padding:0}.sr{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid rgba(11,11,12,.09)}
.sr time{font:400 26px/1 'Anton',serif;font-variant-numeric:tabular-nums}.sr b{display:block;font-size:14.5px}.sr span{font-size:12.5px;color:var(--ink2)}
.sa{display:flex;gap:6px}.sa button{all:unset;cursor:pointer;height:32px;padding:0 11px;border-radius:999px;border:1px solid rgba(11,11,12,.16);font:600 12px 'Inter';display:grid;place-items:center;transition:background .3s,color .3s}.sa button:hover,.sa .rm[aria-pressed=true]{background:#0B0B0C;color:#F2F1EC}
.toast{position:fixed;left:50%;bottom:28px;z-index:30;transform:translate(-50%,20px);opacity:0;padding:12px 18px;border-radius:999px;background:#0B0B0C;color:#F2F1EC;font:600 13px 'Inter';transition:opacity .4s,transform .5s var(--ease);pointer-events:none}.toast.on{opacity:1;transform:translate(-50%,0)}
@media (max-width:640px){.sub{top:auto;bottom:16px;transform:translate(-50%,14px)}.sub.on{transform:translate(-50%,0)}.sub a{padding:8px 10px;font-size:12px}.sr{grid-template-columns:54px 1fr}.sa{grid-column:2}}
@media (prefers-reduced-motion:reduce){[data-split] .ch{animation:none;transform:none;opacity:1}}
.arrive{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
.arrive div{--acc:#F2F1EC;padding:22px;border-radius:18px;background:#0B0B0C;color:#F2F1EC}.arrive h3{margin:0 0 8px;font:700 16px 'Inter';color:var(--acc)}.arrive p{margin:0;font-size:14.5px;color:rgba(244,239,230,.75)}
.addr{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin-top:14px;padding:22px;border-radius:18px;border:1px solid rgba(15,27,45,.12)}
.addr b{display:block;font:800 18px 'Anton';letter-spacing:-.02em}.addr span{color:var(--ink2);font-size:14px}
.next{display:flex;justify-content:space-between;align-items:center;gap:20px;text-decoration:none;padding:clamp(48px,8vh,88px) 0}
.next span{font:var(--kick);letter-spacing:.14em;text-transform:uppercase;color:var(--acc)}.next b{display:block;font:400 clamp(56px,9vw,150px)/.9 'Anton',serif;letter-spacing:-.02em;transition:color .5s}
.next:hover b{color:var(--acc)}.next i{font-style:normal;font-size:clamp(40px,6vw,90px);transition:transform .6s var(--ease)}.next:hover i{transform:translateX(12px)}
footer{border-top:1px solid rgba(244,239,230,.1);padding:28px 0;font-size:13px;color:rgba(244,239,230,.55)}footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
.rv{opacity:0;translate:0 28px;transition:opacity 1.1s var(--ease),translate 1.1s var(--ease)}.rv.in-v{opacity:1;translate:0 0}
@media (prefers-reduced-motion:reduce){.rv{opacity:1;translate:none}.hero>img{animation:none;scale:1}}
@media (max-width:1000px){.ev{grid-template-columns:repeat(2,1fr)}.plan,.fmt,.head{grid-template-columns:1fr}.key{max-height:none}}
@media (max-width:640px){.top{inset:10px 12px auto}.top .back{display:none}.facts{grid-template-columns:repeat(2,1fr)}.facts div:nth-child(3){padding-left:0;border-left:0}.ev{grid-template-columns:1fr}.ev a{min-height:0}.medals,.arrive{grid-template-columns:1fr}.mt{flex-direction:column;align-items:flex-start}.pin{width:22px;height:22px;margin:-11px 0 0 -11px;font-size:10px}.bar{flex-direction:column;align-items:flex-start}}

/* round 6: scroll-scrubbed hero film, court drawing, mini gallery, venue card turn */
.hs{position:relative;height:190vh}.hs>.hero{position:sticky;top:0}
.hero>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;filter:grayscale(.25) contrast(1.05)}
.hs .hero>img{animation:none;scale:calc(1.06 + var(--hp,0) * .22)}
.hero .wrap{transition:none}.hs .hero .wrap>*:not(h1){opacity:calc(1 - var(--sp,0) * 1.4);translate:0 calc(var(--sp,0) * -40px)}
.hs [data-split] .ch{translate:calc((var(--i) - var(--mid,4)) * var(--sp,0) * .5em) calc(var(--sp,0) * (var(--i) - var(--mid,4)) * var(--sp,0) * .12em);filter:blur(calc(var(--sp,0) * 6px))}
.hs [data-split]{overflow:visible}
.scrub-k{position:absolute;right:clamp(16px,3vw,40px);bottom:clamp(18px,3vh,32px);z-index:2;font:500 10.5px/1 'JetBrains Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:rgba(242,241,236,.6);opacity:calc(1 - var(--hp,0) * 3)}
.court{margin-top:clamp(48px,7vw,96px);padding-top:clamp(28px,4vw,48px);border-top:1px solid rgba(242,241,236,.14)}
.court .kick{display:block;margin-bottom:18px}
.court-svg{display:block;width:100%;max-height:72vh;overflow:visible}
.court-svg .cl :is(rect,line,circle,path){fill:none;stroke:#F2F1EC;stroke-dasharray:1 1;stroke-dashoffset:var(--d,1);stroke-linecap:round;transition:stroke-dashoffset .25s linear}
.court-svg .cdim text{fill:#F2F1EC;font-family:'JetBrains Mono',monospace;letter-spacing:.06em;opacity:var(--o,0);transition:opacity .6s ease}
.sgal{background:#0B0B0C;color:#F2F1EC}.sgal .head p{color:rgba(242,241,236,.66)}
.sgal-st{position:relative;height:clamp(500px,78vh,760px);max-width:1400px;margin:0 auto}
.plan figure,.vph figure{position:relative;perspective:2000px}
.vt{all:unset;box-sizing:border-box;position:absolute;inset:0;z-index:6;cursor:pointer;border-radius:16px;overflow:hidden;transform-origin:0 50%;backface-visibility:hidden;transition:transform 1.1s cubic-bezier(.65,0,.2,1),opacity .5s ease .55s,visibility 0s linear 1.1s;background:#0B0B0C}
.vt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(.3) contrast(1.06)}
.vt::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,12,.8),rgba(11,11,12,.1))}
.vt-txt{position:absolute;left:clamp(18px,3vw,36px);bottom:clamp(18px,3vw,36px);z-index:1;display:flex;flex-direction:column;gap:12px;color:#F2F1EC}
.vt-txt small{font:500 10.5px/1 'JetBrains Mono',monospace;letter-spacing:.18em;text-transform:uppercase;opacity:.7}
.vt-txt b{font:400 clamp(34px,5vw,72px)/.9 'Anton',sans-serif;text-transform:uppercase}
.vt-cue{align-self:flex-start;padding:10px 16px;border-radius:999px;background:#F2F1EC;color:#0B0B0C;font:600 13px/1 Inter,sans-serif}
.vt.vt-nudge{animation:vtNudge 1.6s cubic-bezier(.45,0,.2,1)}
@keyframes vtNudge{0%,100%{transform:none}35%{transform:rotateY(-16deg)}55%{transform:rotateY(-9deg)}70%{transform:rotateY(-13deg)}}
[data-turn="1"]>.vt{transform:rotateY(-178deg);opacity:0;visibility:hidden;pointer-events:none}
.vt-back{all:unset;position:absolute;right:14px;top:14px;z-index:5;cursor:pointer;padding:8px 14px;border-radius:999px;background:#0B0B0C;color:#F2F1EC;font:500 11px/1 'JetBrains Mono',monospace;letter-spacing:.12em;text-transform:uppercase;opacity:0;pointer-events:none;transition:opacity .4s ease .6s}
[data-turn="1"]>.vt-back{opacity:1;pointer-events:auto}
@media (prefers-reduced-motion:reduce){.hs{height:auto}.hs>.hero{position:relative}.vt{transition:opacity .3s}[data-turn="1"]>.vt{transform:none}.vt.vt-nudge{animation:none}.court-svg .cl *{stroke-dashoffset:0}.court-svg .cdim text{opacity:1}}
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

JS2 = r"""
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-bt]');if(!b)return;var k=b.getAttribute('data-bt');document.querySelectorAll('[data-bt]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});document.querySelectorAll('[data-bp]').forEach(function(p){p.hidden=p.getAttribute('data-bp')!==k;});});

(function(){var R=matchMedia('(prefers-reduced-motion: reduce)').matches,D=document;
function toast(t){var x=D.querySelector('.toast');if(!x){x=D.createElement('div');x.className='toast';D.body.appendChild(x);}x.textContent=t;x.classList.add('on');clearTimeout(x.t);x.t=setTimeout(function(){x.classList.remove('on');},2200);}
var h=D.querySelector('[data-split]');if(h){var w=h.textContent;h.textContent='';h.setAttribute('aria-label',w);w.split('').forEach(function(c,i){var s=D.createElement('span');s.className='ch';s.setAttribute('aria-hidden','true');s.style.setProperty('--i',i);s.textContent=c===' '?' ':c;h.appendChild(s);});}
var cd=D.querySelector('.cd');if(cd&&cd.dataset.first){var f=Date.parse(cd.dataset.first),l=Date.parse(cd.dataset.last)+3*3600e3,k=cd.querySelector('.cd-k'),v=cd.querySelector('.cd-v');
 function tick(){var n=Date.now();if(n<f){var s=Math.floor((f-n)/1000),dd=Math.floor(s/86400),hh=Math.floor(s%86400/3600),mm=Math.floor(s%3600/60),ss=s%60;k.textContent='First session in';v.textContent=(dd?dd+'d ':'')+String(hh).padStart(2,'0')+'h '+String(mm).padStart(2,'0')+'m '+String(ss).padStart(2,'0')+'s';}else if(n<l){k.textContent='Status';v.textContent='Live now';}else{k.textContent='Status';v.textContent='Medals decided';}}
 tick();setInterval(tick,1000);}
function store(){try{return JSON.parse(localStorage.getItem('gms-sport-follow')||'{}');}catch(e){return{};}}function save(o){try{localStorage.setItem('gms-sport-follow',JSON.stringify(o));}catch(e){}}
var fo=D.querySelector('.fol');if(fo){var st=store(),key='sport:'+fo.dataset.sport,lab=fo.textContent.replace('☆ ','');function sf(){var on=!!store()[key];fo.setAttribute('aria-pressed',on);fo.textContent=(on?'★ Following ':'☆ Follow ')+lab.replace(/^Follow(ing)? /,'');}sf();fo.addEventListener('click',function(){var o=store();if(o[key])delete o[key];else o[key]=1;save(o);sf();toast(o[key]?'You will see '+lab.replace(/^Follow /,'')+' first in My Games':'Unfollowed');});}
D.querySelectorAll('.rm').forEach(function(b){var o=store();b.setAttribute('aria-pressed',!!o[b.dataset.rm]);b.textContent=o[b.dataset.rm]?'★':'☆';});
D.addEventListener('click',function(e){var r=e.target.closest('.rm');if(r){var o=store(),k=r.dataset.rm;if(o[k])delete o[k];else o[k]=1;save(o);r.setAttribute('aria-pressed',!!o[k]);r.textContent=o[k]?'★':'☆';toast(o[k]?'Saved on this device':'Removed');return;}
 var c=e.target.closest('.ic');if(c){var s=new Date(c.dataset.ics),en=new Date(s.getTime()+90*60e3),z=function(d){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');};
  var ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GMS//AIPT 2026//EN','BEGIN:VEVENT','UID:'+z(s)+'-'+Math.random().toString(36).slice(2)+'@gms','DTSTAMP:'+z(new Date()),'DTSTART:'+z(s),'DTEND:'+z(en),'SUMMARY:'+c.dataset.title,'LOCATION:'+c.dataset.loc,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  var a=D.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download=c.dataset.title.replace(/[^\w]+/g,'-').toLowerCase()+'.ics';D.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);toast('Calendar file ready');}});
var sub=D.querySelector('.sub'),hero=D.querySelector('.hero');if(sub){var links=[].slice.call(sub.querySelectorAll('a')),secs=links.map(function(a){return D.querySelector(a.getAttribute('href'));}),raf=0;
 function paint(){raf=0;var y=scrollY,vh=innerHeight;sub.classList.toggle('on',hero.getBoundingClientRect().bottom<vh*0.35);sub.style.setProperty('--p',(y/Math.max(1,D.documentElement.scrollHeight-vh)).toFixed(4));var cur=-1;secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top<vh*0.4)cur=i;});links.forEach(function(a,i){a.toggleAttribute('aria-current',i===cur);});}
 addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(paint);},{passive:true});paint();}
})();
"""



FXCSS = r"""
.fx{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}
.fx-d{padding:22px;border-radius:20px;background:#F7F6F2;border:1px solid rgba(11,11,12,.08)}
.fx-d h3{margin:0 0 10px;display:flex;align-items:baseline;gap:12px;font:400 28px/1 'Anton',serif}.fx-d h3 span{font:var(--kick);letter-spacing:.12em;text-transform:uppercase;color:var(--ink2)}
.fx-d ol{list-style:none;margin:0;padding:0}
.fx-m{padding:14px 0;border-top:1px solid rgba(11,11,12,.09);display:grid;gap:8px}
.fx-h{display:grid;grid-template-columns:58px 1fr auto;gap:10px;align-items:center}
.fx-h time{font:400 22px/1 'Anton',serif;font-variant-numeric:tabular-nums}.fx-h b{display:block;font-size:14px}.fx-h span{font-size:12px;color:var(--ink2)}
.fx-st{font:600 10px/1 'JetBrains Mono',monospace;font-style:normal;letter-spacing:.12em;text-transform:uppercase;padding:5px 8px;border-radius:999px;background:var(--paper-2);color:var(--ink2);white-space:nowrap}
.fx-m[data-state=live] .fx-st{background:#E5484D;color:#fff}.fx-m[data-state=final] .fx-st{background:#0B0B0C;color:#F2F1EC}
.fx-tm{display:grid;grid-template-columns:58px 1fr auto;gap:10px;align-items:center;font-size:14px}
.fx-tm code{font:600 11px/1 'JetBrains Mono',monospace;letter-spacing:.08em;color:var(--ink2)}
.fx-s{font:400 22px/1 'Anton',serif;font-variant-numeric:tabular-nums;min-width:28px;text-align:right}
.fx-tm[data-won] span,.fx-tm[data-won] .fx-s{font-weight:700}.fx-m[data-state=final] .fx-tm:not([data-won]){opacity:.55}
.fx-sets{padding-left:68px;font:500 11px/1.3 'JetBrains Mono',monospace;color:var(--ink2);letter-spacing:.04em}
.fx-lanes{list-style:none;margin:0;padding:0 0 0 68px;display:grid;gap:4px;font-size:13.5px}
.fx-lanes li{display:grid;grid-template-columns:20px 44px 1fr;gap:6px;align-items:center}.fx-lanes i{font:400 15px/1 'Anton',serif;font-style:normal}.fx-lanes code{font:600 11px/1 'JetBrains Mono',monospace;color:var(--ink2)}
.fx-lanes .fx-more{display:block;font-size:12px;color:var(--ink2)}
@media (max-width:640px){.fx{grid-template-columns:1fr}.fx-h,.fx-tm{grid-template-columns:50px 1fr auto}.fx-sets,.fx-lanes{padding-left:60px}}
"""
FXJS = r"""
(function(){
  function upd(){var now=Date.now();document.querySelectorAll('.fx-m').forEach(function(m){var at=Date.parse(m.getAttribute('data-at')),st=m.querySelector('.fx-st'),race=m.classList.contains('fx-race');
    var state=now<at?'up':now<at+75*60000?'live':'final';if(m.getAttribute('data-state')===state)return;m.setAttribute('data-state',state);
    st.textContent=state==='up'?'Sample · upcoming':state==='live'?'Sample · live':'Sample · final';
    if(race)return;var sa=m.getAttribute('data-sa'),sb=m.getAttribute('data-sb'),s=m.querySelectorAll('.fx-s'),sets=m.querySelector('.fx-sets');
    if(state==='final'){s[0].textContent=sa;s[1].textContent=sb;m.querySelector('[data-w='+(+sa>=+sb?'a':'b')+']').setAttribute('data-won','');if(sets)sets.textContent=(m.getAttribute('data-sets')||'').split(',').filter(Boolean).join('  ·  ');}
    else{s[0].textContent='–';s[1].textContent='–';}});}
  upd();setInterval(upd,60000);
})();
"""

JS3 = r"""
(function(){var R=matchMedia('(prefers-reduced-motion: reduce)').matches,D=document;
/* hero film scrubbed by the scroll; the title flies apart as the hero ends */
var hs=D.querySelector('.hs'),hero=hs&&hs.querySelector('.hero'),vid=hero&&hero.querySelector('video'),h1=hero&&hero.querySelector('[data-split]'),cur=0,goal=0,raf=0;
if(hs&&!R){if(h1)h1.style.setProperty('--mid',((h1.textContent.length-1)/2).toFixed(1));
 function hp(){var r=hs.getBoundingClientRect();return Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)));}
 function frame(){raf=0;var p=hp();cur+=(p-cur)*.18;if(Math.abs(p-cur)<.0005)cur=p;hero.style.setProperty('--hp',cur.toFixed(4));hero.style.setProperty('--sp',Math.max(0,(cur-.55)/.45).toFixed(4));
  if(vid&&vid.readyState>=1&&vid.duration){var t=cur*(vid.duration-.05);if(Math.abs(vid.currentTime-t)>.03&&!vid.seeking)vid.currentTime=t;}
  if(cur!==p)raf=requestAnimationFrame(frame);}
 addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(frame);},{passive:true});if(vid){vid.pause();vid.addEventListener('loadedmetadata',frame);}frame();}
else if(vid){vid.remove();}
/* the field of play draws itself as it scrolls into view */
var cs=D.querySelector('.court-svg');if(cs){var ps=[].slice.call(cs.querySelectorAll('.cl>*')),tx=[].slice.call(cs.querySelectorAll('.cdim text')),cr=0;
 function cd(){cr=0;var r=cs.getBoundingClientRect(),vh=innerHeight,p=Math.max(0,Math.min(1,(vh*.95-r.top)/(vh*.75)));
  ps.forEach(function(e,i){var k=Math.max(0,Math.min(1,p*(ps.length+2)/1.4-i*.55));e.style.setProperty('--d',(1-k).toFixed(3));});
  tx.forEach(function(e,i){e.style.setProperty('--o',p>.55+i*.1?'1':'0');});}
 if(R){ps.forEach(function(e){e.style.setProperty('--d','0');});tx.forEach(function(e){e.style.setProperty('--o','1');});}else{addEventListener('scroll',function(){if(!cr)cr=requestAnimationFrame(cd);},{passive:true});cd();}}
/* a small curved gallery of this sport's events */
var gs=D.querySelector('[data-sgal]');if(gs&&window.gmsRoom){var sec=gs.closest('section'),imgs=JSON.parse(gs.getAttribute('data-imgs')||'[]');
 var items=[].slice.call(D.querySelectorAll('.ev>a')).map(function(a,i){var t=(a.querySelector('h3')||{}).textContent||'',code=(a.querySelector('code')||{}).textContent||'',pl=(a.querySelector('.pill')||{}).textContent||'',nx=(a.querySelector('.nx')||{}).textContent||'';
  return {sig:code,img:imgs[i%imgs.length],title:t,round:pl,small:nx||code,plate:code,code:code,aria:t};});
 var g=gmsRoom(gs,{items:function(){return items;},capLead:'You are looking at',openLabel:'See its draw →',active:function(){var r=sec.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;},
  walk:function(){var r=sec.getBoundingClientRect(),vh=innerHeight;return Math.max(0,Math.min(1,(vh*.6-r.top)/Math.max(1,r.height)));},
  open:function(it){var b=D.querySelector('[data-bt="'+it.code+'"]');if(b)b.click();var rs=D.getElementById('results');if(rs)rs.scrollIntoView({behavior:R?'auto':'smooth'});}});
 g.build();}
/* venue: the plan (or venue photo) arrives as a rolled paper map that unrolls with the scroll */
if(window.gmsRoll)D.querySelectorAll('[data-cover]').forEach(function(f){var host=f.querySelector('.vlz')||f,im=host.querySelector('img');if(im)window.gmsRoll.attach(host,{src:im.getAttribute('src')});});
})();
"""

def court_svg(key):
    """A simple line drawing of the field of play, drawn on scroll. Units are metres scaled by K."""
    L=[]; T=[]
    def r(x,y,w,h): L.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" pathLength="1"/>')
    def l(x1,y1,x2,y2): L.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" pathLength="1"/>')
    def c(cx,cy,rr): L.append(f'<circle cx="{cx}" cy="{cy}" r="{rr}" pathLength="1"/>')
    def a(d): L.append(f'<path d="{d}" pathLength="1"/>')
    def t(x,y,s,anchor="middle"): T.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}">{s}</text>')
    if key=="badminton":
        W,H=13.4,6.1; r(0,0,W,H); l(0,.46,W,.46); l(0,H-.46,W,H-.46); l(W/2,0,W/2,H); l(W/2-1.98,0,W/2-1.98,H); l(W/2+1.98,0,W/2+1.98,H); l(.76,0,.76,H); l(W-.76,0,W-.76,H); l(0,H/2,W/2-1.98,H/2); l(W/2+1.98,H/2,W,H/2)
        t(W/2,-.5,"13.40 m"); t(-.5,H/2,"6.10 m","end"); t(W/2,H+.9,"Net 1.55 m · short service 1.98 m")
    elif key=="tabletennis":
        W,H=2.74,1.525; r(0,0,W,H); l(0,H/2,W,H/2); l(W/2,-.12,W/2,H+.12); l(0,.02,W,.02)
        t(W/2,-.22,"2.74 m"); t(-.12,H/2,"1.525 m","end"); t(W/2,H+.3,"Net 15.25 cm high")
    elif key=="tennis":
        W,H=23.77,10.97; r(0,0,W,H); l(0,1.37,W,1.37); l(0,H-1.37,W,H-1.37); l(W/2,-.5,W/2,H+.5); l(W/2-6.4,1.37,W/2-6.4,H-1.37); l(W/2+6.4,1.37,W/2+6.4,H-1.37); l(W/2-6.4,H/2,W/2+6.4,H/2); l(0,H/2,.2,H/2); l(W-.2,H/2,W,H/2)
        t(W/2,-1.1,"23.77 m"); t(-.8,H/2,"10.97 m","end"); t(W/2,H+1.9,"Service box 6.40 m · net 0.914 m")
    elif key=="basketball":
        W,H=28,15; r(0,0,W,H); l(W/2,0,W/2,H); c(W/2,H/2,1.8); r(0,H/2-2.45,5.8,4.9); r(W-5.8,H/2-2.45,5.8,4.9); c(5.8,H/2,1.8); c(W-5.8,H/2,1.8)
        a(f"M0 .9 H2.99 A6.75 6.75 0 0 1 2.99 {H-.9} H0"); a(f"M{W} .9 H{W-2.99} A6.75 6.75 0 0 0 {W-2.99} {H-.9} H{W}")
        t(W/2,-1,"28 m"); t(-.8,H/2,"15 m","end"); t(W/2,H+1.8,"Three-point line 6.75 m · key 4.90 m")
    elif key=="volleyball":
        W,H=18,9; r(0,0,W,H); l(W/2,-.6,W/2,H+.6); l(W/2-3,0,W/2-3,H); l(W/2+3,0,W/2+3,H)
        t(W/2,-1,"18 m"); t(-.6,H/2,"9 m","end"); t(W/2,H+1.6,"Attack line 3 m · net 2.43 m (men)")
    elif key=="football":
        W,H=105,68; r(0,0,W,H); l(W/2,0,W/2,H); c(W/2,H/2,9.15); r(0,H/2-20.15,16.5,40.3); r(W-16.5,H/2-20.15,16.5,40.3); r(0,H/2-9.16,5.5,18.32); r(W-5.5,H/2-9.16,5.5,18.32); c(11,H/2,.4); c(W-11,H/2,.4)
        t(W/2,-3.5,"105 m"); t(-3,H/2,"68 m","end"); t(W/2,H+7,"Penalty area 16.5 m · centre circle 9.15 m")
    elif key=="swimming":
        W,H=50,25; r(0,0,W,H)
        for i in range(1,10): l(0,i*2.5,W,i*2.5)
        l(5,0,5,H); l(W-5,0,W-5,H); l(15,0,15,H); l(W-15,0,W-15,H)
        t(W/2,-2,"50 m"); t(-1.5,H/2,"25 m","end"); t(W/2,H+4,"10 lanes × 2.5 m · 15 m marks")
    else:
        R0,S=36.5,84.39; W=S+2*(R0+9.76); H=2*(R0+9.76); ox=R0+9.76
        for k in range(0,9):
            rr=R0+k*1.22; y0=ox-rr; y1=ox+rr
            a(f"M{ox} {y0} H{ox+S} A{rr} {rr} 0 0 1 {ox+S} {y1} H{ox} A{rr} {rr} 0 0 1 {ox} {y0}")
        l(ox+S,ox+R0,ox+S,ox+R0+9.76)
        t(W/2,-4,"400 m"); t(W/2,ox+4,"Straight 84.39 m"); t(W/2,H+8,"8 lanes × 1.22 m · bend radius 36.5 m")
    pad=max(W,H)*.14
    return (f'<svg viewBox="{-pad*1.6:.2f} {-pad:.2f} {W+pad*2.6:.2f} {H+pad*2.2:.2f}" class="court-svg" role="img" aria-label="{NAMES[key]} field of play with dimensions">'
            f'<g class="cl" style="stroke-width:{max(W,H)*.0042:.4f}px">{"".join(L)}</g><g class="cdim" style="font-size:{max(W,H)*.032:.3f}px">{"".join(T)}</g></svg>')

def teams():
    i = SRC.find("teams:{"); j = SRC.find("}", i)
    return re.findall(r"(\w+):'([^']+)'", SRC[i+7:j])

def fixtures(key, d, c, codes, ses, iso):
    """Sample fixtures, one card per day: deterministic pairings and scores so the page reads like the real draw."""
    import hashlib
    T = teams(); e = html.escape; out = ""
    style = d["sport"]
    def rnd(seed, n): return int(hashlib.md5(seed.encode()).hexdigest()[:8], 16) % n
    def score(seed):
        s = style.lower()
        if "badminton" in s:
            g = [(21, 12 + rnd(seed+"a", 8)), (19 + rnd(seed+"b", 4), 21), (21, 14 + rnd(seed+"c", 6))] if rnd(seed, 3) == 0 else [(21, 13 + rnd(seed+"a", 7)), (21, 15 + rnd(seed+"b", 5))]
            return ",".join(f"{a}-{b}" for a, b in g), sum(a > b for a, b in g), sum(b > a for a, b in g)
        if "table" in s:
            g = [(11, 5 + rnd(seed+str(k), 6)) for k in range(3)]
            if rnd(seed, 2): g.insert(1, (8 + rnd(seed+"x", 2), 11))
            return ",".join(f"{a}-{b}" for a, b in g), sum(a > b for a, b in g), sum(b > a for a, b in g)
        if "tennis" in s:
            g = [(6, 2 + rnd(seed+"a", 4)), (6, 3 + rnd(seed+"b", 3))]
            return ",".join(f"{a}-{b}" for a, b in g), 2, 0
        if "volley" in s:
            g = [(25, 17 + rnd(seed+"a", 6)), (22 + rnd(seed+"b", 2), 25), (25, 19 + rnd(seed+"c", 4)), (25, 20 + rnd(seed+"d", 3))]
            return ",".join(f"{a}-{b}" for a, b in g), 3, 1
        if "basket" in s:
            a = 62 + rnd(seed+"a", 20); b = a - 3 - rnd(seed+"b", 12); return "", a, b
        if "foot" in s:
            a = 1 + rnd(seed+"a", 3); b = rnd(seed+"b", a); return "", a, b
        return "", 0, 0
    race = d["sport"] in ("Athletics", "Swimming")
    for di in sorted(set(x[0] for x in ses)):
        rows = ""
        for k, (d_, t, code, rd) in enumerate([x for x in ses if x[0] == di]):
            seed = f"{key}{di}{code}{rd}{k}"
            if race:
                st0 = rnd(seed, len(T)); lanes = [T[(st0 + n * 5) % len(T)] for n in range(4)]
                ln = "".join(f'<li><i>{n+1}</i><code>{a}</code>{e(b) if b != a else ""}</li>' for n, (a, b) in enumerate(lanes))
                rows += (f'<li class="fx-m fx-race" data-at="{iso(di, t)}"><div class="fx-h"><time>{t}</time><div><b>{e(codes[code])}</b><span>{e(rd)}{'' if 'Final' in rd else ' · Heat ' + str(1 + rnd(seed, 3))}</span></div><em class="fx-st">Sample</em></div>'
                         f'<ol class="fx-lanes">{ln}<li class="fx-more">+ {4 + rnd(seed+"m", 4)} more lanes</li></ol></li>')
                continue
            a = rnd(seed+"A", len(T)); b = (a + 1 + rnd(seed+"B", len(T) - 1)) % len(T)
            sets, sa, sb = score(seed)
            court = ("Court " + str(1 + rnd(seed+"c", 9))) if c["venue"] == "Badminton Hall" else ("Table " + str(1 + rnd(seed+"c", 12))) if "Table" in c["venue"] else c["venue"]
            rows += (f'<li class="fx-m" data-at="{iso(di, t)}" data-sa="{sa}" data-sb="{sb}" data-sets="{sets}"><div class="fx-h"><time>{t}</time><div><b>{e(codes[code])}</b><span>{e(rd)} · {e(court)}</span></div><em class="fx-st">Sample</em></div>'
                     f'<div class="fx-tm" data-w="a"><code>{T[a][0]}</code><span>{e(T[a][1]) if T[a][1] != T[a][0] else ""}</span><b class="fx-s">–</b></div>'
                     f'<div class="fx-tm" data-w="b"><code>{T[b][0]}</code><span>{e(T[b][1]) if T[b][1] != T[b][0] else ""}</span><b class="fx-s">–</b></div><small class="fx-sets"></small></li>')
        out += f'<div class="fx-d rv"><h3><span>Day {di+1:02d}</span>{DAYS[di][0]} {DAYS[di][1]}</h3><ol>{rows}</ol></div>'
    return out

def page(key):
    d = SPORTS[key]; c = cats()[d["sport"]]; e = html.escape
    codes = {code: title for title, cat, code in c["events"]}
    ses = [(di, t, code, rnd) for di, day in enumerate(sessions()) for t, code, rnd in day if code in codes]
    ses.sort(key=lambda x: (x[0], x[1]))
    nxt = {}
    for di, t, code, rnd in ses: nxt.setdefault(code, (di, t, rnd))
    def iso(di, t): return DAYS[di][2] + "T" + t + ":00+05:30"
    first = iso(*ses[0][:2]) if ses else ""; last = iso(*ses[-1][:2]) if ses else ""
    sched = ""
    for di in sorted(set(x[0] for x in ses)):
        rows = "".join(f'<li class="sr"><time>{t}</time><div><b>{e(codes[code])}</b><span>{e(rnd)} · {code}</span></div>'
                       f'<span class="sa"><button type="button" class="ic" data-ics="{iso(di,t)}" data-title="{e(d["name"]+" · "+codes[code]+" · "+rnd)}" data-loc="{e(c["venue"])}, Veer Savarkar Sports Complex, Naranpura, Ahmedabad">+ Calendar</button>'
                       f'<button type="button" class="rm" data-rm="{key}-{code}-{di}" aria-pressed="false" aria-label="Remind me">☆</button></span></li>'
                       for d_, t, code, rnd in ses if d_ == di)
        sched += f'<div class="sd rv"><h3><span>Day {di+1:02d}</span>{DAYS[di][0]} {DAYS[di][1]}</h3><ol>{rows}</ol></div>'
    evs = "".join(
        f'<a class="rv" style="transition-delay:{i*90}ms" href="../index.html#register"><code>{code}</code><span class="pill">{CAT_LABEL[cat]}</span>'
        f'<h3>{e(title)}</h3>' + (f'<span class="nx">Next · {DAYS[nxt[code][0]][0]} {DAYS[nxt[code][0]][1]} · {nxt[code][1]} · {e(nxt[code][2])}</span>' if code in nxt else '') + f'<span class="md"><i style="background:#D4A63A"></i><i style="background:#B9BEC7"></i><i style="background:#B07A4A"></i>Gold, silver, bronze</span><span class="go">Register for this event →</span></a>'
        for i, (title, cat, code) in enumerate(c["events"]))
    SLOTS = {"Quarter-finals": 4, "Semi-finals": 2, "Final": 1}
    MATCHES = {"Round of 64": 32, "Round of 32": 16, "Round of 16": 8}
    tabs = ""; panes = ""
    for i, (title, cat, code) in enumerate(c["events"]):
        rds = []
        for di, t, cd, rnd in ses:
            if cd == code and rnd not in rds: rds.append(rnd)
        cols = ""
        for rnd in rds:
            if rnd in SLOTS:
                slots = "".join('<div class="bm"><span><i></i>To be decided</span><span><i></i>To be decided</span></div>' for _ in range(SLOTS[rnd]))
                cols += f'<div class="bc"><h4>{e(rnd)}</h4><div class="bs">{slots}</div></div>'
            else:
                n = MATCHES.get(rnd)
                cols += f'<div class="bc bc-sum"><h4>{e(rnd)}</h4><div class="bsum"><b>{n if n else "—"}</b><span>{"matches" if n else "Results list after the session"}</span></div></div>'
        if not cols: cols = '<div class="bc bc-sum"><h4>Draw</h4><div class="bsum"><b>—</b><span>Published with the draw</span></div></div>'
        tabs += f'<button type="button" class="bt-t" data-bt="{code}" aria-pressed="{"true" if i == 0 else "false"}">{e(title)}</button>'
        panes += f'<div class="bp" data-bp="{code}"{"" if i == 0 else " hidden"}><div class="br">{cols}</div></div>'
    fx = fixtures(key, d, c, codes, ses, iso)
    bracket = f'<div class="btabs" role="group" aria-label="Event">{tabs}</div>{panes}'
    rules = "".join(f'<li class="rv"><b>{i+1:02d}</b><div><h3>{e(t)}</h3><p>{e(p)}</p></div></li>' for i, (t, p) in enumerate(d["rules"]))
    facts = "".join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in d["facts"])
    plan = ""
    if d.get("plan"):
        pins = "".join(f'<button type="button" class="pin" data-pin="{n}" style="left:{x}%;top:{y}%" aria-label="Point {n}">{n}</button>' for n, x, y in plan_pins(d["plan"]))
        keyl = "".join(f'<li><button type="button" data-item="{n}"><b>{n}</b><span><strong>{t}</strong><small>{s}</small></span></button></li>' for n, t, s in plan_key(d["plan"]))
        plan = (f'<div class="plan rv"><figure style="margin:0" data-cover="../assets/venues/cover-{d["plan"]}.webp" data-cover-fb="../assets/venues/{d["plan"]}.webp" data-cover-t="{e(c["venue"])}" data-cover-k="{e(d["plan_label"])}"><div class="vlz" data-vlz tabindex="0" aria-label="{d["plan_label"]}. Pinch or Ctrl+scroll to zoom, drag to move.">'
                f'<div class="in"><img src="../assets/plans/{d["plan"]}-sm.webp" data-hi="../assets/plans/{d["plan"]}-xl.webp" alt="{d["plan_label"]}" width="1400" height="989">{pins}</div></div>'
                f'<figcaption class="bar"><span>{d["plan_label"]} · from the organising team</span><span class="ctl"><button type="button" data-act="out" aria-label="Zoom out">−</button><button type="button" data-act="in" aria-label="Zoom in">+</button><button type="button" data-act="fit">Fit</button><a href="../assets/plans/{d["plan"]}.pdf" download>Download PDF</a></span></figcaption></figure>'
                f'<ol class="key">{keyl}</ol></div>')
    if not d.get("plan"):
        v = c["venue"]; ph = VENUE_PHOTO.get(v, "ground")
        near = sorted([(m, b if a_ == v else a_) for a_, b, m in TRAVEL if v in (a_, b)])
        nl = "".join(f'<li><b>{m} min</b><span>to the {e(o)}</span></li>' for m, o in near)
        plan = (f'<div class="vph rv"><figure data-cover="../assets/sportfilm/{key}.webp" data-cover-fb="../assets/sports/{d["photo"]}.webp" data-cover-t="{e(v)}" data-cover-k="Veer Savarkar Sports Complex"><img src="../assets/venues/{ph}.webp" alt="{e(v)}" loading="lazy"><figcaption>{e(v)} · Veer Savarkar Sports Complex</figcaption></figure>'
                f'<div class="vph-k"><span class="kick">On foot from here</span><ul>{nl}</ul><p>Walking times inside the complex, from the organising team’s venue guide.</p></div></div>')
    arr = d["arrive"] or GEN_ARRIVE(c["venue"])
    arrive = "".join(f'<div class="rv"><h3>{e(t)}</h3><p>{e(p)}</p></div>' for t, p in arr)
    nx = d["next_"]
    film = f'<video muted playsinline preload="auto" src="../assets/sportfilm/{key}.mp4" poster="../assets/sportfilm/{key}.webp" aria-hidden="true"></video>' if os.path.exists(f"assets/sportfilm/{key}.mp4") else ""
    vp = VENUE_PHOTO.get(c["venue"], "ground")
    gimgs = json.dumps([f"../assets/sports/{d['photo']}.webp", f"../assets/sportfilm/{key}.webp", f"../assets/venues/{'badminton' if c['venue']=='Badminton Hall' else vp}.webp", "../assets/podium/competition.webp", "../assets/podium/finals.webp"])
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{d['name']} · All India Police Tournament 2026 · Veer Savarkar Sports Complex</title>
<meta name="description" content="{e(d['lead'])}">
<meta name="theme-color" content="#0B0B0C"><link rel="icon" type="image/png" href="../assets/brand/favicon-64.png"><meta property="og:image" content="https://akash-droid-dev.github.io/GMS-Front-End-Design/assets/og-card.jpg?v=2"><meta property="og:title" content="{d['name']} · AIPT 2026"><meta name="twitter:card" content="summary_large_image">
<link rel="preload" as="image" href="../assets/sports/{d['photo']}.webp">
<style>{CSS}{FXCSS}{ECG}</style></head><body>
<header class="top"><a class="top-l" href="../index.html"><img src="../assets/brand/gobananas-mark.webp" alt="Gobananas" width="520" height="238"><b>GMS</b></a>
<nav class="top-r"><a class="back" href="../index.html#sports">← All sports</a><a class="btn btn-g sm" href="../index.html#register">Register</a></nav></header>
<main>
<div class="hs"><section class="hero"><img src="../assets/sports/{d['photo']}.webp" alt="" fetchpriority="high">{film}<span class="scrub-k" aria-hidden="true">Scroll to play</span><div class="wrap">
<span class="kick">{d['kicker']} · {c['venue']}</span><h1 data-split>{d['name']}</h1><p class="lead">{e(d['lead'])}</p>
<div class="cta"><a class="btn btn-g" href="../index.html#register">Register to compete →</a><a class="btn btn-o" href="#venue">{"See the hall plan" if d.get("plan") else "Find the venue"}</a></div>
<div class="hx2"><div class="cd" data-first="{first}" data-last="{last}" aria-live="polite"><span class="cd-k">First session in</span><span class="cd-v">—</span></div><button type="button" class="fol" data-sport="{key}" aria-pressed="false">☆ Follow {d['name']}</button></div>
<div class="facts">{facts}</div></div></section></div>
<nav class="sub" aria-label="On this page"><a href="#events">Events</a><a href="#schedule">Schedule</a><a href="#fixtures">Fixtures</a><a href="#results">Results</a><a href="#format">Format</a><a href="#venue">Venue</a><i class="prog"></i></nav>
<section class="s" id="events"><div class="wrap"><div class="head"><div><span class="kick">01 · Medal events</span><h2>{len(c['events'])} events, <em>one</em> venue</h2></div>
<p>Every event is open to accredited police athletes from each unit. Pick an event to start your registration.</p></div><div class="ev">{evs}</div></div></section>
<section class="s sgal" id="gallery"><div class="wrap"><div class="head"><div><span class="kick">The gallery</span><h2>Walk the <em>events</em></h2></div><p>Every {e(d['name'].lower())} event hangs in one room. Scroll or drag to walk round, click a frame to look closer, and again to see its draw.</p></div></div><div class="sgal-st" data-sgal data-imgs='{gimgs}'></div></section>
<section class="s" id="schedule"><div class="wrap"><div class="head"><div><span class="kick">02 · Schedule</span><h2>Every <em>session</em>, day by day</h2></div><p>All times IST. Add a session to your calendar, or star it to keep it on this device.</p></div><div class="sch">{sched}</div></div></section>
<section class="s" id="fixtures"><div class="wrap"><div class="head"><div><span class="kick">Fixtures · sample</span><h2>Who plays <em>whom</em></h2></div><p>Sample fixtures that show how the draw will read, with scores filling in as each match ends. The published draw replaces them.</p></div><div class="fx">{fx}</div></div></section>
<section class="s" id="results"><div class="wrap"><div class="head"><div><span class="kick">03 · Results &amp; brackets</span><h2>The <em>draw</em>, round by round</h2></div><p>Names go in when the draw is made and each result fills in as the match ends.</p></div><div class="brk rv">{bracket}</div></div></section>
<section class="s dark" id="format"><div class="wrap"><div class="fmt"><div class="rv"><span class="kick">04 · Format &amp; rules</span><h2>How a match is <em>won</em></h2><div class="big" style="margin-top:40px">{d['big']}</div><p>{d['big_label']}</p></div>
<ol class="rules">{rules}</ol></div>
<div class="medals"><div class="rv"><i style="background:#D4A63A"></i><b>Gold</b><span>Winner of the final</span></div><div class="rv" style="transition-delay:90ms"><i style="background:#B9BEC7"></i><b>Silver</b><span>Runner-up in the final</span></div><div class="rv" style="transition-delay:180ms"><i style="background:#B07A4A"></i><b>Bronze</b><span>Awarded from the semi-finals</span></div></div>
<div class="mt rv"><p>The live medal table opens with the first {d['name'].lower()} final on 24 November.</p><a class="btn btn-n sm" href="../index.html#medals">Open the medal table</a></div>
<div class="court"><span class="kick">The field of play</span>{court_svg(key)}</div></div></section>
<section class="s" id="venue"><div class="wrap"><div class="head"><div><span class="kick">05 · The venue</span><h2>{('Inside the <em>'+c['venue'].split()[0].lower()+'</em> hall') if d.get('plan') else ('Find the <em>'+c['venue'].lower()+'</em>')}</h2></div>
<p>{'The real layout from the organising team. Tap a number to zoom to it, pinch or Ctrl+scroll to zoom, and drag to look around.' if d.get('plan') else 'Where the '+e(d['name'].lower())+' is played inside the complex, and how far it is from the other venues.'}</p></div>{plan}
<div class="arrive">{arrive}</div>
<div class="addr rv"><div><b>Veer Savarkar Sports Complex</b><span>Naranpura, Ahmedabad, Gujarat · Accreditation card required at every entry</span></div><a class="btn btn-n" href="{MAPS}" target="_blank" rel="noopener">Directions in Google Maps ↗</a></div></div></section>
<section class="deep"><div class="wrap"><a class="next" href="{nx}.html"><span style="display:block">Next sport<b>{NAMES[nx]}</b></span><i>→</i></a></div>
<footer><div class="wrap"><span>All India Police Tournament 2026 · Badminton &amp; Table Tennis Cluster · 19–24 Nov 2026</span><a href="../index.html">Back to the Games</a></div></footer></section>
</main><script>{JS}</script><script>{JS2}</script><script src="../assets/js/gms-room.js?v=1"></script><script src="../assets/js/gms-roll.js?v=1"></script><script>{FXJS}</script><script>{JS3}</script></body></html>"""

os.makedirs("sports", exist_ok=True)
for k in sys.argv[1:]:
    open(f"sports/{k}.html", "w").write(page(k)); print("sports/" + k + ".html", len(cats()[SPORTS[k]['sport']]['events']), "events")
