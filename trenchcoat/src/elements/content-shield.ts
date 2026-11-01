import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import "./content-hidden";

/*
 * <tc-content-shield> – keeps content unloaded until someone chooses to see it. While shielded, the content isn't in the
 * page at all: it's supplied in a <template> child, whose inert contents are cloned in on reveal, or by a tc-reveal
 * listener that fills the container it's given. Hide removes it again. Without `revealable` there's no way to reveal, for
 * people who may not see the content. This is a courtesy to the reader, not access control: send restricted content only
 * to people your server allows.
 * Standard: a gray tray holding a white card. Clean: one white card.
 *
 *   <tc-content-shield reason="Flagged as graphic"><template><img src="…" alt="…" /></template></tc-content-shield>
 */

export type ContentShieldRevealedChange = { revealed: boolean };
export type ContentShieldReveal = { container: HTMLElement };

/** The shield's words, every one renameable through `labels` */
export type ContentShieldLabels = {
  caption: string;
  reveal: string;
  hide: string;
  /** Shown when it can't be revealed */
  unavailable: string;
  /** Announced */
  revealed: string;
  hidden: string;
};
export const defaultContentShieldLabels: ContentShieldLabels = {
  caption: "Content hidden",
  reveal: "Show content",
  hide: "Hide content",
  unavailable: "You can't view this content.",
  revealed: "Content shown",
  hidden: "Content hidden",
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], audio[controls], [tabindex]:not([tabindex="-1"])';

/**
 * Keeps content unloaded until someone chooses to see it.
 * @tag tc-content-shield
 * @fires tc-revealed-change - It was revealed or hidden ({ revealed }: ContentShieldRevealedChange); cancelable – prevented, `revealed` stays as it was
 * @fires tc-reveal - The content is being shown ({ container }: ContentShieldReveal); fill `container` when the content isn't in a template
 */
export class TcContentShield extends TcElement {
  static override ui = "csh";

  /** Why it's hidden, in factual words */
  @property() accessor reason = "";
  /** Whether it can be revealed; set revealable="false" for people who may not see it */
  @property({ attribute: "revealable", converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor revealable = true;
  /** Whether the content shows. Changed by the user unless a tc-revealed-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor revealed = false;
  /** The reveal button's words */
  @property({ attribute: "reveal-label" }) accessor revealLabel = "";
  /** The hide button's words */
  @property({ attribute: "hide-label" }) accessor hideLabel = "";
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<ContentShieldLabels> = {};

  @state() private accessor announce = "";
  private moveFocus = false;

  private get words(): ContentShieldLabels {
    return { ...defaultContentShieldLabels, ...this.labels };
  }
  /** Someone who can't reveal it doesn't see it, whatever `revealed` says */
  private get showing() {
    return this.revealed && this.revealable;
  }

  private set(revealed: boolean) {
    if (!this.emit<ContentShieldRevealedChange>("tc-revealed-change", { revealed }, { cancelable: true })) return;
    this.moveFocus = true;
    this.revealed = revealed;
    this.announce = revealed ? this.words.revealed : this.words.hidden;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const box = this.querySelector<HTMLElement>(".ui-csh__content");
    if (box && !box.dataset.filled) {
      box.dataset.filled = "true";
      const template = this.querySelector<HTMLTemplateElement>(":scope > template");
      if (template) box.append(template.content.cloneNode(true));
      this.emit<ContentShieldReveal>("tc-reveal", { container: box });
    }
    if (!this.moveFocus) return;
    this.moveFocus = false;
    if (box) (box.querySelector<HTMLElement>(FOCUSABLE) ?? this.querySelector<HTMLElement>(".ui-csh__hide"))?.focus();
    else this.querySelector<HTMLElement>(".ui-csh__reveal")?.focus();
  }

  protected override render() {
    const w = this.words;
    const status = html`<span class="tc-sr-only" role="status">${this.announce}</span>`;
    if (this.showing) {
      return html`<div class="ui-csh__card">
          <div class="ui-csh__content"></div>
          <div class="ui-csh__foot"><button type="button" class="tc-btn-sm ui-csh__hide" @click=${() => this.set(false)}>${this.hideLabel || w.hide}</button></div>
        </div>
        ${status}`;
    }
    return html`<div class="ui-csh__card ui-csh__shield">
        <div class="ui-csh__picture"><tc-content-hidden caption=${w.caption}></tc-content-hidden></div>
        ${this.reason ? html`<p class="ui-csh__reason">${this.reason}</p>` : nothing}
        ${this.revealable ? html`<button type="button" class="tc-btn-sm ui-csh__reveal" @click=${() => this.set(true)}>${this.revealLabel || w.reveal}</button>` : html`<p class="ui-csh__unavailable">${w.unavailable}</p>`}
      </div>
      ${status}`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="csh"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="csh"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; overflow: hidden;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The picture's width – override it on the element */
[data-ui="csh"] { --tc-csh-picture: 240px; }
[data-ui="csh"] *, [data-ui="csh"] *::before, [data-ui="csh"] *::after { box-sizing: border-box; }
[data-ui="csh"] :where(p) { margin: 0; }
[data-ui="csh"] > template { display: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="csh"] .ui-csh__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-csh__shield { display: grid; justify-items: center; gap: var(--tc-space-2); padding: var(--tc-space-4); text-align: center; }
.ui-csh__picture { width: 100%; max-width: var(--tc-csh-picture); }
.ui-csh__reason, .ui-csh__unavailable { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-csh__content { min-width: 0; }
.ui-csh__foot { display: flex; justify-content: flex-end; padding: var(--tc-space-2) var(--tc-space-3); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
`;
}

if (!customElements.get("tc-content-shield")) customElements.define("tc-content-shield", TcContentShield);

declare global {
  interface HTMLElementTagNameMap {
    "tc-content-shield": TcContentShield;
  }
}
