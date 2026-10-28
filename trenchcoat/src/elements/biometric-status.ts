import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-biometric-status> – where someone's biometric enrolment stands, one row per modality the page lists: face,
 * fingerprints, iris, DNA, voice, gait, signature… Each row has its icon, its name, one line of detail ("Both eyes ·
 * captured Feb 2024"), a status – enrolled, on file, partial, in progress, missing or expired, each with its own mark
 * – and, when known, a quality or confidence meter with its percentage written out. The header counts what's
 * enrolled; an optional match row above the list shows a score such as "Gallery match 98.4%". Rows can be selected,
 * so the page can show more about one.
 *   · the rows are a listbox: ↑ / ↓ move between them, Home / End to the first and last; Enter or Space selects a row,
 *     or clears it if it's selected; Escape clears it; Tab leaves the list
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-biometric-status .modalities=${[{ id: "iris", label: "Iris", kind: "iris", status: "enrolled", quality: 0.92 }]}></tc-biometric-status>
 */

/** A face in a scan frame: Lucide (ISC, lucide.dev) */
const scanIcon = svg`<path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><path d="M9 9h.01"></path><path d="M15 9h.01"></path>`;

export type BiometricKind = "face" | "fingerprint" | "iris" | "dna" | "voice" | "gait" | "signature" | "palm" | "other";
/** enrolled / on-file: usable · partial: some of it, or low quality · in-progress: being captured or modelled ·
 *  missing: nothing yet · expired: was enrolled, needs recapture */
export type BiometricState = "enrolled" | "on-file" | "partial" | "in-progress" | "missing" | "expired";
export type BiometricModality = {
  id: string;
  label: string;
  /** Picks the icon; "other" when not given */
  kind?: BiometricKind;
  /** One line under the name, e.g. "Both eyes · captured Feb 2024" */
  detail?: string;
  status: BiometricState;
  /** Quality or confidence from 0 to 1, shown as a meter and a percentage */
  quality?: number;
  /** What `quality` measures, e.g. "Confidence"; `qualityLabel` on the element when not given */
  qualityLabel?: string;
};
/** A score shown above the list, e.g. { label: "Gallery match", value: 0.984 } */
export type BiometricMatch = { label: string; value: number; detail?: string };

/** Details of the events */
export type BiometricSelectedChange = { selected: string | null; modality?: BiometricModality };

/** The statuses' names used when the page gives none */
export const defaultBiometricStatusLabels: Record<BiometricState, string> = {
  enrolled: "Enrolled",
  "on-file": "On file",
  partial: "Partial",
  "in-progress": "In progress",
  missing: "Missing",
  expired: "Expired",
};
let uidCount = 0;

/* Modality icons: scan-face, fingerprint, eye, dna, audio-lines, footprints, signature, hand, circle-dot – Lucide
   (ISC, lucide.dev) */
const KIND: Record<BiometricKind, ReturnType<typeof svg>> = {
  face: scanIcon,
  fingerprint: svg`<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"></path><path d="M14 13.12c0 2.38 0 6.38-1 8.88"></path><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"></path><path d="M2 12a10 10 0 0 1 18-6"></path><path d="M2 16h.01"></path><path d="M21.8 16c.2-2 .131-5.354 0-6"></path><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"></path><path d="M8.65 22c.21-.66.45-1.32.57-2"></path><path d="M9 6.8a6 6 0 0 1 9 5.2v2"></path>`,
  iris: svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`,
  dna: svg`<path d="M2 15c6.67-6 13.33 0 20-6"></path><path d="M9 22c1.8-2 2.52-4 2.8-6"></path><path d="M15 2c-1.8 2-2.52 4-2.8 6"></path><path d="m17 6-2.9-2.9"></path><path d="m7 18 2.9 2.9"></path><path d="m6.5 12.5 1 1"></path><path d="m16.5 10.5 1 1"></path><path d="m10 16 1.5 1.5"></path><path d="m14 8-1.5-1.5"></path>`,
  voice: svg`<path d="M2 10v3"></path><path d="M6 6v11"></path><path d="M10 3v18"></path><path d="M14 8v7"></path><path d="M18 5v13"></path><path d="M22 10v3"></path>`,
  gait: svg`<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"></path><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"></path><path d="M16 17h4"></path><path d="M4 13h4"></path>`,
  signature: svg`<path d="m21 17-2.16-1.26a1.6 1.6 0 0 0-2.2.6l-.32.55a1.6 1.6 0 0 1-2.82-.18l-.4-.84a1.6 1.6 0 0 0-2.9.06L9 18"></path><path d="M3 21h18"></path><path d="M14.5 3.5a2.1 2.1 0 0 1 3 3L8 16l-4 1 1-4Z"></path>`,
  palm: svg`<path d="M18 11V6a2 2 0 0 0-4 0"></path><path d="M14 10V4a2 2 0 0 0-4 0v2"></path><path d="M10 10.5V6a2 2 0 0 0-4 0v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>`,
  other: svg`<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="1.5"></circle>`,
};
/* Status marks: check, check-check, circle-half, loader, minus, clock-alert */
const MARK: Record<BiometricState, ReturnType<typeof svg>> = {
  enrolled: svg`<path d="M20 6 9 17l-5-5"></path>`,
  "on-file": svg`<path d="M18 6 7 17l-5-5"></path><path d="m22 10-7.5 7.5L13 16"></path>`,
  partial: svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"></path>`,
  "in-progress": svg`<path d="M12 3v3"></path><path d="M12 18v3"></path><path d="m5.6 5.6 2.1 2.1"></path><path d="m16.3 16.3 2.1 2.1"></path><path d="M3 12h3"></path><path d="M18 12h3"></path>`,
  missing: svg`<path d="M6 12h12"></path>`,
  expired: svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>`,
};
const icon = (body: ReturnType<typeof svg>, size: number, stroke = 1.9) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const pct = (n: number) => `${Math.round(Math.max(0, Math.min(1, n)) * 1000) / 10}%`;

/**
 * Biometric enrolment across modalities – each with its status, detail and a quality meter – with the count
 * enrolled, an optional match score, and selectable rows.
 * @tag tc-biometric-status
 * @fires tc-selected-change - A row was selected or cleared ({ selected, modality }: BiometricSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcBiometricStatus extends TcElement {
  static override ui = "bios";

  /** The heading, and the list's name */
  @property() accessor heading = "Biometrics";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The modalities, a row each, in the order given */
  @property({ attribute: false }) accessor modalities: BiometricModality[] = [];
  /** A score shown above the list, e.g. a gallery match */
  @property({ attribute: false }) accessor match: BiometricMatch | null = null;
  /** The selected row's id. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The statuses' names, merged over the defaults (Enrolled, On file, Partial, In progress, Missing, Expired) */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<BiometricState, string>> = {};
  /** The statuses that count as enrolled in the header */
  @property({ attribute: false }) accessor enrolledStatuses: BiometricState[] = ["enrolled", "on-file"];
  /** What a row's meter measures when the row doesn't say */
  @property({ attribute: "quality-label" }) accessor qualityLabel = "Quality";

  @state() private accessor active = 0;
  @state() private accessor announce = "";

  private uid = `tc-bios-${++uidCount}`;

  private label(s: BiometricState) {
    return this.statusLabels[s] ?? defaultBiometricStatusLabels[s];
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const modality = next === null ? undefined : this.modalities.find((m) => m.id === next);
    if (!this.emit<BiometricSelectedChange>("tc-selected-change", { selected: next, modality }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next === null ? "Selection cleared" : `Selected ${modality?.label}`;
  }

  private focusRow(i: number) {
    if (!this.modalities.length) return;
    this.active = Math.max(0, Math.min(this.modalities.length - 1, i));
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-row="${this.active}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-row]");
    if (!row || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const i = Number(row.dataset.row);
    const moves: Record<string, number> = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: this.modalities.length - 1 };
    if (moves[e.key] !== undefined) {
      e.preventDefault();
      this.focusRow(moves[e.key]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const id = this.modalities[i].id;
      this.setSelected(this.selected === id ? null : id);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.active >= this.modalities.length) this.active = Math.max(0, this.modalities.length - 1);
    if (this.selected !== null && !this.modalities.some((m) => m.id === this.selected)) this.selected = null;
  }

  private renderRow(m: BiometricModality, i: number) {
    const isSel = this.selected === m.id;
    const q = typeof m.quality === "number" && Number.isFinite(m.quality) ? Math.max(0, Math.min(1, m.quality)) : null;
    return html`<li
      class="ui-bios__row"
      role="option"
      data-row=${i}
      data-status=${m.status}
      tabindex=${this.active === i ? 0 : -1}
      aria-selected=${isSel ? "true" : "false"}
      ?data-selected=${isSel}
      @focus=${() => (this.active = i)}
      @pointerdown=${(e: PointerEvent) => {
        this.active = i;
        if (e.pointerType === "mouse") e.preventDefault();
        (e.currentTarget as HTMLElement).focus({ preventScroll: true });
      }}
      @click=${() => this.setSelected(isSel ? null : m.id)}
    >
      <span class="ui-bios__icon" aria-hidden="true">${icon(KIND[m.kind ?? "other"], 16)}</span>
      <span class="ui-bios__text">
        <span class="ui-bios__name">${m.label}</span>
        ${m.detail ? html`<span class="ui-bios__detail"><span class="ui-bios__sr">, </span>${m.detail}</span>` : nothing}
      </span>
      <span class="ui-bios__pill" data-status=${m.status}><span class="ui-bios__sr">, </span>${icon(MARK[m.status], 11, 2.4)}${this.label(m.status)}</span>
      ${q === null
        ? html`<span class="ui-bios__quality" aria-hidden="true"></span>`
        : html`<span class="ui-bios__quality">
            <span class="ui-bios__meter" aria-hidden="true"><span class="ui-bios__meter-fill" style=${`inline-size: ${q * 100}%`}></span></span>
            <span class="ui-bios__pct"><span class="ui-bios__sr">, ${m.qualityLabel ?? this.qualityLabel} </span>${pct(q)}</span>
          </span>`}
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const total = this.modalities.length;
    const enrolled = this.modalities.filter((m) => this.enrolledStatuses.includes(m.status)).length;
    const match = this.match;
    return html`
      <span class="ui-bios__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: scanIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: total ? html`<span class="ui-bios__count"><span class="ui-bios__count-num">${enrolled} of ${total}</span><span class="ui-bios__count-label">enrolled</span></span>` : nothing,
      })}
      <div class="ui-bios__card">
        ${match
          ? html`<div class="ui-bios__match">
              <span class="ui-bios__match-text">
                <span class="ui-bios__match-label">${match.label}</span>
                ${match.detail ? html`<span class="ui-bios__detail">${match.detail}</span>` : nothing}
              </span>
              <span class="ui-bios__match-value">${pct(match.value)}</span>
              <span class="ui-bios__meter ui-bios__meter--match" aria-hidden="true"><span class="ui-bios__meter-fill" style=${`inline-size: ${Math.max(0, Math.min(1, match.value)) * 100}%`}></span></span>
            </div>`
          : nothing}
        ${total
          ? html`<ul class="ui-bios__list" role="listbox" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
              ${repeat(this.modalities, (m) => m.id, (m, i) => this.renderRow(m, i))}
            </ul>`
          : html`<p class="ui-bios__empty">No biometrics recorded yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="bios"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="bios"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="bios"] *, [data-ui="bios"] *::before, [data-ui="bios"] *::after { box-sizing: border-box; }
[data-ui="bios"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="bios"] p { margin: 0; }
[data-ui="bios"] svg { display: block; flex: none; }
.ui-bios__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-bios__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's count ----- */
.ui-bios__count { display: grid; flex: none; justify-items: end; }
.ui-bios__count-num { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-bios__count-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* ----- The match score: a label, the score and a hero meter ----- */
.ui-bios__match { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-bios__match { padding-top: var(--tc-space-2); }
.ui-bios__match-text { display: grid; min-width: 0; }
.ui-bios__match-label { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-bios__match-label { font-weight: var(--tc-font-weight-medium); }
.ui-bios__match-value { font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-bios__meter--match { grid-column: 1 / -1; width: 100% !important; height: var(--tc-meter-h-hero) !important; }
/* ----- The rows: icon, name and detail, status, quality ----- */
.ui-bios__list { padding: var(--tc-space-1-5) !important; }
.ui-bios__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto 112px; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-2-5); border-radius: var(--tc-radius-lg); cursor: pointer; outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-bios__row + .ui-bios__row { margin-top: var(--tc-space-0-5); }
.ui-bios__row:hover { background: var(--tc-fill-subtle); }
.ui-bios__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-bios__row[data-selected] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
.ui-bios__row[data-selected] .ui-bios__detail { color: var(--tc-text-secondary); }
.ui-bios__icon { display: grid; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: var(--tc-avatar-radius-agent); background: var(--tc-fill-default); color: var(--tc-icon-muted); }
.ui-bios__text { display: grid; min-width: 0; }
.ui-bios__name { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-bios__name { font-weight: var(--tc-font-weight-medium); }
.ui-bios__detail { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-bios__pill { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-bios__pill[data-status="enrolled"], .ui-bios__pill[data-status="on-file"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-bios__pill[data-status="partial"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-bios__pill[data-status="in-progress"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-bios__pill[data-status="missing"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-bios__pill[data-status="expired"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-bios__quality { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-bios__meter { display: block; flex: 1; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-bios__meter-fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
[data-status="partial"] .ui-bios__meter-fill { background: var(--tc-status-warning-solid); }
[data-status="expired"] .ui-bios__meter-fill, [data-status="missing"] .ui-bios__meter-fill { background: var(--tc-icon-muted); }
.ui-bios__pct { flex: none; min-width: 40px; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-align: right; font-variant-numeric: tabular-nums; }
.ui-bios__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* Narrow: the status and meter go under the name */
@container (max-width: 460px) {
  .ui-bios__row { grid-template-columns: auto minmax(0, 1fr) auto; row-gap: var(--tc-space-1-5); }
  .ui-bios__quality { grid-column: 2 / -1; }
}
@media (forced-colors: active) {
  .ui-bios__row[data-selected] { outline: 2px solid Highlight; }
  .ui-bios__meter { border: 1px solid CanvasText; }
  .ui-bios__meter-fill { background: CanvasText !important; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="bios"] *, [data-ui="bios"] *::before, [data-ui="bios"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-biometric-status")) customElements.define("tc-biometric-status", TcBiometricStatus);

declare global {
  interface HTMLElementTagNameMap {
    "tc-biometric-status": TcBiometricStatus;
  }
}
