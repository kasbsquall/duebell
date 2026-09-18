import { ArrowBendUpLeft, Copy, EnvelopeSimple, PaperPlaneTilt } from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { SAMPLE_STALLING_REPLY } from "../../convex/lib/sampleReply";
import type { ClaimDetail } from "../lib/format";

interface ReplyChannelProps {
  claim: ClaimDetail;
  inboxAddress: string;
}

export function ReplyChannel({ claim, inboxAddress }: ReplyChannelProps) {
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const simulate = useMutation(api.inbound.simulateReply);
  const simulated = claim.events.some((e) => e.messageId?.startsWith("simulated:"));
  const subject = `Re: Complaint [Ref ${claim.referenceCode}]`;
  const mailto = `mailto:${inboxAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(SAMPLE_STALLING_REPLY)}`;

  async function simulateReply() {
    setSimulating(true);
    setSimError(null);
    try {
      await simulate({ claimId: claim._id });
    } catch (err) {
      setSimError(err instanceof ConvexError ? String(err.data) : "Could not simulate the reply. Try again.");
    } finally {
      setSimulating(false);
    }
  }

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

      <div className="channel__actions">
        <button className="btn btn--primary" onClick={simulateReply} disabled={simulated || simulating}>
          <ArrowBendUpLeft size={16} weight="light" aria-hidden />
          {simulated ? "Sample reply used" : simulating ? "Delivering" : "Simulate the company's reply"}
        </button>
        <a className="btn btn--quiet" href={mailto}>
          <PaperPlaneTilt size={16} weight="light" aria-hidden />
          Send a real one by email
        </a>
      </div>
      {simError && (
        <p className="hint hint--error" role="alert">
          {simError}
        </p>
      )}
      <p className="hint">
        Both deliver a typical non-answer. The simulated one skips your mail client and goes through
        the same handler as a real email, once per claim. Watch this page classify it live.
      </p>
    </section>
  );
}
