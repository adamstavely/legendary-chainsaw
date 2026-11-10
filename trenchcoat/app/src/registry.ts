import type { ComponentType } from "react";
import cleanTwins from "virtual:tc-clean";
import { CATEGORIES, LIBRARY_META, categoryOf, idOf, nameOf, readmeLines, type Layout, type LibraryMeta } from "./catalog";

// Components, illustrations and motion pieces ported to Lit (src/elements/<slug>.ts): their demos get the React wrappers – the same API – and the
// stage's look comes from a look provider, so both looks load the same module
const litPorts = new Set(Object.keys(import.meta.glob("../../src/elements/*.ts")).map((p) => p.match(/([^/]+)\.ts$/)![1]).filter((s) => s !== "index" && s !== "react"));
// The look provider lives in src/elements/internal/look.ts – it has a page too
litPorts.add("look-provider");
const loadWrappers = () => import("../../src/elements/react");
// Every block is a Lit element (src/elements/<slug>.ts) with a thin React file in blocks/: one file, both looks – the
// stage's look provider picks one, as it does for the elements
const litBlocks = new Set(Object.keys(import.meta.glob("../../blocks/*.tsx")).map((p) => p.match(/([^/]+)\.tsx$/)![1]));

export type Variant = "standard" | "clean";
export type DemoProps = { ui: any };
export { CATEGORIES, LIBRARY_INFO, type Layout, type LibraryInfo } from "./catalog";

export type Entry = {
  /** Route and React key – the bare slug for components, "<library>/<slug>" for the others */
  id: string;
  slug: string;
  library: string;
  name: string;
  description: string;
  category: string;
  layout: Layout;
  files: Partial<Record<Variant, string>>;
  load: Partial<Record<Variant, () => Promise<unknown>>>;
  Demo?: ComponentType<DemoProps>;
};

type Modules = Record<string, () => Promise<unknown>>;

type Demos = Record<string, { default: ComponentType<DemoProps> }>;

type Library = LibraryMeta & { modules: Modules; demos: Demos };

// import.meta.glob needs literal paths, so each library's modules and demos are spelled out
const CODE: Record<string, { modules: Modules; demos: Demos }> = {
  components: { modules: import.meta.glob("../../src/components/*.tsx"), demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/*.tsx", { eager: true }) },
  blocks: { modules: import.meta.glob("../../blocks/*.tsx"), demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/blocks/*.tsx", { eager: true }) },
  screens: { modules: import.meta.glob("../../screens/*.tsx"), demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/screens/*.tsx", { eager: true }) },
  illustrations: { modules: import.meta.glob("../../illustrations/*.tsx"), demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/illustrations/*.tsx", { eager: true }) },
  motion: { modules: import.meta.glob("../../motion/*.tsx"), demos: import.meta.glob<{ default: ComponentType<DemoProps> }>("./demos/motion/*.tsx", { eager: true }) },
};
const LIBRARIES: Library[] = LIBRARY_META.map((meta) => ({ ...meta, ...CODE[meta.key] }));

function build(lib: Library): Entry[] {
  const moduleFor = (file: string) => Object.entries(lib.modules).find(([path]) => path.endsWith(`/${file}.tsx`))?.[1];
  const bySlug = new Map<string, Entry>();
  // README lines look like: - **Name** (`name.tsx`) – description. Components have one source with both looks
  // ("(Clean only)" for a single-look one); the Clean stage loads its in-memory twin (vite.config.ts)
  for (const { label, file, description } of readmeLines(lib.readme)) {
    const cleanOnly = label.endsWith(" (Clean only)");
    const variant: Variant = file.endsWith("-clean") || cleanOnly ? "clean" : "standard";
    const slug = file.replace(/-clean$/, "");
    const entry = bySlug.get(slug) ?? {
      id: idOf(lib.key, slug),
      slug,
      library: lib.key,
      name: nameOf(label),
      description,
      category: categoryOf(lib, slug),
      layout: lib.layout,
      files: {},
      load: {},
      Demo: (lib.key === "components" ? lib.demos[`./demos/${slug}.tsx`] : lib.demos[`./demos/${lib.key}/${slug}.tsx`])?.default,
    };
    entry.files[variant] = `${file}.tsx`;
    entry.load[variant] = moduleFor(file);
    if (lib.key === "components" && litPorts.has(slug)) {
      entry.files = { standard: `elements/${slug}.ts`, clean: `elements/${slug}.ts · look="clean"` };
      entry.load = { standard: loadWrappers, clean: loadWrappers };
    } else if ((lib.key === "illustrations" || lib.key === "motion") && litPorts.has(slug)) {
      // Single-look libraries: one stage, on the wrappers
      entry.files = { standard: `elements/${slug}.ts` };
      entry.load = { standard: loadWrappers };
    } else if (lib.key === "blocks" && litBlocks.has(slug)) {
      entry.files.clean = `${file}.tsx · look="clean"`;
      entry.load.clean = entry.load.standard;
    } else if (lib.key === "components" && !cleanOnly && cleanTwins[slug]) {
      entry.files.clean = `${file}.tsx · look="clean"`;
      entry.load.clean = cleanTwins[slug];
    }
    bySlug.set(slug, entry);
  }
  return [...bySlug.values()];
}

// Same order as the sidebar, so prev/next in the focus view walks it top to bottom
const rank = (e: Entry) => CATEGORIES.indexOf(e.category) >>> 0;
export const ENTRIES = LIBRARIES.flatMap(build).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
