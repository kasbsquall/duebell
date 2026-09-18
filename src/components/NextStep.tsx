import { ArrowSquareOut, Copy, Megaphone } from "@phosphor-icons/react";
import { useState } from "react";
import { buildDraft, draftInputFromClaim, type Lang } from "../lib/draft";
import { formatDate, type ClaimDetail } from "../lib/format";

const RECLAMA_VIRTUAL_URL = "https://enlinea.indecopi.gob.pe/reclamavirtual/";

interface NextStepProps {
  claim: ClaimDetail;
}

export function NextStep({ claim }: NextStepProps) {
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<Lang>("en");

  async function copyFiling() {
    try {
      await navigator.clipboard.writeText(buildDraft(draftInputFromClaim(claim), "es"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="panel next" aria-labelledby="next-heading">
      <p className="eyebrow" id="next-heading">
        <Megaphone size={14} weight="light" aria-hidden /> Your next step
      </p>
      <h2 className="next__title">
        {claim.status === "overdue"
          ? `The company missed its ${formatDate(claim.deadlineDate)} deadline. Take it to Indecopi.`
          : "The company is stalling. You can take it to Indecopi now."}
      </h2>
      <p className="muted">
        Indecopi is Peru's consumer protection agency and only accepts filings in Spanish. Your case
        is drafted for you. Review it, then submit it yourself on Reclama Virtual, Indecopi's online
        complaint portal. We never file on your behalf.
      </p>
      <div className="next__draftbox">
        <div className="next__langs" role="group" aria-label="Filing language">
          <button className={lang === "en" ? "is-on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            English · to read
          </button>
          <button className={lang === "es" ? "is-on" : ""} aria-pressed={lang === "es"} onClick={() => setLang("es")}>
            Spanish · what you file
          </button>
        </div>
        <pre className="next__draft" lang={lang}>
          {buildDraft(draftInputFromClaim(claim), lang)}
        </pre>
      </div>
      <div className="next__actions">
        <button className="btn btn--primary" onClick={copyFiling}>
          <Copy size={16} weight="light" aria-hidden />
          {copied ? "Copied" : "Copy Spanish filing"}
        </button>
        <a className="btn btn--quiet" href={RECLAMA_VIRTUAL_URL} target="_blank" rel="noopener noreferrer">
          Open Reclama Virtual
          <ArrowSquareOut size={16} weight="light" aria-hidden />
        </a>
      </div>
    </section>
  );
}
