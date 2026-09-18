import { AgentMail } from "@agentmail/convex";
import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { buildLetter, isValidEmail, LETTER_MAX_PER_CLAIM, letterSubject } from "./lib/letter";
import { enforceLimit } from "./lib/limits";
import { requireOwnClaim } from "./lib/owner";

const agentmail = new AgentMail(components.agentmail);

// @agentmail/convex 0.1.0 types its ctx against an older Convex; runtime shape is the same.
type AgentMailCtx = Parameters<typeof agentmail.sendMessage>[0];

// Emails the written follow-up to the company from Duebell's inbox. The user types the
// address and confirms; nothing is sent without that. Replies come back to the same inbox
// with the reference in the subject, so the webhook files them on this claim.
export const sendLetter = mutation({
  args: { claimId: v.id("claims"), to: v.string(), confirmed: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { claimId, to, confirmed }) => {
    const claim = await requireOwnClaim(ctx, claimId);
    if (!confirmed) throw new ConvexError("Confirm the address before sending");
    const address = to.trim().toLowerCase();
    if (!isValidEmail(address)) throw new ConvexError("Enter one valid email address");
    if (claim.status === "resolved") throw new ConvexError("This claim is already resolved");
    const inbox = process.env.AGENTMAIL_INBOX_ADDRESS;
    if (!inbox) throw new ConvexError("Sending is not configured on this deployment");

    const events = await ctx.db
      .query("claimEvents")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .take(200);
    if (events.filter((e) => e.kind === "letter_sent").length >= LETTER_MAX_PER_CLAIM) {
      throw new ConvexError(`A claim can send at most ${LETTER_MAX_PER_CLAIM} letters`);
    }
    await enforceLimit(ctx, "sendLetter", claim.ownerId!, "Sending letters");

    const input = {
      companyName: claim.companyName,
      referenceCode: claim.referenceCode ?? "",
      filedDate: claim.filedDate,
      deadlineDate: claim.deadlineDate,
      summary: claim.summary,
      overdue: claim.status === "overdue",
    };
    const outboundId = await agentmail.sendMessage(ctx as unknown as AgentMailCtx, inbox, {
      to: address,
      subject: letterSubject(input),
      text: buildLetter(input, "es"),
    });
    await ctx.db.insert("claimEvents", {
      claimId,
      kind: "letter_sent",
      detail: `Written follow-up emailed to ${address}. Their reply lands on this claim.`,
      to: address,
      outboundId,
    });
    return null;
  },
});

// Live delivery status of each letter, read from the AgentMail component's outbox.
export const letters = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    await requireOwnClaim(ctx, claimId);
    const events = await ctx.db
      .query("claimEvents")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .take(200);
    const sent = events.filter((e) => e.kind === "letter_sent" && e.outboundId);
    return Promise.all(
      sent.map(async (e) => {
        const status = await agentmail.status(
          ctx as unknown as Parameters<typeof agentmail.status>[0],
          e.outboundId as Parameters<typeof agentmail.status>[1],
        );
        return {
          eventId: e._id,
          to: e.to ?? "",
          sentAt: e._creationTime,
          status: status?.status ?? "pending",
          error: status?.errorMessage ?? null,
        };
      }),
    );
  },
});
