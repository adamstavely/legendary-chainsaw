import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";

/*
 * <tc-collection-card> – a card that introduces a whole collection, a section of a library or catalog, and links into
 * it: a strip of up to three previews, the title with its counts, a bold line, a description, the names of what's
 * inside (as many as fit in two lines) and a link. The whole card is one click target, but its words stay selectable:
 * a click that ends a text selection doesn't follow the link.
 * Standard: the card on a gray tray. Clean: one white card.
 *
 *   <tc-collection-card heading="Components" .count=${273} href="/components" .items=${["Agent Cursors", …]}></tc-collection-card>
 */

export type CollectionPreview = {
  /** The picture's address; leave it out for a placeholder or for `content` */
  src?: string;
  /** What the picture shows; "" when it adds nothing to the words */
  alt: string;
  /** A live element drawn in the frame instead of a picture; it's inert and hidden from screen readers */
  content?: Node;
};

export type CollectionCardLabels = {
  /** One item, with {n} for the number */
  item: string;
  /** Several items */
  items: string;
  /** One file */
  file: string;
  /** Several files */
  files: string;
  /** Read after the names that fit, for the ones that don't */
  more: string;
  /** The link's words, with {heading} for the collection's name */
  action: string;
};

export const defaultCollectionCardLabels: CollectionCardLabels = {
  item: "{n} item",
  items: "{n} items",
  file: "{n} file",
  files: "{n} files",
  more: "and {n} more",
  action: "Browse {heading}",
};

const fill = (s: string, values: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);

let nextId = 0;

/**
 * A card that introduces a collection – previews, counts, a description, what's inside – and links into it.
 * @tag tc-collection-card
 * @fires tc-open - The card or its link was pressed (detail: { href }); cancelable – prevented, a link isn't followed
 */
export class TcCollectionCard extends TcElement {
  static override ui = "clc";

  /** The collection's name */
  @property() accessor heading = "";
  /** The heading's level, 2–6 */
  @property({ type: Number, attribute: "heading-level" }) accessor headingLevel = 3;
  /** The bold line under the title */
  @property() accessor subtitle = "";
  /** A short paragraph on what the collection is for */
  @property() accessor description = "";
  /** Up to three previews across the top */
  @property({ attribute: false }) accessor previews: CollectionPreview[] = [];
  /** The names of what's inside; as many as fit in two lines show */
  @property({ attribute: false }) accessor items: string[] = [];
  /** The counts at the right of the title, as written; overrides `count` and `files` */
  @property() accessor meta = "";
  /** How many items the collection holds */
  @property({ type: Number }) accessor count: number | undefined = undefined;
  /** How many files they come to */
  @property({ type: Number }) accessor files: number | undefined = undefined;
  /** Where the link goes; without it the link is a button that fires tc-open */
  @property() accessor href = "";
  /** The link's words; by default "Browse" and the heading */
  @property({ attribute: "action-label" }) accessor actionLabel = "";
  /** Words the page can change: counts, "and N more", the link */
  @property({ attribute: false }) accessor labels: Partial<CollectionCardLabels> = {};
  /** The locale for numbers */
  @property() accessor locale: string | undefined = undefined;

  /** @internal How many names fit in two lines; all of them until measured */
  @state() accessor shown = Infinity;

  private uid = `tc-collection-card-${++nextId}`;
  private resize: ResizeObserver | undefined;
  private width = 0;

  private get words(): CollectionCardLabels {
    return { ...defaultCollectionCardLabels, ...this.labels };
  }

  override connectedCallback() {
    super.connectedCallback();
    this.resize = new ResizeObserver(() => {
      const width = this.clientWidth;
      if (width === this.width) return;
      this.width = width;
      void this.fit();
    });
    this.resize.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resize?.disconnect();
    this.resize = undefined;
    this.width = 0;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("items") && this.hasUpdated && changed.get("items") !== undefined) void this.fit();
  }

  /** Lays every name out, then keeps the ones in the first two lines, leaving room for the "…" */
  private async fit() {
    this.shown = Infinity;
    await this.updateComplete;
    const list = this.querySelector<HTMLElement>(".ui-clc__items");
    const names = [...(list?.querySelectorAll<HTMLElement>(".ui-clc__item") ?? [])];
    if (!list || !names.length) return;
    const line = parseFloat(getComputedStyle(list).lineHeight) || names[0].offsetHeight;
    const limit = names[0].offsetTop + line * 2 - 1;
    const fits = names.filter((n) => n.offsetTop < limit).length;
    this.shown = fits >= names.length ? Infinity : Math.max(1, fits - 1);
  }

  private open(e: Event) {
    const ok = this.emit("tc-open", { href: this.href || null }, { cancelable: true });
    if (!ok) e.preventDefault();
  }

  /** A press anywhere on the card follows its link, unless it ended a text selection or hit a control of its own */
  private pressCard(e: MouseEvent) {
    const target = e.target as Element;
    if (target.closest("a, button, input, select, textarea, [tabindex]")) return;
    if (document.getSelection()?.toString()) return;
    this.querySelector<HTMLElement>(".ui-clc__action")?.click();
  }

  private metaText() {
    if (this.meta) return this.meta;
    const n = new Intl.NumberFormat(this.locale);
    const w = this.words;
    const parts: string[] = [];
    if (this.count != null) parts.push(fill(this.count === 1 ? w.item : w.items, { n: n.format(this.count) }));
    if (this.files != null) parts.push(fill(this.files === 1 ? w.file : w.files, { n: n.format(this.files) }));
    return parts.join(" · ");
  }

  private preview(p: CollectionPreview) {
    if (p.content) return html`<div class="ui-clc__thumb ui-clc__thumb--live" .inert=${true} aria-hidden="true">${p.content}</div>`;
    if (p.src) return html`<div class="ui-clc__thumb"><img class="ui-clc__img" src=${p.src} alt=${p.alt} loading="lazy" decoding="async" /></div>`;
    // Lucide image (ISC licence), for a preview that has nothing to show yet
    return html`<div class="ui-clc__thumb ui-clc__thumb--empty" role=${ifDefined(p.alt ? "img" : undefined)} aria-label=${ifDefined(p.alt || undefined)} aria-hidden=${ifDefined(p.alt ? undefined : "true")}>
      <svg class="ui-clc__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>`}</svg>
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const meta = this.metaText();
    const level = Math.min(6, Math.max(2, Math.round(this.headingLevel) || 3));
    const shown = Math.min(this.shown, this.items.length);
    const hidden = this.items.length - shown;
    const action = this.actionLabel || fill(w.action, { heading: this.heading });
    const arrow = html`<span class="ui-clc__arrow" aria-hidden="true">→</span>`;
    return html`<div class="ui-clc__card" @click=${this.pressCard}>
      ${this.previews.length ? html`<div class="ui-clc__previews">${this.previews.slice(0, 3).map((p) => this.preview(p))}</div>` : nothing}
      <div class="ui-clc__head">
        <div class="ui-clc__title" role="heading" aria-level=${level} id=${`${this.uid}-title`}>${this.heading}</div>
        ${meta ? html`<span class="ui-clc__meta">${meta}</span>` : nothing}
      </div>
      ${this.subtitle ? html`<p class="ui-clc__subtitle">${this.subtitle}</p>` : nothing}
      ${this.description ? html`<p class="ui-clc__description">${this.description}</p>` : nothing}
      ${this.items.length
        ? html`<p class="ui-clc__items">${this.items.slice(0, shown).map(
            (name, i) => html`<span class="ui-clc__item">${name}${i < shown - 1 || hidden ? html`<span aria-hidden="true"> · </span>` : nothing}</span>`,
          )}${hidden ? html`<span class="ui-clc__more"><span aria-hidden="true">…</span><span class="tc-sr-only">${fill(w.more, { n: new Intl.NumberFormat(this.locale).format(hidden) })}</span></span>` : nothing}</p>`
        : nothing}
      ${this.href
        ? html`<a class="ui-clc__action" href=${this.href} aria-describedby=${`${this.uid}-title`} @click=${this.open}>${action} ${arrow}</a>`
        : html`<button type="button" class="ui-clc__action" aria-describedby=${`${this.uid}-title`} @click=${this.open}>${action} ${arrow}</button>`}
    </div>`;
  }

  static override css = /* css */ `
[data-ui="clc"] {
  --tc-clc-pad: var(--tc-space-5);
  --tc-clc-gap: var(--tc-space-2);
  --tc-clc-thumb-ratio: 16 / 10;
  --tc-clc-lift: calc(var(--tc-space-0-5) * -1);
  container-type: inline-size;
  display: block;
  box-sizing: border-box;
  width: 100%;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="clc"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }

.ui-clc__card {
  display: flex;
  flex-direction: column;
  gap: var(--tc-clc-gap);
  box-sizing: border-box;
  padding: var(--tc-clc-pad);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  cursor: pointer;
  transition: transform var(--tc-duration-base) var(--tc-ease-move), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="clc"] .ui-clc__card { background: var(--tc-surface-on-tray); }
.ui-clc__card:hover { transform: translateY(var(--tc-clc-lift)); box-shadow: var(--tc-card-shadow-hover); }
.ui-clc__card:has(.ui-clc__action:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }

.ui-clc__previews { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-2); margin-block-end: var(--tc-space-2); }
.ui-clc__thumb {
  position: relative;
  aspect-ratio: var(--tc-clc-thumb-ratio);
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-sunken);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle);
}
.ui-clc__img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-clc__thumb--live > * { pointer-events: none; }
.ui-clc__thumb--empty { display: grid; place-items: center; color: var(--tc-icon-muted); }
.ui-clc__glyph { width: var(--tc-space-6); height: var(--tc-space-6); }

.ui-clc__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-clc__title { margin: 0; min-width: 0; font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display-sm); overflow-wrap: anywhere; }
.ui-clc__meta { color: var(--tc-text-secondary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-clc__subtitle { margin: 0; font-weight: var(--tc-font-weight-semibold); }
.ui-clc__description { margin: 0; color: var(--tc-text-secondary); }
.ui-clc__items { display: block; max-height: calc(var(--tc-line-height-normal) * 2); margin: 0; overflow: hidden; color: var(--tc-text-muted); }
.ui-clc__action {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  min-height: var(--tc-control-h-sm);
  margin-block-start: var(--tc-space-1);
  padding: 0;
  border: 0;
  background: none;
  color: var(--tc-accent-text);
  font: inherit;
  font-weight: var(--tc-font-weight-semibold);
  text-decoration: none;
  cursor: pointer;
}
.ui-clc__action:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-clc__action:focus-visible { outline: none; }
.ui-clc__arrow { transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-clc__card:hover .ui-clc__arrow { transform: translateX(var(--tc-space-0-5)); }

@container (max-width: 360px) {
  [data-ui="clc"] { --tc-clc-pad: var(--tc-space-4); }
  .ui-clc__title { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-loose); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-clc__card, .ui-clc__arrow { transition: none; }
  .ui-clc__card:hover, .ui-clc__card:hover .ui-clc__arrow { transform: none; }
}
@media (forced-colors: active) {
  .ui-clc__card { border: 1px solid CanvasText; }
  .ui-clc__action { color: LinkText; }
}
`;
}

if (!customElements.get("tc-collection-card")) customElements.define("tc-collection-card", TcCollectionCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-collection-card": TcCollectionCard;
  }
}
