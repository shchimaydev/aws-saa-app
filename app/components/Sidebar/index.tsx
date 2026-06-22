import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
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
  windowData,
  windowLoading,
  onRequestWindow,
}: {
  sidebar: SidebarData;
  correct: number;
  wrong: number;
  open: boolean;
  onClose: () => void;
  /** The most recent window returned by a boundary fetch, if any. */
  windowData?: SidebarData;
  /** True while a boundary window fetch is in flight. */
  windowLoading: boolean;
  /** Ask for a fresh window centered on `anchor` (a 1-based question num). */
  onRequestWindow: (anchor: number) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const activeNum = params.num ? Number(params.num) : null;
  const filter = searchParams.get("filter") ?? "all";

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

  // The list needs a window covering [start, end). Re-center a fresh window on
  // that range and swap it in — never request data we already hold.
  function handleNeedRange(start: number, end: number) {
    if (filtering || windowLoading) return;
    const anchor = Math.floor((start + end) / 2) + 1; // 0-based range → 1-based num
    onRequestWindow(anchor);
  }

  const renderItem = useMemo(
    () => (item: SidebarItem) => {
      const isActive = item.num === activeNum;
      return (
        <Item
          to={qs ? `/quiz/${item.num}?${qs}` : `/quiz/${item.num}`}
          prefetch="intent"
          $active={isActive}
        >
          <span className="status">
            <StatusIcon result={item.result} />
          </span>
          <span className="mid">
            <span className="q-num">Q{String(item.num).padStart(2, "0")}</span>
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
    [activeNum, qs],
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
            scrollToIndex={activeNum != null ? activeNum - 1 : null}
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
