// Firestore progress service (Admin SDK). Same doc shape as the legacy app at
// /progress/{uid}, so existing user data is fully compatible — no migration.
//
//   results:    { [idx]: "correct" | "wrong" }   // idx is the 0-based question index
//   score:      { correct, wrong }
//   currentIdx: number                            // 0-based; last answered question
//   updatedAt:  serverTimestamp

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase.server";

export type Result = "correct" | "wrong";

export interface Progress {
  results: Record<string, Result>;
  score: { correct: number; wrong: number };
  currentIdx: number;
}

const EMPTY: Progress = { results: {}, score: { correct: 0, wrong: 0 }, currentIdx: 0 };

function progressRef(uid: string) {
  return adminDb.collection("progress").doc(uid);
}

export async function getProgress(uid: string): Promise<Progress> {
  const snap = await progressRef(uid).get();
  if (!snap.exists) return { results: {}, score: { correct: 0, wrong: 0 }, currentIdx: 0 };
  const data = snap.data() ?? {};
  return {
    results: (data.results as Record<string, Result>) ?? {},
    score: {
      correct: data.score?.correct ?? 0,
      wrong: data.score?.wrong ?? 0,
    },
    currentIdx: typeof data.currentIdx === "number" ? data.currentIdx : 0,
  };
}

/**
 * Record a graded answer for question `idx` (0-based). Scored once only — a
 * repeat submission for an already-answered question doesn't change the score
 * (parity with legacy). Always advances `currentIdx` to `idx` for resume.
 */
export async function recordAnswer(
  uid: string,
  idx: number,
  result: Result,
): Promise<void> {
  const ref = progressRef(uid);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() ?? {}) : {};
    const results: Record<string, Result> = { ...(data.results ?? {}) };
    const score = {
      correct: data.score?.correct ?? 0,
      wrong: data.score?.wrong ?? 0,
    };

    const key = String(idx);
    if (!results[key]) {
      results[key] = result;
      if (result === "correct") score.correct++;
      else score.wrong++;
    }

    tx.set(
      ref,
      { results, score, currentIdx: idx, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  });
}

export async function resetProgress(uid: string): Promise<void> {
  await progressRef(uid).set({
    ...EMPTY,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
