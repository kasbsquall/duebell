# Duebell design system

Duebell reads like a legal case file: warm paper, dark ink, and one stamp-red accent that only appears when something is wrong. Tokens live in `src/styles/tokens.css`.

## Brand

- **Name:** Duebell, lowercase in the wordmark (`duebell`).
- **Isotype:** a bell whose body holds three of four vertical bars. The bars repeat the business-day ticks of the deadline clock; the fourth bar is faded because the clock is still running. The clapper is stamp red. Source: `src/components/Logo.tsx`, `public/favicon.svg`.
- **Clear space:** at least the width of one bar around the mark.
- **Minimum size:** 16px for the isotype alone, 24px next to the wordmark.

## Color

| Token | Role |
|---|---|
| `--paper` | Page background |
| `--paper-raised` | Panels |
| `--paper-sunk` | Inset areas, skeletons, quotes |
| `--ink`, `--ink-2`, `--ink-3` | Text, secondary text, labels |
| `--rule`, `--rule-strong` | Hairlines |
| `--stamp` | Stalling, missed deadlines, warnings. Keep it under 5% of the screen |
| `--kept` | Real commitments and resolutions only |

One warm grey family. No pure black or white. Shadows are tinted with the paper tone.

## Texture

Ledger paper: ruled lines every 32px at 4.5% ink, plus a 3.5% fractal grain. Both are fixed to the page and never sit on top of content.

## Type

| Use | Family |
|---|---|
| Interface, headlines | Bricolage Grotesque (variable, OFL) |
| Numbers, dates, references, labels | IBM Plex Mono (OFL) with tabular, lining, slashed-zero figures |

Scale: major third (1.25). Headlines tighten tracking as they grow (down to -0.05em for the clock figure).

## Spacing

`--s-1` 2px up to `--s-7` 96px. Tight inside a component, wide between blocks (ratio 1:48).

## Components

- **Deadline clock:** large day count plus a strip of 15 ticks, one per business day. Ticks fill in ink; they all turn stamp red when the deadline is missed, and an "Overdue" stamp lands at -3 degrees.
- **Verdict:** the label (stalling, real commitment, resolved), a confidence figure, the quoted sentence, the reason, and what the reply still lacks.
- **Status chip:** mono, uppercase, stamp red for alarm states, green for kept.
- Radius 3px everywhere. Hairline borders at 10% ink.

## Icons

Phosphor Light only, one weight, 14 to 18px. No emoji.

## Motion

Under 300ms, transform and opacity only. Blocks rise in 60ms steps, list rows in 30ms steps capped at 8, clock ticks grow in sequence. Everything is disabled under `prefers-reduced-motion`.

## Voice

Plain English, sentence case, no exclamation marks. Peruvian terms keep their names and get a short English gloss the first time: "the company's complaint book (Libro de Reclamaciones)", "Indecopi, Peru's consumer protection agency".
