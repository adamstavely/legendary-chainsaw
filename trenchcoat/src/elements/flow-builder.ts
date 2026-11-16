import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { defaultWorkflowStatusLabels, workflowKind, workflowKindIcon, type WorkflowKind, type WorkflowKindInfo, type WorkflowStatus } from "./workflow-canvas";

/*
 * <tc-flow-builder> – an automation drawn as a top-down flow you build in place. The trigger sits at the top and the
 * steps run down a column joined by lines; a + on every line opens a short menu of steps to insert there (AI step,
 * Send message, Wait, If / else, Approval – or the page's own). If / else forks into named paths side by side that
 * join again below. Steps are renamed in place, moved up and down within their path, and removed; Undo and Redo walk
 * the edits back and forth. Test run asks the page to run the flow, and while it does a light runs down the line into
 * the step that's working, each step with its status in a mark and a word.
 *   · the steps and the + buttons are one tab stop: ↑ / ↓ move through them in reading order, Home / End jump
 *   · on a step: Enter or F2 renames it, Alt + ↑ / ↓ moves it, Delete removes it; ⌘Z / Ctrl+Z undoes, ⇧⌘Z / Ctrl+Y redoes
 *   · narrow, an If / else's paths stack instead of sitting side by side
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-flow-builder .trigger=${{ title: "Form submitted" }} .flow=${steps} .statuses=${{ classify: "running" }}></tc-flow-builder>
 */

export type FlowStepStatus = WorkflowStatus;
export type FlowStep = {
  id: string;
  /** Sets the icon: llm, output, wait, condition, approval, tool, or the page's own */
  kind: WorkflowKind;
  title: string;
  /** One quiet line under the title */
  detail?: string;
  /** An If / else's named paths, side by side; each is a column of steps of its own */
  branches?: FlowBranch[];
};
export type FlowBranch = { id: string; label: string; steps: FlowStep[] };
export type FlowTrigger = { title: string; detail?: string; kind?: WorkflowKind };
/** A step the + menu offers */
export type FlowStepOption = {
  id: string;
  kind: WorkflowKind;
  label: string;
  /** One line on what it does */
  description?: string;
  /** For a step that forks: its paths' names, e.g. ["If", "Else"] */
  branches?: string[];
};
/** Where a step goes in: a path ("root" for the main column, else a branch's id) and a position in it */
export type FlowPlace = { list: string; index: number };

/** Details of the events */
export type FlowChange = { flow: FlowStep[]; change: "add" | "remove" | "move" | "rename" | "undo" | "redo"; id: string };
export type FlowTestRun = { flow: FlowStep[] };

/** Clock: Lucide (ISC, lucide.dev) – for Wait, which the workflow kinds lack */
const waitInfo: WorkflowKindInfo = { label: "Wait", icon: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>` };
export const defaultFlowKinds: Record<string, Partial<WorkflowKindInfo>> = { wait: waitInfo, output: { label: "Message" }, condition: { label: "If / else" } };

/** The + menu's steps – replace with your own */
export const defaultFlowOptions: FlowStepOption[] = [
  { id: "ai", kind: "llm", label: "AI step", description: "Asks a model to write, sort or pull out" },
  { id: "message", kind: "output", label: "Send message", description: "Emails or posts to people you choose" },
  { id: "wait", kind: "wait", label: "Wait", description: "Pauses for a time or until something happens" },
  { id: "if-else", kind: "condition", label: "If / else", description: "Splits into two paths by a rule", branches: ["If", "Else"] },
  { id: "approval", kind: "approval", label: "Approval", description: "Waits for a person to approve" },
];

/* ---------- Pure helpers on a flow, exported for pages and tests ---------- */

/** The flow with the path `list` ("root" or a branch id) replaced by `fn` of it; the same array when nothing changed */
function editList(steps: FlowStep[], list: string, fn: (steps: FlowStep[]) => FlowStep[], self = "root"): FlowStep[] {
  if (list === self) return fn(steps);
  let changed = false;
  const out = steps.map((s) => {
    if (!s.branches) return s;
    let own = false;
    const branches = s.branches.map((b) => {
      const next = editList(b.steps, list, fn, b.id);
      if (next === b.steps) return b;
      own = true;
      return { ...b, steps: next };
    });
    if (!own) return s;
    changed = true;
    return { ...s, branches };
  });
  return changed ? out : steps;
}

/** Where a step is: its path's id, its index and the path's steps; null when it isn't in the flow */
export function flowPlaceOf(flow: FlowStep[], id: string, list = "root"): { list: string; index: number; steps: FlowStep[] } | null {
  const i = flow.findIndex((s) => s.id === id);
  if (i >= 0) return { list, index: i, steps: flow };
  for (const s of flow) for (const b of s.branches ?? []) {
    const hit = flowPlaceOf(b.steps, id, b.id);
    if (hit) return hit;
  }
  return null;
}
/** A step, or null */
export function flowStep(flow: FlowStep[], id: string): FlowStep | null {
  const at = flowPlaceOf(flow, id);
  return at ? at.steps[at.index] : null;
}
/** A path by its id ("root" or a branch id), or null */
function flowBranch(flow: FlowStep[], id: string): FlowBranch | null {
  for (const s of flow) for (const b of s.branches ?? []) {
    if (b.id === id) return b;
    const hit = flowBranch(b.steps, id);
    if (hit) return hit;
  }
  return null;
}
/** How many steps, counting every path's */
export function flowCount(flow: FlowStep[]): number {
  return flow.reduce((n, s) => n + 1 + (s.branches ?? []).reduce((m, b) => m + flowCount(b.steps), 0), 0);
}
export function flowInsert(flow: FlowStep[], at: FlowPlace, step: FlowStep) {
  return editList(flow, at.list, (steps) => [...steps.slice(0, at.index), step, ...steps.slice(at.index)]);
}
export function flowRemove(flow: FlowStep[], id: string) {
  const at = flowPlaceOf(flow, id);
  return at ? editList(flow, at.list, (steps) => steps.filter((s) => s.id !== id)) : flow;
}
/** Moves a step up (-1) or down (+1) within its own path; the same array at the ends */
export function flowMove(flow: FlowStep[], id: string, by: -1 | 1) {
  const at = flowPlaceOf(flow, id);
  if (!at) return flow;
  const to = at.index + by;
  if (to < 0 || to >= at.steps.length) return flow;
  return editList(flow, at.list, (steps) => {
    const next = [...steps];
    [next[at.index], next[to]] = [next[to], next[at.index]];
    return next;
  });
}
/** Renames a step or a branch */
export function flowRename(flow: FlowStep[], id: string, title: string): FlowStep[] {
  return flow.map((s) => {
    if (s.id === id) return { ...s, title };
    if (!s.branches) return s;
    return { ...s, branches: s.branches.map((b) => (b.id === id ? { ...b, label: title } : { ...b, steps: flowRename(b.steps, id, title) })) };
  });
}

const icon = (d: TemplateResult) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/* Lucide (ISC, lucide.dev) */
const icons = {
  head: svg`<path d="M12 3v6"></path><circle cx="12" cy="12" r="3"></circle><path d="M12 15v6"></path><path d="M5 21v-3a3 3 0 0 1 3-3h1"></path><path d="M19 21v-3a3 3 0 0 0-3-3h-1"></path>`,
  add: svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`,
  up: svg`<path d="m18 15-6-6-6 6"></path>`,
  down: svg`<path d="m6 9 6 6 6-6"></path>`,
  remove: svg`<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>`,
  undo: svg`<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path>`,
  redo: svg`<path d="m15 14 5-5-5-5"></path><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"></path>`,
  play: svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`,
  done: svg`<path d="M20 6 9 17l-5-5"></path>`,
  failed: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  running: svg`<circle cx="12" cy="12" r="4"></circle>`,
  skipped: svg`<path d="M5 12h14"></path>`,
};

let uidCount = 0;
let stepCount = 0;

/**
 * An automation built in place as a top-down flow – + on every line, If / else paths, undo, and a test run that lights
 * the working step.
 * @tag tc-flow-builder
 * @fires tc-flow-change - A step was added, removed, moved or renamed, or an edit undone or redone ({ flow, change, id }: FlowChange); cancelable – prevented, `flow` stays as it was
 * @fires tc-test-run - Test run was pressed; the page runs the flow and sets `statuses` as it goes ({ flow }: FlowTestRun)
 */
export class TcFlowBuilder extends TcElement {
  static override ui = "flb";

  /** The heading */
  @property() accessor heading = "Flow";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** What starts the flow, shown at the top */
  @property({ attribute: false }) accessor trigger: FlowTrigger = { title: "When this happens" };
  /** The steps, in order, with If / else paths inside. Changed by the user unless a tc-flow-change listener calls preventDefault() */
  @property({ attribute: false }) accessor flow: FlowStep[] = [];
  /** The steps the + menu offers */
  @property({ attribute: false }) accessor options: FlowStepOption[] = defaultFlowOptions;
  /** Labels and icons for kinds, merged over the defaults */
  @property({ attribute: false }) accessor kinds: Record<string, Partial<WorkflowKindInfo>> = {};
  /** Each step's state in a test run, by step id – a light runs into the one that's "running" */
  @property({ attribute: false }) accessor statuses: Record<string, FlowStepStatus> = {};
  /** The status words, merged over the defaults */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<FlowStepStatus, string>> = {};
  /** Leaves out the editing controls: no +, renaming, moving or removing */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;

  /** The edits to undo and redo */
  @state() private accessor history: { past: FlowStep[][]; future: FlowStep[][] } = { past: [], future: [] };
  /** The nav item that holds the tab stop */
  @state() private accessor active = "";
  /** The + whose menu is open */
  @state() private accessor menuAt: string | null = null;
  /** The step or branch being renamed */
  @state() private accessor renaming: string | null = null;
  /** A polite message for screen readers */
  @state() private accessor announce = "";

  private uid = `tc-flb-${++uidCount}`;
  /** The flow this element last set itself; any other new value is the page's and starts the history afresh */
  private own: FlowStep[] | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onOutside, true);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("flow") && this.flow !== this.own && (this.history.past.length || this.history.future.length)) this.history = { past: [], future: [] };
  }

  protected override updated(changed: PropertyValues) {
    if (changed.has("menuAt")) {
      if (this.menuAt) document.addEventListener("pointerdown", this.onOutside, true);
      else document.removeEventListener("pointerdown", this.onOutside, true);
    }
    if (changed.has("renaming") && this.renaming) {
      const input = this.querySelector<HTMLInputElement>(".ui-flb__rename");
      input?.focus();
      input?.select();
    }
  }

  private kind(kind: string) {
    return workflowKind(kind, { ...defaultFlowKinds, ...this.kinds });
  }
  private kindIcon(kind: string) {
    return workflowKindIcon(kind, { ...defaultFlowKinds, ...this.kinds });
  }
  private statusWord(s: FlowStepStatus) {
    return this.statusLabels[s] ?? defaultWorkflowStatusLabels[s];
  }
  private get running() {
    return Object.values(this.statuses).includes("running");
  }

  /* ---------- Nav items, in reading order ---------- */

  /** Keys of every focusable item: "add:<list>:<index>", "step:<id>", "branch:<id>" */
  private navKeys(steps = this.flow, list = "root"): string[] {
    const out: string[] = [];
    if (!this.readonly) out.push(`add:${list}:0`);
    steps.forEach((s, i) => {
      out.push(`step:${s.id}`);
      for (const b of s.branches ?? []) out.push(`branch:${b.id}`, ...this.navKeys(b.steps, b.id));
      if (!this.readonly) out.push(`add:${list}:${i + 1}`);
    });
    return out;
  }
  private get tabKey() {
    const keys = this.navKeys();
    return keys.includes(this.active) ? this.active : keys[0];
  }
  private focusKey(key: string) {
    this.active = key;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-nav="${CSS.escape(key)}"]`)?.focus());
  }
  private onNavKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const key = target.dataset.nav;
    if (!key || e.altKey) return;
    const keys = this.navKeys();
    const i = keys.indexOf(key);
    const to =
      e.key === "ArrowDown" ? Math.min(keys.length - 1, i + 1) : e.key === "ArrowUp" ? Math.max(0, i - 1) : e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.focusKey(keys[to]);
  }

  /* ---------- Edits ---------- */

  private commit(flow: FlowStep[], change: FlowChange["change"], id: string, words: string) {
    if (flow === this.flow) return false;
    if (!this.emit<FlowChange>("tc-flow-change", { flow, change, id }, { cancelable: true })) return false;
    if (change === "undo") this.history = { past: this.history.past.slice(0, -1), future: [...this.history.future, this.flow] };
    else if (change === "redo") this.history = { past: [...this.history.past, this.flow], future: this.history.future.slice(0, -1) };
    else this.history = { past: [...this.history.past, this.flow], future: [] };
    this.own = flow;
    this.flow = flow;
    this.announce = words;
    return true;
  }

  /** Inserts a step from an option at the + with key `at` */
  addStep(option: FlowStepOption, at: FlowPlace) {
    const id = `${option.id}-${++stepCount}`;
    const step: FlowStep = { id, kind: option.kind, title: option.label };
    if (option.branches?.length) step.branches = option.branches.map((label, i) => ({ id: `${id}-path-${i + 1}`, label, steps: [] }));
    const list = at.list === "root" ? this.flow : (flowBranch(this.flow, at.list)?.steps ?? []);
    const before = list[at.index - 1];
    const where = before ? `after ${before.title}` : at.list === "root" ? "after the trigger" : `at the start of ${flowBranch(this.flow, at.list)?.label ?? "the path"}`;
    this.menuAt = null;
    if (!this.commit(flowInsert(this.flow, at, step), "add", id, `Added ${option.label} ${where}`)) {
      this.focusKey(`add:${at.list}:${at.index}`);
      return;
    }
    this.focusKey(`step:${id}`);
  }
  private removeStep(step: FlowStep) {
    const at = flowPlaceOf(this.flow, step.id);
    if (!at) return;
    const inside = flowCount(step.branches?.flatMap((b) => b.steps) ?? []);
    const words = `Removed ${step.title}${inside ? ` and the ${inside} ${inside === 1 ? "step" : "steps"} in its paths` : ""}. Undo brings it back.`;
    if (this.commit(flowRemove(this.flow, step.id), "remove", step.id, words)) this.focusKey(`add:${at.list}:${at.index}`);
  }
  private move(step: FlowStep, by: -1 | 1) {
    const at = flowPlaceOf(this.flow, step.id);
    if (!at) return;
    const to = at.index + by;
    if (to < 0 || to >= at.steps.length) return;
    if (this.commit(flowMove(this.flow, step.id, by), "move", step.id, `Moved ${step.title} ${by < 0 ? "up" : "down"}, step ${to + 1} of ${at.steps.length}`))
      this.focusKey(`step:${step.id}`);
  }
  private rename(id: string, title: string, nav: string) {
    this.renaming = null;
    const next = title.trim();
    const was = flowStep(this.flow, id)?.title ?? flowBranch(this.flow, id)?.label;
    if (next && next !== was) this.commit(flowRename(this.flow, id, next), "rename", id, `Renamed to ${next}`);
    this.focusKey(nav);
  }
  undo() {
    const prev = this.history.past[this.history.past.length - 1];
    if (prev) this.commit(prev, "undo", "", "Undone");
  }
  redo() {
    const next = this.history.future[this.history.future.length - 1];
    if (next) this.commit(next, "redo", "", "Redone");
  }
  private onKeys(e: KeyboardEvent) {
    if ((e.target as HTMLElement).closest("input")) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.altKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) this.redo();
      else this.undo();
    } else if (mod && !e.altKey && e.key.toLowerCase() === "y") {
      e.preventDefault();
      this.redo();
    }
  }
  private onStepKey(e: KeyboardEvent, step: FlowStep) {
    if (this.readonly) return;
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      this.move(step, e.key === "ArrowUp" ? -1 : 1);
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      this.renaming = step.id;
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.removeStep(step);
    }
  }
  private testRun() {
    this.emit<FlowTestRun>("tc-test-run", { flow: this.flow });
  }

  /* ---------- The + menu ---------- */

  private onOutside = (e: Event) => {
    if (!this.menuAt) return;
    const wrap = this.querySelector(`[data-menu-wrap="${CSS.escape(this.menuAt)}"]`);
    if (wrap && e.composedPath().includes(wrap)) return;
    this.menuAt = null;
  };
  private openMenu(key: string) {
    this.active = key;
    this.menuAt = this.menuAt === key ? null : key;
    if (this.menuAt) void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-flb__menu-item")?.focus());
  }
  private closeMenu() {
    const key = this.menuAt;
    this.menuAt = null;
    if (key) this.focusKey(key);
  }
  private onMenuKey(e: KeyboardEvent) {
    const items = [...this.querySelectorAll<HTMLElement>(".ui-flb__menu-item")];
    const i = items.indexOf(e.target as HTMLElement);
    const to = e.key === "ArrowDown" ? (i + 1) % items.length : e.key === "ArrowUp" ? (i - 1 + items.length) % items.length : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : -1;
    if (to >= 0) {
      e.preventDefault();
      e.stopPropagation();
      items[to]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu();
    } else if (e.key === "Tab") this.menuAt = null;
  }

  /* ---------- Rendering ---------- */

  private renderLink(list: string, index: number, steps: FlowStep[], label: string) {
    const next = steps[index];
    const flow = next && this.statuses[next.id] === "running";
    const done = next && (this.statuses[next.id] === "done" || this.statuses[next.id] === "failed");
    if (this.readonly) return html`<div class="ui-flb__link" ?data-flow=${flow} ?data-done=${done} aria-hidden="true"></div>`;
    const key = `add:${list}:${index}`;
    const open = this.menuAt === key;
    const prev = steps[index - 1];
    const where = prev ? `after ${prev.title}` : `at the start of ${label}`;
    return html`<div class="ui-flb__link" ?data-flow=${flow} ?data-done=${done} data-menu-wrap=${key}>
      <button
        type="button"
        class="ui-flb__add"
        data-nav=${key}
        tabindex=${this.tabKey === key ? 0 : -1}
        aria-haspopup="menu"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${`${this.uid}-menu`}
        @click=${() => this.openMenu(key)}
        @focus=${() => (this.active = key)}
      >${icon(icons.add)}<span class="tc-sr-only">Add a step ${where}</span></button>
      ${open
        ? html`<div class="ui-flb__menu" id=${`${this.uid}-menu`} role="menu" aria-label=${`Add a step ${where}`} @keydown=${this.onMenuKey}>
            ${this.options.map(
              (o) => html`<button type="button" role="menuitem" tabindex="-1" class="ui-flb__menu-item" data-kind=${o.kind} @click=${() => this.addStep(o, { list, index })}>
                <span class="ui-flb__icon">${this.kindIcon(o.kind)}</span>
                <span class="ui-flb__menu-text"><span class="ui-flb__menu-label">${o.label}</span>${o.description ? html`<span class="ui-flb__menu-desc">${o.description}</span>` : nothing}</span>
              </button>`,
            )}
          </div>`
        : nothing}
    </div>`;
  }

  private renderTitle(id: string, title: string, nav: string) {
    if (this.renaming !== id) return title;
    return html`<input
      class="ui-flb__rename"
      aria-label=${`Rename ${title}`}
      .value=${live(title)}
      @keydown=${(e: KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          this.rename(id, (e.target as HTMLInputElement).value, nav);
        } else if (e.key === "Escape") {
          e.preventDefault();
          this.renaming = null;
          this.focusKey(nav);
        }
      }}
      @blur=${(e: FocusEvent) => this.renaming === id && this.rename(id, (e.target as HTMLInputElement).value, nav)}
      @click=${(e: Event) => e.stopPropagation()}
    />`;
  }

  private renderStep(step: FlowStep, index: number, steps: FlowStep[]) {
    const key = `step:${step.id}`;
    const info = this.kind(step.kind);
    const status = this.statuses[step.id];
    const renaming = this.renaming === step.id;
    return html`<div class="ui-flb__item">
      <div class="ui-flb__step" data-kind=${step.kind} data-status=${status ?? "none"}>
        <span class="ui-flb__icon">${this.kindIcon(step.kind)}</span>
        <div class="ui-flb__text">
          <span class="ui-flb__kind">${info.label}</span>
          ${renaming
            ? this.renderTitle(step.id, step.title, key)
            : html`<button
                type="button"
                class="ui-flb__title"
                data-nav=${key}
                tabindex=${this.tabKey === key ? 0 : -1}
                aria-describedby=${`${this.uid}-keys`}
                @focus=${() => (this.active = key)}
                @click=${() => !this.readonly && (this.renaming = step.id)}
                @keydown=${(e: KeyboardEvent) => this.onStepKey(e, step)}
              ><span class="tc-sr-only">${info.label}: </span>${step.title}${status ? html`<span class="tc-sr-only">, ${this.statusWord(status)}</span>` : nothing}</button>`}
          ${step.detail ? html`<span class="ui-flb__detail">${step.detail}</span>` : nothing}
        </div>
        ${status
          ? html`<span class="ui-flb__status" data-status=${status} aria-hidden="true">${icon(icons[status === "idle" ? "skipped" : status])}${this.statusWord(status)}</span>`
          : nothing}
        ${this.readonly
          ? nothing
          : html`<span class="ui-flb__actions">
              <button type="button" tabindex="-1" class="ui-flb__act" aria-label=${`Move ${step.title} up`} ?disabled=${index === 0} @click=${() => this.move(step, -1)}>${icon(icons.up)}</button>
              <button type="button" tabindex="-1" class="ui-flb__act" aria-label=${`Move ${step.title} down`} ?disabled=${index === steps.length - 1} @click=${() => this.move(step, 1)}>${icon(icons.down)}</button>
              <button type="button" tabindex="-1" class="ui-flb__act" data-act="remove" aria-label=${`Remove ${step.title}`} @click=${() => this.removeStep(step)}>${icon(icons.remove)}</button>
            </span>`}
      </div>
      ${step.branches?.length
        ? html`<div class="ui-flb__stem" aria-hidden="true"></div>
            <div class="ui-flb__branches" role="group" aria-label=${`Paths of ${step.title}`}>
              ${repeat(
                step.branches,
                (b) => b.id,
                (b) => html`<div class="ui-flb__branch">
                  <div class="ui-flb__stem" aria-hidden="true"></div>
                  ${this.renaming === b.id
                    ? html`<span class="ui-flb__path">${this.renderTitle(b.id, b.label, `branch:${b.id}`)}</span>`
                    : html`<button
                        type="button"
                        class="ui-flb__path"
                        data-nav=${`branch:${b.id}`}
                        tabindex=${this.tabKey === `branch:${b.id}` ? 0 : -1}
                        @focus=${() => (this.active = `branch:${b.id}`)}
                        @click=${() => !this.readonly && (this.renaming = b.id)}
                        @keydown=${(e: KeyboardEvent) => {
                          if (!this.readonly && (e.key === "Enter" || e.key === "F2")) {
                            e.preventDefault();
                            this.renaming = b.id;
                          }
                        }}
                      ><span class="tc-sr-only">Path: </span>${b.label}</button>`}
                  ${this.renderList(b.steps, b.id, b.label)}
                  <div class="ui-flb__fill" aria-hidden="true"></div>
                </div>`,
              )}
            </div>`
        : nothing}
    </div>`;
  }

  private renderList(steps: FlowStep[], list: string, label: string): TemplateResult {
    return html`<div class="ui-flb__list" data-list=${list}>
      ${this.renderLink(list, 0, steps, label)}
      ${repeat(
        steps,
        (s) => s.id,
        (s, i) => html`${this.renderStep(s, i, steps)}${this.renderLink(list, i + 1, steps, label)}`,
      )}
      ${list !== "root" && !steps.length ? html`<span class="ui-flb__none">No steps</span>` : nothing}
    </div>`;
  }

  protected override render() {
    const count = flowCount(this.flow);
    const triggerKind = this.trigger.kind ?? "trigger";
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <span class="tc-sr-only" id=${`${this.uid}-keys`}
        >Up and down arrows move between steps and add buttons. Enter or F2 renames a step, Alt with an arrow moves it, Delete removes it. Control or Command Z undoes.</span
      >
      ${cardHead({
        icon: icons.head,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: html`<span class="ui-flb__tools">
          <span class="ui-flb__count">${count} ${count === 1 ? "step" : "steps"}</span>
          ${this.readonly
            ? nothing
            : html`<button type="button" class="ui-flb__tool" data-tool="undo" ?disabled=${!this.history.past.length} @click=${() => this.undo()}>${icon(icons.undo)}<span class="tc-sr-only">Undo</span></button>
                <button type="button" class="ui-flb__tool" data-tool="redo" ?disabled=${!this.history.future.length} @click=${() => this.redo()}>${icon(icons.redo)}<span class="tc-sr-only">Redo</span></button>`}
          <button type="button" class="tc-btn-sm ui-flb__test" ?disabled=${this.running} @click=${() => this.testRun()}>${icon(icons.play)}${this.running ? "Running…" : "Test run"}</button>
        </span>`,
      })}
      <div class="ui-flb__card" @keydown=${this.onKeys}>
        <div class="ui-flb__canvas" role="group" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onNavKey}>
          <div class="ui-flb__step" data-kind=${triggerKind} data-trigger>
            <span class="ui-flb__icon">${this.kindIcon(triggerKind)}</span>
            <div class="ui-flb__text">
              <span class="ui-flb__kind">${this.kind(triggerKind).label}</span>
              <span class="ui-flb__title" data-static>${this.trigger.title}</span>
              ${this.trigger.detail ? html`<span class="ui-flb__detail">${this.trigger.detail}</span>` : nothing}
            </div>
          </div>
          ${this.renderList(this.flow, "root", "the flow")}
          <div class="ui-flb__end" aria-hidden="true">End</div>
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="flb"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="flb"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* Each kind's colour on its icon, the line's weight, a step card's width – override on the element */
[data-ui="flb"] {
  --tc-flb-trigger: var(--tc-tone-amber-solid);
  --tc-flb-llm: var(--tc-tone-violet-solid);
  --tc-flb-tool: var(--tc-chart-1);
  --tc-flb-condition: var(--tc-tone-teal-solid);
  --tc-flb-approval: var(--tc-tone-pink-solid);
  --tc-flb-output: var(--tc-status-success-solid);
  --tc-flb-wait: var(--tc-chart-2);
  --tc-flb-line: 1.5px;
  --tc-flb-step-w: 260px;
  --tc-flb-link-h: 36px;
  --tc-flb-add: 22px;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="flb"] { --tc-flb-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="flb"] { --tc-flb-bg: var(--tc-surface-raised); }
[data-ui="flb"] *, [data-ui="flb"] *::before, [data-ui="flb"] *::after { box-sizing: border-box; }
:where([data-ui="flb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="flb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="flb"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-flb__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-flb__card { position: relative; }
.ui-flb__tools { display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1); }
.ui-flb__count { margin-right: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-flb__tool { display: inline-grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); }
.ui-flb__tool svg, .ui-flb__test svg { width: 16px; height: 16px; }
.ui-flb__test svg { width: 12px; height: 12px; }
.ui-flb__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-flb__tool:disabled { cursor: default; color: var(--tc-text-disabled); }
/* ----- The flow ----- */
.ui-flb__canvas { display: flex; flex-direction: column; align-items: center; padding: var(--tc-space-6) var(--tc-space-4) var(--tc-space-5); overflow-x: auto; background-image: radial-gradient(circle, var(--tc-border-subtle) 1px, transparent 1px); background-size: var(--tc-space-5) var(--tc-space-5); border-radius: inherit; }
.ui-flb__list, .ui-flb__item { display: flex; flex-direction: column; align-items: center; width: 100%; }
.ui-flb__step { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; column-gap: var(--tc-space-2-5); width: min(100%, var(--tc-flb-step-w)); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-raised); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-flb__step:hover, .ui-flb__step:focus-within { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong), var(--tc-shadow-raised-hover); }
.ui-flb__step[data-status="running"] { box-shadow: inset 0 0 0 2px var(--tc-accent), var(--tc-shadow-raised-hover); }
.ui-flb__step[data-status="failed"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-danger-solid), var(--tc-shadow-raised); }
.ui-flb__step[data-status="skipped"] { background: var(--tc-surface-sunken); }
.ui-flb__icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-flb-kind, var(--tc-icon-muted)); }
.ui-flb__icon svg { width: 16px; height: 16px; }
[data-ui="flb"] [data-kind="trigger"] { --tc-flb-kind: var(--tc-flb-trigger); }
[data-ui="flb"] [data-kind="llm"] { --tc-flb-kind: var(--tc-flb-llm); }
[data-ui="flb"] [data-kind="tool"] { --tc-flb-kind: var(--tc-flb-tool); }
[data-ui="flb"] [data-kind="condition"] { --tc-flb-kind: var(--tc-flb-condition); }
[data-ui="flb"] [data-kind="approval"] { --tc-flb-kind: var(--tc-flb-approval); }
[data-ui="flb"] [data-kind="output"] { --tc-flb-kind: var(--tc-flb-output); }
[data-ui="flb"] [data-kind="wait"] { --tc-flb-kind: var(--tc-flb-wait); }
.ui-flb__text { display: grid; min-width: 0; }
.ui-flb__kind { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-flb__title { overflow: hidden; border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
button.ui-flb__title { cursor: text; }
.ui-flb__title[data-static] { min-height: 0; }
.ui-flb__detail { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-flb__rename { width: 100%; min-width: 0; height: var(--tc-field-h-sm); margin: 0; padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-flb__rename:focus { outline: none; }
.ui-flb__status { display: inline-flex; grid-column: 2 / 4; align-items: center; gap: var(--tc-space-1); margin-top: var(--tc-space-1); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-flb__status svg { width: 12px; height: 12px; }
.ui-flb__status[data-status="running"] { color: var(--tc-status-info-fg); }
.ui-flb__status[data-status="running"] svg { animation: ui-flb-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-flb__status[data-status="done"] { color: var(--tc-status-success-fg); }
.ui-flb__status[data-status="failed"] { color: var(--tc-status-danger-fg); }
@keyframes ui-flb-pulse { 50% { opacity: 0.35; } }
.ui-flb__actions { display: inline-flex; grid-row: 1; grid-column: 3; gap: var(--tc-space-0-5); opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-flb__step:hover .ui-flb__actions, .ui-flb__step:focus-within .ui-flb__actions { opacity: 1; }
.ui-flb__act { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-text-secondary); }
.ui-flb__act svg { width: 14px; height: 14px; }
.ui-flb__act:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-flb__act[data-act="remove"]:hover { color: var(--tc-status-danger-fg); }
.ui-flb__act:disabled { cursor: default; color: var(--tc-text-disabled); }
/* ----- Lines, + buttons and the light ----- */
.ui-flb__link, .ui-flb__stem, .ui-flb__fill { position: relative; display: grid; place-items: center; width: 100%; }
.ui-flb__link { height: var(--tc-flb-link-h); }
.ui-flb__stem { height: var(--tc-space-3); }
.ui-flb__fill { flex: 1; min-height: var(--tc-space-3); }
.ui-flb__link::before, .ui-flb__stem::before, .ui-flb__fill::before { content: ""; position: absolute; inset-block: 0; left: 50%; width: var(--tc-flb-line); translate: -50% 0; background: var(--tc-border-strong); }
.ui-flb__link[data-done]::before { background: var(--tc-text-muted); }
.ui-flb__link[data-flow]::before { background: var(--tc-accent); }
.ui-flb__link[data-flow]::after { content: ""; position: absolute; top: 0; left: 50%; width: 6px; height: 6px; translate: -50% -50%; border-radius: var(--tc-radius-full); background: var(--tc-accent); box-shadow: 0 0 0 3px var(--tc-accent-subtle); animation: ui-flb-light var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
@keyframes ui-flb-light { from { top: 0; opacity: 0; } 20% { opacity: 1; } to { top: 100%; opacity: 0; } }
.ui-flb__add { position: relative; display: grid; place-items: center; width: var(--tc-flb-add); height: var(--tc-flb-add); border-radius: var(--tc-radius-full); background: var(--tc-flb-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-flb__add::after { content: ""; position: absolute; inset: calc(var(--tc-space-1) * -1); }
.ui-flb__add svg { width: 12px; height: 12px; }
.ui-flb__add:hover, .ui-flb__add[aria-expanded="true"] { background: var(--tc-accent-solid); box-shadow: none; color: var(--tc-text-on-accent); transform: scale(1.1); }
.ui-flb__menu { position: absolute; z-index: var(--tc-z-dropdown); top: calc(50% + var(--tc-flb-add) / 2 + var(--tc-space-1)); left: 50%; translate: -50% 0; display: grid; gap: var(--tc-space-0-5); width: max-content; min-width: 220px; max-width: min(300px, 90cqi); padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); }
.ui-flb__menu-item { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-menu-item-h); padding: var(--tc-space-1-5) var(--tc-menu-item-px) !important; border-radius: var(--tc-menu-item-radius); color: var(--tc-text-primary); }
.ui-flb__menu-item:hover, .ui-flb__menu-item:focus-visible { background: var(--tc-menu-item-hover); outline: none; }
.ui-flb__menu-item .ui-flb__icon { width: 24px; height: 24px; }
.ui-flb__menu-text { display: grid; min-width: 0; }
.ui-flb__menu-label { font-size: var(--tc-menu-item-font-size); }
.ui-flb__menu-desc { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* ----- If / else paths ----- */
.ui-flb__branches { display: flex; align-items: stretch; justify-content: center; width: 100%; }
.ui-flb__branch { position: relative; display: flex; flex: 1 1 0; flex-direction: column; align-items: center; min-width: 200px; padding: 0 var(--tc-space-2); }
.ui-flb__branch::before, .ui-flb__branch::after { content: ""; position: absolute; left: 0; right: 0; height: var(--tc-flb-line); background: var(--tc-border-strong); }
.ui-flb__branch::before { top: 0; }
.ui-flb__branch::after { bottom: 0; }
.ui-flb__branch:first-child::before, .ui-flb__branch:first-child::after { left: 50%; }
.ui-flb__branch:last-child::before, .ui-flb__branch:last-child::after { right: 50%; }
.ui-flb__branch:only-child::before, .ui-flb__branch:only-child::after { display: none; }
.ui-flb__path { display: inline-flex; align-items: center; max-width: 100%; min-height: var(--tc-pill-h); padding: 0 var(--tc-pill-px) !important; border-radius: var(--tc-pill-radius); background: var(--tc-flb-bg) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
span.ui-flb__path { padding: var(--tc-space-0-5) !important; box-shadow: none; }
button.ui-flb__path { cursor: text; }
.ui-flb__none { position: relative; padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-flb-bg); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-flb__end { padding: var(--tc-space-0-5) var(--tc-space-2-5); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
@container (max-width: 520px) {
  .ui-flb__canvas { padding-inline: var(--tc-space-3); }
  .ui-flb__branches { flex-direction: column; gap: var(--tc-space-3); }
  .ui-flb__branch { min-width: 0; padding: 0 0 var(--tc-space-2) var(--tc-space-3); border-left: var(--tc-flb-line) solid var(--tc-border-strong); }
  .ui-flb__branch::before, .ui-flb__branch::after { display: none; }
  .ui-flb__actions { opacity: 1; }
}
@media (hover: none) { .ui-flb__actions { opacity: 1; } }
@media (forced-colors: active) {
  .ui-flb__step { border: 1px solid CanvasText; }
  .ui-flb__step[data-status="running"] { border: 2px solid Highlight; }
  .ui-flb__link::before, .ui-flb__stem::before, .ui-flb__fill::before, .ui-flb__branch::before, .ui-flb__branch::after { background: CanvasText; }
  .ui-flb__link[data-flow]::before, .ui-flb__link[data-flow]::after { background: Highlight; }
  .ui-flb__add, .ui-flb__path { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="flb"] *, [data-ui="flb"] *::before, [data-ui="flb"] *::after { animation: none !important; transition: none !important; }
  .ui-flb__link[data-flow]::after { display: none; }
  .ui-flb__link[data-flow]::before { width: 3px; }
}
`;
}

if (!customElements.get("tc-flow-builder")) customElements.define("tc-flow-builder", TcFlowBuilder);

declare global {
  interface HTMLElementTagNameMap {
    "tc-flow-builder": TcFlowBuilder;
  }
}
