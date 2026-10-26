/*
 * Remediation 1.6: diffWords uses Myers' O(ND) diff instead of a capped LCS table, so long texts stay word by word
 * (the table turned anything over ~1,500 words into one replacement) and the work grows with the edits, not the
 * length squared.
 */
import { describe, expect, test } from "vitest";
import { diffWords, type DiffSegment } from "@components/inline-diff";

/** Both texts rebuilt from the segments – a diff must never lose or invent text */
const sides = (segs: DiffSegment[]) => ({
  original: segs.map((s) => (s.type === "equal" ? s.text : s.remove)).join(""),
  suggested: segs.map((s) => (s.type === "equal" ? s.text : s.insert)).join(""),
});
const changes = (segs: DiffSegment[]) => segs.filter((s) => s.type === "change").length;

// Same sequence every run
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe("diffWords – Myers", () => {
  test("random edits: the segments rebuild both texts exactly", () => {
    const vocab = ["the", "a", "fast", "slow", "agent", "plan", "runs", "stops", ",", ".", "and", "then"];
    for (let round = 0; round < 200; round++) {
      const words = Array.from({ length: 5 + Math.floor(rand() * 40) }, () => vocab[Math.floor(rand() * vocab.length)]);
      const edited = words.flatMap((w) => {
        const r = rand();
        if (r < 0.1) return [];
        if (r < 0.2) return [vocab[Math.floor(rand() * vocab.length)]];
        if (r < 0.25) return [w, vocab[Math.floor(rand() * vocab.length)]];
        return [w];
      });
      const original = words.join(" ");
      const suggested = edited.join(" ");
      expect(sides(diffWords(original, suggested))).toEqual({ original, suggested });
    }
  });

  test("a 3,000-word text with 150 scattered edits stays word by word, and quickly", () => {
    const words = Array.from({ length: 3000 }, (_, i) => `w${i}`);
    const original = words.join(" ");
    const suggested = words.map((w, i) => (i % 20 === 7 ? `x${i}` : w)).join(" ");
    const started = performance.now();
    const segs = diffWords(original, suggested);
    const ms = performance.now() - started;
    expect(changes(segs)).toBe(150);
    expect(sides(segs)).toEqual({ original, suggested });
    expect(ms).toBeLessThan(500); // the LCS table would have needed 36 M cells and been capped
  });

  test("past the budget the middle is still one replacement", () => {
    const original = Array.from({ length: 400 }, (_, i) => `a${i}`).join(" ");
    const suggested = Array.from({ length: 400 }, (_, i) => `b${i}`).join(" ");
    expect(changes(diffWords(original, suggested, 1_000))).toBe(1);
  });
});
