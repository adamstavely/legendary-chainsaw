import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, rescueFocus, SmoothHeightController } from "./internal/controllers";
import type { Look } from "./internal/look";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-comments-panel> – the Lit port of src/components/comments-panel.tsx: a comment feed with filters, runnable /edit
 * commands and a composer. Filter by questions or edits, sort, run an edit and undo it, resolve comments, add new ones.
 *
 *   <tc-comments-panel .comments=${comments} .currentUser=${{ name: "You" }} .onRunEdit=${run}></tc-comments-panel>
 *
 * `comments` stays the source of truth, keyed by id. A comment added here fires a cancelable `tc-comments-change`
 * with the whole list and shows at once unless prevented; `onAdd` may return a promise – pending while it runs, a
 * rejection takes the comment out again (another `tc-comments-change`) with its text back in the field. `resolved`
 * and `filter` fire cancelable `tc-resolved-change` / `tc-filter-change`. The host is the region, named by the heading.
 */

export type CommentAuthor = { name: string; avatar?: string };

export type PanelComment = {
  id: string;
  author: CommentAuthor;
  /** When it was written – a Date or a timestamp */
  createdAt: Date | number;
  text: string;
};

export type CommentsFilter = "all" | "questions" | "edits";
type EditState = "idle" | "running" | "done" | "undoing";

// Warns once per page (not per instance) when edits are simulated because onRunEdit is missing
let warnedSimulatedEdit = false;
const warnSimulatedEdit = () => {
  if (warnedSimulatedEdit) return;
  warnedSimulatedEdit = true;
  console.warn(
    "CommentsPanel: no onRunEdit handler – simulating edits. Pass `demo` to keep the simulation, or `onRunEdit` to wire it up. The simulation will be off by default in the next major version.",
  );
};

const isEdit = (c: PanelComment) => /^\/edit\b/i.test(c.text.trim());
const isQuestion = (c: PanelComment) => !isEdit(c) && c.text.trim().endsWith("?");

function ago(time: number, now: number) {
  const s = Math.max(0, Math.round((now - time) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const SORTS = [
  { label: "Newest first", value: true },
  { label: "Oldest first", value: false },
];
const TABS: [CommentsFilter, string][] = [
  ["all", "All"],
  ["questions", "Questions"],
  ["edits", "Edits"],
];

/* ---------- Icons – Standard: 1.5px lines drawn by attributes; Clean: 16px, thin lines with round caps or solid glyphs ---------- */

type IconName = "close" | "sort" | "check" | "resolve" | "done" | "play" | "up";
const standardIcons: Record<Exclude<IconName, "play">, [d: string, size: number]> = {
  close: ["m4 4 8 8M12 4l-8 8", 16],
  sort: ["M2.5 4.5h11M4.5 8h7M6.5 11.5h3", 16],
  check: ["m3.5 8.5 3 3 6-7", 14],
  resolve: ["m3.5 8.5 3 3 6-7", 14],
  done: ["m3.5 8.5 3 3 6-7", 14],
  up: ["M8 13V3M3.5 7.5 8 3l4.5 4.5", 14],
};
const cleanIcons: Record<IconName, [d: string, solid?: boolean, className?: string]> = {
  close: ["M4.5 4.5l7 7M11.5 4.5l-7 7"],
  sort: ["M2.5 4.5h11M4.5 8h7M6.5 11.5h3"],
  check: ["m3.5 8.5 3 3 6-7", false, "ui-cp__menu-check"],
  resolve: ["M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12ZM5.5 8.2l1.7 1.7 3.3-3.8"],
  done: ["M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm8.9-1.2a.5.5 0 0 0-.8-.6L7.44 9.23 6.35 8.15a.5.5 0 1 0-.7.7l1.5 1.5a.5.5 0 0 0 .76-.06l2.5-3.5Z", true],
  play: ["M5 3.6a.8.8 0 0 1 1.2-.7l6.3 3.9a1.4 1.4 0 0 1 0 2.4l-6.3 3.9a.8.8 0 0 1-1.2-.7V3.6Z", true],
  up: ["M8 12.5v-9M4 7.5l4-4 4 4"],
};
const icon = (name: IconName, look: Look) => {
  if (look === "clean" || name === "play") {
    const [d, solid, className] = cleanIcons[name];
    return html`<svg viewBox="0 0 16 16" class=${["ui-cp__glyph", className].filter(Boolean).join(" ")} ?data-solid=${solid} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
  }
  const [d, size] = standardIcons[name];
  return html`<svg viewBox="0 0 16 16" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
};

const avatar = (author: CommentAuthor, look: Look) => {
  const size = look === "clean" ? 20 : 22;
  const initials = author.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return author.avatar
    ? html`<img class="ui-cp__avatar" src=${ifDefined(safeMediaUrl(author.avatar))} alt="" width=${size} height=${size} loading="lazy" />`
    : html`<span class="ui-cp__avatar ui-cp__avatar--initials" aria-hidden="true">${initials}</span>`;
};

let uidCount = 0;

// The header icon: a speech bubble with lines of text (comments)
const commentsIcon = svg`<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"></path><path d="M8 8h9M8 12h6"></path>`;

/**
 * A comment feed with filters, sort, runnable /edit commands, resolving and a composer.
 * @tag tc-comments-panel
 * @fires tc-comments-change - A comment was added here, or taken out again when onAdd failed; detail
 *   `{ comments: PanelComment[] }` is the whole feed. Cancelable: preventDefault() keeps an added comment out until the app passes it back.
 * @fires tc-resolved-change - A comment was resolved or reopened; detail `{ resolved: string[] }`. Cancelable.
 * @fires tc-filter-change - Another filter was picked; detail `{ filter: CommentsFilter }`. Cancelable.
 * @fires tc-close - The close button was pressed (shown with `closable`); detail: null
 */
export class TcCommentsPanel extends TcElement {
  static override ui = "cp";

  /** The heading, and the region's name */
  @property() accessor heading = "Comments";
  /** The feed, keyed by id – comments added here show first until they appear in it */
  @property({ attribute: false }) accessor comments: PanelComment[] = [];
  /** Who writes new comments */
  @property({ attribute: false }) accessor currentUser: CommentAuthor = { name: "You" };
  /**
   * Runs an /edit command – resolve when done, reject to show that it failed. Without it the edit is simulated:
   * marked as applied after a beat (and warns once, unless `demo` is set)
   */
  @property({ attribute: false }) accessor onRunEdit: ((comment: PanelComment) => Promise<void> | void) | undefined = undefined;
  /**
   * Reverts an edit that onRunEdit applied – resolve when done, reject to keep it applied with an error. Without it an
   * applied edit offers no Undo, since the panel can't take it back on its own
   */
  @property({ attribute: false }) accessor onUndoEdit: ((comment: PanelComment) => Promise<void> | void) | undefined = undefined;
  /** A new comment – may return a promise: pending while it runs, a rejection takes the comment out again */
  @property({ attribute: false }) accessor onAdd: ((comment: PanelComment) => Promise<unknown> | void) | undefined = undefined;
  /** Demo mode: edits are simulated silently when onRunEdit is missing. For galleries and prototypes */
  @property({ type: Boolean }) accessor demo = false;
  /** Ids of resolved comments */
  @property({ attribute: false }) accessor resolved: string[] = [];
  /** The filter tab */
  @property() accessor filter: CommentsFilter = "all";
  /** Shows a close button in the header, which fires tc-close */
  @property({ type: Boolean }) accessor closable = false;

  /** @internal Added here and not in `comments` yet (matched by id) */
  @state() accessor local: PanelComment[] = [];
  /** @internal Comments whose onAdd is still running */
  @state() accessor adding = new Set<string>();
  /** @internal */
  @state() accessor addError: string | null = null;
  /** @internal */
  @state() accessor newest = true;
  /** @internal */
  @state() accessor edits: Record<string, EditState> = {};
  /** @internal Why the last run or undo of an edit failed, by comment id */
  @state() accessor failures: Record<string, string> = {};
  /** @internal */
  @state() accessor draft = "";
  /** @internal */
  @state() accessor now = 0;
  /** @internal The status region: final results only */
  @state() accessor announce = "";
  /** @internal */
  @state() accessor menu = false;
  /** @internal */
  @state() accessor active = 0;

  private uid = `tc-cp-${++uidCount}`;
  private added = 0;
  private timers: number[] = [];
  private clock = 0;
  private onScreen = true;
  private io?: IntersectionObserver;
  private ownName = false;

  constructor() {
    super();
    // Run edit ↔ Undo share a focus key; when an edit is applied and there's no Undo, focus goes to its Resolve button
    new FocusRescueController(this, (key) => {
      const id = key?.startsWith("edit-") ? key.slice(5) : null;
      const item = id ? [...this.querySelectorAll<HTMLElement>(".ui-cp__item")].find((li) => li.dataset.id === id) : null;
      return item?.querySelector<HTMLElement>(".ui-cp__resolve") ?? this.querySelector<HTMLElement>(".ui-cp__input");
    });
    new SmoothHeightController(this, () => this.querySelector<HTMLElement>(".ui-cp__morph"), () => this.list);
  }

  private get list() {
    return this.querySelector<HTMLElement>(".ui-cp__list");
  }

  /** @internal The feed: comments added here first, then the property */
  get feed(): PanelComment[] {
    const ids = new Set(this.comments.map((c) => c.id));
    return [...this.local.filter((c) => !ids.has(c.id)), ...this.comments];
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
    // Keeps "2min ago" honest: the clock runs only while the panel is on screen and the tab is visible
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => {
        this.onScreen = entries[entries.length - 1].isIntersecting;
        this.runClock();
      });
      this.io.observe(this);
    }
    document.addEventListener("visibilitychange", this.runClock);
    window.addEventListener("pointerdown", this.onAway);
    this.runClock();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    document.removeEventListener("visibilitychange", this.runClock);
    window.removeEventListener("pointerdown", this.onAway);
    window.clearInterval(this.clock);
    this.clock = 0;
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
  }

  /** Reads the clock now and every 30s, rendering only when one of the shown times would read differently */
  private readClock = () => {
    const at = Date.now();
    const prev = this.now;
    if (this.feed.some((c) => ago(+c.createdAt, prev) !== ago(+c.createdAt, at))) this.now = at;
  };
  private runClock = () => {
    const want = this.onScreen && document.visibilityState !== "hidden";
    if (want && !this.clock) {
      this.readClock();
      this.clock = window.setInterval(this.readClock, 30_000);
    } else if (!want && this.clock) {
      window.clearInterval(this.clock);
      this.clock = 0;
    }
  };

  private onAway = (e: PointerEvent) => {
    if (this.menu && !this.querySelector(".ui-cp__sort")?.contains(e.target as Node)) this.menu = false;
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // New comments (frameworks often set them after connecting): read the clock again if it runs
    if (changed.has("comments") && this.clock) this.readClock();
    // Relative times count from the newest comment until the clock is read
    if (!this.now) this.now = Math.max(0, ...this.comments.map((c) => +c.createdAt));
  }

  protected override updated(changed: PropertyValues) {
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    // Opening the sort menu moves focus onto the active item
    if (this.menu && (changed.has("menu") || changed.has("active"))) this.querySelectorAll<HTMLElement>(".ui-cp__menu-item")[this.active]?.focus({ preventScroll: true });
  }

  /* ---------- Values ---------- */

  private setFilter(next: CommentsFilter) {
    if (next === this.filter) return;
    if (this.emit("tc-filter-change", { filter: next }, { cancelable: true })) this.filter = next;
  }
  private toggleResolved(id: string) {
    const r = this.resolved;
    const next = r.includes(id) ? r.filter((x) => x !== id) : [...r, id];
    if (this.emit("tc-resolved-change", { resolved: next }, { cancelable: true })) this.resolved = next;
  }

  /* ---------- Edits ---------- */

  private setEdit(id: string, s: EditState) {
    this.edits = { ...this.edits, [id]: s };
  }
  private fail(id: string, message: string) {
    this.failures = { ...this.failures, [id]: message };
  }
  private clearFailure(id: string) {
    if (!(id in this.failures)) return;
    const next = { ...this.failures };
    delete next[id];
    this.failures = next;
  }

  private async run(c: PanelComment) {
    this.setEdit(c.id, "running");
    this.clearFailure(c.id);
    if (!this.onRunEdit && !this.demo) warnSimulatedEdit();
    try {
      await (this.onRunEdit ? this.onRunEdit(c) : new Promise((r) => this.timers.push(window.setTimeout(r, 1100))));
      if (this.isConnected) {
        this.setEdit(c.id, "done");
        this.announce = "Edit applied.";
      }
    } catch {
      if (!this.isConnected) return;
      this.setEdit(c.id, "idle");
      this.fail(c.id, "The edit couldn't be applied.");
    }
  }

  private async undo(c: PanelComment) {
    this.setEdit(c.id, "undoing");
    this.clearFailure(c.id);
    try {
      await this.onUndoEdit?.(c);
      if (this.isConnected) {
        this.setEdit(c.id, "idle");
        this.announce = "Edit undone.";
      }
    } catch {
      if (!this.isConnected) return;
      this.setEdit(c.id, "done");
      this.fail(c.id, "The edit couldn't be undone.");
    }
  }

  /* ---------- Adding ---------- */

  private add() {
    const text = this.draft.trim();
    if (!text) return;
    const at = Date.now();
    const comment: PanelComment = { id: `${this.uid}-${++this.added}`, author: this.currentUser, createdAt: at, text };
    if (this.emit("tc-comments-change", { comments: [comment, ...this.feed] }, { cancelable: true })) this.local = [comment, ...this.local];
    this.draft = "";
    this.addError = null;
    this.setFilter("all");
    this.newest = true;
    this.now = at;
    this.announce = "Comment added.";
    requestAnimationFrame(() => this.list?.scrollTo?.({ top: 0, behavior: "smooth" }));
    // onAdd may be async: pending until it settles; a rejection takes the comment out and gives its text back
    const takeBack = () => {
      this.local = this.local.filter((c) => c.id !== comment.id);
      this.emit("tc-comments-change", { comments: this.feed.filter((c) => c.id !== comment.id) });
      this.draft ||= text;
      this.addError = "The comment couldn't be added.";
      this.announce = "";
    };
    let work: unknown;
    try {
      work = this.onAdd?.(comment);
    } catch {
      takeBack();
      return;
    }
    if (!work || typeof (work as Promise<unknown>).then !== "function") return;
    const settle = (ok: boolean) => {
      if (!this.isConnected) return;
      const next = new Set(this.adding);
      next.delete(comment.id);
      this.adding = next;
      if (!ok) takeBack();
    };
    this.adding = new Set(this.adding).add(comment.id);
    (work as Promise<unknown>).then(
      () => settle(true),
      () => settle(false),
    );
  }

  /* ---------- Parts ---------- */

  private openMenu(at?: number) {
    this.active = at ?? Math.max(0, SORTS.findIndex((o) => o.value === this.newest));
    this.menu = true;
  }
  private closeMenu() {
    // Focus first, then remove the menu – it never drops to <body>
    this.querySelector<HTMLElement>(".ui-cp__sort > .ui-cp__icon-btn")?.focus({ preventScroll: true });
    this.menu = false;
  }

  /**
   * All · Questions · Edits (toggle buttons – they filter one list, so no tab pattern), and the sort menu (APG menu
   * button: focus moves onto the checked item, ↑/↓/Home/End move, Esc returns to the button, Tab closes)
   */
  private bar(editCount: number, look: Look) {
    const clean = look === "clean";
    const onMenuKey = (e: KeyboardEvent) => {
      const last = SORTS.length - 1;
      const move = (i: number) => {
        e.preventDefault();
        this.active = i < 0 ? last : i > last ? 0 : i;
      };
      if (e.key === "ArrowDown") move(this.active + 1);
      else if (e.key === "ArrowUp") move(this.active - 1);
      else if (e.key === "Home") move(0);
      else if (e.key === "End") move(last);
      else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.closeMenu();
      } else if (e.key === "Tab") this.menu = false;
    };
    const badge = html`<span class="ui-cp__sr">, </span>${editCount}<span class="ui-cp__sr"> to run</span>`;
    return html`<div class="ui-cp__bar">
      <div class="ui-cp__tabs" role="group" aria-label="Filter comments">
        ${TABS.map(
          ([t, label]) =>
            html`<button type="button" aria-pressed=${this.filter === t ? "true" : "false"} class="ui-cp__tab" @click=${() => this.setFilter(t)}>${label}${t === "edits" && editCount > 0
              ? clean
                ? keyed(editCount, html`<span class="ui-cp__count">${badge}</span>`)
                : html`<span class="ui-cp__badge">${badge}</span>`
              : nothing}</button>`,
        )}
      </div>
      <div class="ui-cp__sort">
        <button
          type="button"
          class="ui-cp__icon-btn"
          aria-label="Sort comments"
          aria-haspopup="menu"
          aria-expanded=${this.menu ? "true" : "false"}
          @click=${() => (this.menu ? (this.menu = false) : this.openMenu())}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              this.openMenu(e.key === "ArrowUp" ? SORTS.length - 1 : 0);
            }
          }}
        >
          ${icon("sort", look)}
        </button>
        ${this.menu
          ? html`<div class="ui-cp__menu" role="menu" aria-label="Sort comments" @keydown=${onMenuKey}>
              ${SORTS.map(
                (o, i) =>
                  html`<button
                    type="button"
                    role="menuitemradio"
                    aria-checked=${this.newest === o.value ? "true" : "false"}
                    tabindex=${i === this.active ? 0 : -1}
                    class="ui-cp__menu-item"
                    @click=${() => {
                      this.newest = o.value;
                      this.closeMenu();
                    }}
                  >${o.label}${this.newest === o.value ? icon("check", look) : nothing}</button>`,
              )}
            </div>`
          : nothing}
      </div>
    </div>`;
  }

  /** One comment: who and when, the text – and for an /edit, Run edit or "Edit applied" with Undo */
  private item(c: PanelComment, resolved: boolean, look: Look, canUndo: boolean) {
    const clean = look === "clean";
    const edit = isEdit(c);
    const st = this.edits[c.id] ?? "idle";
    const pending = this.adding.has(c.id);
    const failure = this.failures[c.id];
    const running = clean
      ? html`<span class="ui-cp__spinner" aria-hidden="true"></span><span class="ui-cp__shimmer">Running…<span class="ui-cp__shine" aria-hidden="true"><span>Running…</span></span></span>`
      : html`<span class="ui-cp__spinner" aria-hidden="true"></span> Running…`;
    return html`<li class="ui-cp__item" data-id=${c.id} ?data-resolved=${resolved} ?data-pending=${pending} aria-busy=${ifDefined(pending ? "true" : undefined)}>
      <div class="ui-cp__meta">
        ${avatar(c.author, look)}
        <span class="ui-cp__name">${c.author.name}</span>
        <time class="ui-cp__time" datetime=${new Date(c.createdAt).toISOString()}>${ago(+c.createdAt, this.now)}</time>
        <button
          type="button"
          class="ui-cp__resolve"
          aria-pressed=${resolved ? "true" : "false"}
          aria-label=${resolved ? "Reopen comment" : "Resolve comment"}
          title=${resolved ? "Reopen" : "Resolve"}
          @click=${() => this.toggleResolved(c.id)}
        >
          ${icon("resolve", look)}
        </button>
      </div>
      <p class="ui-cp__text">${edit ? html`<span class="ui-cp__command">/Edit</span> ${c.text.trim().replace(/^\/edit\s*/i, "")}` : c.text}</p>
      ${edit && !resolved
        ? html`<div class="ui-cp__actions">
            ${st === "done" || st === "undoing"
              ? html`<span class="ui-cp__done">${icon("done", look)}Edit applied</span>${canUndo
                    ? html`<button
                        type="button"
                        class="ui-cp__link"
                        data-focus-key="edit-${c.id}"
                        aria-disabled=${ifDefined(st === "undoing" ? "true" : undefined)}
                        @click=${() => st !== "undoing" && void this.undo(c)}
                      >Undo</button>`
                    : nothing}`
              : html`<button
                  type="button"
                  class="ui-cp__btn"
                  data-focus-key="edit-${c.id}"
                  aria-disabled=${ifDefined(st === "running" ? "true" : undefined)}
                  @click=${() => st !== "running" && void this.run(c)}
                >${st === "running" ? running : clean ? html`${icon("play", look)}Run edit` : "Run edit"}</button>`}
            ${failure ? html`<span class="ui-cp__error" role="alert">${failure}</span>` : nothing}
          </div>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const comments = this.feed;
    const resolved = new Set(this.resolved);
    const open = comments.filter((c) => !resolved.has(c.id));
    const editCount = open.filter((c) => isEdit(c) && this.edits[c.id] !== "done" && this.edits[c.id] !== "undoing").length;
    const tab = this.filter;
    const shown = comments.filter((c) => tab === "all" || (tab === "questions" ? isQuestion(c) : isEdit(c))).sort((a, b) => (+b.createdAt - +a.createdAt) * (this.newest ? 1 : -1));
    // Undo only where it can be honoured: the edit was simulated, or onUndoEdit takes it back
    const canUndo = !!this.onUndoEdit || !this.onRunEdit;
    const rows = html`${this.bar(editCount, look)}
      <div class="ui-cp__morph">
        <ul class="ui-cp__list">
          ${shown.length === 0 ? html`<li class="ui-cp__empty">${tab === "questions" ? "No open questions." : "No edits to run."}</li>` : nothing}
          ${repeat(shown, (c) => c.id, (c) => this.item(c, resolved.has(c.id), look, canUndo))}
        </ul>
      </div>`;
    return html`
      ${cardHead({
        icon: commentsIcon,
        title: this.heading,
        aside: this.closable
          ? html`<button type="button" class="ui-cp__icon-btn" aria-label=${`Close ${this.heading.toLowerCase()}`} @click=${() => this.emit("tc-close", null)}>${icon("close", look)}</button>`
          : nothing,
      })}
      ${clean ? rows : html`<div class="ui-cp__card">${rows}</div>`}
      <form
        class="ui-cp__composer"
        @submit=${(e: Event) => {
          e.preventDefault();
          // Send turns disabled once the field is cleared – focus goes back to the field, not to <body>
          const form = e.currentTarget as HTMLFormElement;
          rescueFocus(form.querySelector(".ui-cp__send"), [form.querySelector<HTMLInputElement>(".ui-cp__input")]);
          this.add();
        }}
      >
        ${avatar(this.currentUser, look)}
        <input
          class="ui-cp__input"
          .value=${this.draft}
          @input=${(e: Event) => {
            this.draft = (e.target as HTMLInputElement).value;
            this.addError = null;
          }}
          @keydown=${(e: KeyboardEvent) => {
            // Enter that confirms an IME composition doesn't send
            if (e.key === "Enter" && e.isComposing) e.preventDefault();
          }}
          placeholder="Add a comment or /edit…"
          aria-label="Add a comment"
        />
        <button type="submit" class="ui-cp__send" aria-label="Send comment" ?disabled=${!this.draft.trim()}>${icon("up", look)}</button>
      </form>
      ${this.addError ? html`<p class="ui-cp__error ui-cp__add-error" role="alert">${this.addError}</p>` : nothing}
      <span class="ui-cp__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cp"] {
  --tc-comments-panel-initials-bg: light-dark(#eef3ff, rgba(47, 107, 255, 0.16));
  --tc-comments-panel-avatar-ring: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  /* The tray pattern: heading and composer on the tray, the white card sits on top of it */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="cp"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cp"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-comments-panel-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="cp"] *, [data-ui="cp"] *::before, [data-ui="cp"] *::after { box-sizing: border-box; }
/* The reset stays at element specificity, so the buttons' own type wins */
:where([data-look="standard"], [data-look="standard"] *):where([data-ui="cp"]) button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
[data-ui="cp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__icon-btn {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: transparent;
  color: var(--tc-action-ghost-fg) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__icon-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-3-5);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}
/* Filter: the segmented pattern – a track with a raised thumb; selected also carries a ≥3:1 ring */
.ui-cp__tabs { display: flex; min-width: 0; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-cp__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  flex: none;
  height: calc(var(--tc-control-h-md) - 2 * var(--tc-seg-pad));
  padding: 0 var(--tc-space-2-5);
  border: 0;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: transparent;
  font-size: var(--tc-font-size-md) !important;
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  color: var(--tc-text-secondary) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-cp__tab:hover { color: var(--tc-text-primary) !important; }
.ui-cp__tab[aria-pressed="true"] {
  background: var(--tc-seg-thumb-bg);
  box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 1px var(--tc-border-selected);
  color: var(--tc-text-primary) !important;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__tab[aria-pressed="true"] { font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-inverse);
  box-shadow: 0 0 0 2px var(--tc-surface-on-tray);
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-none);
  color: var(--tc-text-on-inverse);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__sort { position: relative; }
/* Sort menu: the menu pattern */
.ui-cp__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  min-width: 160px;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  transform-origin: top right;
  animation: ui-cp-drop var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-cp__menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: transparent;
  font-size: var(--tc-menu-item-font-size) !important;
  line-height: var(--tc-line-height-normal);
  text-align: left;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
.ui-cp__menu-item:hover,
.ui-cp__menu-item:focus-visible { background: var(--tc-menu-item-hover); }
.ui-cp__menu-item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__list {
  max-height: var(--tc-comments-panel-max-height, 360px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__item {
  padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  animation: ui-cp-in var(--tc-duration-slow) var(--tc-ease-move) both;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="cp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="cp"]) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__glyph[data-solid] { fill: currentColor; stroke: none; }
/* Ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__icon-btn {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__icon-btn:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__icon-btn[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Filter tabs: the button-switch look */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__count {
  display: inline-grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  margin-right: -4px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-badge);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary);
  animation: ui-cp-pop var(--tc-duration-base) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__tab[aria-pressed="true"] .ui-cp__count { background: var(--tc-fill-default); color: var(--tc-text-primary); }
/* Sort menu: the popover */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__sort { position: relative; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__menu-check { stroke-width: 1.4; }
/* The feed */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__list {
  max-height: var(--tc-comments-panel-max-height, 360px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: var(--tc-fill-strong) transparent;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__item {
  padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  animation: ui-cp-in var(--tc-duration-slow) var(--tc-ease-move) both;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-cp__item:first-child { border-top: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__meta { display: flex; align-items: center; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__avatar {
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 1px var(--tc-comments-panel-avatar-ring);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__avatar--initials {
  display: grid;
  place-items: center;
  background: var(--tc-comments-panel-initials-bg);
  font-size: var(--tc-avatar-font-size);
  font-weight: var(--tc-avatar-font-weight);
  color: var(--tc-accent-text);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__name { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__time { margin-left: auto; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__resolve {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-right: -4px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: transparent;
  color: var(--tc-text-muted) !important;
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__meta { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__avatar {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__avatar--initials {
  display: grid;
  place-items: center;
  background: var(--tc-fill-default);
  font-size: var(--tc-avatar-font-size);
  font-weight: var(--tc-avatar-font-weight);
  line-height: var(--tc-line-height-none);
  color: var(--tc-text-secondary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__name {
  min-width: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__time {
  flex: none;
  margin-left: auto;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--tc-text-muted);
}
/* Resolve: a ghost icon button that shows on hover, a soft green fill when resolved */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__resolve {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  margin: -2px -4px -2px 0;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  opacity: 0;
  transition: opacity var(--tc-duration-quick) var(--tc-ease-standard), background-color var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard);
}
.ui-cp__item:hover .ui-cp__resolve,
.ui-cp__resolve:focus-visible,
.ui-cp__resolve[aria-pressed="true"] { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__resolve:hover { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__resolve[aria-pressed="true"] { color: var(--tc-status-success-fg) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__text {
  margin: var(--tc-space-2) 0 0;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__resolve:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__resolve[aria-pressed="true"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__text {
  margin: var(--tc-space-1-5) 0 0 var(--tc-space-7);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  overflow-wrap: anywhere;
}
/* Resolved: the text turns muted (still ≥4.5:1) and is struck through, the resolve button stays checked */
.ui-cp__item[data-resolved] .ui-cp__text,
.ui-cp__item[data-resolved] .ui-cp__command { color: var(--tc-text-muted); text-decoration: line-through; text-decoration-color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__command { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__actions { display: flex; align-items: center; gap: var(--tc-space-2-5); margin-top: var(--tc-space-3); }
/* Run edit: looks exactly like Button secondary */
.ui-cp__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size) !important;
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-secondary-fg) !important;
  transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard), color var(--tc-duration-quick) var(--tc-ease-standard);
}
.ui-cp__btn:hover:not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-cp__btn[aria-disabled="true"] { color: var(--tc-text-muted) !important; cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--tc-border-strong);
  border-top-color: var(--tc-text-primary);
  border-radius: 50%;
  animation: ui-cp-spin var(--tc-duration-reveal) linear infinite;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__command { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__actions { display: flex; align-items: center; gap: var(--tc-space-2-5); margin: var(--tc-space-2-5) 0 0 var(--tc-space-7); }
/* Run edit: the white button with the hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__btn .ui-cp__glyph { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__spinner {
  flex: none;
  width: 12px;
  height: 12px;
  margin: 0 var(--tc-space-0-5);
  border: 2px solid var(--tc-fill-strong);
  border-top-color: var(--tc-accent-text);
  border-radius: 50%;
  animation: ui-cp-spin var(--tc-duration-reveal) linear infinite;
}
/* "Running…": a lighter band sweeps across the gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__shimmer { position: relative; display: inline-block; }
/* The window and the copy inside it move in opposite directions, so the copy stays on the label – transform only,
   three passes and done */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__shine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  overflow: hidden;
  pointer-events: none;
  animation: ui-cp-window var(--tc-duration-shimmer) linear 3 both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-text-primary);
  animation: ui-cp-window-copy var(--tc-duration-shimmer) linear 3 both;
}
.ui-cp__error { font-size: var(--tc-font-size-md); color: var(--tc-status-danger-fg); }
.ui-cp__add-error { margin: var(--tc-space-1-5) var(--tc-space-3) 0; }
.ui-cp__item[data-pending] { opacity: 0.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: 26px;
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-md);
  background: var(--tc-status-success-bg);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-status-success-fg);
  animation: ui-cp-in var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__link {
  padding: 0;
  border: 0;
  background: none;
  font-size: var(--tc-font-size-md) !important;
  color: var(--tc-text-muted) !important;
  text-decoration: underline;
  text-underline-offset: 3px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__link:hover { color: var(--tc-text-primary) !important; }
.ui-cp__link[aria-disabled="true"] { cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-cp__empty { padding: var(--tc-space-7) var(--tc-space-4); font-size: var(--tc-font-size-md); text-align: center; color: var(--tc-text-muted); }
/* Composer in the gray extension */
:where([data-look="standard"], [data-look="standard"] *).ui-cp__composer {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cp__input {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-lg);
  color: var(--tc-text-primary);
}
.ui-cp__input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
/* Send: an icon-only Button primary */
.ui-cp__send {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
  color: var(--tc-action-primary-fg) !important;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-cp__send:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: 28px;
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-status-success-bg);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-status-success-fg);
  animation: ui-cp-in var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__link {
  height: 28px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-sm);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  transition: color var(--tc-duration-quick) var(--tc-ease-standard), background-color var(--tc-duration-quick) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__link:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__empty { padding: var(--tc-space-7) var(--tc-space-4); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: center; color: var(--tc-text-muted); }
/* The last row: composer under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__composer {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cp__input {
  flex: 1;
  min-width: 0;
  height: 28px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-strong);
  caret-color: var(--tc-accent-text);
}
/* Send: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-cp__send .ui-cp__glyph { stroke-width: 1.5; }
.ui-cp__send:disabled { opacity: 0.4; cursor: default; }
.ui-cp__send:not(:disabled):active { transform: scale(0.94); }
@keyframes ui-cp-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-cp-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-cp-pop { from { opacity: 0; transform: scale(0.8); } }
@keyframes ui-cp-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-cp__item,
:where([data-look="standard"], [data-look="standard"] *).ui-cp__menu,
:where([data-look="standard"], [data-look="standard"] *).ui-cp__done { animation: none; }
}
@keyframes ui-cp-window { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
@keyframes ui-cp-window-copy { from { transform: translateX(40%); } to { transform: translateX(-100%); } }
/* Height changes glide instead of jumping */
.ui-cp__morph { overflow: hidden; }
.ui-cp__morph[data-smooth] { transition: height var(--tc-duration-slower) var(--tc-ease-move); }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-cp__morph[data-smooth] { transition: none; }
}
/* Narrow: tighter edges, smaller tab gaps */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cp__bar { padding-left: var(--tc-space-3-5); padding-right: var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__tabs { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__tab { padding: var(--tc-space-1) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__item { padding-left: var(--tc-space-3-5); padding-right: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__composer { padding-left: var(--tc-space-3-5); }
}
@container (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cp__text,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__actions { margin-left: 0; }
}
/* Touch screens: taller targets, resolve always visible */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cp__icon-btn,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__send { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__tab { padding: var(--tc-space-1-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__menu-item { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__done,
:where([data-look="clean"], [data-look="clean"] *).ui-cp__link { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__input { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__resolve { width: 32px; height: 32px; margin: -6px -6px -6px 0; opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cp"] *,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cp"] *::before,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cp"] *::after { animation: none !important; transition: none !important; }
}
/* The composer is the field: its row shows the field focus ring (focus ring + halo) while the input has focus */
.ui-cp__composer { border-radius: var(--tc-field-radius); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cp__input:focus { outline: none; }
.ui-cp__composer:has(.ui-cp__input:focus) { box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="clean"], [data-look="clean"] *).ui-cp__composer { border-radius: 0 0 var(--tc-radius-lg) var(--tc-radius-lg); }
/* Announcements for screen readers only */
.ui-cp__sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
}

if (!customElements.get("tc-comments-panel")) customElements.define("tc-comments-panel", TcCommentsPanel);

declare global {
  interface HTMLElementTagNameMap {
    "tc-comments-panel": TcCommentsPanel;
  }
}
