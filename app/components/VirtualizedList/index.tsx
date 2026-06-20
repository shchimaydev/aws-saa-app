import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Viewport, Spacer, Row } from "./index.styles";

export interface VirtualizedListProps<T> {
  /** Length of the full (virtual) list — sizes the scroll area / scrollbar. */
  totalCount: number;
  /** Absolute index (0-based) of `items[0]` within the full list. */
  startIndex: number;
  /** The currently loaded window — a contiguous slice beginning at `startIndex`. */
  items: T[];
  /** Fixed pixel height of every row. */
  itemHeight: number;
  /** Stable key for an item. */
  getKey: (item: T, index: number) => string | number;
  /** Render a loaded row's contents (the positioned row wrapper is supplied). */
  renderItem: (item: T, index: number) => ReactNode;
  /** Render a row whose data isn't in the current window (during a fetch / jump). */
  renderPlaceholder?: (index: number) => ReactNode;
  /** Rows rendered beyond the visible range, each side. Default 6. */
  overscan?: number;
  /** Prefetch margin in rows — ask for data this far before the edge. Default = overscan. */
  bufferRows?: number;
  /**
   * Fired when the visible range (plus buffer) isn't fully covered by the
   * loaded window. The parent should fetch a window covering `[start, end)`
   * and swap it in via `items`/`startIndex`. Never accumulate.
   */
  onNeedRange?: (start: number, end: number) => void;
  /** Absolute index to bring into view — only acts when it's currently off-screen. */
  scrollToIndex?: number | null;
  /** Keep `scrollToIndex` this many rows from the top when scrolling to it. Default 4. */
  scrollToOffset?: number;
  className?: string;
}

/**
 * A project-agnostic windowed virtual list. It renders a full-height canvas of
 * `totalCount` rows but only ever holds/positions the loaded `items` slice;
 * each row is absolutely positioned at its *absolute* index, so swapping the
 * window in place never disturbs the scroll position. When the viewport scrolls
 * outside the loaded slice it calls `onNeedRange` to request a new window.
 */
export default function VirtualizedList<T>({
  totalCount,
  startIndex,
  items,
  itemHeight,
  getKey,
  renderItem,
  renderPlaceholder,
  overscan = 6,
  bufferRows,
  onNeedRange,
  scrollToIndex,
  scrollToOffset = 4,
  className,
}: VirtualizedListProps<T>) {
  const buffer = bufferRows ?? overscan;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Seed scroll position from the focus target so the first paint (incl. SSR)
  // renders the right rows instead of flashing placeholders at the top.
  const [scrollTop, setScrollTop] = useState(() =>
    scrollToIndex != null ? Math.max(0, (scrollToIndex - scrollToOffset) * itemHeight) : 0,
  );

  const onNeedRangeRef = useRef(onNeedRange);
  onNeedRangeRef.current = onNeedRange;

  // Measure the viewport (and react to container resizes).
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportHeight(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Bring the focus target into view when it changes — but only if it's
  // off-screen, so selecting a row already in the window doesn't jerk the list.
  useEffect(() => {
    if (scrollToIndex == null) return;
    const el = viewportRef.current;
    if (!el) return;
    const rowTop = scrollToIndex * itemHeight;
    const rowBottom = rowTop + itemHeight;
    if (rowTop >= el.scrollTop && rowBottom <= el.scrollTop + el.clientHeight) return;
    const max = el.scrollHeight - el.clientHeight;
    const top = Math.max(0, Math.min((scrollToIndex - scrollToOffset) * itemHeight, max));
    el.scrollTo({ top, behavior: "auto" });
    setScrollTop(top);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToIndex, itemHeight, scrollToOffset]);

  const firstVisible = Math.floor(scrollTop / itemHeight);
  const rowsInView = viewportHeight ? Math.ceil(viewportHeight / itemHeight) : overscan * 2;
  const lastVisible = firstVisible + rowsInView;

  const loadedStart = startIndex;
  const loadedEnd = startIndex + items.length;

  // Request a new window whenever the visible range (+buffer) escapes the
  // loaded slice. The parent guards against duplicate/in-flight fetches; this
  // effect only re-runs when the scroll range or loaded slice changes, so a
  // fulfilled request (which moves loadedStart/End) naturally stops it.
  useEffect(() => {
    if (!onNeedRangeRef.current || totalCount === 0) return;
    const needStart = Math.max(0, firstVisible - buffer);
    const needEnd = Math.min(totalCount, lastVisible + buffer);
    if (needStart < loadedStart || needEnd > loadedEnd) {
      onNeedRangeRef.current(needStart, needEnd);
    }
  }, [firstVisible, lastVisible, buffer, loadedStart, loadedEnd, totalCount]);

  const renderFirst = Math.max(0, firstVisible - overscan);
  const renderLast = Math.min(totalCount, lastVisible + overscan);

  const rows: ReactNode[] = [];
  for (let i = renderFirst; i < renderLast; i++) {
    const local = i - startIndex;
    const loaded = local >= 0 && local < items.length;
    rows.push(
      <Row
        key={loaded ? getKey(items[local], i) : `__ph_${i}`}
        style={{ top: i * itemHeight, height: itemHeight }}
      >
        {loaded ? renderItem(items[local], i) : renderPlaceholder?.(i)}
      </Row>,
    );
  }

  function handleScroll() {
    const el = viewportRef.current;
    if (el) setScrollTop(el.scrollTop);
  }

  return (
    <Viewport ref={viewportRef} onScroll={handleScroll} className={className}>
      <Spacer style={{ height: totalCount * itemHeight }}>{rows}</Spacer>
    </Viewport>
  );
}
