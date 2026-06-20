import { useEffect, useMemo, useState } from "react";
import { useFetcher, useParams, useSearchParams } from "react-router";

import VirtualizedList from "~/components/VirtualizedList";
import {
  Aside,
  SectionHeader,
  Search,
  FilterRow,
  FilterButton,
  Item,
  Dot,
  Empty,
  Placeholder,
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

export default function Sidebar({ sidebar }: { sidebar: SidebarData }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const activeNum = params.num ? Number(params.num) : null;
  const filter = searchParams.get("filter") ?? "all";
  const q = searchParams.get("q") ?? "";

  // Browsing paginates over the full bank; an active search/filter is the full
  // matching set and never asks for more.
  const filtering = !sidebar.windowed;

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  // The client holds exactly one window. It is *replaced* — never accumulated.
  const [view, setView] = useState<WindowView>(() => toView(sidebar));

  const fetcher = useFetcher<SidebarData>();

  // Replace the window whenever the loader re-runs (navigation / filter change).
  useEffect(() => {
    setView(toView(sidebar));
  }, [sidebar]);

  // Replace the window with whatever a boundary fetch returned.
  useEffect(() => {
    if (fetcher.data?.windowed && fetcher.data.items.length) {
      setView(toView(fetcher.data));
    }
  }, [fetcher.data]);

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
    if (filtering || fetcher.state !== "idle") return;
    const anchor = Math.floor((start + end) / 2) + 1; // 0-based range → 1-based num
    fetcher.load(`/quiz/api/sidebar?anchor=${anchor}`);
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
          <Dot $result={item.result} />
          <span className="q-num">Q{item.num}</span>
          <span className="q-preview">{item.preview}...</span>
        </Item>
      );
    },
    [activeNum, qs],
  );

  // Absolute index → its 1-based question number while its data is in flight.
  const renderPlaceholder = (index: number) => (
    <Placeholder>
      <span className="q-num">Q{index + 1}</span>
      <span className="q-bar" />
    </Placeholder>
  );

  return (
    <Aside>
      <SectionHeader>
        <span>Questions</span>
      </SectionHeader>

      <Search>
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
    </Aside>
  );
}
