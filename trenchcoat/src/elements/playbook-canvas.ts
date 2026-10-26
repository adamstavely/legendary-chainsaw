import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, ToolbarController } from "./internal/controllers";
import { GATE_ACTIONS, GATE_CONDITIONS, GATE_REVIEWERS, GATE_VIEWS } from "./gate-config";
import type { GateActionOption, GateCondition, GateConfigValue, GateReviewer, GateValueChange, GateView } from "./gate-config";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-playbook-canvas> – an agent workflow, phase by phase (decision N: an editor of phases and steps, not a free-form
 * canvas). The phases are data – by default trigger, intake, context, analysis and review – and each holds the steps
 * the agent runs in order:
 *   · add a step to a phase, remove it, and reorder it – by dragging, or with Alt and the arrow keys
 *   · pick a step to set it up below the board: its title, its type, instructions for the agent and what happens if it
 *     fails; a review step pauses the run for a person and embeds <tc-gate-config> to say when, who and how
 *   · versions: a list with the current one marked; "Open" asks the app for another
 *   · a dry run: the element fires tc-dry-run with the playbook, the app answers by setting `dryRun` – which steps
 *     would run, which are skipped and where a gate pauses – and the board marks each step until the playbook changes
 * Standard is a white card on a gray tray with the keyboard hints in the tray; Clean is one white card.
 *
 *   <tc-playbook-canvas heading="Refund requests" .value=${{ steps }} .versions=${versions} current-version="v7"></tc-playbook-canvas>
 *
 * The value is the playbook: every add, remove, move and edit fires a cancelable `tc-value-change` ({ value }); the
 * picked step is `selected`, with a cancelable `tc-selected-change`. The phases are columns once the board is wide
 * enough, one under the other when it isn't; the connectors between steps are drawn in CSS.
 */

export type PlaybookPhase = {
  id: string;
  /** "Analysis" */
  label: string;
  /** A quieter line under the label: what happens in this phase */
  description?: string;
  /** The step type "Add step" adds here; defaults to the first type allowed in the phase */
  defaultType?: string;
};
export type PlaybookStepType = {
  id: string;
  /** "Agent task" */
  label: string;
  /** The phases it can go in; unset: any */
  phases?: string[];
  /** A review step: it pauses the run for a person and is set up with a gate */
  review?: boolean;
  /** A 16px icon (cloned); the built-in types have their own */
  icon?: Element;
};
/** What happens when a step fails */
export type PlaybookFailure = "stop" | "skip" | "retry";
export type PlaybookStep = {
  id: string;
  /** The phase it's in */
  phase: string;
  /** Its step type's id */
  type: string;
  title: string;
  /** Instructions for the agent, or what the step does */
  notes?: string;
  /** What happens when it fails – not used by review steps; "stop" when unset */
  onFail?: PlaybookFailure;
  /** A review step's gate */
  gate?: GateConfigValue;
};
export type Playbook = { steps: PlaybookStep[] };
export type PlaybookVersion = {
  id: string;
  /** "v7" */
  label: string;
  /** A quieter line, e.g. "Oct 24 · Maya Chen" */
  meta?: string;
  /** What changed in it */
  note?: string;
};
export type PlaybookDryRunOutcome = "run" | "skip" | "pause";
export type PlaybookDryRun = {
  /** One entry per step the dry run reached; steps it didn't reach are shown as not reached */
  steps: { id: string; outcome: PlaybookDryRunOutcome; /** Why, e.g. "Confidence 0.62 is under 0.7" */ note?: string }[];
  /** One line over the board; unset: counted from the steps */
  summary?: string;
};
export type PlaybookValueChange = { value: Playbook };
export type PlaybookSelectedChange = { selected: string | null; step?: PlaybookStep };
export type PlaybookDryRunRequest = { value: Playbook };
export type PlaybookVersionOpen = { id: string };

export const PLAYBOOK_PHASES: PlaybookPhase[] = [
  { id: "trigger", label: "Trigger", description: "What starts a run", defaultType: "event" },
  { id: "intake", label: "Intake", description: "What comes in, and how it's checked", defaultType: "tool" },
  { id: "context", label: "Context", description: "What the agent looks up first", defaultType: "retrieve" },
  { id: "analysis", label: "Analysis", description: "What the agent works out", defaultType: "agent" },
  { id: "review", label: "Review", description: "Who signs off before anything leaves", defaultType: "review" },
];
export const PLAYBOOK_STEP_TYPES: PlaybookStepType[] = [
  { id: "event", label: "When an event happens", phases: ["trigger"] },
  { id: "schedule", label: "On a schedule", phases: ["trigger"] },
  { id: "manual", label: "Started by hand", phases: ["trigger"] },
  { id: "agent", label: "Agent task" },
  { id: "tool", label: "Tool call" },
  { id: "retrieve", label: "Look up sources" },
  { id: "review", label: "Human review", review: true },
];
const FAILURES: { value: PlaybookFailure; label: string; text: string }[] = [
  { value: "stop", label: "Stop", text: "The run stops and says why" },
  { value: "skip", label: "Skip", text: "The run carries on without this step" },
  { value: "retry", label: "Retry once", text: "The step runs once more, then the run stops" },
];
const NEW_GATE: GateConfigValue = { triggers: ["low-confidence"], reviewer: "lead", view: "evidence", actions: ["approve", "send-back", "reject"], reason: "" };

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ---------- Icons ---------- */

const icon16 = (d: string, cls = "") => html`<svg class=${ifDefined(cls || undefined)} viewBox="0 0 16 16" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const BUILT_IN: Record<string, string> = {
  event: "M8.9 1.75 3.5 9h4l-.4 5.25L12.5 7h-4l.4-5.25Z",
  schedule: "M8 2.25a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5ZM8 4.75V8l2.25 1.5",
  manual: "M5.25 3.25v9.5L12.5 8Z",
  agent: "M8 2.25 9.4 6.6 13.75 8 9.4 9.4 8 13.75 6.6 9.4 2.25 8 6.6 6.6Z",
  tool: "M10.5 2.4a3.1 3.1 0 0 0-2.9 4.2L2.75 11.45l1.8 1.8L9.4 8.4a3.1 3.1 0 0 0 4.2-2.9l-1.85 1.85-1.75-.35-.35-1.75Z",
  retrieve: "M7 2.75a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5ZM10.1 10.1l3.4 3.4",
  review: "M5.5 3.25v9.5M10.5 3.25v9.5",
};
const DOT = "M8 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z";
const plusIcon = icon16("M8 3.5v9M3.5 8h9");
const upIcon = icon16("M8 12.5v-9M4.5 7 8 3.5 11.5 7");
const downIcon = icon16("M8 3.5v9M4.5 9 8 12.5 11.5 9");
const removeIcon = icon16("M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.5 8.25h5L11 4.5");
const chevronDown = icon16("M4.5 6.25 8 9.75l3.5-3.5", "ui-pb__chevron");
const playIcon = icon16("M5.25 3.25v9.5L12.5 8Z");
const historyIcon = icon16("M2.75 8a5.25 5.25 0 1 0 1.6-3.8M2.75 2.75v2.5h2.5M8 5.25V8l2 1.25");
const OUTCOME: Record<PlaybookDryRunOutcome | "none", { label: string; d: string }> = {
  run: { label: "Runs", d: "M4.2 8.4 6.8 11l5-5.6" },
  skip: { label: "Skipped", d: "M4.5 8h7" },
  pause: { label: "Pauses", d: "M6 4.5v7M10 4.5v7" },
  none: { label: "Not reached", d: "M4.5 8h.01M8 8h.01M11.5 8h.01" },
};
const grip = html`<svg viewBox="0 0 12 12" aria-hidden="true">${[3, 6, 9].map((y) => [4.3, 7.7].map((x) => svg`<circle cx=${x} cy=${y} r="0.95"></circle>`))}</svg>`;

let instances = 0;
let stepCount = 0;

type Drag = { id: string; pointer: number; x: number; y: number; on: boolean };
type Drop = { phase: string; index: number };

/**
 * An agent workflow by phase: steps you add, remove, reorder and set up, review gates, versions and a dry run.
 * @tag tc-playbook-canvas
 * @fires tc-value-change - The playbook changed: a step added, removed, moved or edited ({ value: Playbook }); cancelable – prevent it to control `value`
 * @fires tc-selected-change - A step was picked, or the pick cleared ({ selected: string | null, step?: PlaybookStep }); cancelable
 * @fires tc-dry-run - "Dry run" was pressed ({ value: Playbook }) – answer by setting `dryRun`
 * @fires tc-dry-run-clear - The dry run's result was cleared ({})
 * @fires tc-version-open - "Open" was pressed on a version that isn't current ({ id: string })
 */
export class TcPlaybookCanvas extends TcElement {
  static override ui = "pb";

  /** The playbook: its steps, in order within each phase. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: Playbook = { steps: [] };
  /** The phases, in order – the board's columns */
  @property({ attribute: false }) accessor phases: PlaybookPhase[] = PLAYBOOK_PHASES;
  /** The kinds of step people can add */
  @property({ attribute: false }) accessor stepTypes: PlaybookStepType[] = PLAYBOOK_STEP_TYPES;
  /** The id of the step being set up. Picks apply unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** Names the playbook, shown at the top */
  @property() accessor heading = "Playbook";
  /** The saved versions, newest first */
  @property({ attribute: false }) accessor versions: PlaybookVersion[] = [];
  /** The id of the version the board shows */
  @property({ attribute: "current-version" }) accessor currentVersion = "";
  /** The app's answer to the last tc-dry-run: which steps run, are skipped or pause; null clears it */
  @property({ attribute: false }) accessor dryRun: PlaybookDryRun | null = null;
  /** Conditions offered by review steps' gates; unset: the gate's defaults */
  @property({ attribute: false }) accessor gateConditions: GateCondition[] | undefined = undefined;
  /** Reviewers offered by review steps' gates; unset: the gate's defaults */
  @property({ attribute: false }) accessor gateReviewers: GateReviewer[] | undefined = undefined;
  /** What a reviewer can see, offered by review steps' gates; unset: the gate's defaults */
  @property({ attribute: false }) accessor gateViews: GateView[] | undefined = undefined;
  /** Actions offered by review steps' gates; unset: the gate's defaults */
  @property({ attribute: false }) accessor gateActions: GateActionOption[] | undefined = undefined;

  /** @internal The versions list is open */
  @state() accessor versionsOpen = false;
  /** @internal A dry run was asked for and the app hasn't answered */
  @state() accessor dryPending = false;
  /** @internal The step that holds the keyboard focus */
  @state() accessor cursor: string | null = null;
  /** @internal */
  @state() accessor message = "";
  /** @internal Where a dragged step would land */
  @state() accessor drop: Drop | null = null;
  /** @internal The id of the step being dragged */
  @state() accessor dragging: string | null = null;

  private readonly uid = `tc-pb${++instances}`;
  /** The value the dry run answered for – a later value makes it out of date */
  private dryFor: Playbook | null = null;
  /** The value when the current version was loaded – a later value is an edit */
  private loaded: Playbook | null = null;
  private drag: Drag | null = null;
  private dragged = false;
  private focusNext: string | null = null;
  /** The step settings' Move earlier / Move later / Remove: one tab stop, arrow keys between them */
  private readonly toolbar = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-pb__tool")] });

  constructor() {
    super();
    // A removed step takes focus with it: it moves to the step the keyboard is on now, else the first Add step
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-pb__step[tabindex="0"]') ?? this.querySelector<HTMLElement>(".ui-pb__add"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.drag = null;
  }

  /* ---------- The playbook ---------- */

  /** @internal Steps by phase, in order; steps of unknown phases are kept but not shown */
  private get byPhase() {
    const map = new Map<string, PlaybookStep[]>(this.phases.map((p) => [p.id, []]));
    for (const s of this.value.steps) map.get(s.phase)?.push(s);
    return map;
  }
  /** @internal Every shown step, in phase order */
  private get ordered() {
    return [...this.byPhase.values()].flat();
  }
  /** @internal */
  private typeOf(step: PlaybookStep) {
    return this.stepTypes.find((t) => t.id === step.type);
  }
  /** @internal */
  private allowed(typeId: string, phase: string) {
    const t = this.stepTypes.find((x) => x.id === typeId);
    return !t?.phases || t.phases.includes(phase);
  }
  /** @internal */
  private phaseLabel(id: string) {
    return this.phases.find((p) => p.id === id)?.label ?? id;
  }
  /** @internal The playbook with one step moved to `phase` at `index` (counted without it) */
  private placed(id: string, phase: string, index: number): PlaybookStep[] | null {
    const moving = this.value.steps.find((s) => s.id === id);
    if (!moving) return null;
    const rest = this.value.steps.filter((s) => s.id !== id);
    const map = new Map<string, PlaybookStep[]>(this.phases.map((p) => [p.id, []]));
    const other: PlaybookStep[] = [];
    for (const s of rest) (map.get(s.phase) ?? other).push(s);
    const list = map.get(phase);
    if (!list) return null;
    list.splice(clamp(index, 0, list.length), 0, moving.phase === phase ? moving : { ...moving, phase });
    return [...[...map.values()].flat(), ...other];
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  private commit(steps: PlaybookStep[], message?: string) {
    const next: Playbook = { ...this.value, steps };
    if (!this.emit<PlaybookValueChange>("tc-value-change", { value: next }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.value = next;
    if (message) this.announce(message);
    return true;
  }

  private pick(id: string | null) {
    if (id === this.selected) return true;
    const step = id === null ? undefined : this.value.steps.find((s) => s.id === id);
    if (!this.emit<PlaybookSelectedChange>("tc-selected-change", { selected: id, step }, { cancelable: true })) return false;
    this.selected = id;
    return true;
  }

  private patchStep(id: string, patch: Partial<PlaybookStep>) {
    this.commit(this.value.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  private addStep(phase: PlaybookPhase) {
    const type = this.stepTypes.find((t) => t.id === phase.defaultType && this.allowed(t.id, phase.id)) ?? this.stepTypes.find((t) => this.allowed(t.id, phase.id));
    if (!type) return;
    const step: PlaybookStep = { id: `${this.uid}-new-${++stepCount}`, phase: phase.id, type: type.id, title: type.label, ...(type.review ? { gate: NEW_GATE } : {}) };
    const at = (this.byPhase.get(phase.id) ?? []).length;
    // Appended to its phase
    if (!this.commit([...this.value.steps, step], `Added ${type.label} to ${phase.label}, step ${at + 1} of ${at + 1}`)) return;
    this.cursor = step.id;
    this.pick(step.id);
    this.focusNext = "title";
  }

  private removeStep(id: string) {
    const order = this.ordered;
    const i = order.findIndex((s) => s.id === id);
    const step = order[i];
    if (!step) return;
    const next = order[i + 1] ?? order[i - 1];
    const hadFocus = this.contains(document.activeElement) && (document.activeElement as HTMLElement).closest?.(".ui-pb__step, .ui-pb__panel");
    if (!this.commit(
      this.value.steps.filter((s) => s.id !== id),
      `Removed ${step.title}`,
    ))
      return;
    if (this.selected === id) this.pick(next?.id ?? null);
    this.cursor = next?.id ?? null;
    if (hadFocus) this.focusNext = next ? `step:${next.id}` : `add:${step.phase}`;
  }

  /** @internal Whether a step can move earlier (−1) or later (+1): within its phase, or into a phase its type allows */
  private canMove(step: PlaybookStep, dir: -1 | 1) {
    const list = this.byPhase.get(step.phase) ?? [];
    const i = list.findIndex((s) => s.id === step.id);
    if (i + dir >= 0 && i + dir < list.length) return true;
    const pi = this.phases.findIndex((p) => p.id === step.phase);
    for (let k = pi + dir; k >= 0 && k < this.phases.length; k += dir) if (this.allowed(step.type, this.phases[k].id)) return true;
    return false;
  }

  /** Moves a step by the keyboard or the panel's buttons: `dir` −1 / +1 within the order, across phase boundaries; `jump` moves to the previous or next phase */
  private moveStep(id: string, dir: -1 | 1, jump = false) {
    const step = this.value.steps.find((s) => s.id === id);
    if (!step) return;
    const map = this.byPhase;
    const list = map.get(step.phase) ?? [];
    const i = list.findIndex((s) => s.id === id);
    const pi = this.phases.findIndex((p) => p.id === step.phase);
    let phase = step.phase;
    let index = i + dir;
    if (jump || index < 0 || index >= list.length) {
      // The nearest phase in that direction the step's type is allowed in
      let target = -1;
      for (let k = pi + dir; k >= 0 && k < this.phases.length; k += dir)
        if (this.allowed(step.type, this.phases[k].id)) {
          target = k;
          break;
        }
      if (target < 0) {
        const t = this.typeOf(step);
        this.announce(t?.phases ? `Can't move ${step.title} – ${t.label} steps only go in ${t.phases.map((p) => this.phaseLabel(p)).join(" or ")}` : `${step.title} is already ${dir < 0 ? "first" : "last"}`);
        return;
      }
      phase = this.phases[target].id;
      const len = (map.get(phase) ?? []).length;
      index = jump ? Math.min(i, len) : dir < 0 ? len : 0;
    }
    this.place(id, phase, index);
  }

  private place(id: string, phase: string, index: number) {
    const steps = this.placed(id, phase, index);
    const step = this.value.steps.find((s) => s.id === id);
    if (!steps || !step) return;
    const at = steps.filter((s) => s.phase === phase).findIndex((s) => s.id === id);
    const same = this.value.steps.filter((s) => s.phase === phase).findIndex((s) => s.id === id) === at && step.phase === phase;
    if (same) return;
    const total = steps.filter((s) => s.phase === phase).length;
    const focused = this.querySelector(`.ui-pb__step[data-id="${CSS.escape(id)}"]`) === document.activeElement;
    if (!this.commit(steps, `Moved ${step.title} to ${this.phaseLabel(phase)}, step ${at + 1} of ${total}`)) return;
    if (focused) this.focusNext = `step:${id}`;
  }

  private requestDryRun() {
    this.dryPending = true;
    this.emit<PlaybookDryRunRequest>("tc-dry-run", { value: this.value });
  }
  private clearDryRun() {
    this.dryRun = null;
    this.emit("tc-dry-run-clear", {});
    this.announce("Dry run cleared");
  }

  /* ---------- Keyboard ---------- */

  private onStepKey(e: KeyboardEvent, step: PlaybookStep) {
    if (e.isComposing) return;
    const order = this.ordered;
    const i = order.findIndex((s) => s.id === step.id);
    const go = (target: PlaybookStep | undefined) => {
      if (!target) return;
      e.preventDefault();
      this.cursor = target.id;
      this.pick(target.id);
      this.focusNext = `step:${target.id}`;
      this.requestUpdate();
    };
    if (e.altKey && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "ArrowUp") this.moveStep(step.id, -1);
      else if (e.key === "ArrowDown") this.moveStep(step.id, 1);
      else this.moveStep(step.id, e.key === "ArrowLeft" ? -1 : 1, true);
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case "ArrowDown":
        return go(order[i + 1]);
      case "ArrowUp":
        return go(order[i - 1]);
      case "Home":
        return go(order[0]);
      case "End":
        return go(order[order.length - 1]);
      case "ArrowRight":
      case "ArrowLeft": {
        // The first step of the next (or previous) phase that has any
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const map = this.byPhase;
        const pi = this.phases.findIndex((p) => p.id === step.phase);
        for (let k = pi + dir; k >= 0 && k < this.phases.length; k += dir) {
          const list = map.get(this.phases[k].id) ?? [];
          if (list.length) return go(list[0]);
        }
        e.preventDefault();
        return;
      }
      case "Enter":
      case " ":
        e.preventDefault();
        if (this.pick(step.id)) {
          this.cursor = step.id;
          if (e.key === "Enter") this.focusNext = "title";
          this.requestUpdate();
        }
        return;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        this.removeStep(step.id);
        return;
    }
  }

  /** Escape in the step's settings goes back to the step on the board */
  private onPanelKey(e: KeyboardEvent) {
    if (e.key !== "Escape" || e.defaultPrevented || !this.selected) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "SELECT") return;
    e.preventDefault();
    this.querySelector<HTMLElement>(`.ui-pb__step[data-id="${CSS.escape(this.selected)}"]`)?.focus();
  }

  /* ---------- Dragging ---------- */

  private onDown(e: PointerEvent, step: PlaybookStep) {
    if (e.button !== 0) return;
    // Touch drags from the grip only, so the board still scrolls under a finger
    if (e.pointerType === "touch" && !(e.target as Element).closest(".ui-pb__grip")) return;
    this.drag = { id: step.id, pointer: e.pointerId, x: e.clientX, y: e.clientY, on: false };
    this.dragged = false;
  }

  private onMove(e: PointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    const card = this.querySelector<HTMLElement>(`.ui-pb__step[data-id="${CSS.escape(d.id)}"]`);
    if (!card) return;
    if (!d.on) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;
      d.on = true;
      try {
        card.setPointerCapture?.(e.pointerId);
      } catch {
        // A pointer the browser no longer tracks (or a synthetic one): the drag still follows pointermove
      }
      this.dragging = d.id;
    }
    e.preventDefault();
    // Following the pointer only moves pixels: written straight to the card
    card.style.transform = `translate(${e.clientX - d.x}px, ${e.clientY - d.y}px)`;
    this.drop = this.dropAt(e.clientX, e.clientY, d.id);
  }

  /** @internal Where a step dropped at (x, y) would land: the phase under the pointer, else the nearest one */
  private dropAt(x: number, y: number, id: string): Drop | null {
    const step = this.value.steps.find((s) => s.id === id);
    if (!step) return null;
    let best: { el: HTMLElement; dist: number } | null = null;
    for (const el of this.querySelectorAll<HTMLElement>(".ui-pb__phase")) {
      if (!this.allowed(step.type, el.dataset.phase!)) continue;
      const r = el.getBoundingClientRect();
      const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
      const dist = Math.hypot(dx, dy);
      if (!best || dist < best.dist) best = { el, dist };
    }
    if (!best) return null;
    const phase = best.el.dataset.phase!;
    const cards = [...best.el.querySelectorAll<HTMLElement>(".ui-pb__step")].filter((c) => c.dataset.id !== id);
    let index = cards.length;
    for (let k = 0; k < cards.length; k++) {
      const r = cards[k].getBoundingClientRect();
      if (y < r.top + r.height / 2) {
        index = k;
        break;
      }
    }
    return { phase, index };
  }

  private onUp(e: PointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    this.drag = null;
    if (!d.on) return;
    this.dragged = true;
    const card = this.querySelector<HTMLElement>(`.ui-pb__step[data-id="${CSS.escape(d.id)}"]`);
    if (card) card.style.transform = "";
    const drop = this.drop;
    this.drop = null;
    this.dragging = null;
    if (drop) {
      this.place(d.id, drop.phase, drop.index);
      this.cursor = d.id;
    }
  }

  private onCancel() {
    const d = this.drag;
    this.drag = null;
    if (d) {
      const card = this.querySelector<HTMLElement>(`.ui-pb__step[data-id="${CSS.escape(d.id)}"]`);
      if (card) card.style.transform = "";
    }
    this.drop = null;
    this.dragging = null;
  }

  private onStepClick(e: MouseEvent, step: PlaybookStep) {
    // A drag ends in a click on the card it started on – that click isn't a pick
    if (this.dragged) {
      this.dragged = false;
      e.preventDefault();
      return;
    }
    this.cursor = step.id;
    this.pick(step.id);
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (!this.hasUpdated || changed.has("currentVersion")) this.loaded = this.value;
    if (changed.has("dryRun")) {
      this.dryFor = this.dryRun ? this.value : null;
      this.dryPending = false;
      if (this.dryRun && this.hasUpdated) this.announce(`Dry run: ${this.drySummary()}`);
    } else if (changed.has("value") && this.dryPending && changed.get("value") !== undefined) this.dryPending = false;
    this.toggleAttribute("data-dragging", !!this.dragging);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.setAttribute("aria-label", this.heading);
    const f = this.focusNext;
    if (!f) return;
    this.focusNext = null;
    if (f === "title") this.querySelector<HTMLElement>(".ui-pb__title-input")?.focus();
    else if (f.startsWith("step:")) this.querySelector<HTMLElement>(`.ui-pb__step[data-id="${CSS.escape(f.slice(5))}"]`)?.focus();
    else if (f.startsWith("add:")) this.querySelector<HTMLElement>(`.ui-pb__add[data-phase="${CSS.escape(f.slice(4))}"]`)?.focus();
  }

  /* ---------- Rendering ---------- */

  /** @internal */
  private outcomeOf(id: string): PlaybookDryRunOutcome | "none" {
    return this.dryRun?.steps.find((s) => s.id === id)?.outcome ?? "none";
  }

  /** @internal "6 of 8 steps run · pauses at Refund review" */
  private drySummary() {
    const d = this.dryRun;
    if (!d) return "";
    if (d.summary) return d.summary;
    const shown = this.ordered;
    const runs = shown.filter((s) => this.outcomeOf(s.id) === "run").length;
    const pauses = shown.filter((s) => this.outcomeOf(s.id) === "pause");
    const skips = shown.filter((s) => this.outcomeOf(s.id) === "skip").length;
    return [
      `${runs} of ${plural(shown.length, "step")} run`,
      skips ? `${skips} skipped` : "",
      pauses.length ? `pauses at ${pauses.map((s) => s.title).join(", ")}` : "no gate pauses",
    ]
      .filter(Boolean)
      .join(" · ");
  }

  private typeIcon(type: PlaybookStepType | undefined, typeId: string) {
    if (type?.icon) return type.icon.cloneNode(true);
    return icon16(BUILT_IN[typeId] ?? (type?.review ? BUILT_IN.review : DOT));
  }

  private renderStep(step: PlaybookStep, n: number, tabbable: string | undefined, dry: boolean) {
    const type = this.typeOf(step);
    const outcome = dry ? this.outcomeOf(step.id) : undefined;
    const note = dry ? this.dryRun?.steps.find((s) => s.id === step.id)?.note : undefined;
    const drop = this.drop;
    const list = this.byPhase.get(step.phase) ?? [];
    const pos = list.filter((s) => s.id !== this.dragging).findIndex((s) => s.id === step.id);
    const dropBefore = !!drop && drop.phase === step.phase && step.id !== this.dragging && drop.index === pos;
    return html`<li
      role="option"
      class="ui-pb__step"
      data-id=${step.id}
      data-type=${step.type}
      data-outcome=${ifDefined(outcome)}
      ?data-review=${!!type?.review}
      ?data-dragging=${this.dragging === step.id}
      ?data-drop-before=${dropBefore}
      aria-selected=${this.selected === step.id ? "true" : "false"}
      aria-describedby=${`${this.uid}-how`}
      tabindex=${step.id === tabbable ? 0 : -1}
      @keydown=${(e: KeyboardEvent) => this.onStepKey(e, step)}
      @click=${(e: MouseEvent) => this.onStepClick(e, step)}
      @focus=${() => (this.cursor = step.id)}
      @pointerdown=${(e: PointerEvent) => this.onDown(e, step)}
      @pointermove=${this.onMove}
      @pointerup=${this.onUp}
      @pointercancel=${this.onCancel}
      @lostpointercapture=${this.onCancel}
    >
      <span class="ui-pb__grip" aria-hidden="true">${grip}</span>
      <span class="ui-pb__step-icon" aria-hidden="true">${this.typeIcon(type, step.type)}</span>
      <span class="ui-pb__step-text">
        <span class="ui-pb__step-title"><span class="ui-pb__sr">Step ${n}: </span>${step.title}</span>
        <span class="ui-pb__step-sub">${type?.label ?? step.type}${type?.review ? html`<span class="ui-pb__pause">Pauses for review</span>` : nothing}</span>
        ${outcome
          ? html`<span class="ui-pb__outcome" data-outcome=${outcome}>${icon16(OUTCOME[outcome].d)}${OUTCOME[outcome].label}</span>${note ? html`<span class="ui-pb__outcome-note">${note}</span>` : nothing}`
          : nothing}
      </span>
      <span class="ui-pb__step-n" aria-hidden="true">${n}</span>
    </li>`;
  }

  private renderBoard(dry: boolean) {
    const map = this.byPhase;
    const order = this.ordered;
    const tabbable = (this.cursor && order.some((s) => s.id === this.cursor) ? this.cursor : null) ?? (this.selected && order.some((s) => s.id === this.selected) ? this.selected : null) ?? order[0]?.id;
    let n = 0;
    return html`<div class="ui-pb__board" style=${styleMap({ "--tc-playbook-canvas-phases": String(Math.max(1, this.phases.length)) })}>
      ${repeat(
        this.phases,
        (p) => p.id,
        (p, pi) => {
          const list = map.get(p.id) ?? [];
          const titleId = `${this.uid}-p-${pi}`;
          const steps = list.map((s) => this.renderStep(s, ++n, tabbable, dry));
          const dropEnd = !!this.drop && this.drop.phase === p.id && this.drop.index >= list.filter((s) => s.id !== this.dragging).length;
          return html`<section class="ui-pb__phase" data-phase=${p.id} ?data-drop-end=${dropEnd} aria-labelledby=${titleId}>
            <div class="ui-pb__phase-head">
              <span class="ui-pb__phase-n" aria-hidden="true">${pi + 1}</span>
              <h4 class="ui-pb__phase-title" id=${titleId}>${p.label}</h4>
              <span class="ui-pb__phase-count" aria-hidden="true">${list.length}</span>
            </div>
            ${p.description ? html`<p class="ui-pb__phase-desc">${p.description}</p>` : nothing}
            ${list.length
              ? html`<ol class="ui-pb__steps" role="listbox" aria-labelledby=${titleId}>${steps}</ol>`
              : html`<p class="ui-pb__empty">No steps yet</p>`}
            <button type="button" class="ui-pb__add" data-phase=${p.id} aria-label=${`Add step to ${p.label}`} @click=${() => this.addStep(p)}>${plusIcon}<span>Add step</span></button>
          </section>`;
        },
      )}
    </div>`;
  }

  private row(id: string, label: string, control: unknown) {
    return html`<div class="ui-pb__row"><span class="ui-pb__label" id=${`${this.uid}-${id}`}>${label}</span><div class="ui-pb__control">${control}</div></div>`;
  }

  private renderPanel(look: "standard" | "clean") {
    const step = this.selected ? this.value.steps.find((s) => s.id === this.selected && this.phases.some((p) => p.id === s.phase)) : undefined;
    if (!step) {
      return html`<section class="ui-pb__panel" data-empty aria-label="Step settings">
        <p class="ui-pb__panel-empty">${this.value.steps.length ? "Pick a step to set it up" : "Add a step to a phase to start the playbook"}</p>
      </section>`;
    }
    const type = this.typeOf(step);
    const order = this.ordered;
    const n = order.findIndex((s) => s.id === step.id) + 1;
    const types = this.stepTypes.filter((t) => this.allowed(t.id, step.phase));
    const fail = step.onFail ?? "stop";
    const panelTitle = `${this.uid}-panel`;
    return html`<section class="ui-pb__panel" aria-labelledby=${panelTitle} @keydown=${this.onPanelKey}>
      <div class="ui-pb__panel-head">
        <span class="ui-pb__step-icon" aria-hidden="true">${this.typeIcon(type, step.type)}</span>
        <h4 class="ui-pb__panel-title" id=${panelTitle}>Step ${n} · ${this.phaseLabel(step.phase)}</h4>
        <div class="ui-pb__tools" role="toolbar" aria-label="Step" @keydown=${(e: KeyboardEvent) => this.toolbar.onKeyDown(e)} @focusin=${(e: FocusEvent) => this.toolbar.onFocusIn(e)}>
          ${([-1, 1] as const).map((dir) => {
            const can = this.canMove(step, dir);
            const label = dir < 0 ? "Move earlier" : "Move later";
            return html`<button
              type="button"
              class="ui-pb__tool"
              aria-label=${label}
              title=${`${label} (Alt+${dir < 0 ? "↑" : "↓"})`}
              aria-disabled=${ifDefined(can ? undefined : "true")}
              @click=${() => can && this.moveStep(step.id, dir)}
            >${dir < 0 ? upIcon : downIcon}</button>`;
          })}
          <button type="button" class="ui-pb__tool ui-pb__tool--danger" aria-label=${`Remove ${step.title}`} title="Remove (Delete)" @click=${() => this.removeStep(step.id)}>${removeIcon}</button>
        </div>
      </div>
      <div class="ui-pb__rows">
        ${this.row(
          "title",
          "Title",
          html`<input
            class="ui-pb__input ui-pb__title-input"
            aria-labelledby=${`${this.uid}-title`}
            .value=${live(step.title)}
            @change=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value.trim();
              if (v) this.patchStep(step.id, { title: v });
              else this.requestUpdate();
            }}
          />`,
        )}
        ${this.row(
          "type",
          "Type",
          html`<span class="ui-pb__select">
            <select
              class="ui-pb__input"
              aria-labelledby=${`${this.uid}-type`}
              @change=${(e: Event) => {
                const id = (e.target as HTMLSelectElement).value;
                const t = this.stepTypes.find((x) => x.id === id);
                this.patchStep(step.id, { type: id, ...(t?.review && !step.gate ? { gate: NEW_GATE } : {}) });
              }}
            >
              ${types.map((t) => html`<option value=${t.id} .selected=${live(t.id === step.type)}>${t.label}</option>`)}
            </select>${chevronDown}
          </span>`,
        )}
        ${this.row(
          "notes",
          type?.review ? "For the reviewer" : "Instructions",
          html`<textarea
            class="ui-pb__input ui-pb__notes"
            rows="2"
            aria-labelledby=${`${this.uid}-notes`}
            placeholder=${type?.review ? "What the reviewer should look at" : "What the agent should do in this step"}
            .value=${live(step.notes ?? "")}
            @change=${(e: Event) => this.patchStep(step.id, { notes: (e.target as HTMLTextAreaElement).value })}
          ></textarea>`,
        )}
        ${type?.review
          ? nothing
          : this.row(
              "fail",
              "If it fails",
              html`<div class="ui-pb__fail">
                <tc-segmented-control
                  look=${look}
                  size="sm"
                  aria-labelledby=${`${this.uid}-fail`}
                  aria-describedby=${`${this.uid}-fail-d`}
                  .options=${FAILURES.map((f) => ({ value: f.value, label: f.label })) as SegmentOption[]}
                  .value=${fail}
                  @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                    // The inner control's event stops here: the page hears the playbook's tc-value-change only
                    e.stopPropagation();
                    e.preventDefault();
                    this.patchStep(step.id, { onFail: e.detail.value as PlaybookFailure });
                  }}
                ></tc-segmented-control>
                <span class="ui-pb__hint" id=${`${this.uid}-fail-d`}>${FAILURES.find((f) => f.value === fail)?.text}</span>
              </div>`,
            )}
      </div>
      ${type?.review
        ? html`<tc-gate-config
            class="ui-pb__gate"
            flat
            look=${look}
            heading=${`${step.title} – review gate`}
            .value=${step.gate ?? NEW_GATE}
            .conditions=${this.gateConditions ?? GATE_CONDITIONS}
            .reviewers=${this.gateReviewers ?? GATE_REVIEWERS}
            .views=${this.gateViews ?? GATE_VIEWS}
            .actions=${this.gateActions ?? GATE_ACTIONS}
            @tc-value-change=${(e: CustomEvent<GateValueChange>) => {
              // The gate's event stops here: the page hears the playbook's tc-value-change only
              e.stopPropagation();
              e.preventDefault();
              this.patchStep(step.id, { gate: e.detail.value });
            }}
          ></tc-gate-config>`
        : nothing}
    </section>`;
  }

  private renderVersions() {
    if (!this.versionsOpen) return nothing;
    return html`<div class="ui-pb__versions" id=${`${this.uid}-versions`}>
      ${this.versions.length
        ? html`<ol class="ui-pb__version-list" aria-label="Versions">
            ${repeat(
              this.versions,
              (v) => v.id,
              (v) => {
                const current = v.id === this.currentVersion;
                return html`<li class="ui-pb__version" ?data-current=${current} aria-current=${ifDefined(current ? "true" : undefined)}>
                  <span class="ui-pb__version-label">${v.label}</span>
                  <span class="ui-pb__version-text">
                    ${v.note ? html`<span class="ui-pb__version-note">${v.note}</span>` : nothing}
                    ${v.meta ? html`<span class="ui-pb__version-meta">${v.meta}</span>` : nothing}
                  </span>
                  ${current
                    ? html`<span class="ui-pb__current">Current</span>`
                    : html`<button type="button" class="ui-pb__ghost" aria-label=${`Open ${v.label}`} @click=${() => this.emit<PlaybookVersionOpen>("tc-version-open", { id: v.id })}>Open</button>`}
                </li>`;
              },
            )}
          </ol>`
        : html`<p class="ui-pb__empty">No saved versions yet</p>`}
    </div>`;
  }

  private renderDryBar() {
    if (!this.dryRun) return nothing;
    const stale = this.dryFor !== this.value;
    return html`<div class="ui-pb__dry" ?data-stale=${stale}>
      <span class="ui-pb__dry-icon" aria-hidden="true">${playIcon}</span>
      <span class="ui-pb__dry-text"><b>Dry run</b> · ${stale ? "Out of date – the playbook changed since" : this.drySummary()}</span>
      ${stale ? html`<button type="button" class="ui-pb__ghost" @click=${this.requestDryRun}>Run again</button>` : nothing}
      <button type="button" class="ui-pb__ghost" @click=${this.clearDryRun}>Clear</button>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const steps = this.ordered;
    const gates = steps.filter((s) => this.typeOf(s)?.review).length;
    const current = this.versions.find((v) => v.id === this.currentVersion);
    const edited = this.loaded !== null && this.loaded !== this.value;
    const dry = !!this.dryRun && this.dryFor === this.value;
    const head = html`<div class="ui-pb__head">
      <div class="ui-pb__heading">
        <h3 class="ui-pb__title">${this.heading}</h3>
        <span class="ui-pb__meta">
          ${current ? html`<span class="ui-pb__meta-version">${current.label}</span>` : nothing}
          ${edited ? html`<span class="ui-pb__edited">Edited</span>` : nothing}
          <span>${current ? "· " : ""}${plural(steps.length, "step")} · ${plural(gates, "review gate")}</span>
        </span>
      </div>
      <div class="ui-pb__actions">
        ${this.versions.length || this.currentVersion
          ? html`<button type="button" class="ui-pb__btn" aria-expanded=${this.versionsOpen ? "true" : "false"} aria-controls=${ifDefined(this.versionsOpen ? `${this.uid}-versions` : undefined)} @click=${() => (this.versionsOpen = !this.versionsOpen)}>
              ${historyIcon}<span>Versions</span>
            </button>`
          : nothing}
        <button type="button" class="ui-pb__btn ui-pb__btn--primary" ?disabled=${!steps.length} aria-busy=${ifDefined(this.dryPending ? "true" : undefined)} @click=${this.requestDryRun}>
          ${playIcon}<span>${this.dryPending ? "Running…" : "Dry run"}</span>
        </button>
      </div>
    </div>`;
    const body = html`
      ${head} ${this.renderVersions()} ${this.renderDryBar()} ${this.renderBoard(dry)} ${this.renderPanel(look)}
      ${clean ? this.renderHints() : nothing}
    `;
    return html`
      <span class="ui-pb__sr" role="status">${this.message}</span>
      ${clean ? body : html`<div class="ui-pb__card">${body}</div>${this.renderHints()}`}
    `;
  }

  private renderHints(): TemplateResult {
    return html`<p class="ui-pb__hints" id=${`${this.uid}-how`}>
      <span><kbd>↑</kbd><kbd>↓</kbd> move between steps</span>
      <span><kbd>Alt</kbd><kbd>↑</kbd><kbd>↓</kbd> reorder</span>
      <span><kbd>Alt</kbd><kbd>←</kbd><kbd>→</kbd> change phase</span>
      <span><kbd>Enter</kbd> set up</span>
      <span><kbd>Delete</kbd> remove</span>
    </p>`;
  }

  static override css = /* css */ `
[data-ui="pb"] {
  --tc-playbook-canvas-rail: var(--tc-border-default);
  display: flow-root;
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 1120px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="pb"] *, [data-ui="pb"] *::before, [data-ui="pb"] *::after { box-sizing: border-box; }
:where([data-ui="pb"]) :is(h3, h4, p, ol, ul, section) { margin: 0; padding: 0; }
:where([data-ui="pb"]) :is(ol, ul) { list-style: none; }
:where([data-ui="pb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="pb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="pb"] button:is(:disabled, [aria-disabled="true"]) { cursor: not-allowed; opacity: 0.55; }
[data-ui="pb"] svg { display: block; flex: none; }
[data-ui="pb"][data-dragging] { cursor: grabbing; user-select: none; -webkit-user-select: none; }
.ui-pb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* Standard: a gray tray around a white card, the keyboard hints in the tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pb"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
.ui-pb__card { display: flow-root; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pb"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}

/* ---------- Header: the name, the version and the counts; Versions and Dry run ---------- */
.ui-pb__head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3); }
.ui-pb__heading { display: grid; flex: 1 1 200px; gap: var(--tc-space-0-5); min-width: 0; }
.ui-pb__title { color: var(--tc-text-strong); font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-relaxed); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-pb__title { font-weight: var(--tc-font-weight-semibold); letter-spacing: -0.01em; }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__title { font-weight: var(--tc-font-weight-medium); }
.ui-pb__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-pb__meta-version { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-pb__edited, .ui-pb__current, .ui-pb__pause {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
}
.ui-pb__edited { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-pb__current { flex: none; background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-pb__actions { display: flex; flex: none; gap: var(--tc-space-2); }
/* Versions and Dry run: Button's secondary and primary recipes, small */
.ui-pb__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg) !important;
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-pb__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-pb__btn[aria-expanded="true"] { background: var(--tc-fill-selected) !important; }
.ui-pb__btn--primary { background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-pb__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover) !important; box-shadow: var(--tc-action-primary-shadow); }
.ui-pb__btn svg, .ui-pb__add svg, .ui-pb__tool svg, .ui-pb__dry-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-pb__btn, .ui-pb__add, .ui-pb__tool) svg { stroke-width: 1.3; }
.ui-pb__ghost {
  flex: none;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm) !important;
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-action-ghost-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-pb__ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }

/* ---------- Versions: a quiet list, the current one marked ---------- */
.ui-pb__versions { margin: 0 var(--tc-space-4) var(--tc-space-3); padding: var(--tc-space-1) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); animation: ui-pb-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__versions { border-radius: var(--tc-radius-md); }
.ui-pb__version { display: flex; align-items: center; gap: var(--tc-space-3); min-height: 40px; padding: var(--tc-space-1-5) 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-pb__version:first-child { border-top: 0; }
.ui-pb__version-label { flex: none; min-width: 32px; color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-pb__version[data-current] .ui-pb__version-label { color: var(--tc-text-strong); }
.ui-pb__version-text { display: grid; flex: 1; min-width: 0; }
.ui-pb__version-note { overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-pb__version-meta { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }

/* ---------- The dry run's line ---------- */
.ui-pb__dry { display: flex; align-items: center; gap: var(--tc-space-2); margin: 0 var(--tc-space-4) var(--tc-space-3); padding: var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-accent-subtle); color: var(--tc-accent-text); animation: ui-pb-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__dry { border-radius: var(--tc-radius-md); }
.ui-pb__dry[data-stale] { background: var(--tc-fill-subtle); color: var(--tc-text-secondary); }
.ui-pb__dry-icon { display: grid; flex: none; place-items: center; }
.ui-pb__dry-text { flex: 1; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-pb__dry-text b { font-weight: var(--tc-font-weight-strong); }
.ui-pb__dry .ui-pb__ghost { color: inherit; }

/* ---------- The board: phases one under the other, columns once it's wide ---------- */
.ui-pb__board { display: grid; gap: var(--tc-space-2); padding: 0 var(--tc-space-3) var(--tc-space-3); }
.ui-pb__phase { position: relative; display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3); border-radius: var(--tc-radius-xl); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pb__phase { background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__phase { border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-divider); }
.ui-pb__phase[data-drop-end] .ui-pb__add, .ui-pb__phase[data-drop-end] .ui-pb__empty { box-shadow: 0 -2px 0 var(--tc-accent); }
[data-ui="pb"][data-dragging] .ui-pb__phase:has([data-dragging]) { box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-pb__phase-head { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-pb__phase-n { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-pb__phase-title { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-strong); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pb__phase-title { font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__phase-title { font-weight: var(--tc-font-weight-medium); }
.ui-pb__phase-count { flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-pb__phase-desc { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-pb__empty { padding: var(--tc-space-2) 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

/* Steps: small white cards on a rail – the connector is a line between one card and the next */
.ui-pb__steps { display: grid; gap: var(--tc-space-2-5); }
.ui-pb__step {
  position: relative;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--tc-space-2);
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-1);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  outline: none;
  cursor: grab;
  touch-action: pan-y;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pb__step { border-radius: var(--tc-radius-md); box-shadow: var(--tc-shadow-raised); }
.ui-pb__step + .ui-pb__step::before { content: ""; position: absolute; bottom: 100%; left: calc(var(--tc-space-1) + 12px + var(--tc-space-2) + 12px); width: 1.5px; height: var(--tc-space-2-5); background: var(--tc-playbook-canvas-rail); transform: translateX(-50%); }
.ui-pb__step:hover { box-shadow: var(--tc-card-shadow), inset 0 0 0 1px var(--tc-border-default); }
/* Picked: the selected ring plus a bar on the left edge, so it doesn't rest on colour alone */
.ui-pb__step[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected), inset var(--tc-focus-ring-width) 0 0 var(--tc-border-selected); }
.ui-pb__step:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
@media (forced-colors: active) { .ui-pb__step:focus-visible { outline: 2px solid Highlight; outline-offset: -2px; } .ui-pb__step[aria-selected="true"] { outline: 2px solid Highlight; } }
.ui-pb__step[data-dragging] { z-index: 2; opacity: 0.92; box-shadow: var(--tc-menu-shadow); cursor: grabbing; transition: none; }
.ui-pb__step[data-drop-before]::after { content: ""; position: absolute; top: calc(-1 * var(--tc-space-1-5)); right: var(--tc-space-1); left: var(--tc-space-1); height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-pb__grip { display: grid; place-items: center; width: 12px; height: 24px; color: var(--tc-icon-muted); opacity: 0.6; touch-action: none; }
.ui-pb__grip svg { width: 12px; height: 12px; fill: currentColor; }
.ui-pb__step:hover .ui-pb__grip { opacity: 1; }
.ui-pb__step-icon { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__step-icon { border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); }
.ui-pb__step-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__step-icon svg { stroke-width: 1.2; }
.ui-pb__step[data-review] .ui-pb__step-icon { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-pb__step-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-pb__step-title { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-pb__step-title { font-weight: var(--tc-font-weight-medium); }
.ui-pb__step-sub { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-pb__pause { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-pb__step-n { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
/* A dry run marks each step: runs, skipped, pauses – or not reached */
.ui-pb__outcome { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); color: var(--tc-status-success-fg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-pb__outcome svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ui-pb__outcome[data-outcome="pause"] { color: var(--tc-status-warning-fg); }
.ui-pb__outcome[data-outcome="skip"], .ui-pb__outcome[data-outcome="none"] { color: var(--tc-text-muted); }
.ui-pb__outcome-note { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
/* Skipped or not reached: an outline on the phase's own ground instead of a white card */
.ui-pb__step:is([data-outcome="skip"], [data-outcome="none"]):not([aria-selected="true"]) { background: transparent; box-shadow: inset 0 0 0 1px var(--tc-border-default); }
.ui-pb__step:is([data-outcome="skip"], [data-outcome="none"]) .ui-pb__step-icon { background: transparent; }
.ui-pb__step[data-outcome="pause"] { box-shadow: var(--tc-card-shadow), inset 0 0 0 1px var(--tc-status-warning-fg); }
/* Add step: the ghost button recipe */
.ui-pb__add {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  margin-left: calc(-1 * var(--tc-space-1));
  padding: 0 var(--tc-space-2) !important;
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-action-ghost-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-pb__add:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }

/* ---------- The step's settings, under the board ---------- */
.ui-pb__panel { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-pb__panel[data-empty] { padding: var(--tc-space-5) var(--tc-space-4); }
.ui-pb__panel-empty { color: var(--tc-text-muted); text-align: center; }
.ui-pb__panel-head { display: flex; align-items: center; gap: var(--tc-space-2-5); }
.ui-pb__panel-title { flex: 1; min-width: 0; color: var(--tc-text-strong); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-pb__panel-title { font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__panel-title { font-weight: var(--tc-font-weight-medium); }
.ui-pb__tools { display: flex; gap: var(--tc-space-0-5); }
.ui-pb__tool { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pb__tool:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-pb__tool--danger:hover:not(:disabled) { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-pb__rows { display: grid; gap: var(--tc-space-3); max-width: 720px; }
.ui-pb__row { display: grid; grid-template-columns: 92px minmax(0, 1fr); align-items: start; gap: var(--tc-space-3); }
.ui-pb__label { display: flex; align-items: center; min-height: var(--tc-control-h-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__label { color: var(--tc-text-muted); }
.ui-pb__control { display: grid; min-width: 0; }
.ui-pb__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-pb__fail { display: grid; justify-items: start; gap: var(--tc-space-1-5); }
.ui-pb__input {
  width: 100%;
  min-width: 0;
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2-5);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-pb__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-pb__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-pb__input::placeholder { color: var(--tc-text-placeholder); }
.ui-pb__select { position: relative; display: block; max-width: 320px; }
.ui-pb__select > select { padding-right: var(--tc-space-7); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-pb__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-pb__notes { height: auto; min-height: 60px; max-height: 200px; padding: var(--tc-space-2) var(--tc-space-2-5); line-height: var(--tc-line-height-normal); resize: vertical; field-sizing: content; }
[data-ui="pb"] [data-ui="gc"].ui-pb__gate { max-width: 720px; padding-top: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }

/* ---------- Keyboard hints: in the tray (Standard), the card's last row (Clean) ---------- */
.ui-pb__hints { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-pb__hints { padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-pb__hints { padding: var(--tc-space-2-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); }
.ui-pb__hints span { display: inline-flex; align-items: center; gap: var(--tc-space-1); white-space: nowrap; }
.ui-pb__hints kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); color: var(--tc-kbd-fg); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); }

@keyframes ui-pb-in { from { opacity: 0; transform: translateY(-4px); } }

/* Wide: the phases side by side, an arrow from each to the next */
@container (min-width: 860px) {
  .ui-pb__board { grid-template-columns: repeat(var(--tc-playbook-canvas-phases), minmax(0, 1fr)); align-items: stretch; }
  .ui-pb__phase:not(:last-child)::after { content: ""; position: absolute; top: calc(var(--tc-space-3) + 6px); right: calc(-1 * var(--tc-space-2) + 1px); width: 6px; height: 6px; border-top: 1.5px solid var(--tc-icon-muted); border-right: 1.5px solid var(--tc-icon-muted); transform: rotate(45deg); }
  .ui-pb__step { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-pb__step .ui-pb__step-icon { display: none; }
  .ui-pb__step + .ui-pb__step::before { left: calc(var(--tc-space-1) + 6px); }
}
/* Mid widths: one phase under the other, a rail down the left joining them */
@container (max-width: 859px) {
  .ui-pb__phase:not(:last-child)::after { content: ""; position: absolute; top: 100%; left: calc(var(--tc-space-3) + 10px); width: 1.5px; height: var(--tc-space-2); background: var(--tc-playbook-canvas-rail); }
}
/* Narrow: labels above their controls, no keyboard hints, no step numbers */
@container (max-width: 480px) {
  .ui-pb__head, .ui-pb__panel { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-pb__board { padding-left: var(--tc-space-2); padding-right: var(--tc-space-2); }
  .ui-pb__versions, .ui-pb__dry { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); }
  .ui-pb__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1); }
  .ui-pb__label { min-height: 0; }
  .ui-pb__step-n { display: none; }
  .ui-pb__step { grid-template-columns: auto auto minmax(0, 1fr); }
  .ui-pb__hints { display: none; }
}
@media (hover: none) { .ui-pb__hints { display: none; } }
/* Touch screens: bigger tap targets, the grip always shown */
@media (pointer: coarse) {
  .ui-pb__btn, .ui-pb__add, .ui-pb__ghost { height: 40px; }
  .ui-pb__tool { width: 40px; height: 40px; }
  .ui-pb__input:not(textarea) { height: 40px; }
  .ui-pb__grip { width: 24px; height: 32px; opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pb__versions, .ui-pb__dry { animation: none; }
  .ui-pb__step, .ui-pb__phase, .ui-pb__btn, .ui-pb__ghost, .ui-pb__add, .ui-pb__tool, .ui-pb__input { transition: none; }
}
`;
}

if (!customElements.get("tc-playbook-canvas")) customElements.define("tc-playbook-canvas", TcPlaybookCanvas);

declare global {
  interface HTMLElementTagNameMap {
    "tc-playbook-canvas": TcPlaybookCanvas;
  }
}
