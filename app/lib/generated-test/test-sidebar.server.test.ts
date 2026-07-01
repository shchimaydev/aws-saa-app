import { describe, expect, it } from "vitest";

import type { Result } from "../progress/progress.server";
import { buildTestSidebarData, filteredTestNums } from "./test-sidebar.server";

// `filteredTestNums` drives Next/Prev within a test; it must yield exactly the
// sidebar's order (the test's own order, not ascending num) for the same filter.
describe("filteredTestNums", () => {
  const questions = [40, 5, 88, 17, 200];
  // Test results are keyed by question num: `num` → String(num).
  const results: Record<string, Result> = {
    "40": "wrong",
    "5": "correct",
    "17": "wrong",
  };

  it("matches the sidebar order for a status filter", () => {
    for (const filter of ["wrong", "correct", "unanswered"]) {
      const sidebarNums = buildTestSidebarData({
        questions,
        results,
        filter,
      }).items.map((i) => i.num);
      expect(filteredTestNums({ questions, results, filter })).toEqual(
        sidebarNums,
      );
    }
  });

  it("preserves the test's order (not ascending num)", () => {
    expect(filteredTestNums({ questions, results, filter: "wrong" })).toEqual([
      40, 17,
    ]);
  });
});
