// Pure, framework-free test-generation logic. Kept out of any `.server` module
// so the sampling math (largest-remainder rounding, the no-duplicate invariant)
// is unit-testable without Firestore or the question bank.

import { ALL_DOMAINS, type Domain } from "../../types/domain";

/** Total questions in a generated mock exam (matches the real SAA-C03). */
export const TEST_SIZE = 65;

// Official SAA-C03 domain weights. Counts are derived via largestRemainder so
// the rounding is documented rather than hand-tuned, and stay in sync if the
// weights ever change.
const DOMAIN_WEIGHTS: Record<Domain, number> = {
  1: 0.3, // Design Secure Architectures
  2: 0.26, // Design Resilient Architectures
  3: 0.24, // Design High-Performing Architectures
  4: 0.2, // Design Cost-Optimized Architectures
};

/**
 * Apportion `total` items across `weights` (which need not sum to exactly 1)
 * using the largest-remainder method: floor each ideal share, then hand the
 * leftover units to the entries with the largest fractional remainders. The
 * returned counts sum to exactly `total`.
 */
export function largestRemainder(
  weights: Record<Domain, number>,
  total: number,
): Record<Domain, number> {
  const sumW = ALL_DOMAINS.reduce((s, d) => s + weights[d], 0);
  const ideal = ALL_DOMAINS.map((d) => ({
    domain: d,
    exact: (weights[d] / sumW) * total,
  }));

  const counts = Object.fromEntries(
    ideal.map(({ domain, exact }) => [domain, Math.floor(exact)]),
  ) as Record<Domain, number>;

  let remaining = total - ALL_DOMAINS.reduce((s, d) => s + counts[d], 0);
  // Largest fractional remainder first; stable on domain order for ties.
  const byRemainder = [...ideal].sort(
    (a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)),
  );
  for (
    let i = 0;
    remaining > 0;
    i = (i + 1) % byRemainder.length, remaining--
  ) {
    counts[byRemainder[i].domain]++;
  }
  return counts;
}

/** Per-domain question counts summing to {@link TEST_SIZE} (19/17/16/13). */
export const DOMAIN_COUNTS: Record<Domain, number> = largestRemainder(
  DOMAIN_WEIGHTS,
  TEST_SIZE,
);

/** Injectable randomness, defaulting to Math.random. Returns [0, 1). */
export type Rng = () => number;

/** Fisher–Yates shuffle of a copy of `arr`, driven by `rng`. */
function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Select {@link TEST_SIZE} **distinct** question nums, each counted toward
 * exactly one domain at its exam weight.
 *
 * Because questions can belong to several domains, the per-domain pools overlap.
 * To minimise starvation we process domains **least-populous-available-first**:
 * a domain with the fewest still-unselected candidates gets to claim its quota
 * before a more abundant domain consumes shared questions. Each picked num is
 * added to `selected` so it can't be re-counted for another domain.
 *
 * Top-up guard: if overlap/short pools leave the total under {@link TEST_SIZE}
 * after the per-domain pass, fill from all remaining unselected nums. With the
 * current bank this is unreachable, but it keeps the function total-correct.
 */
export function pickTestQuestions(
  byDomain: Record<Domain, number[]>,
  rng: Rng = Math.random,
): number[] {
  const selected = new Set<number>();

  // Re-evaluate availability each step: claiming a shared question shrinks the
  // pools of the domains that also list it.
  const remainingDomains = new Set<Domain>(ALL_DOMAINS);
  while (remainingDomains.size > 0) {
    const domain = [...remainingDomains].sort((a, b) => {
      const availA = (byDomain[a] ?? []).filter((n) => !selected.has(n)).length;
      const availB = (byDomain[b] ?? []).filter((n) => !selected.has(n)).length;
      return availA - availB;
    })[0];
    remainingDomains.delete(domain);

    const pool = (byDomain[domain] ?? []).filter((n) => !selected.has(n));
    for (const num of shuffle(pool, rng).slice(0, DOMAIN_COUNTS[domain])) {
      selected.add(num);
    }
  }

  if (selected.size < TEST_SIZE) {
    const shortfall = TEST_SIZE - selected.size;
    console.log(
      `[testGen] per-domain pass short by ${shortfall}; topping up from remaining pool`,
    );
    const leftover = Object.values(byDomain)
      .flat()
      .filter((n) => !selected.has(n));
    for (const num of shuffle([...new Set(leftover)], rng).slice(
      0,
      shortfall,
    )) {
      selected.add(num);
    }
  }

  // Ordered ascending so the test reads predictably (sidebar, prev/next).
  return [...selected].sort((a, b) => a - b);
}
