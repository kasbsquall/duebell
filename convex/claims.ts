import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import {
  addBusinessDays,
  businessDaysElapsed,
  endOfLimaDay,
  limaDate,
  RESPONSE_DEADLINE_BUSINESS_DAYS,
  subtractBusinessDays,
} from "./lib/businessDays";
import { generateReference } from "./lib/reference";
import { startSanctionsLookup } from "./sanctions";

const MAX_TEXT = 2000;

function requireText(value: string, field: string, max = MAX_TEXT): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error(`${field} is required`);
  if (trimmed.length > max) throw new Error(`${field} is too long`);
  return trimmed;
}

// Replaces any pending deadline job with one that fires at the end of the deadline day.
async function scheduleDeadline(
  ctx: MutationCtx,
  claimId: Id<"claims">,
  deadlineDate: string,
  previousJobId?: Id<"_scheduled_functions">,
): Promise<Id<"_scheduled_functions">> {
  if (previousJobId) await ctx.scheduler.cancel(previousJobId);
  return ctx.scheduler.runAt(endOfLimaDay(deadlineDate), internal.claims.checkDeadline, {
    claimId,
  });
}

async function uniqueReference(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReference();
    const taken = await ctx.db
      .query("claims")
      .withIndex("by_referenceCode", (q) => q.eq("referenceCode", code))
      .first();
    if (!taken) return code;
  }
  throw new Error("Could not allocate a claim reference");
}

export const create = mutation({
  args: {
    companyName: v.string(),
    companyRuc: v.optional(v.string()),
    summary: v.string(),
  },
  returns: v.id("claims"),
  handler: async (ctx, args) => {
    const filedDate = limaDate(Date.now());
    const deadlineDate = addBusinessDays(filedDate, RESPONSE_DEADLINE_BUSINESS_DAYS);
    const claimId = await ctx.db.insert("claims", {
      companyName: requireText(args.companyName, "Company name", 200),
      companyRuc: args.companyRuc?.trim() || undefined,
      summary: requireText(args.summary, "Summary"),
      filedDate,
      deadlineDate,
      status: "awaiting_response",
      referenceCode: await uniqueReference(ctx),
    });
    const deadlineJobId = await scheduleDeadline(ctx, claimId, deadlineDate);
    await ctx.db.patch("claims", claimId, { deadlineJobId });
    await ctx.db.insert("claimEvents", {
      claimId,
      kind: "filed",
      detail: `Complaint filed. The company must answer by ${deadlineDate}.`,
    });
    await startSanctionsLookup(ctx, claimId, args.companyRuc?.trim() || args.companyName.trim());
    return claimId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("claims").order("desc").take(50);
  },
});

export const get = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const claim = await ctx.db.get("claims", claimId);
    if (!claim) return null;
    const events = await ctx.db
      .query("claimEvents")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .take(200);
    const sanctions = await ctx.db
      .query("sanctionChecks")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .first();
    return {
      ...claim,
      sanctions,
      businessDaysElapsed: businessDaysElapsed(claim.filedDate, limaDate(Date.now())),
      deadlineBusinessDays: RESPONSE_DEADLINE_BUSINESS_DAYS,
      events,
    };
  },
});

export const checkDeadline = internalMutation({
  args: { claimId: v.id("claims") },
  returns: v.null(),
  handler: async (ctx, { claimId }) => {
    const claim = await ctx.db.get("claims", claimId);
    if (!claim) return null;
    if (claim.status !== "awaiting_response" && claim.status !== "stalling") return null;
    await ctx.db.patch("claims", claimId, { status: "overdue", deadlineJobId: undefined });
    await ctx.db.insert("claimEvents", {
      claimId,
      kind: "deadline_passed",
      detail: `The legal deadline (${claim.deadlineDate}) passed without a real answer.`,
    });
    return null;
  },
});

// Demo mode: moves the filing date back so judges can watch the clock run out.
export const demoFastForward = mutation({
  args: { claimId: v.id("claims"), businessDays: v.number() },
  returns: v.null(),
  handler: async (ctx, { claimId, businessDays }) => {
    if (!Number.isInteger(businessDays) || businessDays < 1 || businessDays > 30) {
      throw new Error("businessDays must be an integer between 1 and 30");
    }
    const claim = await ctx.db.get("claims", claimId);
    if (!claim) throw new Error("Claim not found");

    const today = limaDate(Date.now());
    const elapsed = businessDaysElapsed(claim.filedDate, today);
    const filedDate = subtractBusinessDays(today, elapsed + businessDays);
    const deadlineDate = addBusinessDays(filedDate, RESPONSE_DEADLINE_BUSINESS_DAYS);
    const isPastDeadline = businessDaysElapsed(filedDate, today) >= RESPONSE_DEADLINE_BUSINESS_DAYS;

    let deadlineJobId: Id<"_scheduled_functions"> | undefined;
    if (claim.deadlineJobId) await ctx.scheduler.cancel(claim.deadlineJobId);
    if (isPastDeadline) {
      await ctx.scheduler.runAfter(0, internal.claims.checkDeadline, { claimId });
    } else {
      deadlineJobId = await scheduleDeadline(ctx, claimId, deadlineDate);
    }

    await ctx.db.patch("claims", claimId, { filedDate, deadlineDate, deadlineJobId });
    await ctx.db.insert("claimEvents", {
      claimId,
      kind: "demo_time_shift",
      detail: `Demo: moved ${businessDays} business days forward.`,
    });
    return null;
  },
});
