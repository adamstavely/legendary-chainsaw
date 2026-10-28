import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-asset-list> – the assets on record for a person, an account or a company, in the page's groups (Vehicles,
 * Devices …): each with an icon for its kind, its name or model, an identifier – a plate, an IMEI, a serial – masked to
 * its last four characters until revealed, a detail line, what it's linked to and a status – Confirmed, Suspected,
 * Seized, In analysis, Retired, or the page's own. A reveal fires a cancelable tc-revealed-change, so a page can ask
 * for a reason or log it first; Open fires tc-open. Each group's header counts its assets.
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between rows (across groups), ← / → between a row's buttons
 *     (Show identifier, Open), Home / End to the first and last row
 *   · statuses carry a word and a mark as well as a tint, so colour is never the only cue
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-asset-list .groups=${[{ id: "v", label: "Vehicles", assets: [{ id: "a1", kind: "car", name: "Audi A6 Avant",
 *     identifier: "AB-441-KX", identifierLabel: "Plate", status: "confirmed" }] }]}></tc-asset-list>
 */

/** A box: Lucide (ISC, lucide.dev) */
const boxIcon = svg`<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path>`;

export type AssetKind = "car" | "motorcycle" | "phone" | "laptop" | "drive" | "other";
/** The tone a status is drawn in */
export type AssetTone = "success" | "info" | "warning" | "danger" | "neutral";
export type Asset = {
  id: string;
  /** Picks the icon */
  kind?: AssetKind;
  /** Its name or model: "Audi A6 Avant", "iPhone 15 Pro" */
  name: string;
  /** A plate, IMEI or serial; masked to its last four characters unless `masked` is off or it's revealed */
  identifier?: string;
  /** What the identifier is: "Plate", "IMEI", "Serial" */
  identifierLabel?: string;
  /** One quiet line: "Black · 2023" */
  detail?: string;
  /** What it's linked to: "Registered to customer", "Reg. Aurelia Estates" */
  link?: string;
  /** A key of `statuses`: confirmed, suspected, seized, in-analysis, retired, or one of the page's own */
  status: string;
};
export type AssetGroup = { id: string; label: string; assets: Asset[] };

/** Details of the events */
export type AssetOpen = { asset: Asset; group: string };
export type AssetRevealedChange = { revealed: string[]; id: string; shown: boolean };

/** The statuses' names and tones used when the page gives none */
export const defaultAssetStatuses: Record<string, { label: string; tone: AssetTone }> = {
  confirmed: { label: "Confirmed", tone: "success" },
  suspected: { label: "Suspected", tone: "warning" },
  seized: { label: "Seized", tone: "danger" },
  "in-analysis": { label: "In analysis", tone: "info" },
  retired: { label: "Retired", tone: "neutral" },
};

let uidCount = 0;

/* Kinds, status marks, eye, eye-off and arrow: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const KIND: Record<AssetKind, () => ReturnType<typeof lucide>> = {
  car: () => lucide(16, svg`<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle>`),
  motorcycle: () => lucide(16, svg`<circle cx="18.5" cy="17.5" r="3.5"></circle><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="15" cy="5" r="1"></circle><path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>`),
  phone: () => lucide(16, svg`<rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path>`),
  laptop: () => lucide(16, svg`<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"></path>`),
  drive: () => lucide(16, svg`<path d="M22 12H2"></path><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><path d="M6 16h.01"></path><path d="M10 16h.01"></path>`),
  other: () => lucide(16, svg`<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path>`),
};
const MARK: Record<AssetTone, () => ReturnType<typeof lucide>> = {
  success: () => lucide(11, svg`<path d="M20 6 9 17l-5-5"></path>`),
  info: () => lucide(11, svg`<circle cx="12" cy="12" r="4" fill="currentColor"></circle>`),
  warning: () => lucide(11, svg`<path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path>`),
  danger: () => lucide(11, svg`<rect width="18" height="11" x="3" y="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`),
  neutral: () => lucide(11, svg`<path d="M5 12h14"></path>`),
};
const eyeIcon = () => lucide(15, svg`<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"></path><circle cx="12" cy="12" r="3"></circle>`);
const eyeOffIcon = () =>
  lucide(15, svg`<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M14.08 14.16a3 3 0 0 1-4.16-4.16"></path><path d="m2 2 20 20"></path>`);
const arrowIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);

/** "AB-441-KX" → "•••• 1-KX" */
const mask = (n: string) => (n.length <= 4 ? "••••" : `•••• ${n.slice(-4)}`);

/**
 * Assets in groups – vehicles, devices – each with its kind, name, a masked identifier, a detail line, what it's linked
 * to and a status in words, with Open per row.
 * @tag tc-asset-list
 * @fires tc-open - Open was pressed on a row ({ asset, group }: AssetOpen)
 * @fires tc-revealed-change - An identifier was shown or masked again ({ revealed, id, shown }: AssetRevealedChange); cancelable – prevented, it stays as it was
 */
export class TcAssetList extends TcElement {
  static override ui = "asl";

  /** The heading */
  @property() accessor heading = "Assets";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The groups and their assets, in order; an empty group is left out */
  @property({ attribute: false }) accessor groups: AssetGroup[] = [];
  /** Statuses' names and tones, merged over the defaults (confirmed, suspected, seized, in-analysis, retired) */
  @property({ attribute: false }) accessor statuses: Record<string, { label: string; tone: AssetTone }> = {};
  /** Masks identifiers to their last four characters until revealed; set false to show them in full */
  @property({ type: Boolean }) accessor masked = true;
  /** The ids whose identifiers are shown. Changed by the user unless a tc-revealed-change listener calls preventDefault() */
  @property({ attribute: false }) accessor revealed: string[] = [];
  /** The label of each row's open button */
  @property({ attribute: "open-label" }) accessor openLabel = "Open";

  /** The tab stop: a row (across groups) and a button in it (0 Show identifier, 1 Open) */
  @state() private accessor active = { r: 0, c: 1 };
  @state() private accessor announce = "";

  private uid = `tc-asl-${++uidCount}`;

  private get shownGroups() {
    return this.groups.filter((g) => g.assets.length);
  }
  /** Every asset in order, with its group */
  private get rows() {
    return this.shownGroups.flatMap((g) => g.assets.map((a) => ({ a, g: g.id })));
  }
  private statusOf(key: string) {
    const known = this.statuses[key] ?? defaultAssetStatuses[key];
    return known ?? { label: key ? key[0].toUpperCase() + key.slice(1).replace(/-/g, " ") : "Unknown", tone: "neutral" as AssetTone };
  }
  private canReveal(a: Asset) {
    return this.masked && !!a.identifier && a.identifier.length > 4;
  }

  private setRevealed(a: Asset, shown: boolean) {
    const next = shown ? [...this.revealed.filter((x) => x !== a.id), a.id] : this.revealed.filter((x) => x !== a.id);
    if (!this.emit<AssetRevealedChange>("tc-revealed-change", { revealed: next, id: a.id, shown }, { cancelable: true })) return;
    this.revealed = next;
    this.announce = `${a.name} ${(a.identifierLabel ?? "identifier").toLowerCase()} ${shown ? "shown" : "hidden"}`;
  }

  /* ---------- Keyboard: one tab stop for the rows' buttons ---------- */

  private cols(r: number) {
    const row = this.rows[r];
    return row && this.canReveal(row.a) ? [0, 1] : [1];
  }
  private focusAt(r: number, c: number) {
    const n = this.rows.length;
    if (!n) return;
    r = Math.max(0, Math.min(n - 1, r));
    const cols = this.cols(r);
    if (!cols.includes(c)) c = cols[cols.length - 1];
    this.active = { r, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!btn || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const [r, c] = btn.dataset.at!.split(":").map(Number);
    const cols = this.cols(r);
    const i = cols.indexOf(c);
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, cols[Math.max(0, i - 1)]],
      ArrowRight: [r, cols[Math.min(cols.length - 1, i + 1)]],
      Home: [0, c],
      End: [this.rows.length - 1, c],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stop stays on a row and a button that exist
    const n = this.rows.length;
    if (n && (this.active.r >= n || !this.cols(this.active.r).includes(this.active.c))) {
      const r = Math.min(this.active.r, n - 1);
      this.active = { r, c: this.cols(r).includes(this.active.c) ? this.active.c : 1 };
    }
  }

  /* ---------- Rendering ---------- */

  private renderRow(a: Asset, group: string, r: number) {
    const st = this.statusOf(a.status);
    const shown = !this.canReveal(a) || this.revealed.includes(a.id);
    const what = a.identifierLabel ?? "Identifier";
    const tab = (c: number) => (this.active.r === r && this.active.c === c ? 0 : -1);
    return html`<li class="ui-asl__row" data-id=${a.id} data-tone=${st.tone}>
      <span class="ui-asl__icon" aria-hidden="true">${KIND[a.kind ?? "other"]()}</span>
      <div class="ui-asl__main">
        <span class="ui-asl__name">${a.name}</span>
        <span class="ui-asl__meta">
          ${a.identifier
            ? html`<span class="ui-asl__id" ?data-masked=${!shown}
                ><span class="ui-asl__id-label">${what}</span> ${shown
                  ? a.identifier
                  : html`<span aria-hidden="true">${mask(a.identifier)}</span><span class="ui-asl__sr">ending ${a.identifier.slice(-4)}, hidden</span>`}</span
              >`
            : nothing}
          ${a.detail ? html`<span class="ui-asl__detail">${a.detail}</span>` : nothing}
        </span>
        ${a.link ? html`<span class="ui-asl__link">${a.link}</span>` : nothing}
      </div>
      <span class="ui-asl__pill" data-tone=${st.tone}>${MARK[st.tone]()}${st.label}</span>
      <span class="ui-asl__actions">
        ${this.canReveal(a)
          ? html`<button
              type="button"
              class="ui-asl__reveal"
              data-at=${`${r}:0`}
              tabindex=${tab(0)}
              aria-pressed=${shown ? "true" : "false"}
              aria-label=${`Show ${what.toLowerCase()}, ${a.name}`}
              title=${shown ? `Hide ${what.toLowerCase()}` : `Show ${what.toLowerCase()}`}
              @focus=${() => (this.active = { r, c: 0 })}
              @click=${() => this.setRevealed(a, !shown)}
            >${shown ? eyeOffIcon() : eyeIcon()}</button>`
          : nothing}
        <button
          type="button"
          class="ui-asl__open"
          data-at=${`${r}:1`}
          tabindex=${tab(1)}
          aria-label=${`${this.openLabel} ${a.name}`}
          @focus=${() => (this.active = { r, c: 1 })}
          @click=${() => this.emit<AssetOpen>("tc-open", { asset: a, group })}
        ><span aria-hidden="true">${this.openLabel}</span>${arrowIcon()}</button>
      </span>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const groups = this.shownGroups;
    const total = groups.reduce((n, g) => n + g.assets.length, 0);
    let r = 0;
    return html`
      <span class="ui-asl__sr" role="status">${this.announce}</span>
      <span class="ui-asl__sr" id=${`${id}-keys`}>Up and down arrows move between assets, left and right between an asset's buttons</span>
      ${cardHead({
        icon: boxIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: total ? html`<span class="ui-asl__total"><span class="ui-asl__total-n">${total}</span> ${total === 1 ? "asset" : "assets"}</span>` : nothing,
      })}
      <div class="ui-asl__card" @keydown=${this.onKey}>
        ${!total
          ? html`<p class="ui-asl__empty">No assets on record.</p>`
          : groups.map((g) => {
              const start = r;
              r += g.assets.length;
              return html`<section class="ui-asl__group" aria-labelledby=${`${id}-g-${g.id}`}>
                <h4 class="ui-asl__group-head" id=${`${id}-g-${g.id}`}>${g.label}<span class="ui-asl__group-count">${g.assets.length}<span class="ui-asl__sr"> ${g.assets.length === 1 ? "asset" : "assets"}</span></span></h4>
                <ul class="ui-asl__list" aria-labelledby=${`${id}-g-${g.id}`} aria-describedby=${`${id}-keys`}>
                  ${repeat(g.assets, (a) => a.id, (a, i) => this.renderRow(a, g.id, start + i))}
                </ul>
              </section>`;
            })}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="asl"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="asl"] {
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
[data-ui="asl"] *, [data-ui="asl"] *::before, [data-ui="asl"] *::after { box-sizing: border-box; }
:where([data-ui="asl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="asl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="asl"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="asl"] p, [data-ui="asl"] h4 { margin: 0; }
[data-ui="asl"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="asl"] svg[stroke-width] { stroke-width: 1.6; }
.ui-asl__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-asl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-asl__total { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
.ui-asl__total-n { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* ----- A group: its header with the count, then its rows ----- */
.ui-asl__group + .ui-asl__group { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-asl__group-head { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-asl__group-count { display: inline-grid; place-items: center; min-width: var(--tc-pill-h); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); letter-spacing: normal; text-transform: none; color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
/* ----- An asset ----- */
.ui-asl__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-4); }
.ui-asl__row + .ui-asl__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-asl__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
.ui-asl__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-asl__name { overflow: hidden; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-asl__name { font-weight: var(--tc-font-weight-medium); }
.ui-asl__meta { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-asl__id { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-asl__id-label { font-family: var(--tc-font-sans); color: var(--tc-text-muted); }
.ui-asl__id[data-masked] { letter-spacing: var(--tc-tracking-caps); }
.ui-asl__id[data-masked] .ui-asl__id-label { letter-spacing: normal; }
.ui-asl__link { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* The status pill: a tint, a mark and a word */
.ui-asl__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-asl__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-asl__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-asl__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-asl__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-asl__pill[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-asl__actions { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-asl__reveal { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-asl__reveal:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-asl__reveal[aria-pressed="true"] { color: var(--tc-text-primary); }
.ui-asl__open { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-asl__open:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-asl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 520px) {
  .ui-asl__row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-asl__pill { grid-column: 2; grid-row: 2; justify-self: start; }
  .ui-asl__actions { grid-column: 3; grid-row: 1 / span 2; }
}
@media (forced-colors: active) { .ui-asl__pill { border: 1px solid CanvasText; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="asl"] *, [data-ui="asl"] *::before, [data-ui="asl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-asset-list")) customElements.define("tc-asset-list", TcAssetList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-asset-list": TcAssetList;
  }
}
