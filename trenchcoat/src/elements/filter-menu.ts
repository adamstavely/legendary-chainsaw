import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, RowWindowController, SmoothHeightController, rescueFocus } from "./internal/controllers";

/*
 * <tc-filter-menu> – the Lit port of src/components/filter-menu.tsx: grouped filters with chips.
 * Active filters sit on top as removable chips; below, collapsible groups list their options as checkboxes with a
 * count of what's picked. Every group head and visible option is a plain button in the Tab order; arrow keys also
 * move through them, Enter or Space picks, ← and → fold a group. Folded options are inert. Heights glide when
 * groups open or chips come and go. Clean has no tray – one white card, chips kept on one line (as many as fit,
 * "+N" for the rest) and the keyboard hints as the card's last row.
 *
 *   <tc-filter-menu heading="Filter leads" name="f" .groups=${groups} .value=${{ status: ["won"] }}></tc-filter-menu>
 *
 * A group with more than WINDOW_FROM options renders only the options near the viewport (RowWindowController).
 * With `name`, the picked options are submitted with the surrounding form: one hidden input per option, named
 * `name[groupId]`. Every change fires a cancelable `tc-value-change` ({ value }) or `tc-open-change` ({ open }):
 * call preventDefault() to control `value` or `open` yourself.
 */

export type FilterOption = { id: string; label: string };

export type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
  /** Put in front of the option on its chip, e.g. "Score: " → "Score: 80–90" */
  chipPrefix?: string;
};

/** Picked option ids per group id */
export type FilterValue = Record<string, string[]>;
export type FilterValueChange = { value: FilterValue };
export type FilterOpenChange = { open: string[] };

type Row = { kind: "group"; group: FilterGroup } | { kind: "option"; group: FilterGroup; option: FilterOption; i: number };
type Chip = { group: FilterGroup; option: FilterOption; label: string };

/** Gap between chips, in px – matches the Clean CSS */
const CHIP_GAP = 4;
/** A group with more options than this renders only the ones near the viewport */
const WINDOW_FROM = 60;
const OVERSCAN = 20;
let instances = 0;

const chevron = (clean: boolean) =>
  clean
    ? html`<svg class="ui-fm__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`
    : html`<svg class="ui-fm__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M6.5 9.5 12 15l5.5-5.5"></path>`}</svg>`;
const check = (clean: boolean) =>
  clean ? html`<svg viewBox="0 0 16 16">${svg`<path d="m4.25 8.25 2.5 2.5 5-5.5"></path>`}</svg>` : html`<svg viewBox="0 0 24 24">${svg`<path d="m6 12.5 4 4 8-9"></path>`}</svg>`;
const kbdIcon = (d: string) => html`<kbd><svg viewBox="0 0 24 24">${svg`<path d=${d}></path>`}</svg></kbd>`;
const filters = (n: number) => `${n} filter${n === 1 ? "" : "s"}`;

/** The keyboard hints – Standard: in the tray below the card · Clean: the last row of the card, under a hairline */
const hintsRow = (clean: boolean) =>
  html`<div class="ui-fm__hints" aria-hidden="true">
    ${clean
      ? html`<span class="ui-fm__hint"><kbd>↑</kbd><kbd>↓</kbd><span>to navigate</span></span><span class="ui-fm__hint"><kbd>↵</kbd><span>to select</span></span>`
      : html`<span class="ui-fm__hint">${kbdIcon("M12 5v14m0 0-5-5m5 5 5-5")}${kbdIcon("M12 19V5m0 0-5 5m5-5 5 5")}To navigate</span><span class="ui-fm__hint">${kbdIcon("M18 6v6.5a2 2 0 0 1-2 2H7m0 0 3.5-3.5M7 14.5 10.5 18")}To select</span>`}
  </div>`;

/**
 * Grouped filters: removable chips on top, collapsible groups of checkboxes below.
 * @tag tc-filter-menu
 * @fires tc-value-change - An option is picked or removed, or all are cleared; detail `{ value: FilterValue }`. Cancelable: prevent it to control `value`
 * @fires tc-open-change - A group opens or folds; detail `{ open: string[] }`. Cancelable: prevent it to control `open`
 */
export class TcFilterMenu extends TcElement {
  static override ui = "fm";

  /** The filter groups, in order – each a collapsible list of options that become chips when picked */
  @property({ attribute: false }) accessor groups: FilterGroup[] = [];
  /** The picked options, per group id */
  @property({ attribute: false }) accessor value: FilterValue = {};
  /** Ids of the open groups – unset opens the first group */
  @property({ attribute: false }) accessor open: string[] | undefined = undefined;
  /** Name for native form submission: one hidden input per picked option, named `name[groupId]` */
  @property() accessor name = "";
  /** Nothing can be picked, removed or cleared, and the hidden inputs are left out of the form */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** The heading, next to Clear all */
  @property() accessor heading = "Filters";
  /** Show the keyboard hints at the bottom (Clean: as the last row of the card); hints="false" hides them */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor hints = true;

  /** @internal Clean: how many chips fit on the line */
  @state() private accessor fit = Infinity;
  /** @internal Clean: "+N" shows every chip (wrapping) until pressed again */
  @state() private accessor allChips = false;
  /** @internal One quiet status line: how many filters are on, after a change (not on mount) */
  @state() private accessor status = "";

  private readonly uid = `tc-fm${++instances}`;
  private lastChipKey: string | null = null;
  private placedFor = "";
  private ro?: ResizeObserver;
  /** Long groups: one row window per group id */
  private windows = new Map<string, RowWindowController>();
  /** The option with focus stays rendered while its group is windowed */
  private focusKey: string | null = null;
  /** An option the keyboard moved to that wasn't rendered yet */
  private pendingFocus: string | null = null;

  constructor() {
    super();
    new SmoothHeightController(this, () => this.querySelector(".ui-fm__chips-outer"), () => this.querySelector(".ui-fm__chips"));
    // Focus never drops to <body>: a removed chip's × hands focus to the chip that took its place (same
    // data-focus-key), else the previous one; Clear all (disabled once empty) and the rest go to the first group head
    new FocusRescueController(this, (key) => {
      const m = key?.match(/^chip-x:(\d+)$/);
      if (m) {
        const xs = this.querySelectorAll<HTMLElement>("[data-focus-key^='chip-x:']");
        if (xs.length) return xs[Math.min(Number(m[1]), xs.length) - 1] ?? xs[0];
      }
      // An option whose group folded (or went away) → its group's head
      if (key?.startsWith("opt:")) {
        const head = this.querySelector<HTMLElement>(`[data-focus-key="head:${CSS.escape(key.slice(4))}"]`);
        if (head) return head;
      }
      return this.querySelector<HTMLElement>(".ui-fm__group-head");
    });
  }

  /** @internal The open group ids in use */
  private get openIds() {
    return this.open ?? this.groups.slice(0, 1).map((g) => g.id);
  }

  /** @internal */
  private isOn(g: string, o: string) {
    return this.value[g]?.includes(o) ?? false;
  }

  /** @internal */
  private get chips(): Chip[] {
    return this.groups.flatMap((g) => g.options.filter((o) => this.isOn(g.id, o.id)).map((o) => ({ group: g, option: o, label: `${g.chipPrefix ?? ""}${o.label}` })));
  }

  /** @internal Reports a new value and applies it unless prevented */
  private commit(next: FilterValue) {
    if (this.disabled) return;
    if (this.emit<FilterValueChange>("tc-value-change", { value: next }, { cancelable: true })) this.value = next;
  }

  private toggle(g: string, o: string) {
    const cur = this.value[g] ?? [];
    this.commit({ ...this.value, [g]: cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o] });
  }

  private toggleGroup(g: string) {
    const ids = this.openIds;
    const next = ids.includes(g) ? ids.filter((x) => x !== g) : [...ids, g];
    if (this.emit<FilterOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.placedFor = "";
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-disabled", this.disabled);
    const chips = this.chips;
    const chipKey = chips.map((c) => `${c.group.id}:${c.option.id}`).join("|");
    if (this.lastChipKey !== null && chipKey !== this.lastChipKey) this.status = chips.length === 0 ? "No filters" : `${filters(chips.length)} active`;
    this.lastChipKey = chipKey;
    // One row window per long group; groups that went away or got short lose theirs
    const long = new Set(this.groups.filter((g) => g.options.length > WINDOW_FROM).map((g) => g.id));
    for (const [id, win] of this.windows)
      if (!long.has(id)) {
        this.removeController(win);
        win.hostDisconnected();
        this.windows.delete(id);
      }
    for (const id of long)
      if (!this.windows.has(id))
        this.windows.set(
          id,
          new RowWindowController(this, {
            count: () => this.groups.find((g) => g.id === id)?.options.length ?? 0,
            body: () => this.querySelector(`.ui-fm__panel-inner[data-group="${CSS.escape(id)}"]`),
            rowSelector: ".ui-fm__option",
            from: WINDOW_FROM,
            overscan: OVERSCAN,
            rowHeight: 34,
          }),
        );
    for (const win of this.windows.values()) win.compute();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // An option the keyboard moved to: focus it once it's rendered, else bring it into its group's window first
    if (this.pendingFocus) {
      const key = this.pendingFocus;
      const el = this.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`);
      if (el) {
        this.pendingFocus = null;
        el.focus();
      } else {
        const m = this.rowOf(key);
        const win = m && m.kind === "option" ? this.windows.get(m.group.id) : undefined;
        if (win && m?.kind === "option") win.reveal(m.i);
        else this.pendingFocus = null;
      }
    }
    // Clean – one line only: as many chips as fit, the rest hide behind "+N". A hidden copy of the chips (plus a
    // "+99" sample) is measured to know their widths before they are placed.
    const clean = this.resolvedLook === "clean";
    const want = clean && !this.allChips ? `${this.lastChipKey}` : "";
    if (want !== this.placedFor) {
      this.placedFor = want;
      this.ro?.disconnect();
      this.ro = undefined;
      const row = this.querySelector<HTMLElement>(".ui-fm__chips");
      if (want && row) {
        this.place();
        if (typeof ResizeObserver === "function") {
          this.ro = new ResizeObserver(() => this.place());
          this.ro.observe(row);
        }
      }
    }
  }

  /** @internal */
  private place() {
    const row = this.querySelector<HTMLElement>(".ui-fm__chips");
    const list = this.querySelector<HTMLElement>(".ui-fm__measure");
    if (!row || !list) return;
    const widths = [...list.children].map((el) => (el as HTMLElement).offsetWidth + CHIP_GAP);
    const more = widths.pop() ?? 0;
    const style = getComputedStyle(row);
    const room = row.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0) + CHIP_GAP;
    let used = 0;
    let n = 0;
    for (; n < widths.length; n++) {
      const rest = n + 1 < widths.length ? more : 0;
      if (used + widths[n] + rest > room) break;
      used += widths[n];
    }
    if (n !== this.fit) this.fit = n;
  }

  /** @internal Everything the arrow keys can reach, top to bottom */
  private get rows(): Row[] {
    const open = new Set(this.openIds);
    return this.groups.flatMap((g) => [{ kind: "group", group: g } as Row, ...(open.has(g.id) ? g.options.map((o, i) => ({ kind: "option", group: g, option: o, i }) as Row) : [])]);
  }
  /** @internal */
  private rowOf(key: string) {
    return this.rows.find((r) => keyOf(r) === key);
  }

  private moveTo(key: string) {
    const el = this.querySelector<HTMLElement>(`.ui-fm__groups [data-key="${CSS.escape(key)}"]`);
    if (el) el.focus();
    else {
      // Outside its group's window: render it, then focus it (updated)
      this.pendingFocus = key;
      this.requestUpdate();
    }
  }

  private onFocusIn = (e: FocusEvent) => {
    this.focusKey = (e.target as HTMLElement).closest<HTMLElement>(".ui-fm__option")?.dataset.key ?? null;
  };
  private onFocusOut = (e: FocusEvent) => {
    if (!(e.relatedTarget instanceof Node) || !this.contains(e.relatedTarget)) this.focusKey = null;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    const rows = this.rows;
    const open = new Set(this.openIds);
    const focus = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>("[data-key]")?.dataset.key ?? null;
    const i = rows.findIndex((r) => keyOf(r) === focus);
    const row = rows[i];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))] ?? rows[0];
      this.moveTo(keyOf(next));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.moveTo(keyOf(rows[e.key === "Home" ? 0 : rows.length - 1]));
    } else if (row && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      const g = row.group.id;
      if (e.key === "ArrowRight" && !open.has(g)) this.toggleGroup(g);
      if (e.key === "ArrowLeft") {
        // Focus moves to the head before the panel goes inert
        const head = this.querySelector<HTMLElement>(`.ui-fm__groups [data-key="${CSS.escape(`g:${g}`)}"]`);
        if (!rescueFocus(head?.nextElementSibling, [head])) this.moveTo(`g:${g}`);
        if (open.has(g)) this.toggleGroup(g);
      }
    } else if (row && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (row.kind === "group") this.toggleGroup(row.group.id);
      else this.toggle(row.group.id, row.option.id);
    }
  };

  /** @internal The options of one group – all of them, or for a long group the window plus the focused one */
  private optionList(g: FilterGroup, panelId: string, clean: boolean): TemplateResult {
    const option = (o: FilterOption) => {
      const on = this.isOn(g.id, o.id);
      return html`<button
        type="button"
        role="checkbox"
        aria-checked=${on ? "true" : "false"}
        aria-disabled=${ifDefined(this.disabled ? "true" : undefined)}
        class="ui-fm__option"
        data-key=${`o:${g.id}:${o.id}`}
        data-focus-key=${`opt:${panelId}`}
        @click=${() => !this.disabled && this.toggle(g.id, o.id)}
      >
        <span class="ui-fm__box" aria-hidden="true">${check(clean)}</span>${clean ? html`<span class="ui-fm__option-label">${o.label}</span>` : o.label}
      </button>`;
    };
    const win = this.windows.get(g.id);
    if (!win?.virtual) return html`${repeat(g.options, (o) => o.id, option)}`;
    // Rendered: the window, plus the option with focus (or the one the keyboard is moving to)
    const keep = [this.focusKey, this.pendingFocus].map((k) => (k?.startsWith(`o:${g.id}:`) ? g.options.findIndex((o) => `o:${g.id}:${o.id}` === k) : -1)).filter((n) => n >= 0 && (n < win.start || n >= win.end));
    const shown = [...new Set([...keep, ...Array.from({ length: win.end - win.start }, (_, k) => win.start + k)])].sort((a, b) => a - b);
    const parts: { key: string; tpl: TemplateResult }[] = [];
    const spacer = (key: string, n: number) => parts.push({ key, tpl: html`<div class="ui-fm__spacer" aria-hidden="true" style=${styleMap({ height: `${n * win.rowHeight}px` })}></div>` });
    let at = 0;
    for (const n of shown) {
      if (n > at) spacer(`s${at}`, n - at);
      parts.push({ key: `o${g.options[n].id}`, tpl: option(g.options[n]) });
      at = n + 1;
    }
    if (g.options.length > at) spacer(`s${at}`, g.options.length - at);
    return html`${repeat(parts, (p) => p.key, (p) => p.tpl)}`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const open = new Set(this.openIds);
    const disabled = this.disabled;
    const chips = this.chips;
    const wrapAll = clean && this.allChips;
    const shown = clean && !wrapAll ? chips.slice(0, this.fit) : chips;
    const hidden = clean && !wrapAll ? chips.slice(this.fit) : [];
    const chipKeyOf = (c: Chip) => `${c.group.id}:${c.option.id}`;

    // Standard: chips wrap onto as many lines as they need · Clean: one line, with a hidden copy to measure and "+N"
    const chipRow = clean
      ? html`<div class="ui-fm__chips" ?data-empty=${chips.length === 0} ?data-wrap=${wrapAll}>
          <div class="ui-fm__measure" aria-hidden="true">
            ${repeat(chips, chipKeyOf, (c) => html`<span class="ui-fm__chip"><span class="ui-fm__chip-label">${c.label}</span><span class="ui-fm__chip-x"></span></span>`)}
            <span class="ui-fm__chip ui-fm__more">+99</span>
          </div>
          ${repeat(
            shown,
            chipKeyOf,
            (c, i) => html`<span class="ui-fm__chip">
              <span class="ui-fm__chip-label" title=${c.label}>${c.label}</span>
              <button type="button" class="ui-fm__chip-x" aria-label=${`Remove ${c.label}`} data-focus-key=${`chip-x:${i}`} ?disabled=${disabled} @click=${() => this.toggle(c.group.id, c.option.id)}>
                <svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"></path>`}</svg>
              </button>
            </span>`,
          )}
          ${hidden.length > 0 || (wrapAll && chips.length > 0)
            ? html`<button
                type="button"
                class="ui-fm__chip ui-fm__more"
                data-focus-key="more"
                aria-expanded=${wrapAll ? "true" : "false"}
                title=${ifDefined(wrapAll ? undefined : hidden.map((c) => c.label).join(", "))}
                @click=${() => (this.allChips = !this.allChips)}
              >${wrapAll
                ? "Show less"
                : html`${keyed(hidden.length, html`<span class="ui-fm__roll" aria-hidden="true">+${hidden.length}</span>`)}<span class="ui-fm__sr">${`Show ${hidden.length} more: ${hidden.map((c) => c.label).join(", ")}`}</span>`}</button>`
            : nothing}
        </div>`
      : html`<div class="ui-fm__chips">${repeat(
          shown,
          chipKeyOf,
          (c, i) => html`<span class="ui-fm__chip">${c.label}<button type="button" aria-label=${`Remove ${c.label}`} data-focus-key=${`chip-x:${i}`} ?disabled=${disabled} @click=${() => this.toggle(c.group.id, c.option.id)}><svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"></path>`}</svg></button></span>`,
        )}</div>`;

    const body = html`
      <div class="ui-fm__head">
        <span class="ui-fm__title">${this.heading}</span>
        <button type="button" class="ui-fm__clear" data-focus-key="clear" ?disabled=${disabled || chips.length === 0} @click=${() => this.commit({})}>Clear all</button>
      </div>
      <div class="ui-fm__chips-outer">${chipRow}</div>
      <div class="ui-fm__groups" @keydown=${this.onKeyDown} @focusin=${this.onFocusIn} @focusout=${this.onFocusOut}>
        ${repeat(
          this.groups,
          (g) => g.id,
          (g, gi) => {
            // Ids from the instance and the group's place – never from the group's own id, which is user data
            const panelId = `${this.uid}-g${gi}`;
            const isOpen = open.has(g.id);
            const count = this.value[g.id]?.length ?? 0;
            const windowed = !!this.windows.get(g.id)?.virtual;
            return html`<section class="ui-fm__group" ?data-open=${isOpen}>
              <button
                type="button"
                class="ui-fm__group-head"
                data-key=${`g:${g.id}`}
                data-focus-key=${`head:${panelId}`}
                aria-expanded=${isOpen ? "true" : "false"}
                aria-controls=${panelId}
                @click=${() => this.toggleGroup(g.id)}
              >
                ${chevron(clean)}
                <span class="ui-fm__group-label">${g.label}</span>
                <span class="ui-fm__group-count">${g.options.length}</span>
                <span class="ui-fm__group-picked">${clean
                  ? count > 0
                    ? keyed(count, html`<span class="ui-fm__roll">${filters(count)}</span>`)
                    : nothing
                  : count > 0
                    ? filters(count)
                    : ""}</span>
              </button>
              <div class="ui-fm__panel" id=${panelId} role="group" aria-label=${g.label} .inert=${!isOpen}>
                <div class="ui-fm__panel-inner" data-group=${g.id} style=${ifDefined(windowed ? "row-gap: 0" : undefined)}>${this.optionList(g, panelId, clean)}</div>
              </div>
            </section>`;
          },
        )}
      </div>
    `;

    return html`
      ${clean ? body : html`<div class="ui-fm__card">${body}</div>`}
      <div class="ui-fm__sr" role="status">${this.status}</div>
      ${this.name ? repeat(chips, chipKeyOf, (c) => html`<input type="hidden" name=${`${this.name}[${c.group.id}]`} .value=${c.option.id} ?disabled=${disabled} />`) : nothing}
      ${this.hints ? hintsRow(clean) : nothing}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fm"] {
  width: 100%;
  max-width: 420px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fm"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="fm"] *, [data-ui="fm"] *::before, [data-ui="fm"] *::after { box-sizing: border-box; }
[data-ui="fm"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-fm__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fm"] button { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__card {
  padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2-5);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* ---------- Header ---------- */
.ui-fm__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__head { padding: 0 var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__title { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-relaxed); font-weight: var(--tc-font-weight-semibold); letter-spacing: -0.01em; }
/* Clear all: the ghost button recipe */
.ui-fm__clear {
  border: 0;
  background: none;
  font-size: var(--tc-control-font-size);
  color: var(--tc-action-ghost-fg) !important;
  transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-fm__clear:hover:not(:disabled) { color: var(--tc-text-primary) !important; background: var(--tc-action-ghost-bg-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__clear {
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  margin-right: calc(-1 * var(--tc-control-px-sm)) !important;
  border-radius: var(--tc-control-radius-sm);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__clear:disabled { opacity: 0.45; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="fm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="fm"]) svg { display: block; flex: none; }
/* ---------- Header ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__head { padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__title { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__clear {
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-sm) !important;
  border-radius: var(--tc-control-radius-md);
  font-weight: var(--tc-control-font-weight);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__clear:disabled { color: var(--tc-text-disabled) !important; cursor: default; }
/* ---------- Chips ---------- */
.ui-fm__chips-outer { overflow: hidden; }
.ui-fm__chips-outer[data-smooth] { transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding-top: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chips:empty { padding-top: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  height: 30px;
  padding: 0 var(--tc-space-1) 0 var(--tc-space-2-5);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-secondary);
  white-space: nowrap;
  animation: ui-fm-chip-in var(--tc-duration-moderate) var(--tc-ease-move) both;
}
/* The × is a 24px target; its negative margin keeps the chip's size */
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: 0 -1px !important;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip button:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chip svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
/* ---------- Groups ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-fm__groups { display: grid; padding-top: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: calc(100% + 12px);
  height: 36px;
  margin: var(--tc-space-0-5) -6px 0 !important;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5);
  border: 0;
  border-radius: var(--tc-radius-lg);
  background: none;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-head:hover { background: var(--tc-fill-hover); }
.ui-fm__chevron {
  width: 16px;
  height: 16px;
  flex: none;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(-90deg);
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__chevron { stroke: var(--tc-text-secondary); stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips { position: relative; display: flex; flex-wrap: nowrap; gap: var(--tc-space-1); padding: 0 var(--tc-space-4) var(--tc-space-3); overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips[data-wrap] { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips[data-empty] { padding-bottom: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__measure { position: absolute; top: 0; left: 0; display: flex; gap: var(--tc-space-1); width: max-content; visibility: hidden; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-0-5);
  height: 24px;
  padding: 0 var(--tc-space-1) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-primary);
  white-space: nowrap;
  animation: ui-fm-chip-in var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-label { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
/* A 24px target drawn as an 18px square: the hover fill is inset, the margins keep the chip's size */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin: 0 -3px !important;
  color: var(--tc-icon-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x::before { content: ""; position: absolute; inset: 3px; border-radius: var(--tc-radius-xs); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x:hover::before { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x svg { position: relative; width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__more { padding: 0 var(--tc-space-2) !important; color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; text-align: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__more:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__roll { display: inline-block; animation: ui-fm-roll var(--tc-duration-slow) var(--tc-ease-move) both; }
/* ---------- Groups ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__groups { display: grid; padding: var(--tc-space-1); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-head {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  height: 32px;
  padding: 0 var(--tc-space-2) !important;
  border-radius: var(--tc-radius-sm);
  /* Hover comes in crisp and fades out when the pointer moves on */
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-head:hover { background: var(--tc-fill-subtle); transition-duration: var(--tc-duration-instant); }
.ui-fm__group-head:focus-visible, .ui-fm__option:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chevron { stroke: var(--tc-icon-muted); stroke-width: 1.1; }
.ui-fm__group[data-open] .ui-fm__chevron { transform: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-label { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group-picked { margin-left: auto; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-count { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-picked { display: inline-flex; margin-left: auto; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-fm__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-fm__group[data-open] .ui-fm__panel { grid-template-rows: 1fr; }
.ui-fm__panel-inner {
  display: grid;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  opacity: 0;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), padding var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__panel-inner { gap: 1px; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__group[data-open] .ui-fm__panel-inner { opacity: 1; padding: var(--tc-space-0-5) 0 var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3);
  width: calc(100% + 12px);
  height: 34px;
  margin: 0 -6px !important;
  padding: 0 var(--tc-space-1-5);
  border: 0;
  border-radius: var(--tc-radius-lg);
  background: none;
  font-size: var(--tc-font-size-lg);
  color: var(--tc-text-secondary) !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option:hover { background: var(--tc-fill-hover); }
/* Checkbox: its edge is its only cue at rest, so it uses the control border (≥ 3:1) */
:where([data-look="standard"], [data-look="standard"] *).ui-fm__box {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-control);
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__box svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--tc-text-on-inverse);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option[aria-checked="true"] .ui-fm__box { background: var(--tc-surface-inverse); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__option[aria-checked="true"] .ui-fm__box svg { stroke-dashoffset: 0; }
/* ---------- Keyboard hints ---------- */
.ui-fm__hint kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h);
  height: var(--tc-kbd-h);
  padding: 0 var(--tc-kbd-px);
  border-radius: var(--tc-kbd-radius);
  background: var(--tc-kbd-bg);
  box-shadow: var(--tc-kbd-shadow);
  font-family: inherit;
  font-size: var(--tc-kbd-font-size);
  line-height: var(--tc-kbd-h);
  font-weight: var(--tc-kbd-font-weight);
  color: var(--tc-kbd-fg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hints { display: flex; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint kbd { padding: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint kbd:last-of-type { margin-right: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-fm__hint svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group[data-open] .ui-fm__panel-inner { opacity: 1; padding: 0 0 var(--tc-space-1); }
/* Options sit under the group's label, the checkbox lined up with its text */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: 100%;
  height: 32px;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-8) !important;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option:hover { background: var(--tc-fill-subtle); transition-duration: var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option-label { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Checkbox: 14px with a control-border edge (≥ 3:1), blue when picked; the check draws itself in */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box {
  display: grid;
  place-items: center;
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: var(--tc-radius-xs);
  background: var(--tc-surface-control);
  box-shadow: inset 0 0 0 1px var(--tc-border-control);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-text-on-accent);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 12;
  stroke-dashoffset: 12;
  transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option[aria-checked="true"] .ui-fm__box { background: var(--tc-accent); box-shadow: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option[aria-checked="true"] .ui-fm__box svg { stroke-dashoffset: 0; transition-delay: 40ms; }
/* ---------- Keyboard hints: the last row of the card ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hints {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  height: 32px;
  padding: 0 var(--tc-space-3);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hint { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hint > span { margin-left: var(--tc-space-1); }
@keyframes ui-fm-chip-in { from { opacity: 0; transform: scale(0.9); } }
@keyframes ui-fm-roll { from { opacity: 0; transform: translateY(60%); } to { opacity: 1; transform: none; } }
/* Narrow: a bit less side padding, shorter chips */
@container (max-width: 320px) {
:where([data-look="clean"], [data-look="clean"] *).ui-fm__head { padding-left: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chips { padding-left: var(--tc-space-3-5); padding-right: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-label { max-width: 132px; }
}
/* Touch screens: taller rows and buttons */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-fm__clear { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip { height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__chip-x { width: 32px; height: 32px; margin: 0 -4px !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__group-head { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__option { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__box svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-fm__hints { display: none; }
}
@media (prefers-reduced-motion: reduce) {
[data-ui="fm"] *, [data-ui="fm"] *::before, [data-ui="fm"] *::after { animation: none !important; transition: none !important; }
}
[data-ui="fm"][data-disabled] .ui-fm__option, [data-ui="fm"][data-disabled] .ui-fm__chip { opacity: 0.55; cursor: not-allowed; }
`;
}

const keyOf = (r: Row) => (r.kind === "group" ? `g:${r.group.id}` : `o:${r.group.id}:${r.option.id}`);

if (!customElements.get("tc-filter-menu")) customElements.define("tc-filter-menu", TcFilterMenu);

declare global {
  interface HTMLElementTagNameMap {
    "tc-filter-menu": TcFilterMenu;
  }
}
