import { describe, expect, it } from "vitest";

import { nextHref, prevHref } from "./quizNav";

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
