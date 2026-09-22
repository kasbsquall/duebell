import { describe, expect, test } from "vitest";
import { parseClassification, statusForVerdict } from "./classification";

const reply =
  "Dear customer,\n\nOur team is currently reviewing your case. We will get back to you as soon as possible.";

describe("parseClassification", () => {
  test("accepts a well formed stalling verdict whose quote is in the reply", () => {
    const result = parseClassification(
      JSON.stringify({
        verdict: "stalling",
        confidence: 0.91,
        evidenceQuote: "We will get back to you as soon as possible.",
        reason: "No date, amount or concrete action is offered.",
        missing: ["date", "remedy"],
      }),
      reply,
    );
    expect(result.verdict).toBe("stalling");
    expect(result.evidenceQuote).toBe("We will get back to you as soon as possible.");
    expect(result.missing).toEqual(["date", "remedy"]);
  });

  test("matches the quote across different whitespace and line breaks", () => {
    const result = parseClassification(
      JSON.stringify({
        verdict: "stalling",
        confidence: 0.8,
        evidenceQuote: "Our team is currently   reviewing your case.",
        reason: "Generic.",
        missing: [],
      }),
      reply,
    );
    expect(result.evidenceQuote).toBe("Our team is currently reviewing your case.");
  });

  test("drops a quote that does not appear in the reply", () => {
    const result = parseClassification(
      JSON.stringify({
        verdict: "stalling",
        confidence: 0.8,
        evidenceQuote: "We refuse to refund you.",
        reason: "Generic.",
        missing: [],
      }),
      reply,
    );
    expect(result.evidenceQuote).toBeNull();
  });

  test("clamps confidence to the 0..1 range", () => {
    const result = parseClassification(
      JSON.stringify({ verdict: "commitment", confidence: 7, evidenceQuote: "", reason: "x", missing: [] }),
      reply,
    );
    expect(result.confidence).toBe(1);
  });

  test("rejects an unknown verdict", () => {
    expect(() =>
      parseClassification(
        JSON.stringify({ verdict: "maybe", confidence: 0.5, evidenceQuote: "", reason: "x", missing: [] }),
        reply,
      ),
    ).toThrow();
  });

  test("rejects output that is not JSON", () => {
    expect(() => parseClassification("not json", reply)).toThrow();
  });
});

describe("statusForVerdict", () => {
  test("maps verdicts to claim statuses", () => {
    expect(statusForVerdict("commitment")).toBe("committed");
    expect(statusForVerdict("stalling")).toBe("stalling");
    // An email alone never closes a claim; the user confirms with markResolved.
    expect(statusForVerdict("resolved")).toBe("committed");
  });
});
