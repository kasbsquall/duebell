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
);

export default defineSchema({
  claims: defineTable({
    companyName: v.string(),
    companyRuc: v.optional(v.string()),
    summary: v.string(),
    filedDate: v.string(), // Lima date, YYYY-MM-DD
    deadlineDate: v.string(), // Lima date of the 15th business day
    status: claimStatus,
    deadlineJobId: v.optional(v.id("_scheduled_functions")),
  }).index("by_status", ["status"]),

  claimEvents: defineTable({
    claimId: v.id("claims"),
    kind: eventKind,
    detail: v.string(),
  }).index("by_claimId", ["claimId"]),
});
