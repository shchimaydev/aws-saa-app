import { describe, expect, it } from "vitest";

import type { Result } from "../progress/progress.server";
import { buildSidebarData, filteredQuizNums } from "./sidebar.server";

// `filteredQuizNums` drives Next/Prev; it must yield exactly the sidebar's order
// for the same filter, or navigation would diverge from the visible list.
describe("filteredQuizNums", () => {
  // Quiz results are keyed by 0-based index: question `num` → String(num - 1).
  const results: Record<string, Result> = {
    "0": "correct", // Q1
    "4": "wrong", // Q5
    "9": "correct", // Q10
    "19": "wrong", // Q20
  };

  it("matches the sidebar order for a status filter", () => {
    for (const filter of ["wrong", "correct", "unanswered"]) {
      const sidebarNums = buildSidebarData({ results, filter }).items.map(
        (i) => i.num,
      );
      expect(filteredQuizNums({ results, filter })).toEqual(sidebarNums);
    }
  });

  it("matches the sidebar order for a search query", () => {
    const sidebarNums = buildSidebarData({ results, q: "vpc" }).items.map(
      (i) => i.num,
    );
    expect(filteredQuizNums({ results, q: "vpc" })).toEqual(sidebarNums);
  });

  it("returns the wrong-answered nums in ascending order", () => {
    expect(filteredQuizNums({ results, filter: "wrong" })).toEqual([5, 20]);
  });
});
