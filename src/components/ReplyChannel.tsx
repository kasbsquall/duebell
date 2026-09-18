import { Copy, EnvelopeSimple, PaperPlaneTilt } from "@phosphor-icons/react";
import { useState } from "react";
import type { ClaimDetail } from "../lib/format";

const SAMPLE_STALLING_REPLY = `Dear customer,

Thank you for contacting us. Your complaint has been forwarded to the corresponding area and our team is currently reviewing your case.

We will get back to you as soon as possible.

Customer Service Team`;

interface ReplyChannelProps {
  claim: ClaimDetail;
  inboxAddress: string;
}

export function ReplyChannel({ claim, inboxAddress }: ReplyChannelProps) {
  const [copied, setCopied] = useState(false);
  const subject = `Re: Complaint [Ref ${claim.referenceCode}]`;
  const mailto = `mailto:${inboxAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(SAMPLE_STALLING_REPLY)}`;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(inboxAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="panel channel" aria-labelledby="channel-heading">
      <p className="eyebrow" id="channel-heading">
        <EnvelopeSimple size={14} weight="light" aria-hidden /> Where the company must answer
      </p>
      <p className="muted">
        Put this address as your contact email in the company's complaint book (Libro de
        Reclamaciones). We read every reply for you.
      </p>
      <div className="channel__address">
        <span className="num">{inboxAddress}</span>
        <button className="btn btn--icon" onClick={copyAddress} aria-label="Copy address">
          <Copy size={16} weight="light" aria-hidden />
        </button>
        <span className="channel__copied" aria-live="polite">
          {copied ? "Copied" : ""}
        </span>
      </div>
      <p className="channel__ref">
        Reference <span className="num">{claim.referenceCode}</span>
      </p>

      <a className="btn btn--primary" href={mailto}>
        <PaperPlaneTilt size={16} weight="light" aria-hidden />
        Reply as the company
      </a>
      <p className="hint">
        Try it: this opens your own email with a typical non-answer. Send it and watch this page
        classify it live.
      </p>
    </section>
  );
}
