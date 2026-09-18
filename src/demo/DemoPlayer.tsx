import {
  ArrowCounterClockwise,
  Check,
  EnvelopeSimple,
  FileText,
  Gavel,
  HourglassSimpleLow,
  MagnifyingGlass,
  Pause,
  Play,
  Scales,
  type Icon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { MakerLogo } from "../components/MakerLogo";
import type { Lang } from "../lib/draft";
import { formatDate } from "../lib/format";
import { addBusinessDays } from "../../convex/lib/businessDays";
import {
  CASE,
  DeadlineScene,
  FiledScene,
  FilingScene,
  RecordScene,
  ReplyScene,
  VerdictScene,
} from "./DemoCards";
import { CHAPTERS, DURATION, chapterAt, dayAt, formatClock, ramp, type ChapterId } from "./timeline";
import { usePlayhead } from "./usePlayhead";

const ICONS: Record<ChapterId, Icon> = {
  filed: FileText,
  record: Scales,
  reply: EnvelopeSimple,
  verdict: MagnifyingGlass,
  deadline: HourglassSimpleLow,
  filing: Gavel,
};

export function DemoPlayer() {
  const { t, playing, seek, toggle, restart } = usePlayhead(DURATION);
  const [lang, setLang] = useState<Lang>("en");
  const chapter = chapterAt(t);
  const lt = t - chapter.start;
  const total = CASE.deadlineBusinessDays;
  const day = dayAt(t, total);
  const overdue = t >= 31.5;

  return (
    <section className="player" aria-label="Recorded case replay">
      <div className="player__core">
        <ol className="rail">
          {CHAPTERS.map((c, i) => {
            const Glyph = ICONS[c.id];
            const fill = ramp(t, c.start, c.end);
            const state = t >= c.end ? "done" : c.id === chapter.id ? "now" : "next";
            return (
              <li key={c.id}>
                <button
                  className={`rail__step rail__step--${state}`}
                  onClick={() => seek(c.start + 0.001)}
                  aria-current={state === "now" ? "step" : undefined}
                >
                  <span className="rail__num num">
                    {state === "done" ? (
                      <span className="rail__check" aria-label="Done">
                        <Check size={11} weight="bold" aria-hidden />
                      </span>
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className="rail__label">
                    <Glyph size={16} weight="light" aria-hidden />
                    {c.label}
                  </span>
                  <span className="rail__via">
                    <MakerLogo maker={c.maker} /> {c.via}
                  </span>
                  <span className="rail__fill" style={{ transform: `scaleX(${fill})` }} aria-hidden />
                </button>
              </li>
            );
          })}
        </ol>

        <div className="player__body">
          <aside className={`dclock ${overdue ? "dclock--late" : ""}`} aria-label="Legal response window">
            <p className="eyebrow">Legal response window</p>
            <div className="dclock__figure">
              <span className="dclock__label">Business day</span>
              <span className="dclock__count num">
                <span key={day} className="dclock__digits">
                  {day}
                </span>
                <span className="dclock__of">of {total}</span>
              </span>
            </div>
            <ol className="dticks" aria-hidden>
              {Array.from({ length: total }, (_, i) => (
                <li key={i} className={i < day ? "is-used" : ""} />
              ))}
            </ol>
            <dl className="dclock__facts">
              <div>
                <dt>Today</dt>
                <dd className="num">{formatDate(addBusinessDays(CASE.filedDate, day))}</dd>
              </div>
              <div>
                <dt>Deadline</dt>
                <dd className="num">{formatDate(CASE.deadlineDate)}</dd>
              </div>
            </dl>
            <p className="dclock__law">
              Peruvian law gives a company 15 business days to answer a formal complaint. No extension.
            </p>
            <div className="transport">
              <button className="transport__btn" onClick={toggle} aria-label={playing ? "Pause replay" : "Play replay"}>
                {playing ? <Pause size={18} weight="light" /> : <Play size={18} weight="light" />}
              </button>
              <button className="transport__btn" onClick={restart} aria-label="Restart replay">
                <ArrowCounterClockwise size={18} weight="light" />
              </button>
              <div className="transport__track" aria-hidden>
                <span style={{ transform: `scaleX(${t / DURATION})` }} />
              </div>
              <span className="transport__time num">
                {formatClock(t)} / {formatClock(DURATION)}
              </span>
            </div>
          </aside>

          <div className="stage-card" key={chapter.id}>
            {chapter.id === "filed" && <FiledScene lt={lt} />}
            {chapter.id === "record" && <RecordScene lt={lt} />}
            {chapter.id === "reply" && <ReplyScene lt={lt} />}
            {chapter.id === "verdict" && <VerdictScene lt={lt} />}
            {chapter.id === "deadline" && <DeadlineScene lt={lt} />}
            {chapter.id === "filing" && <FilingScene lt={lt} lang={lang} onLang={setLang} />}
          </div>
        </div>

      </div>
      <p className="player__note">
        Replay of a real run on {formatDate(CASE.recordedOn)}, {CASE.recordedOn.slice(0, 4)}. The sanctions record,
        the verdict and the quoted sentence are the live output of Firecrawl and OpenAI. The company reply is our
        sample text, delivered through the same webhook handler, and the 15 business days are compressed.
      </p>
    </section>
  );
}
