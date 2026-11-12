// Every piece the canvas shows, read from the gallery's own catalogue (trenchcoat/app/src/catalog.ts), with the
// thumbnails the gallery captured. Illustrations and screens are left out: they are artwork and whole pages, not
// pieces to compare or riff on.
import examples from "virtual:tc-examples";
import { CATEGORIES as GALLERY_ORDER, LIBRARY_META, categoryOf, nameOf, readmeLines } from "~tc/app/src/catalog";

export type Theme = "light" | "dark";
export type Look = "standard" | "clean";

export type Piece = {
  /** Unique across libraries: the bare slug for components, "<library>/<slug>" for the rest */
  id: string;
  slug: string;
  library: string;
  libraryLabel: string;
  name: string;
  description: string;
  category: string;
  /** Has a live example (an html snippet on its docs page) */
  live: boolean;
};

export const LIBRARIES = ["components", "blocks", "motion"] as const;

const THUMBS = import.meta.glob<string>("../../../trenchcoat/app/src/thumbs/**/*.webp", { eager: true, query: "?url", import: "default" });

/** The piece's thumbnail in that theme and look; Clean falls back to Standard. Undefined when none was captured */
export function thumbOf(piece: Pick<Piece, "library" | "slug">, theme: Theme, look: Look): string | undefined {
  const base = `../../../trenchcoat/app/src/thumbs/${piece.library}/${piece.slug}`;
  return (look === "clean" ? THUMBS[`${base}.clean.${theme}.webp`] : undefined) ?? THUMBS[`${base}.${theme}.webp`];
}

export const PIECES: readonly Piece[] = LIBRARY_META.filter((lib) => (LIBRARIES as readonly string[]).includes(lib.key)).flatMap((lib) =>
  readmeLines(lib.readme).map(({ label, file, description }) => ({
    id: lib.key === "components" ? file : `${lib.key}/${file}`,
    slug: file,
    library: lib.key,
    libraryLabel: lib.label,
    name: nameOf(label),
    description,
    category: categoryOf(lib, file),
    // Blocks have no docs pages; a block and a component never share a slug's example
    live: lib.key !== "blocks" && Object.hasOwn(examples, file),
  })),
);

/** Sections in the gallery's order: each component category, then one per other library */
export const CATEGORIES: readonly string[] = [...new Set(PIECES.map((p) => p.category))].sort(
  (a, b) => (GALLERY_ORDER.indexOf(a) + 1 || Infinity) - (GALLERY_ORDER.indexOf(b) + 1 || Infinity),
);

export const LIBRARY_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  LIBRARY_META.filter((lib) => (LIBRARIES as readonly string[]).includes(lib.key)).map((lib) => [lib.key, lib.label]),
);
