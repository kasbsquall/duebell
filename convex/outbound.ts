import { onCompleteValidator } from "@convex-dev/action-retrier";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { buildLetter, isValidEmail, LETTER_MAX_PER_CLAIM, letterSubject } from "./lib/letter";
import { enforceLimit } from "./lib/limits";
import { requireOwnClaim } from "./lib/owner";
import { retrier } from "./lib/retrier";

const AGENTMAIL_API = "https://api.agentmail.to/v0";

// AgentMail has no idempotency key, so each letter carries a unique label. Before every
// attempt we look for a message with that label; a retry after a timeout finds the letter
// that already went out instead of sending it twice.
export const letterLabel = (eventId: string) => `duebell-letter-${eventId}`;

// Emails the written follow-up to the company from Duebell's inbox. The user types the
// address and confirms; nothing is sent without that. Replies come back to the same inbox
// on the same thread, with the reference in the subject, so the webhook files them here.
export const sendLetter = mutation({
  args: { claimId: v.id("claims"), to: v.string(), confirmed: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { claimId, to, confirmed }) => {
    const claim = await requireOwnClaim(ctx, claimId);
    if (!confirmed) throw new ConvexError("Confirm the address before sending");
    const address = to.trim().toLowerCase();
    if (!isValidEmail(address)) throw new ConvexError("Enter one valid email address");
    if (claim.status === "resolved") throw new ConvexError("This claim is already resolved");
    if (!process.env.AGENTMAIL_INBOX_ADDRESS) throw new ConvexError("Sending is not configured on this deployment");

    const events = await ctx.db
      .query("claimEvents")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .take(200);
    if (events.filter((e) => e.kind === "letter_sent").length >= LETTER_MAX_PER_CLAIM) {
      throw new ConvexError(`A claim can send at most ${LETTER_MAX_PER_CLAIM} letters`);
    }
    await enforceLimit(ctx, "sendLetter", claim.ownerId!, "Sending letters");

    const eventId = await ctx.db.insert("claimEvents", {
      claimId,
      kind: "letter_sent",
      detail: `Written follow-up emailed to ${address}. Their reply lands on this claim.`,
      to: address,
      letterStatus: "pending",
    });
    const letterRunId = await retrier.run(
      ctx,
      internal.outbound.deliverLetter,
      { eventId },
      { onComplete: internal.outbound.onLetterComplete },
    );
    await ctx.db.patch("claimEvents", eventId, { letterRunId });
    return null;
  },
});

export const letterContext = internalQuery({
  args: { eventId: v.id("claimEvents") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get("claimEvents", eventId);
    if (!event || event.kind !== "letter_sent" || !event.to) return null;
    const claim = await ctx.db.get("claims", event.claimId);
    if (!claim) return null;
    return { event, claim };
  },
});

// Sends through the AgentMail API. Retried by the action-retrier on network or 5xx errors.
export const deliverLetter = internalAction({
  args: { eventId: v.id("claimEvents") },
  returns: v.object({ messageId: v.string(), threadId: v.string() }),
  handler: async (ctx, { eventId }) => {
    const context = await ctx.runQuery(internal.outbound.letterContext, { eventId });
    if (!context) throw new Error("Letter not found");
    const { event, claim } = context;
    const inbox = process.env.AGENTMAIL_INBOX_ADDRESS!;
    const input = {
      companyName: claim.companyName,
      referenceCode: claim.referenceCode ?? "",
      filedDate: claim.filedDate,
      deadlineDate: claim.deadlineDate,
      summary: claim.summary,
      overdue: claim.status === "overdue",
    };
    const base = `${AGENTMAIL_API}/inboxes/${encodeURIComponent(inbox)}/messages`;
    const auth = { Authorization: `Bearer ${process.env.AGENTMAIL_API_KEY}` };
    const label = letterLabel(eventId);

    const existing = await fetch(`${base}?labels=${encodeURIComponent(label)}&limit=1`, { headers: auth });
    if (!existing.ok) throw new Error(`AgentMail lookup failed (${existing.status})`);
    const found = ((await existing.json()) as { messages?: { message_id?: string; thread_id?: string }[] })
      .messages?.[0];
    if (found?.message_id && found.thread_id) return { messageId: found.message_id, threadId: found.thread_id };

    const res = await fetch(`${base}/send`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: event.to,
        subject: letterSubject(input),
        text: buildLetter(input, "es"),
        labels: [label],
      }),
    });
    if (!res.ok) throw new Error(`AgentMail send failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as { message_id?: string; thread_id?: string };
    if (!body.message_id || !body.thread_id) throw new Error("AgentMail returned no message id");
    return { messageId: body.message_id, threadId: body.thread_id };
  },
});

export const onLetterComplete = internalMutation({
  args: onCompleteValidator,
  returns: v.null(),
  handler: async (ctx, { runId, result }) => {
    const event = await ctx.db
      .query("claimEvents")
      .withIndex("by_letterRunId", (q) => q.eq("letterRunId", runId))
      .first();
    if (!event) return null;
    if (result.type !== "success") {
      const error = result.type === "failed" ? result.error.slice(0, 300) : "Canceled";
      await ctx.db.patch("claimEvents", event._id, { letterStatus: "failed", letterError: error });
      return null;
    }
    const { messageId, threadId } = result.returnValue as { messageId: string; threadId: string };
    await ctx.db.patch("claimEvents", event._id, { letterStatus: "sent", messageId: `sent:${messageId}` });
    // The company's answer arrives on this thread; route it here even without the reference.
    const claim = await ctx.db.get("claims", event.claimId);
    if (claim && !claim.emailThreadId) await ctx.db.patch("claims", claim._id, { emailThreadId: threadId });
    return null;
  },
});

// Delivery status of each letter, live.
export const letters = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    await requireOwnClaim(ctx, claimId);
    const events = await ctx.db
      .query("claimEvents")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .take(200);
    return events
      .filter((e) => e.kind === "letter_sent")
      .map((e) => ({
        eventId: e._id,
        to: e.to ?? "",
        sentAt: e._creationTime,
        status: e.letterStatus ?? (e.outboundId ? "failed" : "pending"),
        error: e.letterError ?? null,
      }));
  },
});
