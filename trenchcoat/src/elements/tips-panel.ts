import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-tips-panel> – the Lit port of src/components/tips-panel.tsx: a panel of short tips, each with one action, in a
 * gray tray with a white card. Taking an action marks the tip as done; the list scrolls inside the white card.
 * Clean drops the gray tray: one white card with a hairline shadow, quieter tip tiles and a green done check.
 *
 *   <tc-tips-panel heading="Tips" .tips=${[{ id: "a", title: "Daily digest", description: "…", action: "Turn on" }]}>
 *   </tc-tips-panel>
 *
 * The host is the region (role="region", named by the heading). Taking an action moves focus onto the tip's Done
 * mark, and one persistent status line says which tip was done and the new count.
 */

export type TipsPanelTip = {
  id: string;
  title: string;
  /** Short explanation – text, or a node (cloned) that may hold <kbd class="ui-tp__kbd"> keys */
  description: string | Node;
  /** Button text */
  action: string;
  /** Text after the action was taken, e.g. "Enabled" */
  doneLabel?: string;
  /** Shows the action as the dark button – use once for the most important tip */
  primary?: boolean;
};

export type TipsPanelDoneChange = { done: string[]; tip: TipsPanelTip };

const checkIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${look === "clean"
    ? svg`<circle cx="8" cy="8" r="6.5" fill="currentColor"></circle><path d="m5.6 8.1 1.7 1.7 3.2-3.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></path>`
    : svg`<circle cx="8" cy="8" r="7" fill="currentColor"></circle><path d="m5 8.2 2 2 4-4.2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;

/**
 * A panel of short tips, each with one action that marks it done.
 * @tag tc-tips-panel
 * @fires tc-done-change - A tip's action was taken; detail `{ done: string[], tip }` is the new list of done ids. Cancelable: preventDefault() keeps `done` as it is (controlled use)
 * @fires tc-tip-action - A tip's action was taken; detail `{ id: string }`
 * @fires tc-close - The Close button was pressed
 */
export class TcTipsPanel extends TcElement {
  static override ui = "tp";

  /** The heading, and the region's name */
  @property() accessor heading = "Tips";
  @property({ attribute: false }) accessor tips: TipsPanelTip[] = [];
  /** Ids of the tips whose action was taken */
  @property({ attribute: false }) accessor done: string[] = [];
  /** Shows the Close button in the footer */
  @property({ type: Boolean }) accessor closable = false;
  @property({ attribute: "close-label" }) accessor closeLabel = "Close";

  /** @internal One persistent status line: which tip was done and the new count */
  @state() accessor status = "";

  /** The page named the region itself (aria-label or aria-labelledby on the host) */
  private ownName = false;

  constructor() {
    super();
    // The action turns into its Done mark (same data-focus-key): focus moves onto it, not to <body>
    new FocusRescueController(this);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "-1");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  protected override updated() {
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
  }

  private take(tip: TipsPanelTip, doneCount: number) {
    const next = this.done.includes(tip.id) ? this.done : [...this.done, tip.id];
    if (this.emit<TipsPanelDoneChange>("tc-done-change", { done: next, tip }, { cancelable: true })) this.done = next;
    this.status = `${tip.title}: ${tip.doneLabel ?? "Done"}. ${doneCount + 1} of ${this.tips.length} done.`;
    this.emit("tc-tip-action", { id: tip.id });
  }

  protected override render() {
    const look = this.resolvedLook;
    const done = new Set(this.done);
    const doneCount = this.tips.filter((t) => done.has(t.id)).length;
    return html`
      <header class="ui-tp__head">
        <h3 class="ui-tp__title">${this.heading}</h3>
        <span class="ui-tp__count">${doneCount}/${this.tips.length} done</span>
      </header>
      <div class="ui-tp__card">
        <ul class="ui-tp__grid">
          ${this.tips.map((tip, i) => {
            const isDone = done.has(tip.id);
            return html`<li class="ui-tp__tip" ?data-done=${isDone} style=${styleMap({ animationDelay: `${80 + i * 50}ms` })}>
              <p class="ui-tp__tip-title">${tip.title}</p>
              <p class="ui-tp__tip-text">${typeof tip.description === "string" ? tip.description : tip.description.cloneNode(true)}</p>
              ${isDone
                ? html`<span class="ui-tp__done" tabindex="-1" data-focus-key=${`tip-${tip.id}`}>${checkIcon(look)}${tip.doneLabel ?? "Done"}</span>`
                : html`<button type="button" class=${tip.primary ? "ui-tp__btn ui-tp__btn--primary" : "ui-tp__btn"} data-focus-key=${`tip-${tip.id}`} @click=${() => this.take(tip, doneCount)}>${tip.action}</button>`}
            </li>`;
          })}
        </ul>
      </div>
      <span class="ui-tp__sr" role="status">${this.status}</span>
      ${this.closable
        ? html`<footer class="ui-tp__foot"><button type="button" class="ui-tp__btn" @click=${() => this.emit("tc-close", null)}>${this.closeLabel}</button></footer>`
        : nothing}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tp"] {
  /* Height of the tip list before it scrolls */
  --tc-tips-panel-max-height: 420px;
  box-sizing: border-box;
  width: 100%;
  max-width: 760px;
  /* Like the Chat Composer: a gray tray with heading and footer, the white card sits on top of it */
  background: var(--tc-surface-tray);
  /* The gray tray frames the white card on every side */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="tp"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tp"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  /* Height of the tip list before it scrolls */
  --tc-tips-panel-max-height: 420px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="tp"] *, [data-ui="tp"] *::before, [data-ui="tp"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where([data-ui="tp"]) button { margin: 0; font: inherit; cursor: pointer; }
:where([data-look="standard"], [data-look="standard"] *).ui-tp__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--tc-space-3);
  padding: var(--tc-space-3) var(--tc-space-5) var(--tc-space-3);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__title {
  margin: 0;
  font-size: var(--tc-font-size-xl);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-relaxed);
  letter-spacing: -0.01em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__count {
  font-size: var(--tc-font-size-md);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__card {
  container-type: inline-size;
  max-height: var(--tc-tips-panel-max-height);
  overflow-y: auto;
  scrollbar-width: thin;
  background: var(--tc-surface-on-tray);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--tc-space-3);
  margin: 0;
  padding: var(--tc-space-3-5);
  list-style: none;
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="tp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="tp"] button:focus-visible,
.ui-tp__done:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="tp"]) svg { display: block; flex: none; }
/* ----- Head ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  padding: var(--tc-space-3) var(--tc-space-4);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__title {
  margin: 0;
  font-size: var(--tc-font-size-lg-plus);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-loose);
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__count {
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
  white-space: nowrap;
}
/* ----- The tip list: the only part that scrolls (Clean: no card of its own) ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__card {
  container-type: inline-size;
  max-height: var(--tc-tips-panel-max-height);
  overflow-y: auto;
  scrollbar-width: thin;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--tc-space-2);
  margin: 0;
  padding: var(--tc-space-3);
  list-style: none;
}
@container (max-width: 560px) { .ui-tp__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (max-width: 380px) { .ui-tp__grid { grid-template-columns: minmax(0, 1fr); } }
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5);
  border: 1px solid var(--tc-border-default);
  border-radius: var(--tc-radius-xl);
  animation: ui-tp-in var(--tc-duration-slower) var(--tc-ease-move) both;
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), border-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip[data-done] { background: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip-title {
  margin: 0;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip-text {
  flex: 1;
  margin: var(--tc-space-1-5) 0 var(--tc-space-3-5);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
}
/* Each tip is a quiet tile: a hairline drawn as an inset shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
  animation: ui-tp-in var(--tc-duration-slower) var(--tc-ease-move) both;
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip[data-done] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip-title {
  margin: 0;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip-text {
  flex: 1;
  margin: var(--tc-space-0-5) 0 var(--tc-space-3);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
}
/* Secondary: white with the card shadow */
/* Key chip: the kbd pattern */
.ui-tp__kbd {
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
  font-weight: var(--tc-kbd-font-weight);
  line-height: var(--tc-line-height-none);
  color: var(--tc-kbd-fg);
  vertical-align: 1px;
}
/* Actions look exactly like Button: secondary by default, primary (flat ink) for the one important tip */
.ui-tp__btn {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-secondary-fg);
  white-space: nowrap;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-tp__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tp__btn--primary {
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
  color: var(--tc-action-primary-fg);
}
.ui-tp__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-tp__btn--primary:active { background: var(--tc-action-primary-bg-active); }
.ui-tp__btn:active { transform: scale(0.98); }
.ui-tp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-tp__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-accent-text);
  animation: ui-tp-pop var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tp__foot { padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tp"]:not(:has(.ui-tp__foot)) { padding-bottom: var(--tc-space-2); }
/* Primary: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-accent-text);
  animation: ui-tp-pop var(--tc-duration-slow) var(--tc-ease-move);
}
/* ----- The last row inside the card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-tp__foot {
  display: flex;
  justify-content: flex-end;
  padding: var(--tc-space-2);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
@keyframes ui-tp-in {
  from { opacity: 0; transform: translateY(4px); }
}
@keyframes ui-tp-pop {
  from { opacity: 0; transform: scale(0.94); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-tp__tip,
:where([data-look="standard"], [data-look="standard"] *).ui-tp__done { animation: none; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-tp__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-tp__done { height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip,
:where([data-look="clean"], [data-look="clean"] *).ui-tp__done { animation: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-tp__tip,
:where([data-look="clean"], [data-look="clean"] *).ui-tp__btn { transition: none; }
}
`;
}

if (!customElements.get("tc-tips-panel")) customElements.define("tc-tips-panel", TcTipsPanel);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tips-panel": TcTipsPanel;
  }
}
