import { ConvexError } from "convex/values";

// Server-side ConvexError messages are written for users; anything else gets the fallback.
export function userMessage(err: unknown, fallback: string): string {
  return err instanceof ConvexError && typeof err.data === "string" ? err.data : fallback;
}
