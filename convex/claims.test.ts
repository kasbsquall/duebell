/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import { newTest, signedIn } from "../test/convex";



// Friday 2026-09-18, 10:00 in Lima
const NOW = Date.UTC(2026, 8, 18, 15, 0);

beforeEach(() => {
  // Keep background lookups (Firecrawl) offline in unit tests.
  vi.stubGlobal("fetch", vi.fn(async () => {
    throw new Error("network disabled in tests");
  }));
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const newClaim = {
  companyName: "Tienda Ejemplo S.A.C.",
  summary: "Paid for a refrigerator that was never delivered.",
};

describe("claims.create", () => {
  test("starts the 15 business day clock from today in Lima", async () => {
    const t = await signedIn();
    const id = await t.mutation(api.claims.create, newClaim);

    const claim = await t.query(api.claims.get, { claimId: id });
    expect(claim?.filedDate).toBe("2026-09-18");
    expect(claim?.deadlineDate).toBe("2026-10-12");
    expect(claim?.status).toBe("awaiting_response");
    expect(claim?.events.map((e) => e.kind)).toEqual(["filed"]);
  });

  test("rejects an empty company name", async () => {
    const t = await signedIn();
    await expect(
      t.mutation(api.claims.create, { ...newClaim, companyName: "  " }),
    ).rejects.toThrow();
  });
});

describe("deadline", () => {
  test("marks the claim overdue when the deadline passes with no answer", async () => {
    const t = await signedIn();
    const id = await t.mutation(api.claims.create, newClaim);

    vi.setSystemTime(Date.UTC(2026, 9, 13, 6, 0)); // after end of Oct 12 in Lima
    vi.runAllTimers();
    await t.finishInProgressScheduledFunctions();

    const claim = await t.query(api.claims.get, { claimId: id });
    expect(claim?.status).toBe("overdue");
    expect(claim?.events.map((e) => e.kind)).toContain("deadline_passed");
  });
});

describe("claims.demoFastForward", () => {
  test("moving 11 business days forward leaves 4 days on the clock", async () => {
    const t = await signedIn();
    const id = await t.mutation(api.claims.create, newClaim);

    await t.mutation(api.claims.demoFastForward, { claimId: id, businessDays: 11 });

    const claim = await t.query(api.claims.get, { claimId: id });
    expect(claim?.businessDaysElapsed).toBe(11);
    expect(claim?.status).toBe("awaiting_response");
  });

  test("moving past the deadline makes the claim overdue", async () => {
    const t = await signedIn();
    const id = await t.mutation(api.claims.create, newClaim);

    await t.mutation(api.claims.demoFastForward, { claimId: id, businessDays: 15 });
    await t.finishAllScheduledFunctions(vi.runAllTimers);

    const claim = await t.query(api.claims.get, { claimId: id });
    expect(claim?.status).toBe("overdue");
  });
});

describe("ownership", () => {
  test("another user cannot read or change someone else's claim", async () => {
    const owner = await signedIn();
    const id = await owner.mutation(api.claims.create, newClaim);
    const stranger = await signedIn(owner.raw);

    expect(await stranger.query(api.claims.get, { claimId: id })).toBeNull();
    expect(await stranger.query(api.claims.list, {})).toEqual([]);
    await expect(
      stranger.mutation(api.claims.demoFastForward, { claimId: id, businessDays: 5 }),
    ).rejects.toThrow(/not found/i);
    await expect(stranger.mutation(api.inbound.simulateReply, { claimId: id })).rejects.toThrow(/not found/i);
  });

  test("a visitor who is not signed in cannot file a claim", async () => {
    const t = newTest();
    await expect(t.mutation(api.claims.create, newClaim)).rejects.toThrow(/not signed in/i);
    expect(await t.query(api.claims.list, {})).toEqual([]);
  });
});
