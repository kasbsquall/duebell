import { FastForward, SealCheck } from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { isAlarm, STATUS_LABEL } from "../lib/format";
import { CompanyLetter } from "./CompanyLetter";
import { DeadlineClock } from "./DeadlineClock";
import { NextStep } from "./NextStep";
import { ReplyChannel } from "./ReplyChannel";
import { SanctionsCard } from "./SanctionsCard";
import { Timeline } from "./Timeline";
import { VerdictCard } from "./VerdictCard";

interface ClaimViewProps {
  claimId: Id<"claims">;
  inboxAddress: string;
}

export function ClaimView({ claimId, inboxAddress }: ClaimViewProps) {
  const claim = useQuery(api.claims.get, { claimId });
  const fastForward = useMutation(api.claims.demoFastForward);
  const markResolved = useMutation(api.claims.markResolved);

  if (claim === undefined) {
    return (
      <div className="claim" aria-busy="true">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--hero" />
      </div>
    );
  }
  if (claim === null) {
    return <p className="muted">This complaint is not in your session. Complaints are private to the browser that filed them.</p>;
  }

  const replies = claim.events.filter((e) => e.kind === "reply_received");
  const latestReply = replies[replies.length - 1];
  const latestClassification = latestReply
    ? claim.events.find((e) => e.kind === "classified" && e.replyEventId === latestReply._id)
    : undefined;
  const analysisFailed =
    !!latestReply && claim.events.some((e) => e.kind === "analysis_failed" && e.replyEventId === latestReply._id);
  const daysLeft = claim.deadlineBusinessDays - claim.businessDaysElapsed;

  return (
    <article className="claim" key={claim._id}>
      <header className="claim__head">
        <div>
          <p className="eyebrow num">{claim.referenceCode}</p>
          <h1 className="claim__company">{claim.companyName}</h1>
          <p className="claim__summary">{claim.summary}</p>
        </div>
        <div className="claim__side">
          <p className={`status ${isAlarm(claim.status) ? "status--alarm" : ""} status--${claim.status}`}>
            {STATUS_LABEL[claim.status]}
          </p>
          {claim.status !== "resolved" && (
            <button
              className="btn btn--quiet claim__resolve"
              onClick={() => {
                if (window.confirm("Mark this complaint as resolved? The clock stops.")) void markResolved({ claimId });
              }}
            >
              <SealCheck size={16} weight="light" aria-hidden />
              The company fixed it
            </button>
          )}
        </div>
      </header>

      {claim.status !== "overdue" && claim.status !== "resolved" && (
        <aside className="demo" aria-label="Demo controls">
          <span className="demo__label">
            <FastForward size={14} weight="light" aria-hidden /> Demo: skip ahead in time
          </span>
          <button
            className="btn btn--quiet"
            onClick={() => fastForward({ claimId, businessDays: Math.min(5, Math.max(daysLeft - 1, 1)) })}
            disabled={daysLeft <= 1}
          >
            +{Math.min(5, Math.max(daysLeft - 1, 1))} business days
          </button>
          <button
            className="btn btn--quiet"
            onClick={() => fastForward({ claimId, businessDays: Math.max(daysLeft, 1) })}
          >
            Jump past the deadline
          </button>
        </aside>
      )}

      <div className="claim__grid">
        <div className="block block--clock">
          <DeadlineClock claim={claim} />
        </div>
        <div className="block block--record">
          <SanctionsCard claim={claim} />
        </div>
        <div className="block block--verdict">
          <VerdictCard
            reply={latestReply}
            classification={latestClassification}
            isClassifying={!!latestReply && !latestClassification && !analysisFailed}
            analysisFailed={analysisFailed}
          />
        </div>
        <div className="block block--channel">
          <ReplyChannel claim={claim} inboxAddress={inboxAddress} />
        </div>
        {isAlarm(claim.status) && (
          <div className="block block--next">
            <NextStep claim={claim} />
          </div>
        )}
        <div className="block block--letter">
          <CompanyLetter claim={claim} inboxAddress={inboxAddress} />
        </div>
        <div className="block block--timeline">
          <Timeline events={claim.events} />
        </div>
      </div>

    </article>
  );
}
