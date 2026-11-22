import { html, nothing, svg, type ReactiveController, type ReactiveControllerHost, type TemplateResult } from "lit";
import { copyText } from "./util";

/*
 * What AI Summary and File Summary share: the status lifecycle's idle and error blocks, the skeleton while nothing has
 * arrived, the streaming caret, Copy (which turns into "Copied" for a moment) and Regenerate, and Short / Detailed's
 * keys. Each element passes its own class prefix ("aism", "fsum"), so the markup and its CSS stay exactly theirs; what
 * they say, cite and show around it stays in each element.
 */

/* Copy, check, refresh, alert: Lucide (ISC, lucide.dev) */
/** A Lucide icon at a size, drawn in the text colour and hidden from assistive technology */
export const lucide = (body: TemplateResult, size = 16) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
export const copyIcon = () => lucide(svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`, 14);
export const checkIcon = () => lucide(svg`<path d="M20 6 9 17l-5-5"></path>`, 14);
export const refreshIcon = () => lucide(svg`<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>`, 14);
export const alertIcon = () => lucide(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>`, 16);

export type SummaryLength = "short" | "detailed";
export type SummaryStatus = "idle" | "summarising" | "done" | "error";

/** A text's paragraphs: split at blank lines, trimmed, empty ones dropped */
export function summaryParas(text: string) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/** The grey lines that stand in while a summary hasn't started arriving */
export const summarySkeleton = (p: string) => html`<div class=${`ui-${p}__skeleton`} aria-hidden="true"><span></span><span></span><span></span></div>`;

/** The caret at the end of text that's still streaming in */
export const summaryCaret = (p: string) => html`<span class=${`ui-${p}__caret`} aria-hidden="true"></span>`;

/** Before anything's been summarised: what it'll give, and Summarise */
export const summaryIdle = (p: string, text: string, icon: TemplateResult, summarise: () => void) =>
  html`<div class=${`ui-${p}__idle`}>
        <p class=${`ui-${p}__idle-text`}>${text}</p>
        <button type="button" class=${`ui-${p}__primary`} @click=${summarise}>${icon}Summarise</button>
      </div>`;

/** It failed: what failed, the reason if there is one, and Retry */
export const summaryError = (p: string, title: string, detail: string | undefined, retry: () => void) =>
  html`<div class=${`ui-${p}__error`} role="alert">
        <span class=${`ui-${p}__error-icon`}>${alertIcon()}</span>
        <div class=${`ui-${p}__error-text`}>
          <p class=${`ui-${p}__error-title`}>${title}</p>
          ${detail ? html`<p class=${`ui-${p}__error-detail`}>${detail}</p>` : nothing}
        </div>
        <button type="button" class=${`tc-btn-sm ui-${p}__retry`} @click=${retry}>${refreshIcon()}Retry</button>
      </div>`;

/** Copy (a check and "Copied" for a moment after) and Regenerate – both only once the summary is done */
export const summaryActions = (p: string, o: { done: boolean; copied: boolean; copy: () => void; regenerate: () => void }) =>
  html`<button type="button" class=${`tc-btn-sm ui-${p}__copy`} ?disabled=${!o.done} ?data-copied=${o.copied} @click=${o.copy}>
            ${o.copied ? checkIcon() : copyIcon()}<span>${o.copied ? "Copied" : "Copy"}</span>
          </button>
          <button type="button" class=${`tc-btn-sm ui-${p}__regen`} ?disabled=${!o.done} @click=${o.regenerate}>${refreshIcon()}<span>Regenerate</span></button>`;

/** The length Short / Detailed's keys move to – arrows toggle, Home and End go to the ends – or null for another key */
export function summaryLengthKey(e: KeyboardEvent, current: SummaryLength): SummaryLength | null {
  const order = ["short", "detailed"] as const;
  const at = order.indexOf(current);
  const to = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key) ? (at + 1) % 2 : e.key === "Home" ? 0 : e.key === "End" ? 1 : -1;
  return to < 0 ? null : order[to];
}

/** Copy's moment of "Copied": copies the text, says so for 1.8 s, and forgets the timer when the host leaves the page */
export class CopiedFlash implements ReactiveController {
  copied = false;
  private timer = 0;
  constructor(private host: ReactiveControllerHost) {
    host.addController(this);
  }
  /** Copies the text; false when the clipboard refused */
  async copy(text: string): Promise<boolean> {
    if (!(await copyText(text))) return false;
    this.copied = true;
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.copied = false;
      this.host.requestUpdate();
    }, 1800);
    this.host.requestUpdate();
    return true;
  }
  /** Back to "Copy" at once – when the summary changes under it */
  reset() {
    this.copied = false;
  }
  hostDisconnected() {
    clearTimeout(this.timer);
  }
}
