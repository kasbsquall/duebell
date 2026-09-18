import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { ClaimList } from "./components/ClaimList";
import { ClaimView } from "./components/ClaimView";
import { Wordmark } from "./components/Logo";
import { NewClaim } from "./components/NewClaim";

// The selected claim lives in the URL hash so a claim page can be shared or reloaded.
function readHash(): Id<"claims"> | null {
  const id = window.location.hash.replace(/^#\/?claim\//, "");
  return id && id !== window.location.hash ? (id as Id<"claims">) : null;
}

export default function App() {
  const claims = useQuery(api.claims.list);
  const config = useQuery(api.config.get);
  const [selectedId, setSelectedId] = useState<Id<"claims"> | null>(readHash);

  useEffect(() => {
    const onHash = () => setSelectedId(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function select(id: Id<"claims"> | null) {
    window.location.hash = id ? `/claim/${id}` : "";
    setSelectedId(id);
  }

  return (
    <div className="shell">
      <header className="masthead">
        <a className="wordmark" href="#" onClick={() => select(null)} aria-label="Duebell home">
          <Wordmark />
        </a>
        <p className="masthead__tag">Peru gives companies 15 business days to answer a complaint. We make sure they do.</p>
      </header>

      <div className="layout">
        <ClaimList claims={claims} selectedId={selectedId} onSelect={select} onNew={() => select(null)} />
        <main className="stage">
          {selectedId ? (
            <ClaimView claimId={selectedId} inboxAddress={config?.inboxAddress ?? ""} />
          ) : (
            <NewClaim onCreated={select} />
          )}
        </main>
      </div>
    </div>
  );
}
