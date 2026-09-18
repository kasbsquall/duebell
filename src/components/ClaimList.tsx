import { Plus } from "@phosphor-icons/react";
import type { Id } from "../../convex/_generated/dataModel";
import { formatDate, isAlarm, STATUS_LABEL, type ClaimSummary } from "../lib/format";

interface ClaimListProps {
  claims: ClaimSummary[] | undefined;
  selectedId: Id<"claims"> | null;
  onSelect: (id: Id<"claims">) => void;
  onNew: () => void;
}

export function ClaimList({ claims, selectedId, onSelect, onNew }: ClaimListProps) {
  return (
    <nav className="docket" aria-label="Your complaints">
      <button className="btn btn--primary docket__new" onClick={onNew}>
        <Plus size={16} weight="light" aria-hidden />
        New complaint
      </button>

      {claims === undefined && (
        <div aria-busy="true">
          <div className="skeleton skeleton--row" />
          <div className="skeleton skeleton--row" />
        </div>
      )}

      {claims?.length === 0 && <p className="muted docket__empty">No complaints yet.</p>}

      <ol className="docket__list">
        {claims?.map((claim, i) => {
          const left = Math.max(15 - claim.businessDaysElapsed, 0);
          return (
            <li key={claim._id} style={{ "--i": Math.min(i, 7) } as React.CSSProperties}>
              <button
                className={`docket__item ${claim._id === selectedId ? "is-selected" : ""}`}
                onClick={() => onSelect(claim._id)}
                aria-current={claim._id === selectedId ? "true" : undefined}
              >
                <span className="docket__company">{claim.companyName}</span>
                <span className={`docket__status ${isAlarm(claim.status) ? "is-alarm" : ""}`}>
                  {STATUS_LABEL[claim.status]}
                </span>
                <span className="docket__days num">
                  {claim.status === "overdue" ? `due ${formatDate(claim.deadlineDate)}` : `${left} days left`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
