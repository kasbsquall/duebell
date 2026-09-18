import type { ClaimDetail } from "./format";

export type Lang = "es" | "en";

export interface DraftInput {
  companyName: string;
  legalName?: string;
  ruc?: string;
  filedDate: string;
  deadlineDate: string;
  referenceCode?: string;
  summary: string;
  overdue: boolean;
  quote?: string;
}

export function draftInputFromClaim(claim: ClaimDetail): DraftInput {
  const lastVerdict = [...claim.events].reverse().find((e) => e.kind === "classified");
  return {
    companyName: claim.companyName,
    legalName: claim.sanctions?.legalName,
    ruc: claim.sanctions?.ruc,
    filedDate: claim.filedDate,
    deadlineDate: claim.deadlineDate,
    referenceCode: claim.referenceCode,
    summary: claim.summary,
    overdue: claim.status === "overdue",
    quote: lastVerdict?.evidenceQuote,
  };
}

// Indecopi filings are in Spanish; the English version is a reference for the user.
export function buildDraft(claim: DraftInput, lang: Lang): string {
  const ruc = claim.ruc ? ` (RUC ${claim.ruc})` : "";
  const company = `${claim.legalName ?? claim.companyName}${ruc}`;
  const { overdue, quote } = claim;

  const lines =
    lang === "es"
      ? [
          `Proveedor: ${company}`,
          `Reclamo presentado en el Libro de Reclamaciones el ${claim.filedDate}. Referencia ${claim.referenceCode}.`,
          `Hechos (descripción del consumidor, texto original): ${claim.summary}`,
          overdue
            ? `El proveedor no brindó una respuesta dentro del plazo de 15 días hábiles, vencido el ${claim.deadlineDate}.`
            : "El proveedor respondió sin ofrecer una solución concreta, fecha ni monto.",
          quote ? `Respuesta recibida del proveedor (texto original): "${quote}"` : "",
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
