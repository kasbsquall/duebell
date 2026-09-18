import {
  CalendarCheck,
  EnvelopeSimpleOpen,
  Gavel,
  HourglassSimpleLow,
  Quotes,
  Scales,
  WarningDiamond,
} from "@phosphor-icons/react";
import { buildDraft, type Lang } from "../lib/draft";
import { formatDate } from "../lib/format";
import recorded from "./recordedCase.json";
import { easeOut, ramp } from "./timeline";

export const CASE = recorded;

// Characters of `text` visible after `seconds` of typing at `cps`.
function typed(text: string, seconds: number, cps: number): string {
  return text.slice(0, Math.max(0, Math.floor(seconds * cps)));
}

// Style for an element that arrives at `at` seconds into its chapter.
function arrive(lt: number, at: number, dur = 0.45, dy = 10): React.CSSProperties {
  const p = easeOut(ramp(lt, at, at + dur));
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` };
}

const MISSING_LABEL: Record<string, string> = {
  date: "A date",
  amount: "An amount",
  remedy: "A concrete fix",
  responsible_person: "Someone responsible",
};

interface SceneProps {
  lt: number;
}

export function FiledScene({ lt }: SceneProps) {
  return (
    <div className="scene scene--filed">
      <p className="scene__kicker" style={arrive(lt, 0.1)}>
        Complaint book entry · <span className="num">{CASE.referenceCode}</span>
      </p>
      <h3 className="scene__company" style={arrive(lt, 0.3, 0.5, 18)}>
        {CASE.companyName}
      </h3>
      <p className="scene__summary">
        {typed(CASE.summary, lt - 0.9, 42)}
        {lt > 0.9 && lt < 3.2 && <span className="caret" aria-hidden />}
      </p>
      <div className="scene__job" style={arrive(lt, 3.1)}>
        <CalendarCheck size={20} weight="light" aria-hidden />
        <div>
          <p className="scene__joblabel">Deadline check scheduled</p>
          <p className="num">End of day, {formatDate(CASE.deadlineDate)} · Lima time</p>
        </div>
      </div>
    </div>
  );
}

export function RecordScene({ lt }: SceneProps) {
  const s = CASE.sanctions;
  const searching = lt < 1.6;
  const count = Math.round(easeOut(ramp(lt, 1.6, 3.2)) * s.totalSanctions);
  const fine = easeOut(ramp(lt, 1.8, 3.4)) * s.totalFineUit;
  return (
    <div className="scene scene--record">
      <p className="scene__kicker" style={arrive(lt, 0)}>
        <Scales size={16} weight="light" aria-hidden /> Indecopi sanctions registry
      </p>
      {searching ? (
        <div className="scan" aria-live="polite">
          <span className="scan__bar" style={{ transform: `scaleX(${easeOut(ramp(lt, 0.1, 1.5))})` }} />
          <p className="scan__label">Searching the public registry for “{CASE.companyName}”</p>
        </div>
      ) : (
        <>
          <p className="scene__legal" style={arrive(lt, 1.6)}>
            {s.legalName} <span className="num">· RUC {s.ruc}</span>
          </p>
          <div className="record__figures">
            <div>
              <span className="record__big num">{count}</span>
              <span className="record__cap">sanctions since {formatYear(s.periodFrom)}</span>
            </div>
            <div>
              <span className="record__mid num">{fine.toFixed(1)}</span>
              <span className="record__cap">UIT in fines (Peru's tax unit)</span>
            </div>
          </div>
          <ol className="record__rows">
            {s.recent.slice(0, 3).map((r, i) => (
              <li key={r.resolution} style={arrive(lt, 3.4 + i * 0.35)}>
                <span className="num">{formatDate(r.finalDate)}</span>
                <span>{r.offenseEn}</span>
                <span className="num record__res">{r.resolution}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function formatYear(iso: string): string {
  return iso.slice(0, 4);
}

export function ReplyScene({ lt }: SceneProps) {
  const envelope = easeOut(ramp(lt, 1.4, 2.1));
  return (
    <div className="scene scene--reply">
      <div
        className="mail"
        style={{ opacity: envelope, transform: `translateY(${(1 - envelope) * 28}px) rotate(${(1 - envelope) * -1.5}deg)` }}
      >
        <header className="mail__head">
          <EnvelopeSimpleOpen size={18} weight="light" aria-hidden />
          <span className="mail__subject">{CASE.reply.subject}</span>
          <span className="mail__to num">to the case inbox</span>
        </header>
        <pre className="mail__body">
          {typed(CASE.reply.text, lt - 2.2, 70)}
          {lt > 2.2 && lt < 5.6 && <span className="caret" aria-hidden />}
        </pre>
      </div>
      {lt < 1.4 && (
        <p className="scene__waiting" style={arrive(lt, 0)}>
          Business day 1, 2, 3. Waiting for the company.
        </p>
      )}
    </div>
  );
}

export function VerdictScene({ lt }: SceneProps) {
  const v = CASE.verdict;
  const text = CASE.reply.text;
  const at = text.indexOf(v.evidenceQuote);
  const sweep = easeOut(ramp(lt, 0.5, 1.8));
  const stamp = ramp(lt, 2.2, 2.45);
  const confidence = easeOut(ramp(lt, 2.4, 3.4)) * v.confidence;
  return (
    <div className="scene scene--verdict">
      <pre className="mail__body mail__body--read">
        {text.slice(0, at)}
        <mark className="quote-mark" style={{ backgroundSize: `${sweep * 100}% 100%` }}>
          {v.evidenceQuote}
        </mark>
        {text.slice(at + v.evidenceQuote.length)}
      </pre>
      <div className="verdict-row">
        <p
          className="slam"
          style={{
            opacity: stamp,
            transform: `rotate(-4deg) scale(${1.6 - 0.6 * easeOut(stamp)})`,
          }}
        >
          Stalling
        </p>
        <div className="verdict-row__meta" style={arrive(lt, 2.6)}>
          <span className="num verdict-row__conf">{confidence.toFixed(2)}</span>
          <span className="record__cap">confidence</span>
        </div>
      </div>
      <p className="scene__reason" style={arrive(lt, 3.3)}>
        <Quotes size={16} weight="light" aria-hidden /> {v.reason}
      </p>
      <ul className="missing">
        <li className="missing__label" style={arrive(lt, 4.2)}>
          A real answer still needs
        </li>
        {v.missing.map((m, i) => (
          <li key={m} className="missing__chip" style={arrive(lt, 4.5 + i * 0.22, 0.35, 6)}>
            <WarningDiamond size={14} weight="light" aria-hidden />
            {MISSING_LABEL[m] ?? m}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DeadlineScene({ lt }: SceneProps) {
  const fired = lt >= 4;
  const stamp = ramp(lt, 4, 4.25);
  return (
    <div className="scene scene--deadline">
      <p className="scene__kicker" style={arrive(lt, 0)}>
        <HourglassSimpleLow size={16} weight="light" aria-hidden /> Business days keep counting
      </p>
      <p className="deadline__line num" style={arrive(lt, 0.2)}>
        Weekends and Peruvian holidays skipped. Deadline: {formatDate(CASE.deadlineDate)}.
      </p>
      {fired && (
        <>
          <p
            className="slam slam--xl"
            style={{ opacity: stamp, transform: `rotate(-6deg) scale(${1.7 - 0.7 * easeOut(stamp)})` }}
          >
            Overdue
          </p>
          <p className="scene__reason" style={arrive(lt, 4.6)}>
            {CASE.deadlineEvent}
          </p>
        </>
      )}
    </div>
  );
}

interface FilingProps extends SceneProps {
  lang: Lang;
  onLang: (lang: Lang) => void;
}

export function FilingScene({ lt, lang, onLang }: FilingProps) {
  const draft = buildDraft(
    {
      companyName: CASE.companyName,
      legalName: CASE.sanctions.legalName,
      ruc: CASE.sanctions.ruc,
      filedDate: CASE.filedDate,
      deadlineDate: CASE.deadlineDate,
      referenceCode: CASE.referenceCode,
      summary: CASE.summary,
      overdue: true,
      quote: CASE.verdict.evidenceQuote,
    },
    lang,
  );
  return (
    <div className="scene scene--filing">
      <div className="filing__head" style={arrive(lt, 0)}>
        <p className="scene__kicker">
          <Gavel size={16} weight="light" aria-hidden /> Ready for Indecopi, Peru's consumer agency
        </p>
        <div className="seg" role="group" aria-label="Filing language">
          <button className={lang === "es" ? "is-on" : ""} aria-pressed={lang === "es"} onClick={() => onLang("es")}>
            Spanish · filed
          </button>
          <button className={lang === "en" ? "is-on" : ""} aria-pressed={lang === "en"} onClick={() => onLang("en")}>
            English
          </button>
        </div>
      </div>
      <pre className="filing__draft" lang={lang}>
        {typed(draft, lt - 0.5, 160)}
      </pre>
    </div>
  );
}
