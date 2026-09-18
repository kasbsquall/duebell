import { ArrowSquareOut, Copy, Megaphone } from "@phosphor-icons/react";
import { useState } from "react";
import { formatDate, type ClaimDetail } from "../lib/format";

const RECLAMA_VIRTUAL_URL = "https://enlinea.indecopi.gob.pe/reclamavirtual/";

// Indecopi filings are in Spanish, so the draft stays in Spanish.
function buildDraft(claim: ClaimDetail): string {
  const lastVerdict = [...claim.events].reverse().find((e) => e.kind === "classified");
  const lines = [
    `Proveedor: ${claim.sanctions?.legalName ?? claim.companyName}${claim.sanctions?.ruc ? ` (RUC ${claim.sanctions.ruc})` : ""}`,
    `Reclamo presentado en el Libro de Reclamaciones el ${claim.filedDate}. Referencia ${claim.referenceCode}.`,
    `Hechos: ${claim.summary}`,
    claim.status === "overdue"
      ? `El proveedor no brindó una respuesta dentro del plazo de 15 días hábiles, vencido el ${claim.deadlineDate}.`
      : `El proveedor respondió sin ofrecer una solución concreta, fecha ni monto.`,
    lastVerdict?.evidenceQuote ? `Respuesta recibida: "${lastVerdict.evidenceQuote}"` : "",
    "Solicito la intervención de Indecopi para que el proveedor atienda mi reclamo.",
  ];
  return lines.filter(Boolean).join("\n\n");
}

interface NextStepProps {
  claim: ClaimDetail;
}

export function NextStep({ claim }: NextStepProps) {
  const [copied, setCopied] = useState(false);
  const draft = buildDraft(claim);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
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
        Your filing is drafted in Spanish, the language Indecopi requires. Review it, then submit it
        yourself on Reclama Virtual. We never file on your behalf.
      </p>
      <pre className="next__draft">{draft}</pre>
      <div className="next__actions">
        <button className="btn btn--primary" onClick={copyDraft}>
          <Copy size={16} weight="light" aria-hidden />
          {copied ? "Copied" : "Copy filing"}
        </button>
        <a className="btn btn--quiet" href={RECLAMA_VIRTUAL_URL} target="_blank" rel="noopener noreferrer">
          Open Reclama Virtual
          <ArrowSquareOut size={16} weight="light" aria-hidden />
        </a>
      </div>
    </section>
  );
}
