import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { extractReference } from "./lib/reference";

const MAX_REPLY_CHARS = 8000;

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

export const onMessageReceived = internalMutation({
  args: { message: v.any(), thread: v.any(), eventId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const msg = readMessage(args.message);
    if (!msg) return null;

    const claim = await findClaim(ctx, msg);
    if (!claim) return null;

    const alreadyStored = await ctx.db
      .query("claimEvents")
      .withIndex("by_messageId", (q) => q.eq("messageId", msg.messageId))
      .first();
    if (alreadyStored) return null;

    if (!claim.emailThreadId) {
      await ctx.db.patch("claims", claim._id, { emailThreadId: msg.threadId });
    }
    await ctx.db.insert("claimEvents", {
      claimId: claim._id,
      kind: "reply_received",
      detail: msg.text.trim().slice(0, MAX_REPLY_CHARS) || "(empty message)",
      from: msg.from,
      subject: msg.subject,
      messageId: msg.messageId,
    });
    return null;
  },
});
