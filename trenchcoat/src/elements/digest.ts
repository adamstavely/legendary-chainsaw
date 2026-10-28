import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { OffScreenController } from "./internal/controllers";

/*
 * <tc-digest> – a one-minute digest: a pile of information summarised around what the reader needs, not the order
 * of the documents. Sections sit in a two-column grid of quiet panels – by default What matters, What you should do,
 * What changed and Safe to ignore – and the header says how long it takes to read ("~45 sec"), worked out from the
 * words shown at `wpm`.
 *   · sections come from `matters`, `actions`, `changes` and `ignore`, or the page gives its own `sections`
 *   · an item can cite a source as a small chip (a link with `href`) that fires a cancelable tc-cite-open
 *   · a checkable section (What you should do) gives each item a real checkbox; `done` holds the ticked ids and each
 *     tick fires a cancelable tc-done-change
 *   · `status="summarising"` shows a shimmer in place of the sections; "done" is announced politely
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-digest .matters=${["The deadline moved up a day."]} .actions=${["Send the revised deck by Thursday."]}></tc-digest>
 */

export type DigestSource = { label: string; href?: string };
export type DigestItem = string | { id?: string; text: string; source?: DigestSource };
export type DigestSection = {
  id: string;
  label: string;
  items: DigestItem[];
  /** Each item gets a checkbox – for things to do */
  checkable?: boolean;
  /** Quieter styling – for what's safe to skip */
  quiet?: boolean;
};
export type DigestStatus = "summarising" | "done";

/** Details of the events */
export type DigestDoneChange = { done: string[]; id: string; checked: boolean };
export type DigestCiteOpen = { id: string; section: string; source: DigestSource };

let uidCount = 0;

const textOf = (it: DigestItem) => (typeof it === "string" ? it : it.text);
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * A one-minute digest: what matters, what to do, what changed and what's safe to ignore, with a reading-time
 * estimate, checkable actions and cited sources.
 * @tag tc-digest
 * @fires tc-done-change - An action was ticked or unticked ({ done, id, checked }: DigestDoneChange); cancelable – prevented, `done` stays as it was
 * @fires tc-cite-open - A source chip was pressed ({ id, section, source }: DigestCiteOpen); cancelable – prevented, a link doesn't open
 */
export class TcDigest extends TcElement {
  static override ui = "dig";

  /** The heading */
  @property() accessor heading = "One-minute digest";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** What matters most, for the default sections */
  @property({ attribute: false }) accessor matters: DigestItem[] = [];
  /** What the reader should do, for the default sections – checkable */
  @property({ attribute: false }) accessor actions: DigestItem[] = [];
  /** What changed, for the default sections */
  @property({ attribute: false }) accessor changes: DigestItem[] = [];
  /** What's safe to ignore, for the default sections – quieter */
  @property({ attribute: false }) accessor ignore: DigestItem[] = [];
  /** The page's own sections, in place of the defaults */
  @property({ attribute: false }) accessor sections: DigestSection[] | undefined = undefined;
  /** The ids of ticked items. Changed by the user unless a tc-done-change listener calls preventDefault() */
  @property({ attribute: false }) accessor done: string[] = [];
  /** Reading speed for the estimate, in words a minute */
  @property({ type: Number }) accessor wpm = 238;
  /** The estimate in words, in place of the computed one, e.g. "~2 min" */
  @property() accessor estimate: string | undefined = undefined;
  /** "summarising" shows a shimmer in place of the sections */
  @property({ reflect: true }) accessor status: DigestStatus = "done";

  @state() private accessor announce = "";

  private uid = `tc-dig-${++uidCount}`;

  constructor() {
    super();
    // The shimmer pauses while the element is off screen
    new OffScreenController(this, () => this.status === "summarising");
  }

  /* ---------- The model ---------- */

  private get shownSections(): DigestSection[] {
    if (this.sections) return this.sections;
    return [
      { id: "matters", label: "What matters", items: this.matters },
      { id: "actions", label: "What you should do", items: this.actions, checkable: true },
      { id: "changes", label: "What changed", items: this.changes },
      { id: "ignore", label: "Safe to ignore", items: this.ignore, quiet: true },
    ];
  }
  private idOf(section: DigestSection, it: DigestItem, i: number) {
    return typeof it !== "string" && it.id ? it.id : `${section.id}:${i}`;
  }
  /** Seconds to read the sections shown */
  private get seconds() {
    const n = this.shownSections.reduce((sum, s) => sum + (s.items.length ? words(s.label) : 0) + s.items.reduce((w, it) => w + words(textOf(it)), 0), 0);
    if (!n) return 0;
    return Math.max(5, Math.round(((n / Math.max(1, this.wpm)) * 60) / 5) * 5);
  }
  private get estimateText() {
    if (this.estimate) return this.estimate;
    const s = this.seconds;
    if (!s) return "";
    return s < 90 ? `~${s} sec` : `~${Math.round(s / 60)} min`;
  }

  /* ---------- Actions ---------- */

  private toggle(box: HTMLInputElement, id: string) {
    const checked = box.checked;
    const next = checked ? [...new Set([...this.done, id])] : this.done.filter((d) => d !== id);
    if (!this.emit<DigestDoneChange>("tc-done-change", { done: next, id, checked }, { cancelable: true })) {
      // Prevented: the checkbox goes back to what `done` says – the binding hasn't changed, so Lit wouldn't
      box.checked = this.done.includes(id);
      return;
    }
    this.done = next;
  }

  private cite(e: Event, id: string, section: string, source: DigestSource) {
    if (!this.emit<DigestCiteOpen>("tc-cite-open", { id, section, source }, { cancelable: true })) e.preventDefault();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const was = changed.get("status") as DigestStatus | undefined;
    // Announced politely when the status changes, not on the first render
    if (changed.has("status") && was !== undefined) this.announce = this.status === "done" ? `${this.heading} ready` : `Summarising`;
  }

  /* ---------- Rendering ---------- */

  private renderItem(section: DigestSection, it: DigestItem, i: number) {
    const id = this.idOf(section, it, i);
    const text = textOf(it);
    const source = typeof it === "string" ? undefined : it.source;
    const chip = source
      ? source.href
        ? html`<a class="ui-dig__source" href=${source.href} @click=${(e: Event) => this.cite(e, id, section.id, source)}>${source.label}</a>`
        : html`<button type="button" class="ui-dig__source" @click=${(e: Event) => this.cite(e, id, section.id, source)}>${source.label}</button>`
      : nothing;
    if (section.checkable) {
      const inputId = `${this.uid}-${section.id}-${i}`;
      const checked = this.done.includes(id);
      return html`<li class="ui-dig__item ui-dig__item--check" ?data-done=${checked}>
        <input
          type="checkbox"
          class="ui-dig__check"
          id=${inputId}
          data-id=${id}
          .checked=${checked}
          @change=${(e: Event) => this.toggle(e.target as HTMLInputElement, id)}
        />
        <label class="ui-dig__text" for=${inputId}>${text}</label>${chip}
      </li>`;
    }
    return html`<li class="ui-dig__item"><span class="ui-dig__text">${text}</span>${chip}</li>`;
  }

  private renderSection(section: DigestSection) {
    const hid = `${this.uid}-${section.id}`;
    return html`<section class="ui-dig__section" data-id=${section.id} ?data-quiet=${section.quiet} aria-labelledby=${hid}>
      <h4 class="ui-dig__label" id=${hid}>${section.label}</h4>
      <ul class=${section.checkable ? "ui-dig__list ui-dig__list--check" : "ui-dig__list"}>${section.items.map((it, i) => this.renderItem(section, it, i))}</ul>
    </section>`;
  }

  protected override render() {
    const summarising = this.status === "summarising";
    const sections = this.shownSections.filter((s) => s.items.length);
    const estimate = summarising ? "" : this.estimateText;
    const mins = Math.max(1, Math.ceil(this.seconds / 60));
    return html`
      <span class="ui-dig__sr" role="status">${this.announce}</span>
      ${cardHead({
        // The reading time stands in for an icon: "1m"
        picture: html`<span class="ui-dig__glyph">${mins}m</span>`,
        pictureShape: "square",
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: estimate ? html`<span class="ui-dig__time" title="Reading time">${estimate}<span class="ui-dig__sr"> to read</span></span>` : nothing,
      })}
      <div class="ui-dig__card" aria-busy=${ifDefined(summarising ? "true" : undefined)}>
        ${summarising
          ? html`<div class="ui-dig__grid" aria-hidden="true">
              ${[0, 1, 2, 3].map(() => html`<div class="ui-dig__section ui-dig__section--skeleton"><span></span><span></span><span></span></div>`)}
            </div>`
          : sections.length
            ? html`<div class="ui-dig__grid">${sections.map((s) => this.renderSection(s))}</div>`
            : html`<p class="ui-dig__empty">Nothing to digest yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dig"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dig"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="dig"] *, [data-ui="dig"] *::before, [data-ui="dig"] *::after { box-sizing: border-box; }
:where([data-ui="dig"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="dig"] :is(button, a, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="dig"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="dig"] h4, [data-ui="dig"] p { margin: 0; }
.ui-dig__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dig__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header: a reading-time glyph and the estimate ----- */
.ui-dig__glyph { display: grid; place-items: center; width: 100%; height: 100%; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-none); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-dig__time { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* ----- The sections: a two-column grid of quiet panels ----- */
.ui-dig__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-dig__grid { padding-top: var(--tc-space-2); }
.ui-dig__section { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-dig__section { border-radius: var(--tc-radius-md); background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-dig__label { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-dig__list { display: grid; gap: var(--tc-space-1); }
.ui-dig__item { position: relative; display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); padding-left: var(--tc-space-4); color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-dig__item::before { content: ""; position: absolute; left: var(--tc-space-1); top: 0.6em; width: 5px; height: 5px; border-radius: var(--tc-radius-full); background: currentColor; opacity: 0.55; }
.ui-dig__text { min-width: 0; overflow-wrap: anywhere; }
/* A checkable item: a real checkbox in place of the bullet */
/* Each row is at least a small control tall, so the boxes are far enough apart to hit (WCAG 2.5.8) */
.ui-dig__list--check { gap: var(--tc-space-0-5); }
.ui-dig__item--check { min-height: var(--tc-control-h-sm); padding-left: 0; align-items: center; }
.ui-dig__item--check::before { content: none; }
.ui-dig__check { flex: none; width: 16px; height: 16px; margin: 0; accent-color: var(--tc-accent); cursor: pointer; }
.ui-dig__item--check .ui-dig__text { flex: 1 1 12rem; cursor: pointer; }
.ui-dig__item[data-done] .ui-dig__text { color: var(--tc-text-muted); text-decoration: line-through; text-decoration-color: var(--tc-border-strong); }
/* Safe to ignore: quieter */
.ui-dig__section[data-quiet] .ui-dig__label { color: var(--tc-text-secondary); }
.ui-dig__section[data-quiet] .ui-dig__item { color: var(--tc-text-secondary); }
/* A source chip */
.ui-dig__source { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); text-decoration: none; white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dig__source:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* While summarising: a shimmer per panel */
.ui-dig__section--skeleton > span { position: relative; display: block; height: 12px; overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); }
.ui-dig__section--skeleton > span:first-child { width: 45%; height: 14px; }
.ui-dig__section--skeleton > span:nth-child(3) { width: 72%; }
.ui-dig__section--skeleton > span::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, var(--tc-shimmer), transparent); transform: translateX(-100%); animation: ui-dig-shimmer var(--tc-duration-shimmer) linear infinite; }
[data-offscreen] .ui-dig__section--skeleton > span::after { animation-play-state: paused; }
.ui-dig__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@keyframes ui-dig-shimmer { to { transform: translateX(100%); } }
/* Narrow: one column */
@container (max-width: 520px) {
  .ui-dig__grid { grid-template-columns: minmax(0, 1fr); padding: var(--tc-space-3); }
}
@media (forced-colors: active) {
  .ui-dig__section, .ui-dig__source, .ui-dig__time { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dig"] *, [data-ui="dig"] *::before, [data-ui="dig"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-digest")) customElements.define("tc-digest", TcDigest);

declare global {
  interface HTMLElementTagNameMap {
    "tc-digest": TcDigest;
  }
}
