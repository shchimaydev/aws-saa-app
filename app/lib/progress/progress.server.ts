// Firestore progress service (Admin SDK). Same doc shape as the legacy app at
// /progress/{uid}, so existing user data is fully compatible — no migration.
//
//   results:    { [idx]: "correct" | "wrong" }   // idx is the 0-based question index
//   score:      { correct, wrong }
//   currentIdx: number                            // 0-based; last answered question
//   updatedAt:  serverTimestamp

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../firebase/firebase.server";

export type Result = "correct" | "wrong";

export interface Progress {
  results: Record<string, Result>;
  score: { correct: number; wrong: number };
  currentIdx: number;
}

const EMPTY: Progress = {
  results: {},
  score: { correct: 0, wrong: 0 },
  currentIdx: 0,
};

function progressRef(uid: string) {
  return adminDb.collection("progress").doc(uid);
}

async function readProgress(uid: string): Promise<Progress> {
  const snap = await progressRef(uid).get();
  if (!snap.exists)
    return { results: {}, score: { correct: 0, wrong: 0 }, currentIdx: 0 };
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

// During a single navigation, React Router runs every matched loader against
// the *same* Request instance. Both the quiz layout and the `$num` loader need
// progress, so we memoize the read per Request to collapse them into one
// Firestore fetch. The WeakMap evicts entries when the Request is GC'd, and the
// in-flight Promise is stored synchronously so parallel loaders share it.
const progressByRequest = new WeakMap<Request, Promise<Progress>>();

/**
 * Read the user's progress. Pass `request` to dedupe repeated reads within a
 * single navigation/request; omit it for one-off reads (e.g. actions).
 */
export function getProgress(uid: string, request?: Request): Promise<Progress> {
  if (!request) return readProgress(uid);
  const cached = progressByRequest.get(request);
  if (cached) return cached;
  const pending = readProgress(uid);
  progressByRequest.set(request, pending);
  return pending;
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
      {
        results,
        score,
        currentIdx: idx,
        updatedAt: FieldValue.serverTimestamp(),
      },
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
