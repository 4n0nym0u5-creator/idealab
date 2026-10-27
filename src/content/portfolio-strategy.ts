export const GLANCE = "Build small paid web apps that store everything on the user's own device. Sell them through a merchant of record, which handles payment, GST and licence keys, so no personal data reaches your servers. Order the builds by seasonal deadlines and shared code: Christmas gifts now, the New Year time audit next, then school holidays, then weddings before spring, then the garden planner before spring planting. In late 2027, fold the household tools into the Life Admin Pass. Seating ranks first on fit, but it comes fourth because it has the hardest interface and its buyers plan around spring weddings.";

export const KEY_DECISION = "Treat the zero-private-data rule as a product feature: no accounts, no database, no reminder emails. Reminders are `.ics` files with alarms that the user's own calendar fires. Sharing works through an exported file or an end-to-end-encrypted link. The cost is that you cannot email users about their data, and users can lose data if they never export it.";

export const LENS = [
  ["Viability (V)", "0.35 AI-buildability + 0.25 legal safety + 0.20 build size + 0.20 maintenance burden, each out of 5. Build, maintenance and legal are inverted, so 5 means easiest or safest."],
  ["Opportunity (O)", "0.25 pain + 0.25 willingness to pay + 0.25 distribution access + 0.10 breadth + 0.15 monetisation fit. Pain gets +0.5 when complaint frequency (CFS) is 2.5 or more, or +0.25 at 2.0 or more. Monetisation fit is the recurring score if it is 3 or more; otherwise 3 if people will pay once (WTP 3 or more), else 2."],
  ["Why a geometric mean", "An idea needs both. A trivial build nobody pays for, or a great market a non-engineer cannot build, both score low."],
  ["Privacy factor", "A (fully local) 1.0 · B (local plus user-owned sync or E2E-encrypted blobs) 0.95 · C-redesign 0.85 · C-disqualified 0."],
  ["Audience factor", "Business ideas ×0.9, because the brief is a consumer portfolio."],
  ["Tiers", "Build now = roadmap slots 1–2 · Next = slots 3–6, including Pass modules · Later = slots 7–8 or fit of 68 or more · Feeder = free lead-magnet tools · Park = disqualified or fit under 68."],
  ["Monetisation rule", "One-time for occasional or occasion tools with no ongoing cost. Annual only where value or cost is ongoing, such as term dates, planting seasons or the Pass. Both = lifetime unlock plus an optional annual for updates."],
  ["Judgement calls", "The weights are version PL 1.0, not data. Privacy classes are hand-set for about 60 ideas and keyword-based for the rest; check any new idea with sharing, reminders, OAuth or uploads by hand."],
] as const;

export const THIRD_PARTY = "Bank feeds: use a CSV file the user downloads from their bank and the browser parses (envelope budget, spending insights, subscription tracker). Email scanning: none; there is no client-side path that keeps the value, so the inbox parser is disqualified. Calendar OAuth: start from an exported `.ics` file. A later Google Calendar version can use a browser-held read-only token, but it needs Google verification for a sensitive scope. Social and LLM APIs: only with the user's own key, called from the browser.";

export const GANTT: string[][] = [
  ["1", "GiftLedger", "Launch", "Sell + maintain", "Sell + maintain", "Sell + maintain", "Sell + maintain", "Sell + maintain", "Sell + maintain"],
  ["2", "TimeAudit", "Build", "Launch", "Sell + maintain", "Sell + maintain", "Sell + maintain", "Sell + maintain", "Sell + maintain"],
  ["3", "HolidayPlanner AU", "", "Launch", "Sell + maintain", "Sell + maintain", "Sell + maintain", "Sell + maintain", "Sell + maintain"],
  ["4", "SeatPlan", "", "Build", "Launch", "Sell + maintain", "Sell + maintain", "Sell + maintain", "Sell + maintain"],
  ["5", "BedPlanner AU", "", "", "Build", "Launch", "Sell + maintain", "Sell + maintain", "Sell + maintain"],
  ["6", "Life Admin Pass", "", "", "", "Build", "Launch", "Sell + maintain", "Sell + maintain"],
  ["7", "RunSheet", "", "", "", "", "Build", "Launch", "Sell + maintain"],
  ["8", "TakeoutFixer (optional)", "", "", "", "", "", "Build", "Launch"],
];

export const NOT_ON_ROADMAP = "High-fit ideas not in the roadmap: the creator media kit (fit 81.9) targets a different audience with free Canva-style templates. The funeral order-of-service maker (77.8) is a sensitive moment that needs careful marketing. The meal planner (77.2, CFS 3.2) is a crowded category. Any of them could replace slot 8 if an earlier app is killed.";

export const FAMILIES: string[][] = [
  ["Life Admin Pass", "GiftLedger, HolidayPlanner AU, Pass (slot 6)", "Renewals calendar, bills calendar, insurance creep log, warranties, pets, home maintenance, travel docs", "Dated-item store, .ics alarm export, printable views, household export file", "AU households; parents' groups, SEO 'NSW school holidays 2027', OzBargain freebies"],
  ["Events & occasions", "SeatPlan, RunSheet", "Guest list (redesigned), kids' party, hens/bucks (organiser-only), cookbook, funeral order of service", "Drag-drop canvas, guest CSV import, print/PDF, share-as-file", "Couples and planners; Pinterest, r/weddingplanning, venue and planner partners"],
  ["Time & calendar", "TimeAudit", "Visual day planner, study timetable, habit tracker, Google Calendar audit (later)", ".ics parser, charts, week grid", "Knowledge workers and students; SEO per calendar app, r/productivity, Product Hunt"],
  ["Home & garden AU", "BedPlanner AU", "Plant care schedule, gallery wall, room fit, moving boxes, home inventory", "Grid/drag-drop layout, AU climate data, .ics seasonal reminders", "AU gardeners; r/AusGardening, Pinterest, community gardens, garden clubs"],
  ["Local file & photo tools", "TakeoutFixer (optional)", "Duplicate photo cleaner, PDF toolkit, EXIF scrubber, subtitle fixer", "File System Access/OPFS, Web Workers, WASM", "Global; 'no upload' SEO, r/DataHoarder, r/googlephotos"],
  ["No-subscription money tools", "None yet", "Envelope budget (CSV), trip splitter (E2E share), sinking fund calculator", "CSV import, local ledger", "r/AusFinance, no-subscription directory as the marketing hub"],
];

export const DIRECTORY_NOTE = "The no-subscription app directory (rubric 78.6) works best as the portfolio's own marketing asset and email-list magnet: it lists one-time-purchase apps, including ours, rather than earning money itself.";

export const DISTRIBUTION: string[][] = [
  ["GiftLedger", "SEO: 'Christmas gift list template', 'gift budget planner'", "Secret Santa with exclusions; printable list", "r/Christmas, r/Frugal, OzBargain freebie post", "Pinterest printable pins; TikTok 'how much I spend on Christmas'", "Product Hunt (Dec), no-subscription directory"],
  ["TimeAudit", "SEO: 'export Google Calendar .ics', 'where did my time go'", "Free 4-week summary", "r/productivity, r/ADHD (only where allowed), Hacker News 'Show HN'", "Short screen recordings of real (fake-data) audits", "Product Hunt (Jan), indie newsletters"],
  ["HolidayPlanner AU", "Programmatic SEO: state × year × term pages", "Free single-state planner; .ics of term dates", "Local Facebook parents' groups, r/AusParents, r/Parenting", "Short 'how we cover 12 weeks of holidays'", "School P&C newsletters, OSHC providers"],
  ["SeatPlan", "SEO: 'wedding seating chart template', 'seating chart for round tables'", "Free up to 40 guests; table-shape calculator", "r/weddingplanning, r/AusWeddings, Easy Weddings forums", "Pinterest (main), TikTok before/after charts", "Venues, planners and celebrants (referral code), wedding expos"],
  ["BedPlanner AU", "SEO: 'what to plant in [month] [climate zone] Australia'", "Free planting calendar per zone", "r/AusGardening, r/vegetablegardening, Facebook garden groups", "Pinterest layouts, Reels of bed plans", "Community gardens, garden clubs, Gardening Australia-style newsletters"],
  ["Life Admin Pass", "Bundle page + every feeder's upgrade prompt", "Life admin audit quiz, ICE sheet", "r/AusFinance, Whirlpool, parents' groups", "Carousel 'the 14 dates every household forgets'", "Upgrade credit for earlier buyers"],
  ["RunSheet", "In-app cross-sell from SeatPlan; SEO 'event run sheet template'", "Free run-sheet template", "r/eventplanning, MC/celebrant groups", "Templates on Pinterest", "Same wedding partners as SeatPlan"],
];

export const DISTRIBUTION_RULES = [
  ["Reddit and forums without spamming", "Read each subreddit's self-promotion rule first. Answer the question fully in the comment, and link the free tool only where the rules allow it and it actually answers the question. Keep a ratio of at least 9 helpful comments to 1 link. Never post the same link across subreddits, and use one honest account."],
  ["Programmatic SEO", "One template, many pages from real data: term dates by state and year, planting by climate zone and month, seating by table count and shape, calendar export steps by app. Each page must have a working tool on it, not just text. Thin AI pages are a risk with search engines."],
  ["Lifetime-deal sites", "Only for one-time apps, only after organic sales prove demand, and only with a cap. These sites take a large cut and attract support-heavy buyers. Never use them for annual products like the Pass."],
  ["App directories", "Product Hunt (one launch per app, timed to its season), the no-subscription directory, AlternativeTo listings against subscription incumbents, PWA directories."],
  ["Cross-selling", "One brand footer and an 'Our other one-time apps' page in every app, plus a thank-you page after each purchase with a discount on the next app in the same family. The Pass offers upgrade credit for earlier one-time purchases. The licence email from the merchant of record can carry the cross-sell (transactional, so check the Spam Act)."],
  ["Email list (the one piece of personal data you collect)", "Collect only an email address, through a reputable email processor's hosted form, never your own database. Use an unticked consent box and a double opt-in. Every email identifies you (name or ABN) and carries a one-click unsubscribe that is honoured within 5 working days. This is required by the Spam Act 2003 regardless of business size, and the email is personal information under the Privacy Act."],
] as const;

export const TIME_BUDGET: string[][] = [
  ["Building with AI agents", "4", "Write the spec, run Cursor cloud agents, review the preview, test on a phone. During launch months it rises to 6, and distribution falls to 2."],
  ["Distribution", "3", "2 helpful community answers a day on weekdays, 1 SEO page or template, 3–5 Pinterest pins, 1 short video."],
  ["Support and maintenance", "1.5", "Merchant-of-record emails, refunds, bug triage, the yearly data refresh (term dates, planting calendars)."],
  ["Review and admin", "1.5", "Weekly metrics (analytics plus MoR dashboard), kill/continue decisions, bookkeeping exports."],
];

export const BUILD = [
  ["Stack", "Next.js with static export (`output: 'export'`), Tailwind, a service worker for offline use, Dexie on IndexedDB for records, OPFS for photos and files, zod schemas for every saved record, `@dnd-kit` for drag-and-drop, browser print CSS for PDFs, and a tiny `.ics` writer. No API routes and no database. A Content-Security-Policy `connect-src` allow-list (merchant of record plus analytics only) makes 'no data leaves the device' something you can test."],
  ["Template repo (build once, in slot 1)", "`/lib/store` (versioned schema and migrations), `/lib/backup` (export/import JSON, backup reminder, `navigator.storage.persist()` request), `/lib/licence` (activate/validate a key against the MoR licence API from the browser, cache it locally, 30-day offline grace), `/lib/ics` (events plus VALARM reminders), `/components/Paywall`, `/components/PrintView`, `/app/privacy` and `/app/terms` pages, Playwright tests, and a `SPEC.md` the agents read first."],
  ["Licence keys without a server", "The buyer pays on the MoR's hosted checkout and gets a key by email from the MoR. The app sends that key straight from the browser to the MoR's licence API, never through your server. A determined person can bypass a client-side check; at A$15–39, accept that."],
  ["When native/Capacitor is worth it", "Only once an app makes about A$1k a month on the web and users ask for it, or when you need reliable iOS storage, home-screen presence or App Store search. Capacitor wraps the same code. Selling the unlock inside an iOS app then means Apple in-app purchase rules and Apple's commission."],
  ["Hosting", "Vercel Pro (Hobby is for non-commercial use), with all apps as projects on one team. Static sites invoke no functions, so runtime logs stay close to empty. Cloudflare Pages is a fallback."],
] as const;

export const PAYMENTS: string[][] = [
  ["Lemon Squeezy (MoR, Stripe-owned)", "5% + 50¢; +1.5% non-US cards, +0.5% subscriptions, +1.5% PayPal", "MoR collects and remits sales tax/VAT/GST", "Built in, with a public licence API", "Buyer name/email/country in the LS dashboard", "Good for v1; keep an exit plan (Jan 2026: team moving to Stripe Managed Payments)"],
  ["Polar (MoR)", "5% + 50¢; +1.5% international", "MoR", "Built in", "Same", "Good alternative for v1"],
  ["Paddle (MoR)", "5% + 50¢ all-in; products under US$10 'contact sales'", "MoR", "Not built in (use a licence service or signed keys)", "Same", "Best for subscriptions at scale"],
  ["Stripe Managed Payments (MoR)", "3.5% on top of Stripe processing (AU: 1.65% + A$0.30 domestic, 3.5% + A$0.30 international cards)", "Stripe acts as MoR", "No", "Same", "Watch; likely LS's successor"],
  ["Stripe direct (not MoR)", "1.65% + A$0.30 domestic, 3.5% + A$0.30 international", "You are the seller: register for GST at A$75k turnover; overseas VAT/GST is yours", "No", "You get customer data via webhooks, which needs a server", "Breaks the no-server rule"],
  ["Gumroad", "10% + 50¢ plus processing (third-party summary)", "MoR", "Built in", "Same", "Too expensive at scale"],
  ["Apple App Store", "15% via Small Business Program (up to US$1M proceeds; must enrol), else 30% (subs 15% after year 1)", "Apple handles", "In-app purchase", "Apple holds it", "Only after web traction"],
  ["Google Play", "AU from 30 Sep 2026: 10% service + 5% billing on first US$1M (third-party summary of Google's fee page)", "Google handles", "Play Billing", "Google holds it", "Only after web traction"],
];

export const PAYMENT_NOTES = [
  ["All-in cost", "On an A$19 sale via a 5% + US$0.50 MoR, the fee is about A$1.70, or about A$2.00 with Lemon Squeezy's +1.5% for non-US cards (9–11%). Small prices make the fixed 50¢ hurt, so don't go below about A$9."],
  ["GST", "The MoR is the seller to the customer and collects GST on Australian sales. ATO guidance says sales where a platform or merchant is responsible for the GST are handled by it. You still register for GST if your own GST turnover reaches A$75,000. Confirm how your MoR's payouts are treated with an accountant."],
  ["App-store rules", "Digital unlocks sold inside iOS apps must use Apple in-app purchase in most regions. US rules on linking to outside purchases are still being litigated (Epic v. Apple), so don't plan around them. Web-first avoids both the rules and the fees."],
] as const;

export const QA = [
  ["Testing with AI agents", "Every app ships with Playwright tests that agents write and run: an export-then-import round trip, offline reload, licence activate/expired/offline, a Safari/iOS smoke test, and a 'no unexpected network requests' test that fails if the page calls any domain outside the CSP allow-list. Fixture files (sample .ics, CSV and Takeout folders) live in the repo. A second agent reviews each pull request against SPEC.md."],
  ["Maintenance budget", "Target 1 hour a week per live app, and kill or freeze apps that need more. Yearly data refresh: term dates (HolidayPlanner, Pass), planting calendars (BedPlanner). Update dependencies monthly with one agent PR per repo, merged after tests pass."],
  ["How to scope an MVP", "One job, one main screen, one export. Free tier = enough to feel the value; paid unlock = limits removed, print/PDF, .ics, and templates. Ship within the build-week budget; anything else goes in LATER.md."],
  ["What to avoid", "Accounts and passwords, any database of user records, reminder emails or SMS, OAuth into inboxes, accounting or Shopify, AI features that send user data to your API key, realtime multi-user sync, native-first builds, health or children's records, and lifetime deals on subscription products."],
] as const;

export const PRIVACY_PATTERNS: string[][] = [
  ["Local-only (class A)", "IndexedDB via Dexie for records, OPFS for files and photos, nothing uploaded", "Every roadmap app"],
  ["Client-side parsing", "The user picks a file (.ics, bank CSV, Takeout folder) and it is parsed in the browser, or in a Web Worker or WASM", "TimeAudit, TakeoutFixer, envelope budget"],
  ["Reminders without email", "Download an .ics with VALARM alarms, so the user's calendar does the reminding", "HolidayPlanner, BedPlanner, Pass"],
  ["User-owned sync (class B)", "Save or export to a file in the user's iCloud Drive/Google Drive/Dropbox folder (File System Access API on desktop Chromium; share sheet on iOS)", "Pass households, SeatPlan between partners"],
  ["E2E-encrypted share link (class B)", "Encrypt in the browser (WebCrypto AES-GCM). The server stores only the ciphertext with an expiry; the key goes in the URL #fragment, which browsers never send", "RunSheet live view, trip splitter (v2 only)"],
  ["Cookieless analytics", "Umami (free Hobby tier: 100k events/month) or Plausible (from US$9/month): page counts and custom events only, with no app data in event names", "All apps"],
];

export const STILL_PI = [
  ["Buyer details at the merchant of record", "Name, email, country, IP address and partial card data sit in the MoR's systems, and you can see them in its dashboard. You don't store them, but you handle them; list this in the privacy policy."],
  ["Licence keys", "A key is linked to the buyer's email at the MoR. Your app sends it straight to the MoR, never via your server."],
  ["Hosting logs", "Vercel runtime logs record requests with request metadata (its log filter matches IP address and user agent). Retention is 1 hour on Hobby and 1 day on Pro, or 30 days with Observability Plus, which is on by default for Pro teams created or upgraded from 3 Apr 2026. Exclude the app projects from Observability Plus. Static pages make few function logs, but the CDN still sees IP addresses."],
  ["Error tracking", "Don't run Sentry-style automatic capture, because it can include user content. Instead, add a 'Report a problem' button that shows the user exactly what will be sent (app version, browser, error text, no data) before it opens an email."],
  ["Email list and support email", "The email list is personal information held by the email processor on your behalf. Support emails often contain user data that people paste in; delete old threads on a schedule."],
  ["E2E share blobs", "Even ciphertext linked to an IP address is arguably personal information. Keep expiry short, add no identifiers, and get a lawyer's view before launching any class-B relay."],
] as const;

export const LAW = [
  ["Small business exemption", "Still in force. Businesses with A$3M or less annual turnover are generally not bound by the APPs. Exceptions apply regardless of turnover: health service providers, businesses that trade in personal information, Commonwealth contractors, and those that opt in. Design as if the APPs apply anyway, because the exemption is expected to go."],
  ["Reform status", "Tranche 1 (Privacy and Other Legislation Amendment Act 2024) kept the exemption. Its statutory tort for serious invasions of privacy started on 10 Jun 2025 and applies to everyone, exempt or not. Its automated-decision privacy-policy rules start on 10 Dec 2026. Tranche 2 exists only as an exposure draft (Privacy Amendment (Personal Data Protection) Bill 2026, released 31 Aug 2026, submissions closed 18 Sep 2026). It is not law. Commentators say it keeps the exemption but rewrites the trading-in-personal-information rule. The government agreed in principle in 2023 to remove the exemption after consultation."],
  ["Spam Act 2003", "Applies to every business: consent, sender identification and an unsubscribe honoured within 5 working days."],
  ["Children", "Design for adults; kids appear only as first names and dates. The OAIC Children's Online Privacy Code is being developed (due by 10 Dec 2026; see the Idea Lab Run 5 notes)."],
  ["GDPR (selling to the EU)", "GDPR can apply to a non-EU business that offers goods or services to people in the EU (Art. 3(2)). The MoR acts as a controller for payment data, but you are the controller for whatever you process yourself: the email list, analytics, support emails and any share blobs. Data that stays on the user's device and never reaches you keeps your footprint small. You may need an EU representative (Art. 27) unless your processing is occasional and low-risk. Get advice before EU marketing at scale."],
  ["Worth a lawyer's review", "1) Privacy policy and terms before the first sale (one review covers the template for all apps). 2) Any class-B E2E relay. 3) Pass subscription terms and cancellation. 4) Anything touching health or children. 5) Opting into or targeting the EU/UK."],
] as const;

export const DATA_LOSS = [
  "Safari can delete script-writable storage, including IndexedDB, for a site used in a Safari tab and not interacted with for 7 days. Home Screen web apps are exempt, so prompt iPhone users to 'Add to Home Screen'.",
  "Call navigator.storage.persist() after the first save. Persistent storage protects IndexedDB and OPFS from automatic eviction; browsers grant it based on heuristics.",
  "Show a 'Last backed up' badge, and prompt an export after the first meaningful edit, then every 7 days or 20 edits.",
  "Make the exported file restore-complete: one JSON file with a schema version that imports on any device. Test it in CI.",
  "On desktop Chromium, offer 'Save to a folder' (File System Access API) for continuous autosave into the user's own cloud folder.",
  "State plainly in onboarding and the terms: 'Your data lives only on this device. We cannot recover it.'",
];

export const POLICY = [
  "Who we are (name/ABN, contact email).",
  "The short version: your app data stays on your device; we never see it.",
  "What we do collect: email (if you subscribe), and purchase details via our merchant of record (named, with a link to its policy).",
  "Analytics: cookieless, aggregate, no app content.",
  "Hosting logs: provider, purpose, retention.",
  "Support emails: what we keep and for how long.",
  "Optional sharing features: what the encrypted link contains and when it expires.",
  "Overseas disclosure: MoR, email processor and host locations.",
  "Your rights: access, correction, deletion, unsubscribe, and complaints to the OAIC (plus EU rights if applicable).",
  "Children: not directed at children.",
  "Changes and effective date.",
];

export const CHECKLIST: string[][] = [
  ["No unexpected network calls", "Playwright test plus the CSP connect-src allow-list are green"],
  ["No accounts", "No login, no stored email in the app"],
  ["Backup", "Export/import round trip passes; reminder appears; persist() requested"],
  ["Analytics", "Cookieless tool; no user content in events"],
  ["Logs", "Observability Plus excluded; no console.log of user data"],
  ["Payments", "MoR hosted checkout; licence check from the browser to the MoR"],
  ["Sharing", "File export by default; E2E link only after legal review"],
  ["Policy", "Privacy policy annex and terms published; 'data lives on this device' in onboarding"],
  ["Sensitive data", "No health, ID numbers, financial account numbers or children's details beyond first names"],
];

export const RISKS = [
  ["High", "Distribution, not building", "Most small apps never find buyers. Seasonal launches and free tools help, but the low scenario is realistic for a first year."],
  ["Medium", "Users lose local data", "Safari eviction, a new phone, cleared browser data. Mitigated by persist(), export prompts, Home Screen install and honest onboarding."],
  ["Medium", "No way to reach users", "Without accounts you only reach buyers through the MoR's transactional emails and your opt-in list. Grow the list from day one."],
  ["Medium", "Merchant-of-record changes", "Lemon Squeezy is moving its team to Stripe Managed Payments. Keep the licence code behind one interface so you can switch to Polar or Paddle in a day."],
  ["Low", "Piracy of client-side unlocks", "Anyone technical can bypass a browser licence check. At these prices, accept it."],
  ["Low", "Privacy law changes", "If the small business exemption goes, apps that hold nothing are barely affected; the email list and MoR data are the exposure. Follow the APPs now."],
  ["Medium", "Seasonal misses", "A slipped launch loses a whole season (Christmas, spring). Cut scope rather than slip the date."],
  ["Medium", "Copycats and free incumbents", "Free Canva/Google templates compete with every app. The answers are AU-specific data (term dates, climate zones), one-time pricing and privacy as the selling point."],
  ["Resolved here", "Earlier plan conflict", "The Idea Lab's Run 5 Pass design (accounts, Supabase, reminder emails) breaks the new rule. This page supersedes it: the Pass is now local-first with .ics reminders."],
];

export const NEXT_30 = [
  ["This week (to 2 Nov): set up the business basics", "ABN (if you don't have one), a brand name and domain, a merchant-of-record account (Lemon Squeezy or Polar) with a test product, Umami Cloud free, an email processor with double opt-in, and Vercel Pro."],
  ["28 Oct to 4 Nov: build the template repo", "A cloud agent builds the Next.js static PWA template: store, backup/export, licence module, .ics writer, paywall, privacy/terms pages, and the Playwright 'no network' and round-trip tests."],
  ["4 to 15 Nov: build GiftLedger on the template", "People, gift ideas, budget per person, spent vs budget, year-over-year copy, print list. Free tier: 1 list, 10 people. Unlock A$19 (A$12 launch)."],
  ["8 to 15 Nov: free Secret Santa tool + 3 SEO pages", "Secret Santa with exclusions (feeder), plus 'Christmas gift budget planner', 'gift list template' and 'how much to spend on Christmas gifts Australia' pages, each with the tool embedded."],
  ["By 18 Nov: privacy policy and terms", "Fill in the outline above. Book a one-off lawyer review of the template if the budget allows; it covers every later app."],
  ["18 to 20 Nov: launch GiftLedger", "OzBargain freebie post for the free tier, a Pinterest set of 10 pins, 2–3 helpful Reddit answers where allowed, an email to the list."],
  ["21 to 26 Nov: measure and start TimeAudit", "Check visitors, unlocks and refunds against the slot-1 criteria. Start the TimeAudit spec and collect sample .ics files from Google, Apple and Outlook."],
];

export const REVENUE_NOTE = "The chart shows net monthly revenue across the whole portfolio in the selected scenario. The base case lands at about A$5.7k a month by April 2028, and the low case at under A$1k a month. Use the kill criteria above to find out early which case you are in. Every visitor and conversion number is an ASSUMPTION. This is not a forecast, and it is not legal or tax advice. Fees were checked 27 Oct 2026.";
