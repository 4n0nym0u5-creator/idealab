# SideHustle idea rubric (version 1.0, set in Run 1, 27 Oct 2026)

Use this to score small software products for a solo, AI-assisted builder in Sydney who wants a portfolio
of low-risk, broadly useful apps with small, scalable or recurring income.
Every criterion is scored 0-5 as a whole number, where **5 is always good for the builder**. "Inverted"
criteria (risk, effort, burden, competition, dependency) are already flipped: 5 = least risk/effort.

**Total = Σ (score ÷ 5 × weight)**, which gives 0-100. Weights add up to 100.
If you change a weight or level definition, bump `rubric_version`, note it in the run log, and re-score
the shortlist so totals stay comparable.

| Key | Criterion | Weight |
|---|---|---|
| legal | Regulatory, legal & liability safety (inverted risk) | 16 |
| pain | Pain intensity × frequency | 11 |
| distro | Distribution & discoverability | 11 |
| wtp | Willingness to pay & monetisation fit | 10 |
| breadth | Breadth of audience | 8 |
| recurring | Recurring-revenue potential | 8 |
| build | Build effort for a solo AI-assisted builder (inverted) | 8 |
| maint | Ongoing maintenance & support burden (inverted) | 8 |
| compete | Competition & saturation (inverted) | 6 |
| synergy | Portfolio synergy (shared code, audience, channel) | 5 |
| platform | Platform dependency risk (inverted) | 5 |
| defend | Defensibility | 4 |

## Level definitions

### legal: regulatory, legal & liability safety (16)
- 5: No regulated domain. No personal data stored server-side (local-first, or stores only the buyer's email). Can't cause money, safety or data loss. No third-party ToS or IP exposure.
- 4: Light personal data (names/emails of the user's own contacts) or file operations with undo, OR a third-party API used within its terms. Standard privacy policy + ToS + ACL-compliant refund policy is enough.
- 3: Touches a regulated area as a record-keeping tool only (tax records, tenancy evidence), OR holds third parties' personal data (members, attendees, tenants), OR involves minors' data indirectly. Needs clear disclaimers and checking the rules each year.
- 2: Output people act on in a regulated area (pay calculations, recording calls, compliance claims), or heavy Gmail/Drive data. Needs legal review.
- 1: Gives advice in a regulated domain (health, finance, legal, food safety, employment awards), or the product depends on scraping or ToS-grey automation.
- 0: Licensed activity or likely illegal (medical device, financial product advice, handling client money, gambling, children's data as the core, DRM bypass).

### pain: intensity × frequency (11)
- 5: Hurts weekly or more, costs money or real time (e.g. chasing unpaid invoices), and people already pay for workarounds.
- 4: Weekly friction people complain about in public, OR an episodic but acute pain (weddings, moving house).
- 3: A regular annoyance with clumsy workarounds.
- 2: Nice to have; mild annoyance.
- 1: Novelty.
- 0: No evidence anyone cares.

### breadth: audience size (8)
- 5: Tens of millions worldwide (all Mac users, all office workers, all homeowners).
- 4: Millions (all remote workers, all Xero users, all event hosts).
- 3: Hundreds of thousands (Shopify micro-merchants, indie devs, club secretaries).
- 2: Tens of thousands (one trade in one country).
- 1: Thousands.
- 0: Only the founder.

### wtp: willingness to pay & monetisation fit (10)
- 5: Business buyers with a direct ROI (saves money or brings it in), and A$15+/month is easy to justify.
- 4: Professionals or prosumers who routinely pay US$15-40 one-time or US$5-15/month for tools in this space (evidence: paid competitors with reviews).
- 3: Consumers will pay US$5-15 once; comparable paid apps exist.
- 2: Mostly free alternatives; payment would be tips or micro-prices.
- 1: Ads or affiliate only.
- 0: No monetisation path.
- Feeder rule: if wtp ≤ 2 AND recurring ≤ 1, the idea is marked status `feeder`. It's a free SEO or lead tool that supports paid products, and it never goes on the shortlist by itself.

### recurring: recurring revenue potential (8)
- 5: Ongoing value for a business: subscription is natural and churn is low (runs monthly ops).
- 4: Subscription is justified by ongoing sync, data or service. Consumers may churn.
- 3: Annual or seasonal repeat (yearly tax-time log, yearly paid upgrades).
- 2: Occasional repeat purchases (per event, per project).
- 1: One-time only; paid major versions are possible.
- 0: One-off use, no repeat.

### build: effort for a solo AI-assisted builder (8, inverted)
- 5: MVP takes 40 hours or less; one platform, no backend.
- 4: 40-100 hours (Shoji/SpaceJump class: SpaceJump took 88 h); one platform, licence server only.
- 3: 100-200 hours; needs a backend, OAuth, or a third-party API integration and app review.
- 2: 200-400 hours; several integrations, mobile + web, or tricky OS APIs (audio drivers).
- 1: 400+ hours or needs specialist skills.
- 0: Needs a team.

### maint: maintenance & support burden (8, inverted)
- 5: Static or local app; breaks only with major OS releases; under 1 h/week support.
- 4: Small backend (licences) plus yearly OS updates; 1-2 h/week.
- 3: Depends on third-party APIs that change; or customer data where support questions are about "my data".
- 2: Scraping or DOM-dependent UI, or uptime-critical services; frequent breakage.
- 1: Heavy support (onboarding businesses, migrations, phone calls).
- 0: Needs 24/7 on-call.

### distro: distribution & discoverability (11)
- 5: High-intent search queries you can own ("how to open parquet file on mac", "wedding seating chart maker"), AND/OR a marketplace with built-in search where the niche is thin (Xero/Shopify/Workspace/Chrome store), AND the problem gets asked in AI answer engines.
- 4: Clear search terms or marketplace category with moderate competition; communities where the users gather and allow self-promotion.
- 3: Reachable via communities, Product Hunt, Reddit; no strong search intent.
- 2: Needs outbound sales or an existing audience.
- 1: Needs paid ads or virality.
- 0: No known channel.

### compete: competition & saturation (6, inverted)
- 5: No credible product solves it; only forum workarounds.
- 4: 1-2 weak or abandoned options, or the incumbents ignore this sub-niche.
- 3: A few paid competitors, but there's room for a simpler, cheaper, or local-first angle.
- 2: Established leaders plus many clones; differentiation has to be sharp.
- 1: Saturated, with strong free options.
- 0: Owned by the platform itself (a native OS/app feature) or by free market leaders.

### defend: defensibility (4)
- 5: Data network effects, official partner status, or switching costs from accumulated data.
- 4: Accumulated user data/history, plus SEO moat and reviews.
- 3: Brand, reviews and SEO rank you earned (marketplace reviews compound).
- 2: Execution polish only.
- 1: Easily cloned in a weekend.
- 0: The platform owner will ship it next release.

### synergy: portfolio synergy (5)
Score against the current portfolio anchors: (a) the native Mac utility shell (Swift menu-bar app + licensing + Sparkle updates + landing page template), (b) the local-first web tool shell (client-side/WASM + Stripe or Dodo checkout), (c) the SaaS-integration shell (OAuth + marketplace listing), (d) the indie-maker and small-business audiences.
- 5: Reuses one shell almost entirely AND sells to an audience you already have or cross-sells naturally.
- 4: Reuses one shell OR one audience.
- 3: Partial reuse.
- 2: New stack and new audience, but the lessons transfer.
- 1: Unrelated.
- 0: Conflicts with your brand (e.g. ad-heavy site next to privacy-first apps).

### platform: platform dependency risk (5, inverted)
- 5: Runs on open web/OS with stable public APIs; no gatekeeper review required.
- 4: Store distribution with clear rules (Mac notarisation, App Store), or a stable API.
- 3: Depends on one marketplace's review and billing (Shopify, Xero, Workspace with non-restricted scopes) or uses private OS APIs.
- 2: Depends on a vendor's API that can be revoked or repriced, or the vendor is likely to clone you.
- 1: Depends on DOM scraping of one site, or restricted Google scopes (annual CASA assessment).
- 0: Against the platform's ToS.

## Hard kill criteria (auto-status `killed`, regardless of total)
1. legal ≤ 1.
2. Gives personalised medical, dietary, financial, tax, legal or employment-award advice, or acts as a medical device (TGA SaMD).
3. Holds or moves customer money (payments facilitation, wallets), or is crypto, gambling or lending.
4. Core users are children under 16, or the product stores children's data.
5. Core function needs scraping against ToS, bypassing paywalls or DRM, or automating accounts in breach of ToS (LinkedIn, Instagram).
6. Safety-critical outputs (allergens, medication dosing, vehicle, electrical compliance certificates).
7. Records people or communications without explicit consent (state surveillance-devices laws).
8. Built mainly on someone else's IP or trademarks (fan maps, rulebook content) with no licence.
9. Needs Gmail/Drive restricted scopes AND can't fund the yearly CASA assessment (Google cites US$500-4,500).
Record the reason in `kill_flags`. A killed idea stays in the file so future runs don't re-research it.

## Tie-breakers (when totals are within 2 points)
1. Higher `distro` (distribution is the constraint for most indie apps: Roadie, a well-built US$9.99 Mac app, made US$52 all-time).
2. Higher `legal`.
3. Faster to build (`build`).

## Calibration anchors (use these to keep scores consistent across runs)
- Shoji (shojimac.com) as a product: legal 5, pain 3, breadth 4, wtp 3, recurring 1, build 3, maint 3, distro 3, compete 1, defend 2, synergy 5, platform 4.
- MacMD Viewer: distro 5 (owns "read markdown on Mac" search), wtp 3, recurring 1.
- TranscriptExporter: pain 4, distro 5, platform 2 (now on the official API), compete 4.

## Addendum (Run 2): security-specific guidance for the `legal` criterion
This is a clarification only; the weights are unchanged and the rubric stays at v1.0.
- 5: local, read-only, advisory. No credentials, no network scanning (e.g. Mac login-items viewer, checklists).
- 4: passive checks of public data for domains or accounts the user adds (DNS, certs, headers); official read-only APIs with tokens kept on the device; HIBP Pwned Passwords via k-anonymity.
- 3: hosted monitors whose silent failure causes harm; compliance-style outputs (Essential Eight, insurance prep, questionnaires); scanning a user's own assets after an ownership check; holding personal information (Privacy Act/NDB if covered).
- 2: credential or identity-document handling; acting as someone's legal agent; anything close to legal advice (whether an NDB notification or ransomware report is required); simulated phishing sends.
- 0-1 / kill_flags: credential custody (password vaults), scanning third-party systems without permission (Criminal Code Part 10.7), offensive or dual-use tooling, OSINT people lookup, stalkerware or monitoring of other people, building a breach search engine (HIBP ToS).
- Design rules: never claim to make anyone "secure" or "compliant"; never give a "safe" verdict; alert on your own failures (heartbeats); verify ownership before any active check; keep secrets local.
- Put soft risks in `notes`, not `kill_flags`, because any kill flag auto-kills the idea.
