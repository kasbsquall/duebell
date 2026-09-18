// The recorded case plays as one 44 second timeline. Every chapter owns a window of it,
// and every animation inside a chapter is a pure function of the playhead, so seeking,
// pausing and replaying always land on the same frame.

export type ChapterId = "filed" | "record" | "reply" | "verdict" | "deadline" | "filing";

export type Maker = "convex" | "firecrawl" | "agentmail" | "openai" | "duebell";

export interface Chapter {
  id: ChapterId;
  start: number;
  end: number;
  label: string;
  via: string;
  maker: Maker;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: "filed", start: 0, end: 5, label: "Complaint filed", via: "Convex scheduler", maker: "convex" },
  { id: "record", start: 5, end: 12.5, label: "Company record", via: "Firecrawl", maker: "firecrawl" },
  { id: "reply", start: 12.5, end: 19, label: "Reply arrives", via: "AgentMail", maker: "agentmail" },
  { id: "verdict", start: 19, end: 27.5, label: "Reply read", via: "OpenAI", maker: "openai" },
  { id: "deadline", start: 27.5, end: 34.5, label: "Deadline", via: "Convex scheduler", maker: "convex" },
  { id: "filing", start: 34.5, end: 44, label: "Filing drafted", via: "Duebell", maker: "duebell" },
];

export const DURATION = CHAPTERS[CHAPTERS.length - 1].end;

// Day on the clock at a given second. The reply lands on business day 3 in the replay;
// the whole calendar is compressed, which the player discloses on screen.
export const REPLY_DAY = 3;

export function dayAt(t: number, total: number): number {
  if (t < 12.5) return 0;
  if (t < 14.5) return Math.round(ramp(t, 12.5, 14.5) * REPLY_DAY);
  if (t < 27.5) return REPLY_DAY;
  if (t < 31.5) return REPLY_DAY + Math.floor(ramp(t, 27.5, 31.5) * (total - REPLY_DAY + 0.999));
  return total;
}

export function chapterAt(t: number): Chapter {
  return CHAPTERS.find((c) => t < c.end) ?? CHAPTERS[CHAPTERS.length - 1];
}

// 0..1 progress of t between a and b, clamped.
export function ramp(t: number, a: number, b: number): number {
  if (t <= a) return 0;
  if (t >= b) return 1;
  return (t - a) / (b - a);
}

// Heavy ease-out, the curve the whole product uses for arrivals.
export function easeOut(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `0:${String(s).padStart(2, "0")}`;
}
