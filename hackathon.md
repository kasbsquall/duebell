# Hackathon log

- **Project:** Duebell
- **Event:** Convex All Gas Hackathon
- **What it does:** Holds companies in Peru to the 15 business day legal deadline for answering consumer complaints: it counts the clock, reads company replies, flags non-answers, and drafts the Indecopi filing.
- **Live app:** https://sleek-grouse-640.convex.site
- **Repo:** https://github.com/kasbsquall/duebell
- **Frontend:** Convex static hosting
- **Convex deployment:** https://sleek-grouse-640.convex.cloud
- **Components:** @agentmail/convex, @convex-dev/rate-limiter, @convex-dev/action-retrier, @convex-dev/static-hosting, @convex-dev/auth
- **Convex features:** schema, indexes, queries, mutations, actions, internal functions, HTTP actions, scheduled functions, cron jobs, realtime queries, registered components
- **Auth:** Convex Auth (anonymous sessions)
- **AI models:** gpt-5.4-mini-2026-03-17
- **Started:** 2026-09-18T13:25:00Z
- **Last updated:** 2026-09-18T20:14:35Z

## Log

### 2026-09-18 - 421b21a
Scaffolded a Vite + React + TypeScript app on Convex. Proved the riskiest dependency first: Firecrawl browser actions can search Indecopi's public sanctions registry and open a company's detail page, which is a JavaScript app with no public API (`convex/probe.ts`, later removed).

### 2026-09-18 - 46b18f2
Built the legal clock. Business days are counted in Lima time from the day after filing, skipping weekends and Peruvian national holidays. Creating a claim schedules a function at the end of the deadline day that marks it overdue if no real answer arrived. Added a demo control that moves a claim forward in business days. Convex features: schema, indexes, mutations, queries, scheduled functions (`convex/claims.ts`, `convex/lib/businessDays.ts`, `convex/schema.ts`). 15 tests.

### 2026-09-18 - d658cc1
Company replies now arrive by email. The AgentMail component verifies the signed webhook and stores the event; the HTTP action then routes the message to its claim by thread or by a short reference code in the subject, and drops duplicates by message id. Round trip proven with real replies sent from a personal mail client to the case inbox. Convex features: HTTP actions, registered component, internal mutations (`convex/http.ts`, `convex/inbound.ts`, `convex/lib/reference.ts`).

### 2026-09-18 - 885cc5a
Every reply is classified by OpenAI with a strict JSON schema: real commitment, resolved, or stalling, plus confidence, the sentence it relied on, a plain-English reason, and what a real answer still lacks. The quoted sentence is checked against the original email and discarded if it does not appear. Status updates follow, except that a missed deadline stays missed unless the company actually resolves the case. Convex features: actions, internal queries and mutations, scheduler (`convex/classify.ts`, `convex/lib/classification.ts`).

### 2026-09-18 - dac78c5
Creating a claim now starts a background Firecrawl lookup of the company's sanction record: total sanctions, fines, period, recent cases, and how many are about complaint handling. The registry's result order is unstable, so the best match is ranked against the name the user typed and alternatives are kept for a one-click correction. Parsers are tested against captured registry output (`convex/sanctions.ts`, `convex/lib/sanctions.ts`).

### 2026-09-18 - 0eaddde
Shipped the claim dashboard: deadline clock with a strip of 15 business-day ticks, live sanctions card, reply verdict with the quoted sentence, reply channel with a "Reply as the company" test button, next-step panel, and case timeline. Everything updates through realtime queries. Published on Convex static hosting with app-owned root routing so the webhook URL did not move. Removed the probe action because it exposed Firecrawl calls publicly (`src/`, `convex/http.ts`, `convex/convex.config.ts`).

### 2026-09-18 - 430a222
Rebranded as Duebell and moved all product copy to English. Indecopi offense names are translated to English by OpenAI during the lookup, and the Indecopi filing stays in Spanish (as required) with an English reference version one click away. Added the ledger-paper texture and the bell isotype (`src/components/Logo.tsx`, `convex/lib/translate.ts`, `src/components/NextStep.tsx`).

### 2026-09-18 - working tree
Added the README, the design system, and this build log (`README.md`, `docs/design-system.md`). Repository published on GitHub.

### 2026-09-18 - production
Deployed backend and frontend to the production Convex deployment with its own signed AgentMail webhook. Verified end to end on production: a real reply sent to the case inbox was routed to its claim and classified as stalling (0.98), and the Firecrawl sanctions lookup returned the company's record with English offense labels.

### 2026-09-18 - 41447f1
Added a recorded case on the home page: a 44 second, self-playing replay of a real run on the dev deployment (sanctions lookup, reply classification, deadline, filing), with chapters labelled by the system that produced each step and an on-screen note about what is compressed. The live app moved to its own route. Visual pass across both views: ink clock block, chapter rail, stamp animations, double-bezel panels (`src/demo/`, `src/styles/demo.css`, `src/lib/draft.ts`).

Evidence for the recorded case: a full run on the dev deployment on 2026-09-18 (reference RC-V6ZQ). Firecrawl returned 150 sanctions and 41.7 UIT in fines for SAGA FALABELLA S A (RUC 20100128056). OpenAI classified the sample reply as stalling with 0.99 confidence and quoted "Your complaint has been forwarded to the corresponding area and our team is currently reviewing your case.", which the quote check found in the email. The deadline check then marked the claim overdue. A first run was discarded because its sample text dated the jacket return after the filing date.

### 2026-09-18 - working tree
Visitors can now see the whole loop without sending an email. **Simulate the company's reply** delivers a sample non-answer through the same storage and classification path as a signed AgentMail webhook, at most once per claim, and never takes over the thread a real reply will arrive on. Verified in the browser on dev: sample complaint created, simulated reply classified as stalling at 99% within seconds, button disabled afterwards. Three new tests cover the once-per-claim rule and thread handling; 43 tests pass. The home page now states the outcome of the recorded case before it plays, and the README gained a 30 second walkthrough, the AI safeguards, and a limits section (`convex/inbound.ts`, `convex/lib/sampleReply.ts`, `src/components/ReplyChannel.tsx`, `src/demo/DemoPage.tsx`, `README.md`).

### 2026-09-18 - working tree
The sanctions card now shows the lookup at work while Firecrawl reads Indecopi's registry: what it is doing, why it takes time, and a running count, where it used to show a grey block. The Spanish filing marks the consumer's description and the company's reply as original text, since either can be in English. The claim list scrolls with the page (`src/components/SanctionsCard.tsx`, `src/lib/draft.ts`, `src/styles/app.css`).

### 2026-09-18 - demo video

Recorded and edited the demo video: https://youtu.be/dViTfHukVrc (1:36). All product footage is a 2K recording of one run in production (case RC-PJNS), with `npx convex logs --prod --success` streaming during the run so the logs on screen belong to the same case. The 3D stamp, the business-day bars and the end card are rendered with Remotion and three.js; voiceover by ElevenLabs, captions timed with ElevenLabs forced alignment. The live UI got several fixes before recording: service logos and a clearer done state in the replay rail, English as the default filing view with Spanish marked as the version that is filed, a glossary of Peruvian terms, a working "How it works" link, and optional per-chapter narration in the recorded case (`src/demo/`, `src/components/NextStep.tsx`, `public/narration/`).

### 2026-09-18 - private sessions
Added Convex Auth with anonymous sign-in. The live app signs each visitor in on arrival, so judges still open it without a form, and every claim is stored with its owner. The claim list, claim page, demo time jump, simulated reply and sanctions refresh all check ownership on the server; someone else's claim is reported as not found. Inbound email still reaches the right claim through the webhook, which runs server-side. Two new tests cover a second user trying to read or change a claim and an unsigned visitor trying to file one; 45 tests pass. Verified in production with two separate browser sessions: the second session saw no claims and could not open the first one's claim by URL (`convex/auth.ts`, `convex/auth.config.ts`, `convex/lib/owner.ts`, `convex/claims.ts`, `src/App.tsx`).

### 2026-09-18 - letters, retries and limits
AgentMail now sends as well as receives. From a claim, the user can email the company a formal follow-up in Spanish (English preview alongside) from Duebell's inbox, after typing the address and confirming it. The letter is queued in the AgentMail component's outbox, its delivery status shows live on the claim, and the company's answer comes back with the reference in the subject, so the existing webhook files it on the same claim. OpenAI classification now runs through the Convex action-retrier (3 attempts with backoff) and records a visible failure instead of spinning forever. The rate-limiter component guards every paid or outbound call per session, plus a deployment-wide budget for Firecrawl lookups. A daily cron posts a notice on claims with 3 or fewer business days left, and a claim can be marked resolved, which stops the clock. 12 new tests cover the letter, its limits and ownership, resolution, the cron, the limiter and the retrier's failure path; 57 tests pass. Verified on dev in the browser: sample claim, Firecrawl record, simulated reply classified as stalling at 98% through the retrier (`convex/outbound.ts`, `convex/lib/letter.ts`, `convex/lib/limits.ts`, `convex/lib/retrier.ts`, `convex/crons.ts`, `src/components/CompanyLetter.tsx`).
