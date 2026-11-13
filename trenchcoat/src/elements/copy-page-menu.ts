import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { ModalController } from "./internal/modal";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-copy-page-menu> – the "Copy page" button on a docs page, for handing the page to a model. The button copies the
 * page as Markdown (from `markdown`, or the async `getMarkdown()` hook when it's made on demand); the arrow beside it
 * opens a menu: Copy as Markdown, View as Markdown (a dialog with the text), Copy link, Open in each chat assistant
 * the page lists ({ label, urlTemplate }, "{prompt}" filled with "Read <url> and help me with it"), and Download .md.
 * "Copied" is announced politely and shown on the button for a moment. Each action fires a cancelable event first, so
 * a page can do it its own way: tc-page-copy, tc-page-view, tc-assistant-open, tc-page-download.
 * The menu follows the WAI-ARIA menu button: Enter, Space or ↓ opens it on the first item, ↑ on the last; ↑/↓, Home and
 * End move; a letter jumps to the item that starts with it; Escape closes it and returns to the arrow, Tab closes it.
 * One look-neutral control – a split button like the library's secondary button, the menu a popover.
 *
 *   <tc-copy-page-menu url="https://docs.example.org/records" page-title="Records API" .markdown=${md}></tc-copy-page-menu>
 */

export type CopyPageAssistant = {
  id: string;
  /** Its name, shown as "Open in <label>" */
  label: string;
  /** Its new-chat URL, with "{prompt}" where the prompt goes (URL-encoded for you): "https://chat.example.org/new?q={prompt}" */
  urlTemplate: string;
};
export type CopyPageCopy = { kind: "markdown" | "link"; text: string };
export type CopyPageView = { markdown: string };
export type CopyPageDownload = { filename: string; markdown: string };
export type CopyPageAssistantOpen = { id: string; href: string; prompt: string };
export type CopyPageOpenChange = { open: boolean };

export type CopyPageLabels = {
  copy: string;
  copied: string;
  more: string;
  copyMarkdown: string;
  copyMarkdownHint: string;
  view: string;
  viewHint: string;
  copyLink: string;
  openIn: string;
  download: string;
  downloadHint: string;
  dialogTitle: string;
  close: string;
  /** "Read {url} and help me with it" – what an assistant is asked */
  prompt: string;
  failed: string;
  copyFailed: string;
};
export const defaultCopyPageLabels: CopyPageLabels = {
  copy: "Copy page",
  copied: "Copied",
  more: "More ways to share this page",
  copyMarkdown: "Copy as Markdown",
  copyMarkdownHint: "For pasting into a chat with a model",
  view: "View as Markdown",
  viewHint: "See the text a model would read",
  copyLink: "Copy link",
  openIn: "Open in {label}",
  download: "Download .md",
  downloadHint: "Save the page as a Markdown file",
  dialogTitle: "This page as Markdown",
  close: "Close",
  prompt: "Read {url} and help me with it",
  failed: "Couldn't get this page's Markdown",
  copyFailed: "Couldn't copy – open View as Markdown and copy the text there",
};

/** The assistant's link: its template with the prompt URL-encoded in place of "{prompt}"; null when it isn't a safe http(s) link */
export function assistantHref(template: string, prompt: string): string | null {
  const href = safeUrl(template.split("{prompt}").join(encodeURIComponent(prompt)));
  return href && /^https?:/i.test(href) ? href : null;
}

/** A file name for the page: the title in lower-case words joined by dashes, then .md */
export function markdownFilename(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "page"}.md`;
}

/* copy, check, chevron-down, file-text, eye, link, message-square, download, x: Lucide (ISC, lucide.dev) */
const ICONS: Record<string, TemplateResult> = {
  copy: svg`<rect x="8" y="8" width="14" height="14" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`,
  check: svg`<path d="M20 6 9 17l-5-5"></path>`,
  chevron: svg`<path d="m6 9 6 6 6-6"></path>`,
  markdown: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`,
  view: svg`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>`,
  link: svg`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`,
  chat: svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
  download: svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path><path d="M12 15V3"></path>`,
  close: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
};
const icon = (name: string, cls = "ui-cpm__icon") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

type Item = { id: string; label: string; hint?: string; icon: string; href?: string; run?: () => void };

let instances = 0;

/**
 * A docs page's Copy page button: copy it as Markdown for a model, view it, copy its link, open it in an assistant, download it.
 * @tag tc-copy-page-menu
 * @fires tc-page-copy - The page's Markdown or link is about to be copied ({ kind, text }: CopyPageCopy); cancelable – prevented, nothing is written to the clipboard
 * @fires tc-page-view - View as Markdown was chosen ({ markdown }: CopyPageView); cancelable – prevented, the dialog doesn't open
 * @fires tc-assistant-open - An assistant's link was chosen ({ id, href, prompt }: CopyPageAssistantOpen); cancelable – prevented, the link isn't followed
 * @fires tc-page-download - Download .md was chosen ({ filename, markdown }: CopyPageDownload); cancelable – prevented, nothing is saved
 * @fires tc-open-change - The menu opened or closed ({ open }: CopyPageOpenChange); cancelable – prevented, `open` stays
 */
export class TcCopyPageMenu extends TcElement {
  static override ui = "cpm";

  /** The page as Markdown; when it's empty, `getMarkdown` is asked */
  @property({ attribute: false }) accessor markdown = "";
  /** Makes the page's Markdown on demand (fetched or rendered when first needed); its answer is kept */
  @property({ attribute: false }) accessor getMarkdown: (() => Promise<string> | string) | undefined = undefined;
  /** The page's address, for Copy link and the assistants' prompt; without it those items aren't offered */
  @property() accessor url = "";
  /** The page's title, for the download's file name and the dialog */
  @property({ attribute: "page-title" }) accessor pageTitle = "";
  /** The download's file name; defaults to the title in dashes, then .md */
  @property() accessor filename = "";
  /** Chat assistants to open the page in, in order */
  @property({ attribute: false }) accessor assistants: CopyPageAssistant[] = [];
  /** Hide Download .md */
  @property({ type: Boolean, attribute: "hide-download" }) accessor hideDownload = false;
  /** The menu is open. Changed by the arrow button unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The words, merged over defaultCopyPageLabels */
  @property({ attribute: false }) accessor labels: Partial<CopyPageLabels> = {};

  /** @internal "Copied" shows on the button */
  @state() accessor copied = false;
  /** @internal Getting the Markdown */
  @state() accessor busy = false;
  /** @internal The dialog's text, while it's open */
  @state() accessor viewing: string | null = null;
  /** @internal The status line's words */
  @state() accessor announce = "";

  private readonly uid = `tc-cpm${++instances}`;
  private copiedTimer?: ReturnType<typeof setTimeout>;
  private made: string | null = null;
  private focusOnOpen: "first" | "last" | null = null;
  private readonly modal = new ModalController(this, { dialog: () => this.querySelector("dialog"), focus: () => this.querySelector<HTMLElement>(".ui-cpm__text") });

  private get words(): CopyPageLabels {
    return { ...defaultCopyPageLabels, ...this.labels };
  }

  private get prompt() {
    return this.words.prompt.replace("{url}", this.url);
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.onOutside, true);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onOutside, true);
    clearTimeout(this.copiedTimer);
  }

  protected override updated() {
    this.modal.sync(this.viewing !== null);
    if (this.open && this.focusOnOpen) {
      const items = this.menuItems();
      (this.focusOnOpen === "last" ? items[items.length - 1] : items[0])?.focus();
      this.focusOnOpen = null;
    }
  }

  private onOutside = (e: PointerEvent) => {
    if (this.open && !e.composedPath().includes(this.querySelector(".ui-cpm__split") as EventTarget)) this.setOpen(false, false);
  };

  private menuItems() {
    return [...this.querySelectorAll<HTMLElement>(".ui-cpm__item")];
  }

  private setOpen(open: boolean, refocus = true, focus: "first" | "last" = "first") {
    if (open === this.open) return;
    if (!this.emit<CopyPageOpenChange>("tc-open-change", { open }, { cancelable: true })) return;
    this.open = open;
    if (open) this.focusOnOpen = focus;
    else if (refocus) this.querySelector<HTMLElement>(".ui-cpm__more")?.focus();
  }

  /** The page's Markdown: the property, else what getMarkdown made (asked once); null when there's none */
  private async resolve(): Promise<string | null> {
    if (this.markdown) return this.markdown;
    if (this.made !== null) return this.made;
    if (!this.getMarkdown) return null;
    this.busy = true;
    try {
      this.made = await this.getMarkdown();
      return this.made;
    } catch {
      return null;
    } finally {
      this.busy = false;
    }
  }

  private say(text: string) {
    // The same words twice in a row still get read: the region empties first
    this.announce = "";
    void this.updateComplete.then(() => (this.announce = text));
  }

  private async write(kind: CopyPageCopy["kind"], text: string) {
    if (!this.emit<CopyPageCopy>("tc-page-copy", { kind, text }, { cancelable: true })) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      this.say(this.words.copyFailed);
      return;
    }
    this.copied = true;
    this.say(this.words.copied);
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = false), 2000);
  }

  /** Copy the page as Markdown – the main button, or the first menu item */
  async copyMarkdown() {
    const md = await this.resolve();
    if (md === null) return this.say(this.words.failed);
    await this.write("markdown", md);
  }

  private async view() {
    const md = await this.resolve();
    if (md === null) return this.say(this.words.failed);
    if (!this.emit<CopyPageView>("tc-page-view", { markdown: md }, { cancelable: true })) return;
    this.viewing = md;
  }

  private async download() {
    const md = await this.resolve();
    if (md === null) return this.say(this.words.failed);
    const filename = this.filename || markdownFilename(this.pageTitle);
    if (!this.emit<CopyPageDownload>("tc-page-download", { filename, markdown: md }, { cancelable: true })) return;
    const href = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 0);
  }

  private items(): Item[] {
    const w = this.words;
    const items: Item[] = [
      { id: "markdown", label: w.copyMarkdown, hint: w.copyMarkdownHint, icon: "markdown", run: () => void this.copyMarkdown() },
      { id: "view", label: w.view, hint: w.viewHint, icon: "view", run: () => void this.view() },
    ];
    if (this.url) {
      items.push({ id: "link", label: w.copyLink, icon: "link", run: () => void this.write("link", this.url) });
      for (const a of this.assistants) {
        const href = assistantHref(a.urlTemplate, this.prompt);
        if (href) items.push({ id: `assistant:${a.id}`, label: w.openIn.replace("{label}", a.label), icon: "chat", href });
      }
    }
    if (!this.hideDownload) items.push({ id: "download", label: w.download, hint: w.downloadHint, icon: "download", run: () => void this.download() });
    return items;
  }

  private onMoreKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setOpen(true, true, "first");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.setOpen(true, true, "last");
    }
  };

  private onMenuKey = (e: KeyboardEvent) => {
    const items = this.menuItems();
    const at = items.indexOf(document.activeElement as HTMLElement);
    let next: number | undefined;
    if (e.key === "ArrowDown") next = (at + 1) % items.length;
    else if (e.key === "ArrowUp") next = (at - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.setOpen(false);
      return;
    } else if (e.key === "Tab") {
      this.setOpen(false, false);
      return;
    } else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const ch = e.key.toLowerCase();
      for (let i = 1; i <= items.length; i++) {
        const j = (at + i) % items.length;
        if ((items[j].querySelector(".ui-cpm__label")?.textContent ?? "").trim().toLowerCase().startsWith(ch)) {
          next = j;
          break;
        }
      }
    }
    if (next === undefined) return;
    e.preventDefault();
    items[next]?.focus();
  };

  private choose(e: MouseEvent, item: Item) {
    if (item.href) {
      const id = item.id.slice("assistant:".length);
      if (!this.emit<CopyPageAssistantOpen>("tc-assistant-open", { id, href: item.href, prompt: this.prompt }, { cancelable: true })) e.preventDefault();
      this.setOpen(false);
      return;
    }
    this.setOpen(false);
    item.run?.();
  }

  private closeView() {
    this.viewing = null;
  }

  private renderItem(item: Item) {
    const body = html`${icon(item.icon)}<span class="ui-cpm__text-col"><span class="ui-cpm__label">${item.label}</span>${item.hint
        ? html`<span class="ui-cpm__hint">${item.hint}</span>`
        : nothing}</span>`;
    return item.href
      ? html`<a class="ui-cpm__item" role="menuitem" tabindex="-1" href=${item.href} target="_blank" rel="noopener noreferrer" @click=${(e: MouseEvent) => this.choose(e, item)}>${body}</a>`
      : html`<button type="button" class="ui-cpm__item" role="menuitem" tabindex="-1" @click=${(e: MouseEvent) => this.choose(e, item)}>${body}</button>`;
  }

  protected override render() {
    const w = this.words;
    const menuId = `${this.uid}-menu`;
    const dialogTitle = `${this.uid}-dlg`;
    return html`<div class="ui-cpm__split">
        <button type="button" class="ui-cpm__main" aria-busy=${ifDefined(this.busy ? "true" : undefined)} @click=${() => void this.copyMarkdown()}>
          ${icon(this.copied ? "check" : "copy")}<span>${this.copied ? w.copied : w.copy}</span>
        </button>
        <button type="button" class="ui-cpm__more" aria-haspopup="menu" aria-expanded=${this.open ? "true" : "false"} aria-controls=${menuId}
          @click=${() => this.setOpen(!this.open)} @keydown=${this.onMoreKey}>
          ${icon("chevron")}<span class="tc-sr-only">${w.more}</span>
        </button>
        <div class="ui-cpm__menu" id=${menuId} role="menu" aria-label=${w.more} ?hidden=${!this.open} @keydown=${this.onMenuKey}>
          ${this.open ? this.items().map((i) => this.renderItem(i)) : nothing}
        </div>
      </div>
      <dialog class="ui-cpm__dialog" aria-labelledby=${dialogTitle} @cancel=${(e: Event) => (e.preventDefault(), this.closeView())}
        @close=${() => {
          if (!this.modal.ownClose()) this.closeView();
        }}>
        <div class="ui-cpm__dialog-head">
          <h2 class="ui-cpm__dialog-title" id=${dialogTitle}>${this.pageTitle ? `${this.pageTitle} – ` : ""}${w.dialogTitle}</h2>
          <button type="button" class="ui-cpm__close" @click=${() => this.closeView()}>${icon("close")}<span class="tc-sr-only">${w.close}</span></button>
        </div>
        <pre class="ui-cpm__text" tabindex="0" aria-labelledby=${dialogTitle}>${this.viewing ?? ""}</pre>
        <div class="ui-cpm__dialog-foot">
          <button type="button" class="tc-btn-sm" @click=${() => void this.write("markdown", this.viewing ?? "")}>${icon(this.copied ? "check" : "copy")}${this.copied ? w.copied : w.copyMarkdown}</button>
          <button type="button" class="tc-btn-sm" @click=${() => this.closeView()}>${w.close}</button>
        </div>
      </dialog>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
[data-ui="cpm"] {
  /* The menu's width and the dialog's size */
  --tc-cpm-menu-w: 264px;
  --tc-cpm-dialog-w: 720px;
  --tc-cpm-dialog-h: 70vh;
  --tc-cpm-icon: 15px;
  position: relative; display: inline-block; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); -webkit-font-smoothing: antialiased;
}
[data-ui="cpm"] *, [data-ui="cpm"] *::before, [data-ui="cpm"] *::after { box-sizing: border-box; }
:where([data-ui="cpm"]) button { margin: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
.ui-cpm__icon { flex: none; width: var(--tc-cpm-icon); height: var(--tc-cpm-icon); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

.ui-cpm__split { position: relative; display: inline-flex; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-cpm__split:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-cpm__main, .ui-cpm__more { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
.ui-cpm__main { padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm) 0 0 var(--tc-control-radius-sm); }
.ui-cpm__more { width: var(--tc-control-h-sm); border-radius: 0 var(--tc-control-radius-sm) var(--tc-control-radius-sm) 0; box-shadow: inset var(--tc-hairline) 0 0 var(--tc-border-subtle); }
.ui-cpm__main:hover, .ui-cpm__more:hover, .ui-cpm__more[aria-expanded="true"] { background: var(--tc-fill-hover); }
.ui-cpm__main:focus-visible, .ui-cpm__more:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); position: relative; z-index: 1; }
.ui-cpm__more[aria-expanded="true"] .ui-cpm__icon { transform: rotate(180deg); }
.ui-cpm__main[aria-busy="true"] { cursor: progress; }

.ui-cpm__menu { position: absolute; top: calc(100% + var(--tc-space-1)); right: 0; z-index: var(--tc-z-dropdown); display: grid; gap: var(--tc-space-0-5); width: var(--tc-cpm-menu-w); max-width: calc(100vw - 2 * var(--tc-space-4)); padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); text-align: left; animation: ui-cpm-drop var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-cpm__menu[hidden] { display: none; }
@keyframes ui-cpm-drop { from { opacity: 0; transform: translateY(calc(-1 * var(--tc-space-1))); } }
.ui-cpm__item { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); width: 100%; min-height: var(--tc-menu-item-h); padding: var(--tc-space-1-5) var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); color: var(--tc-text-primary); font-size: var(--tc-menu-item-font-size); text-align: left; text-decoration: none; outline: none; }
.ui-cpm__item:hover, .ui-cpm__item:focus-visible { background: var(--tc-menu-item-hover); }
.ui-cpm__item:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-cpm__item .ui-cpm__icon { margin-top: var(--tc-space-0-5); color: var(--tc-icon-muted); }
.ui-cpm__text-col { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-cpm__label { font-weight: var(--tc-font-weight-medium); }
.ui-cpm__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }

.ui-cpm__dialog { width: min(var(--tc-cpm-dialog-w), calc(100vw - 2 * var(--tc-space-4))); max-height: var(--tc-cpm-dialog-h); padding: 0; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-primary); }
.ui-cpm__dialog[open] { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }
.ui-cpm__dialog::backdrop { background: var(--tc-scrim); }
.ui-cpm__dialog-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 calc(-1 * var(--tc-hairline)) var(--tc-border-subtle); }
.ui-cpm__dialog-title { margin: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); }
.ui-cpm__close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
.ui-cpm__close:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-cpm__close:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-cpm__text { margin: 0; padding: var(--tc-space-4); overflow: auto; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed, var(--tc-line-height-normal)); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-cpm__text:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-cpm__dialog-foot { display: flex; justify-content: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }

@media (forced-colors: active) {
  .ui-cpm__split, .ui-cpm__menu { border: 1px solid CanvasText; }
  .ui-cpm__item:focus-visible { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-cpm__menu { animation: none; }
  .ui-cpm__more .ui-cpm__icon { transition: none; }
}
`;
}

if (!customElements.get("tc-copy-page-menu")) customElements.define("tc-copy-page-menu", TcCopyPageMenu);

declare global {
  interface HTMLElementTagNameMap {
    "tc-copy-page-menu": TcCopyPageMenu;
  }
}
