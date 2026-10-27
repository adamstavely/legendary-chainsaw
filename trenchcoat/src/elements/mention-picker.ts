import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { initials, textCaret } from "./internal/util";

/*
 * <tc-mention-picker> – the / and @ picker inside a composer. It attaches to a text field the app owns (a <textarea>,
 * an <input> or a contenteditable element), opens when a trigger character is typed, filters as the user types after
 * it, and on ↵ / Tab / click replaces the typed query with a token (textarea, input) or a chip (contenteditable).
 *
 *   <textarea id=msg aria-label="Message"></textarea>
 *   <tc-mention-picker for="msg" .triggers=${[{ char: "@", groups: people }, { char: "/", atLineStart: true, groups: commands }]}>
 *   </tc-mention-picker>
 *
 * The field keeps focus the whole time: it is the combobox (aria-controls, aria-activedescendant on it point at the
 * listbox here). A <textarea> may not take role="combobox" (ARIA in HTML), so it keeps its textbox role and gets
 * aria-autocomplete="list" plus the two references; an <input> or a contenteditable element without a role of its
 * own becomes role="combobox" with aria-expanded. ↑ ↓ move (wrapping), ↵ or Tab inserts, Esc closes until the next
 * trigger, and moving the caret out of the query closes it. Keys are taken in the capture phase on the field, so a
 * composer's own Enter-to-send never sees an ↵ that picked a row.
 *
 * The list is a popover in the top layer (where the Popover API exists), anchored under the trigger character – or
 * above it when there's more room there – so a field inside a clipped or contained card doesn't cut it off.
 * Standard sets the menu card on a gray tray whose last row holds the keys; Clean is one white popover with hairline
 * shadows and the keys as its last row.
 *
 * Matching ranks a label's start first, then a word's start (in the label or the keywords), then the rest of the
 * label, then the hint and description; the mark sits on the part that matched. A trigger can list `recent` items
 * first while nothing is typed, rank one list across its groups while something is (`rankAcrossGroups`), show its
 * character on each row (`showChar`), search on its own (`search`), and word its empty state, status and a note. Rows
 * with a `description` take two lines. A failed search tries again on ↵.
 */

export type MentionPickerItem = {
  id: string;
  label: string;
  /** Lighter text after the label – a role, a path, what a command does */
  hint?: string;
  /** An icon element, cloned per row – wins over avatar */
  icon?: Element;
  /** An image URL, or true for initials from the label */
  avatar?: string | boolean;
  /** Extra words that should find this item */
  keywords?: string;
  /** What lands in a textarea / input, and the chip's text – default: the trigger plus the label, e.g. "@Maya Chen" */
  token?: string;
  /** A second, quieter line under the label – what a command or skill does. It is matched too */
  description?: string;
};

export type MentionPickerGroup = { id: string; label: string; items: MentionPickerItem[] };

export type MentionPickerTrigger = {
  /** One character, e.g. "@" or "/" */
  char: string;
  groups: MentionPickerGroup[];
  /** Only at the start of a line (slash commands) */
  atLineStart?: boolean;
  /** The listbox's name for screen readers, e.g. "People and files" (default "Suggestions") */
  label?: string;
  /** Ids of items listed first, under `recentLabel`, while nothing is typed after the trigger */
  recent?: string[];
  /** The heading over the `recent` items (default "Recent") */
  recentLabel?: string;
  /** Rows show the trigger character before the label – "/translate" */
  showChar?: boolean;
  /** While a query is typed, one list ranked across the groups (each row tagged with its group) instead of group by group */
  rankAcrossGroups?: boolean;
  /** Finds suggestions for this trigger in place of the built-in filter – wins over the picker's `search` */
  search?: MentionPickerSearch;
  /** What the list says when nothing matches – wins over the picker's `emptyText` */
  emptyText?: string;
  /** A quieter line under the empty text: what to try instead */
  emptyHint?: string;
  /** What the status calls the results, one and many – default ["suggestion", "suggestions"] */
  noun?: [string, string];
  /** A quiet line over the list, e.g. "Picking one replaces /translate" – said with the count */
  note?: string;
};

/** Finds suggestions for a query – in place of the built-in filter over `groups`. May return a promise; the signal
 *  aborts when the query changes, the picker closes or the element is removed */
export type MentionPickerSearch = (query: string, trigger: string, options: { signal: AbortSignal }) => MentionPickerGroup[] | Promise<MentionPickerGroup[]>;

/** Builds the chip a pick inserts into a contenteditable field – in place of the built-in one */
export type MentionPickerRenderChip = (item: MentionPickerItem, trigger: string) => Node;

export type MentionPickerPick = { item: MentionPickerItem; trigger: string; query: string; token: string };
export type MentionPickerPickEvent = CustomEvent<MentionPickerPick>;
export type MentionPickerOpenChange = { open: boolean; trigger: string | null; query: string };
export type MentionPickerQueryChange = { query: string; trigger: string };

type Field = HTMLTextAreaElement | HTMLInputElement | HTMLElement;
type Context = { trigger: MentionPickerTrigger; start: number; end: number; query: string; node?: Text };
/** `tag`: the row's group, shown on the row when one ranked list mixes groups */
type Row = { key: string; item: MentionPickerItem; group: MentionPickerGroup; tag?: string };
/** `group` is null for one ranked list (rankAcrossGroups); `total` counts every match, `rows` only those shown */
type View = { groups: { group: MentionPickerGroup | null; rows: Row[] }[]; rows: Row[]; q: string; total: number };
const NONE: View = { groups: [], rows: [], q: "", total: 0 };
const RECENT = "\u0000recent";

/** The longest query a trigger keeps listening to */
const MAX_QUERY = 48;
/** Room between the trigger character and the list, and from the viewport's edges, in px */
const GAP = 6;
const EDGE = 8;

const isText = (f: Field): f is HTMLTextAreaElement | HTMLInputElement => f instanceof HTMLTextAreaElement || f instanceof HTMLInputElement;

/** What separates words in a label: "billing-spec.md", "create_report", "docs/api" */
const SEP = /[\s._/:-]+/;
const words = (s: string) => s.split(SEP);

/** Where the query matches: the start, else a word's start ("re" in "create-report"), else anywhere – -1 for nowhere */
const matchAt = (text: string, q: string) => {
  const t = text.toLowerCase();
  if (t.startsWith(q)) return 0;
  for (let i = t.indexOf(q, 1); i > 0; i = t.indexOf(q, i + 1)) if (SEP.test(t[i - 1])) return i;
  return t.indexOf(q);
};

/** The typed text, marked where it matches */
const highlight = (text: string, query: string): TemplateResult | string => {
  const q = query.trim().toLowerCase();
  const i = q ? matchAt(text, q) : -1;
  if (i < 0) return text;
  return html`${text.slice(0, i)}<mark>${text.slice(i, i + q.length)}</mark>${text.slice(i + q.length)}`;
};

/**
 * How well an item matches – 0 is no match. The whole label ranks first, then its start, then a word's start in the label or the
 * keywords, then anywhere in the label, then a word's start in the hint or description, then anywhere in those
 */
const score = (item: MentionPickerItem, q: string) => {
  if (!q) return 1;
  const label = item.label.toLowerCase();
  if (label === q) return 7;
  if (label.startsWith(q)) return 6;
  if (words(label).some((w) => w.startsWith(q))) return 5;
  const keywords = (item.keywords ?? "").toLowerCase();
  if (keywords && words(keywords).some((w) => w.startsWith(q))) return 4;
  if (label.includes(q)) return 3;
  const more = `${item.hint ?? ""} ${item.description ?? ""}`.toLowerCase();
  if (words(more).some((w) => w.startsWith(q))) return 2;
  return more.includes(q) || keywords.includes(q) ? 1 : 0;
};

/* Glyphs: Standard draws 24px-grid icons with 1.8px strokes, Clean the same paths thinner */
const spinner = html`<span class="ui-mnp__spinner" aria-hidden="true"></span>`;
const searchGlyph = html`<svg viewBox="0 0 24 24" class="ui-mnp__glyph" aria-hidden="true">${svg`<circle cx="11" cy="11" r="6.5"></circle><path d="m20 20-4.2-4.2"></path>`}</svg>`;

let uid = 0;

/**
 * The / and @ picker for a text field the app owns: grouped results, arrow keys, ↵ / Tab inserts a token or a chip.
 * @tag tc-mention-picker
 * @fires tc-pick - A row was picked (`MentionPickerPick`: `{ item, trigger, query, token }`). Cancelable:
 *   preventDefault() leaves the field as it is – the app inserts the mention itself
 * @fires tc-open-change - The list opened or closed (`{ open, trigger, query }`)
 * @fires tc-query-change - The text after the trigger changed while open (`{ query, trigger }`)
 */
export class TcMentionPicker extends TcElement {
  static override ui = "mnp";

  /** The id of the field to attach to (in the same document) */
  @property({ attribute: "for" }) accessor htmlFor = "";
  /** The field to attach to – wins over `for` */
  @property({ attribute: false }) accessor target: HTMLElement | null = null;
  /** The trigger characters and what each one offers */
  @property({ attribute: false }) accessor triggers: MentionPickerTrigger[] = [];
  /** Finds suggestions in place of the built-in filter (see MentionPickerSearch) */
  @property({ attribute: false }) accessor search: MentionPickerSearch | undefined = undefined;
  /** Builds the chip for a contenteditable field (see MentionPickerRenderChip) */
  @property({ attribute: false }) accessor renderChip: MentionPickerRenderChip | undefined = undefined;
  /** Most rows shown at once */
  @property({ type: Number, attribute: "max-results" }) accessor maxResults = 50;
  /** "auto" opens below the trigger, or above it when there's more room there */
  @property() accessor placement: "auto" | "above" | "below" = "auto";
  /** What the list says when nothing matches */
  @property({ attribute: "empty-text" }) accessor emptyText = "No matches";
  /** Never opens */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  /** @internal Where the open query is; null while closed */
  @state() accessor context: Context | null = null;
  /** @internal The active row's key */
  @state() accessor active: string | null = null;
  /** @internal Results from `search` and their state */
  @state() accessor found: { query: string; trigger: string; groups: MentionPickerGroup[]; state: "ok" | "loading" | "failed" } | null = null;
  /** @internal What the status region says; repeats alternate a trailing no-break space, so they're read again */
  @state() accessor said: { text: string; n: number } = { text: "", n: 0 };

  private uid = `tc-mnp-${++uid}`;
  private field: Field | null = null;
  /** The field's own values of the attributes this sets, put back on detach */
  private saved: Record<string, string | null> = {};
  /** Esc closed the list for the trigger at this position: it stays closed until another trigger is typed */
  private dismissed: number | null = null;
  private searching: AbortController | null = null;
  private byKeyboard = false;
  private frame = 0;
  private clones = new WeakMap<Element, Element>();

  /** Whether the list is open */
  get open() {
    return !!this.context;
  }

  /** The field it is attached to */
  get attached(): HTMLElement | null {
    return this.field;
  }

  /** Closes the list (it opens again when the next trigger is typed) */
  close() {
    if (this.context) this.dismissed = this.context.start;
    this.setContext(null);
  }

  /** Reads the field again after a script changed its text or caret – opening the list on a trigger there, even one
   *  that Esc closed */
  sync() {
    this.dismissed = null;
    this.check();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.bind();
    // A `for` field rendered after the picker (a framework renders siblings in order): look once more next frame
    if (!this.field) this.frame = requestAnimationFrame(() => this.bind());
    this.ownerDocument.addEventListener("focusin", this.onDocFocus, true);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    cancelAnimationFrame(this.frame);
    this.ownerDocument.removeEventListener("focusin", this.onDocFocus, true);
    this.searching?.abort();
    this.searching = null;
    this.context = null;
    this.unbind();
    this.follow(false);
  }

  /* ---------- Attaching to the field ---------- */

  private resolve(): Field | null {
    if (this.target) return this.target;
    if (!this.htmlFor) return null;
    const root = this.getRootNode() as Document | ShadowRoot;
    return (root.getElementById?.(this.htmlFor) as Field | null) ?? this.ownerDocument.getElementById(this.htmlFor);
  }

  /** The field gets focus later than the picker connected – attach then */
  private onDocFocus = (e: FocusEvent) => {
    if (!this.field && e.target instanceof HTMLElement && (e.target === this.target || (this.htmlFor && e.target.id === this.htmlFor))) this.bind();
  };

  private bind() {
    const next = this.resolve();
    if (next === this.field) return;
    this.unbind();
    if (!next) return;
    this.field = next;
    const set = (name: string, value: string) => {
      if (!(name in this.saved)) this.saved[name] = next.getAttribute(name);
      next.setAttribute(name, value);
    };
    if (!(next instanceof HTMLTextAreaElement) && !next.hasAttribute("role")) set("role", "combobox");
    set("aria-autocomplete", "list");
    set("aria-controls", `${this.uid}-list`);
    if (next.getAttribute("role") === "combobox") set("aria-expanded", "false");
    if (!("aria-activedescendant" in this.saved)) this.saved["aria-activedescendant"] = next.getAttribute("aria-activedescendant");
    // Capture on the field: these run before the field's own (bubbling) handlers – an app's Enter-to-send included
    const el = next as HTMLElement;
    el.addEventListener("keydown", this.onKeyDown, true);
    el.addEventListener("input", this.onInput);
    el.addEventListener("keyup", this.onCaret);
    el.addEventListener("mouseup", this.onCaret);
    el.addEventListener("focusout", this.onBlur);
    el.addEventListener("scroll", this.onMove, { passive: true });
  }

  private unbind() {
    const field = this.field as HTMLElement | null;
    if (!field) return;
    field.removeEventListener("keydown", this.onKeyDown, true);
    field.removeEventListener("input", this.onInput);
    field.removeEventListener("keyup", this.onCaret);
    field.removeEventListener("mouseup", this.onCaret);
    field.removeEventListener("focusout", this.onBlur);
    field.removeEventListener("scroll", this.onMove);
    for (const [name, value] of Object.entries(this.saved)) {
      if (value === null) field.removeAttribute(name);
      else field.setAttribute(name, value);
    }
    this.saved = {};
    this.field = null;
  }

  /* ---------- Reading the query ---------- */

  /** The trigger and query the caret is in, if any */
  private read(): Context | null {
    const field = this.field;
    if (!field || this.disabled || !this.triggers.length) return null;
    let text: string;
    let caret: number;
    let node: Text | undefined;
    if (isText(field)) {
      if (field.selectionStart === null || field.selectionStart !== field.selectionEnd) return null;
      caret = field.selectionStart;
      text = field.value.slice(0, caret);
    } else {
      const sel = field.ownerDocument.getSelection();
      if (!sel || !sel.isCollapsed || !sel.anchorNode || !field.contains(sel.anchorNode) || sel.anchorNode.nodeType !== Node.TEXT_NODE) return null;
      node = sel.anchorNode as Text;
      caret = sel.anchorOffset;
      text = node.data.slice(0, caret);
    }
    for (let i = caret - 1; i >= Math.max(0, caret - MAX_QUERY - 1); i--) {
      const ch = text[i];
      if (/\s/.test(ch)) return null;
      const trigger = this.triggers.find((t) => t.char === ch);
      if (!trigger) continue;
      const before = text[i - 1];
      // Not inside a word ("ana@example.com", "and/or")
      if (before !== undefined && !/[\s([{"'“‘]/.test(before)) return null;
      if (trigger.atLineStart) {
        const line = text.slice(0, i);
        const lineStart = line.lastIndexOf("\n") + 1;
        // In a contenteditable the line may have begun in an earlier node (after a chip): not at its start then
        if (line.slice(lineStart).trim() || (node && lineStart === 0 && node.previousSibling)) return null;
      }
      return { trigger, start: i, end: caret, query: text.slice(i + 1), node };
    }
    return null;
  }

  private onInput = () => this.check();
  private onCaret = (e: Event) => {
    // Arrow keys that move the list are handled in keydown; their keyup mustn't re-read the caret
    if (e instanceof KeyboardEvent && this.context && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Tab" || e.key === "Escape")) return;
    this.check();
  };
  private onBlur = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    if (this.context) this.setContext(null);
  };
  private onMove = () => {
    if (this.context) this.place();
  };

  private check() {
    const next = this.read();
    if (next && this.dismissed === next.start) return;
    if (!next) this.dismissed = null;
    this.setContext(next);
  }

  private setContext(next: Context | null) {
    const prev = this.context;
    const was = !!prev;
    const changed = !prev || !next || prev.start !== next.start || prev.query !== next.query || prev.trigger !== next.trigger;
    this.context = next;
    if (!next) {
      this.searching?.abort();
      this.searching = null;
      this.found = null;
    }
    if (changed) this.active = null;
    if (was !== !!next) this.emit<MentionPickerOpenChange>("tc-open-change", { open: !!next, trigger: next?.trigger.char ?? null, query: next?.query ?? "" });
    if (next && changed && (!prev || prev.query !== next.query || prev.trigger !== next.trigger)) {
      this.emit<MentionPickerQueryChange>("tc-query-change", { query: next.query, trigger: next.trigger.char });
      this.runSearch(next);
    }
  }

  private runSearch(ctx: Context) {
    const search = ctx.trigger.search ?? this.search;
    if (!search) return;
    this.searching?.abort();
    const controller = new AbortController();
    this.searching = controller;
    const query = ctx.query;
    const trigger = ctx.trigger.char;
    let result: MentionPickerGroup[] | Promise<MentionPickerGroup[]>;
    try {
      result = search(query, trigger, { signal: controller.signal });
    } catch {
      this.found = { query, trigger, groups: [], state: "failed" };
      return;
    }
    if (!(result instanceof Promise)) {
      this.found = { query, trigger, groups: result, state: "ok" };
      return;
    }
    // Keep the last results on screen while the next ones load
    this.found = { query, trigger, groups: this.found?.trigger === trigger ? this.found.groups : [], state: "loading" };
    result.then(
      (groups) => {
        if (controller.signal.aborted || this.searching !== controller) return;
        this.found = { query, trigger, groups, state: "ok" };
      },
      () => {
        if (controller.signal.aborted || this.searching !== controller) return;
        this.found = { query, trigger, groups: [], state: "failed" };
      },
    );
  }

  /* ---------- The rows ---------- */

  /** The last view and what it was made from: render, updated, willUpdate and the keys all ask for it */
  private memo: { ctx: Context; found: unknown; search: unknown; max: number; view: View } | null = null;

  /** The groups and rows to show for the open query */
  private view(): View {
    const ctx = this.context;
    if (!ctx) return NONE;
    const m = this.memo;
    if (m && m.ctx === ctx && m.found === this.found && m.search === this.search && m.max === this.maxResults) return m.view;
    const view = this.compute(ctx);
    this.memo = { ctx, found: this.found, search: this.search, max: this.maxResults, view };
    return view;
  }

  private compute(ctx: Context): View {
    const q = ctx.query.trim().toLowerCase();
    const trigger = ctx.trigger;
    const searching = !!(trigger.search ?? this.search);
    let source = searching ? (this.found?.groups ?? []) : trigger.groups;
    // Nothing typed yet: the recent items first, under their own heading, and not again in their groups
    if (!q && trigger.recent?.length) {
      const wanted = new Set(trigger.recent);
      const found = new Map<string, MentionPickerItem>();
      for (const g of source) for (const it of g.items) if (wanted.has(it.id) && !found.has(it.id)) found.set(it.id, it);
      const items = trigger.recent.map((id) => found.get(id)).filter((it): it is MentionPickerItem => !!it);
      if (items.length) source = [{ id: RECENT, label: trigger.recentLabel ?? "Recent", items }, ...source.map((g) => ({ ...g, items: g.items.filter((it) => !found.has(it.id)) }))];
    }
    const matched = source
      .map((group, gi) => {
        const scored = group.items.map((item, i) => ({ item, i, gi, s: searching ? 1 : score(item, q) }));
        const kept = searching ? scored : scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i);
        return { group, scored: kept, best: kept[0]?.s ?? 0 };
      })
      .filter((g) => g.scored.length);
    const total = matched.reduce((n, g) => n + g.scored.length, 0);
    const max = Math.max(1, this.maxResults);
    const key = (group: MentionPickerGroup, item: MentionPickerItem) => `${group.id}\u0000${item.id}`;
    // One list ranked across the groups: the best matches first wherever they come from, each tagged with its group
    if (q && trigger.rankAcrossGroups) {
      const all = matched.flatMap((g) => g.scored.map((x) => ({ ...x, group: g.group })));
      if (!searching) all.sort((a, b) => b.s - a.s || a.gi - b.gi || a.i - b.i);
      const tagged = matched.length > 1;
      const rows = all.slice(0, max).map(({ item, group }) => ({ key: key(group, item), item, group, tag: tagged ? group.label : undefined }));
      return { groups: rows.length ? [{ group: null, rows }] : [], rows, q: ctx.query, total };
    }
    // Groups with the best match come first (the built-in filter; a search orders its own)
    if (!searching && q) matched.sort((a, b) => b.best - a.best);
    let left = max;
    const groups = matched
      .map(({ group, scored }) => {
        const rows = scored.slice(0, Math.max(0, left)).map(({ item }) => ({ key: key(group, item), item, group }));
        left -= rows.length;
        return { group, rows };
      })
      .filter((g) => g.rows.length);
    return { groups, rows: groups.flatMap((g) => g.rows), q: ctx.query, total };
  }

  private current(rows: Row[]) {
    return rows.find((r) => r.key === this.active) ?? rows[0];
  }

  private move(step: number) {
    const { rows } = this.view();
    if (!rows.length) return;
    const i = rows.indexOf(this.current(rows)!);
    this.active = rows[(i + step + rows.length) % rows.length].key;
    this.byKeyboard = true;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.context || e.isComposing || e.keyCode === 229) return;
    const take = () => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    const { rows } = this.view();
    const busy = this.found?.state === "loading";
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      take();
      this.move(e.key === "ArrowDown" ? 1 : -1);
    } else if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const row = this.current(rows);
      if (row) {
        take();
        this.pick(row);
      } else if (busy) take();
      // A failed search: ↵ tries again
      else if (this.found?.state === "failed" && e.key === "Enter") {
        take();
        this.runSearch(this.context);
      }
      // Nothing to pick: close and let the key through (Enter sends, Tab leaves)
      else this.close();
    } else if (e.key === "Escape") {
      take();
      this.close();
    }
  };

  /** Inserts a row's token (textarea, input) or chip (contenteditable) in place of the trigger and query */
  private pick(row: Row) {
    const ctx = this.context;
    const field = this.field;
    if (!ctx || !field) return;
    const trigger = ctx.trigger.char;
    const token = row.item.token ?? `${trigger}${row.item.label}`;
    const go = this.emit<MentionPickerPick>("tc-pick", { item: row.item, trigger, query: ctx.query, token }, { cancelable: true });
    this.dismissed = null;
    this.setContext(null);
    if (!go) return;
    if (isText(field)) {
      const after = field.value.slice(ctx.end, ctx.end + 1);
      const insert = /^\s$/.test(after) ? token : `${token} `;
      field.setRangeText(insert, ctx.start, ctx.end, "end");
      if (/^\s$/.test(after)) field.setSelectionRange(ctx.start + insert.length + 1, ctx.start + insert.length + 1);
    } else if (ctx.node && ctx.node.isConnected) {
      const doc = field.ownerDocument;
      const range = doc.createRange();
      range.setStart(ctx.node, ctx.start);
      range.setEnd(ctx.node, Math.min(ctx.end, ctx.node.length));
      range.deleteContents();
      const chip = this.renderChip?.(row.item, trigger) ?? this.chip(row.item, trigger, token);
      const space = doc.createTextNode(" ");
      range.insertNode(space);
      range.insertNode(chip);
      const sel = doc.getSelection();
      sel?.removeAllRanges();
      const caret = doc.createRange();
      caret.setStart(space, 1);
      caret.collapse(true);
      sel?.addRange(caret);
    }
    field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: token }));
    this.say(`Inserted ${token}`);
  }

  /** The built-in chip: one unit the caret steps over and Backspace removes whole */
  private chip(item: MentionPickerItem, trigger: string, token: string) {
    const chip = this.ownerDocument.createElement("span");
    chip.className = "ui-mnp__chip";
    chip.contentEditable = "false";
    chip.dataset.look = this.resolvedLook;
    chip.dataset.trigger = trigger;
    chip.dataset.id = item.id;
    chip.textContent = token;
    return chip;
  }

  private say(text: string) {
    this.said = { text, n: this.said.n + 1 };
  }

  /** @internal A cloned icon, once per source element */
  private mark(el: Element) {
    let copy = this.clones.get(el);
    if (!copy) this.clones.set(el, (copy = el.cloneNode(true) as Element));
    return copy;
  }

  /* ---------- Placing the list ---------- */

  private get pop() {
    return this.querySelector<HTMLElement>(".ui-mnp__pop");
  }

  /** Follow scrolling and resizing while open: the list stays on its trigger */
  private following = false;
  private ro?: ResizeObserver;
  private follow(on: boolean) {
    if (on === this.following) return;
    this.following = on;
    const view = this.ownerDocument.defaultView;
    if (!view) return;
    this.ro?.disconnect();
    this.ro = undefined;
    if (on) {
      // The field changing size (a composer growing a line, a narrower layout) moves the trigger too
      if (typeof ResizeObserver === "function" && this.field) {
        this.ro = new ResizeObserver(this.onMove);
        this.ro.observe(this.field);
      }
      view.addEventListener("scroll", this.onMove, { capture: true, passive: true });
      view.addEventListener("resize", this.onMove);
      view.addEventListener("pointerdown", this.onOutside, true);
    } else {
      view.removeEventListener("scroll", this.onMove, { capture: true });
      view.removeEventListener("resize", this.onMove);
      view.removeEventListener("pointerdown", this.onOutside, true);
    }
  }

  /** A press anywhere but the field and the list closes it (the field may not have had focus to lose) */
  private onOutside = (e: PointerEvent) => {
    const t = e.target as Node | null;
    if (t && (this.contains(t) || this.field?.contains(t))) return;
    this.setContext(null);
  };

  private place() {
    const pop = this.pop;
    const ctx = this.context;
    const field = this.field;
    if (!pop || !ctx || !field) return;
    let anchor: { left: number; top: number; bottom: number };
    if (isText(field)) anchor = textCaret(field, ctx.start);
    else {
      const range = field.ownerDocument.createRange();
      const node = ctx.node && ctx.node.isConnected ? ctx.node : null;
      if (node) {
        range.setStart(node, ctx.start);
        range.setEnd(node, Math.min(ctx.start + 1, node.length));
      } else range.selectNodeContents(field);
      // (jsdom has no range geometry: the field's box then)
      const r = typeof range.getBoundingClientRect === "function" ? range.getBoundingClientRect() : field.getBoundingClientRect();
      anchor = { left: r.left, top: r.top, bottom: r.bottom };
    }
    const view = this.ownerDocument.defaultView!;
    const vw = view.innerWidth;
    const vh = view.innerHeight;
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const below = vh - anchor.bottom - GAP - EDGE;
    const above = anchor.top - GAP - EDGE;
    const up = this.placement === "above" || (this.placement === "auto" && below < h && above > below);
    // Under the trigger, kept inside the field's width (a narrower field: from its left edge) and the viewport
    const box = field.getBoundingClientRect();
    const left = Math.max(EDGE, Math.min(anchor.left, box.width >= w ? box.right - w : box.left, vw - w - EDGE));
    const top = up ? anchor.top - GAP - h : anchor.bottom + GAP;
    // In the top layer an absolute box is placed on the page; without the Popover API it's fixed to the viewport
    const page = pop.hasAttribute("popover") && pop.matches(":popover-open");
    pop.style.left = `${Math.round(left + (page ? view.scrollX : 0))}px`;
    pop.style.top = `${Math.round(top + (page ? view.scrollY : 0))}px`;
    pop.style.position = page ? "absolute" : "fixed";
    pop.dataset.side = up ? "above" : "below";
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("target") || changed.has("htmlFor")) {
      if (this.isConnected) this.bind();
    }
    // New trigger objects (a framework re-rendering) keep the list open when the character is still a trigger
    const same = this.context && this.triggers.find((t) => t.char === this.context!.trigger.char);
    if ((changed.has("disabled") && this.disabled) || (changed.has("triggers") && this.context && !same)) this.setContext(null);
    else if (changed.has("triggers") && this.context && same && same !== this.context.trigger) this.context = { ...this.context, trigger: same };
    // Results changed: say how many
    if (this.context && (changed.has("context") || changed.has("found"))) {
      const { rows } = this.view();
      const st = this.found?.state;
      const t = this.context.trigger;
      const [one, many] = t.noun ?? ["suggestion", "suggestions"];
      const count = rows.length ? `${rows.length} ${rows.length === 1 ? one : many}` : (t.emptyText ?? this.emptyText);
      const text = st === "loading" ? "" : st === "failed" ? "Couldn't load suggestions" : t.note ? `${count}. ${t.note}` : count;
      if (text && text !== this.said.text) this.said = { text, n: this.said.n };
    }
  }

  protected override firstUpdated() {
    const pop = this.pop;
    if (pop && typeof pop.showPopover === "function") pop.setAttribute("popover", "manual");
  }

  protected override updated() {
    const field = this.field;
    const pop = this.pop;
    const open = !!this.context;
    const { rows } = this.view();
    const row = open ? this.current(rows) : undefined;
    this.toggleAttribute("data-open", open);
    if (field) {
      if (field.getAttribute("role") === "combobox") field.setAttribute("aria-expanded", open ? "true" : "false");
      const id = row ? `${this.uid}-o${rows.indexOf(row)}` : null;
      if (id) field.setAttribute("aria-activedescendant", id);
      else field.removeAttribute("aria-activedescendant");
    }
    if (pop) {
      if (typeof pop.showPopover === "function" && pop.hasAttribute("popover")) {
        const shown = pop.matches(":popover-open");
        if (open && !shown) pop.showPopover();
        else if (!open && shown) pop.hidePopover();
      }
      if (open) this.place();
    }
    this.follow(open);
    this.glide(row ? rows.indexOf(row) : -1);
  }

  /** The highlight glides to the active row – a style write, not a render – and the keyboard keeps it in view */
  private glide(index: number) {
    const list = this.querySelector<HTMLElement>(".ui-mnp__list");
    const pill = this.querySelector<HTMLElement>(".ui-mnp__pill");
    if (!list || !pill) return;
    const el = index >= 0 ? this.ownerDocument.getElementById(`${this.uid}-o${index}`) : null;
    if (!el) {
      pill.hidden = true;
      return;
    }
    pill.hidden = false;
    pill.style.transform = `translateY(${el.offsetTop}px)`;
    pill.style.height = `${el.offsetHeight}px`;
    if (!this.byKeyboard) return;
    this.byKeyboard = false;
    const label = el.parentElement?.firstElementChild?.classList.contains("ui-mnp__label") && el.previousElementSibling === el.parentElement.firstElementChild ? (el.previousElementSibling as HTMLElement).offsetHeight : 0;
    const top = el.offsetTop - label;
    const bottom = el.offsetTop + el.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }

  /* ---------- Rendering ---------- */

  private lead(item: MentionPickerItem) {
    if (item.icon) return html`<span class="ui-mnp__icon" aria-hidden="true">${this.mark(item.icon)}</span>`;
    if (typeof item.avatar === "string") return html`<img class="ui-mnp__avatar" src=${item.avatar} alt="" />`;
    if (item.avatar) return html`<span class="ui-mnp__avatar" aria-hidden="true">${initials(item.label)}</span>`;
    return nothing;
  }

  private foot(clean: boolean) {
    return html`<div class="ui-mnp__foot" aria-hidden="true">
      <span class="ui-mnp__keys"><kbd>↑</kbd><kbd>↓</kbd><span>to move</span><kbd>↵</kbd><span>to insert</span></span>
      <span class="ui-mnp__keys ui-mnp__keys--end"><kbd>${clean ? "esc" : "Esc"}</kbd><span>to close</span></span>
    </div>`;
  }

  /** One row: its icon or avatar, the label (after the trigger character with `showChar`) and hint, the description
   *  under them, and its group's tag in one ranked list */
  private option(r: Row, i: number, active: boolean, q: string, char: string | null) {
    const { item } = r;
    return html`<div
      id=${`${this.uid}-o${i}`}
      class="ui-mnp__option"
      role="option"
      aria-selected=${active ? "true" : "false"}
      ?data-two=${!!item.description}
      @pointermove=${() => {
        if (this.active !== r.key) this.active = r.key;
      }}
      @click=${() => this.pick(r)}
    >
      ${this.lead(item)}
      <span class="ui-mnp__text"
        ><span class="ui-mnp__line"
          ><span class="ui-mnp__name">${char ? html`<span class="ui-mnp__char">${char}</span>` : nothing}${highlight(item.label, q)}</span>${item.hint
            ? html`<span class="ui-mnp__hint">${highlight(item.hint, q)}</span>`
            : nothing}</span
        >${item.description ? html`<span class="ui-mnp__desc">${highlight(item.description, q)}</span>` : nothing}</span
      >${r.tag ? html`<span class="ui-mnp__tag">${r.tag}</span>` : nothing}
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const ctx = this.context;
    const { groups, rows, q, total } = this.view();
    const row = ctx ? this.current(rows) : undefined;
    const state = this.found?.state;
    const index = new Map(rows.map((r, i) => [r.key, i]));
    const said = this.said;
    const char = ctx?.trigger.showChar ? ctx.trigger.char : null;
    const note = ctx?.trigger.note;
    const empty = ctx?.trigger.emptyText ?? this.emptyText;
    const hint = state === "failed" ? "Press ↵ to try again" : ctx?.trigger.emptyHint;
    const listbox = html`<div
      id=${`${this.uid}-list`}
      class="ui-mnp__list"
      role="listbox"
      aria-label=${ctx?.trigger.label ?? "Suggestions"}
      aria-busy=${ifDefined(state === "loading" ? "true" : undefined)}
    >
      <span class="ui-mnp__pill" aria-hidden="true" hidden></span>
      <div class="ui-mnp__inner">
        ${repeat(
          groups,
          (g) => g.group?.id ?? RECENT,
          (g, gi) =>
            g.group
              ? html`<div role="group" class="ui-mnp__group" aria-labelledby=${`${this.uid}-g${gi}`}>
                  <div class="ui-mnp__label" id=${`${this.uid}-g${gi}`}>${g.group.label}</div>
                  ${repeat(
                    g.rows,
                    (r) => r.key,
                    (r) => this.option(r, index.get(r.key)!, r === row, q, char),
                  )}
                </div>`
              : repeat(
                  g.rows,
                  (r) => r.key,
                  (r) => this.option(r, index.get(r.key)!, r === row, q, char),
                ),
        )}
        ${ctx && rows.length && total > rows.length && state !== "loading" ? html`<div class="ui-mnp__more">${rows.length} of ${total} shown – type to narrow them down</div>` : nothing}
        ${ctx && !rows.length
          ? state === "loading"
            ? html`<div class="ui-mnp__empty" data-state="loading">${spinner}<span>Searching…</span></div>`
            : keyed(
                `${ctx.trigger.char}${q}`,
                html`<div class="ui-mnp__empty" data-state=${state === "failed" ? "failed" : "empty"}>
                  ${searchGlyph}<span class="ui-mnp__empty-text"
                    ><span>${state === "failed" ? "Couldn't load suggestions" : html`${empty}${q ? html` for “${q}”` : nothing}`}</span>${hint
                      ? html`<span class="ui-mnp__empty-hint">${hint}</span>`
                      : nothing}</span
                  >
                </div>`,
              )
          : nothing}
      </div>
    </div>`;
    const top = note ? html`<div class="ui-mnp__note" aria-hidden="true">${note}</div>` : nothing;
    return html`<div class="ui-mnp__pop" @pointerdown=${(e: Event) => e.preventDefault()}>
        ${clean ? html`${top}${listbox}` : html`<div class="ui-mnp__card">${top}${listbox}</div>`} ${this.foot(clean)}
      </div>
      <span class="ui-mnp__sr" role="status">${said.text ? said.text + (said.n % 2 ? "" : " ") : ""}</span>`;
  }

  static override css = /* css */ `
/* The host only holds the popover and the status region; its look and tokens reach both */
[data-ui="mnp"] { display: contents; }
[data-ui="mnp"] *, [data-ui="mnp"] *::before, [data-ui="mnp"] *::after { box-sizing: border-box; }
:where([data-ui="mnp"]) svg { display: block; flex: none; }
/* The list: a menu popover in the top layer, placed on its trigger. The UA's popover box is reset */
.ui-mnp__pop {
  position: fixed;
  z-index: var(--tc-z-dropdown);
  inset: auto;
  width: min(320px, calc(100vw - 16px));
  margin: 0;
  padding: 0;
  overflow: visible;
  border: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  box-shadow: var(--tc-menu-shadow);
  transform-origin: top left;
  animation: ui-mnp-open var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-mnp__pop[data-side="above"] { transform-origin: bottom left; animation-name: ui-mnp-open-up; }
[data-ui="mnp"]:not([data-open]) .ui-mnp__pop { display: none; }
/* Standard: the menu card on a gray tray whose last row holds the keys */
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__pop { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__card { overflow: hidden; border-radius: calc(var(--tc-tray-radius) - var(--tc-tray-inset)); background: var(--tc-menu-bg); box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default); }
/* Clean: one white popover, the keys as its last row */
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__pop { overflow: hidden; border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); }
.ui-mnp__list { position: relative; max-height: 296px; padding: var(--tc-menu-padding); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
/* The active row – the one ↵ inserts. It glides between rows */
.ui-mnp__pill {
  position: absolute;
  top: 0;
  left: var(--tc-menu-padding);
  right: var(--tc-menu-padding);
  border-radius: var(--tc-menu-item-radius);
  background: var(--tc-menu-item-hover);
  pointer-events: none;
  transition: transform var(--tc-duration-base) var(--tc-ease-move), height var(--tc-duration-base) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
/* Clean: a short, crisp move between rows – no long glide */
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__pill { transition-duration: var(--tc-duration-instant), var(--tc-duration-instant), var(--tc-duration-fast); }
.ui-mnp__pill[hidden] { display: none; }
.ui-mnp__inner { position: relative; }
.ui-mnp__group { display: flex; flex-direction: column; }
.ui-mnp__label {
  padding: var(--tc-space-2) var(--tc-menu-item-px) var(--tc-space-1);
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-mnp__group:first-child .ui-mnp__label { padding-top: var(--tc-space-1); }
.ui-mnp__option { position: relative; display: flex; align-items: center; height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__option { gap: var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__option { gap: var(--tc-space-2); }
.ui-mnp__text { display: flex; flex: 1; flex-direction: column; justify-content: center; min-width: 0; }
.ui-mnp__line { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; }
/* The name wins over the hint when space runs out */
.ui-mnp__name { flex: 0 0 auto; max-width: 100%; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-mnp__hint { flex: 0 100 auto; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__hint { line-height: var(--tc-line-height-tight); }
/* The trigger character before a command's name ("/translate"), quieter than the name */
.ui-mnp__char { color: var(--tc-text-muted); }
/* Two-line rows: the description under the name, one line, cut with an ellipsis */
.ui-mnp__option[data-two] { height: auto; min-height: var(--tc-menu-item-h); padding-top: var(--tc-space-1-5); padding-bottom: var(--tc-space-1-5); }
.ui-mnp__desc { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__desc { margin-top: var(--tc-space-0-5); }
/* One ranked list: each row's group at its end */
.ui-mnp__tag { flex: none; max-width: 40%; overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* A note over the list ("Picking one replaces /translate") and a count under a list cut at max-results */
.ui-mnp__note, .ui-mnp__more { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-mnp__note { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-1-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-mnp__more { padding: var(--tc-space-2) var(--tc-menu-item-px) var(--tc-space-1); }
[data-ui="mnp"] mark { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); color: inherit; }
/* A match inside the muted hint reads at full strength – muted text on the highlight is too faint in dark */
[data-ui="mnp"] :is(.ui-mnp__hint, .ui-mnp__desc) mark { color: var(--tc-text-primary); }
/* Avatars and icons */
.ui-mnp__avatar {
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  object-fit: cover;
  color: var(--tc-text-secondary);
  font-size: var(--tc-avatar-font-size);
  line-height: var(--tc-line-height-none);
  font-weight: var(--tc-avatar-font-weight);
}
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__avatar { width: var(--tc-avatar-md); height: var(--tc-avatar-md); background: var(--tc-fill-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__avatar { width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); background: var(--tc-fill-default); }
.ui-mnp__icon { display: grid; place-items: center; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__icon { width: var(--tc-avatar-md); height: var(--tc-avatar-md); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__icon { width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); color: var(--tc-icon-muted); }
.ui-mnp__icon svg { width: 16px; height: 16px; }
.ui-mnp__option[aria-selected="true"] .ui-mnp__icon { color: var(--tc-text-primary); }
.ui-mnp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__glyph { stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__glyph { stroke-width: 1.4; }
/* Nothing matches, searching, or the search failed */
.ui-mnp__empty { display: flex; align-items: center; justify-content: center; gap: var(--tc-space-2); color: var(--tc-text-muted); animation: ui-mnp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__empty { padding: var(--tc-space-3-5) var(--tc-space-2-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__empty { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-mnp__empty[data-state="failed"] { color: var(--tc-status-danger-fg); }
/* The empty text, and under it a quieter hint: what to try instead */
.ui-mnp__empty-text { display: flex; flex-direction: column; gap: var(--tc-space-0-5); min-width: 0; }
.ui-mnp__empty-hint { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-mnp__empty:has(.ui-mnp__empty-hint) { justify-content: flex-start; }
.ui-mnp__empty:has(.ui-mnp__empty-hint) .ui-mnp__glyph { align-self: flex-start; margin-top: var(--tc-space-0-5); }
.ui-mnp__spinner { width: 12px; height: 12px; border: 1.5px solid var(--tc-border-default); border-top-color: var(--tc-text-primary); border-radius: var(--tc-radius-full); animation: ui-mnp-spin var(--tc-duration-reveal) linear infinite; }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__spinner { border-width: 1.25px; border-top-color: var(--tc-accent); }
/* Standard: the tray below the card · Clean: the popover's last row, under a hairline */
.ui-mnp__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); height: 32px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__foot { padding: 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__foot { padding: 0 var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mnp__keys { display: inline-flex; align-items: center; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-mnp__keys { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-mnp__keys { gap: var(--tc-space-0-5); }
.ui-mnp__keys > span { margin: 0 var(--tc-space-1-5) 0 var(--tc-space-0-5); }
.ui-mnp__keys > span:last-child { margin-right: 0; }
[data-ui="mnp"] kbd {
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
.ui-mnp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The chip a pick leaves in a contenteditable field: a mention in the accent tint, one unit for the caret */
.ui-mnp__chip {
  display: inline-block;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-xs);
  background: var(--tc-accent-subtle);
  color: var(--tc-accent-text);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-snug);
  white-space: nowrap;
  user-select: all;
}
.ui-mnp__chip[data-trigger="/"] { background: var(--tc-fill-default); color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: 0.92em; }
@keyframes ui-mnp-open { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes ui-mnp-open-up { from { opacity: 0; transform: translateY(4px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes ui-mnp-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-mnp-spin { to { transform: rotate(360deg); } }
/* Narrow screens: no key hints, the keys row says only how to close */
@media (max-width: 480px) {
  .ui-mnp__keys:not(.ui-mnp__keys--end) { display: none; }
}
/* Touch screens: taller rows, no key hints */
@media (hover: none) and (pointer: coarse) {
  .ui-mnp__option { height: 44px; }
  .ui-mnp__option[data-two] { height: auto; min-height: 44px; }
  .ui-mnp__foot { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mnp"] *, [data-ui="mnp"] *::before, [data-ui="mnp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-mention-picker")) customElements.define("tc-mention-picker", TcMentionPicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-mention-picker": TcMentionPicker;
  }
}
