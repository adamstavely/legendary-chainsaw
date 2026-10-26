import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-project-card> – the Lit port of src/components/project-card.tsx: a two-line summary that quietly grows into the
 * full picture. The progress is a ring cut into one segment per subtask; the open card lists the subtasks, the people
 * and a status picker that unfolds in place, and the line on the tray (Clean: the card's last row) always says what
 * you are pointing at.
 *
 *   <tc-project-card heading="Onboarding" .tasks=${tasks} .members=${people} due="Nov 14"></tc-project-card>
 *
 * Ticks, the status and opening are cancelable `tc-tasks-change`, `tc-status-change` and `tc-open-change` events,
 * applied unless prevented. The action button fires `tc-action`.
 */

export type ProjectTask = {
  id: string;
  label: string;
  done?: boolean;
  /** Name of a member – shows their avatar on the row and powers the people filter */
  assignee?: string;
};
export type ProjectMember = {
  name: string;
  /** Image URL – initials on a soft color when left out */
  avatar?: string;
};
export type ProjectTone = "red" | "amber" | "green" | "blue" | "violet" | "gray";
export type ProjectOption = {
  id: string;
  label: string;
  /** Color of the tag – also picks its icon: violet or gray = not started, amber = in progress, blue = in review, green = done, red = blocked */
  tone?: ProjectTone;
  /** Replaces the icon that comes with the tone (cloned) */
  icon?: Element;
};

const DEFAULT_STATUSES: ProjectOption[] = [
  { id: "todo", label: "To do", tone: "violet" },
  { id: "progress", label: "In progress", tone: "amber" },
  { id: "review", label: "In review", tone: "blue" },
  { id: "done", label: "Done", tone: "green" },
];
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
/** A steady soft color per name */
const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** One arc of the ring, from `from` to `to` (0–1 around the circle, starting at the top) */
function arc(from: number, to: number, r: number, c: number) {
  const point = (t: number) => {
    const a = t * Math.PI * 2 - Math.PI / 2;
    return `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
  };
  return `M ${point(from)} A ${r} ${r} 0 ${to - from > 0.5 ? 1 : 0} 1 ${point(to)}`;
}

/** The icon in front of a status – one per tone, so custom statuses get a fitting one for free */
function toneIcon(look: Look, tone: ProjectTone) {
  // Clean draws thinner lines
  const w = look === "clean" ? 1.2 : 1.5;
  const line = (d: string) => svg`<path d=${d} stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round"></path>`;
  const ring = svg`<circle cx="6" cy="6" r="4.25" stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round"></circle>`;
  const parts =
    tone === "gray" || tone === "violet"
      ? svg`<circle cx="6" cy="6" r="4.25" stroke="currentColor" stroke-width=${w} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2.2 2.25"></circle>`
      : tone === "amber"
        ? svg`${ring}<path d="M6 3.4a2.6 2.6 0 0 1 0 5.2V3.4Z" fill="currentColor"></path>`
        : tone === "blue"
          ? svg`${line("M1.2 6S3 2.7 6 2.7 10.8 6 10.8 6 9 9.3 6 9.3 1.2 6 1.2 6Z")}<circle cx="6" cy="6" r="1.4" fill="currentColor"></circle>`
          : tone === "green"
            ? svg`${ring}${line("m4.1 6.1 1.3 1.3 2.5-2.7")}`
            : svg`${ring}${line("M6 3.8v2.6M6 8.2v.01")}`;
  return html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${parts}</svg>`;
}
const arrowIcon = html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;
const checkMark = html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${svg`<circle class="ui-pc__ring" cx="8" cy="8" r="6.3"></circle><circle class="ui-pc__disc" cx="8" cy="8" r="7"></circle><path class="ui-pc__tick" d="m5.2 8.2 1.9 1.9 3.7-4"></path>`}</svg>`;
const avatar = (m: ProjectMember) =>
  html`<span class="ui-pc__avatar" aria-hidden="true" style=${styleMap({ "--tc-project-card-hue": String(hue(m.name)) })}>${m.avatar ? html`<img src=${m.avatar} alt="" />` : initials(m.name)}</span>`;

type Subtask = ProjectTask & { done: boolean };
let uidCount = 0;

/**
 * A project summary with a segmented progress ring that unfolds into its subtasks, people and status.
 * @tag tc-project-card
 * @fires tc-tasks-change - A subtask was ticked or unticked; detail `{ tasks: ProjectTask[] }`. Cancelable.
 * @fires tc-status-change - Another status was chosen; detail `{ status: string }`. Cancelable.
 * @fires tc-open-change - The card opens or closes; detail `{ open: boolean }`. Cancelable.
 * @fires tc-action - The action button (`actionLabel`) was pressed
 */
export class TcProjectCard extends TcElement {
  static override ui = "pc";

  /** The project's name */
  @property() accessor heading = "";
  /** Subtasks – one ring segment and one row each */
  @property({ attribute: false }) accessor tasks: ProjectTask[] = [];
  /** Options of the status picker */
  @property({ attribute: false }) accessor statuses: ProjectOption[] = DEFAULT_STATUSES;
  /** The chosen status id – unset is the first option */
  @property() accessor status: string | undefined = undefined;
  /** Ready-to-show due date, e.g. "Oct 24" */
  @property() accessor due = "";
  /** The people on the project – avatars in the head that filter the subtasks to theirs */
  @property({ attribute: false }) accessor members: ProjectMember[] = [];
  /** A button on the tray of the open card (Clean: in its last row); it fires tc-action */
  @property({ attribute: "action-label" }) accessor actionLabel = "";
  /** Replaces the line on the tray while nothing is hovered: text, or an element (cloned) */
  @property({ attribute: false }) accessor hint: string | Element | undefined = undefined;
  /** "hover" opens under the pointer (taps and the keyboard still toggle), "click" only on click */
  @property() accessor trigger: "hover" | "click" = "hover";
  /** Whether the card is unfolded, showing the subtasks, the people filter and the tray */
  @property({ type: Boolean, reflect: true }) accessor open = false;

  /** @internal The subtask under the pointer (row or ring segment) */
  @state() accessor hot: string | null = null;
  /** @internal The person under the pointer */
  @state() accessor peek: string | null = null;
  /** @internal The person clicked to stay */
  @state() accessor pinned: string | null = null;
  /** @internal */
  @state() accessor choosing = false;

  private uid = `tc-pc-${++uidCount}`;
  private timer = 0;

  constructor() {
    super();
    // Anything that folds away with focus in it (the pointer left, a press outside): back to the head
    new FocusRescueController(this, () => this.toggleBtn);
  }

  private get toggleBtn() {
    return this.querySelector<HTMLElement>(".ui-pc__toggle");
  }
  private get statusBtn() {
    return this.querySelector<HTMLElement>(".ui-pc__status");
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerenter", this.onEnter);
    this.addEventListener("pointerleave", this.onLeave);
    this.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("pointerdown", this.onOutside);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.timer);
    this.removeEventListener("pointerenter", this.onEnter);
    this.removeEventListener("pointerleave", this.onLeave);
    this.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("pointerdown", this.onOutside);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-open", this.open);
  }

  /* ---------- Opening and closing ---------- */

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private change(next: boolean) {
    window.clearTimeout(this.timer);
    if (!next) {
      // The body and tray go inert: focus inside them goes to the head first
      rescueFocus(this.querySelector(`[id="${this.uid}-body"]`), [this.toggleBtn]);
      rescueFocus(this.querySelector(".ui-pc__fold--tray"), [this.toggleBtn]);
      this.choosing = false;
      this.hot = null;
      this.peek = null;
    }
    this.setOpen(next);
  }

  private later(next: boolean, ms: number) {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.change(next), ms);
  }

  private onEnter = (e: PointerEvent) => {
    if (this.trigger === "hover" && e.pointerType === "mouse") this.later(true, 90);
  };
  private onLeave = (e: PointerEvent) => {
    if (this.trigger === "hover" && e.pointerType === "mouse") this.later(false, 220);
  };
  // While open, a press outside closes it
  private onOutside = (e: PointerEvent) => {
    if (!this.open || this.contains(e.target as Node)) return;
    window.clearTimeout(this.timer);
    this.choosing = false;
    this.hot = null;
    this.peek = null;
    this.setOpen(false);
  };
  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !this.open) return;
    e.stopPropagation();
    if (this.choosing) return this.closePicker();
    this.change(false);
    this.toggleBtn?.focus({ preventScroll: true });
  };

  /** Before the status row folds (inert): focus that was in it goes back to the status tag */
  private closePicker() {
    rescueFocus(this.querySelector(".ui-pc__fold--status"), [this.statusBtn]);
    this.choosing = false;
  }

  /* ---------- Editing ---------- */

  private toggle(id: string) {
    const next = this.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    if (this.emit("tc-tasks-change", { tasks: next }, { cancelable: true })) this.tasks = next;
  }
  private setStatus(id: string) {
    if (this.emit("tc-status-change", { status: id }, { cancelable: true })) this.status = id;
  }
  private pick(id: string) {
    this.setStatus(id);
    this.closePicker();
  }

  /* ---------- Parts ---------- */

  private caption(list: Subtask[], person: string | null) {
    const hotTask = list.find((t) => t.id === this.hot);
    const left = list.length - list.filter((t) => t.done).length;
    if (hotTask) {
      return keyed(
        `task-${hotTask.id}`,
        html`<span>${hotTask.assignee ? html`${hotTask.done ? "Done by" : "Assigned to"} <b>${hotTask.assignee}</b>` : hotTask.done ? "Done" : "Nobody on it yet"}</span>`,
      );
    }
    if (person) {
      const own = list.filter((t) => t.assignee === person);
      return keyed(`person-${person}`, html`<span><b>${person}</b> · ${own.filter((t) => t.done).length} of ${own.length} done</span>`);
    }
    const hint = this.hint;
    const text = hint === undefined || hint === "" ? (left === 0 ? "All done" : `${left} left`) : typeof hint === "string" ? hint : hint.cloneNode(true);
    return keyed("rest", html`<span>${text}</span>`);
  }

  private ring(list: Subtask[], doneCount: number, theirs: (t: ProjectTask) => boolean) {
    const SIZE = 32;
    const R = 12.5;
    const gap = list.length > 1 ? 0.055 : 0;
    const slice = 1 / Math.max(list.length, 1);
    const segs =
      list.length === 1
        ? svg`<circle class="ui-pc__seg" cx=${SIZE / 2} cy=${SIZE / 2} r=${R} ?data-done=${list[0].done} ?data-hot=${this.hot === list[0].id}
            @pointerenter=${() => (this.hot = list[0].id)} @click=${() => this.toggle(list[0].id)}></circle>`
        : list.map(
            (t, i) =>
              svg`<path class="ui-pc__seg" d=${arc(i * slice + gap / 2, (i + 1) * slice - gap / 2, R, SIZE / 2)} ?data-done=${t.done} ?data-hot=${this.hot === t.id} ?data-dim=${!theirs(t)}
                @pointerenter=${() => (this.hot = t.id)} @click=${() => this.toggle(t.id)}></path>`,
          );
    return html`<span class="ui-pc__progress" ?data-live=${this.open}>
      <svg width=${SIZE} height=${SIZE} viewBox="0 0 ${SIZE} ${SIZE}" fill="none" aria-hidden="true" @pointerleave=${() => (this.hot = null)}>${segs}</svg>
      ${keyed(doneCount, html`<span class="ui-pc__num">${doneCount}</span>`)}
    </span>`;
  }

  private people(person: string | null) {
    return html`<span class="ui-pc__people" @pointerleave=${() => (this.peek = null)}>
      ${this.members.map(
        (m) => html`<button
          type="button"
          class="ui-pc__member"
          aria-pressed=${this.pinned === m.name ? "true" : "false"}
          ?data-on=${person === m.name}
          ?data-off=${!!person && person !== m.name}
          tabindex=${this.open ? 0 : -1}
          @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.peek = m.name)}
          @focus=${() => (this.peek = m.name)}
          @blur=${() => (this.peek = null)}
          @click=${() => (this.pinned = this.pinned === m.name ? null : m.name)}
        >
          <span class="ui-pc__sr">Only ${m.name}'s subtasks</span>
          ${avatar(m)}
        </button>`,
      )}
    </span>`;
  }

  private picker(current: string | undefined, look: Look) {
    const statuses = this.statuses;
    const at = Math.max(0, statuses.findIndex((o) => o.id === current));
    const onKeyDown = (e: KeyboardEvent) => {
      const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      const to = e.key === "Home" ? 0 : e.key === "End" ? statuses.length - 1 : step ? (at + step + statuses.length) % statuses.length : -1;
      if (to < 0 || !statuses.length) return;
      e.preventDefault();
      this.setStatus(statuses[to].id);
      (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[role=radio]")[to]?.focus();
    };
    return html`<div id="${this.uid}-status" class="ui-pc__fold ui-pc__fold--status" ?data-open=${this.choosing} .inert=${!this.choosing}>
      <div class="ui-pc__clip">
        <div class="ui-pc__options" role="radiogroup" aria-label="Status" @keydown=${onKeyDown}>
          ${statuses.map(
            (o, i) => html`<button
              type="button"
              role="radio"
              aria-checked=${o.id === current ? "true" : "false"}
              tabindex=${i === at ? 0 : -1}
              class="ui-pc__option"
              data-tone=${o.tone ?? "gray"}
              @click=${() => this.pick(o.id)}
            >
              ${o.icon ? o.icon.cloneNode(true) : look === "clean" ? html`<span class="ui-pc__dot" aria-hidden="true"></span>` : toneIcon(look, o.tone ?? "gray")}${o.label}
            </button>`,
          )}
        </div>
      </div>
    </div>`;
  }

  private taskList(list: Subtask[], theirs: (t: ProjectTask) => boolean) {
    return html`<ul class="ui-pc__tasks" @pointerleave=${() => (this.hot = null)}>
      ${list.map((t) => {
        const owner = this.members.find((m) => m.name === t.assignee);
        return html`<li>
          <button
            type="button"
            class="ui-pc__task"
            role="checkbox"
            aria-checked=${t.done ? "true" : "false"}
            ?data-hot=${this.hot === t.id}
            ?data-dim=${!theirs(t)}
            @pointerenter=${(e: PointerEvent) => e.pointerType === "mouse" && (this.hot = t.id)}
            @focus=${() => (this.hot = t.id)}
            @blur=${() => (this.hot = null)}
            @click=${() => this.toggle(t.id)}
          >
            ${checkMark}<span class="ui-pc__label">${t.label}</span>${owner ? avatar(owner) : nothing}
          </button>
        </li>`;
      })}
    </ul>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const list: Subtask[] = this.tasks.map((t) => ({ ...t, done: Boolean(t.done) }));
    const doneCount = list.filter((t) => t.done).length;
    const statusNow = this.statuses.find((o) => o.id === this.status) ?? this.statuses[0];
    const person = this.peek ?? this.pinned;
    const theirs = (t: ProjectTask) => !person || t.assignee === person;
    const due = this.due;
    // Standard: the gray tray under the card · Clean: the last row inside the card
    const tray = html`<div class="ui-pc__fold ui-pc__fold--tray" .inert=${!this.open}>
      <div class="ui-pc__clip">
        <div class="ui-pc__foot">
          <span class="ui-pc__caption">${this.caption(list, person)}</span>
          ${this.actionLabel ? html`<button type="button" class="ui-pc__action" @click=${() => this.emit("tc-action", null)}>${this.actionLabel}${arrowIcon}</button>` : nothing}
        </div>
      </div>
    </div>`;
    return html`
      <div class="ui-pc__card">
        <div class="ui-pc__head">
          <button
            type="button"
            class="ui-pc__toggle"
            aria-expanded=${this.open ? "true" : "false"}
            aria-controls="${this.uid}-body"
            aria-label=${`${this.heading}: ${doneCount} of ${list.length} done, ${statusNow?.label ?? ""}${due ? `, due ${due}` : ""}`}
            @click=${() => this.change(!this.open)}
          ></button>
          ${this.ring(list, doneCount, theirs)}
          <span class="ui-pc__titles">
            <span class="ui-pc__name" title=${this.heading}>${this.heading}</span>
            <span class="ui-pc__sub">
              <button
                type="button"
                class="ui-pc__status"
                data-tone=${statusNow?.tone ?? "gray"}
                aria-expanded=${this.choosing ? "true" : "false"}
                aria-controls="${this.uid}-status"
                tabindex=${this.open ? 0 : -1}
                @click=${() => (this.choosing ? this.closePicker() : (this.choosing = true))}
              >
                <span class="ui-pc__tag">${statusNow?.icon ? statusNow.icon.cloneNode(true) : toneIcon(look, statusNow?.tone ?? "gray")}${statusNow?.label}</span>
              </button>
              ${due ? html`<span class="ui-pc__due"><span class="ui-pc__due-word">Due </span>${due}</span>` : nothing}
            </span>
          </span>
          ${this.members.length > 0 ? this.people(person) : nothing}
        </div>
        <div id="${this.uid}-body" class="ui-pc__fold" .inert=${!this.open}>
          <div class="ui-pc__body">
            ${this.picker(statusNow?.id, look)} ${list.length > 0 ? this.taskList(list, theirs) : nothing}
          </div>
        </div>
        ${look === "clean" ? tray : nothing}
      </div>
      ${look !== "clean" ? tray : nothing}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pc"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="pc"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pc"] {
  /* The progress ring's open segments */
  --tc-project-card-track: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  --tc-project-card-track-hover: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.26));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="pc"] *, [data-ui="pc"] *::before, [data-ui="pc"] *::after { box-sizing: border-box; }
:where([data-ui="pc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="pc"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="pc"]) svg { display: block; flex: none; }
.ui-pc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
[data-ui="pc"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* Status tags: the status and tone tokens – coloured text on a tint of the same colour */
[data-ui="pc"] [data-tone="red"] { --tc-project-card-tag-fg: var(--tc-status-danger-fg); --tc-project-card-tag-bg: var(--tc-status-danger-bg); }
[data-ui="pc"] [data-tone="amber"] { --tc-project-card-tag-fg: var(--tc-tone-amber-fg); --tc-project-card-tag-bg: var(--tc-tone-amber-bg); }
[data-ui="pc"] [data-tone="green"] { --tc-project-card-tag-fg: var(--tc-status-success-fg); --tc-project-card-tag-bg: var(--tc-status-success-bg); }
[data-ui="pc"] [data-tone="blue"] { --tc-project-card-tag-fg: var(--tc-status-info-fg); --tc-project-card-tag-bg: var(--tc-status-info-bg); }
[data-ui="pc"] [data-tone="violet"] { --tc-project-card-tag-fg: var(--tc-tone-violet-fg); --tc-project-card-tag-bg: var(--tc-tone-violet-bg); }
[data-ui="pc"] [data-tone="gray"] { --tc-project-card-tag-fg: var(--tc-text-secondary); --tc-project-card-tag-bg: var(--tc-fill-default); }
/* The card recipe */
.ui-pc__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
/* Everything that opens does it the same quiet way: it unfolds and fades, nothing travels */
.ui-pc__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-emphasized), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-pc__fold > * { min-height: 0; overflow: hidden; }
[data-ui="pc"][data-open] > .ui-pc__fold,
[data-ui="pc"][data-open] > .ui-pc__card > .ui-pc__fold,
.ui-pc__fold--status[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-emphasized), opacity var(--tc-duration-slower) var(--tc-ease-standard) var(--tc-duration-quick); }
/* ----- Head: the same in both states ----- */
.ui-pc__head { position: relative; display: flex; align-items: center; gap: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__head { padding: var(--tc-space-2-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__head { padding: var(--tc-space-3); }
.ui-pc__toggle { position: absolute; inset: 0; border-radius: var(--tc-card-radius); }
.ui-pc__head > :not(.ui-pc__toggle) { position: relative; pointer-events: none; }
[data-ui="pc"][data-open] :is(.ui-pc__status, .ui-pc__member), .ui-pc__progress[data-live] .ui-pc__seg { pointer-events: auto; }
.ui-pc__progress { display: grid; flex: none; place-items: center; width: 32px; height: 32px; }
.ui-pc__progress > * { grid-area: 1 / 1; }
.ui-pc__seg { fill: none; stroke-width: 3; stroke-linecap: round; cursor: pointer; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard), stroke-width var(--tc-duration-moderate) var(--tc-ease-emphasized), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg { stroke: var(--tc-border-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-done] { stroke: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-hot] { stroke-width: 4.5; stroke: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-done][data-hot] { stroke: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg { stroke: var(--tc-project-card-track); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-done] { stroke: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-hot] { stroke-width: 4.25; stroke: var(--tc-project-card-track-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-done][data-hot] { stroke: var(--tc-accent); }
.ui-pc__seg[data-dim] { opacity: 0.3; }
.ui-pc__num { font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; pointer-events: none; animation: ui-pc-num var(--tc-duration-slow) var(--tc-ease-emphasized) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__num { font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__num { font-size: var(--tc-font-size-sm); color: var(--tc-text-strong); }
.ui-pc__titles { display: grid; grid-template-columns: minmax(0, 1fr); flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__name { overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
/* The sub line keeps its 20px; the status button inside reaches 2px above and below it (a 24px target) */
.ui-pc__sub { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: 24px; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__sub { margin: -1px 0 -2px; line-height: var(--tc-line-height-normal); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__sub { margin: -2px 0; line-height: var(--tc-line-height-tight); }
.ui-pc__status { display: inline-flex; flex: none; align-items: center; height: 24px; }
/* The tag: the pill recipe in the tone's colours */
.ui-pc__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px) 0 calc(var(--tc-pill-px) - 2px); border-radius: var(--tc-radius-badge); background: var(--tc-project-card-tag-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-project-card-tag-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tag { gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tag { gap: var(--tc-space-1); }
[data-ui="pc"][data-open] .ui-pc__status:hover .ui-pc__tag,
.ui-pc__status[aria-expanded="true"] .ui-pc__tag { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-project-card-tag-fg) 40%, transparent); }
.ui-pc__due { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* People: hover one to see only their subtasks, click to keep it – 24px targets side by side */
.ui-pc__people { display: flex; flex: none; }
.ui-pc__member { position: relative; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; transition: transform var(--tc-duration-moderate) var(--tc-ease-emphasized), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__member[data-on] { z-index: 1; transform: scale(1.12); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__member[data-on] { z-index: 1; transform: scale(1.1); }
.ui-pc__member[data-off] { opacity: 0.4; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__member[aria-pressed="true"] .ui-pc__avatar { box-shadow: 0 0 0 1.5px var(--tc-surface-raised), 0 0 0 3px var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__member[aria-pressed="true"] .ui-pc__avatar { box-shadow: 0 0 0 1.5px var(--tc-surface-raised), 0 0 0 2.5px var(--tc-accent); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__avatar {
  --tc-project-card-avatar-bg: light-dark(hsl(var(--tc-project-card-hue) 70% 90%), hsl(var(--tc-project-card-hue) 30% 26%));
  --tc-project-card-avatar-fg: light-dark(hsl(var(--tc-project-card-hue) 45% 34%), hsl(var(--tc-project-card-hue) 70% 82%));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pc__avatar {
  --tc-project-card-avatar-bg: light-dark(hsl(var(--tc-project-card-hue) 60% 92%), hsl(var(--tc-project-card-hue) 26% 26%));
  --tc-project-card-avatar-fg: light-dark(hsl(var(--tc-project-card-hue) 40% 36%), hsl(var(--tc-project-card-hue) 60% 82%));
}
.ui-pc__avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tc-avatar-sm);
  height: var(--tc-avatar-sm);
  overflow: hidden;
  border-radius: 50%;
  background: var(--tc-project-card-avatar-bg);
  box-shadow: 0 0 0 1.5px var(--tc-surface-raised);
  font-size: var(--tc-avatar-font-size);
  font-weight: var(--tc-avatar-font-weight);
  line-height: var(--tc-line-height-none);
  color: var(--tc-project-card-avatar-fg);
  transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-pc__avatar img { width: 100%; height: 100%; object-fit: cover; }
/* ----- Body ----- */
.ui-pc__body { padding: 0 var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__options { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); padding-bottom: var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: 24px; padding: 0 var(--tc-space-2) 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-project-card-tag-bg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-project-card-tag-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option:hover { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-project-card-tag-fg) 40%, transparent); }
/* The chosen status: a full-strength edge in its colour (≥ 3:1), not only a deeper tint */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option[aria-checked="true"] { box-shadow: inset 0 0 0 1px var(--tc-project-card-tag-fg); }
/* Status options: the switch-chip look – a soft fill and the selected edge mark the chosen one */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__options { display: flex; gap: var(--tc-space-1); margin: -2px -12px 0; padding: var(--tc-space-1) var(--tc-space-3) var(--tc-space-3); overflow-x: auto; scrollbar-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__options::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: 24px; padding: var(--tc-space-0-5) var(--tc-space-2) var(--tc-space-0-5) var(--tc-space-1-5); border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-quick) var(--tc-ease-decelerate), color var(--tc-duration-quick) var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option svg { color: var(--tc-project-card-tag-fg); }
/* A small square in the tone's color – the full icon sits on the chosen tag in the head */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__dot { flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-2xs); background: var(--tc-project-card-tag-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option[aria-checked="true"] { background: var(--tc-fill-default); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-pc__tasks { margin: 0; border-top: var(--tc-hairline) solid var(--tc-divider); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tasks { padding: var(--tc-space-2) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tasks { padding: var(--tc-space-1-5) 0; }
.ui-pc__task { display: flex; align-items: center; width: calc(100% + 12px); margin: 0 -6px; padding: 0 var(--tc-space-1-5); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__task { gap: var(--tc-space-2); height: 30px; border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__task[data-hot] { background: var(--tc-fill-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__task { gap: var(--tc-space-2-5); height: 32px; border-radius: var(--tc-radius-sm); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__task[data-hot] { background: var(--tc-fill-subtle); }
.ui-pc__task[data-dim] { opacity: 0.35; }
.ui-pc__label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-pc__task .ui-pc__avatar { width: 18px; height: 18px; font-size: 8px; opacity: 0; transform: translateX(4px); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-emphasized); }
.ui-pc__task:is([data-hot], :focus-visible) .ui-pc__avatar { opacity: 1; transform: none; }
/* The checkbox: its ring is a control edge (≥ 3:1); ticked, it fills – ink in Standard, the accent in Clean */
.ui-pc__ring { fill: none; stroke: var(--tc-border-control); transition: stroke var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__ring { stroke-width: 1.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__ring { stroke-width: 1.1; }
.ui-pc__task[data-hot] .ui-pc__ring { stroke: var(--tc-border-control-hover); }
.ui-pc__disc { transform-origin: 8px 8px; transform: scale(0); transition: transform var(--tc-duration-slow) var(--tc-ease-emphasized); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__disc { fill: var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__disc { fill: var(--tc-accent); }
.ui-pc__tick { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 9; stroke-dashoffset: 9; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-emphasized) 80ms; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tick { stroke: var(--tc-text-on-inverse); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tick { stroke: var(--tc-text-on-accent); stroke-width: 1.5; }
.ui-pc__task[aria-checked="true"] .ui-pc__disc { transform: scale(1); }
.ui-pc__task[aria-checked="true"] .ui-pc__tick { stroke-dashoffset: 0; }
.ui-pc__task[aria-checked="true"] { color: var(--tc-text-muted); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__foot { display: flex; align-items: center; gap: var(--tc-space-2); height: 38px; padding: var(--tc-space-1) var(--tc-space-1) 0 var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-pc__caption > span { display: inline-block; animation: ui-pc-in var(--tc-duration-moderate) var(--tc-ease-emphasized) both; }
/* Standard: a ghost button on the tray, like Button's ghost */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__action { display: inline-flex; align-items: center; gap: var(--tc-space-1); flex: none; height: var(--tc-control-h-sm); padding: 0 calc(var(--tc-control-px-sm) - 2px) 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__action:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-pc__action svg { transition: transform var(--tc-duration-base) var(--tc-ease-emphasized); }
/* ----- The last row inside the card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__foot { display: flex; align-items: center; gap: var(--tc-space-2); height: 44px; padding: 0 var(--tc-space-2) 0 var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* Clean: the primary action, like Button's primary */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action { display: inline-flex; align-items: center; gap: var(--tc-space-1); flex: none; height: var(--tc-control-h-md); padding: 0 calc(var(--tc-control-px-md) - 3px) 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); line-height: var(--tc-line-height-normal); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action:hover { background: var(--tc-action-primary-bg-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action:active { background: var(--tc-action-primary-bg-active); }
.ui-pc__action:hover svg { transform: translateX(2px); }
@keyframes ui-pc-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-pc-num { from { opacity: 0; transform: scale(0.8); } }
/* Narrow cards (small phones, tight columns): the date loses its word, so nothing is cut */
@container (max-width: 290px) {
  .ui-pc__due-word { display: none; }
  [data-ui="pc"] .ui-pc__head { gap: var(--tc-space-2); }
  [data-ui="pc"] .ui-pc__sub { gap: var(--tc-space-1); }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__head { padding: var(--tc-space-2-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__body { padding: 0 var(--tc-space-2-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__options { margin: -2px -10px 0; padding: var(--tc-space-1) var(--tc-space-2-5) var(--tc-space-2-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__option { padding: var(--tc-space-0-5) var(--tc-space-1-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__dot { display: none; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__foot { padding: 0 var(--tc-space-2) 0 var(--tc-space-2-5); }
}
@media (pointer: coarse) {
  .ui-pc__task .ui-pc__avatar { opacity: 1; transform: none; }
  :where([data-look="standard"], [data-look="standard"] *).ui-pc__task { height: 36px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-pc__option { height: 30px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-pc__action { height: 30px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__task { height: 38px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__option { height: 32px; padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__foot { height: 52px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__action { height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="pc"] *, [data-ui="pc"] *::before, [data-ui="pc"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-project-card")) customElements.define("tc-project-card", TcProjectCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-project-card": TcProjectCard;
  }
}
