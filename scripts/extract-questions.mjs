// One-off: extract the `const QUESTIONS = [ ... ];` array out of the legacy
// index.html and write it to app/data/questions.json.
//
// The array keys are already double-quoted (valid JSON), so once we isolate the
// `[ ... ]` literal we can JSON.parse it directly. We locate the closing bracket
// with a string-aware depth scan so any `[`/`]` inside explanation text is ignored.
//
// Usage: node scripts/extract-questions.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SRC = resolve(root, "index.html");
const OUT = resolve(root, "app/data/questions.json");

const html = readFileSync(SRC, "utf8");

const marker = "const QUESTIONS = ";
const declStart = html.indexOf(marker);
if (declStart === -1) throw new Error(`Could not find "${marker}" in ${SRC}`);

const arrStart = html.indexOf("[", declStart);
if (arrStart === -1) throw new Error("Could not find opening '[' of QUESTIONS array");

// String-aware bracket scan to find the matching closing ']'.
let depth = 0;
let inString = false;
let escaped = false;
let arrEnd = -1;
for (let i = arrStart; i < html.length; i++) {
  const ch = html[i];
  if (inString) {
    if (escaped) {
      escaped = false;
    } else if (ch === "\\") {
      escaped = true;
    } else if (ch === '"') {
      inString = false;
    }
    continue;
  }
  if (ch === '"') {
    inString = true;
  } else if (ch === "[") {
    depth++;
  } else if (ch === "]") {
    depth--;
    if (depth === 0) {
      arrEnd = i;
      break;
    }
  }
}
if (arrEnd === -1) throw new Error("Could not find matching closing ']' of QUESTIONS array");

const literal = html.slice(arrStart, arrEnd + 1);
const questions = JSON.parse(literal);

if (!Array.isArray(questions)) throw new Error("Parsed QUESTIONS is not an array");

// Sanity checks.
const count = questions.length;
const nums = questions.map((q) => q.num);
const expectedSeq = nums.every((n, i) => n === i + 1);
const multiCount = questions.filter((q) => q.multi || q.correct.length > 1).length;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(questions, null, 2) + "\n", "utf8");

console.log(`Wrote ${count} questions to ${OUT}`);
console.log(`  num sequence 1..${count} contiguous: ${expectedSeq}`);
console.log(`  multi-answer questions: ${multiCount}`);
const q1 = questions[0];
console.log(`  q1: num=${q1.num} options=${q1.options.length} correct=${JSON.stringify(q1.correct)} multi=${q1.multi}`);
