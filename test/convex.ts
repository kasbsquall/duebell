/// <reference types="vite/client" />
import agentmailSchema from "../node_modules/@agentmail/convex/dist/component/schema.js";
import actionRetrier from "@convex-dev/action-retrier/test";
import workpool from "@convex-dev/workpool/test";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import schema from "../convex/schema";

const modules = import.meta.glob("../convex/**/*.ts");
// The package's own test helper globs sources that ship without _generated; use the build.
const agentmailModules = import.meta.glob("../node_modules/@agentmail/convex/dist/component/**/*.js");

export function newTest() {
  const t = convexTest(schema, modules);
  rateLimiter.register(t);
  actionRetrier.register(t);
  t.registerComponent("agentmail", agentmailSchema, agentmailModules);
  workpool.register(t, "agentmail/sendPool");
  workpool.register(t, "agentmail/callbackPool");
  return t;
}

// Acts as a signed-in Convex Auth user: getAuthUserId reads the user id from the subject.
export async function signedIn(t = newTest()) {
  const userId = await t.run((ctx) => ctx.db.insert("users", {}));
  return Object.assign(t.withIdentity({ subject: `${userId}|test-session` }), { raw: t, userId });
}
