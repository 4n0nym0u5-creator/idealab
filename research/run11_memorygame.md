# Run 11: Memory Game → Hint & Tell (standalone opportunity)

_29 Oct 2026 (AEDT). Source: the user's PDF 'Memory Game' (26 Oct 2026) plus fresh research._

## Verdict
**Worth a cheap test, not a full build yet. Test it at your own table over Christmas 2026. Only build the native app if families keep playing.**

Name: Hint & Tell (working name). A dinner-table guessing game. The stories you tell along the way become a family archive that stays on your devices.

Tier: Park (build) · Validate now (experiments ≤ A$600)

- The game loop is genuinely new. Storyworth and Remento are prompt-and-book services, not games. Fun Bits' 'Quote Guess' is the only close analogue.
- Demand for family-story products is proven: Storyworth sells at US$69–199, Remento at US$99/yr, Meminto at US$99–397.
- The hard part is retention: will families still play in week 6? Novelty fades and prompts start to feel like homework.
- A privacy-compliant build means native iOS with on-device speech and AI. That is the hardest stack for a non-engineer (aibuild 1).
- Scores: rubric total 57.6 (shortlist about 76+), portfolio fit 48.5. A web wedge without recording scores 67.2 (fit 66.1) and is a cheaper first product.

## Scores (rubric v2.0 / PL 1.0)
| Variant | Total | Portfolio fit |
|---|---|---|
| on_device_native_v1 | 57.6 | 48.5 |
| wedge_v0_web_game | 67.2 | 66.1 |
| pdf_cloud_design | 55.2 | 0.0 |

If the rubric's 'recording calls' anchor is read strictly (legal 2), the native total drops 3.2 points.

Native scores: legal 3, pain 3, breadth 4, wtp 4, recurring 3, build 2, maint 3, distro 2, compete 3, defend 4, synergy 3, platform 4, aibuild 1

## Privacy redesign: B (local + user-owned sync). The PDF's cloud design (AssemblyAI/Deepgram + S3 + Supabase) is C-disq under the no-private-data rule.
| Layer | PDF | Redesign |
|---|---|---|
| Capture | Phone records, uploads audio to S3 | Phone records to the app sandbox and stays offline. Nothing is uploaded. |
| Speech-to-text | AssemblyAI US$0.21/hr + US$0.02 diarisation, or Deepgram | Apple SpeechAnalyzer/SpeechTranscriber (iOS 26, on-device, built for long-form and distant audio). Android fallback: ML Kit GenAI speech recognition (basic mode API 31+). |
| Who said what | Cloud diarisation / voice IDs | Game turns label the speaker. The Keeper is the teller, and others tap their face when they jump in. No voiceprints are stored. Optional on-device SpeakerKit clustering stays ephemeral. |
| Extraction (title, place, date, quotes) | Cloud LLM | Apple Foundation Models (on-device, guided generation). On older phones there is no AI summary; the family types a title and the template fills the rest. |
| Archive + sharing | Supabase + S3 | CloudKit private database in the family's own iCloud. Grandparents are invited with a CKShare, and storage counts against the owner's iCloud quota. |
| Licensing/payments | Stripe | StoreKit in-app purchase. Apple holds the payment data; our server holds nothing. |
| Legacy | Legacy contact feature on our servers | A free yearly open-format export (m4a + JSON + PDF) to a place the family chooses, plus the printed yearbook and Apple Legacy Contact. |

### Trade-offs
- **cost**: Marginal AI cost falls to about A$0. The PDF estimated US$1.07–3.76 per family per month for cloud STT/LLM/storage. Fixed costs are about A$149/yr Apple Developer plus a domain.
- **quality**: On-device transcription at a noisy table will be worse than cloud. This is unmeasured and must be tested (Experiment 3). Without an LLM on older phones there are no auto-summaries.
- **device_floor**: Full features need iOS 26. AI summaries need an Apple Intelligence iPhone (15 Pro / 16 / 17 family), Apple Intelligence switched on and up to 8 GB free. A game-only mode works on any recent iPhone.
- **remote_play**: No game server is allowed, so remote play would use FaceTime SharePlay (Apple-run, peer to peer) or a speaker-phone fallback. Cut from the MVP.
- **grandparent_sharing**: Easy if Nana has an Apple ID (CKShare). Android or non-Apple relatives get exported PDFs/audio files or the printed yearbook instead.
- **legacy**: Better than the PDF's version. A shutdown can't strand the stories because we never hold them. HereAfter AI closed in August 2026 with support-email-only export.
- **android**: Later, or never. Android's advanced on-device modes only run on a few flagships.

### How legal risk shrinks
- NSW Surveillance Devices Act 2007: recording a private conversation needs the consent of every principal party (express or implied). The consent roll-call, per-player 'Play only' option and visible recording indicator are designed for that. It is the family recording itself on its own device; we are never a party and never hold the recording.
- Biometrics: speaker labels come from game turns, so no voiceprint templates are kept. The Privacy Act treats biometric templates for automated identification as sensitive information, so avoiding them removes the highest-risk category.
- Minors: teens 13–17 give their own say-so plus a parent OK, and under-13s are 'Play only' by default. The developer collects no children's data. The Children's Online Privacy Code (registration due 10 Dec 2026) mostly bites on entities that collect data; check the final text.
- Breach exposure: no server, so nothing to breach. The statutory privacy tort (in force since 10 Jun 2025) and NDB scheme exposure become near-zero.
- Still needed: a privacy policy, App Store label 'Data Not Collected', ACL refund terms, GST registration (Apple requires it for paid apps, per Run 10), and a one-off legal review of the consent wording (estimate A$1.5–4k).

## Personas (ranked)
1. **The Gift-Giving Adult Child**: 35–55, buys for parents and grandparents at Christmas, Mother's/Father's Day and milestone birthdays. Job: Capture Mum's and Dad's stories before it's too late, as a present. Evidence: Storyworth/Remento built on this buyer; the PDF rates legacy gift-buyers 8/10. Price: US$69–199 per gift. Channel: Gift guides, Facebook/Instagram ads in Nov–Dec and May, podcasts.
2. **Last-Years-at-Home Parents**: Parents of teens 13–18 (your family is the archetype). Job: Get teens off phones at dinner and keep the stories before the kids leave. Evidence: Your own household; Run 7 'Default Parent' audience overlap. Price: A$30–60/yr (assumption). Channel: Parent communities, school newsletters, Instagram Reels of game nights.
3. **The Trip Family**: Families who take a big trip every year or two (theme parks, road trips, overseas). Job: Kill queue time and turn the trip into stories. Evidence: Trip mode is the dogfood hook; the PDF rates travel families 7/10. Price: Pack purchases A$5–10 (assumption). Channel: Travel forums, trip-planning creators.
4. **The Spread-Out / Migrant Family**: Families with grandparents overseas (48.2% of Australians have a parent born overseas, per the PDF citing ABS). Job: Share stories across distance and languages. Evidence: PDF 6.5/10; needs remote play, which is weakest in the on-device design. Price: Medium. Channel: Community groups; later.
5. **Young Families**: Parents of under-10s. Job: Capture funny things kids say. Evidence: Fun Bits, quote-journal apps. Price: Low–medium. Channel: Parent Instagram.
6. **Aged Care / Reminiscence**: Lifestyle coordinators, families of residents. Job: Reminiscence sessions. Evidence: PDF 5.5/10; Cochrane review of reminiscence therapy (cited in the PDF). Price: A$200–500/mo per site (PDF). Channel: B2B sales; later only, because of consent capacity issues and the clinical-claims risk.

## Competitors
| Name | Model | Price | Gap |
|---|---|---|---|
| [Storyworth](https://help.storyworth.com/en_US/getting-started/book-pricing) | Weekly email prompts → printed book | US$69 Basic / US$99 Color / US$199 Unlimited (renews US$99); extra books US$39–99 | Not a game; solo homework; stories live on their servers |
| [Remento](https://www.remento.co/faq) | Voice-first prompts, AI-edited stories, book | US$99 first year incl. book; renew US$99/yr or US$12/mo; conversation cards US$19.99 | Cloud voice; one storyteller at a time |
| [Meminto](https://meminto.com/pricing/) | Biography book, GDPR, EU servers | US$99 / $149 / $397 one-time | Book project, not a recurring ritual |
| [HereAfter AI (dead)](https://killedbyai.net/dead/hereafter-ai/) | Voice 'life story avatar' | Was US$3.99–7.99/mo | Shut down Aug 2026; export only by emailing support. This is our trust story. |
| [TableTopics Family](https://tabletopics.com/products/family) | 135 conversation cards | US$25 | No scoring, no memory capture |
| [WNRS Family Edition](https://www.werenotreallystrangers.com/products/family-edition) | Conversation card game | US$20 | Emotional rather than playful; nothing is kept |
| [StoryCorps app](https://storycorps.org/participate/storyCorps-app/) | Free recorded interviews | Free | Uploads to a public archive / Library of Congress |
| [Fun Bits](https://fun-bits.com/) | Kids' quotes journal + 'Quote Guess' game | Freemium (not verified) | Closest Who-Said-It analogue; not a full game night |
| [StoryKeeper / Keepsake / Memoirs For You (AU)](https://storykeeper.com/au/) | Memoir and book services | Varies (not verified) | Service or book projects; no game |

## Churn and the fun-first problem
- Storyworth users report storytellers losing momentum; prompts feel like homework (Reddit r/Gifts, r/AgingParents)
- RevenueCat 2026: median first-year annual-plan retention is 20–40%
- Tabletop research summary: a new game's play peaks within about 3 months, then declines (researchscape)

Tactics:
- Fun first, archive second. Recording is optional per round, and the game works with it off.
- The archive feeds the game. Who Said It and 'On this day' rounds reuse your own stories, so it gets better the more you play (the flywheel).
- Short formats: Quick (15 min) and Trip (10 min) as well as Classic (40 min).
- Teen-safe mechanics: veto card, Epic Fails, roast-light rules, and teens can be the Keeper.
- Seasonal packs (Christmas, Easter, school holidays, trip) as the reason to come back, plus streaks without guilt.
- The physical deck works without the app, so the app is never a barrier at the table.

## Must be true
| Assumption | Experiment | Pass |
|---|---|---|
| Families will play at least 3 times in 6 weeks without nagging | E1 own-table pilot, then E2 concierge with 10–15 families | ≥50% of families play 3+ times; week-5 sessions ≥40% of week-1 |
| Teens will play and agree to be recorded | E1 + E2 (count rounds recorded vs 'Play only') | ≥60% of teen rounds recorded; teens rate it ≥7/10 |
| On-device transcription is usable at a real dinner table | E3: record 4 dinners on an iOS 26 iPhone and compare transcripts | ≥70% of stories usable after ≤1 min of edits (owner judgement) |
| Gift buyers will pay A$49+ for a game plus archive | E4 fake-door landing page, two angles (gift vs family night), A$300 ads | ≥3% email sign-up; ≥30% pick a paid tier |
| Families will review memories after the game | E2: measure % reviewed within 48h (paper 'memory cards') | ≥50% |

## Experiments
- **E1 Your own table (printed deck)** (≤ 50 AUD, 3 Sundays in Nov–Dec 2026, plus one trip round): Print 60 cards (8 categories) at home. Use phone Notes for hints and a scoreboard on paper. Record with iPhone Voice Memos only if everyone says yes. Note what got laughs and what dragged.
- **E2 Concierge test** (≈ 300–500 AUD, 6 weeks, Jan–Feb 2027): Mail printed decks and paper memory cards to 10–15 families (friends of friends). Families keep any recordings themselves. Collect only a weekly 3-question survey, never the stories.
- **E3 On-device quality check** (0 AUD, 1 week): Run iOS 26 on-device transcription (Notes/Voice Memos, or a 1-screen test app) on 4 family dinners. Judge usability yourself.
- **E4 Fake-door landing page** (≈ 300 AUD, 2 weeks, pre-Mother's Day 2027): A one-page Next.js site on Vercel with two headlines. Collect emails through a form provider with minimal data, or a waitlist via a MoR.
- **E5 Price check** (0–100 AUD, inside E2): Van Westendorp 4 questions on the concierge survey.

## Pricing
Digital first. Free tier: Quick mode + 3 categories + 10 saved memories. 'Family Pass' A$49/yr (one purchase covers the household via Family Sharing) with a 7-day trial. Export is always free, so memories are never held hostage. Seasonal packs A$7.99 for non-subscribers. Physical Starter Box (A$39 concept, or A$59 with 12 months) only after E2 passes. Yearbook: free print-ready PDF export, printed by a printer the family chooses.

Prices sit under Storyworth/Remento (US$99 ≈ A$141) and above card decks (US$20–25). With near-zero marginal cost, subscription value has to come from fresh packs and yearbook layouts, not compute.

PDF comparison: The PDF's A$9.99/mo, A$14.99 family, A$119/yr, A$59 box, A$99–149 yearbook and A$29/yr legacy vault assume cloud costs and a team. Most of the legacy-vault tier disappears in the on-device design, because legacy is a free export.

## Year-1 revenue scenarios (illustrative)
Illustrative only. iOS, AU-first. A$49 incl. GST → ex-GST → Apple Small Business Program 15% fee. Downloads, conversion and renewal are assumptions, not data.

| Scenario | Downloads | Conv. | Paying | Net A$ | Renew Y2 |
|---|---|---|---|---|---|
| low | 5,000 | 4% | 200 | 7,573 | 60 |
| base | 20,000 | 6% | 1,200 | 45,436 | 420 |
| high | 60,000 | 8% | 4,800 | 181,745 | 1,920 |

## Build path (solo, vibecoded)
- **0 · Paper** (Nov–Dec 2026, A$≤ 50): E1 + E3
- **1 · Concierge** (Jan–Feb 2027, A$300–500): E2 + E5
- **2 · Web wedge 'Hint & Tell Table'** (Mar–Apr 2027, A$0–500): Local-first Next.js PWA: categories, Keeper secret, hints, timer, scoring, typed memory cards, PDF export. No recording. aibuild 4, about 60–100 h. Sell packs/unlock via a MoR.
- **3 · Native iOS v1** (Only if E2 passes; mid-2027, A$15,000–40,000 (estimate)): SwiftUI + SpeechAnalyzer + Foundation Models + CloudKit + StoreKit. Plan on a part-time contract iOS developer (about 150–250 h) for audio, CloudKit sharing and StoreKit edge cases. Includes A$1.5–4k legal review and A$149/yr Apple Developer.

Solo total to v1: ≈ 16,000–41,000 (estimate). PDF team plan: MVP A$80–150k (A$15–30k founder-built); v1 A$0.7–1.0M (~5 FTE).

Phases 0–2 are well within reach. Phase 3 is where AI-built apps fail silently (audio sessions, background interruptions, CloudKit share permissions, StoreKit receipts), so budget for a human reviewer.

## Names
- **Hint & Tell** (Recommended): App Store AU search: no exact match (29 Oct 2026). hintandtell.com and hintandtell.app unregistered per RDAP. No exact 'Hint & Tell' game trademark in a web search; 'Show & Tell' and 'Spill and Tell' marks exist (Canada). IP Australia ATMOSS search is still to be done by hand.
- **Tell Me Again** (Backup): No App Store AU results; tellmeagain.app registered Jul 2026
- **Story Supper** (Backup): No exact App Store match; storysupper.com registered Dec 2024
- **Memory Game** (Avoid): Generic; flooded by brain-training apps
- **Remember When / Retold / Table Tales / Yarn** (Avoid): Existing apps with the same or similar names on the AU App Store

Don't use Disney/Universal names or characters in cards, screenshots or marketing. Use generic categories ('Park Day', 'the log ride').

## Mockups
- run11_mockups/m1_setup_consent.png
- run11_mockups/m2_keeper_secret.png
- run11_mockups/m3_hints_scoring.png
- run11_mockups/m4_tell_it.png
- run11_mockups/m5_memory_review.png
- run11_mockups/m6_who_said_it.png
- run11_mockups/t7_tablet_archive.png
- run11_mockups/p8_box_yearbook.png

## Caveats
- Revenue scenarios, conversion, renewal and the solo budget are assumptions or estimates, not data.
- On-device transcription quality at a noisy table is untested (E3).
- Some facts come from search summaries (RevenueCat ranges, tabletop decay, Apple Intelligence device list) rather than full page reads.
- Not legal advice: get the consent wording, the Children's Code position and the NSW SDA s11 'communicating a recording' point reviewed before launch.
- Trademark: IP Australia search not run (manual step).
- PDF market figures (Ancestry, Plaud, AU board games, ABS) are quoted from the PDF and not re-verified.

## Sources
- https://help.storyworth.com/en_US/getting-started/book-pricing
- https://www.remento.co/faq
- https://help.remento.co/en/articles/8365892
- https://meminto.com/pricing/
- https://killedbyai.net/dead/hereafter-ai/
- https://www.afterlife.ai/hereafter-ai-shutting-down
- https://tabletopics.com/products/family
- https://www.werenotreallystrangers.com/products/family-edition
- https://storycorps.org/participate/storyCorps-app/
- https://fun-bits.com/
- https://storykeeper.com/au/
- https://www.keepsakeproject.co/faq
- https://memoirsforyou.com.au/the-book/
- https://welcome.storyworth.com/au
- https://developer.apple.com/videos/play/wwdc2025/277/
- https://developer.apple.com/documentation/speech/speechtranscriber/supportedlocales
- https://developer.apple.com/foundation-models-framework/
- https://support.apple.com/en-us/121115
- https://github.com/argmaxinc/argmax-oss-swift
- https://developers.google.com/ml-kit/genai/speech-recognition/android
- https://developer.apple.com/videos/play/tech-talks/10874/
- https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2007-064
- https://www.oaic.gov.au/privacy/privacy-registers/privacy-codes/childrens-online-privacy-code
- https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business
- https://www.reddit.com/r/Gifts/comments/1ozilol/experience_with_storyworth/
- https://www.reddit.com/r/AgingParents/comments/1bhb0fa/my_dad_and_storyworth/
- https://www.revenuecat.com/state-of-subscription-apps-2026-business/
- https://researchscape.com/blog/dynamics-of-the-tabletop-game-industry
- https://doi.org/10.1111/fare.13117
- https://itunes.apple.com/search (AU App Store name checks, 29 Oct 2026)
- https://rdap.verisign.com (domain checks)
- User PDF 'Memory Game' (26 Oct 2026) and its 29 sources
