"""Run 9 - Life Admin Pass global expansion model (annual, 2027-2029, A$).
Every input is tagged SRC (sourced, see SOURCES) or ASM (assumption). Not financial, legal or tax advice.
Run: python3 run9_global_model.py  -> run9_global_model.csv (+ prints summary, writes run9_model_summary.json)
"""
import csv, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = [2027, 2028, 2029]
FX = {"AUD": 1.0, "USD": 0.7021, "GBP": 0.5264, "EUR": 0.6286, "NZD": 1.2335, "CAD": 0.9841}  # SRC RBA 27 Oct 2026, FC per A$
USD_FIXED = 0.50  # SRC Lemon Squeezy fixed fee US$0.50
HOURLY = 50.0     # ASM value of owner time A$/h (shown separately from cash)

M = {
 # households: SRC base count x ASM working-parent factor where only all families are published
 "AU": dict(name="Australia", hh=1_600_000 + 548_000, hh_note="SRC ABS 2025: 1.6M dual-employed couple families w/ child 0-14 + 548k employed one-parent families",
            cur="AUD", price=29.00, tax_incl=0.10, us=False, launch=2027, frac=1.0, reach_mult=1.00,
            one_off_cash=0, one_off_hours=0, rec_cash=0, curation_h=20),
 "NZ": dict(name="New Zealand", hh=round(569_253 * 0.70), hh_note="SRC Stats NZ 2023 Census 569,253 families w/ dependent children x ASM 0.70 working-parent share",
            cur="NZD", price=35.00, tax_incl=0.15, us=False, launch=2027, frac=0.5, reach_mult=1.00,
            one_off_cash=100/FX["NZD"] + 500 + 1500, one_off_hours=15, rec_cash=0, curation_h=6),
 "UK": dict(name="United Kingdom", hh=round(19_700_000 * 0.423 * 0.75), hh_note="SRC ONS 2024 19.7M families x 42.3% w/ dependent children x ASM 0.75 working-parent share",
            cur="GBP", price=14.99, tax_incl=0.20, us=False, launch=2028, frac=0.9, reach_mult=0.60,
            one_off_cash=205/FX["GBP"] + 500 + 1500, one_off_hours=40, rec_cash=500 + 52/FX["GBP"], curation_h=60),
 "IE": dict(name="Ireland", hh=round(540_324 * 0.75), hh_note="SRC CSO Census 2022 540,324 families in pre-school..adolescent stages x ASM 0.75",
            cur="EUR", price=17.99, tax_incl=0.23, us=False, launch=2028, frac=0.9, reach_mult=0.90,
            one_off_cash=850/FX["EUR"] + 500 + 1500, one_off_hours=15, rec_cash=500, curation_h=4),
 "US": dict(name="United States", hh=15_048_000 + 5_656_000 + 2_344_000, hh_note="SRC BLS 2025: 15.048M both-employed married couples + 5.656M employed mothers + 2.344M employed fathers (own children <18)",
            cur="USD", price=19.99, tax_incl=0.0, us=True, launch=2029, frac=0.8, reach_mult=0.25,
            one_off_cash=350/FX["USD"] + 500 + 1500, one_off_hours=80, rec_cash=0, curation_h=120),
 "CA": dict(name="Canada", hh=1_926_000, hh_note="SRC StatCan 2015 1.926M dual-earner couples w/ child <16 (dated; excludes lone parents)",
            cur="CAD", price=27.99, tax_incl=0.0, us=False, launch=2029, frac=0.8, reach_mult=0.50,
            one_off_cash=470 + 500 + 1500, one_off_hours=40, rec_cash=0, curation_h=60),
}
# one_off_cash = trademark 1 class (SRC IPONZ NZ$100, UKIPO GBP205, EUIPO EUR850, USPTO US$350; CA ~A$470 ASM verify CIPO)
#              + A$500 ASM legal/policy review per new regime + A$1,500 ASM paid-ads launch test
# rec_cash: UK A$500/yr ASM UK GDPR Art 27 representative + ICO tier-1 GBP52 (SRC; check applicability); IE A$500/yr ASM EU Art 27 representative
# curation_h: ASM hours/yr to maintain holiday dates (NZ national gazette; IE national circular; UK 153 English LAs + devolved; CA ~provinces/boards; US 13,303 districts -> top districts only)

SCEN = {  # ASM
 "low":  dict(reach1=0.015, conv=0.008, retention=0.45, refund=0.05),
 "base": dict(reach1=0.030, conv=0.015, retention=0.60, refund=0.03),
 "high": dict(reach1=0.050, conv=0.025, retention=0.75, refund=0.02),
}
REACH_GROWTH = [1.0, 1.5, 2.0]   # ASM reach multiplier by launch age (yr1, yr2, yr3)
SUPPORT_H_PER_CUST = 0.05        # ASM 3 min support per active customer per year
NON_US_INTL = 0.015; SUB_FEE = 0.005; PCT = 0.05  # SRC Lemon Squeezy

def net_per_sale(m):
    p_aud = m["price"] / FX[m["cur"]]
    ex_tax = p_aud / (1 + m["tax_incl"])            # MoR remits VAT/GST out of tax-inclusive prices
    pct = PCT + SUB_FEE + (0 if m["us"] else NON_US_INTL)
    fee = p_aud * pct + USD_FIXED / FX["USD"]        # fee on customer-paid total (US/CA tax on top ignored -> slight understatement)
    return p_aud, ex_tax - fee

GROUPS = {"AU only": ["AU"], "AU+NZ": ["AU", "NZ"], "AU+NZ+UK/IE": ["AU", "NZ", "UK", "IE"], "All (+US/CA)": ["AU", "NZ", "UK", "IE", "US", "CA"]}

def run_market(k, s):
    m = M[k]; sc = SCEN[s]; p_aud, nps = net_per_sale(m)
    active = 0.0; rows = []; cum_cash = 0.0; cum_time = 0.0; be_cash = be_time = None
    for y in YEARS:
        age = y - m["launch"]
        if age < 0:
            rows.append(dict(market=k, scenario=s, year=y, new=0, active=0, net_rev=0, cash_cost=0, hours=0, contrib_cash=0, contrib_incl_time=0, cum_cash=0, cum_incl_time=0)); continue
        frac = m["frac"] if age == 0 else 1.0
        new = m["hh"] * sc["reach1"] * m["reach_mult"] * REACH_GROWTH[min(age, 2)] * sc["conv"] * frac
        active = active * sc["retention"] + new
        paid_units = active - new * sc["refund"]
        net_rev = paid_units * nps
        cash = (m["one_off_cash"] if age == 0 else 0) + m["rec_cash"] * frac
        hours = (m["one_off_hours"] if age == 0 else 0) + m["curation_h"] + active * SUPPORT_H_PER_CUST
        cc = net_rev - cash; ct = cc - hours * HOURLY
        cum_cash += cc; cum_time += ct
        if be_cash is None and cum_cash >= 0: be_cash = y
        if be_time is None and cum_time >= 0: be_time = y
        rows.append(dict(market=k, scenario=s, year=y, new=round(new), active=round(active), net_rev=round(net_rev), cash_cost=round(cash),
                         hours=round(hours), contrib_cash=round(cc), contrib_incl_time=round(ct), cum_cash=round(cum_cash), cum_incl_time=round(cum_time)))
    return rows, be_cash, be_time, p_aud, nps

def main():
    out = []; summary = {"markets": {}, "groups": {}, "net_per_sale": {}}
    for k in M:
        p_aud, nps = net_per_sale(M[k]); summary["net_per_sale"][k] = dict(price_local=f'{M[k]["price"]} {M[k]["cur"]}', price_aud=round(p_aud, 2), net_aud=round(nps, 2))
    for s in SCEN:
        for k in M:
            rows, bc, bt, _, nps = run_market(k, s); out += rows
            fy = next(r for r in rows if r["new"] > 0 or r["year"] == YEARS[-1])
            m1 = fy["net_rev"] / 12 if fy["net_rev"] else 0
            payback_m = round(M[k]["one_off_cash"] / m1, 1) if m1 > 0 and M[k]["one_off_cash"] else (0 if not M[k]["one_off_cash"] else None)
            summary["markets"].setdefault(k, {})[s] = dict(rev_2029=rows[-1]["net_rev"], cum_cash_2029=rows[-1]["cum_cash"], cum_incl_time_2029=rows[-1]["cum_incl_time"],
                                                          breakeven_cash=bc, breakeven_incl_time=bt, launch_cash_payback_months=payback_m, active_2029=rows[-1]["active"], hours_2029=rows[-1]["hours"])
        for g, ks in GROUPS.items():
            for y in YEARS:
                rr = [r for r in out if r["scenario"] == s and r["year"] == y and r["market"] in ks]
                row = dict(market=g, scenario=s, year=y, **{f: sum(r[f] for r in rr) for f in ["new", "active", "net_rev", "cash_cost", "hours", "contrib_cash", "contrib_incl_time"]})
                row["cum_cash"] = row["contrib_cash"] + sum(o["contrib_cash"] for o in out if o["market"] == g and o["scenario"] == s and o["year"] < y)
                row["cum_incl_time"] = row["contrib_incl_time"] + sum(o["contrib_incl_time"] for o in out if o["market"] == g and o["scenario"] == s and o["year"] < y)
                out.append(row)
                summary["groups"].setdefault(g, {}).setdefault(s, {})[y] = {f: row[f] for f in ["net_rev", "cash_cost", "hours", "contrib_cash", "contrib_incl_time", "active"]}
    with open(os.path.join(HERE, "run9_global_model.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
    json.dump(summary, open(os.path.join(HERE, "run9_model_summary.json"), "w"), indent=1)
    print(json.dumps(summary["net_per_sale"], indent=1))
    for g in GROUPS:
        print(g, {s: [summary["groups"][g][s][y]["net_rev"] for y in YEARS] for s in SCEN}, "base contrib_incl_time", [summary["groups"][g]["base"][y]["contrib_incl_time"] for y in YEARS], "hours", [summary["groups"][g]["base"][y]["hours"] for y in YEARS])
    for k in M: print(k, summary["markets"][k]["base"], "| low", summary["markets"][k]["low"]["cum_incl_time_2029"], "high", summary["markets"][k]["high"]["cum_incl_time_2029"])

if __name__ == "__main__":
    main()
