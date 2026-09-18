import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Internal only (CLI/dashboard): wipes demo data before recording or judging.
export const clearAllClaims = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const claims = await ctx.db.query("claims").take(500);
    for (const claim of claims) {
      if (claim.deadlineJobId) await ctx.scheduler.cancel(claim.deadlineJobId);
      const events = await ctx.db
        .query("claimEvents")
        .withIndex("by_claimId", (q) => q.eq("claimId", claim._id))
        .take(500);
      for (const event of events) await ctx.db.delete("claimEvents", event._id);
      const checks = await ctx.db
        .query("sanctionChecks")
        .withIndex("by_claimId", (q) => q.eq("claimId", claim._id))
        .take(10);
      for (const check of checks) await ctx.db.delete("sanctionChecks", check._id);
      await ctx.db.delete("claims", claim._id);
    }
    return claims.length;
  },
});
