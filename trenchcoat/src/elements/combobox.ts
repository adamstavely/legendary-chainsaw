import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { AriaForwardController } from "./internal/controllers";

/*
 * <tc-combobox> – the Lit port of src/components/combobox.tsx (pilot component, audit/lit-port-plan.md).
 * Pick one or many options from a searchable list. Picked options sit in the field as chips (with an avatar, a color
 * dot or an icon) and can be removed with ×; Backspace in the empty field first highlights the last chip, a second
 * Backspace removes it. The list is grouped, highlights what you typed, marks picked rows with a check and can offer
 * to create what's missing. ↑ ↓ move, ↵ picks, Esc closes, Tab leaves. The field and the list glide to their heights.
 * Clean has no tray – a white field with a hairline shadow and one white popover; its field stays one line, the
 * chips that don't fit go into "+N". Above WINDOW_FROM matching options only the rows in view are rendered.
 *
 *   <label for="who">Assignees</label>
 *   <tc-combobox id="who" name="assignees" .options=${options} .value=${["ana"]}></tc-combobox>
 *
 * Light DOM, so the input's aria-controls and aria-activedescendant reach the listbox, and a page <label for> names
 * the input. It's a form-associated element: its values are submitted under `name`, `required` is checked by the
 * browser, and a form reset brings back the first value. Every change fires a cancelable `tc-value-change`
 * ({ value, options }): call preventDefault() to keep control of `value` yourself.
 */

export type ComboboxOption = {
  value: string;
  label: string;
  /** Lighter text after the label, e.g. a role or an email */
  hint?: string;
  /** An image URL, or true for initials from the label */
  avatar?: string | boolean;
  /** A small color dot – nice for labels and tags */
  color?: string;
  /** An icon element (cloned for every place it shows) – wins over avatar and color */
  icon?: Element;
  /** Options with the same group are listed under one title */
  group?: string;
  /** Extra words that should find this option */
  keywords?: string;
};

export type ComboboxValueChange = { value: string[]; options: ComboboxOption[] };

type Chip = { value: string; leaving?: boolean };
type Group = { name: string; options: ComboboxOption[] };
type ListWindow = { top: number; height: number; row: number; label: number };

const CREATE = "\u0000create";
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Room the text input keeps on the line, in px (Clean's one-line field) */
const INPUT_MIN = 72;
/** From this many matching options on, the list renders only the rows in view (plus the active one) */
const WINDOW_FROM = 300;
/** Rows rendered above and below the visible part of a windowed list */
const OVERSCAN = 12;

const icons = {
  close: "M7 7l10 10M17 7 7 17",
  check: "M5.5 12.5l4 4L18.5 8",
  chevron: "M8 10l4 4 4-4",
  plus: "M12 6v12M6 12h12",
};
const glyph = (d: string, cls = "") => html`<svg viewBox="0 0 24 24" class=${`ui-cbx__glyph ${cls}`.trim()} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

const initials = (label: string) => {
  const words = label.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

/** The typed text, marked where it matches */
function highlight(text: string, query: string): TemplateResult {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return html`${text}`;
  return html`${text.slice(0, i)}<mark>${text.slice(i, i + query.length)}</mark>${text.slice(i + query.length)}`;
}

/** Avatar, color dot or icon in front of a chip or a row */
function visual(o: ComboboxOption) {
  if (o.icon) return html`<span class="ui-cbx__icon">${o.icon.cloneNode(true)}</span>`;
  if (typeof o.avatar === "string") return html`<img class="ui-cbx__avatar" src=${o.avatar} alt="" />`;
  if (o.avatar) return html`<span class="ui-cbx__avatar" aria-hidden="true">${initials(o.label)}</span>`;
  if (o.color) return html`<span class="ui-cbx__dot" style=${styleMap({ background: o.color })} aria-hidden="true"></span>`;
  return nothing;
}

const keepFocus = (e: Event) => e.preventDefault();
let instances = 0;

/**
 * Pick one or many options from a searchable, grouped list; picked options show as chips.
 * @tag tc-combobox
 * @fires tc-value-change - The user picked or removed values ({ value, options }); cancelable
 * @fires tc-open-change - The list opens or closes ({ open }); cancelable
 */
export class TcCombobox extends TcElement {
  static override ui = "cbx";
  static formAssociated = true;

  /** Every option */
  @property({ attribute: false }) accessor options: ComboboxOption[] = [];
  /** The picked values. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: string[] = [];
  /** Pick one instead of many */
  @property({ type: Boolean }) accessor single = false;
  /** Whether the list is open. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  @property() accessor placeholder = "Search…";
  /** Offer "Create “…”" when nothing matches the typed text exactly */
  @property({ type: Boolean }) accessor creatable = false;
  /** Turns typed text into an option – defaults to { value: text, label: text }. May return a promise: the create
   *  row shows that it's working, and a rejection shows an error there so it can be tried again */
  @property({ attribute: false }) accessor createOption: ((text: string) => ComboboxOption | void | Promise<ComboboxOption | void>) | undefined = undefined;
  /** Text of the create row */
  @property({ attribute: false }) accessor createLabel: (text: string) => string = (text) => `Create “${text}”`;
  /** Show at most this many chips, the rest as "+3" (Clean always stays one line) */
  @property({ type: Number, attribute: "max-visible-tags" }) accessor maxVisibleTags: number | undefined = undefined;
  /** Visible label above the field (or use a page <label for>) */
  @property() accessor label = "";
  /** Shown when nothing matches */
  @property({ attribute: "empty-text" }) accessor emptyText = "No results";
  /** Submitted with the form: one entry per picked value */
  @property({ reflect: true }) accessor name = "";
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** At least one value must be picked before the form submits */
  @property({ type: Boolean, reflect: true }) accessor required = false;
  /** Shows the field as invalid (red edge, aria-invalid on the input) */
  @property({ type: Boolean, reflect: true }) accessor invalid = false;

  @state() private accessor query = "";
  @state() private accessor active: string | null = null;
  /** The keyboard drives the list: the active row also gets a focus ring (the pointer turns it off) */
  @state() private accessor kbd = true;
  @state() private accessor armed: string | null = null;
  @state() private accessor announce = "";
  @state() private accessor chips: Chip[] = [];
  @state() private accessor fit = Infinity;
  @state() private accessor win: ListWindow = { top: 0, height: 300, row: 32, label: 28 };
  @state() private accessor created: ComboboxOption[] = [];
  @state() private accessor creating: { text: string; failed?: boolean } | null = null;
  @state() private accessor formDisabled = false;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-cbx${++instances}`;
  private initialValue: string[] | null = null;
  private chipsReady = false;
  private popIn = new Set<string>();
  private timers = new Map<string, number>();
  private byKeyboard = false;
  private lastHidden = 0;
  private hiddenDir: "up" | "down" = "up";
  private lastCount = 0;
  private countDir: "up" | "down" = "up";
  private ros: ResizeObserver[] = [];
  private onDocDown = (e: PointerEvent) => {
    if (!this.contains(e.target as Node)) {
      this.setOpen(false);
      this.armed = null;
    }
  };

  constructor() {
    super();
    this.internals = this.attachInternals();
    new AriaForwardController(this, () => this.input);
    // A page <label for> clicks the element: the input takes the focus
    this.addEventListener("click", (e) => {
      if (e.target === this) this.input?.focus();
    });
    this.addEventListener("focusout", (e) => {
      if (this.contains(e.relatedTarget as Node | null)) return;
      this.setOpen(false);
      this.armed = null;
    });
  }

  private get input() {
    return this.querySelector<HTMLInputElement>(".ui-cbx__input");
  }
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  override focus(options?: FocusOptions) {
    this.input?.focus(options);
  }

  /* ---------- Derived ---------- */

  private get all() {
    return [...this.options, ...this.created.filter((c) => !this.options.some((o) => o.value === c.value))];
  }
  private optionOf(v: string): ComboboxOption {
    return this.all.find((o) => o.value === v) ?? { value: v, label: v };
  }
  private groups(needle: string): Group[] {
    const out: Group[] = [];
    for (const o of this.all) {
      if (needle && !`${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`.toLowerCase().includes(needle)) continue;
      const name = o.group ?? "";
      let g = out.find((x) => x.name === name);
      if (!g) out.push((g = { name, options: [] }));
      g.options.push(o);
    }
    return out;
  }

  /* ---------- Changes ---------- */

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private commit(next: string[], extra?: ComboboxOption) {
    if (this.isDisabled) return false;
    const options = next.map((v) => (extra?.value === v ? extra : this.optionOf(v)));
    if (!this.emit<ComboboxValueChange>("tc-value-change", { value: next, options }, { cancelable: true })) return false;
    this.value = next;
    return true;
  }

  private say(text: string, count: number) {
    this.announce = this.single ? text : `${text}. ${count} selected`;
  }

  private pick(o: ComboboxOption) {
    const on = this.value.includes(o.value);
    const next = this.single ? [o.value] : on ? this.value.filter((v) => v !== o.value) : [...this.value, o.value];
    this.commit(next, o);
    this.say(`${o.label} ${on && !this.single ? "removed" : "selected"}`, next.length);
    this.armed = null;
    this.query = "";
    if (this.single) this.setOpen(false);
  }

  private removeValue(v: string) {
    const next = this.value.filter((x) => x !== v);
    this.commit(next);
    this.say(`${this.optionOf(v).label} removed`, next.length);
    this.armed = null;
  }

  private create(text: string) {
    if (this.isDisabled || (this.creating?.text === text && !this.creating.failed)) return;
    const made = (o: ComboboxOption) => {
      this.created = [...this.created.filter((c) => c.value !== o.value), o];
      this.active = o.value;
      this.pick(o);
    };
    const result = this.createOption?.(text);
    if (!(result instanceof Promise)) {
      made(result || { value: text, label: text });
      return;
    }
    this.creating = { text };
    result.then(
      (o) => {
        if (!this.isConnected) return;
        this.creating = null;
        made(o || { value: text, label: text });
      },
      () => {
        if (!this.isConnected) return;
        this.creating = { text, failed: true };
        this.announce = `Couldn't create “${text}”`;
      },
    );
  }

  /* ---------- Lifecycle ---------- */

  override connectedCallback() {
    super.connectedCallback();
    if (this.initialValue === null) this.initialValue = [...this.value];
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onDocDown);
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this.ros.forEach((ro) => ro.disconnect());
    this.ros = [];
  }

  formResetCallback() {
    this.value = [...(this.initialValue ?? [])];
    this.query = "";
  }
  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("value")) this.syncChips();
    if (changed.has("open")) {
      if (this.open) document.addEventListener("pointerdown", this.onDocDown);
      else document.removeEventListener("pointerdown", this.onDocDown);
    }
    this.toggleAttribute("data-open", this.open);
    this.toggleAttribute("data-disabled", this.isDisabled);
    this.toggleAttribute("data-invalid", this.invalid);
    this.toggleAttribute("data-kbd", this.kbd);
  }

  /** Chips follow the value: removed ones stay a moment to fold away; ones added after the first render pop in */
  private syncChips() {
    const selected = this.value;
    let next: Chip[] = this.chips.map((c) => {
      const keep = selected.includes(c.value);
      if (keep && c.leaving) {
        clearTimeout(this.timers.get(c.value));
        this.timers.delete(c.value);
        return { value: c.value };
      }
      if (!keep && !c.leaving) {
        this.timers.set(
          c.value,
          window.setTimeout(() => {
            this.timers.delete(c.value);
            this.chips = this.chips.filter((x) => !(x.value === c.value && x.leaving));
          }, 420),
        );
        return { value: c.value, leaving: true };
      }
      return c;
    });
    for (const v of selected)
      if (!next.some((c) => c.value === v)) {
        next = [...next, { value: v }];
        if (this.chipsReady) this.popIn.add(v);
      }
    this.chips = next;
  }

  protected override firstUpdated() {
    this.chipsReady = true;
    const field = this.querySelector<HTMLElement>(".ui-cbx__field")!;
    const inner = this.querySelector<HTMLElement>(".ui-cbx__field-inner")!;
    // The field glides to the height of its content; Clean refits its one line when the field resizes
    const setHeight = () => (field.style.height = `${inner.offsetHeight}px`);
    setHeight();
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(() => {
        setHeight();
        this.placeLine();
      });
      ro.observe(inner);
      this.ros.push(ro);
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // Chips that arrived after the first render pop in
    for (const v of this.popIn) {
      const li = this.querySelector<HTMLElement>(`.ui-cbx__chips > .ui-cbx__chip[data-value="${CSS.escape(v)}"]`);
      if (li && !reducedMotion()) {
        li.animate([{ gridTemplateColumns: "0fr", marginRight: "0px" }, { gridTemplateColumns: "1fr", marginRight: "var(--tc-space-1)" }], { duration: 260, easing: EASE });
        li.firstElementChild?.animate(
          [
            { opacity: 0, transform: "scale(0.6)" },
            { opacity: 1, transform: "scale(1.05)", offset: 0.6 },
            { opacity: 1, transform: "none" },
          ],
          { duration: 340, easing: EASE },
        );
      }
    }
    this.popIn.clear();
    this.syncForm();
    this.labelInput();
    if (changed.has("chips") || changed.has("look")) this.placeLine();
    if (this.open) {
      this.watchList();
      this.placePill();
    }
  }

  /** The form gets one entry per picked value; `required` is checked by the browser, pointing at the input */
  private syncForm() {
    const disabled = this.isDisabled;
    if (this.name && !disabled) {
      const data = new FormData();
      for (const v of this.value) data.append(this.name, v);
      this.internals.setFormValue(data);
    } else this.internals.setFormValue(null);
    if (this.required && !disabled && !this.value.length) this.internals.setValidity({ valueMissing: true }, "Pick at least one option.", this.input ?? undefined);
    else this.internals.setValidity({});
  }

  /** A page <label for> names the input (light DOM, so the ids connect) */
  private labelInput() {
    const input = this.input;
    if (!input || this.label || input.hasAttribute("aria-label")) return;
    const labels = [...(this.internals.labels as NodeListOf<HTMLLabelElement>)];
    if (!labels.length) return;
    labels.forEach((l, i) => (l.id ||= `${this.uid}-for${i}`));
    input.setAttribute("aria-labelledby", labels.map((l) => l.id).join(" "));
  }

  /** Clean – one line only: as many chips as fit next to the input, the rest hide behind "+N" */
  private placeLine() {
    if (this.resolvedLook !== "clean") {
      if (this.fit !== Infinity) this.fit = Infinity;
      return;
    }
    const inner = this.querySelector<HTMLElement>(".ui-cbx__field-inner");
    const list = this.querySelector<HTMLElement>(".ui-cbx__measure");
    if (!inner || !list) return;
    const widths = [...list.children].map((el) => (el as HTMLElement).offsetWidth + 4);
    const more = widths.pop() ?? 0;
    const style = getComputedStyle(inner);
    const room = inner.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0) - INPUT_MIN;
    let used = 0;
    let n = 0;
    for (; n < widths.length; n++) {
      const rest = n + 1 < widths.length ? more : 0;
      if (used + widths[n] + rest > room) break;
      used += widths[n];
    }
    if (n !== this.fit) this.fit = n;
  }

  private watched?: HTMLElement;
  /** The open list glides to the height of its rows; a long list tracks which part is in view */
  private watchList() {
    const list = this.querySelector<HTMLElement>(".ui-cbx__list");
    const inner = this.querySelector<HTMLElement>(".ui-cbx__list-inner");
    if (!list || !inner || this.watched === list) return;
    this.watched = list;
    const setHeight = () => {
      const style = getComputedStyle(list);
      const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const limit = parseFloat(style.maxHeight) || Infinity;
      list.style.height = `${Math.min(inner.offsetHeight + pad, limit)}px`;
    };
    setHeight();
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(setHeight);
      ro.observe(inner);
      this.ros.push(ro);
    }
    let frame = 0;
    const read = () => {
      frame = 0;
      const row = list.querySelector<HTMLElement>(".ui-cbx__option")?.offsetHeight;
      const labels = list.querySelectorAll<HTMLElement>(".ui-cbx__group-label");
      const label = (labels[1] ?? labels[0])?.offsetHeight;
      const next = { top: list.scrollTop, height: list.clientHeight || 300, row: row || 32, label: label || 28 };
      const w = this.win;
      if (w.top !== next.top || w.height !== next.height || w.row !== next.row || w.label !== next.label) this.win = next;
    };
    read();
    list.addEventListener("scroll", () => (frame ||= requestAnimationFrame(read)), { passive: true });
  }

  /** The highlight glides to the active row; a keyboard move scrolls the list to it. Reads first, then writes */
  private placePill() {
    const list = this.querySelector<HTMLElement>(".ui-cbx__list");
    const pill = this.querySelector<HTMLElement>(".ui-cbx__pill");
    if (!list || !pill) return;
    const row = list.querySelector<HTMLElement>("[data-active]");
    if (!row) {
      pill.style.opacity = "0";
      return;
    }
    const rowTop = row.offsetTop;
    const rowH = row.offsetHeight;
    const scrollTop = list.scrollTop;
    const viewH = list.clientHeight;
    const prev = row.previousElementSibling as HTMLElement | null;
    const title = prev?.classList.contains("ui-cbx__group-label") ? prev.offsetHeight : 0;
    const first = !pill.dataset.ready;
    if (first) pill.style.transition = "none";
    pill.style.opacity = "1";
    pill.style.height = `${rowH}px`;
    pill.style.transform = `translateY(${rowTop}px)`;
    if (first) {
      pill.dataset.ready = "1";
      void pill.offsetWidth;
      pill.style.transition = "";
    }
    if (!this.byKeyboard) return;
    this.byKeyboard = false;
    const pad = 6;
    const top = rowTop - pad - title;
    const bottom = rowTop + rowH + pad;
    if (top < scrollTop) list.scrollTop = top;
    else if (bottom > scrollTop + viewH) list.scrollTop = bottom - viewH;
  }

  /* ---------- Keyboard and pointer ---------- */

  private order: string[] = [];
  private current: string | undefined;

  private move(step: number) {
    if (!this.order.length) return;
    this.byKeyboard = true;
    this.kbd = true;
    const i = Math.max(0, this.order.indexOf(this.current ?? ""));
    this.active = this.order[(i + step + this.order.length) % this.order.length];
  }

  private choose(v: string) {
    if (v === CREATE) this.create(this.query.trim());
    else this.pick(this.optionOf(v));
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Keys typed into an IME belong to the IME
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key !== "Backspace") this.armed = null;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!this.open) {
        this.setOpen(true);
        return;
      }
      this.move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter") {
      if (!this.open || !this.current) return;
      e.preventDefault();
      this.choose(this.current);
    } else if (e.key === "Escape") {
      if (this.open) {
        e.preventDefault();
        e.stopPropagation();
        this.setOpen(false);
      } else if (this.query) this.query = "";
    } else if (e.key === "Tab") {
      this.setOpen(false);
    } else if (e.key === "Backspace" && !this.query && this.value.length) {
      // First press highlights the last chip, the second removes it
      e.preventDefault();
      const last = this.value[this.value.length - 1];
      if (this.armed === last) this.removeValue(last);
      else {
        this.armed = last;
        this.announce = `${this.optionOf(last).label} – press Backspace again to remove`;
      }
    }
  };

  private onFieldDown = (e: MouseEvent) => {
    if (this.isDisabled || (e.target as HTMLElement).closest("button")) return;
    if (e.target !== this.input) e.preventDefault();
    this.input?.focus();
    this.armed = null;
    this.setOpen(true);
  };

  /* ---------- Render ---------- */

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const disabled = this.isDisabled;
    const q = this.query.trim();
    const needle = q.toLowerCase();
    const groups = this.groups(needle);
    const canCreate = this.creatable && !!q && !this.all.some((o) => o.label.toLowerCase() === needle);
    const order = [...groups.flatMap((g) => g.options.map((o) => o.value)), ...(canCreate ? [CREATE] : [])];
    const current = this.active !== null && order.includes(this.active) ? this.active : order[0];
    this.order = order;
    this.current = current;
    const orderIndex = new Map(order.map((v, i) => [v, i]));
    const optionId = (v: string) => `${this.uid}-o${orderIndex.get(v) ?? -1}`;
    const windowed = order.length > WINDOW_FROM;
    const keep = windowed ? this.windowRows(groups, current) : null;

    // Chips past max-visible-tags (Clean: or past the line) hide behind "+N"; leaving chips keep their spot
    const max = Math.min(this.maxVisibleTags ?? Infinity, clean ? this.fit : Infinity);
    let seen = 0;
    const shownChips = this.chips.filter((c) => (c.leaving ? seen < max : seen++ < max));
    const live = this.chips.filter((c) => !c.leaving);
    const hidden = Math.max(0, live.length - max);
    if (hidden > 0 && hidden !== this.lastHidden) {
      this.hiddenDir = hidden > this.lastHidden ? "up" : "down";
      this.lastHidden = hidden;
    }
    const shownHidden = hidden || this.lastHidden;
    const armedMore = !!this.armed && hidden > 0 && !shownChips.some((c) => c.value === this.armed);
    const hiddenLabels = hidden ? live.filter((c) => !shownChips.includes(c)).map((c) => this.optionOf(c.value).label) : [];
    if (this.value.length !== this.lastCount) {
      this.countDir = this.value.length > this.lastCount ? "up" : "down";
      this.lastCount = this.value.length;
    }
    const showChips = clean ? this.chips.length > 0 : shownChips.length > 0 || this.maxVisibleTags !== undefined;

    const listbox = this.renderListbox(groups, order, current, q, optionId, keep, canCreate, orderIndex);
    return html`
      ${this.label ? html`<label class="ui-cbx__label" id=${`${this.uid}-label`} for=${`${this.uid}-input`}>${this.label}</label>` : nothing}
      <div class="ui-cbx__field" @mousedown=${this.onFieldDown}>
        <div class="ui-cbx__field-inner">
          ${clean ? this.renderMeasure() : nothing}
          ${showChips ? this.renderChips(shownChips, hidden, shownHidden, armedMore, hiddenLabels, clean) : nothing}
          <input
            id=${`${this.uid}-input`}
            class="ui-cbx__input"
            .value=${this.query}
            placeholder=${ifDefined(this.value.length ? undefined : this.placeholder)}
            autocomplete="off"
            spellcheck="false"
            role="combobox"
            aria-expanded=${this.open ? "true" : "false"}
            aria-controls=${`${this.uid}-list`}
            aria-autocomplete="list"
            aria-activedescendant=${ifDefined(this.open && current ? optionId(current) : undefined)}
            aria-labelledby=${ifDefined(this.label ? `${this.uid}-label` : undefined)}
            aria-required=${ifDefined(this.required ? "true" : undefined)}
            aria-invalid=${ifDefined(this.invalid ? "true" : undefined)}
            ?disabled=${disabled}
            @focus=${() => (this.kbd = true)}
            @input=${(e: Event) => {
              this.kbd = true;
              this.query = (e.target as HTMLInputElement).value;
              this.active = null;
              this.armed = null;
              this.setOpen(true);
            }}
            @keydown=${this.onKeyDown}
          />
        </div>
        <button
          type="button"
          class="ui-cbx__toggle"
          tabindex="-1"
          ?disabled=${disabled}
          aria-label=${this.open ? "Close list" : "Open list"}
          @mousedown=${keepFocus}
          @click=${() => {
            this.input?.focus();
            this.setOpen(!this.open);
          }}
        >
          ${glyph(icons.chevron)}
        </button>
      </div>
      ${this.open && !disabled
        ? html`<div class="ui-cbx__pop" @mousedown=${keepFocus}>
            ${clean ? listbox : html`<div class="ui-cbx__card">${listbox}</div>`}
            <div class="ui-cbx__foot" aria-hidden="true">
              <span class="ui-cbx__count"
                ><span class="ui-cbx__roll">${keyed(this.value.length, html`<span data-dir=${this.countDir}>${this.value.length}</span>`)}</span>&nbsp;selected</span
              >
              <span class="ui-cbx__keys"
                ><kbd>↑</kbd><kbd>↓</kbd><span>to move</span><kbd>↵</kbd><span>to ${this.single ? "pick" : "toggle"}</span></span
              >
            </div>
          </div>`
        : nothing}
      <span class="ui-cbx__live" aria-live="polite">${this.announce}</span>
    `;
  }

  /** Long lists: the options near the visible part, plus the active one */
  private windowRows(groups: Group[], current?: string) {
    const win = this.win;
    const keep = new Set<string>();
    const lo = win.top - OVERSCAN * win.row;
    const hi = win.top + win.height + OVERSCAN * win.row;
    let y = 0;
    for (const g of groups) {
      if (g.name) y += win.label;
      for (const o of g.options) {
        if (y + win.row > lo && y < hi) keep.add(o.value);
        y += win.row;
      }
    }
    if (current) keep.add(current);
    return keep;
  }

  private renderListbox(groups: Group[], order: string[], current: string | undefined, q: string, optionId: (v: string) => string, keep: Set<string> | null, canCreate: boolean, orderIndex: Map<string, number>) {
    const total = order.length;
    const win = this.win;
    const row = (o: ComboboxOption) => {
      const on = this.value.includes(o.value);
      return html`<div
        id=${optionId(o.value)}
        role="option"
        aria-selected=${on ? "true" : "false"}
        aria-setsize=${ifDefined(keep ? String(total) : undefined)}
        aria-posinset=${ifDefined(keep ? String((orderIndex.get(o.value) ?? 0) + 1) : undefined)}
        ?data-active=${current === o.value}
        class="ui-cbx__option"
        @mousedown=${keepFocus}
        @mousemove=${() => {
          this.kbd = false;
          if (this.current !== o.value) this.active = o.value;
        }}
        @click=${() => {
          this.active = o.value;
          this.pick(o);
        }}
      >
        ${visual(o)}
        <span class="ui-cbx__text"
          ><span class="ui-cbx__name">${highlight(o.label, q)}</span>${o.hint ? html`<span class="ui-cbx__hint">${highlight(o.hint, q)}</span>` : nothing}</span
        >
        ${glyph(icons.check, "ui-cbx__check")}
      </div>`;
    };
    const gapEl = (h: number) => html`<div class="ui-cbx__gap" aria-hidden="true" style=${styleMap({ height: `${h}px` })}></div>`;

    // Windowed: options out of view become spacers of the same height, whole groups out of view one spacer each
    const nodes: TemplateResult[] = [];
    let gap = 0;
    groups.forEach((g, gi) => {
      const shown = keep ? g.options.filter((o) => keep.has(o.value)) : g.options;
      if (keep && !shown.length) {
        gap += (g.name ? win.label : 0) + g.options.length * win.row;
        return;
      }
      if (gap) nodes.push(gapEl(gap));
      gap = 0;
      const inner: TemplateResult[] = [];
      let skip = 0;
      for (const o of g.options) {
        if (keep && !keep.has(o.value)) {
          skip += win.row;
          continue;
        }
        if (skip) inner.push(gapEl(skip));
        skip = 0;
        inner.push(row(o));
      }
      if (skip) gap += skip;
      nodes.push(html`<div role="group" aria-labelledby=${ifDefined(g.name ? `${this.uid}-g${gi}` : undefined)} class="ui-cbx__group">
        ${g.name ? html`<div class="ui-cbx__group-label" id=${`${this.uid}-g${gi}`}>${g.name}</div>` : nothing}${inner}
      </div>`);
    });
    if (gap) nodes.push(gapEl(gap));

    const busy = this.creating?.text === q && !this.creating.failed;
    return html`<div
      id=${`${this.uid}-list`}
      class="ui-cbx__list"
      role="listbox"
      aria-multiselectable=${ifDefined(this.single ? undefined : "true")}
      aria-labelledby=${ifDefined(this.label ? `${this.uid}-label` : undefined)}
      aria-label=${ifDefined(this.label ? undefined : "Options")}
    >
      <span class="ui-cbx__pill" aria-hidden="true"></span>
      <div class="ui-cbx__list-inner">
        ${nodes}
        ${!groups.length ? keyed(q, html`<div class="ui-cbx__empty">${this.emptyText}${q ? html` for “${q}”` : nothing}</div>`) : nothing}
        ${canCreate
          ? html`<div
              id=${optionId(CREATE)}
              role="option"
              aria-selected="false"
              aria-busy=${ifDefined(busy ? "true" : undefined)}
              aria-setsize=${ifDefined(keep ? String(total) : undefined)}
              aria-posinset=${ifDefined(keep ? String(total) : undefined)}
              ?data-active=${current === CREATE}
              class="ui-cbx__option ui-cbx__create"
              @mousedown=${keepFocus}
              @mousemove=${() => {
                this.kbd = false;
                if (this.current !== CREATE) this.active = CREATE;
              }}
              @click=${() => this.create(q)}
            >
              <span class="ui-cbx__plus" aria-hidden="true">${glyph(icons.plus)}</span>
              <span class="ui-cbx__name"
                >${this.creating?.text === q ? (this.creating.failed ? `Couldn't create “${q}” – try again` : `${this.createLabel(q)}…`) : this.createLabel(q)}</span
              >
            </div>`
          : nothing}
      </div>
    </div>`;
  }

  /** Clean: a hidden copy of the chips plus a "+99" sample, only to measure how many fit on the line */
  private renderMeasure() {
    return html`<ul class="ui-cbx__measure" aria-hidden="true">
      ${repeat(
        this.chips.filter((c) => !c.leaving),
        (c) => c.value,
        (c) => {
          const o = this.optionOf(c.value);
          const plain = !o.icon && !o.avatar && !o.color;
          return html`<li class="ui-cbx__chip" ?data-plain=${plain}>
            <span class="ui-cbx__chip-body">${visual(o)}<span class="ui-cbx__chip-label">${o.label}</span><span class="ui-cbx__chip-x"></span></span>
          </li>`;
        },
      )}
      <li class="ui-cbx__chip ui-cbx__more"><span class="ui-cbx__chip-body">+99</span></li>
    </ul>`;
  }

  /** The picked values as chips, and "+N" for those that don't show */
  private renderChips(shown: Chip[], hidden: number, shownHidden: number, armedMore: boolean, hiddenLabels: string[], clean: boolean) {
    const disabled = this.isDisabled;
    return html`<ul class="ui-cbx__chips" role="list" aria-label="Selected">
      ${repeat(
        shown,
        (c) => c.value,
        (c) => {
          const o = this.optionOf(c.value);
          const plain = !o.icon && !o.avatar && !o.color;
          return html`<li class="ui-cbx__chip" data-value=${c.value} ?data-leaving=${c.leaving} ?data-armed=${this.armed === c.value} ?data-plain=${plain}>
            <span class="ui-cbx__chip-body">
              ${visual(o)}<span class="ui-cbx__chip-label">${o.label}</span>
              <button
                type="button"
                class="ui-cbx__chip-x"
                tabindex="-1"
                ?disabled=${disabled}
                aria-label=${`Remove ${o.label}`}
                @mousedown=${keepFocus}
                @click=${() => this.removeValue(c.value)}
              >
                ${glyph(icons.close)}
              </button>
            </span>
          </li>`;
        },
      )}
      ${clean || this.maxVisibleTags !== undefined
        ? html`<li class="ui-cbx__chip ui-cbx__more" ?data-hidden=${!hidden} ?data-armed=${armedMore} aria-hidden=${ifDefined(hidden ? undefined : "true")}>
            <button
              type="button"
              class="ui-cbx__chip-body"
              tabindex="-1"
              ?disabled=${disabled || !hidden}
              aria-label=${`${hidden} more selected: ${hiddenLabels.join(", ")}`}
              title=${hiddenLabels.join(", ")}
              @mousedown=${keepFocus}
              @click=${() => {
                this.input?.focus();
                this.setOpen(true);
              }}
            >
              +<span class="ui-cbx__roll">${keyed(shownHidden, html`<span data-dir=${this.hiddenDir}>${shownHidden}</span>`)}</span>
            </button>
          </li>`
        : nothing}
    </ul>`;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="cbx"]. Fields, menus and key chips use the pattern tokens */
[data-ui="cbx"] {
  position: relative;
  display: block;
  width: 100%;
  max-width: 440px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cbx"] {
  /* The chip a second Backspace will remove */
  --tc-combobox-chip-border-armed: light-dark(#b5b5b5, #5c5c63);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-secondary);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cbx"] {
  /* The chip a second Backspace will remove */
  --tc-combobox-chip-border-armed: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-primary);
}
[data-ui="cbx"] *, [data-ui="cbx"] *::before, [data-ui="cbx"] *::after { box-sizing: border-box; }
:where([data-ui="cbx"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="cbx"]) svg { display: block; flex: none; }
.ui-cbx__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__glyph { stroke-width: 1.8; }
/* 16px icons with thin ~1.1px lines */
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__glyph { stroke-width: 1.65; }
.ui-cbx__label { display: block; font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__label { margin: 0 0 var(--tc-space-2) var(--tc-space-0-5); font-size: var(--tc-font-size-md); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__label { margin: 0 0 var(--tc-space-1-5) var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
/* The field (the reference text field): its edge is the control border, focus a ring plus halo on the whole box. Its
   height glides when chips wrap */
.ui-cbx__field {
  position: relative;
  overflow: hidden;
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  cursor: text;
  transition: height var(--tc-duration-slow) var(--tc-ease-move), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-cbx__field:hover { box-shadow: var(--tc-field-shadow-hover); }
[data-ui="cbx"][data-invalid] .ui-cbx__field { box-shadow: var(--tc-field-shadow-invalid); }
[data-ui="cbx"] .ui-cbx__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
/* Chips sit 4px in from the edge, so the empty field is exactly --tc-field-h tall; the chevron keeps the right end */
.ui-cbx__field-inner { display: flex; align-items: center; min-height: var(--tc-field-h); padding: 4px var(--tc-field-h) 4px 4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__field-inner { flex-wrap: wrap; row-gap: var(--tc-space-1); }
/* Always one line: chips that don't fit go into "+N" */
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__field-inner { position: relative; flex-wrap: nowrap; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__measure { position: absolute; top: 0; left: 0; display: flex; width: max-content; margin: 0; padding: 0; list-style: none; visibility: hidden; pointer-events: none; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chips > .ui-cbx__chip { flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__measure > .ui-cbx__chip { flex: none; max-width: none; }
.ui-cbx__chips { display: contents; margin: 0; padding: 0; list-style: none; }
/* Chips: the outer grid folds the width, the body flashes and pops */
.ui-cbx__chip {
  display: grid;
  grid-template-columns: 1fr;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  margin-right: var(--tc-space-1);
  transition: grid-template-columns var(--tc-duration-moderate) var(--tc-ease-move) var(--tc-duration-fast), margin-right var(--tc-duration-moderate) var(--tc-ease-move) var(--tc-duration-fast), opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-fast);
}
.ui-cbx__chip[data-leaving] { grid-template-columns: 0fr; margin-right: 0; opacity: 0; pointer-events: none; }
.ui-cbx__chip-body {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  height: calc(var(--tc-field-h) - 8px);
  overflow: hidden;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-fill-default);
  white-space: nowrap;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip-body { padding: 0 var(--tc-space-0-5) 0 var(--tc-space-1); box-shadow: inset 0 0 0 1px var(--tc-border-default); font-size: var(--tc-font-size-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip-body { padding: 0 var(--tc-space-1) 0 var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip[data-plain] .ui-cbx__chip-body { padding-left: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip[data-plain] .ui-cbx__chip-body { padding-left: var(--tc-space-2); }
.ui-cbx__chip[data-armed] .ui-cbx__chip-body { background: var(--tc-fill-strong); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-combobox-chip-border-armed); }
.ui-cbx__chip[data-leaving] .ui-cbx__chip-body { animation: ui-cbx-flash var(--tc-duration-slow) var(--tc-ease-decelerate) both; }
.ui-cbx__chip-label { min-width: 0; max-width: 168px; overflow: hidden; text-overflow: ellipsis; }
/* The ×: drawn small, but its target is 24 × 24 (2.5.8) */
.ui-cbx__chip-x { position: relative; display: grid; place-items: center; flex: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cbx__chip-x::after { content: ""; position: absolute; top: 50%; left: 50%; width: 24px; height: 24px; transform: translate(-50%, -50%); }
.ui-cbx__chip-x:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip-x { width: 20px; height: 20px; border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip-x:hover { background: var(--tc-fill-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip-x .ui-cbx__glyph { width: 13px; height: 13px; stroke-width: 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip .ui-cbx__avatar { width: 18px; height: 18px; font-size: 8.5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__chip .ui-cbx__dot { margin: 0 var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip-x { width: 18px; height: 18px; border-radius: var(--tc-radius-xs); color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip-x:hover { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip-x .ui-cbx__glyph { width: 12px; height: 12px; stroke-width: 1.9; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip .ui-cbx__avatar { width: 16px; height: 16px; font-size: 7px; background: var(--tc-surface-raised); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip .ui-cbx__dot { margin: 0 1px 0 var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__chip .ui-cbx__icon { width: 16px; height: 16px; }
/* "+3": folds open and closed like a chip, the number rolls; it names the hidden ones and opens the list */
.ui-cbx__more .ui-cbx__chip-body { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-cbx__more .ui-cbx__chip-body:hover { background: var(--tc-fill-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__more .ui-cbx__chip-body { padding: 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__more .ui-cbx__chip-body { padding: 0 var(--tc-space-2); gap: 0; }
.ui-cbx__more { transition-delay: 0ms; }
.ui-cbx__more[data-hidden] { grid-template-columns: 0fr; margin-right: 0; opacity: 0; }
.ui-cbx__roll { display: inline-grid; overflow: hidden; }
.ui-cbx__roll > span { animation: ui-cbx-roll-up var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-cbx__roll > span[data-dir="down"] { animation-name: ui-cbx-roll-down; }
/* The text input: no box of its own – the field around it shows focus */
.ui-cbx__input {
  flex: 1 0 72px;
  min-width: 72px;
  height: calc(var(--tc-field-h) - 8px);
  margin: 0;
  padding: 0 var(--tc-space-1) 0 var(--tc-space-1-5);
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
  outline: none;
}
.ui-cbx__input::placeholder { color: var(--tc-text-placeholder); }
/* The chevron: a small ghost button */
.ui-cbx__toggle { position: absolute; top: 4px; right: 4px; display: grid; place-items: center; width: calc(var(--tc-field-h) - 8px); height: calc(var(--tc-field-h) - 8px); border-radius: var(--tc-control-radius-sm); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cbx__toggle:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__toggle { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__toggle { color: var(--tc-icon-muted); }
.ui-cbx__toggle .ui-cbx__glyph { transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
[data-ui="cbx"][data-open] .ui-cbx__toggle .ui-cbx__glyph { transform: rotate(180deg); }
/* Avatars, dots, icons */
.ui-cbx__avatar {
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
  color: var(--tc-text-secondary);
  font-size: var(--tc-avatar-font-size);
  line-height: var(--tc-line-height-none);
  font-weight: var(--tc-avatar-font-weight);
  letter-spacing: 0.02em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__avatar { width: var(--tc-avatar-md); height: var(--tc-avatar-md); background: var(--tc-fill-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__avatar { width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); background: var(--tc-fill-default); }
.ui-cbx__dot { flex: none; width: 8px; height: 8px; margin: 0 var(--tc-space-1); border-radius: 50%; }
.ui-cbx__icon { display: grid; place-items: center; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__icon { width: 18px; height: 18px; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__icon { width: 20px; height: 20px; color: var(--tc-icon-muted); }
.ui-cbx__icon svg { width: 16px; height: 16px; }
/* The list: a menu popover. Standard sets the menu card on a tray whose last row is the count and keys */
.ui-cbx__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  box-shadow: var(--tc-menu-shadow);
  transform-origin: top center;
  animation: ui-cbx-open var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__pop { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__card { overflow: hidden; border-radius: calc(var(--tc-tray-radius) - var(--tc-tray-inset)); background: var(--tc-menu-bg); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default); }
/* Clean: one popover with the count and keys as its last row */
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__pop { overflow: hidden; border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); }
.ui-cbx__list { position: relative; max-height: 300px; padding: var(--tc-menu-padding); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
/* The active row – the one ↵ picks. While the keyboard drives the list it also gets the focus ring */
.ui-cbx__pill {
  position: absolute;
  top: 0;
  left: var(--tc-menu-padding);
  right: var(--tc-menu-padding);
  border-radius: var(--tc-menu-item-radius);
  background: var(--tc-menu-item-hover);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-base) var(--tc-ease-move), height var(--tc-duration-base) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
/* Clean: a short, crisp move between rows – no long glide */
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__pill { transition-duration: var(--tc-duration-instant), var(--tc-duration-instant), var(--tc-duration-fast), var(--tc-duration-fast); }
[data-ui="cbx"][data-kbd] .ui-cbx__field:focus-within ~ .ui-cbx__pop .ui-cbx__pill { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-cbx__group-label {
  padding: 8px var(--tc-menu-item-px) 4px;
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-cbx__group:first-child .ui-cbx__group-label { padding-top: var(--tc-space-1); }
.ui-cbx__option { position: relative; display: flex; align-items: center; height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__option { gap: var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__option { gap: var(--tc-space-2); }
.ui-cbx__text { display: flex; flex: 1; align-items: baseline; gap: var(--tc-space-2); min-width: 0; }
/* The name wins over the hint when space runs out */
.ui-cbx__name { flex: 0 0 auto; max-width: 100%; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-cbx__hint { flex: 0 100 auto; min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__hint { font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__hint { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
[data-ui="cbx"] mark { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); color: inherit; }
/* Picked: the check in the menu's selected colour. It pops in with a small spring and fades out quickly */
.ui-cbx__check { width: 16px; height: 16px; margin-left: auto; color: var(--tc-menu-item-selected-fg); opacity: 0; transform: scale(0.4); transition: opacity var(--tc-duration-quick) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__check { stroke-width: 2.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__check { stroke-width: 1.8; }
.ui-cbx__option[aria-selected="true"] .ui-cbx__check { opacity: 1; transform: none; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-slower) var(--tc-ease-spring); }
.ui-cbx__empty { text-align: center; color: var(--tc-text-muted); animation: ui-cbx-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__empty { padding: var(--tc-space-3-5) var(--tc-space-2-5) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__empty { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2-5); }
.ui-cbx__create { animation: ui-cbx-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-cbx__plus { display: grid; place-items: center; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__plus { width: 24px; height: 24px; border-radius: 50%; color: var(--tc-text-muted); box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__plus .ui-cbx__glyph { width: 13px; height: 13px; stroke-width: 2; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__plus { width: 20px; height: 20px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-fill-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__plus .ui-cbx__glyph { width: 12px; height: 12px; stroke-width: 1.9; }
/* Standard: the tray below the card · Clean: the popover's last row, under a hairline */
.ui-cbx__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); height: 32px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__foot { padding: 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__foot { padding: 0 var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cbx__count { display: inline-flex; font-variant-numeric: tabular-nums; }
.ui-cbx__keys { display: inline-flex; align-items: center; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__keys { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__keys { gap: var(--tc-space-0-5); }
[data-ui="cbx"] kbd {
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
.ui-cbx__keys > span { margin: 0 var(--tc-space-1-5) 0 var(--tc-space-0-5); }
.ui-cbx__keys > span:last-child { margin-right: 0; }
.ui-cbx__live, .ui-cbx__proxy { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-cbx__proxy { bottom: 0; left: 50%; padding: 0; border: 0; opacity: 0; pointer-events: none; }
[data-ui="cbx"][data-disabled] .ui-cbx__field { opacity: 0.55; cursor: not-allowed; }
[data-ui="cbx"][data-disabled] .ui-cbx__field * { cursor: not-allowed; }
@keyframes ui-cbx-open { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes ui-cbx-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-cbx-flash { 0% { background-color: var(--tc-fill-default); } 35% { background-color: var(--tc-fill-strong); } 100% { background-color: var(--tc-fill-strong); transform: scale(0.92); } }
@keyframes ui-cbx-roll-up { from { opacity: 0; transform: translateY(70%); } to { opacity: 1; transform: none; } }
@keyframes ui-cbx-roll-down { from { opacity: 0; transform: translateY(-70%); } to { opacity: 1; transform: none; } }
/* Narrow (phones): no key hints, chips may use the full width; the text field fits next to a chip */
@container (max-width: 380px) {
  .ui-cbx__keys { display: none; }
  .ui-cbx__chip-label { max-width: 132px; }
  .ui-cbx__input { flex-basis: 44px; min-width: 44px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__hint { font-size: var(--tc-font-size-sm); }
}
/* Touch screens: bigger rows, chips and buttons; 16px text so iOS doesn't zoom in */
@media (hover: none) and (pointer: coarse) {
  .ui-cbx__chip-body { height: 32px; }
  .ui-cbx__chip-x { width: 26px; height: 26px; }
  .ui-cbx__input { height: 32px; font-size: var(--tc-font-size-xl); }
  .ui-cbx__toggle { width: 32px; height: 32px; }
  .ui-cbx__option { height: 44px; }
  .ui-cbx__list { max-height: 340px; }
  .ui-cbx__keys { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cbx__field-inner { min-height: 44px; padding-right: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cbx__field-inner { min-height: 40px; padding: var(--tc-space-1) var(--tc-space-10) var(--tc-space-1) var(--tc-space-1); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cbx"] *, [data-ui="cbx"] *::before, [data-ui="cbx"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-combobox")) customElements.define("tc-combobox", TcCombobox);

declare global {
  interface HTMLElementTagNameMap {
    "tc-combobox": TcCombobox;
  }
  interface HTMLElementEventMap {
    "tc-value-change": CustomEvent<ComboboxValueChange>;
    "tc-open-change": CustomEvent<{ open: boolean }>;
  }
}
