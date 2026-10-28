import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, RowWindowController } from "./internal/controllers";
import { compact } from "./internal/format";

/*
 * <tc-knowledge-source-manager> – the sources a knowledge base answers from: files, sites and connectors, each with
 * where its ingestion stands (queued, indexing with progress, ready, paused, or failed with the reason), how many
 * documents and chunks it holds, when it last synced and how often it syncs, and a warning when the app flags it as
 * stale or as a duplicate of another source.
 *   · the list is a listbox – selection follows focus – and the picked source opens beside it (below it when narrow)
 *     with its facts, its warnings explained, the sync schedule, and Review chunks · Resync · Pause · Remove
 *   · Remove asks first, in place, and says what leaves the index; Cancel or Escape puts focus back on Remove
 *   · All / Needs attention narrows the list to the failed, stale and duplicate sources
 *   · long lists render only the rows near the scroll position (thousands of sources stay fast)
 * The element ingests nothing: Add, Resync, Pause and Review chunks are events the app acts on, and it reports back
 * through `sources`. Removing a source and changing its schedule change `sources` (cancelable).
 * Keyboard: ↑ ↓ Home End Page Up / Page Down move through the list and pick; Delete asks to remove the picked source;
 * Escape closes it. Standard is a gray tray holding the header and Add source, with the list on a white card; Clean is
 * one white card with hairline dividers, quieter pills and thinner icons.
 *
 *   <tc-knowledge-source-manager .sources=${sources} now=${today}></tc-knowledge-source-manager>
 */

export type KnowledgeSourceState = "queued" | "indexing" | "ready" | "paused" | "failed";
export type KnowledgeSource = {
  id: string;
  /** "Help centre", "Pricing.pdf" */
  name: string;
  /** "file", "site" or "connector" pick the icon; any other word gets a generic one */
  kind?: string;
  /** Where it comes from: a path, a URL, a workspace – shown under the name when picked */
  location?: string;
  state: KnowledgeSourceState;
  /** How far indexing has got, 0–1 */
  progress?: number;
  /** Why it failed, in a sentence */
  error?: string;
  /** How many documents it holds */
  docs?: number;
  /** How many chunks those documents became */
  chunks?: number;
  /** When it last synced: a Date or epoch ms (relative to `now` when set), or text as it is */
  lastSync?: Date | number | string;
  /** The id of its sync schedule, one of `schedules` */
  schedule?: string;
  /** The app flags it as stale: true, or the reason ("The site changed 40 pages since") */
  stale?: boolean | string;
  /** The app flags it as covering the same documents as another source: that source's id, or a name */
  duplicateOf?: string;
};
export type KnowledgeSchedule = { id: string; label: string };
export type KnowledgeShow = "all" | "attention";
export type KnowledgeSourcesChange = { sources: KnowledgeSource[]; change: { type: "remove" | "schedule"; source: KnowledgeSource } };
export type KnowledgeSourceEvent = { source: KnowledgeSource };
export type KnowledgePauseEvent = { source: KnowledgeSource; paused: boolean };
export type KnowledgeSelectedChange = { selected: string | null; source?: KnowledgeSource };
export type KnowledgeShowChange = { show: KnowledgeShow };

export const KNOWLEDGE_SCHEDULES: KnowledgeSchedule[] = [
  { id: "manual", label: "Manually" },
  { id: "hourly", label: "Every hour" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
];
const STATE_LABEL: Record<KnowledgeSourceState, string> = { queued: "Queued", indexing: "Indexing", ready: "Ready", paused: "Paused", failed: "Failed" };

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const needsAttention = (s: KnowledgeSource) => s.state === "failed" || !!s.stale || !!s.duplicateOf;
const pct = (p: number | undefined) => Math.round(Math.max(0, Math.min(1, p ?? 0)) * 100);
const DATE = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
/** "2h ago" against `now`; without it the date */
function when(at: KnowledgeSource["lastSync"], now?: number) {
  if (at === undefined || at === "") return "";
  if (typeof at === "string") return at;
  const t = typeof at === "number" ? at : at.getTime();
  if (now === undefined) return DATE.format(t);
  const min = Math.max(0, Math.round((now - t) / 60000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} ${d === 1 ? "day" : "days"} ago` : DATE.format(t);
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (body: TemplateResult, cls = "ui-ksm__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const KIND_PATHS: Record<string, TemplateResult> = {
  file: svg`<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5M9 13h6M9 17h4"></path>`,
  site: svg`<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path>`,
  connector: svg`<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"></path>`,
  other: svg`<ellipse cx="12" cy="5.5" rx="8" ry="3"></ellipse><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"></path>`,
};
const kindIcon = (kind?: string) => glyph(KIND_PATHS[kind ?? "file"] ?? KIND_PATHS.other, "ui-ksm__kind-svg");
const mark = svg`<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="M9 7h7M9 11h5"></path>`;
const plus = () => glyph(svg`<path d="M12 5v14M5 12h14"></path>`);
const cross = () => glyph(svg`<path d="M7 7l10 10M17 7 7 17"></path>`);
const sync = () => glyph(svg`<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"></path><path d="M19 3v4.5h-4.5M5 21v-4.5h4.5"></path>`);
const pause = () => glyph(svg`<path d="M9 5v14M15 5v14"></path>`);
const play = () => glyph(svg`<path d="M7 4.5v15l12-7.5z"></path>`);
const trash = () => glyph(svg`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"></path>`);
const layers = () => glyph(svg`<path d="m12 3 9 5-9 5-9-5z"></path><path d="m3 13 9 5 9-5"></path>`);
const warn = () => glyph(svg`<path d="M12 9v4M12 16.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>`);
const copies = () => glyph(svg`<rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>`);

/** The state's icon: a check, a ring that fills while indexing, a clock, two bars, an alert */
const RING = 2 * Math.PI * 7;
function stateIcon(s: KnowledgeSource) {
  const body =
    s.state === "ready"
      ? svg`<circle cx="10" cy="10" r="7.5"></circle><path d="m6.75 10.25 2.25 2.25 4.25-4.75"></path>`
      : s.state === "failed"
        ? svg`<circle cx="10" cy="10" r="7.5"></circle><path d="M10 6.25v4.5M10 13.5h.01"></path>`
        : s.state === "paused"
          ? svg`<circle cx="10" cy="10" r="7.5"></circle><path d="M8.25 7.25v5.5M11.75 7.25v5.5"></path>`
          : s.state === "queued"
            ? svg`<circle cx="10" cy="10" r="7.5" stroke-dasharray="2.4 2.6"></circle><path d="M10 6.75V10l2 1.5"></path>`
            : svg`<circle class="ui-ksm__ring-track" cx="10" cy="10" r="7"></circle><circle class="ui-ksm__ring" cx="10" cy="10" r="7" stroke-dasharray=${RING} stroke-dashoffset=${RING * (1 - pct(s.progress) / 100)}></circle>`;
  return html`<svg class="ui-ksm__state-icon" viewBox="0 0 20 20" aria-hidden="true">${body}</svg>`;
}

const VIRTUAL_FROM = 60;
const OVERSCAN = 16;
const ROW = 60;
const PAGE = 8;

let instances = 0;

/**
 * The sources a knowledge base answers from – ingestion state and progress, documents and chunks, last sync and
 * schedule, stale and duplicate warnings – with add, resync, pause, remove and a handoff to chunk review.
 * @tag tc-knowledge-source-manager
 * @fires tc-sources-change - A source was removed or its schedule changed ({ sources, change: { type, source } }: KnowledgeSourcesChange); cancelable – prevent it to control `sources`
 * @fires tc-selected-change - A source was picked or the open one closed ({ selected, source }: KnowledgeSelectedChange); cancelable
 * @fires tc-show-change - All or Needs attention was picked ({ show }: KnowledgeShowChange); cancelable
 * @fires tc-add - Add source was pressed – open your own picker; detail: null
 * @fires tc-resync - Resync (or Retry, for a failed source) was pressed ({ source }: KnowledgeSourceEvent)
 * @fires tc-pause - Pause or Resume was pressed ({ source, paused }: KnowledgePauseEvent – `paused` is what was asked for)
 * @fires tc-review-chunks - Review chunks was pressed – open your chunk review for the source ({ source }: KnowledgeSourceEvent)
 */
export class TcKnowledgeSourceManager extends TcElement {
  static override ui = "ksm";

  /** The heading */
  @property() accessor heading = "Knowledge sources";
  /** The sources. Changed by the user (remove, schedule) unless a tc-sources-change listener calls preventDefault() */
  @property({ attribute: false }) accessor sources: KnowledgeSource[] = [];
  /** The sync schedules a source can be set to */
  @property({ attribute: false }) accessor schedules: KnowledgeSchedule[] = KNOWLEDGE_SCHEDULES;
  /** The id of the open source, or null */
  @property() accessor selected: string | null = null;
  /** Which sources show: "all", or "attention" – the failed, stale and duplicate ones */
  @property() accessor show: KnowledgeShow = "all";
  /** The moment last syncs are counted to, in epoch ms; unset shows their dates */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The Add source button's text */
  @property({ attribute: "add-label" }) accessor addLabel = "Add source";
  /** Hides Add source, for a read-only view */
  @property({ type: Boolean, attribute: "no-add" }) accessor noAdd = false;
  /** Hides Review chunks, when the app has no chunk review */
  @property({ type: Boolean, attribute: "no-review" }) accessor noReview = false;
  /** The list's height before it scrolls, in px */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 420;

  /** @internal The keyboard's place in the list (shown rows), or -1 */
  @state() accessor active = -1;
  /** @internal The id of the source being confirmed for removal */
  @state() accessor confirming: string | null = null;
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-ksm${++instances}`;
  private view: KnowledgeSource[] = [];
  private byId = new Map<string, KnowledgeSource>();
  private seen = new Map<string, KnowledgeSourceState>();
  private readonly window = new RowWindowController(this, {
    count: () => this.view.length,
    body: () => this.querySelector(".ui-ksm__rows"),
    rowSelector: ".ui-ksm__row",
    from: VIRTUAL_FROM,
    overscan: OVERSCAN,
    rowHeight: ROW,
  });

  constructor() {
    super();
    // Closing or removing the open source never drops focus to <body>
    new FocusRescueController(this, () => (this.view.length ? this.list : this.querySelector(".ui-ksm__add")));
  }

  /** @internal */
  private get list() {
    return this.querySelector<HTMLElement>(".ui-ksm__list");
  }
  /** @internal */
  private get open() {
    return this.selected ? this.byId.get(this.selected) : undefined;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("sources")) {
      this.byId = new Map(this.sources.map((s) => [s.id, s]));
      // Say when a source the list already had finishes or fails
      const said: string[] = [];
      for (const s of this.sources) {
        const was = this.seen.get(s.id);
        if (was && was !== s.state && (s.state === "ready" || s.state === "failed")) said.push(s.state === "ready" ? `${s.name} is ready` : `${s.name} failed${s.error ? `: ${s.error}` : ""}`);
      }
      this.seen = new Map(this.sources.map((s) => [s.id, s.state]));
      if (said.length) this.spoken = said.join(". ");
      if (this.confirming && !this.byId.has(this.confirming)) this.confirming = null;
    }
    if (changed.has("sources") || changed.has("show")) {
      this.view = this.show === "attention" ? this.sources.filter(needsAttention) : this.sources;
      const at = this.selected ? this.view.findIndex((s) => s.id === this.selected) : -1;
      this.active = at >= 0 ? at : Math.min(this.active, this.view.length - 1);
    }
    if (changed.has("selected") && this.confirming && this.confirming !== this.selected) this.confirming = null;
    this.window.compute();
  }

  protected override updated() {
    // An option outside the rendered rows has no id to point at until the window reaches it
    if (this.active >= 0 && this.window.virtual && !this.querySelector(`#${this.uid}-o${this.active}`)) this.window.reveal(this.active);
  }

  /* ---------- Actions ---------- */

  /** @internal */
  private select(id: string | null) {
    if (id === this.selected) return;
    const source = id ? this.byId.get(id) : undefined;
    if (this.emit<KnowledgeSelectedChange>("tc-selected-change", { selected: id, ...(source ? { source } : {}) }, { cancelable: true })) this.selected = id;
  }

  /** @internal */
  private setShow(show: KnowledgeShow, focus = false) {
    if (show !== this.show && this.emit<KnowledgeShowChange>("tc-show-change", { show }, { cancelable: true })) this.show = show;
    void this.updateComplete.then(() => {
      this.spoken = `${show === "all" ? "All" : "Needs attention"}: ${plural(this.view.length, "source")}`;
      if (focus) this.querySelector<HTMLElement>(`.ui-ksm__show [aria-checked="true"]`)?.focus();
    });
  }

  /** @internal */
  private change(sources: KnowledgeSource[], type: "remove" | "schedule", source: KnowledgeSource) {
    const ok = this.emit<KnowledgeSourcesChange>("tc-sources-change", { sources, change: { type, source } }, { cancelable: true });
    if (ok) this.sources = sources;
    else this.requestUpdate();
    return ok;
  }

  /** @internal */
  private ask(source: KnowledgeSource) {
    this.confirming = source.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ksm__cancel")?.focus());
  }

  /** @internal */
  private cancel() {
    this.confirming = null;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-ksm__remove")?.focus());
  }

  /** @internal */
  private removeSource(source: KnowledgeSource) {
    const at = this.view.findIndex((s) => s.id === source.id);
    const next = this.view[at + 1] ?? this.view[at - 1];
    if (!this.change(this.sources.filter((s) => s.id !== source.id), "remove", source)) {
      this.confirming = null;
      return;
    }
    this.confirming = null;
    this.spoken = `Removed ${source.name}`;
    this.select(next?.id ?? null);
    void this.updateComplete.then(() => (this.view.length ? this.list : this.querySelector<HTMLElement>(".ui-ksm__add"))?.focus());
  }

  /** @internal Scrolls the list so a row is in view, and moves the window there */
  private reveal(i: number) {
    const list = this.list;
    if (!list) return;
    const h = this.window.rowHeight;
    if (i * h < list.scrollTop) list.scrollTop = i * h;
    else if ((i + 1) * h > list.scrollTop + list.clientHeight) list.scrollTop = (i + 1) * h - list.clientHeight;
    this.window.reveal(i);
  }

  /** @internal APG listbox, selection follows focus: ↑ ↓ Home End Page Up / Down; Delete asks to remove; Esc closes */
  private onListKey = (e: KeyboardEvent) => {
    const n = this.view.length;
    if (!n) return;
    if (e.key === "Escape") {
      if (this.selected) {
        e.preventDefault();
        this.select(null);
      }
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      const s = this.view[this.active];
      if (!s) return;
      e.preventDefault();
      this.select(s.id);
      if (this.selected === s.id) this.ask(s);
      return;
    }
    const at = this.active;
    const moves: Record<string, number> = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: n - 1, PageDown: at + PAGE, PageUp: at - PAGE };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = at < 0 && e.key !== "End" ? 0 : Math.max(0, Math.min(n - 1, moves[e.key]));
    this.active = next;
    this.reveal(next);
    this.select(this.view[next].id);
  };

  /** @internal APG radio group: arrows move and pick */
  private onShowKey = (e: KeyboardEvent) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    this.setShow(this.show === "all" ? "attention" : "all", true);
  };

  /* ---------- Rendering ---------- */

  /** @internal */
  private scheduleLabel(s: KnowledgeSource) {
    return s.schedule ? (this.schedules.find((x) => x.id === s.schedule)?.label ?? s.schedule) : "";
  }

  /** @internal "Help centre" for a duplicate's id, or the text as given */
  private duplicateName(s: KnowledgeSource) {
    return s.duplicateOf ? (this.byId.get(s.duplicateOf)?.name ?? s.duplicateOf) : "";
  }

  /** @internal The state as a pill: "Indexing 42%", "Failed" */
  private pill(s: KnowledgeSource) {
    const text = s.state === "indexing" && s.progress !== undefined ? `${STATE_LABEL.indexing} ${pct(s.progress)}%` : STATE_LABEL[s.state];
    return html`<span class="ui-ksm__state" data-state=${s.state}>${stateIcon(s)}<span class="ui-ksm__state-text">${text}</span></span>`;
  }

  /** @internal "1,204 docs · 18.3k chunks · Synced 2h ago · Daily" */
  private meta(s: KnowledgeSource) {
    const parts = [
      s.docs !== undefined ? plural(s.docs, "doc") : "",
      s.chunks !== undefined ? `${compact(s.chunks)} chunks` : "",
      s.lastSync !== undefined && s.lastSync !== "" ? `Synced ${when(s.lastSync, this.now)}` : s.state === "queued" || s.state === "indexing" ? "" : "Never synced",
      this.scheduleLabel(s),
    ].filter(Boolean);
    return parts.join(" · ");
  }

  /** @internal One source's row */
  private row(s: KnowledgeSource, i: number) {
    const failed = s.state === "failed";
    return html`<div
      class="ui-ksm__row"
      role="option"
      id=${`${this.uid}-o${i}`}
      aria-selected=${s.id === this.selected ? "true" : "false"}
      aria-posinset=${i + 1}
      aria-setsize=${this.view.length}
      data-state=${s.state}
      ?data-active=${i === this.active}
      @click=${() => {
        this.active = i;
        this.select(s.id);
      }}
    >
      <span class="ui-ksm__kind" data-kind=${s.kind ?? "file"}>${kindIcon(s.kind)}</span>
      <span class="ui-ksm__line">
        <span class="ui-ksm__name">${s.name}</span>
        ${s.stale ? html`<span class="ui-ksm__flag" data-flag="stale"><span class="ui-ksm__sr">, </span>Stale</span>` : nothing}
        ${s.duplicateOf ? html`<span class="ui-ksm__flag" data-flag="duplicate"><span class="ui-ksm__sr">, </span>Duplicate</span>` : nothing}
      </span>
      <span class="ui-ksm__side"><span class="ui-ksm__sr">, </span>${this.pill(s)}</span>
      <span class="ui-ksm__meta" ?data-failed=${failed}><span class="ui-ksm__sr">. </span>${failed && s.error ? s.error : this.meta(s)}</span>
      ${s.state === "indexing" ? html`<span class="ui-ksm__bar" aria-hidden="true"><span style=${styleMap({ width: `${pct(s.progress)}%` })}></span></span>` : nothing}
    </div>`;
  }

  /** @internal The open source in full */
  private detail() {
    const s = this.open;
    if (!s) return nothing;
    const titleId = `${this.uid}-src`;
    const busy = s.state === "indexing" || s.state === "queued";
    const confirming = this.confirming === s.id;
    const knownSchedule = this.schedules.some((x) => x.id === s.schedule);
    const stale = typeof s.stale === "string" ? s.stale : "It hasn't synced in a while, so answers may miss recent changes. Resync to catch up.";
    return html`<section
      class="ui-ksm__detail"
      aria-labelledby=${titleId}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        if (this.confirming) this.cancel();
        else {
          this.select(null);
          this.list?.focus();
        }
      }}
    >
      <div class="ui-ksm__detail-head">
        <span class="ui-ksm__kind" data-kind=${s.kind ?? "file"}>${kindIcon(s.kind)}</span>
        <span class="ui-ksm__detail-titles">
          <h4 class="ui-ksm__detail-title" id=${titleId}>${s.name}</h4>
          ${s.location ? html`<span class="ui-ksm__location">${s.location}</span>` : nothing}
        </span>
        <button type="button" class="ui-ksm__icon-btn ui-ksm__close" aria-label="Close source" title="Close" @click=${() => {
          this.select(null);
          this.list?.focus();
        }}>${cross()}</button>
      </div>
      <div class="ui-ksm__status">
        ${this.pill(s)}
        ${s.state === "indexing"
          ? html`<span class="ui-ksm__progress" role="progressbar" aria-label=${`Indexing ${s.name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct(s.progress)}><span style=${styleMap({ width: `${pct(s.progress)}%` })}></span></span>`
          : nothing}
        ${s.state === "failed" && s.error ? html`<p class="ui-ksm__error">${s.error}</p>` : nothing}
        ${s.state === "paused" ? html`<p class="ui-ksm__hint">Paused – it keeps its chunks but doesn't sync until resumed.</p>` : nothing}
        ${s.state === "queued" ? html`<p class="ui-ksm__hint">Waiting for a free indexer.</p>` : nothing}
      </div>
      <dl class="ui-ksm__facts">
        <div class="ui-ksm__fact"><dt>Documents</dt><dd>${s.docs !== undefined ? s.docs.toLocaleString("en-US") : "–"}</dd></div>
        <div class="ui-ksm__fact"><dt>Chunks</dt><dd>${s.chunks !== undefined ? s.chunks.toLocaleString("en-US") : "–"}</dd></div>
        <div class="ui-ksm__fact"><dt>Last sync</dt><dd>${s.lastSync !== undefined && s.lastSync !== "" ? when(s.lastSync, this.now) : "Never"}</dd></div>
        <div class="ui-ksm__fact">
          <dt id=${`${this.uid}-sched`}>Syncs</dt>
          <dd><span class="ui-ksm__select"><select
            class="ui-ksm__input"
            aria-labelledby=${`${this.uid}-sched`}
            @change=${(e: Event) => {
              const id = (e.target as HTMLSelectElement).value;
              const next = { ...s, schedule: id };
              this.change(this.sources.map((x) => (x.id === s.id ? next : x)), "schedule", next);
            }}
          >
            ${knownSchedule ? nothing : html`<option value="" .selected=${live(true)} disabled>Pick a schedule</option>`}
            ${this.schedules.map((x) => html`<option value=${x.id} .selected=${live(x.id === s.schedule)}>${x.label}</option>`)}
          </select><svg class="ui-ksm__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg></span></dd>
        </div>
      </dl>
      ${s.stale || s.duplicateOf
        ? html`<ul class="ui-ksm__warnings">
            ${s.stale ? html`<li class="ui-ksm__warning" data-flag="stale">${warn()}<span><strong>Stale.</strong> ${stale}</span></li>` : nothing}
            ${s.duplicateOf
              ? html`<li class="ui-ksm__warning" data-flag="duplicate">${copies()}<span><strong>Duplicate.</strong> It covers the same documents as ${this.duplicateName(s)}, so answers can cite both. Keep one.</span></li>`
              : nothing}
          </ul>`
        : nothing}
      ${confirming
        ? html`<div class="ui-ksm__confirm" role="group" aria-labelledby=${`${this.uid}-ask`}>
            <p class="ui-ksm__ask" id=${`${this.uid}-ask`}>Remove ${s.name}? ${s.chunks ? `Its ${plural(s.chunks, "chunk")} leave the index` : "It leaves the index"} and answers stop citing it.</p>
            <div class="ui-ksm__actions">
              <button type="button" class="ui-ksm__btn ui-ksm__cancel" @click=${() => this.cancel()}>Cancel</button>
              <button type="button" class="ui-ksm__btn ui-ksm__btn--danger ui-ksm__confirm-btn" @click=${() => this.removeSource(s)}>${trash()}Remove source</button>
            </div>
          </div>`
        : html`<div class="ui-ksm__actions">
            ${this.noReview ? nothing : html`<button type="button" class="ui-ksm__btn ui-ksm__review" ?disabled=${!s.chunks} @click=${() => this.emit<KnowledgeSourceEvent>("tc-review-chunks", { source: s })}>${layers()}Review chunks</button>`}
            <button type="button" class="ui-ksm__btn ui-ksm__resync" ?disabled=${busy} @click=${() => this.emit<KnowledgeSourceEvent>("tc-resync", { source: s })}>${sync()}${s.state === "failed" ? "Retry" : "Resync"}</button>
            <button type="button" class="ui-ksm__btn ui-ksm__pause" @click=${() => this.emit<KnowledgePauseEvent>("tc-pause", { source: s, paused: s.state !== "paused" })}>${s.state === "paused" ? html`${play()}Resume` : html`${pause()}Pause`}</button>
            <button type="button" class="ui-ksm__btn ui-ksm__btn--ghost ui-ksm__remove" aria-label=${`Remove ${s.name}`} @click=${() => this.ask(s)}>${trash()}Remove</button>
          </div>`}
    </section>`;
  }

  protected override render() {
    const view = this.view;
    const { start, end } = this.window;
    const h = this.window.rowHeight;
    const titleId = `${this.uid}-title`;
    const activeId = this.active >= start && this.active < end ? `${this.uid}-o${this.active}` : undefined;
    const all = this.sources;
    const attention = all.filter(needsAttention).length;
    const chunks = all.reduce((n, s) => n + (s.chunks ?? 0), 0);
    const indexing = all.filter((s) => s.state === "indexing" || s.state === "queued").length;
    const sub = [plural(all.length, "source"), chunks ? `${compact(chunks)} chunks` : "", indexing ? `${indexing} indexing` : ""].filter(Boolean).join(" · ");
    const shows: [KnowledgeShow, string, number][] = [
      ["all", "All", all.length],
      ["attention", "Needs attention", attention],
    ];
    // The header (.tc-head): on the tray above the card in Standard, the card's first row in Clean
    return html`
      ${cardHead({
        icon: mark,
        title: this.heading,
        id: titleId,
        subtitle: all.length ? sub : undefined,
        aside: this.noAdd ? undefined : html`<button type="button" class="ui-ksm__btn ui-ksm__add" @click=${() => this.emit("tc-add", null)}>${plus()}${this.addLabel}</button>`,
      })}
      <div class="ui-ksm__card">
        ${all.length
          ? html`<div class="ui-ksm__filters">
              <div class="ui-ksm__show" role="radiogroup" aria-label="Show" @keydown=${this.onShowKey}>
                ${shows.map(
                  ([s, label, n]) => html`<button type="button" role="radio" class="ui-ksm__opt" data-show=${s} aria-checked=${s === this.show ? "true" : "false"} tabindex=${s === this.show ? 0 : -1} @click=${() => this.setShow(s)}>
                    ${label}<span class="ui-ksm__count" ?data-alert=${s === "attention" && n > 0}><span class="ui-ksm__sr">, </span>${n}</span>
                  </button>`,
                )}
              </div>
            </div>`
          : nothing}
        <div class="ui-ksm__main" ?data-open=${!!this.open}>
          <div
            class="ui-ksm__list"
            role=${ifDefined(view.length ? "listbox" : undefined)}
            aria-labelledby=${ifDefined(view.length ? titleId : undefined)}
            aria-activedescendant=${ifDefined(activeId)}
            tabindex=${ifDefined(view.length ? 0 : undefined)}
            style=${styleMap({ maxHeight: `${this.maxHeight}px` })}
            @keydown=${this.onListKey}
            @focus=${() => {
              if (this.active < 0 && view.length) this.active = 0;
            }}
          >
            <div class="ui-ksm__rows">
              <div class="ui-ksm__spacer" aria-hidden="true" style=${styleMap({ height: `${start * h}px` })}></div>
              ${repeat(view.slice(start, end), (s) => s.id, (s, k) => this.row(s, start + k))}
              <div class="ui-ksm__spacer" aria-hidden="true" style=${styleMap({ height: `${(view.length - end) * h}px` })}></div>
            </div>
            ${view.length === 0
              ? html`<p class="ui-ksm__empty">${all.length ? "Nothing needs attention – every source is synced and unique." : "No sources yet. Add files, a site or a connector to answer from."}</p>`
              : nothing}
          </div>
          ${this.detail()}
        </div>
      </div>
      <span class="ui-ksm__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="ksm"] {
  --tc-knowledge-source-manager-row: 60px;
  --tc-knowledge-source-manager-side: 340px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-ksm / inline-size;
}
/* Clean: no tray – one white card with hairline dividers */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ksm"] { padding: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="ksm"] *, [data-ui="ksm"] *::before, [data-ui="ksm"] *::after { box-sizing: border-box; }
[data-ui="ksm"] svg { display: block; flex: none; }
[data-ui="ksm"] :is(p, h4, dl, dd, ul) { margin: 0; }
[data-ui="ksm"] ul { padding: 0; list-style: none; }
:where([data-ui="ksm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ksm"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ksm"] button:disabled { cursor: not-allowed; opacity: 0.55; }
.ui-ksm__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-ksm__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-ksm__glyph { stroke-width: 1.6; }

/* ----- The header on the tray: the title, what's there, and Add source ----- */
/* ----- Buttons: secondary, small; danger and ghost ----- */
.ui-ksm__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ksm__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ksm__btn--danger { background: var(--tc-action-danger-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-danger-fg); }
.ui-ksm__btn--danger:hover:not(:disabled) { background: var(--tc-action-danger-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-ksm__btn--ghost { background: none; box-shadow: none; color: var(--tc-status-danger-fg); }
.ui-ksm__btn--ghost:hover:not(:disabled) { background: var(--tc-status-danger-bg); box-shadow: none; }
.ui-ksm__icon-btn { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); }
[data-ui="ksm"] .ui-ksm__icon-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* ----- The card: the filter, the list and the open source ----- */
.ui-ksm__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ksm__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-ksm__filters { display: flex; align-items: center; padding: var(--tc-space-2-5) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-ksm__show { display: flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-ksm__opt { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="ksm"] .ui-ksm__opt:hover { color: var(--tc-text-primary); }
[data-ui="ksm"] .ui-ksm__opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-ksm__count { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; }
.ui-ksm__count[data-alert] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-ksm__main { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-ksm__list { position: relative; overflow: auto; overscroll-behavior: contain; overflow-anchor: none; outline: none; }
.ui-ksm__list:focus-visible:not(:has([data-active])) { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-ksm__spacer { display: block; }
/* One source: kind · name and flags · state on the first line; the counts and sync (or the failure) on the second */
.ui-ksm__row { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; grid-template-rows: auto auto; align-content: center; column-gap: var(--tc-space-3); row-gap: var(--tc-space-0-5); height: var(--tc-knowledge-source-manager-row); padding: 0 var(--tc-space-4) 0 var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-border-subtle); cursor: pointer; }
[data-ui="ksm"] .ui-ksm__row:hover { background: var(--tc-fill-subtle); }
.ui-ksm__row[aria-selected="true"], [data-ui="ksm"] .ui-ksm__row[aria-selected="true"]:hover { background: var(--tc-fill-selected); }
.ui-ksm__row[aria-selected="true"] .ui-ksm__meta:not([data-failed]) { color: var(--tc-text-secondary); }
.ui-ksm__list:focus-visible .ui-ksm__row[data-active] { border-radius: var(--tc-radius-sm); outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-ksm__kind { display: grid; grid-row: 1 / 3; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ksm__kind { border-radius: var(--tc-radius-sm); background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-icon-muted); }
.ui-ksm__kind[data-kind="site"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-ksm__kind[data-kind="connector"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ksm__kind:is([data-kind="site"], [data-kind="connector"]) { background: none; }
.ui-ksm__kind-svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-ksm__kind-svg { stroke-width: 1.35; }
.ui-ksm__line { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; white-space: nowrap; }
.ui-ksm__name { flex: 0 1 auto; min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-overflow: ellipsis; }
.ui-ksm__flag { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); }
.ui-ksm__flag[data-flag="duplicate"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-ksm__side { display: flex; grid-row: 1 / 3; grid-column: 3; align-items: center; }
.ui-ksm__meta { grid-column: 2; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-ksm__meta[data-failed] { color: var(--tc-status-danger-fg); }
/* The state: a pill with a dot */
.ui-ksm__state { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-ksm__state-icon { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ui-ksm__ring-track { stroke: currentColor; opacity: 0.25; }
.ui-ksm__ring { transform: rotate(-90deg); transform-origin: center; stroke-width: 2.2; transition: stroke-dashoffset var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-ksm__state[data-state="ready"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-ksm__state[data-state="indexing"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-ksm__state[data-state="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ksm__state[data-state] { gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0; background: none; font-weight: var(--tc-font-weight-regular); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ksm__state-icon { stroke-width: 1.35; }
/* Indexing: a hairline of progress along the row's foot */
.ui-ksm__bar { position: absolute; right: var(--tc-space-4); bottom: 0; left: var(--tc-space-3); height: 2px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-ksm__bar > span, .ui-ksm__progress > span { display: block; height: 100%; border-radius: inherit; background: var(--tc-status-info-solid); transition: width var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-ksm__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- The open source ----- */
.ui-ksm__detail { display: grid; align-content: start; gap: var(--tc-space-3); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-ksm__detail-head { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); min-width: 0; }
.ui-ksm__detail-titles { display: grid; flex: 1; min-width: 0; }
.ui-ksm__detail-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-strong); overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-ksm__detail-title { font-weight: var(--tc-font-weight-medium); }
.ui-ksm__location { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); overflow-wrap: anywhere; }
.ui-ksm__close { margin: calc(-1 * var(--tc-space-1)) calc(-1 * var(--tc-space-1-5)) 0 0; }
.ui-ksm__status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-ksm__progress { flex: 1 1 120px; height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-ksm__error { flex: 1 1 100%; color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-ksm__hint { flex: 1 1 100%; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-ksm__facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-2-5) var(--tc-space-4); }
.ui-ksm__fact { display: grid; align-content: start; gap: var(--tc-space-0-5); min-width: 0; }
.ui-ksm__fact dt { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-ksm__fact dd { min-width: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-ksm__select { position: relative; display: block; max-width: 180px; }
.ui-ksm__input { width: 100%; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-space-7) 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); appearance: none; cursor: pointer; text-overflow: ellipsis; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ksm__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ksm__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-ksm__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-ksm__warnings { display: grid; gap: var(--tc-space-1-5); }
.ui-ksm__warning { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-ksm__warning > svg { margin-top: var(--tc-space-0-5); color: var(--tc-status-warning-fg); }
.ui-ksm__warning[data-flag="duplicate"] { background: var(--tc-status-info-bg); }
.ui-ksm__warning[data-flag="duplicate"] > svg { color: var(--tc-status-info-fg); }
.ui-ksm__warning strong { font-weight: var(--tc-font-weight-semibold); }
.ui-ksm__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); }
.ui-ksm__remove { margin-left: auto; }
.ui-ksm__confirm { display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); }
.ui-ksm__ask { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-ksm__confirm .ui-ksm__actions { justify-content: flex-end; }
/* Wide: the open source beside the list */
@container ui-ksm (min-width: 760px) {
  .ui-ksm__main[data-open] { grid-template-columns: minmax(0, 1fr) var(--tc-knowledge-source-manager-side); }
  .ui-ksm__main[data-open] .ui-ksm__detail { border-top: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
}
/* Narrow: the pill gives way to its dot, Add source to its icon */
@container ui-ksm (max-width: 440px) {
  .ui-ksm__row { padding-left: var(--tc-space-2-5); padding-right: var(--tc-space-3); column-gap: var(--tc-space-2-5); }
  /* The icon alone; its label stays for screen readers */
  .ui-ksm__side .ui-ksm__state[data-state] { width: auto; height: auto; padding: 0; background: none; }
  .ui-ksm__side .ui-ksm__state-icon { width: 18px; height: 18px; }
  .ui-ksm__side .ui-ksm__state-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-ksm__show { flex: 1 1 100%; }
  .ui-ksm__opt { flex: 1; justify-content: center; }
  .ui-ksm__facts { grid-template-columns: minmax(0, 1fr); }
}
@media (pointer: coarse) {
  .ui-ksm__btn { height: 40px; }
  .ui-ksm__input { height: max(40px, var(--tc-field-h)); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ksm"] *, [data-ui="ksm"] *::before, [data-ui="ksm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-knowledge-source-manager")) customElements.define("tc-knowledge-source-manager", TcKnowledgeSourceManager);

declare global {
  interface HTMLElementTagNameMap {
    "tc-knowledge-source-manager": TcKnowledgeSourceManager;
  }
}
