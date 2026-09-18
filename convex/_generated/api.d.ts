/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as claims from "../claims.js";
import type * as classify from "../classify.js";
import type * as config from "../config.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as inbound from "../inbound.js";
import type * as lib_businessDays from "../lib/businessDays.js";
import type * as lib_classification from "../lib/classification.js";
import type * as lib_letter from "../lib/letter.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_owner from "../lib/owner.js";
import type * as lib_reference from "../lib/reference.js";
import type * as lib_retrier from "../lib/retrier.js";
import type * as lib_sampleReply from "../lib/sampleReply.js";
import type * as lib_sanctions from "../lib/sanctions.js";
import type * as lib_translate from "../lib/translate.js";
import type * as outbound from "../outbound.js";
import type * as sanctions from "../sanctions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  claims: typeof claims;
  classify: typeof classify;
  config: typeof config;
  crons: typeof crons;
  http: typeof http;
  inbound: typeof inbound;
  "lib/businessDays": typeof lib_businessDays;
  "lib/classification": typeof lib_classification;
  "lib/letter": typeof lib_letter;
  "lib/limits": typeof lib_limits;
  "lib/owner": typeof lib_owner;
  "lib/reference": typeof lib_reference;
  "lib/retrier": typeof lib_retrier;
  "lib/sampleReply": typeof lib_sampleReply;
  "lib/sanctions": typeof lib_sanctions;
  "lib/translate": typeof lib_translate;
  outbound: typeof outbound;
  sanctions: typeof sanctions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  actionRetrier: import("@convex-dev/action-retrier/_generated/component.js").ComponentApi<"actionRetrier">;
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
};
