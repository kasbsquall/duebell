import { DAY, HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";

// Every limit here guards a paid call (OpenAI, Firecrawl) or an outbound email.
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Per user
  createClaim: { kind: "token bucket", rate: 10, period: HOUR, capacity: 5 },
  simulateReply: { kind: "token bucket", rate: 10, period: HOUR, capacity: 5 },
  refreshRecord: { kind: "fixed window", rate: 5, period: HOUR },
  sendLetter: { kind: "fixed window", rate: 3, period: DAY },
  // Whole deployment: Firecrawl browser sessions are the most expensive call.
  registryLookup: { kind: "token bucket", rate: 60, period: HOUR, capacity: 20 },
});

export type LimitName = "createClaim" | "simulateReply" | "refreshRecord" | "sendLetter";

// Throws a message the UI can show as is.
export async function enforceLimit(ctx: MutationCtx, name: LimitName, key: string, what: string) {
  const { ok, retryAfter } = await rateLimiter.limit(ctx, name, { key });
  if (!ok) {
    const minutes = Math.max(1, Math.ceil((retryAfter ?? 0) / 60_000));
    throw new ConvexError(`${what} is paused for this session. Try again in ${minutes} min.`);
  }
}
