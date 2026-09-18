import {
  ArrowUpRight,
  CalendarBlank,
  EnvelopeSimple,
  Gavel,
  HourglassSimpleLow,
  MagnifyingGlass,
  Scales,
} from "@phosphor-icons/react";
import { formatDate } from "../lib/format";
import { CASE } from "./DemoCards";
import { DemoPlayer } from "./DemoPlayer";

const STEPS = [
  {
    Glyph: CalendarBlank,
    title: "Convex keeps the legal clock",
    body: "Business days in Lima time, weekends and national holidays skipped. A scheduled function fires at the end of the deadline day.",
  },
  {
    Glyph: EnvelopeSimple,
    title: "AgentMail receives the reply",
    body: "You give the company your case inbox. Its reply arrives through a signed webhook and lands on the right claim.",
  },
  {
    Glyph: MagnifyingGlass,
    title: "OpenAI reads it for you",
    body: "Real commitment, resolved, or stalling. It must quote the sentence it relied on, and the quote is checked against the email.",
  },
  {
    Glyph: Scales,
    title: "Firecrawl pulls the record",
    body: "Indecopi's sanctions registry has no API. Firecrawl drives it like a browser and brings back the company's history.",
  },
];

export function DemoPage() {
  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero__title">
          Peru gives companies <span className="hero__num num">15</span> business days to answer a complaint.
          <span className="hero__turn"> Duebell makes sure they do.</span>
        </h1>
        <div className="hero__actions">
          <a className="cta" href="#/new">
            Track a complaint live
            <span className="cta__icon" aria-hidden>
              <ArrowUpRight size={16} weight="light" />
            </span>
          </a>
          <a className="cta cta--ghost" href="#how">
            How it works
          </a>
        </div>
        <ul className="outcome" aria-label="What happened in the recorded case">
          <li>
            <Scales size={18} weight="light" aria-hidden />
            <span className="num outcome__fig">{CASE.sanctions.totalSanctions}</span> prior Indecopi sanctions found
          </li>
          <li>
            <MagnifyingGlass size={18} weight="light" aria-hidden />
            Reply flagged as <strong>stalling</strong> <span className="num">({CASE.verdict.confidence.toFixed(2)})</span>
          </li>
          <li>
            <HourglassSimpleLow size={18} weight="light" aria-hidden />
            Deadline missed <span className="num">{formatDate(CASE.deadlineDate)}</span>
          </li>
          <li>
            <Gavel size={18} weight="light" aria-hidden />
            Indecopi filing drafted in Spanish
          </li>
        </ul>
      </section>

      <DemoPlayer />

      <section className="how" id="how" aria-labelledby="how-heading">
        <h2 id="how-heading" className="how__title">
          One complaint, four systems, no waiting on the consumer.
        </h2>
        <ol className="how__steps">
          {STEPS.map(({ Glyph, title, body }, i) => (
            <li key={title} className="how__step" style={{ "--i": i } as React.CSSProperties}>
              <span className="how__num num">{String(i + 1).padStart(2, "0")}</span>
              <Glyph size={22} weight="light" aria-hidden />
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
