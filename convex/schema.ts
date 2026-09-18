import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const claimStatus = v.union(
  v.literal("awaiting_response"), // clock running, no reply yet
  v.literal("committed"), // company replied with a concrete commitment
  v.literal("stalling"), // company replied with a generic or evasive answer
  v.literal("overdue"), // 15 business days passed without a real answer
  v.literal("resolved"), // user marked it as solved
);

export const eventKind = v.union(
  v.literal("filed"),
  v.literal("reply_received"),
  v.literal("classified"),
  v.literal("deadline_passed"),
  v.literal("resolved"),
  v.literal("demo_time_shift"),
  v.literal("letter_sent"), // written follow-up emailed to the company through AgentMail
  v.literal("deadline_soon"), // daily cron: 3 or fewer business days left
  v.literal("analysis_failed"), // OpenAI failed after every retry
);

export default defineSchema({
  ...authTables,

  sanctionChecks: defineTable({
    claimId: v.id("claims"),
    status: v.union(v.literal("pending"), v.literal("found"), v.literal("clean"), v.literal("failed")),
    query: v.string(),
    legalName: v.optional(v.string()),
    ruc: v.optional(v.string()),
    totalSanctions: v.optional(v.number()),
    totalFineUit: v.optional(v.number()),
    periodFrom: v.optional(v.string()),
    periodTo: v.optional(v.string()),
    recent: v.optional(
      v.array(
        v.object({
          year: v.number(),
          matter: v.string(),
          offense: v.string(),
          resolution: v.string(),
          finalDate: v.string(),
          fineUit: v.number(),
          offenseEn: v.optional(v.string()),
        }),
      ),
    ),
    complaintHandlingCount: v.optional(v.number()),
    candidates: v.optional(v.array(v.object({ legalName: v.string(), ruc: v.string() }))),
    error: v.optional(v.string()),
  }).index("by_claimId", ["claimId"]),

  claims: defineTable({
    ownerId: v.optional(v.id("users")), // Convex Auth user who filed it
    companyName: v.string(),
    companyRuc: v.optional(v.string()),
    summary: v.string(),
    filedDate: v.string(), // Lima date, YYYY-MM-DD
    deadlineDate: v.string(), // Lima date of the 15th business day
    status: claimStatus,
    deadlineJobId: v.optional(v.id("_scheduled_functions")),
    referenceCode: v.optional(v.string()), // e.g. RC-7K2P, used in email subjects
    emailThreadId: v.optional(v.string()), // AgentMail thread once the company replies
    deadlineWarned: v.optional(v.boolean()), // the "deadline soon" notice was already posted
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_referenceCode", ["referenceCode"])
    .index("by_emailThreadId", ["emailThreadId"]),

  claimEvents: defineTable({
    claimId: v.id("claims"),
    kind: eventKind,
    detail: v.string(),
    from: v.optional(v.string()),
    subject: v.optional(v.string()),
    messageId: v.optional(v.string()),
    // Set on "classified" events
    replyEventId: v.optional(v.id("claimEvents")),
    verdict: v.optional(v.union(v.literal("commitment"), v.literal("stalling"), v.literal("resolved"))),
    confidence: v.optional(v.number()),
    evidenceQuote: v.optional(v.string()),
    missing: v.optional(v.array(v.string())),
    // Set on "reply_received": the action-retrier run that classifies it
    analysisRunId: v.optional(v.string()),
    // Set on "letter_sent": recipient and the AgentMail component's outbound id
    to: v.optional(v.string()),
    outboundId: v.optional(v.string()),
  })
    .index("by_claimId", ["claimId"])
    .index("by_messageId", ["messageId"])
    .index("by_analysisRunId", ["analysisRunId"]),
});
