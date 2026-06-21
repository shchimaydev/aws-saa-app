import { describe, expect, it } from "vitest";

import { computeRenderRange, computeNeedRange } from "./window";

// Mirrors the Sidebar's usage: 684 questions, 76px rows, a window of ~61 loaded
// items, default overscan of 6.
const ITEM_HEIGHT = 76;
const TOTAL = 684;
const OVERSCAN = 6;

describe("computeRenderRange", () => {
  it("renders only a bounded window near the top on first paint", () => {
    const { renderFirst, renderLast, rowsInView } = computeRenderRange({
      scrollTop: 0,
      viewportHeight: 800, // a real, constrained viewport
      itemHeight: ITEM_HEIGHT,
      totalCount: TOTAL,
      overscan: OVERSCAN,
    });

    expect(renderFirst).toBe(0);
    // ceil(800/76) = 11 visible; + overscan on the trailing edge.
    expect(rowsInView).toBe(11);
    expect(renderLast).toBe(rowsInView + OVERSCAN); // 17
    expect(renderLast - renderFirst).toBeLessThan(30);
  });

  it("windows around the scroll offset when scrolled into the middle", () => {
    const scrollTop = 300 * ITEM_HEIGHT;
    const { firstVisible, renderFirst, renderLast } = computeRenderRange({
      scrollTop,
      viewportHeight: 800,
      itemHeight: ITEM_HEIGHT,
      totalCount: TOTAL,
      overscan: OVERSCAN,
    });

    expect(firstVisible).toBe(300);
    expect(renderFirst).toBe(300 - OVERSCAN); // 294
    expect(renderLast).toBe(300 + 11 + OVERSCAN); // 317
    expect(renderLast - renderFirst).toBeLessThan(40);
  });

  it("clamps the render range to the list bounds at the very end", () => {
    const scrollTop = (TOTAL - 5) * ITEM_HEIGHT;
    const { renderLast } = computeRenderRange({
      scrollTop,
      viewportHeight: 800,
      itemHeight: ITEM_HEIGHT,
      totalCount: TOTAL,
      overscan: OVERSCAN,
    });

    expect(renderLast).toBe(TOTAL); // never past the end
  });

  it("falls back to a small fixed window before the viewport is measured", () => {
    const { renderFirst, renderLast, rowsInView } = computeRenderRange({
      scrollTop: 0,
      viewportHeight: 0, // not yet measured
      itemHeight: ITEM_HEIGHT,
      totalCount: TOTAL,
      overscan: OVERSCAN,
    });

    expect(rowsInView).toBe(OVERSCAN * 2); // 12, not totalCount
    expect(renderFirst).toBe(0);
    expect(renderLast).toBe(OVERSCAN * 2 + OVERSCAN); // 18
  });

  // This is the regression guard for the reported bug: when the viewport is
  // (mis)measured as the full content height, the math is forced to paint the
  // entire list. The fix lives in the CSS (a bounded viewport), and this test
  // documents *why* a bounded viewportHeight is required.
  it("paints the whole list when the viewport equals the full content height (the bug)", () => {
    const fullContentHeight = TOTAL * ITEM_HEIGHT;
    const { renderFirst, renderLast } = computeRenderRange({
      scrollTop: 0,
      viewportHeight: fullContentHeight,
      itemHeight: ITEM_HEIGHT,
      totalCount: TOTAL,
      overscan: OVERSCAN,
    });

    expect(renderFirst).toBe(0);
    expect(renderLast).toBe(TOTAL); // every row — what we must avoid
  });
});

describe("computeNeedRange", () => {
  const base = {
    buffer: OVERSCAN,
    totalCount: TOTAL,
  };

  it("returns null while the visible range is inside the loaded slice", () => {
    const need = computeNeedRange({
      ...base,
      firstVisible: 20,
      lastVisible: 31,
      loadedStart: 0,
      loadedEnd: 61,
    });
    expect(need).toBeNull();
  });

  it("requests a forward window when scrolled past the loaded slice", () => {
    const need = computeNeedRange({
      ...base,
      firstVisible: 100,
      lastVisible: 111,
      loadedStart: 0,
      loadedEnd: 61,
    });
    expect(need).toEqual({ start: 100 - OVERSCAN, end: 111 + OVERSCAN });
  });

  it("requests a backward window when scrolled before the loaded slice", () => {
    const need = computeNeedRange({
      ...base,
      firstVisible: 10,
      lastVisible: 21,
      loadedStart: 100,
      loadedEnd: 161,
    });
    expect(need).toEqual({ start: 10 - OVERSCAN, end: 21 + OVERSCAN });
  });

  it("clamps requested bounds to the list and never fetches an empty list", () => {
    expect(
      computeNeedRange({
        ...base,
        firstVisible: 0,
        lastVisible: 11,
        loadedStart: 50,
        loadedEnd: 111,
      }),
    ).toEqual({ start: 0, end: 17 }); // start floored at 0

    expect(
      computeNeedRange({
        buffer: OVERSCAN,
        totalCount: 0,
        firstVisible: 0,
        lastVisible: 11,
        loadedStart: 0,
        loadedEnd: 0,
      }),
    ).toBeNull();
  });
});
