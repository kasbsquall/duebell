import { httpRouter } from "convex/server";
import { AgentMail } from "@agentmail/convex";
import { components, internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.inbound.onMessageReceived,
});

const http = httpRouter();

http.route({
  path: "/agentmail/webhook",
  method: "POST",
  // @agentmail/convex 0.1.0 types its ctx against an older Convex; runtime shape is the same.
  handler: httpAction(async (ctx, req) =>
    agentmail.handleWebhook(ctx as unknown as Parameters<typeof agentmail.handleWebhook>[0], req),
  ),
});

export default http;
