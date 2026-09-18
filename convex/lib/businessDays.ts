// Business-day math for the Peruvian complaint deadline.
// A company must answer a Libro de Reclamaciones complaint within 15 business
// days, counted from the day after filing. Dates are Lima calendar dates
// ("YYYY-MM-DD"); Lima is UTC-5 year round.

export const RESPONSE_DEADLINE_BUSINESS_DAYS = 15;

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// National holidays (feriados nacionales). Movable dates are Holy Thursday and
// Good Friday. To verify against the official calendar on gob.pe before launch.
const PERU_HOLIDAYS = new Set([
  "2026-01-01", "2026-04-02", "2026-04-03", "2026-05-01", "2026-06-07",
  "2026-06-29", "2026-07-23", "2026-07-28", "2026-07-29", "2026-08-06",
  "2026-08-30", "2026-10-08", "2026-11-01", "2026-12-08", "2026-12-09",
  "2026-12-25",
  "2027-01-01", "2027-03-25", "2027-03-26", "2027-05-01", "2027-06-07",
  "2027-06-29", "2027-07-23", "2027-07-28", "2027-07-29", "2027-08-06",
  "2027-08-30", "2027-10-08", "2027-11-01", "2027-12-08", "2027-12-09",
  "2027-12-25",
]);

function toUtcNoon(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function format(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nextDay(date: string): string {
  return format(new Date(toUtcNoon(date).getTime() + DAY_MS));
}

export function limaDate(ms: number): string {
  return format(new Date(ms - LIMA_OFFSET_MS));
}

export function isBusinessDay(date: string): boolean {
  const weekday = toUtcNoon(date).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !PERU_HOLIDAYS.has(date);
}

export function addBusinessDays(fromDate: string, count: number): string {
  let date = fromDate;
  let remaining = count;
  while (remaining > 0) {
    date = nextDay(date);
    if (isBusinessDay(date)) remaining--;
  }
  return date;
}

// Business days in the range (fromDate, toDate].
export function businessDaysElapsed(fromDate: string, toDate: string): number {
  let count = 0;
  for (let date = nextDay(fromDate); date <= toDate; date = nextDay(date)) {
    if (isBusinessDay(date)) count++;
  }
  return count;
}

export function endOfLimaDay(date: string): number {
  return toUtcNoon(nextDay(date)).getTime() - 12 * 60 * 60 * 1000 + LIMA_OFFSET_MS;
}

// Inverse of addBusinessDays: the date from which `count` business days lead to `toDate`.
export function subtractBusinessDays(toDate: string, count: number): string {
  let date = toDate;
  let remaining = count;
  while (remaining > 0) {
    if (isBusinessDay(date)) remaining--;
    date = format(new Date(toUtcNoon(date).getTime() - DAY_MS));
  }
  // Land on a business day so the filing date reads naturally.
  while (!isBusinessDay(date)) {
    date = format(new Date(toUtcNoon(date).getTime() - DAY_MS));
  }
  return date;
}
