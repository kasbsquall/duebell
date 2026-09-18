import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { ClaimList } from "./components/ClaimList";
import { ClaimView } from "./components/ClaimView";
import { Wordmark } from "./components/Logo";
import { NewClaim } from "./components/NewClaim";
import { DemoPage } from "./demo/DemoPage";

type Route = { page: "demo" } | { page: "live"; claimId: Id<"claims"> | null };

// The route lives in the URL hash so a claim page can be shared or reloaded.
// "#/" is the recorded demo, "#/new" the live app, "#/claim/<id>" a live claim.
function readHash(): Route {
  const hash = window.location.hash;
  const claim = hash.match(/^#\/?claim\/(.+)$/);
  if (claim) return { page: "live", claimId: claim[1] as Id<"claims"> };
  if (/^#\/?new/.test(hash)) return { page: "live", claimId: null };
  return { page: "demo" };
}

export default function App() {
  const claims = useQuery(api.claims.list);
  const config = useQuery(api.config.get);
  const [route, setRoute] = useState<Route>(readHash);
  const selectedId = route.page === "live" ? route.claimId : null;
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  // The live app signs each visitor in anonymously on arrival: no form for judges,
  // and every claim belongs to the session that created it.
  useEffect(() => {
    if (route.page === "live" && !isLoading && !isAuthenticated) void signIn("anonymous");
  }, [route.page, isLoading, isAuthenticated, signIn]);

  useEffect(() => {
    const onHash = () => {
      setRoute(readHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function select(id: Id<"claims"> | null) {
    window.location.hash = id ? `/claim/${id}` : "/new";
    setRoute({ page: "live", claimId: id });
  }

  return (
    <div className="shell">
      <header className="masthead">
        <a className="wordmark" href="#/" aria-label="Duebell home">
          <Wordmark />
        </a>
        <nav className="nav" aria-label="Main">
          <a href="#/" aria-current={route.page === "demo" ? "page" : undefined}>
            Recorded case
          </a>
          <a href="#/new" aria-current={route.page === "live" ? "page" : undefined}>
            Try it live
          </a>
        </nav>
      </header>

      {route.page === "demo" ? (
        <DemoPage />
      ) : (
      <div className="layout">
        <ClaimList claims={claims} selectedId={selectedId} onSelect={select} onNew={() => select(null)} />
        <main className="stage">
          {!isAuthenticated ? (
            <div className="session-start" aria-busy="true">
              <div className="skeleton skeleton--row" />
              <p className="muted">Starting your private session…</p>
            </div>
          ) : selectedId ? (
            <ClaimView claimId={selectedId} inboxAddress={config?.inboxAddress ?? ""} />
          ) : (
            <NewClaim onCreated={select} />
          )}
        </main>
      </div>
      )}
    </div>
  );
}
