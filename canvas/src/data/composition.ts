// Which pieces are built from which, for the Graph layout and the cards' descriptions. The links come from the
// elements' source (plugins/trenchcoat.ts, virtual:tc-graph); a block shares its element's slug, so its links are the
// element's
import edges from "virtual:tc-graph";
import { graphLayout, type Link } from "../canvas/graph";
import { PIECES } from "./pieces";

const pieceOf = new Map<string, string>();
for (const p of PIECES) if (!pieceOf.has(p.slug) || p.library === "components") pieceOf.set(p.slug, p.id);

/** [user, used] pairs of piece ids */
export const LINKS: readonly Link[] = edges.flatMap(([a, b]) => (pieceOf.has(a) && pieceOf.has(b) ? [[pieceOf.get(a)!, pieceOf.get(b)!] as const] : []));

/** The pieces this one is built with */
export const usesOf = (id: string) => LINKS.filter(([a]) => a === id).map(([, b]) => b);
/** The pieces built with this one */
export const usedIn = (id: string) => LINKS.filter(([, b]) => b === id).map(([a]) => a);

/** The Graph layout's groups, for the list view */
export const graphGroups = (ids: readonly string[]) => graphLayout(ids, LINKS).sections.map(({ label, ids }) => ({ label, ids }));

const names = new Map(PIECES.map((p) => [p.id, p.name]));
const list = (ids: string[]) => ids.map((id) => names.get(id) ?? id).join(", ");

/** "Built with Button, Code Block. Used in AI Side Pane." – empty for a piece with no links */
export function compositionText(id: string): string {
  const uses = usesOf(id);
  const used = usedIn(id);
  return [uses.length ? `Built with ${list(uses)}.` : "", used.length ? `Used in ${list(used)}.` : ""].filter(Boolean).join(" ");
}
