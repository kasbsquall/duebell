import { ArrowSquareOut, Copy, Megaphone } from "@phosphor-icons/react";
import { useState } from "react";
import { formatDate, type ClaimDetail } from "../lib/format";

const RECLAMA_VIRTUAL_URL = "https://enlinea.indecopi.gob.pe/reclamavirtual/";

type Lang = "es" | "en";

// Indecopi filings are in Spanish; the English version is a reference for the user.
function buildDraft(claim: ClaimDetail, lang: Lang): string {
  const lastVerdict = [...claim.events].reverse().find((e) => e.kind === "classified");
  const ruc = claim.sanctions?.ruc ? ` (RUC ${claim.sanctions.ruc})` : "";
  const company = `${claim.sanctions?.legalName ?? claim.companyName}${ruc}`;
  const overdue = claim.status === "overdue";
  const quote = lastVerdict?.evidenceQuote;

  const lines =
    lang === "es"
      ? [
          `Proveedor: ${company}`,
          `Reclamo presentado en el Libro de Reclamaciones el ${claim.filedDate}. Referencia ${claim.referenceCode}.`,
          `Hechos: ${claim.summary}`,
          overdue
            ? `El proveedor no brindó una respuesta dentro del plazo de 15 días hábiles, vencido el ${claim.deadlineDate}.`
            : "El proveedor respondió sin ofrecer una solución concreta, fecha ni monto.",
          quote ? `Respuesta recibida: "${quote}"` : "",
          "Solicito la intervención de Indecopi para que el proveedor atienda mi reclamo.",
        ]
      : [
          `Company: ${company}`,
          `Complaint filed in the company's complaint book on ${claim.filedDate}. Reference ${claim.referenceCode}.`,
          `Facts: ${claim.summary}`,
          overdue
            ? `The company did not answer within the 15 business day legal deadline, which expired on ${claim.deadlineDate}.`
            : "The company replied without offering a concrete fix, date or amount.",
          quote ? `Reply received: "${quote}"` : "",
          "I request Indecopi's intervention so the company addresses my complaint.",
        ];
  return lines.filter(Boolean).join("\n\n");
}

interface NextStepProps {
  claim: ClaimDetail;
}

export function NextStep({ claim }: NextStepProps) {
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<Lang>("es");

  async function copyFiling() {
    try {
      await navigator.clipboard.writeText(buildDraft(claim, "es"));
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
          <button className={lang === "es" ? "is-on" : ""} aria-pressed={lang === "es"} onClick={() => setLang("es")}>
            Spanish · what you file
          </button>
          <button className={lang === "en" ? "is-on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            English · for reference
          </button>
        </div>
        <pre className="next__draft" lang={lang}>
          {buildDraft(claim, lang)}
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
