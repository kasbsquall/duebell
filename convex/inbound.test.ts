/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function setup() {
  const t = convexTest(schema, modules);
  const claimId = await t.mutation(api.claims.create, {
    companyName: "Tienda Ejemplo S.A.C.",
    summary: "Refrigerator never delivered.",
  });
  const claim = await t.query(api.claims.get, { claimId });
  return { t, claimId, reference: claim!.referenceCode! };
}

function webhookMessage(overrides: Record<string, string>) {
  return {
    message_id: "msg-1",
    thread_id: "thread-1",
    from: "atencion@tiendaejemplo.pe",
    subject: "Re: complaint",
    extracted_text: "We are reviewing your case.",
    ...overrides,
  };
}

describe("inbound.onMessageReceived", () => {
  test("attaches a reply to the claim named in the subject", async () => {
    const { t, claimId, reference } = await setup();
    await t.mutation(internal.inbound.onMessageReceived, {
      message: webhookMessage({ subject: `Re: complaint [Ref ${reference}]` }),
      thread: {},
      eventId: "evt-1",
    });

    const claim = await t.query(api.claims.get, { claimId });
    const reply = claim!.events.find((e) => e.kind === "reply_received");
    expect(reply?.detail).toBe("We are reviewing your case.");
    expect(reply?.from).toBe("atencion@tiendaejemplo.pe");
    expect(claim!.emailThreadId).toBe("thread-1");
  });

  test("later replies in the same thread need no reference", async () => {
    const { t, claimId, reference } = await setup();
    await t.mutation(internal.inbound.onMessageReceived, {
      message: webhookMessage({ subject: `[Ref ${reference}]` }),
      thread: {},
      eventId: "evt-1",
    });
    await t.mutation(internal.inbound.onMessageReceived, {
      message: webhookMessage({ message_id: "msg-2", subject: "Re: update" }),
      thread: {},
      eventId: "evt-2",
    });

    const claim = await t.query(api.claims.get, { claimId });
    expect(claim!.events.filter((e) => e.kind === "reply_received")).toHaveLength(2);
  });

  test("the same message delivered twice is stored once", async () => {
    const { t, claimId, reference } = await setup();
    const message = webhookMessage({ subject: `[Ref ${reference}]` });
    await t.mutation(internal.inbound.onMessageReceived, { message, thread: {}, eventId: "a" });
    await t.mutation(internal.inbound.onMessageReceived, { message, thread: {}, eventId: "b" });

    const claim = await t.query(api.claims.get, { claimId });
    expect(claim!.events.filter((e) => e.kind === "reply_received")).toHaveLength(1);
  });

  test("mail without a known reference or thread is ignored", async () => {
    const { t, claimId } = await setup();
    await t.mutation(internal.inbound.onMessageReceived, {
      message: webhookMessage({ subject: "Newsletter", thread_id: "other" }),
      thread: {},
      eventId: "evt-x",
    });

    const claim = await t.query(api.claims.get, { claimId });
    expect(claim!.events.some((e) => e.kind === "reply_received")).toBe(false);
  });
});
