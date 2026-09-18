import { ArrowSquareOut, Gavel, Scales } from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { userMessage } from "../lib/errors";
import type { ClaimDetail } from "../lib/format";

const PORTAL_URL = "https://enlinea.indecopi.gob.pe/miraaquienlecompras/";

interface SanctionsCardProps {
  claim: ClaimDetail;
}

export function SanctionsCard({ claim }: SanctionsCardProps) {
  const refreshRecord = useMutation(api.sanctions.refresh);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const record = claim.sanctions;

  async function refresh(args: { claimId: ClaimDetail["_id"]; ruc?: string }) {
    setRefreshError(null);
    try {
      await refreshRecord(args);
    } catch (err) {
      setRefreshError(userMessage(err, "The lookup could not start. Try again."));
    }
  }

  return (
    <section className="panel record" aria-labelledby="record-heading">
      <p className="eyebrow" id="record-heading">
        <Scales size={14} weight="light" aria-hidden /> Past sanctions · Indecopi
      </p>

      {!record && (
        <div className="record__failed">
          <p className="muted">Not checked yet.</p>
          <button className="btn btn--quiet" onClick={() => refresh({ claimId: claim._id })}>
            Check Indecopi now
          </button>
        </div>
      )}

      {refreshError && (
        <p className="form__error" role="alert">
          {refreshError}
        </p>
      )}

      {record?.status === "pending" && <PendingLookup company={record.query} />}

      {record?.status === "clean" && (
        <p>No sanctions found for “{record.query}” in the last 4 years.</p>
      )}

      {record?.status === "failed" && (
        <div className="record__failed">
          <p className="muted">
            {record.error?.startsWith("The registry lookup is paused")
              ? record.error
              : "The Indecopi registry did not answer this time."}
          </p>
          <button className="btn btn--quiet" onClick={() => refresh({ claimId: claim._id })}>
            Try again
          </button>
        </div>
      )}

      {record?.status === "found" && (
        <>
          <div className="record__figure">
            <span className="record__count num">{record.totalSanctions}</span>
            <span className="record__unit">
              sanctions
              <br />
              <span className="num">
                {record.totalFineUit?.toFixed(2)} UIT
              </span>{" "}
              in fines
              <br />
              <span className="record__gloss">UIT is Peru's official fine unit</span>
            </span>
          </div>
          <p className="record__who">
            {record.legalName} · RUC <span className="num">{record.ruc}</span>
          </p>

          {(record.complaintHandlingCount ?? 0) > 0 && (
            <p className="record__flag">
              <Gavel size={16} weight="light" aria-hidden />
              Recently sanctioned for how it handles complaints.
            </p>
          )}

          <ul className="record__list">
            {record.recent?.slice(0, 3).map((s) => (
              <li key={s.resolution} style={{ "--i": 0 } as React.CSSProperties}>
                <span className="num muted">{s.finalDate}</span>
                <span>{s.offenseEn ?? s.offense.toLowerCase()}</span>
              </li>
            ))}
          </ul>

          {record.candidates && record.candidates.length > 1 && (
            <label className="record__switch">
              <span className="muted">Wrong company?</span>
              <select
                value={record.ruc}
                onChange={(e) => refresh({ claimId: claim._id, ruc: e.target.value })}
              >
                {record.candidates.map((c) => (
                  <option key={c.ruc} value={c.ruc}>
                    {c.legalName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <a className="link" href={PORTAL_URL} target="_blank" rel="noopener noreferrer">
            Source: Indecopi public sanctions registry · last 4 years
            <ArrowSquareOut size={14} weight="light" aria-hidden />
          </a>
        </>
      )}
    </section>
  );
}

// Firecrawl drives a registry with no API, which takes a while. Show that work is happening
// and for how long, instead of a grey block that reads as broken.
// The count starts when this view opened; server and browser clocks can disagree.
function PendingLookup({ company }: { company: string }) {
  const [since] = useState(() => Date.now());
  const [now, setNow] = useState(since);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - since) / 1000));

  return (
    <div className="lookup" aria-busy="true" aria-live="polite">
      <span className="lookup__bar" aria-hidden />
      <p className="lookup__title">Searching Indecopi's public registry for “{company}”</p>
      <p className="muted">
        The registry has no API, so Firecrawl opens it like a browser, finds the company and reads its
        sanction record.
      </p>
      <p className="lookup__time num">{seconds}s so far</p>
    </div>
  );
}
