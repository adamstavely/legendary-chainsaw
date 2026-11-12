// The similarity script's output (scripts/similarity.mjs), for the Similar layout and the look-alike notes on cards
import { similarLayout, type SimilarityData } from "../canvas/similarity";
import raw from "./similarity.json";

// Written by the script in this shape; tests/unit/similarity.test.ts checks it still matches the thumbnails
export const SIMILARITY = raw as unknown as SimilarityData;

export type Alike = { id: string; similarity: number };

const duplicates = new Map<string, Alike[]>();
for (const [a, b, similarity] of SIMILARITY.duplicates) {
  duplicates.set(a, [...(duplicates.get(a) ?? []), { id: b, similarity }]);
  duplicates.set(b, [...(duplicates.get(b) ?? []), { id: a, similarity }]);
}

/** Pieces that look almost the same as this one: candidates to merge or tell apart */
export const lookAlikesOf = (id: string): readonly Alike[] => duplicates.get(id) ?? [];

/** The pieces that look most like this one, nearest first */
export const neighboursOf = (id: string): readonly Alike[] => (SIMILARITY.neighbours[id] ?? []).map(([n, similarity]) => ({ id: n, similarity }));

export const compared = (id: string) => Object.hasOwn(SIMILARITY.thumbs, id);

/** The Similar layout's groups, for the list view */
export const similarGroups = (ids: readonly string[]) => similarLayout(SIMILARITY, ids).sections.map(({ label, ids }) => ({ label, ids }));
