// What's been riffed on this visit, per piece: each request and its variants. Kept variants live on disk (the dev
// server's /__canvas/variants); everything else lasts until the page reloads
import { reactive } from "vue";
import type { Kept, Variant } from "./types";

export type ShownVariant = (Variant | Kept) & { id: string; kept: boolean };
export type Round = {
  id: string;
  prompt: string;
  /** Riffed on this variant rather than on the piece as it is */
  from: { name: string; props: Record<string, unknown>; tokens: Record<string, string> } | null;
  variants: (Variant & { id: string })[];
};
export type PieceRiffs = { rounds: Round[]; kept: Kept[]; keptLoaded: boolean; shown: string | null };

const riffs = reactive(new Map<string, PieceRiffs>());
let next = 0;

export function riffsOf(slug: string): PieceRiffs {
  if (!riffs.has(slug)) riffs.set(slug, { rounds: [], kept: [], keptLoaded: false, shown: null });
  return riffs.get(slug)!;
}

/** Adds a request's variants, laid over what it riffed from, and shows them */
export function addRound(slug: string, prompt: string, from: Round["from"], variants: Variant[]): Round {
  const id = `r${++next}`;
  const round: Round = {
    id,
    prompt,
    from,
    variants: variants.map((v, i) => ({ ...v, id: `${id}-${i}`, props: { ...from?.props, ...v.props }, tokens: { ...from?.tokens, ...v.tokens } })),
  };
  const piece = riffsOf(slug);
  piece.rounds.unshift(round);
  piece.shown = id;
  return round;
}

export function discard(slug: string, id: string) {
  for (const round of riffsOf(slug).rounds) round.variants = round.variants.filter((v) => v.id !== id);
}

/** What the canvas shows around the piece: the kept variants, then the round being looked at */
export function shownVariants(slug: string): ShownVariant[] {
  const piece = riffsOf(slug);
  const round = piece.rounds.find((r) => r.id === piece.shown);
  return [...piece.kept.map((k) => ({ ...k, id: `kept-${k.name}`, kept: true })), ...(round?.variants ?? []).map((v) => ({ ...v, kept: false }))];
}

/** Forget everything – for tests */
export const resetRiffs = () => riffs.clear();
