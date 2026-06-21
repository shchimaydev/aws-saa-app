/**
 * Pure windowing math for the virtual list, factored out of the component so it
 * can be reasoned about and unit-tested without a DOM.
 *
 * The list renders a `totalCount`-tall canvas but only paints the rows near the
 * viewport. Everything here is derived from the scroll offset and the *measured*
 * viewport height — so a correct `viewportHeight` is load-bearing: if the
 * viewport is allowed to grow to its content height, `rowsInView` balloons to
 * `totalCount` and the windowing collapses (the whole list paints at once).
 */

export interface RenderRangeInput {
  /** Current scroll offset of the viewport, in pixels. */
  scrollTop: number;
  /** Measured height of the scroll viewport, in pixels. 0 before measurement. */
  viewportHeight: number;
  /** Fixed pixel height of every row. */
  itemHeight: number;
  /** Length of the full (virtual) list. */
  totalCount: number;
  /** Rows rendered beyond the visible range, each side. */
  overscan: number;
}

export interface RenderRange {
  /** First row index intersecting the viewport. */
  firstVisible: number;
  /** One past the last row index intersecting the viewport. */
  lastVisible: number;
  /** How many rows fit in the viewport (the count that must stay bounded). */
  rowsInView: number;
  /** First absolute index to render (inclusive). */
  renderFirst: number;
  /** One past the last absolute index to render (exclusive). */
  renderLast: number;
}

/** Which absolute row indices to paint for the current scroll position. */
export function computeRenderRange({
  scrollTop,
  viewportHeight,
  itemHeight,
  totalCount,
  overscan,
}: RenderRangeInput): RenderRange {
  const firstVisible = Math.floor(scrollTop / itemHeight);
  // Before the viewport is measured, fall back to a small fixed window rather
  // than 0 (which would paint nothing) — overscan*2 covers a typical first paint.
  const rowsInView = viewportHeight
    ? Math.ceil(viewportHeight / itemHeight)
    : overscan * 2;
  const lastVisible = firstVisible + rowsInView;

  const renderFirst = Math.max(0, firstVisible - overscan);
  const renderLast = Math.min(totalCount, lastVisible + overscan);

  return { firstVisible, lastVisible, rowsInView, renderFirst, renderLast };
}

export interface NeedRangeInput {
  firstVisible: number;
  lastVisible: number;
  /** Prefetch margin in rows. */
  buffer: number;
  totalCount: number;
  /** Absolute index of the first loaded item. */
  loadedStart: number;
  /** One past the absolute index of the last loaded item. */
  loadedEnd: number;
}

/**
 * The `[start, end)` window the parent should load, or `null` when the visible
 * range (plus buffer) is already covered by the loaded slice.
 */
export function computeNeedRange({
  firstVisible,
  lastVisible,
  buffer,
  totalCount,
  loadedStart,
  loadedEnd,
}: NeedRangeInput): { start: number; end: number } | null {
  if (totalCount === 0) return null;
  const start = Math.max(0, firstVisible - buffer);
  const end = Math.min(totalCount, lastVisible + buffer);
  if (start < loadedStart || end > loadedEnd) return { start, end };
  return null;
}
