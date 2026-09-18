/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { buildLetter, isValidEmail, letterSubject } from "./lib/letter";
import { extractReference } from "./lib/reference";
import { signedIn } from "../test/convex";

// Friday 2026-09-18, 10:00 in Lima
const NOW = Date.UTC(2026, 8, 18, 15, 0);

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => {
    throw new Error("network disabled in tests");
  }));
  vi.stubEnv("AGENTMAIL_INBOX_ADDRESS", "duebell@agentmail.to");
  vi.stubEnv("AGENTMAIL_API_KEY", "test-key");
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function withClaim() {
  const t = await signedIn();
  const claimId = await t.mutation(api.claims.create, {
    companyName: "Tienda Ejemplo S.A.C.",
    summary: "Paid for a refrigerator that was never delivered.",
  });
  return { t, claimId };
}

const events = (t: Awaited<ReturnType<typeof withClaim>>["t"], claimId: Id<"claims">) =>
  t.query(api.claims.get, { claimId }).then((c) => c!.events);

describe("letter", () => {
  const input = {
    companyName: "Tienda Ejemplo S.A.C.",
    referenceCode: "RC-7K2P",
    filedDate: "2026-09-18",
    deadlineDate: "2026-10-09",
    summary: "Refrigerator never delivered.",
    overdue: false,
  };

  test("the subject carries the reference the webhook routes replies by", () => {
    expect(extractReference(letterSubject(input))).toBe("RC-7K2P");
  });

  test("states the deadline, and the Indecopi step once it has passed", () => {
    expect(buildLetter(input, "es")).toContain("vence el 2026-10-09");
    expect(buildLetter({ ...input, overdue: true }, "es")).toContain("venció el 2026-10-09");
    expect(buildLetter({ ...input, overdue: true }, "en")).toContain("expired on 2026-10-09");
  });

  test("accepts one plain address only", () => {
    expect(isValidEmail("reclamos@tienda.pe")).toBe(true);
    expect(isValidEmail("a@b.pe, c@d.pe")).toBe(false);
    expect(isValidEmail("Name <a@b.pe>")).toBe(false);
    expect(isValidEmail("no-at-sign.pe")).toBe(false);
  });
});

describe("outbound.sendLetter", () => {
  test("logs the letter on the claim as pending until AgentMail answers", async () => {
    const { t, claimId } = await withClaim();
    await t.mutation(api.outbound.sendLetter, { claimId, to: " Reclamos@Tienda.pe ", confirmed: true });
    const sent = (await events(t, claimId)).filter((e) => e.kind === "letter_sent");
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("reclamos@tienda.pe");
    const letters = await t.query(api.outbound.letters, { claimId });
    expect(letters).toHaveLength(1);
    expect(letters[0].to).toBe("reclamos@tienda.pe");
    expect(letters[0].status).toBe("pending");
  });

  test("marks the letter sent and adopts its thread once AgentMail accepts it", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("api.agentmail.to")) {
        return new Response(JSON.stringify({ message_id: "m-1", thread_id: "t-1" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      throw new Error("network disabled in tests");
    }));
    const { t, claimId } = await withClaim();
    await t.mutation(api.outbound.sendLetter, { claimId, to: "a@b.pe", confirmed: true });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const [letter] = await t.query(api.outbound.letters, { claimId });
    expect(letter.status).toBe("sent");
    const claim = await t.query(api.claims.get, { claimId });
    expect(claim!.emailThreadId).toBe("t-1");
  });

  test("marks the letter failed after the retrier gives up", async () => {
    const { t, claimId } = await withClaim();
    await t.mutation(api.outbound.sendLetter, { claimId, to: "a@b.pe", confirmed: true });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const [letter] = await t.query(api.outbound.letters, { claimId });
    expect(letter.status).toBe("failed");
    expect(letter.error).toMatch(/network disabled/);
  });

  test("refuses without confirmation or with a bad address", async () => {
    const { t, claimId } = await withClaim();
    await expect(t.mutation(api.outbound.sendLetter, { claimId, to: "a@b.pe", confirmed: false })).rejects.toThrow();
    await expect(t.mutation(api.outbound.sendLetter, { claimId, to: "a@b.pe; c@d.pe", confirmed: true })).rejects.toThrow();
  });

  test("allows two letters per claim", async () => {
    const { t, claimId } = await withClaim();
    await t.mutation(api.outbound.sendLetter, { claimId, to: "a@b.pe", confirmed: true });
    await t.mutation(api.outbound.sendLetter, { claimId, to: "a@b.pe", confirmed: true });
    await expect(t.mutation(api.outbound.sendLetter, { claimId, to: "a@b.pe", confirmed: true })).rejects.toThrow(
      /at most 2/,
    );
  });

  test("another user cannot send from someone else's claim", async () => {
    const { t, claimId } = await withClaim();
    const stranger = await signedIn(t.raw);
    await expect(stranger.mutation(api.outbound.sendLetter, { claimId, to: "a@b.pe", confirmed: true })).rejects.toThrow(
      /Claim not found/,
    );
    await expect(stranger.query(api.outbound.letters, { claimId })).rejects.toThrow(/Claim not found/);
  });
});

describe("claims.markResolved", () => {
  test("stops the clock: the deadline job no longer marks it overdue", async () => {
    const { t, claimId } = await withClaim();
    await t.mutation(api.claims.markResolved, { claimId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const claim = await t.query(api.claims.get, { claimId });
    expect(claim!.status).toBe("resolved");
    expect(claim!.events.some((e) => e.kind === "resolved")).toBe(true);
    expect(claim!.events.some((e) => e.kind === "deadline_passed")).toBe(false);
  });
});

describe("claims.warnDeadlines (daily cron)", () => {
  test("posts one notice when 3 or fewer business days remain", async () => {
    const { t, claimId } = await withClaim();
    await t.mutation(api.claims.demoFastForward, { claimId, businessDays: 12 });
    expect(await t.mutation(internal.claims.warnDeadlines, {})).toBe(1);
    expect(await t.mutation(internal.claims.warnDeadlines, {})).toBe(0);
    const notices = (await events(t, claimId)).filter((e) => e.kind === "deadline_soon");
    expect(notices).toHaveLength(1);
    expect(notices[0].detail).toMatch(/^3 business days left/);
  });

  test("leaves claims with time to spare alone", async () => {
    const { t } = await withClaim();
    expect(await t.mutation(internal.claims.warnDeadlines, {})).toBe(0);
  });
});

describe("rate limits", () => {
  test("a session cannot file more than 5 complaints in a burst", async () => {
    const t = await signedIn();
    const claim = { companyName: "Tienda", summary: "Refund missing." };
    for (let i = 0; i < 5; i++) await t.mutation(api.claims.create, claim);
    await expect(t.mutation(api.claims.create, claim)).rejects.toThrow(/paused for this session/);
    // Another session has its own budget.
    const other = await signedIn(t.raw);
    await expect(other.mutation(api.claims.create, claim)).resolves.toBeDefined();
  });
});

describe("reply analysis with retries", () => {
  test("records a failure after the retrier gives up, so the UI stops waiting", async () => {
    const { t, claimId } = await withClaim();
    await t.mutation(api.inbound.simulateReply, { claimId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    const log = await events(t, claimId);
    const reply = log.find((e) => e.kind === "reply_received")!;
    expect(reply.analysisRunId).toBeDefined();
    const failed = log.find((e) => e.kind === "analysis_failed");
    expect(failed?.replyEventId).toBe(reply._id);
  });
});
