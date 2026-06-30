// Firestore persistence for generated mock exams (Admin SDK). Mirrors the
// patterns in progress.server.ts: transactional, idempotent scoring, and a
// per-Request WeakMap dedup so the layout loader and the page loader share one
// read. Each user's tests live in a subcollection: /users/{uid}/tests/{testId}.

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../firebase/firebase.server";
import { recordAnswer, type Result } from "../progress/progress.server";
import { getQuestionNumsByDomain } from "../questions/questions.server";
import { pickTestQuestions } from "./test-gen";

export interface Test {
  /** Ordered 1-based question nums, length 65. */
  questions: number[];
  /** Graded results keyed by question num (string). */
  results: Record<string, Result>;
  score: { correct: number; wrong: number };
}

function testsCol(uid: string) {
  return adminDb.collection("users").doc(uid).collection("tests");
}

function readTest(uid: string, testId: string): Promise<Test | null> {
  return testsCol(uid)
    .doc(testId)
    .get()
    .then((snap) => {
      if (!snap.exists) return null;
      const data = snap.data() ?? {};
      return {
        questions: (data.questions as number[]) ?? [],
        results: (data.results as Record<string, Result>) ?? {},
        score: {
          correct: data.score?.correct ?? 0,
          wrong: data.score?.wrong ?? 0,
        },
      };
    });
}

// Like getProgress, dedupe reads within a single navigation. Keyed by Request →
// Map<testId, Promise> since a request only ever touches one test, but keeping
// it a map keeps the shape obvious and future-proof.
const testsByRequest = new WeakMap<
  Request,
  Map<string, Promise<Test | null>>
>();

/**
 * Read a test doc. Pass `request` to dedupe repeated reads within a single
 * navigation (the layout loader and the `:num` loader both need it).
 */
export function getTest(
  uid: string,
  testId: string,
  request?: Request,
): Promise<Test | null> {
  if (!request) return readTest(uid, testId);
  let cache = testsByRequest.get(request);
  if (!cache) {
    cache = new Map();
    testsByRequest.set(request, cache);
  }
  const cached = cache.get(testId);
  if (cached) return cached;
  const pending = readTest(uid, testId);
  cache.set(testId, pending);
  return pending;
}

/**
 * Generate a fresh 65-question mock exam, persist it with an auto-id, and
 * return its id plus the chosen questions.
 */
export async function createTest(
  uid: string,
): Promise<{ testId: string; questions: number[] }> {
  const questions = pickTestQuestions(getQuestionNumsByDomain());
  const ref = testsCol(uid).doc();
  const now = FieldValue.serverTimestamp();
  await ref.set({
    questions,
    results: {},
    score: { correct: 0, wrong: 0 },
    createdAt: now,
    updatedAt: now,
  });
  return { testId: ref.id, questions };
}

/**
 * Clear all graded answers for a test, resetting its score to zero. Leaves the
 * question set intact so the user retakes the same exam. The mirrored answers in
 * global `/progress/{uid}` are intentionally left as-is — progress tracks
 * whether a question has ever been answered, independent of this test.
 */
export async function resetTest(uid: string, testId: string): Promise<void> {
  const ref = testsCol(uid).doc(testId);
  await ref.set(
    {
      results: {},
      score: { correct: 0, wrong: 0 },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Clear only the *wrong* answers for a test, leaving correct answers and the
 * question set intact, and zero out the wrong tally. Lets the user re-attempt
 * the questions they missed. Like `resetTest`, the mirrored answers in global
 * `/progress/{uid}` are intentionally left as-is — progress tracks whether a
 * question has ever been answered, independent of this test.
 */
export async function resetTestWrongAnswers(
  uid: string,
  testId: string,
): Promise<void> {
  const ref = testsCol(uid).doc(testId);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Response("Not Found", { status: 404 });
    const results: Record<string, Result> = snap.data()?.results ?? {};

    // Delete each wrong entry by its nested field path — a merged `set` of the
    // rebuilt map would keep stale keys rather than remove them.
    const updates: Record<string, unknown> = {
      "score.wrong": 0,
      updatedAt: FieldValue.serverTimestamp(),
    };
    for (const [key, value] of Object.entries(results)) {
      if (value === "wrong") updates[`results.${key}`] = FieldValue.delete();
    }

    tx.set(ref, updates, { merge: true });
  });
}

/** Most-recently-created test id for this user, or null if they have none. */
export async function getLatestTestId(uid: string): Promise<string | null> {
  const snap = await testsCol(uid).orderBy("createdAt", "desc").limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

/**
 * Record a graded answer for question `num` (1-based) within a test. Idempotent
 * per num (scored once), in a transaction over the test doc. Then mirrors the
 * answer into global `/progress/{uid}` so the quiz sidebar/score stay in sync.
 */
export async function recordTestAnswer(
  uid: string,
  testId: string,
  num: number,
  result: Result,
): Promise<void> {
  const ref = testsCol(uid).doc(testId);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Response("Not Found", { status: 404 });
    const data = snap.data() ?? {};
    const results: Record<string, Result> = { ...(data.results ?? {}) };
    const score = {
      correct: data.score?.correct ?? 0,
      wrong: data.score?.wrong ?? 0,
    };

    const key = String(num);
    if (!results[key]) {
      results[key] = result;
      if (result === "correct") score.correct++;
      else score.wrong++;
    }

    tx.set(
      ref,
      { results, score, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  });

  // Mirror into global progress (0-based idx) so the quiz reflects the answer.
  await recordAnswer(uid, num - 1, result);
}
