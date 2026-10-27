import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-setup-guide> – the Lit port of src/components/setup-guide.tsx: an onboarding panel with a progress bar and
 * collapsible task groups. Tasks unlock one after another; finished tasks and groups are struck through.
 *
 *   <tc-setup-guide heading="Setup guide" .groups=${groups} editable closable></tc-setup-guide>
 *
 * The host is the region (role="region", named by the heading). Ticking the last task of a group folds it away and
 * unfolds the next unfinished one; focus moves to the group's header first (WCAG 2.4.3). Minimized, the body is
 * inert. Clean is one white card with hairline shadows, a thin blue progress line with a count next to it.
 */

export type SetupTask = {
  id: string;
  label: string;
  done?: boolean;
};

export type SetupGroup = {
  id: string;
  title: string;
  tasks: SetupTask[];
};

export type SetupGuideDoneChange = { done: string[] };
export type SetupGuideOpenGroupChange = { openGroup: string | null };
export type SetupGuideMinimizedChange = { minimized: boolean };

const FOLD_DELAY = 420;
/* After Lucide: list-checks – the header's icon */
const headIcon = svg`<path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8"></path>`;

let instances = 0;

/** @internal The ids of the tasks flagged done, as one key: own ticks are kept while it stays the same */
export const setupGuideFlagKey = (groups: SetupGroup[]) =>
  groups
    .flatMap((g) => g.tasks)
    .filter((t) => t.done)
    .map((t) => t.id)
    .join("\u0000");

/* ---------- Icons ---------- */

const chevronIcon = (look: Look) =>
  html`<svg class="ui-sg__chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.3" : "1.6"} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="m4.5 6.25 3.5 3.5 3.5-3.5"></path>`}</svg>`;
const minimizeIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.2" : "1.5"} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M9.5 2.5v4h4M9.5 6.5l4.5-4.5M6.5 13.5v-4h-4M6.5 9.5 2 14"></path>`}</svg>`;
const expandIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.2" : "1.5"} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M10 2h4v4M14 2 9.5 6.5M6 14H2v-4M2 14l4.5-4.5"></path>`}</svg>`;
const closeIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.2" : "1.5"} stroke-linecap="round" aria-hidden="true">${svg`<path d=${look === "clean" ? "m4 4 8 8M12 4l-8 8" : "m3.5 3.5 9 9M12.5 3.5l-9 9"}></path>`}</svg>`;
const checkIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="7" fill="currentColor"></circle>${
    look === "clean"
      ? svg`<path d="m5.2 8.2 1.9 1.9 3.7-3.9" fill="none" stroke="var(--tc-text-on-accent)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`
      : svg`<path d="m5 8.2 2 2 4-4.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>`
  }`}</svg>`;
const lockedIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.1" : "1.5"} aria-hidden="true">${
    look === "clean" ? svg`<circle cx="8" cy="8" r="6.5" stroke-dasharray="2 2"></circle>` : svg`<circle cx="8" cy="8" r="6"></circle><path d="m4 12 8-8"></path>`
  }</svg>`;

/**
 * An onboarding panel: a progress bar and collapsible groups of tasks that unlock one after another.
 * @tag tc-setup-guide
 * @fires tc-done-change - A task was ticked or cleared (detail: { done: string[] }, the ids of all finished tasks); cancelable
 * @fires tc-open-group-change - A group unfolded or folded, also when a finished group folds away on its own (detail: { openGroup: string | null }); cancelable
 * @fires tc-minimized-change - The body was collapsed or expanded (detail: { minimized: boolean }); cancelable
 * @fires tc-edit - The Edit link was pressed (shown with `editable`)
 * @fires tc-close - The close button was pressed (shown with `closable`)
 */
export class TcSetupGuide extends TcElement {
  static override ui = "sg";

  /** The heading, and the region's name */
  @property() accessor heading = "Setup guide";
  /** The task groups. Each task's `done` flag is where it starts; when the flags change, the guide follows them */
  @property({ attribute: false }) accessor groups: SetupGroup[] = [];
  /** Ids of the finished tasks; unset follows the tasks' flags. Changed by a tick unless tc-done-change is prevented */
  @property({ attribute: false }) accessor done: string[] | undefined = undefined;
  /** Id of the unfolded group, null for none; unset unfolds the first unfinished group */
  @property({ attribute: false }) accessor openGroup: string | null | undefined = undefined;
  /** The body is collapsed to the header */
  @property({ type: Boolean, reflect: true }) accessor minimized = false;
  /** Shows an "Edit" link in the header (fires tc-edit) */
  @property({ type: Boolean }) accessor editable = false;
  /** Shows a close button in the header (fires tc-close) */
  @property({ type: Boolean }) accessor closable = false;

  private readonly uid = `tc-sg${++instances}`;
  private foldTimer = 0;
  /** The flags key our own ticks were made on; null when `done` came from outside */
  private ownBase: string | null = null;
  private settingOwn = false;
  private ownName = false;

  constructor() {
    super();
    // Anything focused that goes away (a group folding, the body minimizing) leaves focus on its group's header
    new FocusRescueController(this, (key) => this.querySelector(`[data-group-head="${key ?? ""}"]`) ?? this.querySelector(".ui-sg__icon-btn"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // The fold-away timer never outlives the guide
    window.clearTimeout(this.foldTimer);
  }

  private get doneSet() {
    return new Set(this.done ?? this.groups.flatMap((g) => g.tasks).filter((t) => t.done).map((t) => t.id));
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("done") && !this.settingOwn) this.ownBase = null;
    // Own ticks are remembered with the flags they were made on – new flags win
    if (changed.has("groups") && this.ownBase !== null && this.ownBase !== setupGuideFlagKey(this.groups)) {
      this.ownBase = null;
      this.done = undefined;
    }
    if (this.openGroup === undefined) {
      const done = this.doneSet;
      this.openGroup = this.groups.find((g) => g.tasks.some((t) => !done.has(t.id)))?.id ?? null;
    }
  }

  protected override updated() {
    // The heading names the region unless the page gave it a name of its own
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
  }

  private setOpen(next: string | null) {
    if (next === this.openGroup) return;
    if (this.emit<SetupGuideOpenGroupChange>("tc-open-group-change", { openGroup: next }, { cancelable: true })) this.openGroup = next;
  }

  private setMinimized(next: boolean) {
    if (this.emit<SetupGuideMinimizedChange>("tc-minimized-change", { minimized: next }, { cancelable: true })) this.minimized = next;
  }

  private toggle(group: SetupGroup, id: string) {
    const tasks = this.groups.flatMap((g) => g.tasks);
    const next = this.doneSet;
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = tasks.filter((t) => next.has(t.id)).map((t) => t.id);
    if (this.emit<SetupGuideDoneChange>("tc-done-change", { done: ids }, { cancelable: true })) {
      this.settingOwn = true;
      this.done = ids;
      this.ownBase = setupGuideFlagKey(this.groups);
      void this.updateComplete.then(() => (this.settingOwn = false));
    }
    // A finished group folds away and the next open one unfolds
    window.clearTimeout(this.foldTimer);
    if (group.tasks.every((t) => next.has(t.id))) {
      const following = this.groups.find((g) => g.tasks.some((t) => !next.has(t.id)));
      const index = this.groups.indexOf(group);
      this.foldTimer = window.setTimeout(() => {
        // The task that was just ticked is about to go inert: its group's header takes focus first (2.4.3)
        rescueFocus(this.querySelector(`#${this.uid}-panel-${index}`), [this.querySelector(`[data-group-head="${index}"]`)]);
        this.setOpen(following?.id ?? null);
      }, FOLD_DELAY);
    }
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const done = this.doneSet;
    const tasks = this.groups.flatMap((g) => g.tasks);
    const total = tasks.length;
    const count = tasks.filter((t) => done.has(t.id)).length;
    const progress = total ? count / total : 0;
    const minimized = this.minimized;

    const track = html`<span class="ui-sg__track" role="progressbar" aria-label=${`${this.heading} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(progress * 100)}>
      <span class="ui-sg__fill" style=${styleMap({ transform: `scaleX(${progress})` })}></span>
    </span>`;

    const body = html`<div class="ui-sg__body" id=${`${this.uid}-body`} data-hidden=${ifDefined(minimized ? "" : undefined)} .inert=${minimized}>
        <div class="ui-sg__groups">
          ${repeat(
            this.groups,
            (g) => g.id,
            (group, groupIndex) => {
              const isOpen = this.openGroup === group.id;
              const finished = group.tasks.every((t) => done.has(t.id));
              // The first open task is the current one, everything after it waits
              const currentIndex = group.tasks.findIndex((t) => !done.has(t.id));
              const panelId = `${this.uid}-panel-${groupIndex}`;
              return html`<div class="ui-sg__group" data-open=${ifDefined(isOpen ? "" : undefined)}>
                <button type="button" class="ui-sg__group-head" data-group-head=${groupIndex} aria-expanded=${isOpen ? "true" : "false"} aria-controls=${panelId} @click=${() => this.setOpen(isOpen ? null : group.id)}>
                  <span class="ui-sg__group-title" data-done=${ifDefined(finished ? "" : undefined)}>${group.title}${finished ? html`<span class="ui-sg__sr">, done</span>` : nothing}</span>
                  ${chevronIcon(look)}
                </button>
                <div class="ui-sg__panel" id=${panelId} .inert=${!isOpen}>
                  <ul class="ui-sg__tasks">
                    ${repeat(
                      group.tasks,
                      (t) => t.id,
                      (task, index) => {
                        const isDone = done.has(task.id);
                        const locked = !isDone && currentIndex !== -1 && index > currentIndex;
                        const state = isDone ? "done" : locked ? "locked" : "current";
                        return html`<li>
                          <button
                            type="button"
                            role="checkbox"
                            class="ui-sg__task"
                            data-state=${state}
                            data-focus-key=${groupIndex}
                            ?disabled=${locked}
                            aria-checked=${isDone ? "true" : "false"}
                            title=${ifDefined(locked ? "Finish the task before it first" : undefined)}
                            @click=${() => this.toggle(group, task.id)}
                          >
                            <span class="ui-sg__mark" aria-hidden="true">${state === "done" ? checkIcon(look) : state === "locked" ? lockedIcon(look) : nothing}</span>
                            <span class="ui-sg__task-label">${task.label}</span>
                            ${locked ? html`<span class="ui-sg__sr"> – finish the task before it first</span>` : nothing}
                          </button>
                        </li>`;
                      },
                    )}
                  </ul>
                </div>
              </div>`;
            },
          )}
        </div>
      </div>`;
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean; Edit, Minimise and Close at the right
    const head = cardHead({
      icon: headIcon,
      title: this.heading,
      aside: html`<div class="ui-sg__actions">
          ${this.editable ? html`<button type="button" class="ui-sg__edit" @click=${() => this.emit("tc-edit", null)}>Edit</button>` : nothing}
          <button
            type="button"
            class="ui-sg__icon-btn"
            aria-label=${minimized ? "Expand setup guide" : "Minimize setup guide"}
            aria-expanded=${minimized ? "false" : "true"}
            aria-controls=${`${this.uid}-body`}
            @click=${() => this.setMinimized(!minimized)}
          >
            ${minimized ? expandIcon(look) : minimizeIcon(look)}
          </button>
          ${this.closable ? html`<button type="button" class="ui-sg__icon-btn" aria-label="Close setup guide" @click=${() => this.emit("tc-close", null)}>${closeIcon(look)}</button>` : nothing}
        </div>`,
    });
    if (clean) return html`${head}<div class="ui-sg__progress">${track}<span class="ui-sg__count" aria-hidden="true">${count}/${total}</span></div>${body}`;
    return html`${head}<div class="ui-sg__card">${track}${body}</div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sg"] {
  --tc-setup-guide-mark-bg-hover: light-dark(#d3d7de, #4a4a50);
  box-sizing: border-box;
  /* The gray tray: the header on it, the white card under it */
  width: 100%;
  max-width: 320px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="sg"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sg"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 320px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="sg"] *, [data-ui="sg"] *::before, [data-ui="sg"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where([data-ui="sg"]) button {
  margin: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sg"] button:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
.ui-sg__card { padding: var(--tc-space-2); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__actions {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__edit {
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-ghost-fg) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__edit:hover { background: var(--tc-action-ghost-bg-hover) !important; color: var(--tc-text-primary) !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__icon-btn {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-action-ghost-fg) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__icon-btn:hover { background: var(--tc-action-ghost-bg-hover) !important; color: var(--tc-text-primary) !important; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="sg"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="sg"]) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sg"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ---- The header's actions: Edit and the two ghost icon buttons ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__actions { display: flex; flex: none; align-items: center; gap: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__edit {
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__edit:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__icon-btn {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), color var(--tc-duration-instant) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__icon-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-sg__icon-btn svg { width: 16px; height: 16px; }
/* One continuous bar for all tasks */
:where([data-look="standard"], [data-look="standard"] *).ui-sg__track {
  display: block;
  height: var(--tc-meter-h);
  margin: var(--tc-space-2);
  overflow: hidden;
  border-radius: var(--tc-meter-radius);
  background: var(--tc-meter-track);
}
/* ---- One thin blue line for all tasks, with the count next to it ---- */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__progress {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  padding: 0 var(--tc-space-4) var(--tc-space-3);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__track {
  display: block;
  flex: 1;
  height: var(--tc-meter-h);
  overflow: hidden;
  border-radius: var(--tc-meter-radius);
  background: var(--tc-meter-track);
}
.ui-sg__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--tc-meter-fill);
  transform-origin: left center;
  transition: transform var(--tc-duration-reveal) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__count {
  flex: none;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
}
/* Minimize folds the whole list away */
.ui-sg__body {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
.ui-sg__body[data-hidden] { grid-template-rows: 0fr; opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__groups { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group {
  border-radius: var(--tc-radius-xl);
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group[data-open] { background: var(--tc-fill-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  width: 100%;
  padding: var(--tc-space-3) var(--tc-space-3);
  border-radius: var(--tc-radius-xl);
  text-align: left;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group-title {
  position: relative;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-normal);
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
/* Finished: a line draws through the title */
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group-title::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 52%;
  height: 1.5px;
  border-radius: var(--tc-radius-2xs);
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--tc-duration-slower) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__groups {
  display: grid;
  gap: var(--tc-space-0-5);
  min-height: 0;
  overflow: hidden;
  padding: 0 var(--tc-space-1);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
/* Inner padding as a spacer, so focus rings aren't cut and the fold can still close to 0 */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__groups::before,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__groups::after { content: ""; display: block; height: 2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group {
  border-radius: var(--tc-radius-md);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group[data-open] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  width: 100%;
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  text-align: left;
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-head:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group[data-open] .ui-sg__group-head:hover { background: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-title {
  position: relative;
  min-width: 0;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-strong);
  transition: color var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-title[data-done] { color: var(--tc-text-muted); }
/* Finished: a hairline draws through the title */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-title::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 52%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-sg__group-title[data-done]::after { transform: scaleX(1); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__chevron {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted);
  transition: transform var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__chevron {
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted);
  transition: transform var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-sg__group[data-open] .ui-sg__chevron { transform: rotate(180deg); }
/* Each group is a dropdown */
.ui-sg__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-sg__group[data-open] .ui-sg__panel { grid-template-rows: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__tasks {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  list-style: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__tasks li:last-child { padding-bottom: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-3);
  width: 100%;
  padding: var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-lg);
  text-align: left;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group[data-open] .ui-sg__task { opacity: 1; transform: none; transition-delay: var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__tasks {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--tc-space-1);
  list-style: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__tasks li:last-child { padding-bottom: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-2-5);
  width: 100%;
  padding: var(--tc-space-1-5) var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  text-align: left;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), color var(--tc-duration-moderate) var(--tc-ease-standard), background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group[data-open] .ui-sg__task { opacity: 1; transform: none; transition-delay: var(--tc-duration-instant), var(--tc-duration-instant), 0ms, 0ms; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task:not(:disabled):hover { background: var(--tc-fill-subtle); }
.ui-sg__task[data-state="current"] { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task[data-state="current"]:hover .ui-sg__mark { background: var(--tc-setup-guide-mark-bg-hover); }
.ui-sg__task[data-state="locked"] { color: var(--tc-text-muted); cursor: default; }
.ui-sg__task[data-state="done"] { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: var(--tc-space-0-5);
  border-radius: 50%;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard);
}
/* The current task's open box: its edge is its only cue, so border-control (≥ 3:1) */
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task[data-state="current"] .ui-sg__mark { box-shadow: inset 0 0 0 1.5px var(--tc-border-control); }
/* The mark: an open ring for the current task, a dashed faint ring while locked, a blue check when done */
:where([data-look="clean"], [data-look="clean"] *).ui-sg__mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: var(--tc-space-0-5);
  border-radius: 50%;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task[data-state="current"] .ui-sg__mark { box-shadow: inset 0 0 0 1px var(--tc-border-control); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task[data-state="current"]:hover .ui-sg__mark { box-shadow: inset 0 0 0 1px var(--tc-accent); }
.ui-sg__task[data-state="locked"] .ui-sg__mark { color: var(--tc-text-disabled); }
.ui-sg__task[data-state="done"] .ui-sg__mark { color: var(--tc-accent); }
.ui-sg__mark svg { width: 16px; height: 16px; }
.ui-sg__task[data-state="done"] .ui-sg__mark svg { animation: ui-sg-pop var(--tc-duration-slower) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task-label {
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  text-decoration-line: line-through;
  text-decoration-color: transparent;
  text-decoration-thickness: 1.5px;
  transition: text-decoration-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task-label {
  min-width: 0;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-decoration-line: line-through;
  text-decoration-color: transparent;
  text-decoration-thickness: 1px;
  transition: text-decoration-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
.ui-sg__task[data-state="done"] .ui-sg__task-label { text-decoration-color: currentColor; }
.ui-sg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-sg-pop {
  from { transform: scale(0.5); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-sg__fill,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__body,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__panel,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__task,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__chevron,
:where([data-look="standard"], [data-look="standard"] *).ui-sg__group-title::after { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sg__mark svg { animation: none !important; }
}
/* Narrow: a little less side padding */
@container (max-width: 300px) {
:where([data-look="clean"], [data-look="clean"] *).ui-sg__progress { padding-inline: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-head { padding-left: var(--tc-space-2-5); }
}
/* Touch: taller targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-sg__icon-btn { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__edit { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-head { padding-block: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task { padding-block: var(--tc-space-2); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-sg__fill,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__body,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__panel,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__task,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__chevron,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group,
:where([data-look="clean"], [data-look="clean"] *).ui-sg__group-title::after { transition: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sg__mark svg { animation: none; }
}
`;
}

if (!customElements.get("tc-setup-guide")) customElements.define("tc-setup-guide", TcSetupGuide);

declare global {
  interface HTMLElementTagNameMap {
    "tc-setup-guide": TcSetupGuide;
  }
}
