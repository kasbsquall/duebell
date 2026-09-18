import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";

// Every visitor of the live app gets their own anonymous account on first load, so a
// judge can open it without signing up and still only see the claims they created.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Anonymous],
});
