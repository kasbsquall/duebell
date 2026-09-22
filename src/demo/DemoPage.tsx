import {
  ArrowUpRight,
  CalendarBlank,
  EnvelopeSimple,
  Gavel,
  HourglassSimpleLow,
  MagnifyingGlass,
  Scales,
  Bank,
  Notebook,
  Storefront,
  Coins,
  type Icon,
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

const GLOSSARY: readonly { Glyph: Icon; kind: string; term: string; def: string }[] = [
  { Glyph: Bank, kind: "Agency", term: "Indecopi", def: "Peru's national consumer protection agency. It receives consumer filings and can sanction companies." },
  { Glyph: Notebook, kind: "Where you complain", term: "Libro de Reclamaciones", def: "The complaint book every business in Peru must offer, online or in store. Filing there starts the legal clock." },
  { Glyph: HourglassSimpleLow, kind: "The deadline", term: "15 business days", def: "The time a company has to answer a complaint. Weekends and national holidays do not count." },
  { Glyph: Storefront, kind: "The company", term: "Saga Falabella", def: "A large Peruvian department store chain. It is the company in the recorded case." },
  { Glyph: Coins, kind: "Fine unit", term: "UIT", def: "Peru's tax reference unit. Indecopi states its fines in UIT." },
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
          <button
            type="button"
            className="cta cta--ghost"
            onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            How it works
          </button>
        </div>
        <p className="hero__scope">
          Starting with Peru. The deadline, holidays, sanctions registry and filing format are country rules kept apart
          from the rest, so the same inbox, reply check and scheduled deadline work anywhere a law sets a time to answer.
        </p>
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
        <p className="how__eyebrow">How it works</p>
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
      <section className="glossary" aria-labelledby="glossary-heading">
        <header className="glossary__head">
          <p className="glossary__eyebrow">Glossary</p>
          <h2 id="glossary-heading" className="glossary__title">
            New to Peru's consumer system?
          </h2>
          <p className="glossary__lede">Five terms you will meet on this page, in plain words.</p>
        </header>
        <dl className="glossary__list">
          {GLOSSARY.map(({ Glyph, kind, term, def }, i) => (
            <div key={term} className="glossary__item" style={{ "--i": i } as React.CSSProperties}>
              <span className="glossary__icon" aria-hidden>
                <Glyph size={20} weight="light" />
              </span>
              <dt>
                <span className="glossary__kind">{kind}</span>
                <span className="glossary__term">{term}</span>
              </dt>
              <dd>{def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
