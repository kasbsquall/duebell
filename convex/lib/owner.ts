import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Not signed in");
  return userId;
}

// Loads a claim only if it belongs to the signed-in user. Someone else's claim is
// reported as missing, so claim ids cannot be probed.
export async function requireOwnClaim(
  ctx: QueryCtx | MutationCtx,
  claimId: Id<"claims">,
): Promise<Doc<"claims">> {
  const userId = await requireUser(ctx);
  const claim = await ctx.db.get("claims", claimId);
  if (!claim || claim.ownerId !== userId) throw new ConvexError("Claim not found");
  return claim;
}
