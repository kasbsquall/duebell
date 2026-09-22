// Turns the model's JSON answer into a verified classification of a company reply.
// The evidence quote must exist in the reply; otherwise it is discarded, so the UI
// never shows a sentence the company did not write.

export type Verdict = "commitment" | "stalling" | "resolved";
export type ClaimStatusFromVerdict = "committed" | "stalling" | "resolved";

export interface Classification {
  verdict: Verdict;
  confidence: number;
  evidenceQuote: string | null;
  reason: string;
  missing: string[];
}

const VERDICTS: readonly Verdict[] = ["commitment", "stalling", "resolved"];

export const CLASSIFICATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "confidence", "evidenceQuote", "reason", "missing"],
  properties: {
    verdict: { type: "string", enum: VERDICTS },
    confidence: { type: "number" },
    evidenceQuote: { type: "string" },
    reason: { type: "string" },
    missing: { type: "array", items: { type: "string", enum: ["date", "amount", "remedy", "responsible_person"] } },
  },
} as const;

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function verifyQuote(quote: string, reply: string): string | null {
  const needle = normalize(quote);
  if (needle.length < 8) return null;
  return normalize(reply).toLowerCase().includes(needle.toLowerCase()) ? needle : null;
}

export function parseClassification(modelOutput: string, reply: string): Classification {
  const data = JSON.parse(modelOutput) as Record<string, unknown>;
  const verdict = data.verdict as Verdict;
  if (!VERDICTS.includes(verdict)) throw new Error(`Unknown verdict: ${String(data.verdict)}`);

  const rawConfidence = typeof data.confidence === "number" ? data.confidence : 0;
  return {
    verdict,
    confidence: Math.min(1, Math.max(0, rawConfidence)),
    evidenceQuote: typeof data.evidenceQuote === "string" ? verifyQuote(data.evidenceQuote, reply) : null,
    reason: typeof data.reason === "string" ? data.reason.slice(0, 500) : "",
    missing: Array.isArray(data.missing) ? data.missing.filter((m): m is string => typeof m === "string") : [],
  };
}

// Only the user closes a claim. Anyone who knows a reference code can email the inbox, so a
// reply that says "resolved" moves the claim to committed and waits for the user to confirm.
export function statusForVerdict(verdict: Verdict): Exclude<ClaimStatusFromVerdict, "resolved"> {
  if (verdict === "stalling") return "stalling";
  return "committed";
}
