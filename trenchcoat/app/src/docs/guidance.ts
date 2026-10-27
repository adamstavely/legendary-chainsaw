// The hand-written half of a docs page: app/src/docs/<slug>.md (remediation Part 4.3). Format:
//
//   ---
//   pattern: combobox                 the WAI-ARIA pattern (a key of PATTERNS), or none
//   status: stable                    stable · new · react-twin (a frozen React version still exists)
//   related: command-menu, filter-menu
//   ---
//   ## Overview · ## When to use · ## When not to use · ## Anatomy · ## Looks (or ## Theme, for single-look pieces) ·
//   ## Keyboard · ## Screen readers ·
//   ## Content · ## Do · ## Don't · ## Example
//
// Anatomy items name a part and the selector that finds it in the demo, so the page can number it on the live stage:
//   1. **Field** `.ui-cbx__field` – the input and the picked chips
// The Example section holds one ```html block and one ```tsx block (the tsx is type-checked by check:docs).

const raw = import.meta.glob<string>("./*.md", { query: "?raw", import: "default", eager: true });

export type AnatomyPart = { n: number; label: string; selector: string; text: string };
export type Guidance = {
  pattern: string;
  status: "stable" | "new" | "react-twin";
  related: string[];
  /** Markdown per section, keyed by heading */
  sections: Record<string, string>;
  anatomy: AnatomyPart[];
  examples: { html?: string; tsx?: string };
  /** Plain text of the whole file, for search */
  text: string;
};

export const SECTION_ORDER = ["Overview", "When to use", "When not to use", "Anatomy", "Looks", "Keyboard", "Screen readers", "Content", "Do", "Don't", "Example"] as const;

export function parseGuidance(source: string): Guidance {
  const fm = source.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta: Record<string, string> = {};
  for (const line of (fm?.[1] ?? "").split("\n")) {
    const m = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  const body = fm ? source.slice(fm[0].length) : source;
  const sections: Record<string, string> = {};
  for (const part of body.split(/^## /m).slice(1)) {
    const nl = part.indexOf("\n");
    sections[part.slice(0, nl).trim()] = part.slice(nl + 1).trim();
  }
  const anatomy = [...(sections.Anatomy ?? "").matchAll(/^(\d+)\.\s+\*\*(.+?)\*\*\s+`([^`]+)`\s*(?:[–-]\s*(.*))?$/gm)].map((m) => ({
    n: Number(m[1]),
    label: m[2],
    selector: m[3],
    text: m[4] ?? "",
  }));
  const example = sections.Example ?? "";
  const block = (lang: string) => example.match(new RegExp("```" + lang + "\\n([\\s\\S]*?)```"))?.[1]?.trimEnd();
  return {
    pattern: meta.pattern || "none",
    status: (["stable", "new", "react-twin"].includes(meta.status) ? meta.status : "stable") as Guidance["status"],
    related: (meta.related ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    sections,
    anatomy,
    examples: { html: block("html"), tsx: block("tsx") },
    text: body.replace(/```[\s\S]*?```/g, " ").replace(/[#*`|>_-]/g, " ").replace(/\s+/g, " ").toLowerCase(),
  };
}

export const GUIDANCE: Record<string, Guidance> = Object.fromEntries(
  Object.entries(raw).map(([path, source]) => [path.match(/\.\/(.+)\.md$/)![1], parseGuidance(source)]),
);

/** The WAI-ARIA Authoring Practices pattern each key names */
export const PATTERNS: Record<string, { name: string; url: string }> = {
  accordion: { name: "Accordion", url: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/" },
  button: { name: "Button", url: "https://www.w3.org/WAI/ARIA/apg/patterns/button/" },
  checkbox: { name: "Checkbox", url: "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/" },
  combobox: { name: "Combobox", url: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/" },
  dialog: { name: "Dialog (modal)", url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" },
  disclosure: { name: "Disclosure", url: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/" },
  feed: { name: "Feed", url: "https://www.w3.org/WAI/ARIA/apg/patterns/feed/" },
  grid: { name: "Grid", url: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/" },
  landmark: { name: "Landmark regions", url: "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/" },
  listbox: { name: "Listbox", url: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/" },
  menu: { name: "Menu button", url: "https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/" },
  meter: { name: "Meter", url: "https://www.w3.org/WAI/ARIA/apg/patterns/meter/" },
  radio: { name: "Radio group", url: "https://www.w3.org/WAI/ARIA/apg/patterns/radio/" },
  slider: { name: "Slider", url: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/" },
  switch: { name: "Switch", url: "https://www.w3.org/WAI/ARIA/apg/patterns/switch/" },
  table: { name: "Table", url: "https://www.w3.org/WAI/ARIA/apg/patterns/table/" },
  tabs: { name: "Tabs", url: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/" },
  toolbar: { name: "Toolbar", url: "https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/" },
  tree: { name: "Tree view", url: "https://www.w3.org/WAI/ARIA/apg/patterns/treeview/" },
};
