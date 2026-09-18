import { httpRouter } from "convex/server";
import { AgentMail } from "@agentmail/convex";
import { components, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail);

const http = httpRouter();

http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body: unknown = await req.clone().json().catch(() => null);
    // @agentmail/convex 0.1.0 types its ctx against an older Convex; runtime shape is the same.
    const res = await agentmail.handleWebhook(
      ctx as unknown as Parameters<typeof agentmail.handleWebhook>[0],
      req,
    );
    // The component verifies the signature and stores the event. Its callback queue
    // did not dispatch in testing, so we hand verified inbound mail to our handler here.
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

export default http;
