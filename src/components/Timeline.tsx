import {
  Alarm,
  ClockCountdown,
  PaperPlaneTilt,
  WarningCircle,
  EnvelopeOpen,
  FastForward,
  FilePlus,
  Robot,
  SealCheck,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { formatTime, type ClaimEvent } from "../lib/format";

const KIND: Record<ClaimEvent["kind"], { Icon: Icon; label: string }> = {
  filed: { Icon: FilePlus, label: "Complaint filed" },
  reply_received: { Icon: EnvelopeOpen, label: "Company replied" },
  classified: { Icon: Robot, label: "Reply analyzed" },
  deadline_passed: { Icon: ClockCountdown, label: "Deadline missed" },
  resolved: { Icon: SealCheck, label: "Marked resolved" },
  demo_time_shift: { Icon: FastForward, label: "Demo time jump" },
  letter_sent: { Icon: PaperPlaneTilt, label: "Letter sent" },
  deadline_soon: { Icon: Alarm, label: "Deadline close" },
  analysis_failed: { Icon: WarningCircle, label: "Analysis failed" },
};

interface TimelineProps {
  events: ClaimEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const ordered = [...events].reverse();
  return (
    <section className="timeline" aria-labelledby="timeline-heading">
      <p className="eyebrow" id="timeline-heading">
        Case file
      </p>
      <ol>
        {ordered.map((event, i) => {
          const { Icon, label } = KIND[event.kind];
          const alarm =
            event.kind === "deadline_passed" || event.kind === "analysis_failed" || event.verdict === "stalling";
          return (
            <li
              key={event._id}
              className={`timeline__item ${alarm ? "timeline__item--alarm" : ""}`}
              style={{ "--i": Math.min(i, 7) } as React.CSSProperties}
            >
              <Icon size={18} weight="light" aria-hidden />
              <div>
                <p className="timeline__label">
                  {label}
                  {event.verdict && <span className="timeline__verdict"> · {event.verdict}</span>}
                </p>
                <p className="timeline__detail">{event.detail}</p>
              </div>
              <time className="num muted">{formatTime(event._creationTime)}</time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
