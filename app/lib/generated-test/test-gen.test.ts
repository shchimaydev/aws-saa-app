import { describe, expect, it } from "vitest";

import { ALL_DOMAINS, type Domain } from "../../types/domain";
import {
  DOMAIN_COUNTS,
  TEST_SIZE,
  largestRemainder,
  pickTestQuestions,
  type Rng,
} from "./test-gen";

/** Deterministic LCG so selection is reproducible in assertions. */
function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const sum = (counts: Record<Domain, number>) =>
  ALL_DOMAINS.reduce((acc, d) => acc + counts[d], 0);

describe("largestRemainder", () => {
  it("apportions the SAA-C03 weights to 19/17/16/13", () => {
    expect(DOMAIN_COUNTS).toEqual({ 1: 19, 2: 17, 3: 16, 4: 13 });
    expect(sum(DOMAIN_COUNTS)).toBe(TEST_SIZE);
  });

  it("always sums to the requested total", () => {
    const counts = largestRemainder({ 1: 1, 2: 1, 3: 1, 4: 1 }, 65);
    expect(sum(counts)).toBe(65);
  });
});

// A generous synthetic bank: disjoint pools far larger than each quota.
function abundantByDomain(): Record<Domain, number[]> {
  let n = 1;
  const map = {} as Record<Domain, number[]>;
  for (const d of ALL_DOMAINS) {
    map[d] = Array.from({ length: 50 }, () => n++);
  }
  return map;
}

describe("pickTestQuestions", () => {
  it("selects exactly TEST_SIZE distinct nums", () => {
    const picked = pickTestQuestions(abundantByDomain(), seededRng(1));
    expect(picked).toHaveLength(TEST_SIZE);
    expect(new Set(picked).size).toBe(TEST_SIZE);
  });

  it("returns nums sorted ascending", () => {
    const picked = pickTestQuestions(abundantByDomain(), seededRng(2));
    expect([...picked].sort((a, b) => a - b)).toEqual(picked);
  });

  it("meets every domain quota when pools allow (disjoint pools)", () => {
    const byDomain = abundantByDomain();
    const picked = new Set(pickTestQuestions(byDomain, seededRng(3)));
    for (const d of ALL_DOMAINS) {
      const fromDomain = byDomain[d].filter((n) => picked.has(n)).length;
      expect(fromDomain).toBe(DOMAIN_COUNTS[d]);
    }
  });

  it("every picked num is a member of some domain pool", () => {
    const byDomain = abundantByDomain();
    const all = new Set(Object.values(byDomain).flat());
    for (const num of pickTestQuestions(byDomain, seededRng(4))) {
      expect(all.has(num)).toBe(true);
    }
  });

  it("never duplicates a num even when pools overlap", () => {
    // Heavy overlap: every domain shares the same 80-num pool.
    const shared = Array.from({ length: 80 }, (_, i) => i + 1);
    const byDomain = Object.fromEntries(
      ALL_DOMAINS.map((d) => [d, [...shared]]),
    ) as Record<Domain, number[]>;
    const picked = pickTestQuestions(byDomain, seededRng(5));
    expect(picked).toHaveLength(TEST_SIZE);
    expect(new Set(picked).size).toBe(TEST_SIZE);
  });

  it("varies with the rng", () => {
    const a = pickTestQuestions(abundantByDomain(), seededRng(7));
    const b = pickTestQuestions(abundantByDomain(), seededRng(99));
    expect(a).not.toEqual(b);
  });

  it("tops up from the remaining pool when per-domain pools starve", () => {
    // 65 distinct nums exist, but heavily-nested pools starve later domains:
    // each domain's candidates are mostly consumed by earlier picks, so the
    // per-domain pass lands well under 65 and the top-up guard must finish it.
    const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
    const byDomain: Record<Domain, number[]> = {
      1: range(20),
      2: range(25),
      3: range(30),
      4: range(65),
    };
    const picked = pickTestQuestions(byDomain, seededRng(11));
    expect(picked).toHaveLength(TEST_SIZE);
    expect(new Set(picked).size).toBe(TEST_SIZE);
  });
});
