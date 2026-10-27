// The overview tiles' thumbnails, captured by scripts/capture-thumbs.mjs into thumbs/<library>/<slug>.<theme>.webp
// (and <slug>.clean.<theme>.webp when the Clean look was captured too). Imported as URLs, so the standalone
// single-file build inlines them as data: URIs – which is why they live under src, not public.
import type { Entry, Variant } from "./registry";

export type ThumbTheme = "light" | "dark";

const FILES = import.meta.glob<string>("./thumbs/**/*.webp", { eager: true, query: "?url", import: "default" });

/** True when any Clean thumbnail exists – only then do the tiles follow the look switch */
export const HAS_CLEAN_THUMBS = Object.keys(FILES).some((p) => p.endsWith(`.clean.light.webp`));

/** The entry's thumbnail in that theme and look; Clean falls back to Standard. Undefined when none was captured */
export function thumbFor(entry: Pick<Entry, "library" | "slug">, theme: ThumbTheme, look: Variant = "standard"): string | undefined {
  const base = `./thumbs/${entry.library}/${entry.slug}`;
  return (look === "clean" ? FILES[`${base}.clean.${theme}.webp`] : undefined) ?? FILES[`${base}.${theme}.webp`];
}

/** Up to two initials for the placeholder tile: "Agent Plan" → "AP", "Button" → "Bu" */
export function initials(name: string) {
  const words = name.split(/[\s-]+/).filter((w) => /[a-z0-9]/i.test(w));
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] ?? "?").slice(0, 2).replace(/^./, (c) => c.toUpperCase());
}

/** "AI & chat" → "ai-chat" – the category pages' route, #/library/components/<slug> */
export const categorySlug = (category: string) =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
