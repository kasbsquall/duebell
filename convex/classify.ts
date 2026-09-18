import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import {
  CLASSIFICATION_JSON_SCHEMA,
  parseClassification,
  statusForVerdict,
} from "./lib/classification";

const MODEL = "gpt-5.4-mini-2026-03-17";

const SYSTEM_PROMPT = `You review replies that companies send to consumer complaints.
Classify the reply with one verdict:
- "commitment": the company commits to a concrete action AND gives at least one of: a date, an amount, or a specific remedy (refund, replacement, delivery).
- "resolved": the company states the problem is already fixed, with specifics (e.g. refund processed on a date, item delivered).
- "stalling": anything else, including acknowledgements, "we are reviewing your case", "we will contact you soon", apologies without a remedy, or requests for information already provided.
Return:
- confidence: 0 to 1.
- evidenceQuote: the single sentence copied EXACTLY from the reply that best supports the verdict.
- reason: one plain English sentence a consumer understands.
- missing: which of date, amount, remedy, responsible_person a real answer would still need.`;

export const replyContext = internalQuery({
  args: { replyEventId: v.id("claimEvents") },
  handler: async (ctx, { replyEventId }) => {
    const reply = await ctx.db.get("claimEvents", replyEventId);
    if (!reply || reply.kind !== "reply_received") return null;
    const claim = await ctx.db.get("claims", reply.claimId);
    if (!claim) return null;
    return { claim, reply };
  },
});

export const classifyReply = internalAction({
  args: { replyEventId: v.id("claimEvents") },
  returns: v.null(),
  handler: async (ctx, { replyEventId }) => {
    const context = await ctx.runQuery(internal.classify.replyContext, { replyEventId });
    if (!context) return null;
    const { claim, reply } = context;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Company: ${claim.companyName}\nComplaint: ${claim.summary}\n\nCompany reply:\n"""\n${reply.detail}\n"""`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "reply_classification", strict: true, schema: CLASSIFICATION_JSON_SCHEMA },
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`OpenAI request failed with status ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned no content");

    const result = parseClassification(content, reply.detail);
    await ctx.runMutation(internal.classify.applyClassification, {
      replyEventId,
      verdict: result.verdict,
      confidence: result.confidence,
      evidenceQuote: result.evidenceQuote ?? undefined,
      reason: result.reason,
      missing: result.missing,
    });
    return null;
  },
});

export const applyClassification = internalMutation({
  args: {
    replyEventId: v.id("claimEvents"),
    verdict: v.union(v.literal("commitment"), v.literal("stalling"), v.literal("resolved")),
    confidence: v.number(),
    evidenceQuote: v.optional(v.string()),
    reason: v.string(),
    missing: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const reply = await ctx.db.get("claimEvents", args.replyEventId);
    if (!reply) return null;
    const claim = await ctx.db.get("claims", reply.claimId);
    if (!claim) return null;

    await ctx.db.insert("claimEvents", {
      claimId: claim._id,
      kind: "classified",
      detail: args.reason,
      replyEventId: args.replyEventId,
      verdict: args.verdict,
      confidence: args.confidence,
      evidenceQuote: args.evidenceQuote,
      missing: args.missing,
    });

    // A missed deadline stays missed; only an actual resolution closes an overdue claim.
    const next = statusForVerdict(args.verdict);
    if (claim.status === "resolved") return null;
    if (claim.status === "overdue" && next !== "resolved") return null;
    await ctx.db.patch("claims", claim._id, { status: next });
    return null;
  },
});
