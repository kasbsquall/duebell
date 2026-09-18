import { v } from "convex/values";
import { query } from "./_generated/server";

// Public, non-secret settings the UI needs.
export const get = query({
  args: {},
  returns: v.object({ inboxAddress: v.string() }),
  handler: async () => ({
    inboxAddress: process.env.AGENTMAIL_INBOX_ADDRESS ?? "",
  }),
});
