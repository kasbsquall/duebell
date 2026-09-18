import { CheckCircle, EnvelopeSimpleOpen, PaperPlaneTilt, WarningCircle } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import {
  buildLetter,
  isValidEmail,
  LETTER_MAX_PER_CLAIM,
  letterSubject,
  type LetterLang,
} from "../../convex/lib/letter";
import { userMessage } from "../lib/errors";
import { formatTime, type ClaimDetail } from "../lib/format";

const STATUS_COPY: Record<string, { label: string; ok: boolean | null }> = {
  pending: { label: "Sending", ok: null },
  sent: { label: "Sent", ok: true },
  delivered: { label: "Delivered", ok: true },
  failed: { label: "Failed", ok: false },
  bounced: { label: "Bounced", ok: false },
  rejected: { label: "Rejected", ok: false },
  complained: { label: "Marked as spam", ok: false },
};

interface CompanyLetterProps {
  claim: ClaimDetail;
  inboxAddress: string;
}

export function CompanyLetter({ claim, inboxAddress }: CompanyLetterProps) {
  const send = useMutation(api.outbound.sendLetter);
  const letters = useQuery(api.outbound.letters, { claimId: claim._id });
  const [lang, setLang] = useState<LetterLang>("en");
  const [to, setTo] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = {
    companyName: claim.companyName,
    referenceCode: claim.referenceCode ?? "",
    filedDate: claim.filedDate,
    deadlineDate: claim.deadlineDate,
    summary: claim.summary,
    overdue: claim.status === "overdue",
  };
  const atLimit = (letters?.length ?? 0) >= LETTER_MAX_PER_CLAIM;
  const canSend = claim.status !== "resolved" && letters !== undefined && !atLimit;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValidEmail(to.trim())) {
      setError("Enter one email address, for example reclamos@company.pe.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await send({ claimId: claim._id, to, confirmed });
      setTo("");
      setConfirmed(false);
    } catch (err) {
      setError(userMessage(err, "The letter could not be sent. Try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel next letter" aria-labelledby="letter-heading">
      <p className="eyebrow" id="letter-heading">
        <EnvelopeSimpleOpen size={14} weight="light" aria-hidden /> Put it in writing
      </p>
      <h2 className="next__title">Email the company a formal follow-up from Duebell.</h2>
      <p className="muted">
        The letter goes out in Spanish from <span className="num">{inboxAddress}</span> with reference{" "}
        <span className="num">{claim.referenceCode}</span> in the subject. When the company answers it, the reply is
        filed on this claim and analyzed like any other.
      </p>

      <div className="next__draftbox">
        <div className="next__langs" role="group" aria-label="Letter language">
          <button className={lang === "en" ? "is-on" : ""} aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            English · to read
          </button>
          <button className={lang === "es" ? "is-on" : ""} aria-pressed={lang === "es"} onClick={() => setLang("es")}>
            Spanish · what is sent
          </button>
        </div>
        <pre className="next__draft" lang={lang}>
          {`${lang === "es" ? "Asunto" : "Subject"}: ${letterSubject(input)}\n\n${buildLetter(input, lang)}`}
        </pre>
      </div>

      {canSend && (
        <form className="letter__form" onSubmit={onSubmit}>
          <label>
            Company's complaint email
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="reclamos@company.pe"
              autoComplete="off"
              maxLength={254}
              required
            />
          </label>
          <label className="letter__confirm">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>This is the company's official address, and I want Duebell to send this letter for me.</span>
          </label>
          <button className="btn btn--primary" type="submit" disabled={!confirmed || pending}>
            <PaperPlaneTilt size={16} weight="light" aria-hidden />
            {pending ? "Sending" : "Send the letter"}
          </button>
          <p className="hint">
            Up to {LETTER_MAX_PER_CLAIM} letters per complaint and 3 per day. Use the company's published complaints
            address, or your own to see how it arrives.
          </p>
          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}

      {letters === undefined ? (
        <div className="skeleton skeleton--line letter__log" />
      ) : letters.length > 0 ? (
        <ul className="letter__log" aria-label="Letters sent">
          {letters.map((l) => {
            const s = STATUS_COPY[l.status] ?? { label: l.status, ok: null };
            const Icon = s.ok === false ? WarningCircle : CheckCircle;
            return (
              <li key={l.eventId} className={s.ok === false ? "is-bad" : s.ok ? "is-ok" : ""}>
                <Icon size={16} weight="light" aria-hidden />
                <span className="num">{l.to}</span>
                <span className="letter__status">{s.label}</span>
                <time className="num muted">{formatTime(l.sentAt)}</time>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
