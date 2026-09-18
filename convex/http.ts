import { httpRouter } from "convex/server";
import { AgentMail } from "@agentmail/convex";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components, internal } from "./_generated/api";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail);

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const raw = await req.text();
    let body: unknown = null;
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
    // @agentmail/convex 0.1.0 types its ctx against an older Convex; runtime shape is the same.
    const res = await agentmail.handleWebhook(
      ctx as unknown as Parameters<typeof agentmail.handleWebhook>[0],
      new Request(req.url, { method: req.method, headers: req.headers, body: raw }),
    );
    // The component verifies the signature and stores the event. We then hand verified
    // inbound mail to our handler in the same request instead of its async callback queue.
    const event = body as { event_type?: string; event_id?: string; message?: unknown } | null;
    if (res.ok && event?.event_type === "message.received") {
      await ctx.runMutation(internal.inbound.onMessageReceived, {
        message: event.message,
        thread: {},
        eventId: event.event_id ?? "",
      });
    }
    return res;
  }),
});

// Exact routes above win; everything else serves the built frontend.
registerStaticRoutes(http, components.staticHosting);

export default http;
