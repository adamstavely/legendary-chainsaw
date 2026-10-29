import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";
import { copyText } from "./internal/util";

/*
 * <tc-bibliography> – a reading list, formatted. Each reference is set in the chosen citation style – APA, MLA,
 * Chicago, Harvard or IEEE – with a hanging indent (IEEE numbered), its DOI or link live, its tags as chips and a
 * Copy button. A toolbar picks the style and the order (author, year, title), searches, copies the selected
 * references and exports them – or all of them, when none are ticked – as BibTeX, RIS or plain text.
 *   · the formatting covers what reading lists mostly hold: journal articles, books, chapters, reports, web pages and
 *     theses, with each style's rules for listing authors ("&", "and", et al.); not editions or translators
 *   · Export fires a cancelable tc-export ({ format, text, ids }) – prevent it to save the file your own way; otherwise
 *     the file downloads. Copy fires a cancelable tc-copy ({ text, ids })
 *   · also exported, for a page or a server: formatReference(ref, style, n?) (plain text),
 *     formatReferenceTemplate(ref, style, n?) (italics as <i>), toBibTeX(refs), toRIS(refs)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-bibliography citation-style="apa" .references=${refs}></tc-bibliography>
 */

export type ReferenceType =
  | "article"
  | "book"
  | "chapter"
  | "report"
  | "web"
  | "thesis";
export type ReferenceAuthor = { family: string; given?: string };
export type Reference = {
  id: string;
  type: ReferenceType;
  authors: ReferenceAuthor[];
  title: string;
  /** The journal, the book a chapter is in, or the website */
  container?: string;
  year?: number | string;
  volume?: string | number;
  issue?: string | number;
  /** "12–34" or "12-34" */
  pages?: string;
  /** The publisher, the institution for a report, the university for a thesis */
  publisher?: string;
  doi?: string;
  url?: string;
  /** When a web page was read, ISO date */
  accessed?: string;
  tags?: string[];
};
export type CitationStyle = "apa" | "mla" | "chicago" | "harvard" | "ieee";
export type BibliographySort = "author" | "year" | "title";
export type BibliographyExportFormat = "bibtex" | "ris" | "text";

/** Details of the events */
export type BibliographyCitationStyleChange = { citationStyle: CitationStyle };
export type BibliographySelectedChange = { selected: string[] };
export type BibliographySortChange = { sort: BibliographySort };
export type BibliographyCopy = { text: string; ids: string[] };
export type BibliographyExport = {
  format: BibliographyExportFormat;
  text: string;
  ids: string[];
};

export const citationStyleNames: Record<CitationStyle, string> = {
  apa: "APA 7",
  mla: "MLA 9",
  chicago: "Chicago",
  harvard: "Harvard",
  ieee: "IEEE",
};

/* ---------- Formatting ---------- */

/** A run of text, set in italics or not; a link when it's the DOI or URL */
type Seg = { text: string; italic?: boolean; href?: string };

const pageRange = (p: string) => p.replace(/\s*[-–—]+\s*/, "–");
/** "Ana María" → "A. M."; "Jean-Luc" → "J.-L." */
const initials = (given = "") =>
  given
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      w
        .split("-")
        .map((p) => (p ? `${p[0].toUpperCase()}.` : ""))
        .join("-"),
    )
    .join(" ");
const full = (a: ReferenceAuthor) =>
  a.given ? `${a.given} ${a.family}` : a.family;
const inverted = (a: ReferenceAuthor) =>
  a.given ? `${a.family}, ${a.given}` : a.family;
const invertedInitials = (a: ReferenceAuthor) =>
  a.given ? `${a.family}, ${initials(a.given)}` : a.family;
const initialsFirst = (a: ReferenceAuthor) =>
  a.given ? `${initials(a.given)} ${a.family}` : a.family;
const doiUrl = (doi: string) =>
  `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`;
const bareDoi = (doi: string) =>
  doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
/** Ends a piece with a full stop unless it already ends in punctuation */
const stop = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`);

function authorsFor(style: CitationStyle, list: ReferenceAuthor[]): string {
  const n = list.length;
  if (!n) return "";
  switch (style) {
    case "apa": {
      // 1–20 listed, "&" before the last; 21 or more: the first 19, an ellipsis, the last
      const names = list.map(invertedInitials);
      if (n === 1) return names[0];
      if (n === 2) return `${names[0]}, & ${names[1]}`;
      if (n <= 20) return `${names.slice(0, -1).join(", ")}, & ${names[n - 1]}`;
      return `${names.slice(0, 19).join(", ")}, . . . ${names[n - 1]}`;
    }
    case "mla":
      // One: inverted; two: the second in normal order; three or more: the first, et al.
      return n === 1
        ? inverted(list[0])
        : n === 2
          ? `${inverted(list[0])}, and ${full(list[1])}`
          : `${inverted(list[0])}, et al.`;
    case "chicago": {
      // Up to ten listed, the first inverted; more than ten: the first seven, et al.
      if (n === 1) return inverted(list[0]);
      if (n > 10)
        return `${[inverted(list[0]), ...list.slice(1, 7).map(full)].join(", ")}, et al.`;
      const rest = list.slice(1).map(full);
      return n === 2
        ? `${inverted(list[0])}, and ${rest[0]}`
        : `${[inverted(list[0]), ...rest.slice(0, -1)].join(", ")}, and ${rest[rest.length - 1]}`;
    }
    case "harvard": {
      // One to three listed ("and" before the last); four or more: the first, et al.
      const names = list.map(invertedInitials);
      if (n >= 4) return `${names[0]} et al.`;
      return n === 1
        ? names[0]
        : `${names.slice(0, -1).join(", ")} and ${names[n - 1]}`;
    }
    case "ieee": {
      // Up to six listed (", and" before the last of three or more); seven or more: the first, et al.
      const names = list.map(initialsFirst);
      if (n >= 7) return `${names[0]} et al.`;
      if (n === 1) return names[0];
      if (n === 2) return `${names[0]} and ${names[1]}`;
      return `${names.slice(0, -1).join(", ")}, and ${names[n - 1]}`;
    }
  }
}

const accessedWords = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

/** The reference as runs of text in a style; `n` numbers it (IEEE) */
function segments(r: Reference, style: CitationStyle, n?: number): Seg[] {
  const out: Seg[] = [];
  const t = (text: string, italic = false) =>
    text && out.push({ text, italic });
  const link = () => {
    if (r.doi) {
      const u = doiUrl(r.doi);
      if (style === "ieee")
        out.push({ text: `doi: ${bareDoi(r.doi)}`, href: u });
      else if (style === "harvard") {
        t("Available at: ");
        out.push({ text: u, href: u });
      } else out.push({ text: u, href: u });
      return true;
    }
    if (r.url) {
      if (style === "harvard") {
        t("Available at: ");
        out.push({ text: r.url, href: r.url });
      } else if (style === "ieee") {
        t("[Online]. Available: ");
        out.push({ text: r.url, href: r.url });
      } else out.push({ text: r.url, href: r.url });
      return true;
    }
    return false;
  };
  const authors = authorsFor(style, r.authors);
  const year = r.year !== undefined && r.year !== "" ? String(r.year) : "";
  const pages = r.pages ? pageRange(r.pages) : "";
  const vol = r.volume !== undefined ? String(r.volume) : "";
  const iss = r.issue !== undefined ? String(r.issue) : "";
  const italicTitle =
    r.type === "book" ||
    r.type === "report" ||
    r.type === "thesis" ||
    (r.type === "web" &&
      style !== "mla" &&
      style !== "chicago" &&
      style !== "ieee");

  switch (style) {
    case "apa": {
      if (authors) t(`${stop(authors)} `);
      t(`(${year || "n.d."}). `);
      if (r.type === "chapter") {
        t(`${stop(r.title)} `);
        if (r.container) {
          t("In ");
          t(r.container, true);
          t(pages ? ` (pp. ${pages}). ` : ". ");
        }
        if (r.publisher) t(`${stop(r.publisher)} `);
      } else if (r.type === "article") {
        t(`${stop(r.title)} `);
        if (r.container) {
          t(r.container, true);
          if (vol) {
            t(", ");
            t(vol, true);
          }
          if (iss) t(`(${iss})`);
          if (pages) t(`, ${pages}`);
          t(". ");
        }
      } else {
        t(r.title, italicTitle);
        if (r.type === "thesis")
          t(` [Thesis${r.publisher ? `, ${r.publisher}` : ""}]`);
        t(". ");
        if (r.type === "web" && r.container) t(`${stop(r.container)} `);
        else if (r.type !== "thesis" && r.publisher) t(`${stop(r.publisher)} `);
      }
      link();
      break;
    }
    case "mla": {
      if (authors) t(`${stop(authors)} `);
      const quoted =
        r.type === "article" || r.type === "chapter" || r.type === "web";
      if (quoted) t(`“${stop(r.title)}” `);
      else {
        t(r.title, true);
        t(". ");
      }
      const bits: (Seg[] | string)[] = [];
      if (r.container && quoted)
        bits.push([{ text: r.container, italic: true }]);
      if (vol) bits.push(`vol. ${vol}`);
      if (iss) bits.push(`no. ${iss}`);
      if (r.publisher && r.type !== "article") bits.push(r.publisher);
      if (year) bits.push(year);
      if (pages) bits.push(`pp. ${pages}`);
      bits.forEach((b, i) => {
        if (typeof b === "string") t(b);
        else out.push(...b);
        t(i < bits.length - 1 ? ", " : ". ");
      });
      if (link()) t(".");
      if (r.type === "web" && r.accessed)
        t(` Accessed ${accessedWords(r.accessed)}.`);
      break;
    }
    case "chicago": {
      if (authors) t(`${stop(authors)} `);
      if (r.type === "article") {
        t(`“${stop(r.title)}” `);
        if (r.container) t(r.container, true);
        if (vol) t(` ${vol}`);
        if (iss) t(`, no. ${iss}`);
        if (year) t(` (${year})`);
        t(pages ? `: ${pages}. ` : ". ");
      } else if (r.type === "chapter") {
        t(`“${stop(r.title)}” `);
        if (r.container) {
          t("In ");
          t(r.container, true);
          t(pages ? `, ${pages}. ` : ". ");
        }
        if (r.publisher || year)
          t(`${stop([r.publisher, year].filter(Boolean).join(", "))} `);
      } else if (r.type === "web") {
        t(`“${stop(r.title)}” `);
        if (r.container) t(`${stop(r.container)} `);
        if (r.accessed) t(`Accessed ${accessedWords(r.accessed)}. `);
      } else {
        t(r.title, true);
        t(". ");
        if (r.type === "thesis") t("Thesis, ");
        if (r.publisher || year)
          t(`${stop([r.publisher, year].filter(Boolean).join(", "))} `);
      }
      if (link()) t(".");
      break;
    }
    case "harvard": {
      if (authors) t(`${authors} `);
      t(`(${year || "no date"}) `);
      if (r.type === "article") {
        t(`‘${r.title}’, `);
        if (r.container) t(r.container, true);
        if (vol) t(`, ${vol}`);
        if (iss) t(`(${iss})`);
        if (pages) t(`, pp. ${pages}`);
        t(". ");
      } else if (r.type === "chapter") {
        t(`‘${r.title}’, in `);
        if (r.container) t(r.container, true);
        if (r.publisher) t(`. ${r.publisher}`);
        if (pages) t(`, pp. ${pages}`);
        t(". ");
      } else {
        t(r.title, true);
        if (r.type === "thesis") t(". Thesis");
        if (r.type === "web" && r.container) t(`, ${r.container}`);
        else if (r.publisher) t(`. ${r.publisher}`);
        t(". ");
      }
      if (link()) {
        if (r.accessed) t(` (Accessed: ${accessedWords(r.accessed)})`);
        t(".");
      }
      break;
    }
    case "ieee": {
      if (n !== undefined) t(`[${n}] `);
      if (authors) t(`${authors}, `);
      if (r.type === "article" || r.type === "web") {
        // “Title,” Journal, vol. 3, no. 2, pp. 1–9, 2020, doi: 10.x.  – or, online only: … 2020. [Online]. Available: url
        t(`“${r.title},” `);
        const items: Seg[][] = [];
        if (r.container) items.push([{ text: r.container, italic: true }]);
        if (vol) items.push([{ text: `vol. ${vol}` }]);
        if (iss) items.push([{ text: `no. ${iss}` }]);
        if (pages) items.push([{ text: `pp. ${pages}` }]);
        if (year) items.push([{ text: year }]);
        if (r.type === "web" && r.accessed)
          items.push([{ text: `accessed ${accessedWords(r.accessed)}` }]);
        if (r.doi)
          items.push([{ text: `doi: ${bareDoi(r.doi)}`, href: doiUrl(r.doi) }]);
        items.forEach((it, i) => {
          if (i) t(", ");
          out.push(...it);
        });
        t(".");
        if (!r.doi && r.url) {
          t(" [Online]. Available: ");
          out.push({ text: r.url, href: r.url });
        }
      } else if (r.type === "chapter") {
        t(`“${r.title},” in `);
        if (r.container) t(r.container, true);
        if (r.publisher) t(`. ${r.publisher}`);
        if (year) t(`, ${year}`);
        if (pages) t(`, pp. ${pages}`);
        t(".");
        if (r.doi || r.url) {
          t(" ");
          link();
        }
      } else {
        t(r.title, true);
        if (r.type === "thesis") t(", Thesis");
        t(". ");
        t(stop([r.publisher, year].filter(Boolean).join(", ")));
        if (r.doi || r.url) {
          t(" ");
          link();
        }
      }
      break;
    }
  }
  // Tidy: no doubled spaces, nothing trailing
  const tidy = out.filter((s) => s.text);
  if (tidy.length)
    tidy[tidy.length - 1] = {
      ...tidy[tidy.length - 1],
      text: tidy[tidy.length - 1].text.replace(/\s+$/, ""),
    };
  return tidy.map((s) => ({ ...s, text: s.text.replace(/ {2,}/g, " ") }));
}

/** A reference as plain text in a citation style; `n` numbers it for IEEE */
export function formatReference(
  ref: Reference,
  style: CitationStyle,
  n?: number,
): string {
  return segments(ref, style, n)
    .map((s) => s.text)
    .join("");
}

/** A reference in a citation style as a template: titles in italics where the style sets them so, DOI / URL as links */
export function formatReferenceTemplate(
  ref: Reference,
  style: CitationStyle,
  n?: number,
): TemplateResult {
  return html`${segments(ref, style, n).map((s) => {
    const href = s.href ? safeUrl(s.href) : undefined;
    if (href)
      return html`<a
        class="ui-bib__link"
        href=${href}
        target="_blank"
        rel="noopener noreferrer"
        >${s.text}</a
      >`;
    return s.italic ? html`<i>${s.text}</i>` : s.text;
  })}`;
}

const BIBTEX_TYPE: Record<ReferenceType, string> = {
  article: "article",
  book: "book",
  chapter: "incollection",
  report: "techreport",
  web: "misc",
  thesis: "phdthesis",
};
const RIS_TYPE: Record<ReferenceType, string> = {
  article: "JOUR",
  book: "BOOK",
  chapter: "CHAP",
  report: "RPRT",
  web: "ELEC",
  thesis: "THES",
};

/** A cite key: the first author's family name, the year and the title's first word, plain letters */
function citeKey(r: Reference, used: Set<string>) {
  const plain = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]/g, "");
  const word =
    r.title.split(/\s+/).find((w) => w.length > 3) ??
    r.title.split(/\s+/)[0] ??
    "ref";
  const base =
    `${plain(r.authors[0]?.family ?? "anon").toLowerCase()}${r.year ?? ""}${plain(word).toLowerCase()}` ||
    r.id;
  let key = base;
  for (let i = 0; used.has(key); i++)
    key = `${base}${String.fromCharCode(97 + i)}`;
  used.add(key);
  return key;
}

/** References as BibTeX */
export function toBibTeX(refs: Reference[]): string {
  const used = new Set<string>();
  const esc = (s: string) => s.replace(/([{}])/g, "\\$1");
  return refs
    .map((r) => {
      const f: [string, string | undefined][] = [
        [
          "author",
          r.authors
            .map((a) => (a.given ? `${a.family}, ${a.given}` : a.family))
            .join(" and "),
        ],
        ["title", r.title],
        [
          r.type === "article"
            ? "journal"
            : r.type === "chapter"
              ? "booktitle"
              : r.type === "web"
                ? "howpublished"
                : "",
          r.container,
        ],
        ["year", r.year !== undefined ? String(r.year) : undefined],
        ["volume", r.volume !== undefined ? String(r.volume) : undefined],
        ["number", r.issue !== undefined ? String(r.issue) : undefined],
        ["pages", r.pages ? r.pages.replace(/\s*[-–—]+\s*/, "--") : undefined],
        [
          r.type === "report"
            ? "institution"
            : r.type === "thesis"
              ? "school"
              : "publisher",
          r.publisher,
        ],
        ["doi", r.doi ? bareDoi(r.doi) : undefined],
        ["url", r.url],
        ["urldate", r.accessed],
        ["keywords", r.tags?.join(", ")],
      ];
      const body = f
        .filter(([k, v]) => k && v)
        .map(([k, v]) => `  ${k} = {${esc(v!)}}`)
        .join(",\n");
      return `@${BIBTEX_TYPE[r.type]}{${citeKey(r, used)},\n${body}\n}`;
    })
    .join("\n\n");
}

/** References as RIS */
export function toRIS(refs: Reference[]): string {
  return refs
    .map((r) => {
      const lines: string[] = [`TY  - ${RIS_TYPE[r.type]}`];
      for (const a of r.authors)
        lines.push(`AU  - ${a.given ? `${a.family}, ${a.given}` : a.family}`);
      lines.push(`TI  - ${r.title}`);
      if (r.container)
        lines.push(`${r.type === "article" ? "JO" : "T2"}  - ${r.container}`);
      if (r.year !== undefined) lines.push(`PY  - ${r.year}`);
      if (r.volume !== undefined) lines.push(`VL  - ${r.volume}`);
      if (r.issue !== undefined) lines.push(`IS  - ${r.issue}`);
      if (r.pages) {
        const [sp, ep] = r.pages.split(/\s*[-–—]+\s*/);
        lines.push(`SP  - ${sp}`);
        if (ep) lines.push(`EP  - ${ep}`);
      }
      if (r.publisher) lines.push(`PB  - ${r.publisher}`);
      if (r.doi) lines.push(`DO  - ${bareDoi(r.doi)}`);
      if (r.url) lines.push(`UR  - ${r.url}`);
      if (r.accessed) lines.push(`Y2  - ${r.accessed}`);
      for (const k of r.tags ?? []) lines.push(`KW  - ${k}`);
      lines.push("ER  - ");
      return lines.join("\n");
    })
    .join("\n\n");
}

/* ---------- The element ---------- */

let uidCount = 0;

/* book-marked, copy, check, download, search, chevron-down: Lucide (ISC, lucide.dev) */
const bookIcon = svg`<path d="M10 2v8l3-3 3 3V2"></path><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg
    width=${size}
    height=${size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.9"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${body}
  </svg>`;
const copyIcon = () =>
  lucide(
    14,
    svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`,
  );
const checkIcon = () => lucide(14, svg`<path d="M20 6 9 17l-5-5"></path>`);
const downloadIcon = () =>
  lucide(
    14,
    svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line>`,
  );
const searchIcon = () =>
  lucide(
    14,
    svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`,
  );
const chevron = () =>
  html`<svg class="ui-bib__chevron" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6 9 6 6 6-6"></path>
  </svg>`;
const tick = () =>
  html`<svg class="ui-bib__tick" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6 9 17l-5-5"></path>
  </svg>`;

const FORMATS: [BibliographyExportFormat, string, string][] = [
  ["bibtex", "BibTeX (.bib)", "bib"],
  ["ris", "RIS (.ris)", "ris"],
  ["text", "Plain text (.txt)", "txt"],
];

/**
 * A reading list set in a citation style – APA, MLA, Chicago, Harvard or IEEE – with links, tags, search, sort,
 * Copy for one or the selected, and export as BibTeX, RIS or plain text.
 * @tag tc-bibliography
 * @fires tc-citation-style-change - The citation style changed ({ citationStyle }: BibliographyCitationStyleChange); cancelable – prevented, `citationStyle` stays as it was
 * @fires tc-selected-change - References were ticked or unticked ({ selected }: BibliographySelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-sort-change - The order changed ({ sort }: BibliographySortChange); cancelable – prevented, `sort` stays as it was
 * @fires tc-copy - A reference, or the selected ones, were copied ({ text, ids }: BibliographyCopy); cancelable – prevented, nothing is copied
 * @fires tc-export - Export was chosen ({ format, text, ids }: BibliographyExport); cancelable – prevented, the page saves it its own way; otherwise the file downloads
 */
export class TcBibliography extends TcElement {
  static override ui = "bib";

  /** The heading, and the list's name */
  @property() accessor heading = "Bibliography";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The references, any order */
  @property({ attribute: false }) accessor references: Reference[] = [];
  /** The citation style (not `style`, which every element has for CSS). Changed by the user unless tc-citation-style-change is prevented */
  @property({ attribute: "citation-style" })
  accessor citationStyle: CitationStyle = "apa";
  /** The ticked references' ids. Changed by the user unless tc-selected-change is prevented */
  @property({ attribute: false }) accessor selected: string[] = [];
  /** The order. Changed by the user unless tc-sort-change is prevented */
  @property() accessor sort: BibliographySort = "author";
  /** Shows only references whose authors, title, container, year or tags hold this */
  @property() accessor filter = "";
  /** The name exported files are saved under, before the extension */
  @property() accessor filename = "bibliography";

  /** @internal Whether the export menu is open */
  @state() accessor menuOpen = false;
  /** @internal The menu item with focus */
  @state() accessor menuAt = 0;
  /** @internal What was just copied: a reference's id, or "selected" */
  @state() accessor copied = "";
  /** @internal The polite status line */
  @state() accessor announce = "";

  private uid = `tc-bib-${++uidCount}`;
  private copiedTimer = 0;

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
    document.removeEventListener("pointerdown", this.onOutside, true);
  }

  /* ---------- The model ---------- */

  /** The references shown: filtered, then sorted */
  get shown(): Reference[] {
    const q = this.filter.trim().toLowerCase();
    const hay = (r: Reference) =>
      [
        r.title,
        r.container,
        r.publisher,
        String(r.year ?? ""),
        ...r.authors.map(full),
        ...(r.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
    const list = this.references.filter((r) => !q || hay(r).includes(q));
    const first = (r: Reference) =>
      (r.authors[0]?.family ?? r.title).toLowerCase();
    const yr = (r: Reference) => Number(String(r.year ?? "").slice(0, 4)) || 0;
    return list.sort((a, b) =>
      this.sort === "year"
        ? yr(b) - yr(a) || first(a).localeCompare(first(b))
        : this.sort === "title"
          ? a.title.localeCompare(b.title)
          : first(a).localeCompare(first(b)) || yr(a) - yr(b),
    );
  }

  /** What Copy selected and Export act on: the ticked references shown, or everything shown */
  private get targets() {
    const shown = this.shown;
    const picked = shown.filter((r) => this.selected.includes(r.id));
    return picked.length ? picked : shown;
  }

  private plain(list: Reference[]) {
    return list
      .map((r, i) =>
        formatReference(
          r,
          this.citationStyle,
          this.citationStyle === "ieee"
            ? this.shown.indexOf(r) + 1 || i + 1
            : undefined,
        ),
      )
      .join("\n\n");
  }

  /* ---------- Actions ---------- */

  private setStyle(style: CitationStyle) {
    if (style === this.citationStyle) return;
    if (
      !this.emit<BibliographyCitationStyleChange>(
        "tc-citation-style-change",
        { citationStyle: style },
        { cancelable: true },
      )
    ) {
      this.requestUpdate();
      return;
    }
    this.citationStyle = style;
    this.announce = `Set in ${citationStyleNames[style]}`;
  }
  private setSort(sort: BibliographySort) {
    if (sort === this.sort) return;
    if (
      !this.emit<BibliographySortChange>(
        "tc-sort-change",
        { sort },
        { cancelable: true },
      )
    ) {
      this.requestUpdate();
      return;
    }
    this.sort = sort;
  }
  private setSelected(selected: string[]) {
    if (
      !this.emit<BibliographySelectedChange>(
        "tc-selected-change",
        { selected },
        { cancelable: true },
      )
    ) {
      this.requestUpdate();
      return;
    }
    this.selected = selected;
  }

  private async copyRefs(list: Reference[], key: string) {
    const text = this.plain(list);
    const ids = list.map((r) => r.id);
    if (
      !this.emit<BibliographyCopy>(
        "tc-copy",
        { text, ids },
        { cancelable: true },
      )
    )
      return;
    if (!(await copyText(text))) return;
    this.copied = key;
    this.announce =
      list.length === 1
        ? "Reference copied"
        : `${list.length} references copied`;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = ""), 1600);
  }

  private exportAs(format: BibliographyExportFormat) {
    this.closeMenu(true);
    const list = this.targets;
    const text =
      format === "bibtex"
        ? toBibTeX(list)
        : format === "ris"
          ? toRIS(list)
          : this.plain(list);
    const ids = list.map((r) => r.id);
    if (
      !this.emit<BibliographyExport>(
        "tc-export",
        { format, text, ids },
        { cancelable: true },
      )
    )
      return;
    const ext = FORMATS.find((f) => f[0] === format)![2];
    const url = URL.createObjectURL(
      new Blob([text], {
        type:
          format === "ris"
            ? "application/x-research-info-systems"
            : format === "bibtex"
              ? "application/x-bibtex"
              : "text/plain",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.filename}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.announce = `Exported ${list.length} ${list.length === 1 ? "reference" : "references"}`;
  }

  /* ---------- The export menu ---------- */

  private onOutside = (e: PointerEvent) => {
    if (!this.querySelector(".ui-bib__export")?.contains(e.target as Node))
      this.closeMenu(false);
  };
  private openMenu(at = 0) {
    this.menuOpen = true;
    this.menuAt = at;
    document.addEventListener("pointerdown", this.onOutside, true);
    void this.updateComplete.then(() =>
      this.querySelectorAll<HTMLElement>('[role="menuitem"]')[at]?.focus(),
    );
  }
  private closeMenu(refocus: boolean) {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    document.removeEventListener("pointerdown", this.onOutside, true);
    if (refocus)
      void this.updateComplete.then(() =>
        this.querySelector<HTMLElement>(".ui-bib__export-btn")?.focus(),
      );
  }
  private onMenuKey = (e: KeyboardEvent) => {
    const n = FORMATS.length;
    const to =
      e.key === "ArrowDown"
        ? (this.menuAt + 1) % n
        : e.key === "ArrowUp"
          ? (this.menuAt + n - 1) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : -1;
    if (to >= 0) {
      e.preventDefault();
      this.menuAt = to;
      this.querySelectorAll<HTMLElement>('[role="menuitem"]')[to]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu(true);
    } else if (e.key === "Tab") {
      this.closeMenu(false);
    }
  };

  /* ---------- Rendering ---------- */

  private renderToolbar() {
    const id = this.uid;
    const shown = this.shown;
    const picked = shown.filter((r) => this.selected.includes(r.id)).length;
    const all = shown.length > 0 && picked === shown.length;
    return html`<div class="ui-bib__toolbar">
      <label class="ui-bib__all">
        <span class="ui-bib__box">
          <input
            type="checkbox"
            aria-label="Select all shown"
            .checked=${live(all)}
            .indeterminate=${picked > 0 && !all}
            ?disabled=${!shown.length}
            @change=${() => {
              const ids = shown.map((r) => r.id);
              this.setSelected(
                all
                  ? this.selected.filter((s) => !ids.includes(s))
                  : [...new Set([...this.selected, ...ids])],
              );
            }}
          />${tick()}<span class="ui-bib__dash" aria-hidden="true"></span>
        </span>
      </label>
      <label class="ui-bib__search">
        <span class="ui-bib__search-icon" aria-hidden="true"
          >${searchIcon()}</span
        >
        <span class="tc-sr-only">Search references</span>
        <input
          type="search"
          class="ui-bib__search-input"
          placeholder="Search"
          .value=${live(this.filter)}
          @input=${(e: Event) =>
            (this.filter = (e.target as HTMLInputElement).value)}
        />
      </label>
      <label class="ui-bib__select">
        <span class="tc-sr-only">Citation style</span>
        <select
          class="ui-bib__field"
          @change=${(e: Event) =>
            this.setStyle(
              (e.target as HTMLSelectElement).value as CitationStyle,
            )}
        >
          ${(Object.keys(citationStyleNames) as CitationStyle[]).map(
            (s) =>
              html`<option value=${s} ?selected=${s === this.citationStyle}>
                ${citationStyleNames[s]}
              </option>`,
          )}</select
        >${chevron()}
      </label>
      <label class="ui-bib__select">
        <span class="tc-sr-only">Sort by</span>
        <select
          class="ui-bib__field"
          @change=${(e: Event) =>
            this.setSort(
              (e.target as HTMLSelectElement).value as BibliographySort,
            )}
        >
          ${(["author", "year", "title"] as BibliographySort[]).map(
            (s) =>
              html`<option value=${s} ?selected=${s === this.sort}>
                ${s === "author"
                  ? "By author"
                  : s === "year"
                    ? "Newest first"
                    : "By title"}
              </option>`,
          )}</select
        >${chevron()}
      </label>
      <span class="ui-bib__spacer"></span>
      <button
        type="button"
        class="ui-bib__btn"
        ?disabled=${!shown.length}
        @click=${() => this.copyRefs(this.targets, "selected")}
      >
        ${this.copied === "selected" ? checkIcon() : copyIcon()}${picked
          ? `Copy ${picked} selected`
          : "Copy all"}
      </button>
      <div class="ui-bib__export">
        <button
          type="button"
          class="ui-bib__btn ui-bib__export-btn"
          aria-haspopup="menu"
          aria-expanded=${this.menuOpen ? "true" : "false"}
          aria-controls=${`${id}-menu`}
          ?disabled=${!shown.length}
          @click=${() =>
            this.menuOpen ? this.closeMenu(false) : this.openMenu()}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              this.openMenu(e.key === "ArrowUp" ? FORMATS.length - 1 : 0);
            }
          }}
        >
          ${downloadIcon()}Export${chevron()}
        </button>
        ${this.menuOpen
          ? html`<ul
              class="ui-bib__menu"
              role="menu"
              id=${`${id}-menu`}
              aria-label="Export as"
              @keydown=${this.onMenuKey}
            >
              ${FORMATS.map(
                ([f, label], i) =>
                  html`<li
                    role="menuitem"
                    class="ui-bib__menu-item"
                    tabindex=${i === this.menuAt ? 0 : -1}
                    @click=${() => this.exportAs(f)}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        this.exportAs(f);
                      }
                    }}
                  >
                    ${label}
                  </li>`,
              )}
            </ul>`
          : nothing}
      </div>
    </div>`;
  }

  private renderEntry(r: Reference, i: number) {
    const ieee = this.citationStyle === "ieee";
    const on = this.selected.includes(r.id);
    return html`<li
      class="ui-bib__entry"
      data-id=${r.id}
      ?data-selected=${on}
      ?data-numbered=${ieee}
    >
      <span class="ui-bib__box">
        <input
          type="checkbox"
          aria-label=${r.title}
          .checked=${live(on)}
          @change=${() =>
            this.setSelected(
              on
                ? this.selected.filter((s) => s !== r.id)
                : [...this.selected, r.id],
            )}
        />${tick()}
      </span>
      <div class="ui-bib__body">
        <p class="ui-bib__ref">
          ${ieee
            ? html`<span class="ui-bib__num">[${i + 1}]</span>`
            : nothing}<span class="ui-bib__text"
            >${formatReferenceTemplate({ ...r }, this.citationStyle)}</span
          >
        </p>
        ${r.tags?.length
          ? html`<ul class="ui-bib__tags" aria-label="Tags">
              ${r.tags.map((t) => html`<li class="ui-bib__tag">${t}</li>`)}
            </ul>`
          : nothing}
      </div>
      <button
        type="button"
        class="ui-bib__copy"
        title="Copy"
        @click=${() => this.copyRefs([r], r.id)}
      >
        ${this.copied === r.id ? checkIcon() : copyIcon()}<span
          class="tc-sr-only"
          >Copy “${r.title}”</span
        >
      </button>
    </li>`;
  }

  protected override render() {
    const shown = this.shown;
    const n = this.references.length;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: bookIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: n
          ? html`<span class="ui-bib__count"
              >${n} ${n === 1 ? "reference" : "references"}</span
            >`
          : nothing,
      })}
      <div class="ui-bib__card">
        ${this.renderToolbar()}
        ${shown.length
          ? html`<ol
              class="ui-bib__list"
              aria-labelledby=${`${this.uid}-title`}
            >
              ${repeat(
                shown,
                (r) => r.id,
                (r, i) => this.renderEntry(r, i),
              )}
            </ol>`
          : html`<p class="ui-bib__empty">
              ${n
                ? `No references match “${this.filter.trim()}”.`
                : "No references yet."}
            </p>`}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="bib"] {
  --tc-bib-indent: var(--tc-space-6);
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bib"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-bib__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bib"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-bib__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="bib"] *, [data-ui="bib"] *::before, [data-ui="bib"] *::after { box-sizing: border-box; }
:where([data-ui="bib"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="bib"] :is(button, a, [tabindex], select, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="bib"]) :is(p, ul, ol) { margin: 0; padding: 0; }
[data-ui="bib"] :is(ul, ol) { list-style: none; }
[data-ui="bib"] svg { display: block; flex: none; }
.ui-bib__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- Toolbar ----- */
.ui-bib__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-bib__spacer { flex: 1; }
.ui-bib__search { position: relative; display: flex; flex: 1 1 10rem; align-items: center; max-width: 16rem; }
.ui-bib__search-icon { position: absolute; left: var(--tc-space-2-5); color: var(--tc-icon-muted); pointer-events: none; }
.ui-bib__search-input { width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-field-px) 0 calc(var(--tc-space-2-5) + var(--tc-space-5)); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-fill-subtle); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; }
.ui-bib__search-input::placeholder { color: var(--tc-text-placeholder); }
.ui-bib__search-input::-webkit-search-cancel-button { display: none; }
.ui-bib__search-input:focus-visible { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); outline: none; }
.ui-bib__select { position: relative; display: block; }
.ui-bib__field { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-7) 0 var(--tc-space-2-5); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); appearance: none; cursor: pointer; }
.ui-bib__chevron { width: var(--tc-space-3-5); height: var(--tc-space-3-5); fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-bib__select .ui-bib__chevron { position: absolute; top: 50%; right: var(--tc-space-2); transform: translateY(-50%); pointer-events: none; }
.ui-bib__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-bib__btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-bib__btn:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-bib__export { position: relative; }
.ui-bib__menu { position: absolute; z-index: var(--tc-z-dropdown); top: calc(100% + var(--tc-space-1)); right: 0; min-width: 12rem; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-bib-in var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-bib__menu-item { display: flex; align-items: center; min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); color: var(--tc-text-primary); cursor: pointer; }
.ui-bib__menu-item:hover, .ui-bib__menu-item:focus { background: var(--tc-menu-item-hover); outline: none; }
/* ----- Checkboxes: the real one, drawn with tokens, the tick over it ----- */
.ui-bib__all { display: inline-flex; }
.ui-bib__box { display: grid; flex: none; }
.ui-bib__box > * { grid-area: 1 / 1; }
.ui-bib__box input { width: var(--tc-space-4); height: var(--tc-space-4); margin: 0; border-radius: var(--tc-radius-xs); background: var(--tc-surface-control); box-shadow: inset 0 0 0 1px var(--tc-border-control); appearance: none; cursor: pointer; }
.ui-bib__box input:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover); }
.ui-bib__box input:is(:checked, :indeterminate) { background: var(--tc-surface-inverse); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-bib__box input:is(:checked, :indeterminate) { background: var(--tc-accent); box-shadow: none; }
.ui-bib__box input:disabled { cursor: not-allowed; opacity: 0.5; }
.ui-bib__tick { place-self: center; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: var(--tc-text-on-inverse); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; opacity: 0; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bib__tick { stroke: var(--tc-text-on-accent); }
.ui-bib__box input:checked + .ui-bib__tick { opacity: 1; }
/* Some picked: a dash across the box */
.ui-bib__dash { place-self: center; width: var(--tc-space-2); height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-text-on-inverse); opacity: 0; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-bib__dash { background: var(--tc-text-on-accent); }
.ui-bib__box input:indeterminate ~ .ui-bib__dash { opacity: 1; }
/* ----- Entries: a hanging indent, IEEE's number in its own column ----- */
.ui-bib__list { display: grid; padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-2); }
.ui-bib__entry { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); }
.ui-bib__entry + .ui-bib__entry { box-shadow: 0 calc(-1 * var(--tc-hairline)) 0 var(--tc-divider); }
.ui-bib__entry[data-selected] { background: var(--tc-fill-selected); }
.ui-bib__entry > .ui-bib__box { padding-top: var(--tc-space-0-5); }
.ui-bib__body { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-bib__ref { padding-left: var(--tc-bib-indent); text-indent: calc(-1 * var(--tc-bib-indent)); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-bib__entry[data-numbered] .ui-bib__ref { display: grid; grid-template-columns: var(--tc-bib-indent) minmax(0, 1fr); padding-left: 0; text-indent: 0; }
.ui-bib__num { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* Links inside a reference are underlined: colour alone wouldn't set them apart from the text around them */
.ui-bib__link { color: var(--tc-accent-text); text-decoration: underline; text-decoration-color: color-mix(in srgb, currentColor 45%, transparent); text-underline-offset: var(--tc-space-0-5); }
.ui-bib__link:hover { text-decoration-color: currentColor; }
.ui-bib__tags { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); padding-left: var(--tc-bib-indent) !important; }
.ui-bib__entry[data-numbered] .ui-bib__tags { padding-left: var(--tc-bib-indent) !important; }
.ui-bib__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); }
.ui-bib__copy { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-bib__copy:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
@media (hover: hover) and (pointer: fine) {
  .ui-bib__entry:not(:hover, :focus-within) .ui-bib__copy { opacity: 0; }
}
.ui-bib__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
@keyframes ui-bib-in { from { opacity: 0; transform: translateY(-2px); } }
@container (max-width: 520px) {
  .ui-bib__search { flex-basis: calc(100% - var(--tc-space-8)); max-width: none; }
  .ui-bib__spacer { display: none; }
  [data-ui="bib"] { --tc-bib-indent: var(--tc-space-4); }
}
@media (forced-colors: active) {
  .ui-bib__box input { border: 1px solid ButtonText; }
  .ui-bib__box input:checked { background: Highlight; }
  .ui-bib__tick { stroke: HighlightText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="bib"] *, [data-ui="bib"] *::before, [data-ui="bib"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-bibliography"))
  customElements.define("tc-bibliography", TcBibliography);

declare global {
  interface HTMLElementTagNameMap {
    "tc-bibliography": TcBibliography;
  }
}
