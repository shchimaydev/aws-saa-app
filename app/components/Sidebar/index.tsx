import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";

import {
  Aside,
  SectionHeader,
  Search,
  FilterRow,
  FilterButton,
  List,
  Item,
  Dot,
} from "./index.styles";

export interface SidebarItem {
  num: number;
  preview: string;
  result: "correct" | "wrong" | null;
}

const FILTERS: ReadonlyArray<readonly [string, string]> = [
  ["all", "All"],
  ["unanswered", "Unanswered"],
  ["correct", "Correct"],
  ["wrong", "Wrong"],
];

export default function Sidebar({ items }: { items: SidebarItem[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const activeNum = params.num ? Number(params.num) : null;
  const filter = searchParams.get("filter") ?? "all";

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

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

      <List>
        {items.map((item) => (
          <Item
            key={item.num}
            to={qs ? `/quiz/${item.num}?${qs}` : `/quiz/${item.num}`}
            $active={item.num === activeNum}
          >
            <Dot $result={item.result} />
            <span className="q-num">Q{item.num}</span>
            <span className="q-preview">{item.preview}...</span>
          </Item>
        ))}
      </List>
    </Aside>
  );
}
