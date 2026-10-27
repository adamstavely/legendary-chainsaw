import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { RowWindowController, ToolbarController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-version-history> – the versions of an agent, a prompt or a workflow, newest first, on a vertical timeline. Each
 * version says whether it's a draft, the active one or deprecated, who made it and when (as the app gives it), and
 * what it changed – by behaviour, in plain language: + added, − removed, ~ changed. A draft says that the active
 * version stays until it's approved.
 *   · the timeline is a listbox: ↑ ↓ Home End PageUp PageDown move, and the version you're on shows its detail beside
 *     the list (below it when narrow) – its changes, and what you can do with it
 *   · Compare turns the list multi-select: Space or Enter picks two versions, and the detail sums up what changed
 *     between them – from the versions in between, or from the app's `resolveCompare` (loading, error, retry).
 *     Escape leaves compare. "Compare with <active>" picks the pair in one step
 *   · Restore asks the app for a new draft from a past version; Approve and activate asks first, in a modal dialog
 *     that names what changes: focus moves to Cancel, Tab stays inside, Escape cancels, focus returns
 *   · long histories render only the rows near the viewport (RowWindowController)
 * Every action is a cancelable event: tc-select-change, tc-compare, tc-restore and tc-activate (which, unless
 * prevented, makes the draft active and the old active version deprecated in `versions`). It is not a release
 * pipeline (tc-configuration-release-control moves a version through environments) and not a text diff
 * (tc-inline-diff): it is the record of what each version does differently.
 * Standard: the header on the gray tray above a white card, the selected version's detail on a light well. Clean: one
 * white card divided by hairlines, quieter text and thinner icons.
 *
 *   <tc-version-history .versions=${versions}></tc-version-history>
 */

/** Where a version stands */
export type VersionStatus = "draft" | "active" | "deprecated";
/** What a change did to the behaviour */
export type VersionChangeKind = "added" | "removed" | "changed";
/** One change, said as what it will do differently: "Asks for approval before sending" */
export type VersionChange = { kind: VersionChangeKind; text: string };
/** One version of an agent, prompt or workflow */
export type VersionEntry = {
  id: string;
  /** Short, e.g. "v1.3" */
  label: string;
  status: VersionStatus;
  /** One line on what this version is, e.g. "Tightened the review step" */
  note?: string;
  /** Who made it */
  author?: string;
  /** When, shown as given: "Today · 09:12", "May 28" */
  at?: string;
  /** What it does differently from the version before it */
  changes?: VersionChange[];
};
export type VersionSelectDetail = { id: string; version: VersionEntry };
export type VersionCompareDetail = {
  /** The older of the two */
  from: VersionEntry;
  /** The newer of the two */
  to: VersionEntry;
  /** What changed between them, gathered from the versions in between */
  changes: VersionChange[];
};
export type VersionRestoreDetail = { version: VersionEntry };
export type VersionActivateDetail = {
  version: VersionEntry;
  /** The version that was active, now deprecated */
  previous: VersionEntry | null;
  /** The whole list after the change */
  versions: VersionEntry[];
};
/** Answers a comparison: what changed from `from` to `to`; the signal aborts when another pair is picked */
export type VersionCompareResolver = (from: VersionEntry, to: VersionEntry, signal: AbortSignal) => Promise<VersionChange[]>;

/* After Lucide: history – the header's icon */
const headIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>`;
const DEFAULT_STATUS_LABELS: Record<VersionStatus, string> = { draft: "Draft", active: "Active", deprecated: "Deprecated" };
const DEFAULT_CHANGE_LABELS: Record<VersionChangeKind, string> = { added: "Added", removed: "Removed", changed: "Changed" };
const SIGN: Record<VersionChangeKind, string> = { added: "+", removed: "−", changed: "~" };

/** More rows than this render only the ones near the viewport */
const WINDOW_FROM = 60;
const OVERSCAN = 16;
const ROW_H = 56;
let instances = 0;

const icon = (look: Look, d: TemplateResult, size = 16) =>
  html`<svg viewBox="0 0 16 16" width=${size} height=${size} class="ui-vhist__icon" stroke-width=${look === "clean" ? 1.2 : 1.5} aria-hidden="true">${d}</svg>`;
const compareIcon = svg`<path d="M5 2.5v11M11 2.5v11M2.5 5.5 5 3l2.5 2.5M8.5 10.5 11 13l2.5-2.5"></path>`;
const restoreIcon = svg`<path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.77L2.75 5.75"></path><path d="M2.75 2.75v3h3"></path>`;
const checkIcon = svg`<path d="m3.5 8.25 3 3 6-6.5"></path>`;
const infoIcon = svg`<circle cx="8" cy="8" r="5.75"></circle><path d="M8 7.25v3.5M8 5.2v.05"></path>`;

/**
 * The versions of an agent, prompt or workflow on a timeline – draft, active or deprecated, who and when, and what
 * each changed in behaviour – with compare, restore and a confirmed approve-and-activate.
 * @tag tc-version-history
 * @fires tc-select-change - The version shown in the detail changed; detail `{ id, version }` (VersionSelectDetail). Cancelable – prevented, `selected` stays.
 * @fires tc-compare - Two versions were picked to compare; detail `{ from, to, changes }` (VersionCompareDetail). Cancelable – prevented, the app shows the comparison itself.
 * @fires tc-restore - Restore was pressed on a past version; detail `{ version }` (VersionRestoreDetail). Cancelable – not prevented, the version shows "Restore requested" until `versions` changes.
 * @fires tc-activate - A draft's activation was confirmed; detail `{ version, previous, versions }` (VersionActivateDetail). Cancelable – not prevented, `versions` becomes the list after the change.
 */
export class TcVersionHistory extends TcElement {
  static override ui = "vhist";

  /** The versions, newest first */
  @property({ attribute: false }) accessor versions: VersionEntry[] = [];
  /** The heading, and the region's name */
  @property() accessor heading = "Version history";
  /** The quiet line under the heading */
  @property() accessor description = "What each version does differently";
  /** The version whose detail shows; unset follows the draft, else the active version, else the newest */
  @property() accessor selected: string | null = null;
  /** Answers a comparison with the changes between two versions; unset, the element gathers them from the versions in between */
  @property({ attribute: false }) accessor resolveCompare: VersionCompareResolver | undefined = undefined;
  /** Why the draft can't be activated by this person; set, Approve and activate stays unavailable and says so */
  @property({ attribute: "activate-blocked" }) accessor activateBlocked = "";
  /** Restore is offered on past versions (default true) */
  @property({ type: Boolean, attribute: "can-restore" }) accessor canRestore = true;
  /** The tallest the timeline grows, in px, before it scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 360;
  /** The names of the statuses – in place of Draft, Active and Deprecated */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<VersionStatus, string>> = {};
  /** What screen readers hear before each change – in place of Added, Removed and Changed */
  @property({ attribute: false }) accessor changeLabels: Partial<Record<VersionChangeKind, string>> = {};
  /** The approve button and the confirmation's action */
  @property({ attribute: "activate-label" }) accessor activateLabel = "Approve and activate";
  /** The restore button */
  @property({ attribute: "restore-label" }) accessor restoreLabel = "Restore as draft";
  /** The compare toggle */
  @property({ attribute: "compare-label" }) accessor compareLabel = "Compare";
  /** The confirmation's cancel button */
  @property({ attribute: "cancel-label" }) accessor cancelLabel = "Cancel";

  /** @internal The row the list's tab stop is on */
  @state() accessor cursor: string | null = null;
  /** @internal Compare mode is on */
  @state() accessor comparing = false;
  /** @internal The versions picked to compare, at most two, in the order picked */
  @state() accessor picks: string[] = [];
  /** @internal The app's answer to a comparison */
  @state() accessor answer: { key: string; state: "loading" | "error" | "done" | "app"; changes?: VersionChange[] } | null = null;
  /** @internal Versions whose restore was asked for, waiting for `versions` to change */
  @state() accessor requested: string[] = [];
  /** @internal The draft whose activation is being confirmed */
  @state() accessor confirming: string | null = null;
  /** @internal A polite message for screen readers */
  @state() accessor said = "";

  private readonly uid = `tc-vhist${++instances}`;
  private readonly win: RowWindowController;
  private readonly tools: ToolbarController;
  private index = new Map<string, number>();
  private focusRow: string | null = null;
  private opener: HTMLElement | null = null;
  private abort: AbortController | null = null;
  private ownName = false;

  constructor() {
    super();
    this.win = new RowWindowController(this, {
      count: () => this.versions.length,
      body: () => this.querySelector(".ui-vhist__rows"),
      rowSelector: ".ui-vhist__row",
      from: WINDOW_FROM,
      overscan: OVERSCAN,
      rowHeight: ROW_H,
    });
    this.tools = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-vhist__act")] });
  }

  /** The version in use, if any */
  get activeVersion() {
    return this.versions.find((v) => v.status === "active") ?? null;
  }

  /** The version the detail shows */
  get current() {
    const id = this.selected;
    return (id ? this.versions.find((v) => v.id === id) : undefined) ?? this.versions.find((v) => v.status === "draft") ?? this.activeVersion ?? this.versions[0] ?? null;
  }

  private status(s: VersionStatus) {
    return this.statusLabels[s] ?? DEFAULT_STATUS_LABELS[s];
  }
  private kind(k: VersionChangeKind) {
    return this.changeLabels[k] ?? DEFAULT_CHANGE_LABELS[k];
  }
  private rowEl(id: string | null | undefined) {
    return id ? this.querySelector<HTMLElement>(`.ui-vhist__row[data-id="${CSS.escape(id)}"]`) : null;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.abort?.abort();
    this.abort = null;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("versions")) {
      this.index = new Map(this.versions.map((v, i) => [v.id, i]));
      // A restore is answered by a new list: the request is done, and a new draft it brought is shown
      const before = changed.get("versions") as VersionEntry[] | undefined;
      if (before !== undefined && this.requested.length) {
        const known = new Set(before.map((v) => v.id));
        const draft = this.versions.find((v) => v.status === "draft" && !known.has(v.id));
        if (draft) {
          this.cursor = draft.id;
          if (this.emit<VersionSelectDetail>("tc-select-change", { id: draft.id, version: draft }, { cancelable: true })) this.selected = draft.id;
        }
        this.requested = [];
      }
      this.picks = this.picks.filter((id) => this.index.has(id));
    }
    if (!this.cursor || !this.index.has(this.cursor)) this.cursor = this.current?.id ?? null;
    this.win.compute();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    this.style.setProperty("--tc-version-history-max", `${this.maxHeight}px`);
    if (this.focusRow) {
      const el = this.rowEl(this.focusRow);
      const i = this.index.get(this.focusRow);
      if (el) {
        this.focusRow = null;
        el.focus({ preventScroll: true });
        el.scrollIntoView?.({ block: "nearest" });
      } else if (i !== undefined) this.win.reveal(i);
      else this.focusRow = null;
    }
  }

  /* ---------- Selection and compare ---------- */

  private select(id: string) {
    const version = this.versions.find((v) => v.id === id);
    if (!version || id === this.current?.id) return;
    if (this.emit<VersionSelectDetail>("tc-select-change", { id, version }, { cancelable: true })) this.selected = id;
  }

  private setComparing(on: boolean) {
    if (on === this.comparing) return;
    this.comparing = on;
    this.abort?.abort();
    this.answer = null;
    this.picks = on && this.current ? [this.current.id] : [];
    this.said = on ? "Compare: pick two versions." : "";
  }

  private pick(id: string) {
    const at = this.picks.indexOf(id);
    const picks = at >= 0 ? this.picks.filter((p) => p !== id) : [...this.picks, id].slice(-2);
    this.picks = picks;
    this.abort?.abort();
    this.answer = null;
    if (picks.length === 2) this.compare(picks[0], picks[1]);
    else this.said = at >= 0 ? `${this.versions[this.index.get(id)!].label} unpicked.` : "Pick one more version.";
  }

  /** The two in order (older first), and the changes from the versions after the older up to the newer */
  private between(a: string, b: string) {
    const [i, j] = [this.index.get(a)!, this.index.get(b)!];
    const older = this.versions[Math.max(i, j)];
    const newer = this.versions[Math.min(i, j)];
    const changes: VersionChange[] = [];
    for (let k = Math.max(i, j) - 1; k >= Math.min(i, j); k--) changes.push(...(this.versions[k].changes ?? []));
    return { from: older, to: newer, changes };
  }

  private compare(a: string, b: string) {
    const pair = this.between(a, b);
    const key = `${pair.from.id}>${pair.to.id}`;
    if (!this.emit<VersionCompareDetail>("tc-compare", pair, { cancelable: true })) {
      this.answer = { key, state: "app" };
      this.said = `Comparing ${pair.from.label} with ${pair.to.label}.`;
      return;
    }
    if (!this.resolveCompare) {
      this.answer = { key, state: "done", changes: pair.changes };
      this.said = `${pair.from.label} to ${pair.to.label}: ${this.count(pair.changes.length)}.`;
      return;
    }
    const abort = new AbortController();
    this.abort = abort;
    this.answer = { key, state: "loading" };
    this.said = `Comparing ${pair.from.label} with ${pair.to.label}…`;
    this.resolveCompare(pair.from, pair.to, abort.signal).then(
      (changes) => {
        if (abort.signal.aborted) return;
        this.answer = { key, state: "done", changes };
        this.said = `${pair.from.label} to ${pair.to.label}: ${this.count(changes.length)}.`;
      },
      () => {
        if (abort.signal.aborted) return;
        this.answer = { key, state: "error" };
        this.said = `Couldn't compare ${pair.from.label} with ${pair.to.label}.`;
      },
    );
  }

  private count(n: number) {
    return n === 1 ? "1 change" : `${n} changes`;
  }

  /** Compare the version you're on with the active one, in one step */
  private compareWithActive(id: string) {
    const active = this.activeVersion;
    if (!active || active.id === id) return;
    this.comparing = true;
    this.picks = [id, active.id];
    this.abort?.abort();
    this.compare(id, active.id);
  }

  /* ---------- Restore and activate ---------- */

  private restore(v: VersionEntry) {
    if (this.requested.includes(v.id)) return;
    if (this.emit<VersionRestoreDetail>("tc-restore", { version: v }, { cancelable: true })) {
      this.requested = [...this.requested, v.id];
      this.said = `Restore of ${v.label} requested.`;
    }
  }

  private get dialogEl() {
    return this.querySelector<HTMLDialogElement>(".ui-vhist__dialog");
  }

  private ask(v: VersionEntry, opener: HTMLElement) {
    if (this.activateBlocked || v.status !== "draft") return;
    this.opener = opener;
    this.confirming = v.id;
    void this.updateComplete.then(() => {
      const d = this.dialogEl;
      if (!d) return;
      if (!d.open) {
        if (typeof d.showModal === "function") d.showModal();
        else d.setAttribute("open", "");
      }
      d.querySelector<HTMLElement>(".ui-vhist__cancel")?.focus();
    });
  }

  private close(focus: HTMLElement | null = this.opener) {
    if (this.confirming === null) return;
    const d = this.dialogEl;
    if (d?.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    this.confirming = null;
    this.opener = null;
    void this.updateComplete.then(() => (focus?.isConnected ? focus : (this.rowEl(this.cursor) ?? this.querySelector<HTMLElement>(".ui-vhist__toggle")))?.focus());
  }

  private activate() {
    const v = this.versions.find((x) => x.id === this.confirming);
    if (!v) return this.close();
    const previous = this.activeVersion;
    const versions = this.versions.map((x): VersionEntry => (x.id === v.id ? { ...x, status: "active" } : x.status === "active" ? { ...x, status: "deprecated" } : x));
    const applied = this.emit<VersionActivateDetail>("tc-activate", { version: { ...v, status: "active" }, previous, versions }, { cancelable: true });
    if (applied) {
      this.versions = versions;
      this.cursor = v.id;
      this.said = `${v.label} is active.${previous ? ` ${previous.label} is deprecated.` : ""}`;
    }
    // The approve button goes with the draft; focus goes back to its row
    this.close(applied ? this.rowEl(v.id) : this.opener);
  }

  private onDialogKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...(this.dialogEl?.querySelectorAll<HTMLElement>("button") ?? [])];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !this.dialogEl?.contains(at))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at === last) {
      e.preventDefault();
      first.focus();
    }
  };

  /* ---------- Keyboard ---------- */

  private moveTo(i: number) {
    const v = this.versions[Math.max(0, Math.min(this.versions.length - 1, i))];
    if (!v) return;
    this.cursor = v.id;
    this.focusRow = v.id;
    if (!this.comparing) this.select(v.id);
  }

  private onListKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const at = this.cursor ? (this.index.get(this.cursor) ?? 0) : 0;
    const page = Math.max(1, Math.floor(this.maxHeight / this.win.rowHeight) - 1);
    const to =
      e.key === "ArrowDown" ? at + 1
      : e.key === "ArrowUp" ? at - 1
      : e.key === "Home" ? 0
      : e.key === "End" ? this.versions.length - 1
      : e.key === "PageDown" ? at + page
      : e.key === "PageUp" ? at - page
      : null;
    if (to !== null) {
      e.preventDefault();
      this.moveTo(to);
      return;
    }
    if (this.comparing && (e.key === " " || e.key === "Enter") && this.cursor) {
      e.preventDefault();
      this.pick(this.cursor);
      return;
    }
    if (this.comparing && e.key === "Escape") {
      e.preventDefault();
      this.setComparing(false);
    }
  };

  /* ---------- Parts ---------- */

  private pill(s: VersionStatus) {
    return html`<span class="ui-vhist__pill" data-status=${s}><span class="ui-vhist__pill-dot" aria-hidden="true"></span>${this.status(s)}</span>`;
  }

  private head() {
    const active = this.activeVersion;
    return cardHead({
      icon: headIcon,
      title: this.heading,
      subtitle: this.description || undefined,
      aside: active ? html`<span class="ui-vhist__live"><span class="ui-vhist__live-dot" aria-hidden="true"></span>${active.label} ${this.status("active").toLowerCase()}</span>` : undefined,
    });
  }

  private bar(look: Look) {
    const n = this.versions.length;
    const hint = this.comparing ? (this.picks.length === 2 ? "Comparing two versions" : `Pick ${2 - this.picks.length} ${this.picks.length ? "more version" : "versions"}`) : `${n} ${n === 1 ? "version" : "versions"}`;
    return html`<div class="ui-vhist__bar">
      <span class="ui-vhist__count">${hint}</span>
      ${n > 1
        ? html`<button type="button" class="ui-vhist__toggle" aria-pressed=${this.comparing ? "true" : "false"} @click=${() => this.setComparing(!this.comparing)}>
            ${icon(look, compareIcon, 14)}${this.compareLabel}
          </button>`
        : nothing}
    </div>`;
  }

  private row(v: VersionEntry, i: number, look: Look, top?: number) {
    const picked = this.picks.includes(v.id);
    const shown = this.current?.id === v.id;
    const selected = this.comparing ? picked : shown;
    return html`<div
      role="option"
      id=${`${this.uid}-${i}`}
      class="ui-vhist__row"
      data-id=${v.id}
      data-status=${v.status}
      aria-selected=${selected ? "true" : "false"}
      aria-posinset=${i + 1}
      aria-setsize=${this.versions.length}
      tabindex=${this.cursor === v.id ? 0 : -1}
      ?data-first=${i === 0}
      ?data-last=${i === this.versions.length - 1}
      ?data-shown=${!this.comparing && shown}
      ?data-float=${top !== undefined}
      style=${styleMap({ top: top === undefined ? undefined : `${top}px` })}
      @click=${() => {
        this.cursor = v.id;
        this.focusRow = v.id;
        if (this.comparing) this.pick(v.id);
        else this.select(v.id);
      }}
    >
      <span class="ui-vhist__rail" aria-hidden="true"><span class="ui-vhist__dot"></span></span>
      ${this.comparing ? html`<span class="ui-vhist__check" aria-hidden="true">${picked ? icon(look, checkIcon, 12) : nothing}</span>` : nothing}
      <span class="ui-vhist__row-main">
        <span class="ui-vhist__row-top">
          <span class="ui-vhist__label">${v.label}</span>
          ${this.pill(v.status)}
          ${v.at ? html`<span class="ui-vhist__when">${v.at}</span>` : nothing}
        </span>
        <span class="ui-vhist__row-note">${v.note ?? ""}${v.author ? html`<span class="ui-vhist__sr">, by ${v.author}</span>` : nothing}</span>
      </span>
    </div>`;
  }

  private rows(look: Look) {
    const win = this.win;
    const list = this.versions;
    if (!win.virtual) return repeat(list, (v) => v.id, (v, i) => this.row(v, i, look));
    // Two spacers that stay in place, the window between them; the row with the tab stop stays rendered (out of the
    // flow, where it would be) while it's outside the window, so it keeps focus
    const a = this.cursor ? (this.index.get(this.cursor) ?? -1) : -1;
    const kept = a >= 0 && (a < win.start || a >= win.end) ? [a] : [];
    const h = win.rowHeight;
    const idx = [...kept, ...Array.from({ length: win.end - win.start }, (_, k) => win.start + k)].sort((x, y) => x - y);
    return html`<div class="ui-vhist__spacer" aria-hidden="true" style=${styleMap({ height: `${win.start * h}px` })}></div>
      ${repeat(idx, (n) => list[n].id, (n) => this.row(list[n], n, look, n < win.start || n >= win.end ? n * h : undefined))}
      <div class="ui-vhist__spacer" aria-hidden="true" style=${styleMap({ height: `${(list.length - win.end) * h}px` })}></div>`;
  }

  private changes(list: VersionChange[], label?: string) {
    if (!list.length) return html`<p class="ui-vhist__quiet">No changes in behaviour.</p>`;
    return html`<ul class="ui-vhist__changes" aria-label=${ifDefined(label)}>
      ${list.map(
        (c) => html`<li class="ui-vhist__change" data-kind=${c.kind}>
          <span class="ui-vhist__sign" aria-hidden="true">${SIGN[c.kind]}</span><span class="ui-vhist__sr">${this.kind(c.kind)}: </span><span class="ui-vhist__change-text">${c.text}</span>
        </li>`,
      )}
    </ul>`;
  }

  private detail(look: Look) {
    if (this.comparing) return this.comparison();
    const v = this.current;
    if (!v) return nothing;
    const active = this.activeVersion;
    const requested = this.requested.includes(v.id);
    const blockedId = `${this.uid}-blocked`;
    const actions: TemplateResult[] = [];
    if (v.status === "draft")
      actions.push(html`<button
        type="button"
        class="ui-vhist__act ui-vhist__act--primary"
        aria-haspopup="dialog"
        aria-disabled=${this.activateBlocked ? "true" : "false"}
        aria-describedby=${ifDefined(this.activateBlocked ? blockedId : undefined)}
        @click=${(e: Event) => this.ask(v, e.currentTarget as HTMLElement)}
      >${icon(look, checkIcon, 14)}${this.activateLabel}</button>`);
    if (v.status === "deprecated" && this.canRestore)
      actions.push(html`<button type="button" class="ui-vhist__act" aria-disabled=${requested ? "true" : "false"} @click=${() => this.restore(v)}>
        ${icon(look, restoreIcon, 14)}${requested ? "Restore requested" : this.restoreLabel}
      </button>`);
    if (active && active.id !== v.id)
      actions.push(html`<button type="button" class="ui-vhist__act" @click=${() => this.compareWithActive(v.id)}>${icon(look, compareIcon, 14)}${this.compareLabel} with ${active.label}</button>`);
    return html`<section class="ui-vhist__detail" aria-labelledby=${`${this.uid}-dt`} data-status=${v.status}>
      <div class="ui-vhist__dt-head">
        <h4 class="ui-vhist__dt-label" id=${`${this.uid}-dt`}>${v.label}</h4>
        ${this.pill(v.status)}
      </div>
      ${v.note ? html`<p class="ui-vhist__dt-note">${v.note}</p>` : nothing}
      ${v.author || v.at ? html`<p class="ui-vhist__meta">${[v.at, v.author].filter(Boolean).join(" · ")}</p>` : nothing}
      <h5 class="ui-vhist__caption">Changes</h5>
      ${this.changes(v.changes ?? [], `Changes in ${v.label}`)}
      ${v.status === "draft"
        ? html`<p class="ui-vhist__callout">${icon(look, infoIcon, 14)}<span>${active ? `${active.label} stays active until this draft is approved.` : "Nothing is active until this draft is approved."}</span></p>`
        : nothing}
      ${requested ? html`<p class="ui-vhist__callout">${icon(look, infoIcon, 14)}<span>A new draft from ${v.label} will appear at the top.</span></p>` : nothing}
      ${this.activateBlocked && v.status === "draft" ? html`<p class="ui-vhist__blocked" id=${blockedId}>${this.activateBlocked}</p>` : nothing}
      ${actions.length
        ? html`<div class="ui-vhist__acts" role="toolbar" aria-label=${`${v.label} actions`} @keydown=${this.tools.onKeyDown} @focusin=${this.tools.onFocusIn}>${actions}</div>`
        : nothing}
    </section>`;
  }

  private comparison() {
    if (this.picks.length < 2)
      return html`<section class="ui-vhist__detail" aria-label="Compare">
        <p class="ui-vhist__quiet">${this.picks.length ? "Pick one more version to compare with." : "Pick two versions to compare."} Space or Enter picks the one you're on; Escape leaves compare.</p>
      </section>`;
    const { from, to, changes } = this.between(this.picks[0], this.picks[1]);
    const a = this.answer;
    const steps = (this.index.get(from.id) ?? 0) - (this.index.get(to.id) ?? 0);
    return html`<section class="ui-vhist__detail" aria-labelledby=${`${this.uid}-cmp`}>
      <div class="ui-vhist__dt-head">
        <h4 class="ui-vhist__dt-label" id=${`${this.uid}-cmp`}>${from.label} <span class="ui-vhist__arrow" aria-hidden="true">→</span><span class="ui-vhist__sr">to</span> ${to.label}</h4>
      </div>
      <p class="ui-vhist__meta">${steps === 1 ? "One version apart" : `${steps} versions apart`}</p>
      <h5 class="ui-vhist__caption">What changes</h5>
      ${!a || a.state === "app"
        ? html`<p class="ui-vhist__quiet">Opened in the comparison view.</p>`
        : a.state === "loading"
          ? html`<p class="ui-vhist__quiet ui-vhist__loading" aria-busy="true"><span class="ui-vhist__spinner" aria-hidden="true"></span>Comparing…</p>`
          : a.state === "error"
            ? html`<p class="ui-vhist__error">Couldn't compare these versions.
                <button type="button" class="ui-vhist__retry" @click=${() => this.compare(this.picks[0], this.picks[1])}>Try again</button></p>`
            : this.changes(a.changes ?? changes, `Changes from ${from.label} to ${to.label}`)}
    </section>`;
  }

  private dialog(look: Look) {
    const v = this.confirming ? this.versions.find((x) => x.id === this.confirming) : null;
    const active = this.activeVersion;
    const id = this.uid;
    return html`<dialog
      class="ui-vhist__dialog"
      aria-labelledby=${`${id}-dlg-title`}
      aria-describedby=${`${id}-dlg-desc`}
      @keydown=${this.onDialogKey}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.close();
      }}
    >
      ${!v
        ? nothing
        : html`<div class="ui-vhist__dlg">
            <h3 class="ui-vhist__dlg-title" id=${`${id}-dlg-title`}>Activate ${v.label}?</h3>
            <div class="ui-vhist__dlg-desc" id=${`${id}-dlg-desc`}>
              <p>${v.label} becomes the active version${active ? html` and <strong>${active.label}</strong> is deprecated` : nothing}. ${(v.changes ?? []).length ? `${this.count(v.changes!.length)} take${v.changes!.length === 1 ? "s" : ""} effect:` : ""}</p>
              ${(v.changes ?? []).length ? this.changes(v.changes!) : nothing}
              <p class="ui-vhist__quiet">Earlier runs keep showing the version that produced them.</p>
            </div>
            <div class="ui-vhist__dlg-actions">
              <button type="button" class="ui-vhist__btn ui-vhist__cancel" @click=${() => this.close()}>${this.cancelLabel}</button>
              <button type="button" class="ui-vhist__btn ui-vhist__btn--primary ui-vhist__confirm" @click=${() => this.activate()}>${icon(look, checkIcon, 14)}${this.activateLabel}</button>
            </div>
          </div>`}
    </dialog>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const list = this.versions;
    return html`
      ${this.head()}
      <div class="ui-vhist__card" ?data-comparing=${this.comparing}>
        ${list.length
          ? html`<div class="ui-vhist__list">
                ${this.bar(look)}
                <div
                  class="ui-vhist__rows"
                  role="listbox"
                  aria-label=${this.comparing ? "Versions – pick two to compare" : "Versions"}
                  aria-multiselectable=${ifDefined(this.comparing ? "true" : undefined)}
                  @keydown=${this.onListKey}
                >${this.rows(look)}</div>
              </div>
              ${this.detail(look)}`
          : html`<p class="ui-vhist__empty">No versions yet – the first one appears here once it's saved.</p>`}
      </div>
      ${this.dialog(look)}
      <span class="ui-vhist__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="vhist"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="vhist"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="vhist"] { overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-weight: var(--tc-font-weight-regular); }
[data-ui="vhist"] *, [data-ui="vhist"] *::before, [data-ui="vhist"] *::after { box-sizing: border-box; }
:where([data-ui="vhist"]) :is(h4, h5, p, ul) { margin: 0; padding: 0; }
:where([data-ui="vhist"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="vhist"] :is(button, [role="option"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="vhist"] svg { display: block; flex: none; }
.ui-vhist__icon { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
.ui-vhist__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* Status and change colours; the words and signs carry the meaning too */
[data-ui="vhist"] [data-status="draft"] { --tc-version-history-fg: var(--tc-status-info-fg); --tc-version-history-bg: var(--tc-status-info-bg); }
[data-ui="vhist"] [data-status="active"] { --tc-version-history-fg: var(--tc-status-success-fg); --tc-version-history-bg: var(--tc-status-success-bg); }
[data-ui="vhist"] [data-status="deprecated"] { --tc-version-history-fg: var(--tc-text-muted); --tc-version-history-bg: var(--tc-fill-default); }
[data-ui="vhist"] [data-kind="added"] { --tc-version-history-fg: var(--tc-status-success-fg); --tc-version-history-bg: var(--tc-status-success-bg); }
[data-ui="vhist"] [data-kind="removed"] { --tc-version-history-fg: var(--tc-status-danger-fg); --tc-version-history-bg: var(--tc-status-danger-bg); }
[data-ui="vhist"] [data-kind="changed"] { --tc-version-history-fg: var(--tc-status-warning-fg); --tc-version-history-bg: var(--tc-status-warning-bg); }

/* ----- The header's aside: which version is live ----- */
.ui-vhist__live { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-vhist__live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* ----- The card: the timeline, then the detail (beside it when there's room) ----- */
.ui-vhist__card { display: grid; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-vhist__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-vhist__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-vhist__list { min-width: 0; }
.ui-vhist__bar { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); min-height: 44px; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-vhist__count { min-width: 0; overflow: hidden; color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); white-space: nowrap; text-overflow: ellipsis; }
.ui-vhist__toggle { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-vhist__toggle:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-vhist__toggle[aria-pressed="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); }

/* The timeline: a scrolling listbox, windowed between two spacers that stay in place. The rail is drawn per row, so
   windowed rows join up */
.ui-vhist__rows { position: relative; max-height: var(--tc-version-history-max, 360px); overflow-y: auto; overflow-anchor: none; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; padding: var(--tc-space-1) 0; }
.ui-vhist__spacer { flex: none; }
.ui-vhist__row { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); height: ${ROW_H}px; margin: 0 var(--tc-space-1-5); padding: 0 var(--tc-space-2-5) 0 0; border-radius: var(--tc-radius-md); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-vhist__row[data-float] { position: absolute; left: 0; right: 0; }
.ui-vhist__row:hover { background: var(--tc-fill-subtle); }
.ui-vhist__row[data-shown], [data-comparing] .ui-vhist__row[aria-selected="true"] { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-vhist__rail { position: relative; flex: none; align-self: stretch; width: 28px; }
.ui-vhist__rail::before { content: ""; position: absolute; top: 0; bottom: 0; left: calc(50% - 0.75px); width: 1.5px; background: var(--tc-border-default); }
.ui-vhist__row[data-first] .ui-vhist__rail::before { top: 50%; }
.ui-vhist__row[data-last] .ui-vhist__rail::before { bottom: 50%; }
.ui-vhist__row[data-first][data-last] .ui-vhist__rail::before { display: none; }
.ui-vhist__dot { position: absolute; top: calc(50% - 5px); left: calc(50% - 5px); width: 10px; height: 10px; border-radius: 50%; background: var(--tc-surface-on-tray); box-shadow: inset 0 0 0 1.5px var(--tc-version-history-fg); }
:where([data-look="clean"], [data-look="clean"] *) .ui-vhist__dot { background: var(--tc-surface-raised); }
.ui-vhist__row[data-status="active"] .ui-vhist__dot { background: var(--tc-version-history-fg); }
.ui-vhist__row[data-status="draft"] .ui-vhist__dot { box-shadow: inset 0 0 0 1.5px var(--tc-version-history-fg), inset 0 0 0 3px var(--tc-surface-on-tray), inset 0 0 0 5px var(--tc-version-history-fg); }
:where([data-look="clean"], [data-look="clean"] *) .ui-vhist__row[data-status="draft"] .ui-vhist__dot { box-shadow: inset 0 0 0 1.5px var(--tc-version-history-fg), inset 0 0 0 3px var(--tc-surface-raised), inset 0 0 0 5px var(--tc-version-history-fg); }
.ui-vhist__check { display: grid; flex: none; place-items: center; width: 16px; height: 16px; border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 1px var(--tc-border-strong); color: var(--tc-text-on-accent); }
.ui-vhist__row[aria-selected="true"] .ui-vhist__check { background: var(--tc-accent); box-shadow: none; }
.ui-vhist__row-main { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-vhist__row-top { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-vhist__label { flex: none; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
.ui-vhist__when { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); text-align: right; white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-vhist__row-note { overflow: hidden; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; }
.ui-vhist__row[data-status="deprecated"] .ui-vhist__row-note { color: var(--tc-text-muted); }
.ui-vhist__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-version-history-bg); color: var(--tc-version-history-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-vhist__pill-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.ui-vhist__pill[data-status="deprecated"] .ui-vhist__pill-dot { background: none; box-shadow: inset 0 0 0 1px currentColor; }
.ui-vhist__empty { padding: var(--tc-space-8) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }

/* ----- The detail: the version you're on, or the comparison ----- */
.ui-vhist__detail { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-vhist__detail { background: var(--tc-surface-well); }
.ui-vhist__dt-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-vhist__dt-label { font-family: var(--tc-font-mono); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); color: var(--tc-title-color); }
.ui-vhist__arrow { font-family: var(--tc-font-sans); color: var(--tc-text-muted); }
.ui-vhist__dt-note { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *) .ui-vhist__dt-note { font-weight: var(--tc-font-weight-medium); }
.ui-vhist__meta { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-vhist__caption { margin-top: var(--tc-space-2); color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-vhist__changes { display: grid; gap: var(--tc-space-1-5); list-style: none; }
.ui-vhist__change { display: flex; align-items: flex-start; gap: var(--tc-space-2); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-vhist__sign { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); background: var(--tc-version-history-bg); color: var(--tc-version-history-fg); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); }
.ui-vhist__change-text { min-width: 0; overflow-wrap: anywhere; }
.ui-vhist__quiet { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-vhist__callout { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-vhist__callout > svg { position: relative; top: 2px; color: var(--tc-text-muted); }
.ui-vhist__blocked { color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-vhist__error { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); }
.ui-vhist__retry { color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: 2px; }
.ui-vhist__loading { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-vhist__spinner { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--tc-fill-strong); border-top: 1.5px solid var(--tc-text-muted); animation: ui-vhist-spin var(--tc-duration-shimmer) linear infinite; }
@keyframes ui-vhist-spin { to { transform: rotate(1turn); } }
.ui-vhist__acts { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); margin-top: var(--tc-space-2); }
.ui-vhist__act, .ui-vhist__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-vhist__act, .ui-vhist__btn) { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
.ui-vhist__act:hover, .ui-vhist__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-vhist__act--primary, .ui-vhist__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow, none); color: var(--tc-action-primary-fg); }
.ui-vhist__act--primary:hover, .ui-vhist__btn--primary:hover { background: var(--tc-action-primary-bg-hover, var(--tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, none); }
.ui-vhist__act[aria-disabled="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-muted); cursor: not-allowed; }

/* ----- The confirmation ----- */
.ui-vhist__dialog { width: min(440px, calc(100vw - 2 * var(--tc-space-4))); max-height: calc(100vh - 2 * var(--tc-space-4)); margin: auto; padding: 0; overflow: auto; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-vhist__dialog:not([open]) { display: none; }
.ui-vhist__dialog::backdrop { background: var(--tc-scrim); }
.ui-vhist__dialog[open] { animation: ui-vhist-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-vhist__dlg { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-5); }
.ui-vhist__dlg-title { margin: 0; color: var(--tc-title-color); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); }
.ui-vhist__dlg-desc { display: grid; gap: var(--tc-space-2-5); }
.ui-vhist__dlg-desc > p:first-child { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-vhist__dlg-desc strong { font-weight: var(--tc-font-weight-semibold); }
.ui-vhist__dlg-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }
@keyframes ui-vhist-pop { from { opacity: 0; transform: translateY(6px) scale(0.98); } }

@container (min-width: 600px) {
  .ui-vhist__card:has(> .ui-vhist__list) { grid-template-columns: minmax(240px, 5fr) 6fr; }
  .ui-vhist__list { border-right: var(--tc-hairline) solid var(--tc-divider); }
  .ui-vhist__detail { border-top: 0; }
}
@container (max-width: 400px) {
  .ui-vhist__dlg { padding: var(--tc-space-4); }
  .ui-vhist__acts > .ui-vhist__act { flex: 1 1 100%; justify-content: center; }
}
@media (pointer: coarse) {
  .ui-vhist__toggle { height: 32px; }
  .ui-vhist__act, .ui-vhist__btn { height: 40px; }
}
@media (forced-colors: active) {
  .ui-vhist__rail::before, .ui-vhist__dot { forced-color-adjust: none; }
  .ui-vhist__rail::before { background: GrayText; }
  .ui-vhist__dot { background: Canvas; box-shadow: none; border: 1.5px solid CanvasText; }
  .ui-vhist__row[data-status="active"] .ui-vhist__dot, .ui-vhist__row[data-status="draft"] .ui-vhist__dot { background: CanvasText; box-shadow: inset 0 0 0 2px Canvas; }
  .ui-vhist__check { border: 1px solid CanvasText; }
  .ui-vhist__pill, .ui-vhist__live, .ui-vhist__sign { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="vhist"] *, [data-ui="vhist"] *::before, [data-ui="vhist"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-version-history")) customElements.define("tc-version-history", TcVersionHistory);

declare global {
  interface HTMLElementTagNameMap {
    "tc-version-history": TcVersionHistory;
  }
}
