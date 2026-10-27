import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-smart-recommendation> – the Lit port of src/components/smart-recommendation.tsx: a suggestion card with a
 * confidence signal, alternatives and one-click accept. Fold it away, pick an alternative instead, accept and undo.
 * Clean drops the tray: one white card with hairline shadows, a solid blue sparkle as the mark, the signal and the
 * actions in the card's last row, and thin icons on the Alternatives and Undo buttons.
 *
 *   <tc-smart-recommendation heading="Recommended" .options=${options}></tc-smart-recommendation>
 *
 * The host is the region (role="region", named by the heading).
 */

export type Recommendation = {
  id: string;
  /** Short name, used in the accept button, e.g. "Incremental sync" */
  label: string;
  /** One sentence why – text, or an element (cloned) */
  reason: string | Element;
  /** 0 = no signal, 1 = weak, 2 = good, 3 = strong */
  signal: 0 | 1 | 2 | 3;
};
/** Accepts or takes back an option; a promise keeps the button pending until it settles */
export type RecommendationAction = (option: Recommendation) => void | Promise<unknown>;

const isPromise = (value: unknown): value is Promise<unknown> => !!value && typeof (value as Promise<unknown>).then === "function";
const signalText = ["No signal", "Weak signal", "Good signal", "Strong signal"];
let uidCount = 0;

/* The header's icon: a sparkle with a small one beside it */
const sparkIcon = svg`<path d="M10 3.5c.5 3.6 2 5.1 5.6 5.6-3.6.5-5.1 2-5.6 5.6-.5-3.6-2-5.1-5.6-5.6 3.6-.5 5.1-2 5.6-5.6Z"></path><path d="M18 14v6M15 17h6"></path>`;
/** Line icons – Clean draws them thinner */
const icon = (d: string, clean: boolean, size = 16) =>
  html`<svg viewBox="0 0 16 16" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width=${clean ? "1.1" : "1.5"} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

/**
 * A suggestion with a confidence signal, alternatives and one-click accept and undo.
 * @tag tc-smart-recommendation
 * @fires tc-value-change - An option was picked from the Alternatives menu, or a new set of options went back to the recommendation ({ value: string, reset: boolean }); cancelable
 * @fires tc-accepted-change - An option was accepted, or the acceptance taken back ({ accepted: string | null, reset: boolean }); cancelable
 * @fires tc-open-change - The reason was folded or unfolded ({ open: boolean }); cancelable
 */
export class TcSmartRecommendation extends TcElement {
  static override ui = "sr";

  /** The heading, and the region's name */
  @property() accessor heading = "Smart recommendation";
  /** The first entry is the recommendation, the rest are offered as alternatives. A new set starts over */
  @property({ attribute: false }) accessor options: Recommendation[] = [];
  /** Id of the option on show; empty shows the recommendation */
  @property() accessor value = "";
  /** Id of the accepted option, or null */
  @property({ attribute: false }) accessor accepted: string | null = null;
  /** Whether the reason is unfolded */
  @property({ type: Boolean }) accessor open = true;
  /** Called to accept an option; a returned promise keeps the button pending, a rejection says so */
  @property({ attribute: false }) accessor acceptOption: RecommendationAction | undefined = undefined;
  /** Called to take an acceptance back, like acceptOption */
  @property({ attribute: false }) accessor undoOption: RecommendationAction | undefined = undefined;

  @state() private accessor menu = false;
  @state() private accessor pending = false;
  @state() private accessor failed: string | null = null;

  private menuId = `tc-sr-${++uidCount}-menu`;
  private whyId = `tc-sr-${uidCount}-why`;
  private optionsKey: string | null = null;
  /** The page named the region itself (aria-label or aria-labelledby on the host) */
  private ownName = false;

  constructor() {
    super();
    // Accept ⇄ Undo swap their buttons and a pick closes the menu: focus lands on the action that is there now
    new FocusRescueController(this, () => this.querySelector(".ui-sr__btn--primary") ?? this.querySelector(".ui-sr__actions .ui-sr__btn") ?? this.querySelector(".ui-sr__toggle"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pointerdown", this.away);
  }

  private get current(): Recommendation | undefined {
    return this.options.find((o) => o.id === this.value) ?? this.options[0];
  }

  private setValue(next: string, reset = false) {
    if (next === this.value) return;
    if (this.emit("tc-value-change", { value: next, reset }, { cancelable: true })) this.value = next;
  }
  private setAccepted(next: string | null, reset = false) {
    if (next === this.accepted) return;
    if (this.emit("tc-accepted-change", { accepted: next, reset }, { cancelable: true })) this.accepted = next;
  }
  private setOpen(next: boolean) {
    if (this.emit("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private trigger = () => this.querySelector<HTMLElement>(".ui-sr__alt [aria-haspopup]");
  private items = () => [...this.querySelectorAll<HTMLElement>('.ui-sr__alt [role="menuitemradio"]')];
  /** Closes the menu; focus goes back to its trigger when it was inside (the menu pattern) */
  private closeMenu(refocus = true) {
    if (refocus) rescueFocus(this.querySelector('.ui-sr__alt [role="menu"]'), [this.trigger()]);
    this.menu = false;
  }
  private away = (e: PointerEvent) => {
    if (!this.querySelector(".ui-sr__alt")?.contains(e.target as Node)) this.menu = false;
  };

  private onMenuKey(e: KeyboardEvent) {
    const list = this.items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const to = e.key === "ArrowDown" ? (at + 1) % list.length : e.key === "ArrowUp" ? (at - 1 + list.length) % list.length : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : -1;
    if (to >= 0) {
      e.preventDefault();
      list[to]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu();
    } else if (e.key === "Tab") this.closeMenu(false);
  }

  // Accept and Undo: a promise keeps the button pending; a rejection is reported and leaves things as they were
  private run(work: () => unknown, apply: () => void, what: string) {
    if (this.pending) return;
    this.failed = null;
    const result = work();
    if (!isPromise(result)) return apply();
    this.pending = true;
    result.then(
      () => {
        if (!this.isConnected) return;
        this.pending = false;
        apply();
      },
      () => {
        if (!this.isConnected) return;
        this.pending = false;
        this.failed = `Couldn't ${what}. Try again.`;
      },
    );
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A new set of options starts over: back to the recommendation, nothing accepted (unless the page prevents it)
    const key = this.options.map((o) => o.id).join("\u0000");
    if (this.optionsKey !== null && this.optionsKey !== key) {
      this.setValue(this.options[0]?.id ?? "", true);
      this.setAccepted(null, true);
      this.menu = false;
      this.failed = null;
    }
    this.optionsKey = key;
    const current = this.current;
    this.toggleAttribute("data-accepted", !!current && this.accepted === current.id);
  }

  protected override updated(changed: PropertyValues) {
    // The heading names the region unless the page gave it a name of its own
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    if (changed.has("menu")) {
      if (this.menu) {
        window.addEventListener("pointerdown", this.away);
        // Opening moves focus into the menu, onto the option on show
        const list = this.items();
        (list.find((el) => el.getAttribute("aria-checked") === "true") ?? list[0])?.focus();
      } else window.removeEventListener("pointerdown", this.away);
    }
  }

  private renderMenu(chosen: string, clean: boolean) {
    return html`<div class="ui-sr__alt">
      <button
        type="button"
        class=${clean ? "ui-sr__btn ui-sr__btn--icon" : "ui-sr__btn"}
        aria-haspopup="menu"
        aria-expanded=${this.menu ? "true" : "false"}
        aria-controls=${ifDefined(this.menu ? this.menuId : undefined)}
        @click=${() => (this.menu = !this.menu)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            this.menu = true;
          } else if (e.key === "Escape" && this.menu) this.closeMenu();
        }}
      >
        ${clean ? icon("M5 12.5v-9M2.75 5.75 5 3.5l2.25 2.25M11 3.5v9M8.75 10.25 11 12.5l2.25-2.25", true) : nothing}Alternatives
      </button>
      ${this.menu
        ? html`<div class="ui-sr__menu" role="menu" id=${this.menuId} aria-label="Alternatives" @keydown=${this.onMenuKey}>
            ${this.options.map(
              (o, i) => html`<button
                type="button"
                role="menuitemradio"
                aria-checked=${o.id === chosen ? "true" : "false"}
                tabindex="-1"
                class="ui-sr__option"
                @click=${() => {
                  this.setValue(o.id);
                  this.closeMenu();
                  if (!this.open) this.setOpen(true);
                }}
              >
                <span class="ui-sr__option-label">
                  <span class="ui-sr__option-name">${o.label}</span>
                  ${i === 0 ? html`<span class="ui-sr__tag">Recommended</span>` : nothing}
                </span>
                <svg class="ui-sr__check" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="m4 8.25 2.6 2.6L12 5.25"></path>`}</svg>
                <span class="ui-sr__mini" data-level=${o.signal}>
                  ${[1, 2, 3].map((n) => html`<span ?data-on=${o.signal >= n} aria-hidden="true"></span>`)}
                  <span class="ui-sr__sr">${`, ${signalText[o.signal]}`}</span>
                </span>
              </button>`,
            )}
          </div>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const current = this.current;
    const chosen = current?.id ?? "";
    const isRecommended = !current || current.id === this.options[0]?.id;
    const done = !!current && this.accepted === current.id;
    const signal = current?.signal ?? 0;
    const busy = this.pending ? "true" : null;

    // The header (.tc-head): on the tray in Standard, the card's first row in Clean. "Alternative" and the fold at the right
    const head = cardHead({
      icon: sparkIcon,
      title: this.heading,
      aside: html`${!isRecommended ? html`<span class="ui-sr__pill">Alternative</span>` : nothing}<button
          type="button"
          class="ui-sr__toggle"
          aria-label="Why"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls=${this.whyId}
          @click=${() => this.setOpen(!this.open)}
        >
          <span class="ui-sr__chevron">${icon("m4.5 6.25 3.5 3.5 3.5-3.5", clean)}</span>
        </button>`,
    });
    const reason = current ? (typeof current.reason === "string" ? current.reason : current.reason.cloneNode(true)) : "No recommendation right now.";
    const body = html`<div class="ui-sr__body" id=${this.whyId} data-open=${ifDefined(this.open ? "true" : undefined)} .inert=${!this.open}>
      ${keyed(current?.id, html`<p class="ui-sr__reason">${reason}</p>`)}
    </div>`;

    return html`
      ${head}${clean ? body : html`<div class="ui-sr__card" ?data-open=${this.open}>${body}</div>`}
      <footer class="ui-sr__foot">
        ${this.failed
          ? html`<span class="ui-sr__signal ui-sr__error" role="alert">${this.failed}</span>`
          : html`<span class="ui-sr__signal" data-level=${signal} title=${signalText[signal]}>
              <span class="ui-sr__bars" aria-hidden="true">${[1, 2, 3].map((n) => html`<span ?data-on=${signal >= n}></span>`)}</span>${signalText[signal]}
            </span>`}
        <div class="ui-sr__actions">
          ${current && this.options.length > 1 && !done ? this.renderMenu(chosen, clean) : nothing}
          ${!current
            ? nothing
            : done
              ? html`<span class="ui-sr__done" role="status">${icon("m3.5 8.5 3 3 6-7", clean, clean ? 16 : 14)}<span class="ui-sr__done-text">${current.label} accepted</span></span>
                  <button
                    type="button"
                    class=${clean ? "ui-sr__btn ui-sr__btn--icon" : "ui-sr__btn"}
                    .ariaBusy=${busy}
                    .ariaDisabled=${busy}
                    @click=${() => this.run(() => this.undoOption?.(current), () => this.setAccepted(null), "undo")}
                  >
                    ${clean ? icon("M3.5 6.5h6.25a2.75 2.75 0 0 1 0 5.5H8M5.75 4.25 3.5 6.5l2.25 2.25", true) : nothing}Undo
                  </button>`
              : html`<button
                  type="button"
                  class="ui-sr__btn ui-sr__btn--primary"
                  .ariaBusy=${busy}
                  .ariaDisabled=${busy}
                  @click=${() => {
                    this.menu = false;
                    this.run(() => this.acceptOption?.(current), () => this.setAccepted(current.id), "accept it");
                  }}
                >
                  Accept ${current.label.toLowerCase()}
                </button>`}
        </div>
      </footer>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sr"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 440px;
  container-type: inline-size;
  /* Like the Chat Composer: the white card on a gray tray, the actions live in the tray below */
  background: var(--tc-surface-sunken);
  /* The gray tray frames the white card on every side – the tray recipe */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="sr"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sr"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 440px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="sr"] *, [data-ui="sr"] *::before, [data-ui="sr"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *):where([data-ui="sr"]) button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
[data-ui="sr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__card {
  /* The card on the tray; folded, it has nothing to show */
  background: var(--tc-surface-on-tray);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__card:not([data-open]) { box-shadow: none; }
/* The fold: a ghost icon button at the header's right */
.ui-sr__toggle { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); padding: 0; border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sr__toggle:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__pill {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-tone-violet-bg);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  color: var(--tc-tone-violet-fg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__chevron { display: grid; transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="sr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="sr"]) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__pill {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-pill-px-lg);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-tone-violet-bg);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-tone-violet-fg);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__chevron {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move);
}
.ui-sr__toggle[aria-expanded="false"] .ui-sr__chevron { transform: rotate(-90deg); }
.ui-sr__body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-sr__body[data-open] { grid-template-rows: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__reason {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--tc-space-4);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__body[data-open] .ui-sr__reason { padding-block: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__reason {
  min-height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--tc-space-4);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__body[data-open] .ui-sr__reason { padding-bottom: var(--tc-space-3-5); }
.ui-sr__reason strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__foot {
  display: flex;
  align-items: center;
  /* Narrow containers: the actions move below the signal instead of running out of the tray */
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--tc-space-2) var(--tc-space-2-5);
  min-height: 50px;
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__signal {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  font-size: var(--tc-font-size-md);
  white-space: nowrap;
  color: var(--tc-text-muted);
}
/* The last row: the signal on the left, the actions on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__foot {
  display: flex;
  align-items: center;
  /* Narrow cards: the actions move below the signal instead of running out of the card */
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--tc-space-2) var(--tc-space-2-5);
  min-height: 48px;
  padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__signal {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  color: var(--tc-text-secondary);
}
/* A failed accept or undo takes the signal's place until the next try */
.ui-sr__signal.ui-sr__error { color: var(--tc-status-danger-fg); white-space: normal; }
.ui-sr__bars, .ui-sr__mini { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span {
  width: 3px;
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-border-strong);
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(1),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(1) { height: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(2),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(2) { height: 9px; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__bars span:nth-child(3),
:where([data-look="standard"], [data-look="standard"] *).ui-sr__mini span:nth-child(3) { height: 12px; }
:where([data-look="standard"], [data-look="standard"] *) [data-level="1"] span[data-on] { background: var(--tc-status-warning-solid); }
:where([data-look="standard"], [data-look="standard"] *) [data-level="2"] span[data-on] { background: var(--tc-accent); }
:where([data-look="standard"], [data-look="standard"] *) [data-level="3"] span[data-on] { background: var(--tc-status-success-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__signal[data-level="0"] .ui-sr__bars span:first-child { background: var(--tc-icon-muted); }
/* The actions wrap and shrink instead of running out of the card at 320px */
.ui-sr__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--tc-space-1-5); min-width: 0; max-width: 100%; margin-left: auto; }
/* Secondary and primary: exactly like Button – the control geometry, flat ink for the primary (decision 1) */
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn {
  max-width: 100%;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  overflow: hidden;
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size) !important;
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-sr__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn:active { transform: scale(0.98); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__btn--primary {
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
  color: var(--tc-action-primary-fg) !important;
}
.ui-sr__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-sr__btn--primary:active { background: var(--tc-action-primary-bg-active); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  padding-right: var(--tc-space-1);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-status-success-fg);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span {
  width: 3px;
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-fill-strong);
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(1),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(1) { height: 5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(2),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(2) { height: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__bars span:nth-child(3),
:where([data-look="clean"], [data-look="clean"] *).ui-sr__mini span:nth-child(3) { height: 11px; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sr"] [data-level="1"] span[data-on] { background: var(--tc-status-warning-solid); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sr"] [data-level="2"] span[data-on] { background: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sr"] [data-level="3"] span[data-on] { background: var(--tc-status-success-solid); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sr"] :is([data-level="0"], [data-level="0"] .ui-sr__bars) > span:first-child:not(.ui-sr__bars) { background: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__actions { gap: var(--tc-space-2); }
/* Secondary: white with the card's hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  max-width: 100%;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  overflow: hidden;
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-ui="sr"]) :where([data-look="clean"], [data-look="clean"] *).ui-sr__btn { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon { padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn[aria-expanded="true"] { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn:active { transform: scale(0.97); }
/* Primary: a dark chip */
:where([data-ui="sr"]) :where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
/* Accepted: a minimal green fill in the place of the button */
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  height: 28px;
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-status-success-bg);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-status-success-fg);
  animation: ui-sr-swap var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-sr__alt { position: relative; }
/* The menu pattern */
.ui-sr__menu {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  width: 260px;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-sr-drop var(--tc-duration-base) var(--tc-ease-move);
}
/* Narrow: the actions sit on their own row – the menu lines up with its right edge so it stays inside */
@container (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-sr__actions { position: relative; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__alt { position: static; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__menu { width: min(260px, 100cqw - 24px); }
}
:where([data-look="standard"], [data-look="standard"] *).ui-sr__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2-5);
  min-height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: transparent;
  font-size: var(--tc-menu-item-font-size) !important;
  text-align: left;
}
.ui-sr__option:hover { background: var(--tc-menu-item-hover); }
/* Selected: the accent text and a check (menu pattern) – not a faint fill alone */
.ui-sr__option[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); }
.ui-sr__check { flex: none; width: 16px; height: 16px; margin-left: auto; fill: none; stroke: var(--tc-menu-item-selected-fg); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
.ui-sr__option[aria-checked="true"] .ui-sr__check { opacity: 1; }
.ui-sr__option:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1) !important; }
.ui-sr__sr, .ui-sr__mini > .ui-sr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; background: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__option-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__tag { padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__menu { bottom: calc(100% + 6px); width: 248px; }
/* Narrow: the actions sit on their own row – the menu lines up with its right edge so it stays inside */
@container (max-width: 420px) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__actions { position: relative; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__alt { position: static; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__menu { width: min(248px, 100cqw - 20px); }
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2-5);
  height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  font-size: var(--tc-menu-item-font-size);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sr"] button.ui-sr__option:focus-visible { outline-offset: -2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__tag {
  flex: none;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-accent-subtle);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-accent-text);
}
@keyframes ui-sr-swap { from { opacity: 0; transform: translateY(2px); } }
@keyframes ui-sr-drop { from { opacity: 0; transform: translateY(4px) scale(0.98); } }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-sr__reason,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__done,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__menu { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sr__body,
:where([data-look="standard"], [data-look="standard"] *).ui-sr__chevron { transition: none; }
}
/* Narrow cards (phones) */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__reason { padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__foot { padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3-5); }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__toggle { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn { padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__btn--icon,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done { padding: 0 var(--tc-space-3-5) 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__option { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-sr__reason,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__done,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__menu,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__pill { animation: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-sr__body,
:where([data-look="clean"], [data-look="clean"] *).ui-sr__chevron { transition: none; }
}
`;
}

if (!customElements.get("tc-smart-recommendation")) customElements.define("tc-smart-recommendation", TcSmartRecommendation);

declare global {
  interface HTMLElementTagNameMap {
    "tc-smart-recommendation": TcSmartRecommendation;
  }
}
