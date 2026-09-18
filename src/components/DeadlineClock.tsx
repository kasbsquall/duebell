import { formatDate, type ClaimDetail } from "../lib/format";

interface DeadlineClockProps {
  claim: ClaimDetail;
}

export function DeadlineClock({ claim }: DeadlineClockProps) {
  const total = claim.deadlineBusinessDays;
  const elapsed = Math.min(claim.businessDaysElapsed, total);
  const left = Math.max(total - claim.businessDaysElapsed, 0);
  const overdue = claim.status === "overdue";

  return (
    <section className="clock" aria-labelledby="clock-heading">
      <p className="eyebrow" id="clock-heading">
        Legal response window
      </p>

      <div className="clock__figure">
        <span className="clock__label">Business day</span>
        <span className="clock__count num" aria-live="polite">
          <span key={elapsed} className="clock__digits">
            {elapsed}
          </span>
          <span className="clock__of">of {total}</span>
        </span>
      </div>

      <ol className="ticks" aria-label={`${elapsed} of ${total} business days used`}>
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={`tick ${i < elapsed ? "tick--used" : ""} ${overdue ? "tick--late" : ""}`}
            style={{ "--i": Math.min(i, 7) } as React.CSSProperties}
          />
        ))}
      </ol>

      <dl className="clock__facts">
        <div>
          <dt>Filed</dt>
          <dd className="num">{formatDate(claim.filedDate)}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd className="num">{formatDate(claim.deadlineDate)}</dd>
        </div>
        <div>
          <dt>Days left</dt>
          <dd className="num">{overdue ? "0, missed" : `${left} business`}</dd>
        </div>
      </dl>

      {overdue && (
        <p className="stamp" role="status">
          Overdue
        </p>
      )}

      <p className="clock__law">
        Peruvian law gives the company 15 business days to answer, with no extension. Weekends and
        national holidays do not count.
      </p>
    </section>
  );
}
