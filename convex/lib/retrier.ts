import { ActionRetrier } from "@convex-dev/action-retrier";
import { components } from "../_generated/api";

// OpenAI calls retry on transient failures (rate limits, 5xx): 2s, 4s, 8s.
export const retrier = new ActionRetrier(components.actionRetrier, {
  initialBackoffMs: 2000,
  base: 2,
  maxFailures: 3,
});

// Firecrawl browser sessions are the most expensive call: one retry, after 10 seconds.
export const registryRetrier = new ActionRetrier(components.actionRetrier, {
  initialBackoffMs: 10_000,
  base: 2,
  maxFailures: 1,
});
