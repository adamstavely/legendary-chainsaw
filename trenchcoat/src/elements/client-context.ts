import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";
import { safeMediaUrl } from "./internal/safe-media";
import "./button";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-client-context> – the Lit port of blocks/client-context.tsx: one client's numbers, reports and shared context.
 * Switch or create clients, refresh the sync, open a metric, regenerate a report, and keep a timeline of notes and
 * files the whole team writes into: search it, filter it, mention reports with "@" and attach files.
 * Standard: the client's mark and name on a gray tray, the KPI cards and the main card on it. Clean: one white card,
 * the KPIs as quiet tiles and the sections below a hairline.
 *
 *   <tc-client-context .clients=${[…]} .me=${{ name: "Sofia Lind" }}></tc-client-context>
 *
 * Keyboard: the client and filter popovers take focus, move with the arrow keys and give it back to their button on
 * Esc or a pick; when something under focus goes away (a removed note or file, Clear search, Show everything) focus
 * moves to the nearest stable control. Sync results and mention suggestions are announced in narrow status regions.
 * Context added or removed here is kept per client until the page passes a different context for that client – then
 * the page's data wins.
 */

export type ContextPerson = { name: string; avatar?: string };
export type ContextFile = { name: string; type: "pdf" | "xlsx" | "csv" | "doc" };
export type ContextEntry =
  /** A note – "@Report name" of one of the client's reports becomes a mention */
  | { id: string; kind: "note"; author: ContextPerson; when: string; text: string }
  | { id: string; kind: "report"; author: ContextPerson; when: string; report: string }
  | { id: string; kind: "files"; author: ContextPerson; when: string; files: ContextFile[]; text?: string }
  | { id: string; kind: "integration"; when: string; app: string; connected: boolean };
export type ContextKpi = { label: string; value: string; previous: string; delta: number; points: number[]; color: string };
export type ContextReport = { name: string; when: string; summary: string };
export type ContextClient = {
  id: string;
  name: string;
  /** Second line under the name, e.g. legal name, currency and fiscal year end */
  meta: string;
  /** Initial and colours of the client's mark */
  mark: { letter: string; bg: string; fg: string };
  kpis: ContextKpi[];
  reports: ContextReport[];
  context: ContextEntry[];
};
export type ContextTab = "context" | "reports" | "financials" | "settings";
export type ClientContextKind = ContextEntry["kind"];

/** tc-client-change: the client picked (or just created) */
export type ClientContextClientChange = { client: string };
/** tc-add-context: context added to a client – the text and any attached files */
export type ClientContextAdd = { client: string; text: string; files: ContextFile[] };
/** tc-create-client: a client created from the switcher */
export type ClientContextCreate = { name: string };
/** tc-tab-change: the section shown */
export type ClientContextTabChange = { tab: ContextTab };

const people = {
  lena: { name: "Lena Hart", avatar: "/avatars/lena.jpg" },
  jonas: { name: "Jonas Weber", avatar: "/avatars/jonas.jpg" },
  mara: { name: "Mara Novak", avatar: "/avatars/mara.jpg" },
  theo: { name: "Theo Brandt", avatar: "/avatars/theo.jpg" },
};

/** The sample clients shown when `clients` isn't set */
export const defaultContextClients: ContextClient[] = [
  {
    id: "northwind",
    name: "Northwind Logistics",
    meta: "Northwind Logistics GmbH · EUR · Fiscal year ends Dec 31",
    mark: { letter: "N", bg: "#1d4ed8", fg: "#ffffff" },
    kpis: [
      { label: "MRR", value: "€48.2k", previous: "€44.9k", delta: 7.4, points: [31, 33, 32, 35, 36, 35, 38, 40, 41, 44], color: "#2f6bff" },
      { label: "Cash", value: "€612k", previous: "€648k", delta: -5.6, points: [44, 43, 43, 41, 40, 41, 38, 37, 36, 35], color: "#0ea5e9" },
      { label: "Gross margin", value: "64.1%", previous: "62.8%", delta: 1.3, points: [30, 31, 30, 32, 31, 33, 32, 33, 34, 34], color: "#8b5cf6" },
      { label: "Net burn", value: "€36.0k", previous: "€41.5k", delta: -13.3, points: [42, 41, 43, 40, 39, 38, 39, 36, 35, 33], color: "#ec4899" },
    ],
    reports: [
      { name: "Monthly P&L", when: "1d ago", summary: "Revenue up 7% on the new Hamburg routes; freight costs flat, so margin improved by 1.3 points." },
      { name: "Cash runway", when: "6d ago", summary: "17 months at the current burn. The Q1 fleet lease pushes it to 15 if signed in January." },
      { name: "Board pack Q3", when: "2w ago", summary: "Highlights, KPIs and the three decisions for the board: pricing, fleet lease and the Nordics pilot." },
    ],
    context: [
      { id: "n1", kind: "note", author: people.lena, when: "today", text: "CFO wants every figure in the @Monthly P&L in EUR, also for the Danish entity – no converted totals." },
      { id: "n2", kind: "report", author: people.jonas, when: "1d ago", report: "Monthly P&L" },
      {
        id: "n3",
        kind: "files",
        author: people.jonas,
        when: "2d ago",
        files: [
          { name: "budget-2027.pdf", type: "pdf" },
          { name: "fleet-costs-Q3.xlsx", type: "xlsx" },
        ],
      },
      {
        id: "n4",
        kind: "note",
        author: people.lena,
        when: "4d ago",
        text: "Renewal talks start in November. They'll ask for a lower rate if the Nordics pilot slips – keep the @Cash runway current.",
      },
      { id: "n5", kind: "integration", when: "1w ago", app: "Stripe", connected: true },
    ],
  },
  {
    id: "lumen",
    name: "Lumen Labs",
    meta: "Lumen Labs, Inc. · GBP · Fiscal year ends Mar 31",
    mark: { letter: "L", bg: "#f97316", fg: "#ffffff" },
    kpis: [
      { label: "ARR", value: "£1.84m", previous: "£1.62m", delta: 13.6, points: [20, 22, 23, 25, 27, 28, 30, 33, 35, 38], color: "#2f6bff" },
      { label: "Cash", value: "£980k", previous: "£1.06m", delta: -7.5, points: [46, 45, 43, 42, 41, 40, 38, 37, 36, 35], color: "#0ea5e9" },
      { label: "Gross margin", value: "78.0%", previous: "77.2%", delta: 0.8, points: [36, 36, 37, 36, 37, 37, 38, 37, 38, 38], color: "#8b5cf6" },
      { label: "Runway", value: "17 mo", previous: "18 mo", delta: -5.6, points: [40, 39, 39, 38, 37, 37, 36, 35, 35, 34], color: "#ec4899" },
    ],
    reports: [{ name: "Runway forecast", when: "today", summary: "Hiring four engineers in Q1 shortens the runway from 19 to 17 months." }],
    context: [
      { id: "l1", kind: "report", author: people.mara, when: "today", report: "Runway forecast" },
      { id: "l2", kind: "note", author: people.mara, when: "2d ago", text: "Hiring plan adds four engineers in Q1 – reflect it in the @Runway forecast before the board meeting." },
      { id: "l3", kind: "files", author: people.theo, when: "4d ago", files: [{ name: "hiring-plan.doc", type: "doc" }] },
    ],
  },
  {
    id: "halcyon",
    name: "Halcyon Health",
    meta: "Halcyon Health Ltd · USD · Fiscal year ends Jun 30",
    mark: { letter: "H", bg: "#0f766e", fg: "#ffffff" },
    kpis: [
      { label: "Revenue", value: "$212k", previous: "$198k", delta: 7.1, points: [30, 29, 31, 33, 32, 34, 35, 34, 36, 37], color: "#2f6bff" },
      { label: "Cash", value: "$1.21m", previous: "$1.19m", delta: 1.7, points: [38, 38, 39, 38, 39, 40, 39, 40, 41, 41], color: "#0ea5e9" },
      { label: "Gross margin", value: "58.3%", previous: "59.0%", delta: -0.7, points: [36, 35, 36, 35, 35, 34, 35, 34, 34, 33], color: "#8b5cf6" },
      { label: "Net profit", value: "$18.4k", previous: "$12.0k", delta: 53.3, points: [20, 21, 19, 22, 24, 23, 26, 27, 29, 31], color: "#ec4899" },
    ],
    reports: [{ name: "Clinic margins", when: "3d ago", summary: "Two of nine clinics run below 40% margin; both opened this year." }],
    context: [
      { id: "h1", kind: "note", author: people.theo, when: "yesterday", text: "New clinics need 12 months before they count in the @Clinic margins comparison." },
      { id: "h2", kind: "integration", when: "2w ago", app: "Stripe", connected: true },
    ],
  },
];

const defaultMe: ContextPerson = { name: "Sofia Lind", avatar: "/avatars/sofia.jpg" };
const kindLabels: Record<"all" | ClientContextKind, string> = { all: "All", note: "Notes", files: "Files", report: "Reports", integration: "Integrations" };
const tabs: { id: ContextTab; label: string }[] = [
  { id: "context", label: "Context" },
  { id: "reports", label: "Reports" },
  { id: "financials", label: "Financials" },
  { id: "settings", label: "Settings" },
];
/** Files the attach button adds in turn */
const attachable: ContextFile[] = [
  { name: "board-deck-Q3.pdf", type: "pdf" },
  { name: "pipeline-export.csv", type: "csv" },
  { name: "headcount.xlsx", type: "xlsx" },
];
const palette = ["#7c3aed", "#db2777", "#0891b2", "#65a30d"];
const settingRows = [
  ["ai", "Use context in AI answers", "Notes and files are read before every answer", true],
  ["digest", "Daily digest", "A short email when new context or files arrive", false],
  ["share", "Share reports with the client", "Generated reports show up in their portal", false],
] as const;

/** What a client's context was when it was last copied here – a changed context from the page replaces local edits */
const signature = (entries: ContextEntry[]) => JSON.stringify(entries);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Whether an entry matches the search (author, text, file names, report or app) */
export function clientContextMatches(e: ContextEntry, query: string) {
  const s = query.trim().toLowerCase();
  if (!s) return true;
  const hay = [
    "author" in e ? e.author.name : "",
    e.kind === "note" ? e.text : "",
    e.kind === "files" ? `${e.text ?? ""} ${e.files.map((f) => f.name).join(" ")}` : "",
    e.kind === "report" ? e.report : "",
    e.kind === "integration" ? e.app : "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

/** Where the "@" mention being typed starts, or null – an "@" at the start or after a space, up to the caret */
export function clientContextMentionStart(value: string, caret: number) {
  const before = value.slice(0, caret);
  const sign = before.lastIndexOf("@");
  return sign >= 0 && (sign === 0 || /\s/.test(before[sign - 1])) && !/\n|\s\s/.test(before.slice(sign)) ? sign : null;
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${(++seq).toString(36)}`;

/* One consistent icon set on a 24px grid, 1.7 stroke – shapes after Lucide (ISC) */
const icon = (d: TemplateResult, slot?: string) =>
  html`<svg class="ui-cx__icon" slot=${ifDefined(slot)} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  plus: svg`<path d="M12 5v14M5 12h14" />`,
  chevrons: svg`<path d="m8 9 4-4 4 4M8 15l4 4 4-4" />`,
  chevron: svg`<path d="m7 10 5 5 5-5" />`,
  check: svg`<path d="m5 12.5 4.5 4.5L19 7.5" />`,
  close: svg`<path d="M6 6l12 12M18 6 6 18" />`,
  refresh: svg`<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />`,
  search: svg`<circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" />`,
  filter: svg`<path d="M4 6h16M7 12h10M10 18h4" />`,
  paperclip: svg`<path d="m20 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4L15 7" />`,
  note: svg`<path d="M5 5h14v10H9l-4 4V5Z" />`,
  chart: svg`<path d="M5 19V11M12 19V5M19 19v-6" />`,
  files: svg`<path d="m12 4 8 4-8 4-8-4 8-4ZM4 12l8 4 8-4M4 16l8 4 8-4" />`,
  doc: svg`<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5ZM14 3.5V8h4" />`,
  at: svg`<circle cx="12" cy="12" r="3.5" /><path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8" />`,
  trash: svg`<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />`,
};

/** Stripe's mark (Simple Icons, CC0) on its brand colour */
const stripeMark = () => html`<svg viewBox="0 0 24 24" class="ui-cx__stripe" role="img" aria-label="Stripe">
  <rect width="24" height="24" rx="6" fill="#635BFF" />
  <path
    fill="#fff"
    transform="translate(5 5) scale(0.5833)"
    d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
  />
</svg>`;

/** A file with its type as a small coloured tab (and the type as its name) */
const fileIcon = (type: ContextFile["type"]) => html`<svg class="ui-cx__file-icon" data-type=${type} viewBox="0 0 16 18" role="img" aria-label=${type.toUpperCase()}>
  <path class="ui-cx__file-page" d="M3 1.5h6.5l4 4v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" />
  <path class="ui-cx__file-fold" d="M9.5 1.5v3a1 1 0 0 0 1 1h3" />
  <rect class="ui-cx__file-tab" x="0.5" y="9.5" width="10" height="5" rx="1.5" />
</svg>`;

/**
 * One client's numbers, reports and shared context – switch clients, sync, regenerate reports and keep a team timeline.
 * @tag tc-client-context
 * @fires tc-client-change - A client was picked or created (`ClientContextClientChange`: `{ client }`); cancelable – prevented, `client` stays (controlled use)
 * @fires tc-add-context - Context was added (`ClientContextAdd`: `{ client, text, files }`); cancelable – prevented, it isn't added here
 * @fires tc-create-client - A client was created from the switcher (`ClientContextCreate`: `{ name }`); cancelable – prevented, it isn't created
 * @fires tc-tab-change - The section changed (`ClientContextTabChange`: `{ tab }`); cancelable – prevented, `tab` stays
 */
export class TcClientContext extends TcElement {
  static override ui = "cx";

  /** The clients and their context. Context added or removed here is kept per client until you pass a different
   *  context for that client – then your data wins */
  @property({ attribute: false }) accessor clients: ContextClient[] = defaultContextClients;
  /** Id of the open client; empty opens the first */
  @property() accessor client = "";
  /** The signed-in person – author of new context */
  @property({ attribute: false }) accessor me: ContextPerson = defaultMe;
  /** The section shown: context, reports, financials or settings */
  @property() accessor tab: ContextTab = "context";

  @state() private accessor created: ContextClient[] = [];
  @state() private accessor timeline: Record<string, { base: string; entries: ContextEntry[] }> = {};
  @state() private accessor reportTimes: Record<string, string> = {};
  @state() private accessor metric: string | null = null;
  @state() private accessor openReport: string | null = null;
  @state() private accessor regenerating: string | null = null;
  @state() private accessor query = "";
  @state() private accessor filter: "all" | ClientContextKind = "all";
  @state() private accessor files: ContextFile[] = [];
  @state() private accessor menu: "client" | "filter" | null = null;
  @state() private accessor creating = false;
  @state() private accessor newName = "";
  @state() private accessor synced: Record<string, "3m ago" | "syncing" | "just now"> = {};
  @state() private accessor syncNote = "";
  @state() private accessor settings: Record<string, Record<string, boolean>> = {};
  @state() private accessor fresh: string | null = null;
  @state() private accessor draft = "";
  @state() private accessor caret = 0;
  @state() private accessor mentionAt: number | null = null;

  private readonly uid = nextId("ui-cx");
  /** Pending timers and frames – all cancelled when the element leaves the page */
  private pending = new Set<() => void>();
  /** Where focus goes after the next render – selectors inside the element, first match wins */
  private focusNext: string[] | null = null;
  /** The menu that was open at the last render, to move focus in when one opens */
  private shownMenu: "client" | "filter" | null = null;

  private readonly away = (e: PointerEvent) => {
    if (!(e.target as Element).closest?.("[data-cx-menu]")) {
      this.menu = null;
      this.creating = false;
    }
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const cancel of this.pending) cancel();
    this.pending.clear();
    document.removeEventListener("pointerdown", this.away);
  }

  /** Runs a callback after a delay (or on the next frame); cancelled if the element leaves the page first */
  private later(run: () => void, ms?: number) {
    let cancel = () => {};
    const done = () => {
      this.pending.delete(cancel);
      run();
    };
    if (ms === undefined) {
      const frame = requestAnimationFrame(done);
      cancel = () => cancelAnimationFrame(frame);
    } else {
      const timer = window.setTimeout(done, ms);
      cancel = () => window.clearTimeout(timer);
    }
    this.pending.add(cancel);
  }

  /** Focuses an element, or the native button inside a tc-button */
  private focusIn(el: Element | null | undefined) {
    const target = el?.matches("tc-button") ? el.querySelector("button") : el;
    (target as HTMLElement | null | undefined)?.focus({ preventScroll: true });
    return Boolean(target);
  }

  private get allClients() {
    return [...this.clients, ...this.created.filter((c) => !this.clients.some((p) => p.id === c.id))];
  }
  private get current(): ContextClient | undefined {
    const all = this.allClients;
    return all.find((c) => c.id === this.client) ?? all[0];
  }
  private entriesOf(c: ContextClient, kept = this.timeline) {
    const local = kept[c.id];
    return local && local.base === signature(c.context) ? local.entries : c.context;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A framework that drops a prop sets it to undefined: fall back to the default
    this.clients ??= defaultContextClients;
    this.me ??= defaultMe;
    this.client ??= "";
    this.tab ??= "context";
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("menu")) {
      if (this.menu) document.addEventListener("pointerdown", this.away);
      else document.removeEventListener("pointerdown", this.away);
    }
    // A popover that just opened takes focus: the current choice, else the first item
    if (this.menu && this.menu !== this.shownMenu) {
      const panel = this.querySelector(`[data-cx-panel="${this.menu}"]`);
      this.focusIn(panel?.querySelector("[data-cx-item][aria-current='true'], [data-cx-item][aria-pressed='true']") ?? panel?.querySelector("[data-cx-item]"));
    }
    this.shownMenu = this.menu;
    this.syncAria();
    if (changed.has("creating") && this.creating) this.querySelector<HTMLInputElement>(".ui-cx__create input")?.focus();
    const targets = this.focusNext;
    if (targets) {
      this.focusNext = null;
      for (const t of targets) if (this.focusIn(this.querySelector(t))) break;
    }
  }

  /** tc-button forwards only naming and state ARIA to its inner button – aria-disabled (focusable while unavailable)
   *  and aria-busy are set on it here, once it has rendered */
  private syncAria() {
    for (const b of this.querySelectorAll<HTMLElement & { updateComplete: Promise<unknown> }>("tc-button[data-aria-disabled], tc-button[data-aria-busy]")) {
      void b.updateComplete.then(() => {
        const inner = b.querySelector(":scope > button");
        if (!inner) return;
        for (const name of ["aria-disabled", "aria-busy"]) {
          const v = b.getAttribute(`data-${name}`);
          if (v === "true") inner.setAttribute(name, "true");
          else if (v !== null) inner.removeAttribute(name);
        }
      });
    }
  }

  /** Edits this client's timeline (the client it was when the action started, even if another one is open by now) */
  private edit(of: ContextClient, change: (entries: ContextEntry[]) => ContextEntry[]) {
    this.timeline = { ...this.timeline, [of.id]: { base: signature(of.context), entries: change(this.entriesOf(of)) } };
  }
  private push(entry: ContextEntry, of: ContextClient) {
    this.edit(of, (list) => [entry, ...list]);
    this.fresh = entry.id;
  }

  private setTab(tab: ContextTab) {
    if (tab === this.tab) return;
    if (!this.emit<ClientContextTabChange>("tc-tab-change", { tab }, { cancelable: true })) return;
    this.tab = tab;
  }

  private pickClient(id: string) {
    this.menu = null;
    this.creating = false;
    this.query = "";
    this.filter = "all";
    this.metric = null;
    this.openReport = null;
    if (id !== this.current?.id && this.emit<ClientContextClientChange>("tc-client-change", { client: id }, { cancelable: true })) this.client = id;
    this.focusNext = [".ui-cx__switch"];
  }

  private createClient() {
    const name = this.newName.trim();
    const from = this.current;
    if (!name || !from) return;
    if (!this.emit<ClientContextCreate>("tc-create-client", { name }, { cancelable: true })) return;
    const all = this.allClients;
    const made: ContextClient = {
      id: nextId("client"),
      name,
      meta: "New client · connect their books under Settings",
      mark: { letter: name.charAt(0).toUpperCase(), bg: palette[all.length % palette.length], fg: "#ffffff" },
      kpis: from.kpis.map((k) => ({ ...k, value: "–", previous: "–", delta: 0, points: k.points.map(() => 1) })),
      reports: [],
      context: [],
    };
    this.created = [...this.created, made];
    this.newName = "";
    this.pickClient(made.id);
    this.setTab("context");
  }

  private refresh() {
    const c = this.current;
    if (!c || (this.synced[c.id] ?? "3m ago") === "syncing") return;
    this.synced = { ...this.synced, [c.id]: "syncing" };
    this.later(() => {
      this.synced = { ...this.synced, [c.id]: "just now" };
      this.syncNote = "Synced just now";
    }, 900);
  }

  private add() {
    const c = this.current;
    const text = this.draft.trim();
    if (!c || (!text && !this.files.length)) return;
    const files = this.files;
    if (!this.emit<ClientContextAdd>("tc-add-context", { client: c.id, text, files }, { cancelable: true })) return;
    const id = nextId("new");
    this.push(
      files.length
        ? { id, kind: "files", author: this.me, when: "just now", files, text: text || undefined }
        : { id, kind: "note", author: this.me, when: "just now", text },
      c,
    );
    this.draft = "";
    this.files = [];
    this.filter = "all";
    this.query = "";
    this.mentionAt = null;
    // Add context turns disabled once the box is empty – keep writing in the box
    this.focusNext = [".ui-cx__composer textarea"];
  }

  /** Removes an entry; focus moves to the next (or previous) entry's remove button, else the note box */
  private removeEntry(id: string, shown: ContextEntry[]) {
    const c = this.current;
    if (!c) return;
    const at = shown.findIndex((e) => e.id === id);
    const ids = [...shown.slice(at + 1), ...shown.slice(0, at).reverse()].map((e) => e.id);
    this.focusNext = [...ids.map((x) => `[data-entry="${CSS.escape(x)}"] .ui-cx__remove`), ".ui-cx__composer textarea"];
    this.edit(c, (list) => list.filter((e) => e.id !== id));
  }

  private detach(name: string) {
    const at = this.files.findIndex((f) => f.name === name);
    const rest = this.files.filter((f) => f.name !== name);
    const next = rest[at] ?? rest[at - 1];
    this.focusNext = [...(next ? [`[data-file="${CSS.escape(next.name)}"] button`] : []), ".ui-cx__attach"];
    this.files = rest;
  }

  private attach() {
    // aria-disabled (not disabled) once every file is attached, so focus stays on the button
    const next = attachable.find((f) => !this.files.some((x) => x.name === f.name));
    if (next) this.files = [...this.files, next];
  }

  private showReport(name: string) {
    this.setTab("reports");
    this.openReport = name;
  }

  private regenerate(name: string) {
    const of = this.current;
    if (this.regenerating || !of) return;
    const key = `${of.id}:${name}`;
    this.regenerating = key;
    this.later(() => {
      this.regenerating = null;
      this.reportTimes = { ...this.reportTimes, [key]: "just now" };
      this.push({ id: nextId("rep"), kind: "report", author: this.me, when: "just now", report: name }, of);
    }, 1100);
  }

  /* ---------- The note being written: "@" mentions of the client's reports ---------- */

  private suggestions(reportNames: string[]) {
    const q = this.mentionAt !== null ? this.draft.slice(this.mentionAt + 1, this.caret) : null;
    return q !== null && !/\n/.test(q) ? reportNames.filter((n) => n.toLowerCase().includes(q.toLowerCase())).slice(0, 4) : [];
  }
  private onDraft(value: string, at: number) {
    this.draft = value;
    this.caret = at;
    this.mentionAt = clientContextMentionStart(value, at);
  }
  private insertMention(name: string) {
    if (this.mentionAt === null) return;
    const next = `${this.draft.slice(0, this.mentionAt)}@${name} ${this.draft.slice(this.caret)}`;
    const at = this.mentionAt + name.length + 2;
    this.draft = next;
    this.caret = at;
    this.mentionAt = null;
    this.later(() => {
      const box = this.querySelector<HTMLTextAreaElement>(".ui-cx__composer textarea");
      box?.focus();
      box?.setSelectionRange(at, at);
    });
  }
  private mentionInContext(name: string) {
    this.setTab("context");
    this.draft = `${this.draft}${this.draft && !this.draft.endsWith(" ") ? " " : ""}@${name} `;
    this.later(() => this.querySelector<HTMLTextAreaElement>(".ui-cx__composer textarea")?.focus());
  }

  /* ---------- Popovers ---------- */

  private toggleMenu(which: "client" | "filter") {
    this.menu = this.menu === which ? null : which;
    this.creating = false;
  }
  private closeMenu(trigger: string) {
    this.menu = null;
    this.creating = false;
    this.focusNext = [trigger];
  }
  /** A popover's keyboard: Up / Down / Home / End move, Esc closes and returns focus to its button */
  private menuKeys(e: KeyboardEvent, trigger: string) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu(trigger);
      return;
    }
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const panel = e.currentTarget as HTMLElement;
    const list = [...panel.querySelectorAll<HTMLElement>("[data-cx-item]")];
    const at = list.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? at + 1 : e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    list[(next + list.length) % list.length]?.focus();
  }

  /* ---------- Render ---------- */

  protected override render() {
    const client = this.current;
    if (!client) return html`<div class="ui-cx__empty ui-cx__empty--flush"><p>No clients yet.</p></div>`;
    const look = this.resolvedLook;
    const entries = this.entriesOf(client);
    const reportNames = client.reports.map((r) => r.name);
    const shown = entries.filter((e) => (this.filter === "all" || e.kind === this.filter) && clientContextMatches(e, this.query));
    const sync = this.synced[client.id] ?? "3m ago";
    const stripe = entries.find((e) => e.kind === "integration" && e.app === "Stripe") as Extract<ContextEntry, { kind: "integration" }> | undefined;
    const tab = this.tab;
    return html`
      ${this.renderHeader(client, sync, look)}
      ${keyed(client.id, this.renderKpis(client, tab === "financials" ? this.metric : null))}
      <div class="ui-cx__card">
        <div class="ui-cx__toolbar">
          <tc-segmented-control
            look=${look}
            kind="tabs"
            class="ui-cx__seg"
            aria-label="Client sections"
            .options=${tabs.map((t) => ({ value: t.id, label: t.label, controls: `${this.uid}-panel` })) as SegmentOption[]}
            .value=${tab}
            @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
              // The inner control's event stops here: the page hears this element's tc-tab-change
              e.stopPropagation();
              e.preventDefault();
              this.setTab(e.detail.value as ContextTab);
            }}
          ></tc-segmented-control>
          ${tab === "context" ? this.renderTools(entries, look) : nothing}
        </div>
        ${keyed(
          `${tab}-${client.id}`,
          html`<div class="ui-cx__panel" id=${`${this.uid}-panel`} role="tabpanel" aria-label=${tabs.find((t) => t.id === tab)?.label ?? ""}>
            ${tab === "context" ? html`${this.renderComposer(client, look)}${this.renderTimeline(entries, shown, reportNames)}` : nothing}
            ${tab === "reports" ? this.renderReports(client, look) : nothing}
            ${tab === "financials" ? this.renderFinancials(client) : nothing}
            ${tab === "settings" ? this.renderSettings(client, stripe?.connected ?? false, look) : nothing}
          </div>`,
        )}
      </div>
    `;
  }

  /** The client's mark and name, with Sync now and the client switcher */
  private renderHeader(client: ContextClient, sync: string, look: Look) {
    const label = sync === "syncing" ? "Syncing…" : `Synced ${sync}`;
    return html`<header class="ui-cx__head">
      ${keyed(
        client.id,
        html`<div class="ui-cx__who">
          ${this.mark(client, 36)}
          <div class="ui-cx__who-text">
            <h2 class="ui-cx__name">${client.name}</h2>
            <p class="ui-cx__meta">${client.meta}</p>
          </div>
        </div>`,
      )}
      <div class="ui-cx__actions">
        <!-- Named by what it shows, plus what pressing does (label in name, 2.5.3) -->
        <tc-button
          look=${look}
          variant="secondary"
          class="ui-cx__sync"
          label=${label}
          aria-label=${`${label}, sync now`}
          data-aria-busy=${sync === "syncing" ? "true" : "false"}
          @click=${() => this.refresh()}
          ><span slot="icon" class="ui-cx__sync-icon"><span class="ui-cx__sync-dot" data-state=${sync}></span></span
          ><span slot="icon-right" class="ui-cx__spin" ?data-spinning=${sync === "syncing"}>${icon(I.refresh)}</span></tc-button
        >
        <span class="tc-sr-only" role="status">${this.syncNote}</span>
        ${this.renderSwitcher(client, look)}
      </div>
    </header>`;
  }

  /** "Switch client" with its menu and the New client form – a disclosure with a list of buttons */
  private renderSwitcher(current: ContextClient, look: Look) {
    const open = this.menu === "client";
    const panelId = `${this.uid}-clients`;
    return html`<div class="ui-cx__pop" data-cx-menu>
      <tc-button
        look=${look}
        variant="secondary"
        class="ui-cx__switch"
        label="Switch client"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${ifDefined(open ? panelId : undefined)}
        @click=${() => this.toggleMenu("client")}
        >${icon(I.chevrons, "icon-right")}</tc-button
      >
      ${open
        ? html`<div class="ui-cx__menu ui-cx__menu--end" id=${panelId} data-cx-panel="client" @keydown=${(e: KeyboardEvent) => this.menuKeys(e, ".ui-cx__switch")}>
            <ul aria-label="Clients">
              ${repeat(
                this.allClients,
                (c) => c.id,
                (c) => html`<li>
                  <button type="button" data-cx-item aria-current=${ifDefined(c.id === current.id ? "true" : undefined)} class="ui-cx__menu-item" @click=${() => this.pickClient(c.id)}>
                    ${this.mark(c, 20)}
                    <span class="ui-cx__menu-label">${c.name}</span>
                    <span class="ui-cx__menu-check">${c.id === current.id ? icon(I.check) : nothing}</span>
                  </button>
                </li>`,
              )}
            </ul>
            <div class="ui-cx__menu-sep"></div>
            ${this.creating
              ? html`<form
                  class="ui-cx__create"
                  @submit=${(e: Event) => {
                    e.preventDefault();
                    this.createClient();
                  }}
                >
                  <input
                    .value=${live(this.newName)}
                    @input=${(e: Event) => (this.newName = (e.target as HTMLInputElement).value)}
                    placeholder="Client name"
                    aria-label="New client name"
                    maxlength="40"
                  />
                  <tc-button look=${look} type="submit" size="sm" label="Add" class="ui-cx__add-client" data-aria-disabled=${this.newName.trim() ? "false" : "true"}></tc-button>
                </form>`
              : html`<button type="button" data-cx-item class="ui-cx__menu-item" @click=${() => (this.creating = true)}>
                  <span class="ui-cx__menu-plus">${icon(I.plus)}</span>
                  <span class="ui-cx__menu-label">New client</span>
                </button>`}
          </div>`
        : nothing}
    </div>`;
  }

  /** The KPI cards – each opens its metric under Financials */
  private renderKpis(client: ContextClient, active: string | null) {
    return html`<div class="ui-cx__kpis">
      ${client.kpis.map(
        (k, i) => html`<button
          type="button"
          class="ui-cx__kpi"
          aria-pressed=${active === k.label ? "true" : "false"}
          @click=${() => {
            this.metric = k.label;
            this.setTab("financials");
          }}
        >
          <span class="ui-cx__kpi-label">${k.label}</span>
          <span class="ui-cx__kpi-row"><span class="ui-cx__kpi-value">${k.value}</span>${this.spark(k.points, k.color, i * 90)}</span>
        </button>`,
      )}
    </div>`;
  }

  /** Search and the kind filter above the timeline */
  private renderTools(entries: ContextEntry[], look: Look) {
    const open = this.menu === "filter";
    const panelId = `${this.uid}-filter`;
    const f = this.filter;
    return html`<div class="ui-cx__tools">
      <label class="ui-cx__search">
        ${icon(I.search)}
        <input .value=${live(this.query)} @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value)} placeholder="Search" aria-label="Search context" />
        ${this.query
          ? html`<button
              type="button"
              class="ui-cx__clear"
              aria-label="Clear search"
              @click=${() => {
                // The × goes away with the text – focus stays in the search field
                this.focusNext = [".ui-cx__search input"];
                this.query = "";
              }}
            >
              ${icon(I.close)}
            </button>`
          : nothing}
      </label>
      <div class="ui-cx__pop" data-cx-menu>
        <tc-button
          look=${look}
          variant="secondary"
          class="ui-cx__filter-btn"
          label=${kindLabels[f]}
          aria-label=${`Show: ${kindLabels[f]}`}
          aria-expanded=${open ? "true" : "false"}
          aria-controls=${ifDefined(open ? panelId : undefined)}
          ?data-active=${f !== "all"}
          @click=${() => this.toggleMenu("filter")}
          >${icon(I.filter, "icon")}</tc-button
        >
        ${open
          ? html`<div class="ui-cx__menu ui-cx__menu--end" id=${panelId} data-cx-panel="filter" @keydown=${(e: KeyboardEvent) => this.menuKeys(e, ".ui-cx__filter-btn")}>
              <ul aria-label="Show">
                ${(Object.keys(kindLabels) as ("all" | ClientContextKind)[]).map(
                  (k) => html`<li>
                    <button
                      type="button"
                      data-cx-item
                      aria-pressed=${f === k ? "true" : "false"}
                      class="ui-cx__menu-item"
                      @click=${() => {
                        this.filter = k;
                        this.closeMenu(".ui-cx__filter-btn");
                      }}
                    >
                      <span class="ui-cx__menu-label">${kindLabels[k]}</span>
                      <span class="ui-cx__menu-count">${k === "all" ? entries.length : entries.filter((e) => e.kind === k).length}</span>
                      <span class="ui-cx__menu-check">${f === k ? icon(I.check) : nothing}</span>
                    </button>
                  </li>`,
                )}
              </ul>
            </div>`
          : nothing}
      </div>
    </div>`;
  }

  /** The note box: @-mentions of reports, attached files, ⌘ Enter to add */
  private renderComposer(client: ContextClient, look: Look) {
    const suggestions = this.suggestions(client.reports.map((r) => r.name));
    const full = this.files.length >= attachable.length;
    return html`<div class="ui-cx__compose">
      ${this.avatar(this.me, 28)}
      <div class="ui-cx__composer">
        <textarea
          .value=${live(this.draft)}
          @input=${(e: Event) => {
            const t = e.target as HTMLTextAreaElement;
            this.onDraft(t.value, t.selectionStart);
          }}
          @select=${(e: Event) => (this.caret = (e.target as HTMLTextAreaElement).selectionStart)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.isComposing) return;
            if (suggestions.length && (e.key === "Enter" || e.key === "Tab")) {
              e.preventDefault();
              this.insertMention(suggestions[0]);
              return;
            }
            if (e.key === "Escape") this.mentionAt = null;
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              this.add();
            }
          }}
          rows="2"
          placeholder=${client.reports.length ? "Add a goal, request or decision – type @ to mention a report" : "Add a goal, request or decision for this client"}
          aria-label="New context"
        ></textarea>
        <!-- Enter or Tab inserts the first suggestion (it is marked); the others are buttons -->
        <span class="tc-sr-only" role="status"
          >${suggestions.length ? `${suggestions.length} ${suggestions.length === 1 ? "report" : "reports"} to mention – Enter inserts ${suggestions[0]}` : ""}</span
        >
        ${suggestions.length
          ? html`<ul class="ui-cx__suggest" aria-label="Mention a report">
              ${suggestions.map(
                (n, i) => html`<li>
                  <button type="button" ?data-first=${i === 0} class="ui-cx__menu-item" @mousedown=${(e: Event) => e.preventDefault()} @click=${() => this.insertMention(n)}>
                    ${icon(I.doc)}<span class="ui-cx__menu-label">${n}</span>
                  </button>
                </li>`,
              )}
            </ul>`
          : nothing}
        ${this.files.length
          ? html`<div class="ui-cx__attached">
              ${repeat(
                this.files,
                (f) => f.name,
                (f) => html`<span class="ui-cx__file-chip" data-file=${f.name}
                  >${fileIcon(f.type)}${f.name}<button type="button" aria-label=${`Remove ${f.name}`} @click=${() => this.detach(f.name)}>${icon(I.close)}</button></span
                >`,
              )}
            </div>`
          : nothing}
        <div class="ui-cx__composer-bar">
          <tc-button
            look=${look}
            variant="ghost"
            size="sm"
            class="ui-cx__attach"
            label="Attach a file"
            hide-label
            data-aria-disabled=${full ? "true" : "false"}
            @click=${() => !full && this.attach()}
            >${icon(I.paperclip, "icon")}</tc-button
          >
          <span class="ui-cx__hint" aria-hidden="true"><kbd>⌘</kbd><kbd>Enter</kbd></span>
          <tc-button look=${look} size="sm" class="ui-cx__add" label="Add context" ?disabled=${!this.draft.trim() && !this.files.length} @click=${() => this.add()}></tc-button>
        </div>
      </div>
    </div>`;
  }

  /** The context timeline, or why it is empty */
  private renderTimeline(entries: ContextEntry[], shown: ContextEntry[], reports: string[]) {
    if (!shown.length)
      return html`<div class="ui-cx__empty">
        ${entries.length === 0
          ? html`<p>No context yet – add the first goal or file above.</p>`
          : html`<p>
              Nothing matches${this.query ? ` “${this.query}”` : ""}${this.filter !== "all" ? ` in ${kindLabels[this.filter].toLowerCase()}` : ""}.
              <button
                type="button"
                @click=${() => {
                  this.focusNext = [".ui-cx__search input"];
                  this.query = "";
                  this.filter = "all";
                }}
              >
                Show everything
              </button>
            </p>`}
      </div>`;
    return html`<ol class="ui-cx__timeline">
      ${repeat(
        shown,
        (e) => e.id,
        (e) => this.renderItem(e, reports, shown),
      )}
    </ol>`;
  }

  private renderItem(entry: ContextEntry, reports: string[], shown: ContextEntry[]) {
    const hl = (text: string) => this.highlight(text);
    const mine = "author" in entry && entry.author.name === this.me.name;
    const reportLink = (name: string) =>
      reports.includes(name)
        ? html`<button type="button" class="ui-cx__ref" @click=${() => this.showReport(name)}>${hl(name)}</button>`
        : html`<span class="ui-cx__ref">${hl(name)}</span>`;
    const nodeIcon = entry.kind === "note" ? icon(I.note) : entry.kind === "report" ? icon(I.chart) : entry.kind === "files" ? icon(I.files) : stripeMark();
    return html`<li class="ui-cx__item" data-entry=${entry.id} ?data-fresh=${entry.id === this.fresh}>
      <span class="ui-cx__node" data-kind=${entry.kind}>${nodeIcon}</span>
      <div class="ui-cx__body">
        <div class="ui-cx__line">
          ${entry.kind === "integration"
            ? html`<span>${entry.connected ? "Connected " : "Disconnected "}<strong>${hl(entry.app)}</strong></span>`
            : html`${this.avatar(entry.author, 20)}
                <span
                  ><strong>${hl(entry.author.name)}</strong>${entry.kind === "note" ? " added context" : nothing}${entry.kind === "report"
                    ? html` generated ${reportLink(entry.report)}`
                    : nothing}${entry.kind === "files"
                    ? html` added ${entry.files.map(
                        (f, i) =>
                          html`<span class="ui-cx__file"
                            >${i > 0 ? (i === entry.files.length - 1 ? " and " : ", ") : nothing}${fileIcon(f.type)}<span class="ui-cx__ref">${hl(f.name)}</span></span
                          >`,
                      )}`
                    : nothing}</span
                >`}
          <span class="ui-cx__when">${entry.when}</span>
          ${mine
            ? html`<button
                type="button"
                class="ui-cx__remove"
                aria-label=${`Remove ${entry.kind === "files" ? "these files" : entry.kind === "report" ? "this report entry" : "this note"}`}
                @click=${() => this.removeEntry(entry.id, shown)}
              >
                ${icon(I.trash)}
              </button>`
            : nothing}
        </div>
        ${entry.kind === "note" || (entry.kind === "files" && entry.text) ? html`<div class="ui-cx__note">${this.withMentions(entry.text ?? "", reports)}</div>` : nothing}
      </div>
    </li>`;
  }

  /** "@Monthly P&L" for one of the client's reports → a mention chip that opens the report */
  private withMentions(text: string, reports: string[]) {
    if (!reports.length) return this.highlight(text);
    const names = [...reports].sort((a, b) => b.length - a.length).map(escapeRe);
    return text.split(new RegExp(`(@(?:${names.join("|")}))`, "g")).map((part) => {
      const name = part.startsWith("@") ? part.slice(1) : "";
      return reports.includes(name)
        ? html`<button type="button" class="ui-cx__mention" @click=${() => this.showReport(name)}>${icon(I.doc)}${name}</button>`
        : html`<span>${this.highlight(part)}</span>`;
    });
  }

  /** Search matches get a soft marker */
  private highlight(text: string) {
    const q = this.query.trim();
    if (!q) return text;
    return text.split(new RegExp(`(${escapeRe(q)})`, "ig")).map((p) => (p.toLowerCase() === q.toLowerCase() ? html`<mark>${p}</mark>` : p));
  }

  private renderReports(client: ContextClient, look: Look) {
    if (!client.reports.length)
      return html`<div class="ui-cx__empty ui-cx__empty--flush"><p>No reports yet. Connect the books under Settings to generate the first one.</p></div>`;
    return html`<ul class="ui-cx__list">
      ${repeat(
        client.reports,
        (r) => r.name,
        (r) => {
          const open = this.openReport === r.name;
          const key = `${client.id}:${r.name}`;
          const busy = this.regenerating === key;
          const bodyId = `${this.uid}-${client.id}-${r.name}`.replace(/[^\w-]/g, "-");
          return html`<li class="ui-cx__report" ?data-open=${open}>
            <button type="button" class="ui-cx__report-head" aria-expanded=${open ? "true" : "false"} aria-controls=${bodyId} @click=${() => (this.openReport = open ? null : r.name)}>
              <span class="ui-cx__row-icon">${icon(I.chart)}</span>
              <span class="ui-cx__row-main"><strong>${r.name}</strong><span>${busy ? "Regenerating…" : `Generated ${this.reportTimes[key] ?? r.when}`}</span></span>
              <span class="ui-cx__chevron">${icon(I.chevron)}</span>
            </button>
            <!-- Collapsed: inert, so its buttons are out of the tab order and the accessibility tree -->
            <div class="ui-cx__report-body" id=${bodyId} .inert=${!open}>
              <div>
                <p>${r.summary}</p>
                <div class="ui-cx__report-actions">
                  <tc-button look=${look} variant="secondary" size="sm" label="Mention in context" @click=${() => this.mentionInContext(r.name)}>${icon(I.at, "icon")}</tc-button>
                  <!-- aria-disabled while it runs, so focus stays on it -->
                  <tc-button
                    look=${look}
                    variant="secondary"
                    size="sm"
                    class="ui-cx__regen"
                    label=${busy ? "Regenerating…" : "Regenerate"}
                    data-aria-disabled=${busy ? "true" : "false"}
                    @click=${() => !busy && this.regenerate(r.name)}
                    ><span slot="icon" class="ui-cx__spin" ?data-spinning=${busy}>${icon(I.refresh)}</span></tc-button
                  >
                </div>
              </div>
            </div>
          </li>`;
        },
      )}
    </ul>`;
  }

  private renderFinancials(client: ContextClient) {
    return html`<ul class="ui-cx__list">
      ${client.kpis.map((k) => {
        const on = this.metric === k.label;
        return html`<li class="ui-cx__fin" ?data-active=${on}>
          <button type="button" aria-pressed=${on ? "true" : "false"} @click=${() => (this.metric = on ? null : k.label)}>
            <span class="ui-cx__fin-dot" style=${styleMap({ background: k.color })}></span>
            <span class="ui-cx__row-main"><strong>${k.label}</strong><span>Previous month ${k.previous}</span></span>
            ${this.spark(k.points, k.color, 0, true)}
            <span class="ui-cx__fin-value">
              <strong>${k.value}</strong>
              ${k.value !== "–" ? html`<span data-trend=${k.delta >= 0 ? "up" : "down"}>${k.delta >= 0 ? "+" : "−"}${Math.abs(k.delta).toFixed(1)}%</span>` : nothing}
            </span>
          </button>
        </li>`;
      })}
    </ul>`;
  }

  private renderSettings(client: ContextClient, stripeOn: boolean, look: Look) {
    const setting = (key: string, fallback: boolean) => this.settings[client.id]?.[key] ?? fallback;
    return html`<ul class="ui-cx__list">
      <li class="ui-cx__row">
        <span class="ui-cx__app">${stripeMark()}</span>
        <span class="ui-cx__row-main"><strong>Stripe</strong><span>${stripeOn ? "Revenue and payouts sync every hour" : "Not connected"}</span></span>
        <tc-button
          look=${look}
          variant="secondary"
          size="sm"
          label=${stripeOn ? "Disconnect" : "Connect"}
          aria-label=${`${stripeOn ? "Disconnect" : "Connect"} Stripe`}
          @click=${() => this.push({ id: nextId("int"), kind: "integration", when: "just now", app: "Stripe", connected: !stripeOn }, client)}
        ></tc-button>
      </li>
      ${settingRows.map(([key, label, hint, fallback]) => {
        const on = setting(key, fallback);
        return html`<li class="ui-cx__row">
          <span class="ui-cx__row-main"><strong>${label}</strong><span>${hint}</span></span>
          <button
            type="button"
            role="switch"
            aria-checked=${on ? "true" : "false"}
            aria-label=${label}
            class="ui-cx__toggle"
            @click=${() => (this.settings = { ...this.settings, [client.id]: { ...this.settings[client.id], [key]: !on } })}
          >
            <span></span>
          </button>
        </li>`;
      })}
    </ul>`;
  }

  /* ---------- Small pieces ---------- */

  private mark(client: ContextClient, size: 20 | 36) {
    return html`<span class="ui-cx__mark" data-size=${size} style=${styleMap({ background: client.mark.bg, color: client.mark.fg })} aria-hidden="true">${client.mark.letter}</span>`;
  }

  private avatar(person: ContextPerson, size: 20 | 28) {
    const src = safeMediaUrl(person.avatar);
    return src
      ? html`<img class="ui-cx__avatar" data-size=${size} src=${src} alt="" width=${size} height=${size} />`
      : html`<span class="ui-cx__avatar ui-cx__avatar--initial" data-size=${size} aria-hidden="true">${person.name.charAt(0)}</span>`;
  }

  /** Sparkline that draws itself in, with a dot on the latest value */
  private spark(points: number[], color: string, delay: number, wide = false) {
    const w = wide ? 96 : 64;
    const h = 24;
    if (points.length < 2) return nothing;
    let min = Infinity;
    let max = -Infinity;
    for (const p of points) {
      if (p < min) min = p;
      if (p > max) max = p;
    }
    const xy = points.map((p, i) => [(i / (points.length - 1)) * (w - 4) + 2, h - 3 - ((p - min) / (max - min || 1)) * (h - 6)]);
    const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const [lx, ly] = xy[xy.length - 1];
    return html`<svg class="ui-cx__spark" ?data-wide=${wide} viewBox=${`0 0 ${w} ${h}`} aria-hidden="true" style=${styleMap({ "--d": `${delay}ms` })}>
      <path d=${d} pathLength="1" stroke=${color} />
      <circle cx=${lx} cy=${ly} r="2.4" fill=${color} />
    </svg>`;
  }

  static override css = /* css */ `
/* Standard: the block is a tray – the header sits on it, the KPI cards and the main card are white cards on it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cx"] {
  padding: 0 var(--tc-tray-inset) var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
/* Clean: one white card – the KPIs are quiet tiles and the sections sit below a hairline */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cx"] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="cx"] {
  container-type: inline-size;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 900px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cx"] *, [data-ui="cx"] *::before, [data-ui="cx"] *::after { box-sizing: border-box; }
:where([data-ui="cx"]) :where(button[class^="ui-cx__"], .ui-cx__empty button, .ui-cx__file-chip button, .ui-cx__menu-item) { margin: 0; font: inherit; color: inherit; }
:where([data-ui="cx"]) :where(p, h2, ol, ul) { margin: 0; }
:where([data-ui="cx"]) :where(ol, ul) { padding: 0; list-style: none; }
[data-ui="cx"] mark { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); color: inherit; }
.ui-cx__icon { width: 15px; height: 15px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-cx__icon { stroke-width: 1.6; }

/* ---------- Header ---------- */
.ui-cx__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-4); padding: var(--tc-space-4) var(--tc-space-2-5) var(--tc-space-3-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *) .ui-cx__head { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5); }
.ui-cx__who { display: flex; align-items: center; gap: var(--tc-space-3); min-width: 0; animation: ui-cx-in var(--tc-duration-slow) var(--tc-ease-move); }
.ui-cx__who-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-cx__name { font-size: var(--tc-title-font-size); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-relaxed); letter-spacing: var(--tc-tracking-snug); }
.ui-cx__meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-cx__mark { display: grid; place-items: center; flex: none; font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-cx__mark[data-size="36"] { width: 36px; height: 36px; border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-xl); }
.ui-cx__mark[data-size="20"] { width: 20px; height: 20px; border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-2xs); }
.ui-cx__actions { display: flex; align-items: center; gap: var(--tc-space-2); flex: none; }
.ui-cx__filter-btn[data-active] { --tc-button-fg: var(--tc-accent-text); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected), var(--tc-shadow-control); }
.ui-cx__sync { --tc-button-fg: var(--tc-text-secondary); }
.ui-cx__attach[data-aria-disabled="true"], .ui-cx__add-client[data-aria-disabled="true"] { opacity: 0.4; cursor: default; }
.ui-cx__sync-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--tc-status-success-solid); box-shadow: 0 0 0 3px var(--tc-status-success-bg); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-cx__sync-dot[data-state="syncing"] { background: var(--tc-status-warning-solid); box-shadow: 0 0 0 3px var(--tc-status-warning-bg); }
.ui-cx__spin { display: grid; color: var(--tc-text-muted); }
.ui-cx__spin[data-spinning] .ui-cx__icon { animation: ui-cx-spin var(--tc-duration-reveal-slow) linear infinite; }
@keyframes ui-cx-spin { to { transform: rotate(360deg); } }

/* ---------- Popovers: the menu pattern ---------- */
.ui-cx__pop { position: relative; }
.ui-cx__menu { position: absolute; left: 0; top: calc(100% + var(--tc-space-1-5)); z-index: var(--tc-z-dropdown); min-width: 230px; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); transform-origin: top left; animation: ui-cx-pop var(--tc-duration-base) var(--tc-ease-move); }
.ui-cx__menu--end { left: auto; right: 0; transform-origin: top right; }
@keyframes ui-cx-pop { from { opacity: 0; transform: translateY(-4px) scale(0.97); } }
[data-ui="cx"] .ui-cx__menu-item { display: flex; align-items: center; gap: var(--tc-space-2-5); width: 100%; min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px) 0 var(--tc-space-2); border: 0; border-radius: var(--tc-menu-item-radius); background: transparent; font-size: var(--tc-menu-item-font-size); text-align: left; cursor: pointer; }
[data-ui="cx"] .ui-cx__menu-item:is(:hover, :focus-visible, [data-first]) { background: var(--tc-menu-item-hover); }
[data-ui="cx"] .ui-cx__menu-item:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
/* The current choice: the selected colour, the strong weight and a check */
[data-ui="cx"] .ui-cx__menu-item:is([aria-current="true"], [aria-pressed="true"]) { color: var(--tc-menu-item-selected-fg); font-weight: var(--tc-font-weight-medium); }
.ui-cx__menu-label { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ui-cx__menu-item > .ui-cx__icon { color: var(--tc-text-muted); }
.ui-cx__menu-count { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; }
.ui-cx__menu-check { display: grid; width: 15px; color: var(--tc-menu-item-selected-fg); }
.ui-cx__menu-sep { height: var(--tc-hairline); margin: var(--tc-space-1); background: var(--tc-divider); }
.ui-cx__menu-plus { display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); }
.ui-cx__menu-plus .ui-cx__icon { width: 12px; height: 12px; }
.ui-cx__create { display: flex; gap: var(--tc-space-1-5); padding: var(--tc-space-0-5); }
.ui-cx__create input { flex: 1; min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border: 0; border-radius: var(--tc-control-radius-sm); outline: none; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; }
.ui-cx__create input::placeholder { color: var(--tc-text-placeholder); }
.ui-cx__create input:focus { box-shadow: var(--tc-field-shadow-focus); }

/* ---------- KPI cards ---------- */
.ui-cx__kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--tc-space-1-5); margin-bottom: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *) .ui-cx__kpis { margin: 0 var(--tc-space-4) var(--tc-space-4); gap: var(--tc-space-2); }
[data-ui="cx"] .ui-cx__kpi { display: grid; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-3-5) var(--tc-space-4); border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); text-align: left; cursor: pointer; transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); animation: ui-cx-in var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *) .ui-cx__kpi { border-radius: var(--tc-radius-xl); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-cx__kpi:nth-child(2) { animation-delay: calc(var(--tc-duration-quick) / 2); }
.ui-cx__kpi:nth-child(3) { animation-delay: var(--tc-duration-quick); }
.ui-cx__kpi:nth-child(4) { animation-delay: calc(var(--tc-duration-quick) * 1.5); }
[data-ui="cx"] .ui-cx__kpi:hover { box-shadow: var(--tc-card-shadow-hover); }
.ui-cx__kpi:active { transform: scale(0.98); }
[data-ui="cx"] .ui-cx__kpi[aria-pressed="true"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected), 0 0 0 var(--tc-hairline) var(--tc-border-selected), var(--tc-shadow-control); }
.ui-cx__kpi-label { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-cx__kpi-row { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--tc-space-2); }
.ui-cx__kpi-value { font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-tracking-tight); line-height: var(--tc-line-height-loose); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-cx__spark { display: block; flex: none; width: 56px; height: 22px; overflow: visible; }
.ui-cx__spark[data-wide] { width: 84px; }
.ui-cx__spark path { fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-cx-draw var(--tc-duration-reveal) var(--tc-ease-move) forwards; animation-delay: var(--d, 0ms); }
.ui-cx__spark circle { opacity: 0; animation: ui-cx-fade var(--tc-duration-moderate) var(--tc-ease-standard) forwards; animation-delay: calc(var(--d, 0ms) + var(--tc-duration-slowest)); }
@keyframes ui-cx-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-cx-fade { to { opacity: 1; } }
@keyframes ui-cx-in { from { opacity: 0; transform: translateY(6px); } }

/* ---------- Main card ---------- */
:where([data-look="standard"], [data-look="standard"] *) .ui-cx__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-cx__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cx__toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-cx__seg { min-width: 0; }
.ui-cx__tools { display: flex; align-items: center; gap: var(--tc-space-2); }
/* Search: the field pattern on the sunken fill (it sits in the toolbar) */
.ui-cx__search { display: flex; align-items: center; gap: var(--tc-space-2); width: 220px; height: var(--tc-control-h-md); padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2-5); border-radius: var(--tc-field-radius); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); color: var(--tc-text-muted); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cx__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-cx__search:focus-within { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-cx__search input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; color: var(--tc-text-primary); font: inherit; }
.ui-cx__search input::placeholder { color: var(--tc-text-placeholder); }
[data-ui="cx"] .ui-cx__clear { display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: var(--tc-radius-sm); background: transparent; color: var(--tc-text-muted); cursor: pointer; }
[data-ui="cx"] .ui-cx__clear:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-cx__clear .ui-cx__icon { width: 12px; height: 12px; }
.ui-cx__panel { padding: var(--tc-space-5) var(--tc-space-6) var(--tc-space-6); animation: ui-cx-in var(--tc-duration-slow) var(--tc-ease-move); }

/* ---------- Composer ---------- */
.ui-cx__compose { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: var(--tc-space-3-5); align-items: start; }
.ui-cx__compose > .ui-cx__avatar { margin-top: var(--tc-space-1-5); }
/* The note box is a text field: the field ring, and the focus ring on the whole box */
.ui-cx__composer { position: relative; border-radius: var(--tc-radius-xl); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cx__composer:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-cx__composer:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-cx__composer textarea { display: block; width: 100%; min-height: 62px; max-height: 180px; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-1); border: 0; outline: none; resize: none; background: transparent; color: var(--tc-text-primary); font: inherit; line-height: var(--tc-line-height-normal); field-sizing: content; }
.ui-cx__composer textarea::placeholder { color: var(--tc-text-placeholder); }
.ui-cx__suggest { position: absolute; left: var(--tc-space-2-5); top: calc(100% - 40px); z-index: var(--tc-z-dropdown); min-width: 220px; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-cx-pop var(--tc-duration-fast) var(--tc-ease-move); }
.ui-cx__attached { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-3-5) var(--tc-space-0-5); }
.ui-cx__file-chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); animation: ui-cx-pop var(--tc-duration-base) var(--tc-ease-move); }
[data-ui="cx"] .ui-cx__file-chip button { display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: var(--tc-radius-sm); background: transparent; color: var(--tc-text-muted); cursor: pointer; }
[data-ui="cx"] .ui-cx__file-chip button:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-cx__file-chip .ui-cx__icon { width: 12px; height: 12px; }
.ui-cx__file-chip .ui-cx__file-icon { margin: 0; }
.ui-cx__composer-bar { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2-5); }
.ui-cx__hint { display: inline-flex; gap: var(--tc-space-0-5); margin-left: auto; }
.ui-cx__hint kbd { display: grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); color: var(--tc-kbd-fg); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); }

/* ---------- Timeline ---------- */
.ui-cx__timeline { position: relative; margin-top: var(--tc-space-7); }
/* The rail runs through the middle of the nodes */
.ui-cx__timeline::before { content: ""; position: absolute; left: 13.5px; top: 14px; bottom: 14px; width: var(--tc-hairline); background: var(--tc-divider); }
.ui-cx__item { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: var(--tc-space-3-5); padding-bottom: var(--tc-space-6); }
.ui-cx__item:last-child { padding-bottom: 0; }
.ui-cx__item[data-fresh] { animation: ui-cx-new var(--tc-duration-slowest) var(--tc-ease-move); }
@keyframes ui-cx-new { from { opacity: 0; transform: translateY(-8px); } }
.ui-cx__node { position: relative; z-index: 1; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--tc-surface-raised); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-strong), 0 0 0 5px var(--tc-surface-raised); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *) .ui-cx__node { background: var(--tc-surface-on-tray); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-strong), 0 0 0 5px var(--tc-surface-on-tray); }
.ui-cx__node .ui-cx__icon { width: 13px; height: 13px; }
[data-ui="cx"] .ui-cx__node[data-kind="integration"] { background: transparent; box-shadow: 0 0 0 5px var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *) .ui-cx__node[data-kind="integration"] { box-shadow: 0 0 0 5px var(--tc-surface-on-tray); }
.ui-cx__stripe { display: block; width: 26px; height: 26px; }
.ui-cx__body { min-width: 0; padding-top: var(--tc-space-1); }
.ui-cx__line { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-height: 20px; color: var(--tc-text-secondary); line-height: var(--tc-line-height-normal); }
.ui-cx__line > span:not(.ui-cx__when) { flex: 0 1 auto; min-width: 0; }
.ui-cx__line strong { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-cx__when { flex: none; color: var(--tc-text-muted); white-space: nowrap; }
.ui-cx__when::before { content: "·"; margin-right: var(--tc-space-2); }
[data-ui="cx"] .ui-cx__ref { display: inline; padding: 0; border: 0; background: none; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-decoration: underline; text-decoration-color: var(--tc-border-strong); text-underline-offset: 3px; transition: text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard); }
button.ui-cx__ref { cursor: pointer; }
button.ui-cx__ref:hover { text-decoration-color: currentColor; }
.ui-cx__file { white-space: nowrap; }
.ui-cx__file-icon { display: inline-block; width: 12px; height: 14px; margin: 0 var(--tc-space-1) 0 var(--tc-space-0-5); vertical-align: -2px; }
.ui-cx__file-page { fill: var(--tc-surface-raised); stroke: var(--tc-border-strong); }
.ui-cx__file-fold { fill: none; stroke: var(--tc-border-strong); }
.ui-cx__file-icon[data-type="pdf"] .ui-cx__file-tab { fill: var(--tc-status-danger-solid); }
.ui-cx__file-icon[data-type="xlsx"] .ui-cx__file-tab { fill: var(--tc-status-success-solid); }
.ui-cx__file-icon[data-type="csv"] .ui-cx__file-tab { fill: var(--tc-tone-teal-solid); }
.ui-cx__file-icon[data-type="doc"] .ui-cx__file-tab { fill: var(--tc-accent-solid); }
/* Remove: shows on hover of the entry and on keyboard focus (always on touch screens) */
[data-ui="cx"] .ui-cx__remove { display: grid; place-items: center; flex: none; width: 24px; height: 24px; margin: calc(var(--tc-space-0-5) * -1) 0 0 auto; padding: 0; border: 0; border-radius: var(--tc-radius-sm); background: transparent; color: var(--tc-text-muted); opacity: 0; cursor: pointer; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cx__item:hover .ui-cx__remove, [data-ui="cx"] .ui-cx__remove:focus-visible { opacity: 1; }
@media (hover: none) { [data-ui="cx"] .ui-cx__remove { opacity: 1; } }
[data-ui="cx"] .ui-cx__remove:hover { background: var(--tc-fill-hover); color: var(--tc-status-danger-fg); }
.ui-cx__remove .ui-cx__icon { width: 13px; height: 13px; }
.ui-cx__note { margin-top: var(--tc-space-2-5); padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-xl); background: var(--tc-surface-sunken); box-shadow: var(--tc-shadow-sunken); color: var(--tc-text-secondary); line-height: var(--tc-line-height-normal); }
[data-ui="cx"] .ui-cx__mention { display: inline-flex; align-items: center; gap: var(--tc-space-1); padding: 0 var(--tc-space-1-5) 0 var(--tc-space-1); border: 0; border-radius: var(--tc-radius-sm); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); vertical-align: -1px; white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="cx"] .ui-cx__mention:hover { background: var(--tc-accent-highlight); }
.ui-cx__mention .ui-cx__icon { width: 12px; height: 12px; }
.ui-cx__avatar { display: block; flex: none; border-radius: 50%; object-fit: cover; }
.ui-cx__avatar[data-size="20"] { width: 20px; height: 20px; font-size: var(--tc-font-size-2xs); }
.ui-cx__avatar[data-size="28"] { width: 28px; height: 28px; font-size: var(--tc-font-size-xs); }
.ui-cx__avatar--initial { display: grid; place-items: center; background: var(--tc-fill-default); color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-semibold); }
.ui-cx__empty { margin-top: var(--tc-space-7); padding: var(--tc-space-5); border-radius: var(--tc-radius-xl); background: var(--tc-surface-sunken); box-shadow: var(--tc-shadow-sunken); color: var(--tc-text-muted); text-align: center; }
.ui-cx__empty--flush { margin-top: 0; }
[data-ui="cx"] .ui-cx__empty button { padding: 0; border: 0; background: none; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }

/* ---------- Reports, financials, settings ---------- */
.ui-cx__list { overflow: hidden; border-radius: var(--tc-radius-xl); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-cx__list > li + li { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cx__row { display: flex; align-items: center; gap: var(--tc-space-3-5); min-height: 66px; padding: var(--tc-space-3) var(--tc-space-4); }
.ui-cx__row-main { display: grid; gap: var(--tc-space-0-5); flex: 1; min-width: 0; text-align: left; }
.ui-cx__row-main strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cx__row-main span { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-cx__row-icon { display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-muted); }
.ui-cx__app { display: grid; flex: none; }
.ui-cx__app .ui-cx__stripe { width: 32px; height: 32px; }
[data-ui="cx"] .ui-cx__report-head { display: flex; align-items: center; gap: var(--tc-space-3-5); width: 100%; min-height: 66px; padding: var(--tc-space-3) var(--tc-space-4); border: 0; background: transparent; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="cx"] .ui-cx__report-head:hover { background: var(--tc-fill-hover); }
[data-ui="cx"] .ui-cx__report-head:focus-visible, [data-ui="cx"] .ui-cx__fin button:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-cx__chevron { display: grid; color: var(--tc-text-muted); transition: transform var(--tc-duration-slow) var(--tc-ease-in-out); }
.ui-cx__report[data-open] .ui-cx__chevron { transform: rotate(180deg); }
.ui-cx__report-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-in-out); }
.ui-cx__report[data-open] .ui-cx__report-body { grid-template-rows: 1fr; }
.ui-cx__report-body > div { overflow: hidden; padding: 0 var(--tc-space-4) 0 var(--tc-space-16); }
.ui-cx__report-body p { color: var(--tc-text-secondary); line-height: var(--tc-line-height-normal); }
.ui-cx__report-actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); padding: var(--tc-space-3-5) 0 var(--tc-space-4-5); }
[data-ui="cx"] .ui-cx__fin button { display: flex; align-items: center; gap: var(--tc-space-3-5); width: 100%; min-height: 66px; padding: var(--tc-space-3) var(--tc-space-4); border: 0; background: transparent; cursor: pointer; transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
[data-ui="cx"] .ui-cx__fin button:hover { background: var(--tc-fill-hover); }
/* The open metric: the selected fill and an accent bar at the start (not colour alone) */
[data-ui="cx"] .ui-cx__fin[data-active] button { background: var(--tc-fill-selected); box-shadow: inset 3px 0 0 var(--tc-border-selected); }
.ui-cx__fin-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; }
.ui-cx__fin-value { display: grid; justify-items: end; gap: var(--tc-space-0-5); min-width: 84px; }
.ui-cx__fin-value strong { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; }
.ui-cx__fin-value span { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-cx__fin-value [data-trend="up"] { color: var(--tc-status-success-fg); }
.ui-cx__fin-value [data-trend="down"] { color: var(--tc-tone-rose-fg); }
/* Switch: the switch tokens */
[data-ui="cx"] .ui-cx__toggle { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); padding: 0; border: 0; border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); cursor: pointer; transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-cx__toggle span { position: absolute; left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
[data-ui="cx"] .ui-cx__toggle[aria-checked="true"] { background: var(--tc-switch-on); }
.ui-cx__toggle[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
[data-ui="cx"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }

/* ---------- Narrow ---------- */
@container (max-width: 680px) {
  .ui-cx__head { flex-wrap: wrap; }
  .ui-cx__actions { width: 100%; }
  .ui-cx__actions > .ui-cx__pop { margin-left: auto; }
  .ui-cx__kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-cx__toolbar { flex-direction: column; align-items: stretch; }
  .ui-cx__tools { width: 100%; }
  .ui-cx__search { flex: 1; width: auto; }
  .ui-cx__panel { padding: var(--tc-space-4-5) var(--tc-space-4) var(--tc-space-5); }
  .ui-cx__hint { display: none; }
  .ui-cx__composer-bar .ui-cx__add { margin-left: auto; }
  .ui-cx__fin .ui-cx__spark { display: none; }
  .ui-cx__report-body > div { padding-left: var(--tc-space-4); }
  /* The time drops to its own line under the name, so long file names keep their room */
  .ui-cx__line { flex-wrap: wrap; row-gap: var(--tc-space-0-5); }
  .ui-cx__line > span:not(.ui-cx__when) { flex: 1 1 calc(100% - 28px); }
  .ui-cx__when { order: 3; margin-left: var(--tc-space-7); }
  .ui-cx__when::before { content: none; }
  .ui-cx__file { white-space: normal; }
}

@media (prefers-reduced-motion: reduce) {
  [data-ui="cx"] *, [data-ui="cx"] *::before, [data-ui="cx"] *::after { animation-duration: 1ms !important; animation-delay: 0ms !important; transition-duration: 1ms !important; }
}
@media (forced-colors: active) {
  .ui-cx__sync-dot, .ui-cx__fin-dot { background: CanvasText; }
  [data-ui="cx"] .ui-cx__kpi[aria-pressed="true"], [data-ui="cx"] .ui-cx__fin[data-active] button { outline: 2px solid Highlight; }
}
/* Text fields show their focus with the field ring on their box (above), not a second outline */
[data-ui="cx"] :is(.ui-cx__search input, .ui-cx__composer textarea, .ui-cx__create input):focus-visible { outline: none; }
`;
}

if (!customElements.get("tc-client-context")) customElements.define("tc-client-context", TcClientContext);
declare global {
  interface HTMLElementTagNameMap {
    "tc-client-context": TcClientContext;
  }
}
