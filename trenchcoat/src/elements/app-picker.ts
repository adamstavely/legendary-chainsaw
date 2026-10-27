import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { PopoverController } from "./internal/popover";
import { initials } from "./internal/util";

/*
 * <tc-app-picker> – the app launcher at the top right of a suite: a grid ("waffle") button that opens a popover of
 * the person's apps. Each app is a tile – its icon (an element, an image URL, or initials on a colour from the token
 * palette) and its name – and a real link, so middle-click and open-in-new-tab work. The current app is marked.
 * Sections: Pinned, Recent and All apps – or the app's own groups in place of All. With many apps a search field
 * filters as you type (`search`: "auto" from `search-threshold` apps, "on" or "off"). `pinnable` adds Edit pins,
 * where each tile becomes a pin toggle. `layout="panel"` renders the panel inline as a card, without the button.
 *
 *   <tc-app-picker current="mail" .apps=${[{ id: "mail", name: "Mail", href: "/mail" }, …]} .pinned=${["mail"]}>
 *   </tc-app-picker>
 *
 * The app owns the data and the navigation. A plain click (or Enter) on a tile fires a cancelable tc-app-select
 * with `{ id, app }`; preventDefault() stops the link being followed, for routing in a single-page app. A modified
 * click (⌘, Ctrl, Shift, middle button) is left to the browser – a new tab or window – and fires nothing. Pin
 * toggles fire a cancelable tc-pin-change with the list as it would be afterwards; unless prevented, the element
 * applies it to `pinned`. The list may arrive late: `loading` shows skeleton tiles, `error` a message with Retry
 * (tc-retry).
 *
 * Keyboard. The button has a name ("Apps"), aria-haspopup="dialog" and aria-expanded; Enter, Space or ↓ opens the
 * panel, with focus in the search field when there is one, else on the current app (else the first). The tiles are a
 * grid with one tab stop: ← → move to the previous or next tile (on to the next row), ↑ ↓ to the tile above or below
 * (across sections, keeping the column), Home and End to the first and last tile, Enter opens the app. ↓ from the
 * search field moves into the grid, ↑ from the top row back to it, and Enter in the field opens the first match.
 * Escape clears a search, then closes the panel and returns focus to the button. Tab moves on to Edit pins and the
 * footer link.
 *
 * The grid's columns follow the room: `columns` (default 4) at most, fewer when the viewport (or, as a panel, the
 * host) is narrow – three at 320 px. The popover never leaves the viewport. Standard draws icons as tinted 40 px
 * tiles with medium names; Clean uses smaller, ringed icons and quieter names. As a panel, Standard sets the header
 * on the gray tray above a white card; Clean is one card with the header as its first row. In the popover both use
 * the menu surface and carry no card header.
 */

/** The palette for generated initials – each a pair of token colours */
export type AppTone = "blue" | "green" | "violet" | "pink" | "amber" | "rose" | "teal";

export type AppPickerApp = {
  id: string;
  /** The app's name under its icon: "Mail" */
  name: string;
  /** Where the tile goes. Without it the tile is a button, and only tc-app-select happens */
  href?: string;
  /** The link's target – "_blank" opens a new tab */
  target?: string;
  /** A short line about the app, shown when its tile is pointed at or focused, and read with its name */
  description?: string;
  /** An icon of the app's own, cloned into the tile */
  icon?: Element;
  /** An image URL for the icon (a logo) – used when there's no `icon` */
  image?: string;
  /** The initials' colour when there's neither `icon` nor `image`; default: picked from the id */
  tone?: AppTone;
  /** The app's group – apps with groups are listed under them in place of "All apps" */
  group?: string;
  /** More words search matches on: "email inbox" */
  keywords?: string[];
};

/** tc-app-select: the app picked */
export type AppPickerSelectDetail = { id: string; app: AppPickerApp };
/** tc-pin-change: the app, whether it's now pinned, and the pinned ids as they'd be afterwards */
export type AppPickerPinDetail = { id: string; pinned: boolean; pins: string[] };
/** tc-open-change: whether the panel is opening or closing */
export type AppPickerOpenChange = { open: boolean };
export type AppPickerLayout = "trigger" | "panel";
export type AppPickerSearch = "auto" | "on" | "off";

/** The words the panel uses; each can be replaced through `labels` */
export type AppPickerLabels = {
  pinned: string;
  recent: string;
  all: string;
  /** The heading over ungrouped apps when other apps have groups */
  other: string;
  search: string;
  /** No search match; `{query}` is the search text */
  noMatch: string;
  loading: string;
  retry: string;
  edit: string;
  done: string;
  /** The line over the tiles while editing pins */
  editHint: string;
  /** The pin toggle's name; `{name}` is the app's */
  pin: string;
  /** Marks the current app for screen readers */
  current: string;
};

export const APP_PICKER_LABELS: AppPickerLabels = {
  pinned: "Pinned",
  recent: "Recent",
  all: "All apps",
  other: "More apps",
  search: "Search apps",
  noMatch: "No apps match “{query}”",
  loading: "Loading apps",
  retry: "Retry",
  edit: "Edit pins",
  done: "Done",
  editHint: "Choose the apps to pin to the top",
  pin: "Pin {name}",
  current: "current app",
};

const TONES: AppTone[] = ["blue", "green", "violet", "pink", "amber", "rose", "teal"];
/** The narrowest a tile gets, and the gap between tiles (px) – they decide how many columns fit */
const TILE_MIN = 84;
const TILE_GAP = 4;
/** The popover's padding on each side (px), and its distance from the viewport's edges */
const POP_PAD = 6;
const VIEW_MARGIN = 8;
const SKELETONS = 8;

let instances = 0;

/** A stable colour per id */
export function appTone(id: string): AppTone {
  let n = 0;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[n % TONES.length];
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** How well an app matches a search: 0 none; 4 the name starts with it, 3 a word in the name does, 2 the name has it, 1 a keyword, the group or (from three letters) the description has a word starting with it */
export function appMatch(app: AppPickerApp, query: string): number {
  const q = fold(query.trim());
  if (!q) return 1;
  const name = fold(app.name);
  if (name.startsWith(q)) return 4;
  if (name.split(/[\s\-_.]+/).some((w) => w.startsWith(q))) return 3;
  if (name.includes(q)) return 2;
  // Keywords and the group by a word's start; the description too from three letters ("an" shouldn't find every "and")
  const words = (t: string) => fold(t).split(/[\s\-_.,;:()/]+/);
  const more = [...(app.keywords ?? []), app.group ?? "", ...(q.length >= 3 ? [app.description ?? ""] : [])];
  return more.some((t) => words(t).some((w) => w.startsWith(q))) ? 1 : 0;
}

/* Icons: Lucide (ISC, lucide.dev), 24×24 strokes; the waffle is nine dots */
const WAFFLE = svg`${[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => svg`<circle cx=${x} cy=${y} r="2"></circle>`))}`;
const GRID = svg`<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>`;
const SEARCH = svg`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`;
const PIN = svg`<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>`;
const ARROW = svg`<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>`;
const ALERT = svg`<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>`;
const icon = (paths: TemplateResult, cls = "") =>
  html`<svg class=${`ui-apk__svg ${cls}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

type Section = { key: string; title: string; apps: AppPickerApp[] };
type Cell = { key: string; app: AppPickerApp; row: number; col: number };

/**
 * The app launcher: a grid button that opens a popover of the person's apps, as links, with pinned and recent apps,
 * groups, search and an optional footer link.
 * @tag tc-app-picker
 * @fires tc-app-select - A tile was picked with a plain click or Enter; detail `{ id, app }`. Cancelable: preventDefault() stops the link being followed (route in the app instead)
 * @fires tc-pin-change - A pin was toggled while editing pins; detail `{ id, pinned, pins }` (`pins` as they'd be afterwards). Cancelable: preventDefault() and the app updates `pinned`
 * @fires tc-open-change - The panel is opening or closing; detail `{ open }`. Cancelable: preventDefault() keeps it as it is
 * @fires tc-retry - Retry was chosen after an error – the app loads the apps again
 */
export class TcAppPicker extends TcElement {
  static override ui = "apk";

  /** The apps, in the order "All apps" lists them */
  @property({ attribute: false }) accessor apps: AppPickerApp[] = [];
  /** The id of the app the person is in – its tile is marked */
  @property() accessor current = "";
  /** The ids of the pinned apps, in order – listed first, under "Pinned" */
  @property({ attribute: false }) accessor pinned: string[] = [];
  /** The ids of recently used apps, most recent first – listed under "Recent" (pinned ones aren't repeated) */
  @property({ attribute: false }) accessor recent: string[] = [];
  /** Adds Edit pins, where each tile toggles its pin */
  @property({ type: Boolean, reflect: true }) accessor pinnable = false;
  /** The search field: "auto" shows it from `search-threshold` apps, "on" always, "off" never */
  @property() accessor search: AppPickerSearch = "auto";
  /** How many apps make "auto" show the search field */
  @property({ type: Number, attribute: "search-threshold" }) accessor searchThreshold = 9;
  /** The most columns of tiles; fewer when there isn't room */
  @property({ type: Number }) accessor columns = 4;
  /** "trigger" (default): the button that opens the panel; "panel": the panel inline, as a card */
  @property({ reflect: true }) accessor layout: AppPickerLayout = "trigger";
  /** Whether the button's panel is open */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The button's accessible name and the panel's title */
  @property() accessor label = "Apps";
  /** A link at the foot of the panel – "All apps" or "Manage apps" – shown when set */
  @property({ attribute: "footer-href" }) accessor footerHref = "";
  /** The footer link's text */
  @property({ attribute: "footer-label" }) accessor footerLabel = "All apps";
  /** The footer link's target */
  @property({ attribute: "footer-target" }) accessor footerTarget = "";
  /** The apps are being fetched: skeleton tiles show */
  @property({ type: Boolean, reflect: true }) accessor loading = false;
  /** Fetching the apps failed: this message shows, with Retry */
  @property() accessor error = "";
  /** Shown when there are no apps */
  @property({ attribute: "empty-text" }) accessor emptyText = "No apps yet";
  /** Replaces any of the panel's words (Pinned, Recent, Search apps, Edit pins…) */
  @property({ attribute: false }) accessor labels: Partial<AppPickerLabels> = {};

  /** @internal The search text */
  @state() accessor query = "";
  /** @internal Editing pins */
  @state() accessor editing = false;
  /** @internal The tile that holds the grid's tab stop */
  @state() accessor activeKey = "";
  /** @internal The tile under the pointer, for the description line */
  @state() accessor hoverKey = "";
  /** @internal Focus is on a tile */
  @state() accessor focusInGrid = false;
  /** @internal The columns in use */
  @state() accessor cols = 4;
  /** @internal The polite status line */
  @state() accessor status = "";

  private readonly uid = `tc-apk${++instances}`;
  private flip = false;
  private focusAfter: string | null = null;
  private ro?: ResizeObserver;
  /** The sections and tiles as last rendered */
  private model: { sections: Section[]; rows: Cell[][]; bySection: Map<string, Cell[][]>; flat: Cell[] } = { sections: [], rows: [], bySection: new Map(), flat: [] };

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-apk__pop"),
    anchor: () => this.trigger,
    side: "bottom",
    align: "end",
    margin: VIEW_MARGIN,
    kind: "dialog",
    returnFocus: () => this.trigger,
    initialFocus: () => this.searchField ?? this.tile(this.activeKey) ?? this.querySelector<HTMLElement>(".ui-apk__tile"),
    tabBridge: true,
    onClose: (reason) => {
      if (reason === "api" || !this.open) return;
      if (this.emit<AppPickerOpenChange>("tc-open-change", { open: false }, { cancelable: true })) this.open = false;
      else this.pop.show();
    },
  });

  constructor() {
    super();
    // A tile that goes away (unpinned, filtered out, columns re-flowed) never drops focus to <body>
    new FocusRescueController(this, () => this.tile(this.activeKey) ?? this.querySelector(".ui-apk__tile") ?? this.searchField ?? this.querySelector(".ui-apk__pop") ?? this.trigger);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.layout === "panel" && !this.hasAttribute("role")) this.setAttribute("role", "region");
    window.addEventListener("resize", this.onResize);
    if (typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver(this.onResize);
      this.ro.observe(this);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("resize", this.onResize);
    this.ro?.disconnect();
    this.ro = undefined;
  }

  private onResize = () => {
    const cols = this.fitColumns();
    if (cols === this.cols) return;
    // Rows re-flow: the focused tile is drawn again in another row
    if (this.focusInGrid) this.focusAfter = this.activeKey;
    this.cols = cols;
  };

  /** How many columns fit: in the viewport for the popover, in the host for the panel */
  private fitColumns() {
    const max = Math.max(1, Math.floor(this.columns) || 1);
    const room =
      this.layout === "panel"
        ? this.clientWidth - 2 * POP_PAD - 2 * TILE_GAP
        : document.documentElement.clientWidth - 2 * VIEW_MARGIN - 2 * POP_PAD;
    if (room <= 0) return max;
    return Math.max(1, Math.min(max, Math.floor((room + TILE_GAP) / (TILE_MIN + TILE_GAP))));
  }

  private get t(): AppPickerLabels {
    return { ...APP_PICKER_LABELS, ...this.labels };
  }
  private get trigger() {
    return this.querySelector<HTMLButtonElement>(".ui-apk__trigger");
  }
  private get searchField() {
    return this.querySelector<HTMLInputElement>(".ui-apk__input");
  }
  private tile(key: string) {
    return key ? this.querySelector<HTMLElement>(`.ui-apk__tile[data-key="${CSS.escape(key)}"]`) : null;
  }
  private get hasSearch() {
    return this.search === "on" || (this.search === "auto" && this.apps.length >= this.searchThreshold);
  }

  /** The sections as shown: search results; or Pinned, Recent and All (or the groups) – editing shows only All */
  private get sections(): Section[] {
    const apps = this.apps;
    const byId = new Map(apps.map((a) => [a.id, a]));
    const q = this.hasSearch ? this.query.trim() : "";
    if (q) {
      const ranked = apps.map((a, i) => ({ a, i, s: appMatch(a, q) })).filter((r) => r.s > 0);
      ranked.sort((x, y) => y.s - x.s || x.i - y.i);
      return [{ key: "results", title: "", apps: ranked.map((r) => r.a) }];
    }
    const out: Section[] = [];
    if (!this.editing) {
      const pins = this.pinned.map((id) => byId.get(id)).filter((a): a is AppPickerApp => !!a);
      if (pins.length) out.push({ key: "pinned", title: this.t.pinned, apps: pins });
      const pinSet = new Set(this.pinned);
      const recent = this.recent.filter((id) => !pinSet.has(id)).map((id) => byId.get(id)).filter((a): a is AppPickerApp => !!a);
      if (recent.length) out.push({ key: "recent", title: this.t.recent, apps: recent });
    }
    if (apps.some((a) => a.group)) {
      const groups = new Map<string, AppPickerApp[]>();
      for (const a of apps) {
        const g = a.group ?? "";
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(a);
      }
      for (const [g, list] of groups) out.push({ key: `g:${g}`, title: g || this.t.other, apps: list });
    } else if (apps.length) out.push({ key: "all", title: this.t.all, apps });
    // One section on its own needs no heading – the panel's name says it
    if (out.length === 1) out[0] = { ...out[0], title: "" };
    return out;
  }

  /** Every tile, row by row across the sections, with its grid position */
  private layoutCells(sections: Section[]) {
    const rows: Cell[][] = [];
    const bySection = new Map<string, Cell[][]>();
    for (const s of sections) {
      const own: Cell[][] = [];
      s.apps.forEach((app, i) => {
        const col = i % this.cols;
        if (col === 0) own.push([]);
        own[own.length - 1].push({ key: `${s.key}:${app.id}`, app, row: rows.length + own.length - 1, col });
      });
      bySection.set(s.key, own);
      rows.push(...own);
    }
    return { sections, rows, bySection, flat: rows.flat() };
  }

  private say(text: string) {
    // The same message twice in a row is still announced: the trailing space flips
    this.flip = !this.flip;
    this.status = `${text}${this.flip ? "" : " "}`;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("layout") && this.layout === "panel" && !this.hasAttribute("role")) this.setAttribute("role", "region");
    if (changed.has("columns") || changed.has("layout") || !this.hasUpdated) this.cols = this.fitColumns();
    if (changed.has("loading") || changed.has("error")) {
      if (this.loading) this.say(this.t.loading);
      else if (this.error) this.say(this.error);
    }
    const wantOpen = this.open && this.layout === "trigger";
    if (wantOpen && !this.pop.open) {
      this.cols = this.fitColumns();
      this.activeKey = "";
      this.pop.show({ focus: true });
    } else if (!wantOpen && this.pop.open) this.pop.close("api");
    if (!wantOpen && changed.has("open") && this.layout === "trigger") {
      this.query = "";
      this.editing = false;
    }
    // The tab stop stays on a tile that exists: the current app, else the first
    this.model = this.layoutCells(this.sections);
    const flat = this.model.flat;
    if (!flat.some((c) => c.key === this.activeKey)) this.activeKey = (flat.find((c) => this.current && c.app.id === this.current) ?? flat[0])?.key ?? "";
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.layout === "panel" && !this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusAfter !== null) {
      const key = this.focusAfter;
      this.focusAfter = null;
      this.tile(key)?.focus();
    }
  }

  /* ---------- Actions ---------- */

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit<AppPickerOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private pick(app: AppPickerApp, e: MouseEvent) {
    // ⌘/Ctrl/Shift-click and the middle button open a new tab or window: the browser's, not a pick
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!this.emit<AppPickerSelectDetail>("tc-app-select", { id: app.id, app }, { cancelable: true })) e.preventDefault();
    if (this.layout === "trigger") this.setOpen(false);
  }

  private togglePin(app: AppPickerApp) {
    const on = !this.pinned.includes(app.id);
    const pins = on ? [...this.pinned, app.id] : this.pinned.filter((id) => id !== app.id);
    if (!this.emit<AppPickerPinDetail>("tc-pin-change", { id: app.id, pinned: on, pins }, { cancelable: true })) return;
    this.pinned = pins;
    this.say(`${app.name} ${on ? "pinned" : "unpinned"}`);
  }

  private toggleEditing() {
    this.editing = !this.editing;
    this.hoverKey = "";
  }

  private onSearchInput = (e: Event) => {
    this.query = (e.target as HTMLInputElement).value;
    this.hoverKey = "";
    const q = this.query.trim();
    if (!q) {
      this.say("");
      return;
    }
    const n = this.apps.filter((a) => appMatch(a, q) > 0).length;
    this.say(n ? `${n} ${n === 1 ? "app" : "apps"}` : this.t.noMatch.replace("{query}", q));
  };

  private onSearchKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const first = this.querySelector<HTMLElement>(".ui-apk__tile");
    if (e.key === "ArrowDown" && first) {
      e.preventDefault();
      // Into the grid: the first tile while searching, else where the tab stop is
      (this.query.trim() ? first : (this.tile(this.activeKey) ?? first)).focus();
    } else if (e.key === "Enter" && this.query.trim() && first) {
      e.preventDefault();
      first.click();
    } else if (e.key === "Escape" && this.query) {
      // The first Escape clears the search; the next one closes
      e.preventDefault();
      this.query = "";
      (e.target as HTMLInputElement).value = "";
      this.say("");
    }
  };

  /* ---------- The grid's keys ---------- */

  private onGridKey = (e: KeyboardEvent) => {
    if (e.altKey || e.metaKey || e.shiftKey) return;
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    if (e.ctrlKey && e.key !== "Home" && e.key !== "End") return;
    const from = (e.target as Element).closest<HTMLElement>(".ui-apk__tile");
    if (!from) return;
    const { rows, flat } = this.model;
    const at = flat.findIndex((c) => c.key === from.dataset.key);
    const cell = flat[at];
    if (!cell) return;
    e.preventDefault();
    let to: Cell | undefined;
    if (e.key === "ArrowRight") to = flat[Math.min(flat.length - 1, at + 1)];
    else if (e.key === "ArrowLeft") to = flat[Math.max(0, at - 1)];
    else if (e.key === "Home") to = flat[0];
    else if (e.key === "End") to = flat[flat.length - 1];
    else {
      const row = rows[cell.row + (e.key === "ArrowDown" ? 1 : -1)];
      if (!row) {
        // Above the top row: back to the search field
        if (e.key === "ArrowUp") this.searchField?.focus();
        return;
      }
      to = row[Math.min(cell.col, row.length - 1)];
    }
    if (!to) return;
    this.activeKey = to.key;
    this.tile(to.key)?.focus();
  };

  private onGridFocus = (e: FocusEvent) => {
    const key = (e.target as Element).closest<HTMLElement>(".ui-apk__tile")?.dataset.key;
    if (!key) return;
    this.focusInGrid = true;
    if (key !== this.activeKey) this.activeKey = key;
  };

  private onGridBlur = (e: FocusEvent) => {
    const to = e.relatedTarget;
    if (!(to instanceof Element) || !to.closest(".ui-apk__tile")) this.focusInGrid = false;
  };

  private onGridOver = (e: PointerEvent) => {
    const key = (e.target as Element).closest<HTMLElement>(".ui-apk__tile")?.dataset.key ?? "";
    if (key !== this.hoverKey) this.hoverKey = key;
  };

  /* ---------- Render ---------- */

  protected override render() {
    const live = html`<span class="ui-apk__sr" role="status">${this.status}</span>`;
    if (this.layout === "panel") {
      const head = cardHead({ icon: GRID, title: this.label, id: `${this.uid}-title` });
      return html`${head}<div class="ui-apk__card" style=${styleMap({ "--apk-cols": String(this.cols) })}>${this.renderSearch()}${this.renderBody()}${this.renderHint()}</div>${this.renderFoot()}${live}`;
    }
    return html`${this.renderTrigger()}${this.pop.open ? this.renderPopover() : nothing}${live}`;
  }

  private renderTrigger() {
    return html`<button
      type="button"
      class="ui-apk__trigger"
      aria-label=${this.label}
      aria-haspopup="dialog"
      aria-expanded=${this.open ? "true" : "false"}
      aria-controls=${ifDefined(this.pop.open ? `${this.uid}-panel` : undefined)}
      @click=${() => this.setOpen(!this.open)}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === "ArrowDown" && !this.open && !e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.setOpen(true);
        }
      }}
    >
      <svg class="ui-apk__waffle" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WAFFLE}</svg>
    </button>`;
  }

  private renderPopover() {
    return html`<div class="tc-pop ui-apk__pop" id=${`${this.uid}-panel`} role="dialog" tabindex="-1" aria-label=${this.label} style=${styleMap({ "--apk-cols": String(this.cols) })}>
      ${this.renderSearch()}${this.renderBody()}${this.renderHint()}${this.renderFoot()}
    </div>`;
  }

  private renderSearch() {
    if (!this.hasSearch || this.loading || this.error || !this.apps.length) return nothing;
    return html`<div class="ui-apk__search">
      ${icon(SEARCH, "ui-apk__search-icon")}
      <input
        class="ui-apk__input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        aria-label=${this.t.search}
        placeholder=${this.t.search}
        .value=${this.query}
        @input=${this.onSearchInput}
        @keydown=${this.onSearchKey}
      />
    </div>`;
  }

  private renderBody() {
    if (this.loading) {
      return html`<div class="ui-apk__body" aria-busy="true">
        <div class="ui-apk__rowgrid ui-apk__skeletons" aria-hidden="true">
          ${Array.from({ length: SKELETONS }, (_, i) => html`<div class="ui-apk__skeleton" style=${styleMap({ "--i": String(i % this.cols) })}><span></span><span></span></div>`)}
        </div>
      </div>`;
    }
    if (this.error) {
      return html`<div class="ui-apk__body"><div class="ui-apk__state ui-apk__state--error">
        <span class="ui-apk__state-icon">${icon(ALERT)}</span>
        <p class="ui-apk__state-text">${this.error}</p>
        <button type="button" class="ui-apk__act ui-apk__act--secondary ui-apk__retry" @click=${() => this.emit("tc-retry", {})}>${this.t.retry}</button>
      </div></div>`;
    }
    if (!this.apps.length) return html`<div class="ui-apk__body"><p class="ui-apk__state ui-apk__empty">${this.emptyText}</p></div>`;
    const { sections, bySection } = this.model;
    if (!sections.some((s) => s.apps.length)) {
      return html`<div class="ui-apk__body"><p class="ui-apk__state ui-apk__empty">${this.t.noMatch.replace("{query}", this.query.trim())}</p></div>`;
    }
    return html`<div class="ui-apk__body" @keydown=${this.onGridKey} @focusin=${this.onGridFocus} @focusout=${this.onGridBlur} @pointerover=${this.onGridOver} @pointerleave=${() => (this.hoverKey = "")}>
      ${this.editing ? html`<p class="ui-apk__edit-hint">${this.t.editHint}</p>` : nothing}
      ${repeat(
        sections,
        (s) => s.key,
        (s) => {
          const hid = `${this.uid}-s-${s.key}`;
          return html`<div class="ui-apk__section" data-section=${s.key}>
            ${s.title ? html`<div class="ui-apk__label" role="heading" aria-level=${this.layout === "panel" ? 4 : 3} id=${hid}>${s.title}</div>` : nothing}
            <div class="ui-apk__grid" role="grid" aria-labelledby=${ifDefined(s.title ? hid : undefined)} aria-label=${ifDefined(s.title ? undefined : this.label)}>
              ${(bySection.get(s.key) ?? []).map(
                (row) => html`<div class="ui-apk__row ui-apk__rowgrid" role="row">${repeat(row, (c) => c.key, (c) => html`<div class="ui-apk__cell" role="gridcell">${this.renderTile(c)}</div>`)}</div>`,
              )}
            </div>
          </div>`;
        },
      )}
    </div>`;
  }

  private renderIcon(app: AppPickerApp) {
    if (app.icon) return html`<span class="ui-apk__icon" data-kind="element" data-tone=${ifDefined(app.tone)} aria-hidden="true">${app.icon.cloneNode(true)}</span>`;
    if (app.image) return html`<span class="ui-apk__icon" data-kind="image" aria-hidden="true"><img src=${app.image} alt="" loading="lazy" decoding="async" /></span>`;
    return html`<span class="ui-apk__icon" data-kind="initials" data-tone=${app.tone ?? appTone(app.id)} aria-hidden="true">${initials(app.name) || "?"}</span>`;
  }

  private renderTile(c: Cell) {
    const { app, key } = c;
    const tab = key === this.activeKey ? 0 : -1;
    const isCurrent = !!this.current && app.id === this.current;
    const did = app.description ? `${this.uid}-d-${key}` : undefined;
    const inner = html`${this.renderIcon(app)}<span class="ui-apk__name">${app.name}</span>${isCurrent ? html`<span class="ui-apk__sr"> (${this.t.current})</span>` : nothing}${app.description
        ? html`<span class="ui-apk__sr" id=${did!}>${app.description}</span>`
        : nothing}`;
    if (this.editing) {
      const on = this.pinned.includes(app.id);
      // Named "Pin Mail" from its content (the visible name inside it), with aria-pressed for the state
      const [before = "", after = ""] = this.t.pin.split("{name}");
      return html`<button
        type="button"
        class="ui-apk__tile"
        data-key=${key}
        data-focus-key=${key}
        data-editing
        tabindex=${tab}
        aria-pressed=${on ? "true" : "false"}
        @click=${() => this.togglePin(app)}
      >
        ${this.renderIcon(app)}${before ? html`<span class="ui-apk__sr">${before}</span>` : nothing}<span class="ui-apk__name">${app.name}</span>${after ? html`<span class="ui-apk__sr">${after}</span>` : nothing}
        <span class="ui-apk__pin" aria-hidden="true">${icon(PIN)}</span>
      </button>`;
    }
    if (app.href) {
      return html`<a
        class="ui-apk__tile"
        href=${app.href}
        target=${ifDefined(app.target || undefined)}
        rel=${ifDefined(app.target === "_blank" ? "noopener" : undefined)}
        data-key=${key}
        data-focus-key=${key}
        tabindex=${tab}
        aria-current=${ifDefined(isCurrent ? "true" : undefined)}
        aria-describedby=${ifDefined(did)}
        @click=${(e: MouseEvent) => this.pick(app, e)}
        >${inner}</a
      >`;
    }
    return html`<button
      type="button"
      class="ui-apk__tile"
      data-key=${key}
      data-focus-key=${key}
      tabindex=${tab}
      aria-current=${ifDefined(isCurrent ? "true" : undefined)}
      aria-describedby=${ifDefined(did)}
      @click=${(e: MouseEvent) => this.pick(app, e)}
    >
      ${inner}
    </button>`;
  }

  /** The line under the tiles: the pointed-at or focused app's description, else how many apps there are */
  private renderHint() {
    if (this.loading || this.error || this.editing || !this.apps.some((a) => a.description)) return nothing;
    const key = this.hoverKey || (this.focusInGrid ? this.activeKey : "");
    const app = key ? this.model.flat.find((c) => c.key === key)?.app : undefined;
    const n = this.apps.length;
    return html`<div class="ui-apk__hint" aria-hidden="true">
      ${app ? html`<strong class="ui-apk__hint-name">${app.name}</strong>${app.description ? html`<span class="ui-apk__hint-text">${app.description}</span>` : nothing}` : html`<span class="ui-apk__hint-text">${n} ${n === 1 ? "app" : "apps"}</span>`}
    </div>`;
  }

  private renderFoot() {
    const edit = this.pinnable && this.apps.length && !this.loading && !this.error;
    if (!edit && !this.footerHref) return nothing;
    return html`<div class="ui-apk__foot">
      ${edit
        ? html`<button type="button" class="ui-apk__act ${this.editing ? "ui-apk__act--secondary" : "ui-apk__act--ghost"} ui-apk__edit" @click=${() => this.toggleEditing()}>
            ${this.editing ? nothing : icon(PIN, "ui-apk__act-icon")}${this.editing ? this.t.done : this.t.edit}
          </button>`
        : nothing}
      ${this.footerHref
        ? html`<a class="ui-apk__act ui-apk__act--ghost ui-apk__more" href=${this.footerHref} target=${ifDefined(this.footerTarget || undefined)}>${this.footerLabel}${icon(ARROW, "ui-apk__act-icon")}</a>`
        : nothing}
    </div>`;
  }

  static override css = /* css */ `
[data-ui="apk"] {
  box-sizing: border-box;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  /* The icon box per look: Standard's tinted tile, Clean's smaller ringed one */
  --apk-icon: 40px;
  --apk-icon-radius: var(--tc-radius-xl);
  --apk-glyph: 22px;
}
[data-ui="apk"][data-look="clean"] { --apk-icon: 36px; --apk-icon-radius: var(--tc-radius-lg); --apk-glyph: 20px; }
[data-ui="apk"] *, [data-ui="apk"] *::before, [data-ui="apk"] *::after { box-sizing: border-box; }
:where([data-ui="apk"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; }
[data-ui="apk"] :is(button, a, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-apk__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-apk__svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *) .ui-apk__svg { stroke-width: 1.75; }
:where([data-look="clean"], [data-look="clean"] *) .ui-apk__svg { stroke-width: 1.5; }

/* ---- The button: a ghost icon button with the waffle ---- */
[data-ui="apk"]:not([layout="panel"]) { display: inline-flex; vertical-align: middle; }
.ui-apk__trigger {
  display: inline-grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-radius-full);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-apk__trigger:hover, .ui-apk__trigger[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-apk__waffle { width: 18px; height: 18px; transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-apk__trigger[aria-expanded="true"] .ui-apk__waffle { transform: scale(0.9); }

/* ---- The popover: the menu surface, sized to its columns ---- */
.ui-apk__pop {
  display: flex;
  flex-direction: column;
  width: min(calc(var(--apk-cols) * (var(--tc-app-picker-tile-w, 92px) + 4px) + 12px), calc(100vw - var(--tc-space-4)));
  max-height: min(calc(100vh - var(--tc-space-16)), 560px);
  padding: var(--tc-space-1-5);
}
.ui-apk__pop:focus { outline: none; }
.ui-apk__pop > .ui-apk__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }

/* ---- The panel inline: Standard's tray, Clean's card ---- */
[data-ui="apk"][layout="panel"] { display: block; width: 100%; max-width: 420px; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="apk"][layout="panel"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="apk"][layout="panel"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-apk__card { padding: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-apk__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-apk__card { padding-top: 0; }

/* ---- Search ---- */
.ui-apk__search {
  position: relative;
  display: flex;
  align-items: center;
  margin: var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-1-5);
}
.ui-apk__search-icon { position: absolute; left: var(--tc-space-2-5); width: 16px; height: 16px; color: var(--tc-icon-muted); pointer-events: none; }
.ui-apk__input {
  width: 100%;
  min-width: 0;
  height: var(--tc-field-h);
  margin: 0;
  padding: 0 var(--tc-field-px) 0 var(--tc-space-8);
  border: 0;
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg-sunken);
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
  outline: none;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-apk__input::placeholder { color: var(--tc-text-muted); }
.ui-apk__input::-webkit-search-cancel-button { cursor: pointer; }
[data-ui="apk"] .ui-apk__input:focus-visible, .ui-apk__input:focus { outline: none; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }

/* ---- Sections and the grid ---- */
.ui-apk__section + .ui-apk__section { margin-top: var(--tc-space-1); padding-top: var(--tc-space-1); border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-apk__label {
  padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1);
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-apk__rowgrid { display: grid; grid-template-columns: repeat(var(--apk-cols, 4), minmax(0, 1fr)); gap: var(--tc-space-1); }
.ui-apk__grid { display: grid; gap: var(--tc-space-1); }
.ui-apk__cell { display: flex; min-width: 0; }
.ui-apk__tile {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  padding: var(--tc-space-3) var(--tc-space-1) var(--tc-space-2-5);
  border-radius: var(--tc-radius-lg);
  color: var(--tc-text-primary);
  text-align: center;
  text-decoration: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-apk__tile:hover { background: var(--tc-menu-item-hover); }
.ui-apk__tile:active { background: var(--tc-fill-default); }
[data-ui="apk"] .ui-apk__tile:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-apk__tile[aria-current] { background: var(--tc-accent-subtle); }
.ui-apk__tile[aria-current] .ui-apk__name { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-semibold); }
/* The current app: a short bar under its name */
.ui-apk__tile[aria-current]::after {
  content: "";
  position: absolute;
  bottom: var(--tc-space-1);
  left: 50%;
  width: 16px;
  height: 3px;
  transform: translateX(-50%);
  border-radius: var(--tc-radius-full);
  background: var(--tc-accent);
}
.ui-apk__icon {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: var(--apk-icon);
  height: var(--apk-icon);
  overflow: hidden;
  border-radius: var(--apk-icon-radius);
  background: var(--apk-bg, var(--tc-surface-well));
  color: var(--apk-fg, var(--tc-text-primary));
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-none);
  letter-spacing: var(--tc-tracking-tight);
  transition: transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-apk__tile:hover .ui-apk__icon { transform: translateY(-1px); }
.ui-apk__icon > :is(svg, img) { display: block; width: var(--apk-glyph); height: var(--apk-glyph); }
.ui-apk__icon[data-kind="image"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-apk__icon[data-kind="image"] > img { width: 100%; height: 100%; object-fit: cover; }
:where([data-look="clean"], [data-look="clean"] *) .ui-apk__icon { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *) .ui-apk__icon[data-kind="initials"] { box-shadow: inset 0 0 0 var(--tc-hairline) color-mix(in srgb, var(--apk-fg) 18%, transparent); font-weight: var(--tc-font-weight-medium); }
.ui-apk__icon[data-tone="blue"] { --apk-bg: var(--tc-accent-subtle); --apk-fg: var(--tc-accent-text); }
.ui-apk__icon[data-tone="green"] { --apk-bg: var(--tc-status-success-bg); --apk-fg: var(--tc-status-success-fg); }
.ui-apk__icon[data-tone="violet"] { --apk-bg: var(--tc-tone-violet-bg); --apk-fg: var(--tc-tone-violet-fg); }
.ui-apk__icon[data-tone="pink"] { --apk-bg: var(--tc-tone-pink-bg); --apk-fg: var(--tc-tone-pink-fg); }
.ui-apk__icon[data-tone="amber"] { --apk-bg: var(--tc-tone-amber-bg); --apk-fg: var(--tc-tone-amber-fg); }
.ui-apk__icon[data-tone="rose"] { --apk-bg: var(--tc-tone-rose-bg); --apk-fg: var(--tc-tone-rose-fg); }
.ui-apk__icon[data-tone="teal"] { --apk-bg: var(--tc-tone-teal-bg); --apk-fg: var(--tc-tone-teal-fg); }
.ui-apk__name {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-primary);
  overflow-wrap: anywhere;
}
:where([data-look="clean"], [data-look="clean"] *) .ui-apk__name { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-secondary); }

/* Editing pins: each tile is a toggle with a pin badge on its icon */
.ui-apk__edit-hint { margin: 0; padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-apk__pin {
  position: absolute;
  top: var(--tc-space-1-5);
  left: calc(50% + var(--apk-icon) / 2 - 10px);
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-overlay);
  box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-apk__pin > svg { width: 12px; height: 12px; }
.ui-apk__tile[aria-pressed="true"] .ui-apk__pin { background: var(--tc-accent-solid); box-shadow: 0 0 0 2px var(--tc-surface-overlay); color: var(--tc-text-on-accent); }
.ui-apk__tile[aria-pressed="true"] .ui-apk__pin > svg { fill: currentColor; }

/* ---- The description line ---- */
.ui-apk__hint {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-1-5);
  min-height: calc(var(--tc-font-size-sm) * 1.4 + var(--tc-space-2) * 2);
  margin-top: var(--tc-space-1);
  padding: var(--tc-space-2);
  border-top: var(--tc-hairline) solid var(--tc-border-subtle);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-muted);
  overflow: hidden;
  white-space: nowrap;
}
.ui-apk__hint-name { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-apk__hint-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }

/* ---- Footer: Edit pins and the footer link ---- */
.ui-apk__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-apk__pop > .ui-apk__foot { margin-top: var(--tc-space-1); padding-top: var(--tc-space-1); border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-apk__hint + .ui-apk__foot { border-top: 0; margin-top: 0; padding-top: 0; }
:where([data-look="standard"], [data-look="standard"] *)[layout="panel"] > .ui-apk__foot { padding: var(--tc-space-1-5) 0 0; }
:where([data-look="clean"], [data-look="clean"] *)[layout="panel"] > .ui-apk__foot { padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-apk__more { margin-left: auto; }
.ui-apk__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-none);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-apk__act-icon { width: 14px; height: 14px; }
.ui-apk__act--ghost { color: var(--tc-action-ghost-fg); }
.ui-apk__act--ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-apk__act--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-apk__act--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }

/* ---- Loading, empty and error ---- */
.ui-apk__skeletons { padding: var(--tc-space-1) 0; }
.ui-apk__skeleton { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-2-5); padding: var(--tc-space-3) var(--tc-space-1) var(--tc-space-2-5); }
.ui-apk__skeleton > span { display: block; background: var(--tc-fill-default); animation: ui-apk-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; animation-delay: calc(var(--i, 0) * var(--tc-duration-quick)); }
.ui-apk__skeleton > span:first-child { width: var(--apk-icon); height: var(--apk-icon); border-radius: var(--apk-icon-radius); }
.ui-apk__skeleton > span:last-child { width: 60%; height: 8px; border-radius: var(--tc-radius-full); }
.ui-apk__state { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-2); margin: 0; padding: var(--tc-space-8) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-md); text-align: center; }
.ui-apk__state-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-full); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-apk__state-icon > svg { width: 18px; height: 18px; }
.ui-apk__state-text { margin: 0; color: var(--tc-text-secondary); }
.ui-apk__retry { margin-top: var(--tc-space-1); }

@keyframes ui-apk-pulse { 50% { opacity: 0.45; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="apk"] .ui-apk__skeleton > span { animation: none; }
  [data-ui="apk"] *, .ui-apk__pop * { transition: none; }
  .ui-apk__tile:hover .ui-apk__icon { transform: none; }
}
@media (forced-colors: active) {
  .ui-apk__tile[aria-current] { outline: 1px solid Highlight; }
  .ui-apk__tile[aria-current]::after { background: Highlight; }
  .ui-apk__icon { border: 1px solid CanvasText; }
  .ui-apk__tile[aria-pressed="true"] .ui-apk__pin { background: Highlight; color: HighlightText; }
}
`;
}

if (!customElements.get("tc-app-picker")) customElements.define("tc-app-picker", TcAppPicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-app-picker": TcAppPicker;
  }
}
