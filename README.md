# Duebell

In Peru, a company must answer a formal consumer complaint within **15 business days**, with no extension. Most people never check. Duebell keeps the clock for them.

**Live app:** https://doting-lyrebird-179.convex.site

## How it works

1. You file your complaint in the company's official complaint book (the *Libro de Reclamaciones*) and give Duebell's inbox as your contact email.
2. **Convex** starts a legal clock that counts Peruvian business days, skipping weekends and national holidays. A scheduled function fires at the end of the deadline day and marks the claim overdue if no real answer arrived.
3. When the company replies, **AgentMail** receives the email through a signed webhook and routes it to the right claim by thread or reference code.
4. **OpenAI** classifies the reply as a real commitment, a resolution, or stalling. It quotes the exact sentence it relied on, and the quote is checked against the original email before it is shown.
5. **Firecrawl** drives Indecopi's public sanctions registry (Indecopi is Peru's consumer protection agency) and brings back the company's sanction record, which OpenAI translates into plain English.
6. If the company stalls or misses the deadline, Duebell drafts the filing for Indecopi in Spanish, with an English version for reference. You review it and submit it yourself.

Everything updates live in the browser through Convex queries.

## Try it

Open the live app, click **Try it with a sample complaint**, then **Reply as the company**. Your own email client opens with a typical non-answer. Send it and watch the page classify it. Use **Jump past the deadline** to see what happens when the company runs out of time.

## Stack

| Piece | Where |
|---|---|
| Schema, indexes | `convex/schema.ts` |
| Legal clock and state machine | `convex/claims.ts`, `convex/lib/businessDays.ts` |
| Inbound email webhook | `convex/http.ts`, `convex/inbound.ts` |
| Reply classification | `convex/classify.ts`, `convex/lib/classification.ts` |
| Sanctions lookup | `convex/sanctions.ts`, `convex/lib/sanctions.ts` |
| Frontend | `src/`, served by Convex static hosting |

## Run locally

```bash
npm install
npx convex dev
npm run dev
```

Set these on your Convex deployment: `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, `AGENTMAIL_API_KEY`, `AGENTMAIL_WEBHOOK_SECRET`, `AGENTMAIL_INBOX_ADDRESS`.

```bash
npm test
```

Built for the Convex All Gas Hackathon. Build log: [hackathon.md](./hackathon.md). Design system: [docs/design-system.md](./docs/design-system.md).
