// Shared, runtime-free types for the question bank.
// Safe to import from anywhere (server or client) via `import type`.

import type { Domain } from "./domain";

export interface Question {
  num: number;
  text: string;
  options: string[];
  /** Indices into `options` that are correct (0-based). */
  correct: number[];
  /** True when more than one option must be selected. */
  multi: boolean;
  /** One explanation per option, aligned by index with `options`. */
  optionExplanations: string[];
  /**
   * SAA-C03 exam domain(s) this question maps to — an unordered set, no domain
   * ranks above another. A question covers 1–3 domains (most have 1–2) and is a
   * candidate for any of them; test generation counts each picked question
   * toward exactly one domain.
   */
  domains: Domain[];
}

export interface SidebarEntry {
  num: number;
  /** First 55 chars of whitespace-normalized question text (matches legacy). */
  preview: string;
}
