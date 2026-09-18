import { defineApp } from "convex/server";
import agentmail from "@agentmail/convex/convex.config";
import actionRetrier from "@convex-dev/action-retrier/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";

const app = defineApp();
app.use(agentmail);
app.use(rateLimiter);
app.use(actionRetrier);
// No httpPrefix: the webhook keeps its root URL and http.ts registers the static catch-all.
app.use(staticHosting);

export default app;
