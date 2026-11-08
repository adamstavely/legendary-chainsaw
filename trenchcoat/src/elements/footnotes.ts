import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-footnotes> – a quiet card of caveats and notes under a page's charts: where the numbers come from, what they
 * leave out, when they were last refreshed. The notes are a numbered list (or bulleted, with numbered="false") in
 * small muted text; a note can end in a link ("More" unless it says otherwise). A link click fires a cancelable
 * `tc-navigate` ({ href, id }) – prevent it and the link isn't followed, so an app's router can take it (clicks with a
 * modifier key, or not the main button, are left to the browser). An unsafe `href` is dropped and the note shows
 * without a link. With no notes the element renders nothing at all – no card with only a heading.
 * The host is a region named by the heading.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-footnotes .notes=${[{ id: "src", text: "Papers counted by first author's centre.", href: "/method" }]}></tc-footnotes>
 */

export type FootnoteNote = {
  id: string;
  /** The note, in plain text */
  text: string;
  /** Where its link goes; through safeUrl – an unsafe link is dropped */
  href?: string;
  /** The link's words (default "More") */
  linkLabel?: string;
};
export type FootnotesNavigate = { href: string; id: string };
export type FootnotesNavigateEvent = CustomEvent<FootnotesNavigate>;

/* Info: Lucide (ISC, lucide.dev) */
const infoIcon = svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`;

let instances = 0;

/**
 * A quiet card of caveats and notes under a page's charts, numbered or bulleted, each with an optional link.
 * @tag tc-footnotes
 * @fires tc-navigate - A note's link was clicked ({ href, id }: FootnotesNavigate); cancelable – prevented, the link isn't followed
 */
export class TcFootnotes extends TcElement {
  static override ui = "fnt";

  /** The heading, and the region's name */
  @property() accessor heading = "Notes";
  /** A quiet line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The notes, in order */
  @property({ attribute: false }) accessor notes: FootnoteNote[] = [];
  /** Numbers the notes (default true); numbered="false" gives a plain bulleted list */
  @property({ type: Boolean, reflect: true, converter: { fromAttribute: (v) => v !== "false", toAttribute: (v: boolean) => (v ? "" : "false") } })
  accessor numbered = true;

  private readonly uid = `tc-fnt${++instances}`;

  private navigate(e: MouseEvent, href: string, id: string) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (!this.emit<FootnotesNavigate>("tc-navigate", { href, id }, { cancelable: true })) e.preventDefault();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const empty = !this.notes.length;
    this.toggleAttribute("data-empty", empty);
    // A region named by its heading – only while there's something in it
    if (empty) {
      if (this.getAttribute("role") === "region") this.removeAttribute("role");
      if (this.getAttribute("aria-labelledby") === `${this.uid}-title`) this.removeAttribute("aria-labelledby");
    } else {
      if (!this.hasAttribute("role")) this.setAttribute("role", "region");
      if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    }
  }

  private renderNote(n: FootnoteNote) {
    const href = safeUrl(n.href);
    return html`<li class="ui-fnt__note">
      <span class="ui-fnt__text">${n.text}</span>${href
        ? html` <a class="ui-fnt__link" href=${href} @click=${(e: MouseEvent) => this.navigate(e, href, n.id)}>${n.linkLabel || "More"}</a>`
        : nothing}
    </li>`;
  }

  protected override render() {
    if (!this.notes.length) return nothing;
    const items = repeat(this.notes, (n) => n.id, (n) => this.renderNote(n));
    return html`${cardHead({ icon: infoIcon, title: this.heading, subtitle: this.description, id: `${this.uid}-title` })}
      <div class="ui-fnt__card">
        ${this.numbered ? html`<ol class="ui-fnt__list">${items}</ol>` : html`<ul class="ui-fnt__list">${items}</ul>`}
      </div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fnt"] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fnt"] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* No notes: nothing at all, not a card with only a heading */
[data-ui="fnt"][data-empty] { display: none; }
[data-ui="fnt"] *, [data-ui="fnt"] *::before, [data-ui="fnt"] *::after { box-sizing: border-box; }
/* Lower in emphasis than the cards above it: a muted icon */
[data-ui="fnt"] .tc-head__icon { color: var(--tc-icon-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-fnt__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-fnt__card { padding: var(--tc-space-3) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-fnt__card { padding-top: 0; }
.ui-fnt__list { display: grid; gap: var(--tc-space-1-5); margin: 0; padding: 0 0 0 var(--tc-space-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-fnt__note { padding-left: var(--tc-space-1); }
.ui-fnt__note::marker { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-fnt__text { overflow-wrap: anywhere; }
.ui-fnt__link { border-radius: var(--tc-radius-2xs); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); text-decoration: none; white-space: nowrap; }
.ui-fnt__link:hover { text-decoration: underline; }
.ui-fnt__link:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@media (forced-colors: active) {
  .ui-fnt__link { color: LinkText; }
}
`;
}

if (!customElements.get("tc-footnotes")) customElements.define("tc-footnotes", TcFootnotes);

declare global {
  interface HTMLElementTagNameMap {
    "tc-footnotes": TcFootnotes;
  }
}
