// The gallery's text as Markdown: one file per page, written by scripts/export-docs-md.mjs into docs/. Each page
// follows the site's own, section by section – DocsPage.tsx and DocsSections.tsx for a component, App.tsx's focus view
// for a block or screen, Foundations.tsx for the foundations – from the same data: the guidance files, the generated
// API, perf.json and the framework snippets. What the site shows behind a tab (each framework) is written out in full.
// Prose that lives in those .tsx files is repeated here; change it in both places.
import { posix } from "node:path";
import { CATEGORIES, DOCUMENTED, LIBRARY_META, categoryOf, idOf, nameOf, readmeLines, type LibraryMeta } from "../catalog";
import { GUIDANCE, PATTERNS, type Guidance } from "./guidance";
import {
  FRAMEWORKS,
  angularName,
  bindEvent,
  bindProperty,
  controlledSnippets,
  reactEvent,
  snippets,
  twoWay,
  type ApiElement,
  type ApiPage,
  type ApiReact,
  type Browser,
  type BrowserFeature,
  type Framework,
  type FrameworkFacts,
  type Runtime,
} from "./usage";
import type { PerfEntry, PerfFile } from "./DocsSections";
import changelogSource from "../../../CHANGELOG.md?raw";
import tokensCss from "../../../tokens/tokens.css?raw";

const API = Object.fromEntries(
  Object.entries(import.meta.glob<ApiPage>("./api/*.json", { eager: true, import: "default" })).map(([p, v]) => [p.match(/([^/]+)\.json$/)![1], v]),
);
const PERF = Object.values(import.meta.glob<PerfFile>("./perf.json", { eager: true, import: "default" }))[0];
const BUDGETS = (Object.values(import.meta.glob<Record<string, number>>("../../../tests/render-budgets.json", { eager: true, import: "default" }))[0] ?? {}) as Record<string, number>;
const PROSE = import.meta.glob<string>("./foundations/*.md", { query: "?raw", import: "default", eager: true });
const SPOT_FILES = import.meta.glob<string>("../../../illustrations/spot/*/*.svg", { query: "?raw", import: "default", eager: true });
const litBlocks = new Set(Object.keys(import.meta.glob("../../../blocks/*.tsx")).map((p) => p.match(/([^/]+)\.tsx$/)![1]));

type FloorFile = {
  floor: Record<Browser, string | null>;
  setBy: Record<Browser, { features: string[]; elements: number }>;
  features: { id: string; name: string; versions: Record<Browser, string | null>; progressive: boolean; without?: string; elements: number }[];
  engines: { playwright: string; chromium: string; firefox: string; webkit: string };
};
const FLOOR = Object.values(import.meta.glob<FloorFile>("./browser-floor.json", { eager: true, import: "default" }))[0];

// ── The pages ─────────────────────────────────────────────────────────────────────────────────────────────────────
export type Piece = { id: string; slug: string; library: string; name: string; description: string; category: string; files: string[] };

/** Every piece, in the sidebar's order – the same entries as registry.ts, without the code */
export const PIECES: Piece[] = LIBRARY_META.flatMap((lib) => {
  const bySlug = new Map<string, Piece>();
  for (const { label, file, description } of readmeLines(lib.readme)) {
    const slug = file.replace(/-clean$/, "");
    const piece = bySlug.get(slug) ?? { id: idOf(lib.key, slug), slug, library: lib.key, name: nameOf(label), description, category: categoryOf(lib, slug), files: [] };
    piece.files.push(`${file}.tsx`);
    bySlug.set(slug, piece);
  }
  return [...bySlug.values()];
}).sort((a, b) => (CATEGORIES.indexOf(a.category) >>> 0) - (CATEGORIES.indexOf(b.category) >>> 0) || a.name.localeCompare(b.name));

export const FOUNDATION_PAGES: [string, string][] = [
  ["getting-started", "Getting started"],
  ["looks", "Looks"],
  ["themes", "Themes"],
  ["tokens", "Tokens"],
  ["patterns", "Patterns"],
  ["accessibility", "Accessibility"],
  ["frameworks", "Frameworks"],
  ["generative-ui", "Generative UI"],
  ["spot-illustrations", "Spot illustrations"],
  ["browser-support", "Browser support"],
  ["performance", "Performance"],
  ["changelog", "Changelog"],
];

const pathOf = (p: Piece) => `${p.library}/${p.slug}.md`;
/** The site gives elements a docs page. Blocks are elements too, with guidance and an API, which the site only searches –
 *  here they get the same page. Screens keep the plain one: their names can be a component's (Search Results). */
const hasDocsPage = (p: Piece) => DOCUMENTED.has(p.library) || (p.library === "blocks" && !!(GUIDANCE[p.slug] || API[p.slug]));

/** Every file the export writes: [path under docs/, Markdown] */
export function exportPages(): [string, string][] {
  const out: [string, string][] = [["README.md", home()]];
  for (const lib of LIBRARY_META) out.push([`${lib.key}/README.md`, libraryPage(lib)]);
  for (const p of PIECES) out.push([pathOf(p), hasDocsPage(p) ? docsPage(p) : focusPage(p)]);
  for (const [id, title] of FOUNDATION_PAGES) out.push([`foundations/${id}.md`, foundationPage(id, title)]);
  return out.map(([path, md]) => [path, finish(path, md)]);
}

// ── Markdown helpers ──────────────────────────────────────────────────────────────────────────────────────────────
/** Tag names in JSDoc prose ("<tc-look-provider>") are text, not HTML – escaped outside code spans */
const esc = (text: string) => text.split(/(`[^`]*`)/).map((part, i) => (i % 2 ? part : part.replace(/</g, "&lt;"))).join("");
const code = (s: string) => {
  const ticks = "`".repeat(Math.max(0, ...[...s.matchAll(/`+/g)].map((m) => m[0].length)) + 1);
  return ticks.length > 1 ? `${ticks} ${s} ${ticks}` : `\`${s}\``;
};
const fence = (body: string, lang: string) => {
  const ticks = "`".repeat(Math.max(2, ...[...body.matchAll(/`+/g)].map((m) => m[0].length)) + 1);
  return `${ticks}${lang}\n${body.trimEnd()}\n${ticks}`;
};
const cell = (s: string | number) => String(s).replace(/\n+/g, " ").replace(/\|/g, "\\|");
function table(head: string[], rows: (string | number)[][]) {
  if (!rows.length) return "";
  return [`| ${head.map(cell).join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
}
const dash = "–";
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const ms = (n: number) => (n < 10 ? `${n.toFixed(1)} ms` : `${Math.round(n)} ms`);
const count = (n: number) => n.toLocaleString("en-GB");
const list = (items: string[]) => items.map((x) => `- ${x}`).join("\n");
/** "a, b and c" */
const and = (xs: string[], last = "and") => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${last} ${xs[xs.length - 1]}`);
const blocks = (...parts: (string | false | null | undefined)[]) => parts.filter((x): x is string => !!x && !!x.trim()).join("\n\n");
const section = (title: string, ...body: (string | false | null | undefined)[]) => blocks(`## ${title}`, ...body);
const sub = (title: string, ...body: (string | false | null | undefined)[]) => blocks(`### ${title}`, ...body);
const hint = (text: string) => `*${text.trim()}*`;

/** The anchor GitHub gives a heading */
const anchor = (title: string) => title.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

/** The site's section ids, for #/<id>/<section> links */
const SECTION_TITLES: Record<string, string> = {
  example: "Example", overview: "Overview", anatomy: "Anatomy", looks: "Looks", theme: "Theme", usage: "Usage", api: "API", frameworks: "Frameworks",
  accessibility: "Accessibility", "browser-support": "Browser support", performance: "Performance", content: "Content", "do-dont": "Do and don't",
  related: "Related", changelog: "Changelog",
};

/** A gallery route (#/…) as a link from one exported file to another */
function route(from: string, hash: string): string | null {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  let target: string | null = null;
  let frag = "";
  if (!parts.length) target = "README.md";
  else if (parts[0] === "foundations" && parts[1]) target = `foundations/${parts[1]}.md`;
  else if (parts[0] === "library" && parts[1]) target = `${parts[1]}/README.md`;
  else {
    // The longest id that matches, as the site routes; then a bare slug (#/agent-scene for illustrations/agent-scene)
    const byId = [2, 1].map((n) => [PIECES.find((x) => x.id === parts.slice(0, n).join("/")), n] as const).find(([p]) => p);
    const [p, used] = byId ?? [PIECES.find((x) => x.slug === parts[0]), 1];
    if (p) {
      target = pathOf(p);
      const s = parts[used];
      if (s) frag = `#${anchor(SECTION_TITLES[s] ?? s)}`;
    }
  }
  if (!target) return null;
  const rel = target === from ? "" : posix.relative(posix.dirname(from), target);
  return (rel || "") + frag || "#";
}

/** Gallery links become links between the files; ones that lead nowhere become plain text */
function finish(path: string, md: string) {
  const body = md.replace(/\]\((#\/[^)\s]*)\)/g, (whole, hash: string) => {
    const to = route(path, hash);
    return to ? `](${to})` : whole;
  });
  return `<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->\n\n${body.trim()}\n`;
}

/** Component names in prose become links to their pages: `command-menu` → the Command Menu page */
const linkSlugs = (text: string) =>
  text.replace(/`([a-z][a-z0-9-]+)`/g, (whole, slug: string) => {
    const p = PIECES.find((x) => x.slug === slug);
    return p ? `[${p.name}](#/${p.id})` : whole;
  });

// ── Home and library pages ────────────────────────────────────────────────────────────────────────────────────────
const piecesOf = (key: string) => PIECES.filter((p) => p.library === key);
const fileCount = (ps: Piece[]) => ps.reduce((n, p) => n + p.files.length, 0);

function home() {
  return blocks(
    "# Trenchcoat",
    "A UI kit for AI-native products. Components, illustrations and motion are moving to Lit web components that any framework can use, packaged with one stylesheet, `tokens.css`. Blocks and Screens are single React files you can copy.",
    list(LIBRARY_META.map((lib) => `[${lib.label}](#/library/${lib.key}): ${piecesOf(lib.key).length}`)),
    section(
      "What's inside",
      "The libraries stack: **Motion** primitives add movement, **Components** are the interactive pieces, **Blocks** combine components into sections, and **Screens** are whole pages in an app shell. **Illustrations** sit alongside for empty states and marketing.",
      "Motion → Components → Blocks → Screens, + Illustrations",
      ...LIBRARY_META.map((lib) => {
        const ps = piecesOf(lib.key);
        return sub(
          `[${lib.label}](#/library/${lib.key})`,
          `${ps.length} items · ${fileCount(ps)} files`,
          `**${lib.tagline}**`,
          lib.about,
          `${ps.slice(0, 5).map((p) => p.name).join(" · ")}${ps.length > 5 ? " …" : ""}`,
        );
      }),
    ),
    section(
      "Standard and Clean",
      'Every component comes in two styles, picked with its `look` prop: `"standard"` (the default) or `"clean"`. They are two design languages, not two weights of one theme: pick one per product. Props and behaviour are the same. Blocks built on the elements follow the nearest look provider, so they come in both; other Blocks, Screens, Illustrations and Motion come in a single style.',
      table(
        ["", "Standard", "Clean"],
        [
          ["Feel", "Tactile and branded – solid outlines, gradient fills on dark buttons, a subtle shine", "Flat and quiet, in the style of Linear or Vercel – hairline shadows instead of borders"],
          ["Surfaces", "Cards often sit in a gray tray", "One white card, 0.5px dividers"],
          ["Colour", "Solid greys and solid accents (e.g. bright red for destructive)", "Translucent greys and soft tints (e.g. an 8% red fill)"],
          ["Icons", "1.5–1.6px strokes", "1.1–1.25px strokes"],
        ],
      ),
      list([
        "**API:** Same props and behaviour. A few clean files go further: Decision Tree adds follow-up questions, Combobox and Filter Menu fold extra chips into “+N”.",
        "**Theming:** Both read the shared `--tc-` design tokens: override one (e.g. `--tc-accent`) to theme every component, or a component token (e.g. `--tc-button-radius`) for one. Each style carries its own values as fallbacks.",
        "**Mixing:** Each style has its own CSS class prefix, so both can appear on one page without clashing.",
      ]),
      "See the difference live in the gallery: [Button](#/button), [Change Summary](#/change-summary) and [Segmented Control](#/segmented-control).",
    ),
    section(
      "Using a file",
      [
        "Components need `tokens/tokens.css` on the page – it holds every value they use. While they're ported to Lit, copy `src/components/<name>.tsx` together with `src/internal/`.",
        "Blocks, Screens, Illustrations and Motion are self-contained: copy the file into your project, e.g. `components/ui/`, and import it from there.",
        "If it imports another piece as `@/components/ui/<name>`, copy that file alongside – Screens build on App Shell, Blocks on components like Button and Kpi Chart.",
        'The styles are injected by the file itself. Theme it by overriding `--tc-` tokens in `tokens/tokens.css` or on any ancestor. Dark mode: `data-tc-theme="dark"` (or `.dark`) on an ancestor, `data-tc-theme="system"` to follow the OS. Reduced motion is respected automatically.',
        "Open any item here to see its file name, and use Replay to restart its animations.",
      ]
        .map((x, i) => `${i + 1}. ${x}`)
        .join("\n"),
    ),
    section("Foundations", list(FOUNDATION_PAGES.map(([id, title]) => `[${title}](#/foundations/${id})`))),
  );
}

function libraryPage(lib: LibraryMeta) {
  const ps = piecesOf(lib.key);
  const line = (p: Piece) => `- [${p.name}](#/${p.id}) – ${esc(p.description)}`;
  const groups = lib.categories ? [...lib.categories.map(([c]) => c), "Other"] : [lib.label];
  return blocks(
    "[← Overview](#/)",
    `# ${lib.label}`,
    `**${lib.tagline}**`,
    lib.about,
    `${ps.length} items · ${fileCount(ps)} files`,
    ...(lib.categories
      ? groups.map((c) => {
          const inCat = ps.filter((p) => p.category === c).sort((a, b) => a.name.localeCompare(b.name));
          return inCat.length ? section(`${c} (${inCat.length})`, inCat.map(line).join("\n")) : null;
        })
      : [ps.map(line).join("\n")]),
  );
}

// ── A block or screen: the focus view ─────────────────────────────────────────────────────────────────────────────
function focusPage(p: Piece) {
  const lib = LIBRARY_META.find((l) => l.key === p.library)!;
  const both = p.library === "blocks" && litBlocks.has(p.slug);
  const files = both ? [`${p.files[0]}`, `${p.files[0]} · look="clean"`] : p.files;
  return blocks(
    `[← ${lib.label}](#/library/${lib.key})`,
    `# ${p.name}`,
    esc(p.description),
    list(files.map((f) => code(f))),
    both
      ? "Shown in both looks, Standard and Clean: the block follows the nearest look provider."
      : "One style.",
    `The live example is in the gallery at ${code(`#/${p.id}`)}; Replay restarts its animations.`,
  );
}

// ── A component, illustration or motion piece: the design-system page ─────────────────────────────────────────────
function docsPage(p: Piece) {
  const guide: Guidance | undefined = GUIDANCE[p.slug];
  const api: ApiPage | undefined = API[p.slug];
  const main = api?.elements[0];
  const status = guide?.status ?? "stable";
  const s = guide?.sections ?? {};
  const lib = LIBRARY_META.find((l) => l.key === p.library)!;

  const head = blocks(
    `[← ${lib.label}](#/library/${lib.key})`,
    `# ${p.name}`,
    `**${p.category}**${status === "new" ? " · New" : status === "react-twin" ? " · Also in React" : ""}`,
    esc(p.description),
    main &&
      list([
        `**Element:** ${api!.elements.map((e) => code(`<${e.tag}>`)).join(", ")}`,
        ...(api!.size ? [`**Size:** ${kb(api!.size.gzip)} gzip · ${kb(api!.size.min)} min, on a page that has Lit · [Performance](#/${p.id}/performance)`] : []),
        ...(api!.browser
          ? [`**Works in:** Chrome / Edge ${api!.browser.floor.chrome}+, Firefox ${api!.browser.floor.firefox}+, Safari ${api!.browser.floor.safari}+ · [Browser support](#/${p.id}/browser-support)`]
          : []),
      ]),
    main && imports(p.slug, api!),
  );

  return blocks(
    head,
    section(
      "Example",
      DOCUMENTED.has(p.library)
        ? `The live example is in the gallery at ${code(`#/${p.id}`)}, at 320 px, 480 px or full width${guide?.anatomy.length ? ", with “Show anatomy” to number its parts" : ""}.`
        : `The live example is in the gallery at ${code(`#/${p.id}`)}, in both looks; Replay restarts its animations.`,
    ),
    s.Overview &&
      section(
        "Overview",
        s.Overview,
        s["When to use"] && sub("When to use", s["When to use"]),
        s["When not to use"] && sub("When not to use", linkSlugs(s["When not to use"])),
      ),
    guide &&
      guide.anatomy.length > 0 &&
      section(
        "Anatomy",
        DOCUMENTED.has(p.library) && hint("Turn on “Show anatomy” on the example to see each part numbered on the live component."),
        guide.anatomy.map((a) => `${a.n}. **${a.label}** ${code(a.selector)}${a.text ? ` – ${a.text}` : ""}`).join("\n"),
      ),
    s.Looks && section("Looks", s.Looks),
    s.Theme && section("Theme", s.Theme),
    main && section("Usage", usage(p.slug, main, guide, api!)),
    api && section("API", ...api.elements.map((el) => elementApi(el, api.elements.length > 1, p.library !== "components" && p.library !== "blocks")), api.functions?.length ? functionsApi(api) : null),
    main && api && section("Frameworks", frameworks(p.slug, api)),
    section("Accessibility", accessibility(p, guide)),
    api?.browser && section("Browser support", browserSupport(api, p.library === "components" ? "the component" : "the piece")),
    api && section("Performance", performance(p, api)),
    s.Content && section("Content", s.Content),
    (s.Do || s["Don't"]) && section("Do and don't", s.Do && sub("Do", s.Do), s["Don't"] && sub("Don't", s["Don't"])),
    guide &&
      guide.related.length > 0 &&
      section(
        "Related",
        list(
          guide.related.flatMap((slug) => {
            const r = PIECES.find((x) => x.slug === slug);
            return r ? [`[${r.name}](#/${r.id}) – ${esc(r.description)}`] : [];
          }),
        ),
      ),
    api && api.changelog.length > 0 && section("Changelog", list(api.changelog)),
  );
}

function imports(slug: string, api: ApiPage) {
  const wrappers = api.react.filter((r) => r.exported).map((r) => r.component);
  const mod = code(`import "@adamstavely/trenchcoat/${slug}";`);
  return table(
    ["", "Install and import"],
    [
      ["Install", `${code("npm install @adamstavely/trenchcoat")} [from GitHub Packages](#/foundations/getting-started), then ${code('import "@adamstavely/trenchcoat/tokens.css"')} once`],
      ["HTML", mod],
      ["React / Next.js", wrappers.length ? `${code(`import { ${wrappers.join(", ")} } from "@adamstavely/trenchcoat/react";`)} · in a client component in Next.js` : `${mod} · no wrapper: use the tag`],
      ["Vue / Nuxt", `${mod} · tags starting with tc- are custom elements`],
      ["Angular", `${code(`import { ${api.elements.map(angularName).join(", ")} } from "@adamstavely/trenchcoat/angular/${slug}";`)} · standalone directives, no schema`],
      ["Svelte", mod],
    ],
  );
}

const LANG = Object.fromEntries(FRAMEWORKS.map(([f, , , lang]) => [f, lang])) as Record<Framework, string>;
const LONG = Object.fromEntries(FRAMEWORKS.map(([f, , long]) => [f, long])) as Record<Framework, string>;

function usage(slug: string, el: ApiElement, guide: Guidance | undefined, api: ApiPage) {
  const snip = snippets(slug, el, guide?.examples ?? {}, api.react.find((r) => r.exported), api.frameworks?.[0]);
  return blocks(
    ...FRAMEWORKS.map(([fw]) =>
      sub(
        LONG[fw],
        fence(snip[fw], LANG[fw]),
        ((fw === "html" && !guide?.examples.html) || (fw === "react" && !guide?.examples.tsx) || fw === "vue" || fw === "angular" || fw === "svelte") &&
          hint(`Generated from the element's API and compiled in \`examples/${fw}\` by \`npm run check:snippets\`. The Frameworks section below covers events, control, slots, server rendering and types.`),
      ),
    ),
  );
}

function elementApi(el: ApiElement, several: boolean, singleLook: boolean) {
  const opt = (s: string) => (s ? esc(s) : dash);
  return blocks(
    several && `### ${code(`<${el.tag}>`)}`,
    several && el.description && hint(esc(el.description)),
    "#### Properties and attributes",
    table(
      ["Property", "Attribute", "Type", "Default", "Description"],
      el.properties.filter((x) => !(singleLook && x.name === "look")).map((x) => [code(x.name), x.attribute ? code(x.attribute) : dash, code(x.type), x.default ? code(x.default) : dash, opt(x.description)]),
    ),
    el.events.length > 0 && blocks("#### Events", table(["Event", "Detail", "Cancelable", "Description"], el.events.map((e) => [code(e.name), e.detail ? code(e.detail) : dash, e.cancelable ? "Yes" : "No", opt(e.description)]))),
    el.slots.length > 0 && blocks("#### Slots", table(["Slot", "Description"], el.slots.map((x) => [code(x.name), opt(x.description)]))),
    el.methods.length > 0 && blocks("#### Methods", table(["Method", "Returns", "Description"], el.methods.map((m) => [code(`${m.name}(${m.params})`), code(m.returns), opt(m.description)]))),
    el.cssProperties.length > 0 &&
      blocks(
        "#### Component tokens",
        hint("Custom properties on the element – set them on the element or an ancestor to adjust it."),
        table(["Custom property", "Value", "Look"], el.cssProperties.map((c) => [code(c.name), code(c.value), c.fallback ? "not set – this fallback applies" : c.looks.join(", ")])),
      ),
    el.tokens.length > 0 && blocks(`#### Design tokens it reads (${el.tokens.length})`, el.tokens.map(code).join(", ")),
  );
}

function functionsApi(api: ApiPage) {
  return blocks("#### Functions", hint("Exported from the module next to the element."), table(["Function", "Description"], api.functions!.map((f) => [code(f.signature), esc(f.description)])));
}

// ── Frameworks: every tab, written out ───────────────────────────────────────────────────────────────────────────
const SETUP: Record<Framework, string> = {
  html: "Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.",
  react: 'The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.',
  vue: "Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.",
  angular:
    "Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.",
  svelte: "Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.",
};
const SSR: Record<Framework, string> = {
  html: "Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.",
  react: 'No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn\'t shift (`examples/next`).',
  vue: "In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).",
  angular:
    "Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)",
  svelte: "In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)",
};
const TWO_WAY_NOTE: Record<Framework, string> = {
  html: "Listen for the change and keep your copy; set the property when your copy changes.",
  react: "Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.",
  vue: "`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:",
  angular:
    "With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:",
  svelte: "`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:",
};

function typing(fw: Framework, f: FrameworkFacts, react?: ApiReact) {
  const el = code(`import type { ${f.className} } from "${f.module}";`);
  const first = f.data[0] ?? f.attributes[0]?.name ?? "look";
  switch (fw) {
    case "html":
      return `With TypeScript or \`// @ts-check\`, ${code(`document.querySelector("${f.tag}")`)} returns a ${code(f.className)} (the module adds the tag to \`HTMLElementTagNameMap\`). The class: ${el}`;
    case "react":
      return react?.exported
        ? `Props: ${code(`import type { ${react.component}Props } from "@adamstavely/trenchcoat/react";`)} – or ${code(`ComponentProps<typeof ${react.component}>`)}. The element class, for refs: ${el}`
        : `The element class: ${el}`;
    case "vue":
      return `Add \`import type {} from "@adamstavely/trenchcoat/vue";\` to a \`.d.ts\` file: \`vue-tsc\` then checks the tag's props and \`@tc-…\` events in templates. A property's type: ${code(`${f.className}["${first}"]`)} with ${el}`;
    case "angular":
      return `The directive types the template: ${code(`[${first}]`)} takes ${code(`${f.className}["${first}"]`)}, and \`$event\` is the event's \`CustomEvent<…>\`, so a misspelt input or a wrong type fails the build. For the element itself, \`#ref\` with \`exportAs\` gives the directive and its \`element\`. ${el}`;
    case "svelte":
      return `Add \`import type {} from "@adamstavely/trenchcoat/svelte";\` to a \`.d.ts\` file: \`svelte-check\` then knows the tag's props. Type \`bind:this\` with ${el}`;
  }
}

const perFramework = (fn: (fw: Framework) => string) => list(FRAMEWORKS.map(([fw]) => `**${LONG[fw]}:** ${fn(fw)}`));

function frameworks(slug: string, api: ApiPage) {
  const f = api.frameworks?.[0];
  const react = api.react.find((r) => r.exported);
  if (!f) return `Generate the page's data: ${code(`node scripts/gen-docs.mjs ${slug}`)}.`;
  const controlled = controlledSnippets(slug, f, react);
  const cancelable = f.events.filter((e) => e.cancelable);
  const fws = FRAMEWORKS.map(([fw]) => fw);
  const heads = FRAMEWORKS.map(([, , long]) => long);

  const control = f.controlled.length
    ? blocks(
        `The element changes ${and(f.controlled.map((c) => code(c.property)))} itself unless a listener calls \`preventDefault()\` on ${and(
          f.controlled.map((c) => code(c.event)),
          "or",
        )} – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.`,
        ...fws.map((fw) =>
          blocks(
            `#### ${LONG[fw]}`,
            controlled?.[fw]
              ? fence(controlled[fw]!, LANG[fw])
              : hint("The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref."),
          ),
        ),
      )
    : cancelable.length
      ? `${cancelable.map((e) => code(e.name)).join(", ")} ${cancelable.length > 1 ? "are" : "is"} cancelable: call \`preventDefault()\` to stop what the element would do next.`
      : "Nothing to control: it keeps no value the user changes.";

  const slots = f.slots.length
    ? blocks(
        `Put children inside the tag with a \`slot\` attribute: ${f.slots.map((x) => code(x === "(default)" ? "no slot attribute" : `slot="${x}"`)).join(", ")}. The element renders into itself (no shadow root) and leaves them where you put them.`,
        list(["**React:** pass them as children with the same attribute.", "**Vue / Nuxt:** it's the HTML attribute, not Vue's `<template #name>`."]),
      )
    : `No slots: everything it shows comes from its properties${react?.props.some((x) => x.name === "children") ? " (and, in React, the wrapper's children)" : ""}.`;

  return blocks(
    hint("The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](#/foundations/frameworks)"),
    sub("Set-up", perFramework((fw) => SETUP[fw])),
    sub(
      "Data properties",
      f.data.length
        ? blocks(hint("Lists, objects and functions are properties, not attributes – bind them as properties:"), table(["Property", ...heads], f.data.map((x) => [code(x), ...fws.map((fw) => code(bindProperty(fw, f, x)))])))
        : hint("Everything it takes is a string, number or boolean, so attributes work too."),
      f.attributes.length > 0 &&
        hint(`Also attributes: ${f.attributes.slice(0, 8).map((a) => code(a.attribute)).join(", ")}${f.attributes.length > 8 ? ` and ${f.attributes.length - 8} more` : ""} – see the API table.`),
    ),
    sub(
      "Events",
      f.events.length
        ? table(["Event", "Cancelable", ...heads], f.events.map((e) => [code(e.name), e.cancelable ? "Yes" : "No", ...fws.map((fw) => code(bindEvent(fw, f, e.name, react)))]))
        : hint("No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual."),
      f.events.some((e) => !reactEvent(e.name, react)) && hint("React: events without a prop are listened to on the element through a ref."),
    ),
    sub("Controlled", control),
    f.form &&
      sub(
        "Two-way binding",
        ...fws.map((fw) => {
          const tw = twoWay(fw, f, react);
          return blocks(
            `#### ${LONG[fw]}`,
            `${TWO_WAY_NOTE[fw]}${f.form!.formAssociated && fw !== "react" ? " It takes part in its form: the value is submitted under its name, and reset with the form." : ""}`,
            tw && fence(tw, fw === "angular" ? "html" : LANG[fw]),
          );
        }),
      ),
    sub("Slots and children", slots),
    sub("Server rendering", perFramework((fw) => SSR[fw])),
    sub("TypeScript", perFramework((fw) => typing(fw, f, react))),
    api.react.some((r) => r.exported) &&
      sub(
        "React props",
        hint("The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise."),
        ...api.react
          .filter((r) => r.exported)
          .map((r, _, all) =>
            blocks(
              all.length > 1 && `#### ${r.component}`,
              table(["Prop", "Type", "Description"], r.props.map((x) => [code(x.name), code(x.type), x.description ? esc(x.description) : dash])),
              r.hides.length > 0 && hint(`Renamed or hidden on the wrapper: ${r.hides.map(code).join(", ")}`),
            ),
          ),
      ),
  );
}

function accessibility(p: Piece, guide: Guidance | undefined) {
  const pattern = guide && guide.pattern !== "none" ? PATTERNS[guide.pattern] : undefined;
  const components = p.library === "components";
  return blocks(
    pattern && `Follows the WAI-ARIA [${pattern.name} pattern](${pattern.url}).`,
    guide?.sections.Keyboard && sub("Keyboard", guide.sections.Keyboard),
    guide?.sections["Screen readers"] && sub("Screen readers", guide.sections["Screen readers"]),
    sub(
      components ? "Every component" : "Every piece",
      list([
        `Passes axe (WCAG 2.2 A and AA)${components ? " in both looks," : ""} light and dark, in Chromium, Firefox and WebKit.`,
        "Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.",
        "Reduced motion: animations stop or shorten under `prefers-reduced-motion`.",
        "Not yet tested with a screen reader by a person (VoiceOver, NVDA).",
      ]),
    ),
  );
}

// ── Browser support ──────────────────────────────────────────────────────────────────────────────────────────────
const BROWSERS: [Browser[], string][] = [
  [["chrome", "edge"], "Chrome / Edge"],
  [["firefox"], "Firefox"],
  [["safari"], "Safari (macOS)"],
  [["safari_ios"], "Safari (iOS, iPadOS)"],
];
const version = (v: string | null) => (v === null ? "No" : v === "1" ? "Any" : v);
const both = (v: Record<Browser, string | null>) => (v.chrome === v.edge ? version(v.chrome) : `${version(v.chrome)} (Edge ${version(v.edge)})`);

function browserSupport(api: ApiPage, singular: string) {
  const b = api.browser!;
  const name = (id: string) => b.features.find((x) => x.id === id)?.name ?? id;
  const e = FLOOR?.engines;
  const rows = (xs: BrowserFeature[]) =>
    xs.map((x) => [
      esc(`${x.name}${x.note ? ` (${x.note})` : ""}`),
      both(x.versions),
      version(x.versions.firefox),
      version(x.versions.safari),
      version(x.versions.safari_ios),
      x.via.join(", "),
      esc((x.progressive ? x.without : x.why) ?? dash),
    ]);
  const progressive = b.features.filter((x) => x.progressive);
  return blocks(
    table(
      ["Browser", "Works fully from", "Set by"],
      BROWSERS.map(([keys, label]) => [label, `**${keys.length > 1 ? both(b.floor) : version(b.floor[keys[0]])}**`, (b.setBy[keys[0]] ?? []).map(name).join(", ") || dash]),
    ),
    hint(
      `Tested in ${e ? `Chromium ${e.chromium.split(".")[0]}, Firefox ${e.firefox.split(".")[0]} and WebKit ${e.webkit}` : "Chromium, Firefox and WebKit"} – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright${e ? ` ${e.playwright}` : ""}). The versions come from the platform features ${singular} uses, from MDN's browser-compat-data; [how they're worked out](#/foundations/browser-support).`,
    ),
    sub("Features it needs", table(["Feature", "Chrome / Edge", "Firefox", "Safari", "iOS", "Used in", "Why"], rows(b.features.filter((x) => !x.progressive)))),
    progressive.length > 0 &&
      sub("Progressive", hint("Used where the browser has them; without them it still works, with the difference described."), table(["Feature", "Chrome / Edge", "Firefox", "Safari", "iOS", "Used in", "Without it"], rows(progressive))),
  );
}

// ── Performance ──────────────────────────────────────────────────────────────────────────────────────────────────
const KIND: Record<string, string> = { lit: "the library every element is built on, the parts it uses", internal: "Shared Trenchcoat code", element: "Element it renders", other: "Dependency" };

function scaling(r: NonNullable<PerfEntry["render"]>, windowed: boolean) {
  const s = r.scale;
  if (!s?.points.length) return null;
  const last = s.points[s.points.length - 1];
  if (windowed) return `Windowed: ${count(last.items)} items of ${s.property} render ${count(last.nodes)} nodes in ${ms(last.first)} – only the rows near the viewport are in the page.`;
  if (s.points.every((x) => x.nodes === r.nodes)) return `What it renders doesn't grow with ${s.property} (tested to ${count(last.items)} items).`;
  if (last.first <= 50) return `${count(last.items)} items of ${s.property}: ${ms(last.first)}, ${count(last.nodes)} nodes. It renders every item – past a few thousand, page through them or use a windowed list.`;
  const per = last.first / last.items;
  const limit = Math.max(10, Math.round(50 / per / 10) * 10);
  return `${count(last.items)} items of ${s.property}: ${ms(last.first)}. It renders every item, so a first render passes 50 ms (a long task) at about ${count(limit)} items – page or filter longer lists.`;
}

function performance(p: Piece, api: ApiPage) {
  const entry = PERF?.pieces[p.slug];
  const rt = api.runtime;
  if (!entry)
    return blocks(
      hint(`Not measured yet – \`npm run measure:perf -- ${p.slug}\` measures it (or \`-- --missing\` for every element not measured yet). Size without Lit: ${api.size ? `${kb(api.size.gzip)} gzip, ${kb(api.size.min)} min` : dash}.`),
      rt && runtimeNotes(rt, null),
    );
  const b = entry.bundle;
  const r = entry.render;
  const budgetKeys = Object.keys(BUDGETS).filter((k) => k.startsWith(`${p.id}:`));
  const shared = (x: { name: string; kind: string }) => (x.kind === "element" ? `[${x.name}](#/${x.name})` : x.name === "Lit" ? "Lit" : code(x.name));
  return blocks(
    hint(`Measured ${entry.measuredAt} in headless ${PERF!.environment.browser} on ${PERF!.environment.cpu || PERF!.environment.os} by \`npm run measure:perf\`. [What the numbers mean](#/foundations/performance)`),
    sub(
      "Bundle",
      table(
        ["Part", "Minified", "Gzip"],
        [
          [`**This ${p.library === "components" ? "component" : "piece"} alone**`, kb(b.own.min), kb(b.own.gzip)],
          ...b.shared.map((x) => [`${shared(x)} · ${KIND[x.kind]}`, kb(x.min), dash]),
          ["**Added to a page that already has Lit**", `**${kb(b.withoutLit.min)}**`, `**${kb(b.withoutLit.gzip)}**`],
          ["With Lit – the first component on a page", kb(b.withLit.min), kb(b.withLit.gzip)],
        ],
      ),
      hint(
        "Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.",
      ),
    ),
    sub(
      "Rendering",
      !r || r.error
        ? hint(`The render measurement failed: ${r?.error ?? "no result"}.`)
        : blocks(
            table(
              ["Measure", "Time", "Details"],
              [
                ["First render", `**${ms(r.first)}**`, `${r.source === "demo" ? "the gallery demo's data" : "default properties"}, ${count(r.nodes)} DOM nodes – to layout, median of ${r.runs}`],
                ["Typical update", `**${ms(r.update)}**`, r.updateKind],
                ["First on the page", ms(r.cold), "default properties; includes adding its CSS to the document"],
                ...(r.scale?.points ?? []).map((pt) => [`${count(pt.items)} items`, ms(pt.first), `${r.scale!.property}: first render, ${count(pt.nodes)} nodes; update ${ms(pt.update)}`]),
              ],
            ),
            scaling(r, !!rt?.windowed),
            hint(
              `Render budget (smoke test, the gallery demo over 5 simulated seconds): ${
                budgetKeys.length ? `${budgetKeys.map((k) => `${BUDGETS[k]} React commits (${k.split(":")[1]})`).join(", ")}, with 30 % headroom.` : "none recorded – the default of 300 applies."
              } It counts re-renders, so it catches a component that renders on every frame.`,
            ),
          ),
    ),
    sub("Runtime", rt && runtimeNotes(rt, r && !r.error ? r.idle : null)),
  );
}

function runtimeNotes(rt: Runtime, idle: NonNullable<PerfEntry["render"]>["idle"] | null) {
  // "MutationObserver (internal/base › TcElement)": the name, then where it comes from
  const names = (xs: string[]) =>
    xs.map((x) => {
      const m = x.match(/^(.*?) (\(.*\))$/);
      return m ? `${code(m[1])} ${m[2].replace("›", "–")}` : code(x);
    }).join(", ");
  const rate = (v: { frames: number; timers: number }) =>
    v.frames || v.timers ? `${v.frames ? `${Math.round(v.frames)} frames/s` : ""}${v.frames && v.timers ? ", " : ""}${v.timers ? `${Math.round(v.timers)} timer callbacks/s` : ""}` : "nothing";
  const items: string[] = [];
  if (idle) items.push(`At rest with the demo's data: **${rate(idle.visible)}** on screen, **${rate(idle.away)}** scrolled away, **${rate(idle.reducedMotion)}** under reduced motion (measured).`);
  items.push(rt.frames.length ? `Animation frames: ${names(rt.frames)}.` : "No animation-frame loop.");
  items.push(rt.timers.length ? `Timers: ${names(rt.timers)}.` : "No timers.");
  if (rt.animations) items.push(`${rt.animations} infinite CSS animation${rt.animations > 1 ? "s" : ""}.`);
  const pauses = [rt.pauses.offscreen.length && "off screen", rt.pauses.hidden.length && "in a hidden tab", rt.pauses.reducedMotion.length && "under reduced motion"].filter((x): x is string => !!x);
  if (pauses.length) items.push(`Stops or pauses ${and(pauses)}.`);
  items.push(rt.observers.length ? `Observers: ${names(rt.observers)}.` : "No observers.");
  if (rt.listeners.length) items.push(`Listens on the page: ${names(rt.listeners)}.`);
  items.push(rt.clock.length ? `Reads the clock: ${names(rt.clock)}.` : "Doesn't read the clock.");
  return blocks(list(items), hint("Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`."));
}

// ── Foundations ──────────────────────────────────────────────────────────────────────────────────────────────────
const GENERATED: Record<string, () => string> = { floor: floor, summary: perfSummary, spots: spots };

function foundationPage(id: string, title: string) {
  if (id === "tokens") return tokens();
  // The changelog's own links are relative to the package root, two folders up from docs/foundations/
  const source = id === "changelog" ? changelogSource.replace(/\]\((?![a-z]+:|#|\.\.\/)([^)\s]+)\)/g, "](../../$1)") : PROSE[`./foundations/${id}.md`];
  if (!source) return `# ${title}`;
  const parts = source.split(/<!-- (\w+) -->/).map((part, i) => (i % 2 ? (GENERATED[part]?.() ?? "") : part.trim()));
  return blocks(...parts);
}

const fv = (x: string | null) => (x === null ? "No" : x);

function floor() {
  if (!FLOOR) return "Run node scripts/gen-docs.mjs to work out the floor.";
  const f = FLOOR;
  const name = (id: string) => f.features.find((x) => x.id === id)?.name ?? id;
  const row = (b: Browser, label: string) => [label, `**${fv(f.floor[b])}**`, f.setBy[b].features.map(name).join(", "), `${f.setBy[b].elements} components`];
  return blocks(
    table(["Browser", "Works fully from", "Set by", "At that version"], [row("chrome", "Chrome"), row("edge", "Edge"), row("firefox", "Firefox"), row("safari", "Safari (macOS)"), row("safari_ios", "Safari (iOS, iPadOS)")]),
    hint(`Tested in Chromium ${f.engines.chromium.split(".")[0]}, Firefox ${f.engines.firefox.split(".")[0]} and WebKit ${f.engines.webkit} (Playwright ${f.engines.playwright}).`),
    sub(
      "Every feature in use",
      table(
        ["Feature", "Chrome / Edge", "Firefox", "Safari", "iOS", "Components", "Kind"],
        f.features.map((x) => [x.name, fv(x.versions.chrome), fv(x.versions.firefox), fv(x.versions.safari), fv(x.versions.safari_ios), x.elements, x.progressive ? `Progressive – ${x.without}` : "Needed"]),
      ),
    ),
  );
}

function perfSummary() {
  if (!PERF) return "Nothing measured yet – run npm run measure:perf.";
  const entries = Object.entries(PERF.pieces);
  const dates = entries.map(([, x]) => x.measuredAt).sort();
  const heaviest = [...entries].sort(([, a], [, b]) => b.bundle.withoutLit.gzip - a.bundle.withoutLit.gzip).slice(0, 8);
  const slowest = entries.filter(([, x]) => x.render && !x.render.error).sort(([, a], [, b]) => b.render!.first - a.render!.first).slice(0, 8);
  const link = (slug: string) => `[${slug}](#/${slug})`;
  return blocks(
    hint(
      `${entries.length} components measured${dates.length ? `, ${dates[0] === dates[dates.length - 1] ? `on ${dates[0]}` : `between ${dates[0]} and ${dates[dates.length - 1]}`}` : ""}, in headless ${PERF.environment.browser} on ${PERF.environment.cpu || PERF.environment.os}.`,
    ),
    sub("Largest, on a page that has Lit", table(["Component", "Gzip", "Minified", "Own code (gzip)"], heaviest.map(([slug, x]) => [link(slug), kb(x.bundle.withoutLit.gzip), kb(x.bundle.withoutLit.min), kb(x.bundle.own.gzip)]))),
    sub("Slowest first render", table(["Component", "First render", "Update", "DOM nodes"], slowest.map(([slug, x]) => [link(slug), `${x.render!.first} ms`, `${x.render!.update} ms`, x.render!.nodes]))),
  );
}

const SPOT_FOLDERS: [string, string][] = [
  ["foundations", "Foundations and components"],
  ["guidelines", "Accessibility and content guidelines"],
  ["patterns", "Interaction patterns"],
  ["principles", "Design principles"],
  ["laws", "Laws of UX"],
  ["research", "Research and human-centred design"],
  ["ai", "AI and agents"],
  ["tools", "Tools and generators"],
  ["admin", "Admin and governance"],
  ["site", "Site and guides"],
  ["references", "References"],
];

function spots() {
  const all = Object.entries(SPOT_FILES)
    .map(([path, svg]) => {
      const [folder, file] = path.split("/").slice(-2);
      return { folder, file, name: /<title>([^<]*)<\/title>/.exec(svg)?.[1] ?? file };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return blocks(
    `${all.length} illustrations`,
    ...SPOT_FOLDERS.map(([folder, title]) => {
      const inFolder = all.filter((s) => s.folder === folder);
      return inFolder.length ? sub(`${title} (${inFolder.length})`, list(inFolder.map((s) => `${s.name} – ${code(`${folder}/${s.file}`)}`))) : null;
    }),
  );
}

type Token = { name: string; value: string; group: string };

/** The tokens of one top-level block of tokens.css, with the comment above each run as its group – as Foundations.tsx reads them */
function tokenBlock(css: string, start: string): Token[] {
  const at = css.indexOf(start);
  if (at < 0) return [];
  const open = css.indexOf("{", at);
  const close = css.indexOf("\n}", open);
  const out: Token[] = [];
  let group = "General";
  for (const line of css.slice(open + 1, close).split("\n")) {
    const comment = line.match(/^\s*\/\*\s*(.+?)\s*(?:–.*)?\*\/\s*$/);
    if (comment) group = comment[1].replace(/\s*\(.*$/, "");
    const decl = line.match(/^\s*(--tc-[\w-]+)\s*:\s*(.+?);\s*(?:\/\*.*)?$/);
    if (decl) out.push({ name: decl[1], value: decl[2], group });
  }
  return out;
}

function tokens() {
  const primitives = tokenBlock(tokensCss, ":where(:root) {");
  const standard = tokenBlock(tokensCss, ':where(:root, [data-tc-look="standard"]');
  const clean = new Map(tokenBlock(tokensCss, ':where([data-tc-look="clean"]').map((t) => [t.name, t.value]));
  const grouped = (ts: Token[], row: (t: Token) => string[], head: string[]) =>
    [...new Set(ts.map((t) => t.group))].map((g) => sub(g, table(head, ts.filter((t) => t.group === g).map(row))));
  return blocks(
    "**Foundations**",
    "# Tokens",
    "Every value the components read. Colours are `light-dark()` pairs, so the browser resolves them where they're used – the site shows each one live in both looks and both themes. Override any of them with a plain rule: `:root { --tc-accent: … }`.",
    "For design tools, the same tokens ship in the Design Tokens Community Group format (DTCG 2025.10), in `@adamstavely/trenchcoat/tokens/dtcg/`:",
    list([
      "`primitives.json` holds the primitives.",
      "One file per look and theme holds the semantic and pattern tokens, as aliases where the CSS points at another token – a shadow's or border's colour and width included: `standard-light.json`, `standard-dark.json`, `clean-light.json` and `clean-dark.json`. Values built with `color-mix()` or `calc()` have no DTCG form, so they're exported resolved. Style Dictionary reads these files as they are.",
      '`tokens-studio/` holds the same sets for Tokens Studio, whose DTCG mode doesn\'t read 2025.10 colour and dimension objects yet: values are strings (`"#2f68ff"`, `"4px"`), types are its own (`boxShadow`, `fontWeights`), a group\'s own token is `DEFAULT`, and `$themes.json` pairs each mode with the primitives.',
      "A few tokens have no DTCG type (em letter-spacing, `uppercase`, a padding shorthand, a shadow of `none`). They're listed with their CSS under `$extensions` in each file.",
      "CI checks every exported token against what a browser computes from `tokens.css`, in each look and theme.",
    ]),
    section("Primitives", hint("Raw values – look- and theme-independent. Components don't use the colour primitives directly."), ...grouped(primitives, (t) => [code(t.name), code(t.value)], ["Token", "Value"])),
    section(
      "Semantic and pattern tokens",
      hint("What components use: text, surfaces, borders, status, and one recipe per UI pattern (controls, menus, cards, trays…). Valued per look; every colour is a light / dark pair."),
      ...grouped(standard, (t) => [code(t.name), code(t.value), code(clean.get(t.name) ?? t.value)], ["Token", "Standard", "Clean"]),
    ),
  );
}
