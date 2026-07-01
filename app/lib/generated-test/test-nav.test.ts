import { describe, expect, it } from "vitest";

import {
  testNextHref,
  testPrevHref,
  testNextInListHref,
  testPrevInListHref,
} from "./test-nav";

// A test's `questions` are a non-contiguous, arbitrarily ordered subset.
const questions = [40, 5, 88, 17, 200];

describe("testNextHref", () => {
  it("walks the test's order, then the completion screen", () => {
    expect(testNextHref("t1", 40, questions)).toBe("/test/t1/5");
    expect(testNextHref("t1", 200, questions)).toBe("/test/t1/complete");
  });
});

describe("testPrevHref", () => {
  it("walks back, null at the first question", () => {
    expect(testPrevHref("t1", 88, questions)).toBe("/test/t1/5");
    expect(testPrevHref("t1", 40, questions)).toBeNull();
  });
});

describe("testNextInListHref", () => {
  const allowed = new Set([5, 17]); // a filtered subset, in test order: 5, 17

  it("returns the next allowed question after the current position", () => {
    expect(testNextInListHref("t1", 40, questions, allowed)).toBe("/test/t1/5");
    expect(testNextInListHref("t1", 5, questions, allowed)).toBe("/test/t1/17");
  });

  it("walks forward by position even when the current num left the set", () => {
    // Sitting on 88 (between 5 and 17 in the order, not in `allowed`).
    expect(testNextInListHref("t1", 88, questions, allowed)).toBe(
      "/test/t1/17",
    );
  });

  it("points at the completion screen past the last allowed question", () => {
    expect(testNextInListHref("t1", 17, questions, allowed)).toBe(
      "/test/t1/complete",
    );
    expect(testNextInListHref("t1", 200, questions, allowed)).toBe(
      "/test/t1/complete",
    );
    expect(testNextInListHref("t1", 40, questions, new Set())).toBe(
      "/test/t1/complete",
    );
  });

  it("preserves the query string", () => {
    expect(testNextInListHref("t1", 40, questions, allowed, "filter=wrong")).toBe(
      "/test/t1/5?filter=wrong",
    );
  });
});

describe("testPrevInListHref", () => {
  const allowed = new Set([5, 17]);

  it("returns the previous allowed question", () => {
    expect(testPrevInListHref("t1", 17, questions, allowed)).toBe("/test/t1/5");
  });

  it("walks back by position when the current num left the set", () => {
    expect(testPrevInListHref("t1", 88, questions, allowed)).toBe("/test/t1/5");
  });

  it("is null before the first allowed question", () => {
    expect(testPrevInListHref("t1", 5, questions, allowed)).toBeNull();
    expect(testPrevInListHref("t1", 40, questions, allowed)).toBeNull();
  });

  it("preserves the query string", () => {
    expect(testPrevInListHref("t1", 17, questions, allowed, "q=vpc")).toBe(
      "/test/t1/5?q=vpc",
    );
  });
});
