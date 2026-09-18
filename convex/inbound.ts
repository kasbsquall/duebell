import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { SAMPLE_STALLING_REPLY } from "./lib/sampleReply";
import { extractReference } from "./lib/reference";
import { enforceLimit } from "./lib/limits";
import { requireOwnClaim } from "./lib/owner";
import { retrier } from "./lib/retrier";

const MAX_REPLY_CHARS = 8000;
const SIMULATED_PREFIX = "simulated:";

interface InboundMessage {
  messageId: string;
  threadId: string;
  from: string;
  subject: string;
  text: string;
}

// AgentMail webhook payloads use snake_case; accept camelCase too.
function readMessage(raw: unknown): InboundMessage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const m = raw as Record<string, unknown>;
  const str = (...keys: string[]) => {
    for (const k of keys) if (typeof m[k] === "string") return m[k] as string;
    return "";
  };
  const messageId = str("message_id", "messageId");
  const threadId = str("thread_id", "threadId");
  if (!messageId || !threadId) return null;
  return {
    messageId,
    threadId,
    from: str("from"),
    subject: str("subject"),
    text: str("extracted_text", "extractedText", "text", "preview"),
  };
}

async function findClaim(ctx: MutationCtx, msg: InboundMessage): Promise<Doc<"claims"> | null> {
  const byThread = await ctx.db
    .query("claims")
    .withIndex("by_emailThreadId", (q) => q.eq("emailThreadId", msg.threadId))
    .first();
  if (byThread) return byThread;

  const reference = extractReference(`${msg.subject}\n${msg.text}`);
  if (!reference) return null;
  return ctx.db
    .query("claims")
    .withIndex("by_referenceCode", (q) => q.eq("referenceCode", reference))
    .first();
}

// Stores a reply on its claim once (deduplicated by message id) and queues classification.
async function storeReply(ctx: MutationCtx, claim: Doc<"claims">, msg: InboundMessage): Promise<void> {
  const alreadyStored = await ctx.db
    .query("claimEvents")
    .withIndex("by_messageId", (q) => q.eq("messageId", msg.messageId))
    .first();
  if (alreadyStored) return;

  // A simulated reply must not claim the thread a real company reply will arrive on.
  if (!claim.emailThreadId && !msg.messageId.startsWith(SIMULATED_PREFIX)) {
    await ctx.db.patch("claims", claim._id, { emailThreadId: msg.threadId });
  }
  const replyEventId = await ctx.db.insert("claimEvents", {
    claimId: claim._id,
    kind: "reply_received",
    detail: msg.text.trim().slice(0, MAX_REPLY_CHARS) || "(empty message)",
    from: msg.from,
    subject: msg.subject,
    messageId: msg.messageId,
  });
  const analysisRunId = await retrier.run(
    ctx,
    internal.classify.classifyReply,
    { replyEventId },
    { onComplete: internal.classify.onAnalysisComplete },
  );
  await ctx.db.patch("claimEvents", replyEventId, { analysisRunId });
}

export const onMessageReceived = internalMutation({
  args: { message: v.any(), thread: v.any(), eventId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const msg = readMessage(args.message);
    if (!msg) return null;

    const claim = await findClaim(ctx, msg);
    if (!claim) return null;

    await storeReply(ctx, claim, msg);
    return null;
  },
});

// Lets a visitor see the full loop without sending an email. The sample reply goes through
// the same storage and classification path as a real webhook delivery, once per claim.
export const simulateReply = mutation({
  args: { claimId: v.id("claims") },
  returns: v.null(),
  handler: async (ctx, { claimId }) => {
    const claim = await requireOwnClaim(ctx, claimId);
    if (claim.status === "resolved") throw new ConvexError("This claim is already resolved");
    const messageId = `${SIMULATED_PREFIX}${claimId}`;
    const used = await ctx.db
      .query("claimEvents")
      .withIndex("by_messageId", (q) => q.eq("messageId", messageId))
      .first();
    if (used) throw new ConvexError("The sample reply was already used on this claim");
    await enforceLimit(ctx, "simulateReply", claim.ownerId!, "Simulated replies");
    await storeReply(ctx, claim, {
      messageId,
      threadId: messageId,
      from: "the company (simulated)",
      subject: `Re: Complaint [Ref ${claim.referenceCode}]`,
      text: SAMPLE_STALLING_REPLY,
    });
    return null;
  },
});
