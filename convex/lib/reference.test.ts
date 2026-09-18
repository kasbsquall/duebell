import { describe, expect, test } from "vitest";
import { extractReference, generateReference } from "./reference";

describe("generateReference", () => {
  test("has the RC-XXXX shape without ambiguous characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateReference()).toMatch(/^RC-[2-9A-HJ-NP-Z]{4}$/);
    }
  });
});

describe("extractReference", () => {
  test("finds the reference inside a reply subject", () => {
    expect(extractReference("Re: Your complaint [Ref RC-7K2P]")).toBe("RC-7K2P");
  });

  test("is case insensitive and tolerates spaces", () => {
    expect(extractReference("sobre el reclamo rc 7k2p")).toBe("RC-7K2P");
  });

  test("returns null when there is no reference", () => {
    expect(extractReference("Hello, we are reviewing your case")).toBeNull();
  });
});
