import { describe, expect, test } from "vitest";
import {
  addBusinessDays,
  businessDaysElapsed,
  endOfLimaDay,
  isBusinessDay,
  limaDate,
  subtractBusinessDays,
} from "./businessDays";

describe("limaDate", () => {
  test("uses Lima time (UTC-5), not UTC", () => {
    // 2026-09-19 03:00 UTC is still 2026-09-18 in Lima
    expect(limaDate(Date.UTC(2026, 8, 19, 3, 0))).toBe("2026-09-18");
  });
});

describe("isBusinessDay", () => {
  test("weekends are not business days", () => {
    expect(isBusinessDay("2026-09-19")).toBe(false); // Saturday
    expect(isBusinessDay("2026-09-20")).toBe(false); // Sunday
  });

  test("Peruvian holidays are not business days", () => {
    expect(isBusinessDay("2026-10-08")).toBe(false); // Combate de Angamos
    expect(isBusinessDay("2026-07-28")).toBe(false); // Fiestas Patrias
  });

  test("a regular weekday is a business day", () => {
    expect(isBusinessDay("2026-09-18")).toBe(true); // Friday
  });
});

describe("addBusinessDays", () => {
  test("counts from the day after filing and skips weekends", () => {
    // Filed Friday 2026-09-18: day 1 is Monday 2026-09-21
    expect(addBusinessDays("2026-09-18", 1)).toBe("2026-09-21");
  });

  test("15 business days skips the 8 October holiday", () => {
    // Sep 21-25 (5), Sep 28-Oct 2 (10), Oct 5,6,7,9 (14; Oct 8 holiday), Oct 12 (15)
    expect(addBusinessDays("2026-09-18", 15)).toBe("2026-10-12");
  });
});

describe("businessDaysElapsed", () => {
  test("is zero on the filing day", () => {
    expect(businessDaysElapsed("2026-09-18", "2026-09-18")).toBe(0);
  });

  test("does not count weekends", () => {
    expect(businessDaysElapsed("2026-09-18", "2026-09-20")).toBe(0);
    expect(businessDaysElapsed("2026-09-18", "2026-09-22")).toBe(2);
  });

  test("matches addBusinessDays at the deadline", () => {
    expect(businessDaysElapsed("2026-09-18", "2026-10-12")).toBe(15);
  });
});

describe("endOfLimaDay", () => {
  test("is midnight Lima, which is 05:00 UTC the next day", () => {
    expect(endOfLimaDay("2026-10-12")).toBe(Date.UTC(2026, 9, 13, 5, 0));
  });
});

describe("subtractBusinessDays", () => {
  test("lands on a business day and round-trips with addBusinessDays", () => {
    const from = subtractBusinessDays("2026-09-18", 15);
    expect(isBusinessDay(from)).toBe(true);
    expect(businessDaysElapsed(from, "2026-09-18")).toBe(15);
  });
});
