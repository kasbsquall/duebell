import { action } from "./_generated/server";
import { v } from "convex/values";

// Temporary spike: checks whether Firecrawl can read a given page.
export const scrape = action({
  args: { url: v.string(), actions: v.optional(v.any()) },
  handler: async (_ctx, { url, actions }) => {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], actions }),
    });
    const body = await res.json();
    return {
      status: res.status,
      markdown: body?.data?.markdown?.slice(0, 4000),
      error: body?.error,
    };
  },
});
