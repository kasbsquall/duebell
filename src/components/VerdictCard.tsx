import { CheckCircle, Hourglass, Quotes, WarningDiamond } from "@phosphor-icons/react";
import type { ClaimEvent } from "../lib/format";
import { BellMark } from "./Logo";

const VERDICT_COPY = {
  commitment: { label: "Real commitment", Icon: CheckCircle, tone: "kept" },
  resolved: { label: "Resolved", Icon: CheckCircle, tone: "kept" },
  stalling: { label: "Stalling", Icon: WarningDiamond, tone: "alarm" },
} as const;

const MISSING_LABEL: Record<string, string> = {
  date: "A date",
  amount: "An amount",
  remedy: "A concrete fix",
  responsible_person: "A named contact",
};

interface VerdictCardProps {
  classification: ClaimEvent | undefined;
  reply: ClaimEvent | undefined;
  isClassifying: boolean;
}

export function VerdictCard({ classification, reply, isClassifying }: VerdictCardProps) {
  if (!reply) {
    return (
      <section className="panel verdict verdict--empty">
        <p className="eyebrow">Latest reply</p>
        <Hourglass size={28} weight="light" aria-hidden />
        <p className="muted">No reply yet. Replies sent to this claim's address appear here within seconds.</p>
        <BellMark size={180} className="verdict__watermark" />
      </section>
    );
  }

  if (isClassifying || !classification?.verdict) {
    return (
      <section className="panel verdict" aria-busy="true">
        <p className="eyebrow">Latest reply</p>
        <p className="verdict__reading">Reading the reply…</p>
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line short" />
      </section>
    );
  }

  const copy = VERDICT_COPY[classification.verdict];
  const confidence = Math.round((classification.confidence ?? 0) * 100);

  return (
    <section className={`panel verdict verdict--${copy.tone}`} aria-labelledby="verdict-heading">
      <p className="eyebrow">Latest reply · from {reply.from || "the company"}</p>
      <h2 id="verdict-heading" className="verdict__label">
        <copy.Icon size={26} weight="light" aria-hidden />
        {copy.label}
        <span className="verdict__confidence num">{confidence}% sure</span>
      </h2>

      {classification.evidenceQuote && (
        <blockquote className="verdict__quote">
          <Quotes size={16} weight="light" aria-hidden />
          {classification.evidenceQuote}
        </blockquote>
      )}

      <p className="verdict__reason">{classification.detail}</p>

      {classification.missing && classification.missing.length > 0 && (
        <div className="verdict__missing">
          <span className="muted">Still missing</span>
          <ul>
            {classification.missing.map((m) => (
              <li key={m}>{MISSING_LABEL[m] ?? m}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
