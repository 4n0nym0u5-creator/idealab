HEAD='<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="base.css"><style>%s</style></head><body>%s</body></html>'
def status(): return '<div class="status"><span>9:41</span><span>▂▄▆ 5G ▮▮▮</span></div>'
def tabs(on):
    items=[("🏠","This week"),("🏖️","Holidays"),("📡","Radar"),("🎁","Gifts"),("📘","Handbook")]
    return '<div class="tabs">'+''.join(f'<div class="{"on" if l==on else ""}"><i>{i}</i>{l}</div>' for i,l in items)+'</div>'
def phone(body,on,css=""):
    return HEAD%(css,f'<div class="phone">{status()}<div class="wrap">{body}</div><div class="sample">Sample data · mockup</div>{tabs(on)}</div>')
def item(icon,bg,t,s,pill,pc,pb):
    return f'<div class="card row"><div class="dot" style="background:{bg}">{icon}</div><div class="grow"><div class="t">{t}</div><div class="s">{s}</div></div><span class="pill" style="color:{pc};background:{pb}">{pill}</span></div>'

# 1 This Week mobile
b='''<div class="tag">Wed 28 Oct · The Nguyen household</div><h1 style="margin-top:4px">This week</h1>
<div class="sub">4 things need you. 9 are handled.</div>
<div class="card" style="background:linear-gradient(135deg,#0F766E,#115E59);color:#fff;border:none;margin-top:14px">
<div style="font-size:12px;opacity:.85;font-weight:600">SUMMER HOLIDAYS · 19 DEC – 27 JAN</div>
<div style="font-size:22px;font-weight:750;margin:6px 0 2px">5 days still uncovered</div>
<div style="font-size:13px;opacity:.9">Vacation care bookings usually open 3–6 weeks ahead</div>
<div style="display:flex;gap:3px;margin-top:12px">'''+''.join(f'<span style="flex:1;height:14px;border-radius:4px;background:{c}"></span>' for c in ["#99F6E4"]*5+["#FCA5A5"]*3+["#99F6E4"]*4+["#FDE68A"]*2+["#FCA5A5"]*3+["#99F6E4"]*6)+'''</div></div>
<h2>Needs you</h2>'''+item("🏠","var(--coralL)","Home & contents renewal","Quote up 27% on last year · due 14 Nov","Compare","var(--coral)","var(--coralL)")+item("🎂","var(--plumL)","Mia's 9th birthday","Sat 7 Nov · gift budget $60 · nothing bought","10 days","var(--plum)","var(--plumL)")+item("🛂","var(--skyL)","Sam's passport","Expires Mar 2027 · 6-month rule for Bali trip","Renew","var(--sky)","var(--skyL)")+item("📺","var(--amberL)","Stan free trial ends","Fri 30 Oct · $12/mo after","2 days","var(--amber)","var(--amberL)")+'''
<div class="privacy">🔒 Stored only on this phone · no account · no ads</div>'''
open("m1_thisweek_mobile.html","w").write(phone(b,"This week"))

# 2 Holiday planner mobile
days=["M","T","W","T","F"]
weeks=[("22 Dec","SSSSS"),("29 Dec","PPPPP"),("5 Jan","MMDDV"),("12 Jan","VV??N"),("19 Jan","MM???"),]
col={"S":("#E6F4F1","Shutdown","#0F766E"),"P":("#E6F4F1","Public hol/leave","#0F766E"),"M":("#E8F0FE","Mum leave","#2563EB"),"D":("#F1EBFE","Dad leave","#7C3AED"),"V":("#FEF3C7","Vacation care","#B45309"),"N":("#FDEDE8","Nan","#E76F51"),"?":("#FEE2E2","Gap","#B91C1C")}
g='<div class="card" style="padding:12px"><div style="display:grid;grid-template-columns:58px repeat(5,1fr);gap:5px;font-size:11px;color:var(--mute);text-align:center"><div></div>'+''.join(f'<div>{d}</div>' for d in days)
for w,code in weeks:
    g+=f'<div style="text-align:left;font-size:11.5px;color:var(--ink);font-weight:600;padding-top:9px">{w}</div>'
    for c in code:
        bg,lab,fc=col[c]; txt={"S":"—","P":"✓","M":"Mum","D":"Dad","V":"Care","N":"Nan","?":"?"}[c]
        g+=f'<div style="background:{bg};color:{fc};border-radius:9px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11.5px;{"border:1.5px dashed #F87171;" if c=="?" else ""}">{txt}</div>'
g+='</div></div>'
b=f'''<div class="tag">HolidayPlanner · NSW · 2 kids</div><h1 style="margin-top:4px">Who's got the kids?</h1>
<div class="sub">Summer 2026–27 · 26 weekdays off school</div>
<div style="display:flex;gap:8px;margin:14px 0 10px">
<div class="card" style="flex:1;margin:0;text-align:center"><div style="font-size:22px;font-weight:750;color:#B91C1C">5</div><div class="s">days uncovered</div></div>
<div class="card" style="flex:1;margin:0;text-align:center"><div style="font-size:22px;font-weight:750">$1,040</div><div class="s">est. care cost</div></div>
<div class="card" style="flex:1;margin:0;text-align:center"><div style="font-size:22px;font-weight:750">7</div><div class="s">leave days left</div></div></div>
{g}
<div class="card row" style="background:var(--amberL);border-color:#FDE68A"><div style="font-size:20px">💡</div><div class="grow"><div class="t" style="font-size:14px">Fill 14–15 Jan?</div><div class="s" style="color:#92400E">Ask Nan for 2 more days, or book 2 vacation-care days (~$95–140/day each child)</div></div></div>
<div style="display:flex;gap:8px"><div class="btn" style="flex:1">Ask Nan</div><div class="btn2" style="flex:1">Add to calendar (.ics)</div></div>'''
open("m2_holidays_mobile.html","w").write(phone(b,"Holidays"))

# 3 Renewal radar mobile
bars=[("2024","$2,192",58),("2025","$2,951",78),("2026 quote","$3,755",100)]
bb=''.join(f'<div style="display:flex;align-items:center;gap:10px;margin:8px 0"><div style="width:74px;font-size:12px;color:var(--mute)">{y}</div><div class="bar grow" style="height:22px;border-radius:7px"><b style="width:{w}%;background:{"var(--coral)" if w==100 else "#F4B9A8"};border-radius:7px"></b></div><div style="width:58px;text-align:right;font-weight:700;font-size:13px">{v}</div></div>' for y,v,w in bars)
b=f'''<div class="tag">Renewal Radar</div><h1 style="margin-top:4px">Home & contents</h1>
<div class="sub">Renews 14 Nov · auto-renew is ON</div>
<div class="card" style="margin-top:14px"><div class="row"><div class="grow"><div class="s">This year's quote vs 2 years ago</div><div style="font-size:30px;font-weight:800;color:var(--coral);letter-spacing:-1px">+71%</div></div><span class="pill" style="background:var(--coralL);color:var(--coral)">No claims made</span></div>{bb}</div>
<h2>Your 20-minute shop-around</h2>
<div class="card">'''+''.join(f'<div class="row" style="padding:7px 0;{"border-top:1px solid var(--line);" if i else ""}"><div style="width:22px;height:22px;border-radius:7px;border:2px solid {"var(--teal)" if d else "#D1D5DB"};background:{"var(--teal)" if d else "#fff"};color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center">{"✓" if d else ""}</div><div class="grow" style="font-size:14px">{t}</div></div>' for i,(t,d) in enumerate([("Note sum insured & excess (pre-filled)",1),("Get 2 quotes for the same cover",0),("Call your insurer: ask for the new-customer price",0),("Log the result so next year starts here",0)]))+'''</div>
<div class="card row"><div class="dot" style="background:var(--tealL)">🪙</div><div class="grow"><div class="t" style="font-size:14px">Set aside $46 a fortnight</div><div class="s">covers all 9 annual bills on your radar</div></div></div>'''
open("m3_radar_mobile.html","w").write(phone(b,"Radar"))

# 4 Gifts mobile
ppl=[("Mia (9)","🎂 7 Nov","$45 / $60",75,"var(--plum)"),("Leo (6)","🎄 Christmas","$80 / $120",66,"var(--plum)"),("Mia (9)","🎄 Christmas","$118 / $120",98,"var(--coral)"),("Nan & Pop","🎄 Christmas","$0 / $80",0,"var(--plum)"),("Teachers ×3","🍎 End of term","$30 / $45",66,"var(--plum)")]
pp=''.join(f'<div class="card" style="padding:12px 14px"><div class="row"><div class="grow"><div class="t" style="font-size:14.5px">{n}</div><div class="s">{o}</div></div><div style="font-weight:700;font-size:13.5px">{a}</div></div><div class="bar" style="margin-top:9px"><b style="width:{w}%;background:{c}"></b></div></div>' for n,o,a,w,c in ppl)
b=f'''<div class="tag">GiftLedger · Christmas 2026</div><h1 style="margin-top:4px">Gifts & occasions</h1>
<div class="sub">$273 of $425 planned · 57 days to go</div>
<div class="card row" style="margin-top:14px;background:var(--plumL);border-color:#DDD6FE"><div style="font-size:20px">⚖️</div><div class="grow"><div class="t" style="font-size:14px">Kids are even-ish</div><div class="s" style="color:#5B21B6">Mia $118 · Leo $80 — Leo has 2 gifts left to buy</div></div></div>
{pp}
<div class="card row" style="background:#FFFBEB;border-color:#FDE68A"><div style="font-size:18px">🔁</div><div class="grow"><div class="s" style="color:#92400E">Last year you gave Nan a photo calendar. Repeat it?</div></div></div>'''
open("m4_gifts_mobile.html","w").write(phone(b,"Gifts"))

# 5 Handbook mobile
secs=[("🚨","Emergency","Allergies, meds, GP, nearest ED, ICE contacts","var(--coralL)"),("🧒","Kids' routine","Swim class Tue 10am · Leo: no nuts · bedtime 7:30","var(--skyL)"),("🐶","Biscuit (dog)","1 cup AM/PM · vet: Marrickville · walk 5pm","var(--amberL)"),("🏠","House","Bins Tue night · alarm panel left of door · Wi-Fi on fridge","var(--greenL)"),("🔑","Where things are","Spare key, fuse box, passports, the Will — places only, never passwords","var(--plumL)")]
ss=''.join(item(i,bg,t,s,"✓","var(--teal)","var(--tealL)") for i,t,s,bg in secs)
b=f'''<div class="tag">Household Handbook</div><h1 style="margin-top:4px">Nan's week sheet</h1>
<div class="sub">14–16 Jan · built from your Holiday plan</div>
<div style="display:flex;gap:6px;margin:12px 0">'''+''.join(f'<span class="pill" style="background:{"var(--ink)" if i==0 else "#fff"};color:{"#fff" if i==0 else "var(--ink)"};border:1px solid var(--line);padding:6px 11px">{t}</span>' for i,t in enumerate(["Grandparents","Babysitter","Pet sitter","Partner"]))+f'''</div>{ss}
<div style="display:flex;gap:8px;margin-top:6px"><div class="btn" style="flex:1">Print / PDF</div><div class="btn2" style="flex:1">Private link 🔒</div></div>
<div class="s" style="text-align:center;margin-top:8px">Link is end-to-end encrypted and expires in 14 days</div>'''
open("m5_handbook_mobile.html","w").write(phone(b,"Handbook"))

# 6 Moving mode mobile (v1.1)
mv=[("⚡","Energy · Origin","From your Radar · plan 3+ yrs old → compare first","Switch?"),("🌐","Internet · NBN 100","You may not need 100 Mbps — check before moving","Review"),("🚗","Rego & licence · Service NSW","Update address within 14 days","Due"),("🏥","Medicare & GP","Address + new nearest GP","To do"),("🏦","Banks ×3, super ×2","Pulled from your provider list","To do"),("🐶","Council pet registration","Biscuit — new council area","To do")]
b='''<div class="tag">Moving Mode · v1.1 seasonal</div><h1 style="margin-top:4px">Moving on 12 Dec</h1>
<div class="sub">18 address changes found from what you already track</div>
<div class="card" style="margin-top:14px"><div class="row"><div class="grow"><div class="t">7 of 18 done</div></div><div class="s">45 days to go</div></div><div class="bar" style="margin-top:9px"><b style="width:39%;background:var(--teal)"></b></div></div>'''+''.join(item(i,"var(--tealL)",t,s,p,"var(--teal)","var(--tealL)") for i,t,s,p in mv)
open("m6_moving_mobile.html","w").write(phone(b,"This week"))

# Desktop dashboard
dcss=".desk{width:1440px;height:900px;display:flex;background:var(--bg)}.side{width:240px;background:#fff;border-right:1px solid var(--line);padding:26px 18px}.nav{padding:10px 12px;border-radius:11px;font-size:14.5px;margin-bottom:3px;display:flex;gap:10px}.nav.on{background:var(--tealL);color:var(--teal);font-weight:700}.main{flex:1;padding:30px 36px;overflow:hidden}.cols{display:grid;grid-template-columns:1.25fr 1fr;gap:20px;margin-top:20px}"
def side(on):
    navs=[("🏠","This week"),("🏖️","Holidays"),("📡","Renewal Radar"),("🎁","Gifts"),("📘","Handbook"),("📦","Moving Mode")]
    return '<div class="side"><div style="font-weight:800;font-size:18px;margin-bottom:4px">Life Admin Pass</div><div class="s" style="margin-bottom:22px">The Nguyen household · 4 people</div>'+''.join(f'<div class="nav {"on" if l==on else ""}"><span>{i}</span>{l}</div>' for i,l in navs)+'<div style="position:absolute;bottom:26px;width:204px"><div class="privacy" style="margin:0">🔒 Everything stays on this device</div><div class="s" style="margin-top:10px">Last backup: today 8:02am · <u>Export</u></div></div></div>'
cal=''.join(f'<div style="border:1px solid var(--line);border-radius:12px;padding:10px;min-height:118px;background:#fff"><div class="s" style="font-weight:700;color:var(--ink)">{d}</div>'+''.join(f'<div style="margin-top:6px;font-size:11.5px;padding:4px 7px;border-radius:7px;background:{bg};color:{c};font-weight:600">{t}</div>' for t,bg,c in ev)+'</div>' for d,ev in [("Mon 26",[("Bins out","var(--greenL)","var(--green)")]),("Tue 27",[]),("Wed 28",[("Insurance quote in","var(--coralL)","var(--coral)")]),("Thu 29",[("Book vacation care","var(--amberL)","var(--amber)")]),("Fri 30",[("Stan trial ends","var(--amberL)","var(--amber)"),("Pupil-free day","var(--skyL)","var(--sky)")]),("Sat 31",[("Buy Mia's gift","var(--plumL)","var(--plum)")]),("Sun 1",[])])
needs=''.join(item(*x) for x in [("🏠","var(--coralL)","Home & contents renewal — up 27%","Due 14 Nov · 20-min shop-around ready","Compare","var(--coral)","var(--coralL)"),("🏖️","var(--tealL)","Summer: 5 days uncovered","Vacation care bookings usually open 3–6 weeks ahead","Plan","var(--teal)","var(--tealL)"),("🎂","var(--plumL)","Mia's birthday — Sat 7 Nov","Budget $60 · nothing bought yet","Gift ideas","var(--plum)","var(--plumL)"),("🛂","var(--skyL)","Sam's passport","Expires Mar 2027 · trip in Feb needs 6 months","Renew","var(--sky)","var(--skyL)")])
owners='<div class="card"><div class="t" style="margin-bottom:10px">Who carries what</div>'+''.join(f'<div style="display:flex;align-items:center;gap:10px;margin:8px 0"><div style="width:64px;font-size:13px">{n}</div><div class="bar grow" style="height:12px"><b style="width:{w}%;background:{c}"></b></div><div style="width:28px;font-size:13px;font-weight:700;text-align:right">{k}</div></div>' for n,w,c,k in [("Linh",70,"var(--coral)",23),("Sam",30,"var(--sky)",10)])+'<div class="s" style="margin-top:6px">Tap any item to hand it over. Owners show on every reminder.</div></div>'
money='<div class="card"><div class="t" style="margin-bottom:6px">Money this year</div><div style="display:flex;gap:18px"><div><div style="font-size:24px;font-weight:800">$14,820</div><div class="s">9 annual bills on radar</div></div><div><div style="font-size:24px;font-weight:800;color:var(--green)">$630</div><div class="s">saved by shopping around</div></div><div><div style="font-size:24px;font-weight:800;color:var(--amber)">$38/mo</div><div class="s">subs not opened in 60 days</div></div></div></div>'
body=f'<div class="desk" style="position:relative">{side("This week")}<div class="main"><div class="tag">Wednesday 28 October</div><div class="row" style="justify-content:space-between"><h1 style="font-size:32px">This week</h1><div class="row"><div class="btn2" style="padding:10px 16px">⬇ Update my calendar (.ics)</div><div class="btn" style="padding:10px 16px">+ Add anything</div></div></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:16px">{cal}</div><div class="cols"><div><h2 style="margin-top:0">Needs you</h2>{needs}</div><div><h2 style="margin-top:0">Household</h2>{owners}{money}</div></div></div><div style="position:absolute;right:16px;bottom:10px;font-size:11px;color:#9CA3AF">Sample data · mockup</div></div>'
open("d1_thisweek_desktop.html","w").write(HEAD%(dcss,body))

# Desktop holiday planner
wk=[("Mon","Tue","Wed","Thu","Fri")]
rows=[("22–26 Dec","SPPSS"),("29 Dec–2 Jan","SSPSP"),("5–9 Jan","MMDDV"),("12–16 Jan","VV??N"),("19–23 Jan","MM???"),("26–27 Jan","PD")]
grid='<div class="card" style="padding:18px"><div style="display:grid;grid-template-columns:130px repeat(5,1fr);gap:8px;font-size:12.5px;color:var(--mute);text-align:center"><div></div>'+''.join(f'<div style="font-weight:600">{d}</div>' for d in wk[0])
for w,code in rows:
    grid+=f'<div style="text-align:left;font-weight:650;color:var(--ink);padding-top:12px">{w}</div>'
    for c in code.ljust(5,"x"):
        if c=="x": grid+='<div style="height:44px;border-radius:10px;background:#F7F4EF"></div>';continue
        bg,lab,fc=col[c]
        grid+=f'<div style="background:{bg};color:{fc};border-radius:10px;height:44px;display:flex;align-items:center;justify-content:center;font-weight:700;{"border:2px dashed #F87171;" if c=="?" else ""}">{lab}</div>'
grid+='</div></div>'
leg=''.join(f'<span class="pill" style="background:{bg};color:{fc};margin-right:6px">{lab}</span>' for k,(bg,lab,fc) in col.items() if k!="P")
people='<div class="card"><div class="t" style="margin-bottom:10px">Leave left</div>'+''.join(f'<div style="display:flex;align-items:center;gap:10px;margin:9px 0"><div style="width:58px;font-size:13px">{n}</div><div class="bar grow" style="height:12px"><b style="width:{w}%;background:{c}"></b></div><div style="width:64px;text-align:right;font-size:12.5px">{k}</div></div>' for n,w,c,k in [("Mum",30,"var(--sky)","3 of 10"),("Dad",40,"var(--plum)","4 of 10"),("Nan",50,"var(--coral)","2 days ok")])+'</div>'
cost='<div class="card"><div class="t">Vacation care estimate</div><div style="font-size:28px;font-weight:800;margin:4px 0">$1,040</div><div class="s">4 days × 2 kids at your centre\'s $130/day, before Child Care Subsidy</div></div>'
nxt='<div class="card" style="background:var(--amberL);border-color:#FDE68A"><div class="t">Suggested next steps</div><div class="s" style="color:#92400E;line-height:1.6;margin-top:4px">1. Ask Nan to cover 14–15 Jan (sends her a sheet)<br>2. Book vacation care 21–22 Jan<br>3. Dad: 1 leave day on 23 Jan → 4-day weekend</div></div>'
body=f'<div class="desk" style="position:relative">{side("Holidays")}<div class="main"><div class="tag">NSW · Summer 2026–27 · Mia (9), Leo (6)</div><div class="row" style="justify-content:space-between"><h1 style="font-size:32px">Who\'s got the kids?</h1><div class="row"><div class="btn2" style="padding:10px 16px">Term 1 · Autumn · Winter · Spring</div><div class="btn" style="padding:10px 16px">⬇ Export plan to calendar</div></div></div><div style="margin:12px 0">{leg}</div><div style="display:grid;grid-template-columns:1.7fr 1fr;gap:20px">{grid}<div>{people}{cost}{nxt}</div></div></div><div style="position:absolute;right:16px;bottom:10px;font-size:11px;color:#9CA3AF">Sample data · dates illustrative, not official term dates</div></div>'
open("d2_holidays_desktop.html","w").write(HEAD%(dcss,body))
print("done")
