import { useEffect, useMemo, useState } from "react";
import { useFetcher, useParams, useSearchParams } from "react-router";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Search as SearchIcon,
  X,
  XCircle,
} from "lucide-react";

import VirtualizedList from "~/components/VirtualizedList";
import { theme } from "~/styles/theme";
import {
  Aside,
  HeadBlock,
  HeadRow,
  Titles,
  CloseButton,
  Stats,
  Stat,
  Search,
  FilterRow,
  FilterButton,
  ListWrap,
  Item,
  Empty,
  Placeholder,
  Footer,
  FooterRow,
  Track,
  Fill,
  ITEM_HEIGHT,
} from "./index.styles";

export interface SidebarItem {
  num: number;
  preview: string;
  result: "correct" | "wrong" | null;
  /** Label number when it differs from `num` (e.g. a test's 1–65 position). */
  displayNum?: number;
}

export interface SidebarData {
  items: SidebarItem[];
  total: number;
  /** 1-based `num` of `items[0]` within the full bank. */
  start: number;
  /** True when `items` is a paginated window; false for a full search/filter result. */
  windowed: boolean;
}

/** What the virtual list needs: the loaded slice and where it sits in the whole. */
interface WindowView {
  items: SidebarItem[];
  startIndex: number;
  totalCount: number;
}

/** Stable default so the renderItem memo isn't busted when no `hrefFor` given. */
const defaultHrefFor = (num: number) => `/quiz/${num}`;

const FILTERS: ReadonlyArray<readonly [string, string]> = [
  ["all", "All"],
  ["unanswered", "Unanswered"],
  ["correct", "Correct"],
  ["wrong", "Wrong"],
];

/** The status glyph shown at the start of each row. */
function StatusIcon({ result }: { result: SidebarItem["result"] }) {
  if (result === "correct")
    return <CheckCircle2 size={14} color={theme.green} />;
  if (result === "wrong") return <XCircle size={14} color={theme.red} />;
  return <Circle size={14} color={theme.textMono} />;
}

/**
 * Map a server payload to the view the list renders. A browse window sits at
 * its absolute position in the 684-question canvas; a filter/search result is
 * its own self-contained list (local indices, no canvas).
 */
function toView(d: SidebarData): WindowView {
  if (d.windowed) {
    return {
      items: d.items,
      startIndex: d.items.length ? d.start - 1 : 0,
      totalCount: d.total,
    };
  }
  return { items: d.items, startIndex: 0, totalCount: d.items.length };
}

export default function Sidebar({
  sidebar,
  correct,
  wrong,
  open,
  onClose,
  apiPath = "/quiz/api/sidebar",
  hrefFor = defaultHrefFor,
}: {
  sidebar: SidebarData;
  correct: number;
  wrong: number;
  open: boolean;
  onClose: () => void;
  /** Resource route serving infinite-scroll windows (browse mode only). */
  apiPath?: string;
  /** Builds the link target for a question num (without query string). */
  hrefFor?: (num: number) => string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const activeNum = params.num ? Number(params.num) : null;
  const filter = searchParams.get("filter") ?? "all";

  // Boundary windows are fetched here so the parent layout stays out of the
  // infinite-scroll plumbing; `apiPath` is the only thing that varies per host.
  const fetcher = useFetcher<SidebarData>();
  const windowData = fetcher.data;
  const windowLoading = fetcher.state !== "idle";

  const total = sidebar.total;
  const answered = correct + wrong;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  // Browsing paginates over the full bank; an active search/filter is the full
  // matching set and never asks for more.
  const filtering = !sidebar.windowed;

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  // The client holds exactly one window. It is *replaced* — never accumulated.
  const [view, setView] = useState<WindowView>(() => toView(sidebar));

  // Replace the window whenever the loader re-runs (navigation / filter change).
  useEffect(() => {
    setView(toView(sidebar));
  }, [sidebar]);

  // Replace the window with whatever a boundary fetch returned.
  useEffect(() => {
    if (windowData?.windowed && windowData.items.length) {
      setView(toView(windowData));
    }
  }, [windowData]);

  // Debounce writing the search term to the URL (drives server-side filtering).
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (search) next.set("q", search);
          else next.delete("q");
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function selectFilter(key: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key === "all") next.delete("filter");
      else next.set("filter", key);
      return next;
    });
  }

  const qs = searchParams.toString();

  // The active row's *absolute* index in the virtual canvas. Browsing the full
  // bank, that's num-1 (kept stable across window swaps so scrolling doesn't
  // jerk back to it). A self-contained list (test or filter result) indexes by
  // the row's position within `items` — so a 65-row test never scrolls to a
  // global num like 350.
  const activeIndex = useMemo(() => {
    if (activeNum == null) return null;
    if (sidebar.windowed) return activeNum - 1;
    const local = view.items.findIndex((it) => it.num === activeNum);
    return local >= 0 ? local : null;
  }, [activeNum, sidebar.windowed, view.items]);

  // The list needs a window covering [start, end). Re-center a fresh window on
  // that range and swap it in — never request data we already hold.
  function handleNeedRange(start: number, end: number) {
    if (filtering || windowLoading) return;
    const anchor = Math.floor((start + end) / 2) + 1; // 0-based range → 1-based num
    fetcher.load(`${apiPath}?anchor=${anchor}`);
  }

  const renderItem = useMemo(
    () => (item: SidebarItem) => {
      const isActive = item.num === activeNum;
      const base = hrefFor(item.num);
      return (
        <Item
          to={qs ? `${base}?${qs}` : base}
          prefetch="intent"
          $active={isActive}
        >
          <span className="status">
            <StatusIcon result={item.result} />
          </span>
          <span className="mid">
            <span className="q-num">
              Q{String(item.displayNum ?? item.num).padStart(2, "0")}
            </span>
            <span className="q-preview">{item.preview}...</span>
          </span>
          {isActive ? (
            <span className="chevron">
              <ChevronRight size={12} />
            </span>
          ) : null}
        </Item>
      );
    },
    [activeNum, qs, hrefFor],
  );

  // Absolute index → its 1-based question number while its data is in flight.
  const renderPlaceholder = (index: number) => (
    <Placeholder>
      <span className="status">
        <Circle size={14} />
      </span>
      <span className="mid">
        <span className="q-num">Q{String(index + 1).padStart(2, "0")}</span>
        <span className="q-bar" />
      </span>
    </Placeholder>
  );

  return (
    <Aside $open={open}>
      <HeadBlock>
        <HeadRow>
          <Titles>
            <span className="kicker">SAA-C03</span>
            <h2>Solutions Architect</h2>
          </Titles>
          <CloseButton type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </CloseButton>
        </HeadRow>

        <Stats>
          <Stat $variant="correct">
            <span className="label">Correct</span>
            <span className="value">{correct}</span>
          </Stat>
          <Stat $variant="wrong">
            <span className="label">Wrong</span>
            <span className="value">{wrong}</span>
          </Stat>
          <Stat $variant="total">
            <span className="label">Total</span>
            <span className="value">{total}</span>
          </Stat>
        </Stats>

        <Search>
          <SearchIcon className="search-icon" size={13} />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Search>

        <FilterRow>
          {FILTERS.map(([key, label]) => (
            <FilterButton
              key={key}
              type="button"
              $active={filter === key}
              onClick={() => selectFilter(key)}
            >
              {label}
            </FilterButton>
          ))}
        </FilterRow>
      </HeadBlock>

      <ListWrap>
        {view.items.length === 0 ? (
          <Empty>No matching questions.</Empty>
        ) : (
          <VirtualizedList
            totalCount={view.totalCount}
            startIndex={view.startIndex}
            items={view.items}
            itemHeight={ITEM_HEIGHT}
            getKey={(it) => it.num}
            renderItem={renderItem}
            renderPlaceholder={filtering ? undefined : renderPlaceholder}
            scrollToIndex={activeIndex}
            onNeedRange={filtering ? undefined : handleNeedRange}
          />
        )}
      </ListWrap>

      <Footer>
        <FooterRow>
          <span className="label">Progress</span>
          <span className="count">
            {answered}/{total}
          </span>
        </FooterRow>
        <Track>
          <Fill $pct={pct} />
        </Track>
      </Footer>
    </Aside>
  );
}
