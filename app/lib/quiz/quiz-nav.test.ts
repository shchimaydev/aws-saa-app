import { describe, expect, it } from "vitest";

import {
  nextHref,
  prevHref,
  nextInListHref,
  prevInListHref,
} from "./quiz-nav";

describe("prevHref", () => {
  it("is null at the first question (control disabled)", () => {
    expect(prevHref(1)).toBeNull();
    expect(prevHref(1, "filter=wrong")).toBeNull();
  });

  it("points at the previous question", () => {
    expect(prevHref(2)).toBe("/quiz/1");
    expect(prevHref(685)).toBe("/quiz/684");
  });

  it("preserves the query string", () => {
    expect(prevHref(5, "filter=wrong&q=ec2")).toBe(
      "/quiz/4?filter=wrong&q=ec2",
    );
  });
});

describe("nextHref", () => {
  it("points at the next question mid-bank", () => {
    expect(nextHref(1, 684)).toBe("/quiz/2");
    expect(nextHref(683, 684)).toBe("/quiz/684");
  });

  it("points at the completion screen on the last question", () => {
    expect(nextHref(684, 684)).toBe("/quiz/complete");
  });

  it("preserves the query string for both branches", () => {
    expect(nextHref(1, 684, "filter=all")).toBe("/quiz/2?filter=all");
    expect(nextHref(684, 684, "filter=all")).toBe("/quiz/complete?filter=all");
  });
});

describe("nextInListHref", () => {
  const nums = [3, 7, 12, 50];

  it("points at the next matching question", () => {
    expect(nextInListHref(3, nums)).toBe("/quiz/7");
    expect(nextInListHref(12, nums)).toBe("/quiz/50");
  });

  it("skips forward when num is no longer in the list", () => {
    // e.g. num was just answered under the "unanswered" filter and dropped out
    expect(nextInListHref(8, nums)).toBe("/quiz/12");
    expect(nextInListHref(1, nums)).toBe("/quiz/3");
  });

  it("points at the completion screen past the last match", () => {
    expect(nextInListHref(50, nums)).toBe("/quiz/complete");
    expect(nextInListHref(99, nums)).toBe("/quiz/complete");
    expect(nextInListHref(1, [])).toBe("/quiz/complete");
  });

  it("preserves the query string", () => {
    expect(nextInListHref(3, nums, "filter=wrong")).toBe(
      "/quiz/7?filter=wrong",
    );
    expect(nextInListHref(50, nums, "filter=wrong")).toBe(
      "/quiz/complete?filter=wrong",
    );
  });
});

describe("prevInListHref", () => {
  const nums = [3, 7, 12, 50];

  it("points at the previous matching question", () => {
    expect(prevInListHref(50, nums)).toBe("/quiz/12");
    expect(prevInListHref(7, nums)).toBe("/quiz/3");
  });

  it("skips back when num is no longer in the list", () => {
    expect(prevInListHref(11, nums)).toBe("/quiz/7");
  });

  it("is null before the first match", () => {
    expect(prevInListHref(3, nums)).toBeNull();
    expect(prevInListHref(1, nums)).toBeNull();
    expect(prevInListHref(50, [])).toBeNull();
  });

  it("preserves the query string", () => {
    expect(prevInListHref(50, nums, "q=ec2")).toBe("/quiz/12?q=ec2");
  });
});
