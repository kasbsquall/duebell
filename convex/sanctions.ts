import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { parseSanctionsDetail, parseSearchResults, pickBestMatch } from "./lib/sanctions";
import { translateOffenses } from "./lib/translate";

export const PORTAL_URL = "https://enlinea.indecopi.gob.pe/miraaquienlecompras/";

// Firecrawl browser steps: open the simple search, type the query, optionally open the first result.
function portalActions(query: string, openDetail: boolean) {
  const steps: object[] = [
    { type: "wait", milliseconds: 3000 },
    { type: "executeJavascript", script: 'location.hash="#/busqueda-simple"' },
    { type: "wait", milliseconds: 2500 },
    { type: "click", selector: 'input[aria-label="Búsqueda de proveedor"]' },
    { type: "write", text: query },
    { type: "click", selector: "button.btn-search" },
    { type: "wait", milliseconds: 5000 },
  ];
  if (openDetail) {
    steps.push(
      { type: "click", selector: 'img[alt="Ver detalle del proveedor"]' },
      { type: "wait", milliseconds: 6000 },
    );
  }
  return steps;
}

async function scrapePortal(query: string, openDetail: boolean): Promise<string> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: PORTAL_URL,
      formats: ["markdown"],
      actions: portalActions(query, openDetail),
    }),
  });
  const body = (await res.json()) as { data?: { markdown?: string }; error?: string };
  if (!res.ok || !body.data?.markdown) {
    throw new Error(`Firecrawl failed (${res.status}): ${body.error ?? "no markdown"}`);
  }
  return body.data.markdown;
}

export async function startSanctionsLookup(ctx: MutationCtx, claimId: Id<"claims">, query: string) {
  const existing = await ctx.db
    .query("sanctionChecks")
    .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
    .first();
  if (existing) await ctx.db.delete("sanctionChecks", existing._id);
  await ctx.db.insert("sanctionChecks", { claimId, status: "pending", query });
  await ctx.scheduler.runAfter(0, internal.sanctions.lookup, { claimId, query });
}

// Re-runs the lookup, optionally pinning the company by RUC when the name matched the wrong one.
export const refresh = mutation({
  args: { claimId: v.id("claims"), ruc: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { claimId, ruc }) => {
    const claim = await ctx.db.get("claims", claimId);
    if (!claim) throw new Error("Claim not found");
    if (ruc !== undefined) {
      if (!/^\d{11}$/.test(ruc)) throw new Error("RUC must have 11 digits");
      await ctx.db.patch("claims", claimId, { companyRuc: ruc });
    }
    await startSanctionsLookup(ctx, claimId, ruc ?? claim.companyRuc ?? claim.companyName);
    return null;
  },
});

export const lookup = internalAction({
  args: { claimId: v.id("claims"), query: v.string() },
  returns: v.null(),
  handler: async (ctx, { claimId, query }) => {
    try {
      const results = parseSearchResults(await scrapePortal(query, false));
      if (results.length === 0) {
        await ctx.runMutation(internal.sanctions.saveResult, { claimId, status: "clean" });
        return null;
      }
      // Re-search by the RUC of the best match so the detail page is unambiguous.
      const match = pickBestMatch(query, results)!;
      const detail = parseSanctionsDetail(await scrapePortal(match.ruc, true));
      if (!detail) throw new Error("Detail page could not be read");
      const labels = await translateOffenses(detail.recent.map((s) => s.offense));
      const recent = detail.recent.map((s, i) => ({ ...s, offenseEn: labels[i] }));
      await ctx.runMutation(internal.sanctions.saveResult, {
        claimId,
        status: "found",
        ruc: match.ruc,
        ...detail,
        recent,
        candidates: results.slice(0, 5),
        complaintHandlingCount: detail.recent.filter((s) => s.offense.includes("ATENCION DE RECLAMOS")).length,
      });
    } catch (error) {
      await ctx.runMutation(internal.sanctions.saveResult, {
        claimId,
        status: "failed",
        error: error instanceof Error ? error.message.slice(0, 300) : "Unknown error",
      });
    }
    return null;
  },
});

export const saveResult = internalMutation({
  args: {
    claimId: v.id("claims"),
    status: v.union(v.literal("found"), v.literal("clean"), v.literal("failed")),
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
  },
  returns: v.null(),
  handler: async (ctx, { claimId, ...result }) => {
    const check = await ctx.db
      .query("sanctionChecks")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .first();
    if (!check) return null;
    await ctx.db.patch("sanctionChecks", check._id, result);
    return null;
  },
});

