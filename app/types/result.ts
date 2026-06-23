// Shared, runtime-free types for answer outcomes.
// Safe to import from anywhere (server or client) via `import type`.

/**
 * The outcome of scoring a submitted answer. Stored per-question in progress
 * (`results[idx]`) and on generated tests, and surfaced to the UI.
 */
export type Result = "correct" | "wrong";

/** A `Result` that may not exist yet — i.e. the question is unanswered. */
export type MaybeResult = Result | null;
