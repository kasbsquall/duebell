/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import detail from "./fixtures/sanctionsDetail.md?raw";
import empty from "./fixtures/sanctionsEmpty.md?raw";
import search from "./fixtures/sanctionsSearch.md?raw";
import { parseSanctionsDetail, parseSearchResults, pickBestMatch } from "./sanctions";

describe("parseSearchResults", () => {
  test("reads main results and ignores the 'did you mean' suggestions", () => {
    expect(parseSearchResults(search)).toEqual([
      { legalName: "SAGA FALABELLA S A", ruc: "20100128056" },
      { legalName: "SAGA FALABELLA ORIENTE S.A.C.", ruc: "20393864967" },
    ]);
  });

  test("returns no results for an empty search", () => {
    expect(parseSearchResults(empty)).toEqual([]);
  });
});

describe("parseSanctionsDetail", () => {
  test("reads totals, period and recent sanctions", () => {
    const result = parseSanctionsDetail(detail);
    expect(result).toMatchObject({
      legalName: "SAGA FALABELLA S A",
      totalSanctions: 150,
      totalFineUit: 41.7,
      periodFrom: "2022-09-19",
      periodTo: "2026-09-18",
    });
    expect(result?.recent).toHaveLength(5);
    expect(result?.recent[4]).toEqual({
      year: 2026,
      matter: "VENTA DE CALZADO Y ARTICULOS DE CUERO",
      offense: "FALTA DE IDONEIDAD",
      resolution: "657-2026/PS3",
      finalDate: "2026-07-17",
      fineUit: 2.5,
    });
  });

  test("flags sanctions about complaint handling", () => {
    const result = parseSanctionsDetail(detail);
    expect(result?.recent.filter((s) => s.offense.includes("ATENCION DE RECLAMOS"))).toHaveLength(1);
  });

  test("returns null when the detail block is missing", () => {
    expect(parseSanctionsDetail(search)).toBeNull();
  });
});

describe("pickBestMatch", () => {
  const results = [
    { legalName: "SAGA FALABELLA ORIENTE S.A.C.", ruc: "20393864967" },
    { legalName: "SAGA FALABELLA S A", ruc: "20100128056" },
  ];

  test("prefers the name that matches once legal suffixes are removed", () => {
    expect(pickBestMatch("Saga Falabella", results)?.ruc).toBe("20100128056");
  });

  test("an exact RUC always wins", () => {
    expect(pickBestMatch("20393864967", results)?.ruc).toBe("20393864967");
  });

  test("falls back to the shortest name containing the query", () => {
    expect(pickBestMatch("falabella", results)?.ruc).toBe("20100128056");
  });

  test("returns null with no results", () => {
    expect(pickBestMatch("x", [])).toBeNull();
  });
});
