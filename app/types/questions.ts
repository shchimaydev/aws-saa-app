// Shared, runtime-free types for the question bank.
// Safe to import from anywhere (server or client) via `import type`.

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
}

export interface SidebarEntry {
  num: number;
  /** First 55 chars of whitespace-normalized question text (matches legacy). */
  preview: string;
}
