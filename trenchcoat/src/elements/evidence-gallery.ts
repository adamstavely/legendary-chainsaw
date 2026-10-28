import { html, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import type { DataColumn, DataRow, TagTone } from "./data-table";
import type { ImageGridAction, ImageGridBadgeTone, ImageGridTile, ImageGridTilesChange } from "./image-grid";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";
import "./data-table";
import "./image-grid";
import "./segmented-control";

/*
 * <tc-evidence-gallery> – the images behind a set of claims, with whether each is attested and how many claims lean
 * on it (the Lit port of blocks/evidence-gallery.tsx):
 *   · a filter by attestation – All, Attested, Unverified, Failed – with a count on each
 *   · the library's Image Grid: the images, their alt text, Compare (a wipe between two) and Download – each tile
 *     carries its attestation as a badge and its linked claims as a note; one column when the gallery is narrow
 *   · the library's Data Table, read only and in the same order: each item's kind, attestation, linked claims and
 *     source – sortable, so "most-cited" or "failed first" is a click
 * The grid and its table sit side by side when there's room, the table under the grid when not. Alt text edited in
 * the grid is kept here until `items` changes, and reported with tc-alt-change.
 * The pieces carry the look: Standard trays and cards, or Clean cards.
 *
 *   <tc-evidence-gallery heading="Evidence" subtitle="Claim 2291" .items=${[…]}></tc-evidence-gallery>
 */

export type Attestation = "attested" | "unverified" | "failed";

export type EvidenceItem = {
  id: string;
  /** What it is, e.g. "Loading bay camera, 06:12" */
  title: string;
  /** e.g. "Photo", "Scan", "Map" */
  kind: string;
  /** The image (or a still of it) – a data: URL works too */
  src: string;
  /** What the image shows, for people who can't see it */
  alt: string;
  attestation: Attestation;
  /** How many claims cite it */
  claims: number;
  /** Where it came from, e.g. "Site camera 2" */
  source?: string;
};

export type EvidenceFilter = "all" | Attestation;

/** Details of the events */
export type EvidenceFilterChange = { filter: EvidenceFilter };
export type EvidenceAltChange = { item: EvidenceItem; alt: string };

/** The words for the attestation states */
export const defaultAttestationLabels: Record<Attestation, string> = { attested: "Attested", unverified: "Unverified", failed: "Failed" };
const TONES: Record<Attestation, TagTone> = { attested: "green", unverified: "amber", failed: "pink" };
/** The same states on the image tiles' badges */
const BADGE_TONES: Record<Attestation, ImageGridBadgeTone> = { attested: "success", unverified: "warning", failed: "danger" };
const ORDER: Attestation[] = ["attested", "unverified", "failed"];
const ACTIONS: ImageGridAction[] = ["compare", "download"];
const COLUMNS: DataColumn[] = [
  { key: "title", label: "Item", type: "text" },
  { key: "attestation", label: "Attestation", type: "tag", width: "128px" },
  { key: "claims", label: "Claims", type: "number", width: "96px" },
  { key: "source", label: "Source", type: "text", width: "30%" },
];
/** Below this width the grid shows one column */
const ONE_COLUMN = 440;

/**
 * The images behind a set of claims: a filter by attestation, an image grid with each image's attestation and linked
 * claims, and the same items in a sortable, read-only table.
 * @tag tc-evidence-gallery
 * @fires tc-filter-change - Another filter was picked ({ filter }: EvidenceFilterChange); cancelable – prevented, `filter` stays
 * @fires tc-alt-change - An alt text was edited in the grid ({ item, alt }: EvidenceAltChange); cancelable – prevented, the old alt text stays
 */
export class TcEvidenceGallery extends TcElement {
  static override ui = "evg";

  /** The evidence, in display order */
  @property({ attribute: false }) accessor items: EvidenceItem[] = [];
  /** Which items show: "all", "attested", "unverified" or "failed" */
  @property() accessor filter: EvidenceFilter = "all";
  /** Words for the attestation states, merged over defaultAttestationLabels */
  @property({ attribute: false }) accessor attestationLabels: Partial<Record<Attestation, string>> = {};
  /** The grid's heading */
  @property() accessor heading = "Evidence";
  /** A line under the grid's heading, e.g. the case or report it belongs to */
  @property() accessor subtitle: string | undefined = undefined;

  /** Alt text edited in the grid, by item id – kept until `items` changes */
  @state() private accessor alts: Record<string, string> = {};
  @state() private accessor width = 0;
  private observer: ResizeObserver | undefined;

  override connectedCallback() {
    super.connectedCallback();
    if (typeof ResizeObserver === "undefined") return;
    this.observer = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w !== this.width) this.width = w;
    });
    this.observer.observe(this);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    this.observer = undefined;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("items") && changed.get("items") !== undefined) this.alts = {};
  }

  private get labels() {
    return { ...defaultAttestationLabels, ...this.attestationLabels };
  }
  private get shown() {
    return (this.items ?? []).filter((i) => this.filter === "all" || i.attestation === this.filter);
  }
  private count(f: EvidenceFilter) {
    const items = this.items ?? [];
    return f === "all" ? items.length : items.filter((i) => i.attestation === f).length;
  }

  private pickFilter(next: string) {
    if (next === this.filter || !(next === "all" || (ORDER as string[]).includes(next))) return;
    const filter = next as EvidenceFilter;
    if (this.emit<EvidenceFilterChange>("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
  }

  private onTiles = (e: CustomEvent<ImageGridTilesChange>) => {
    // The grid's own event stops here: the page hears tc-alt-change, with the item
    e.stopPropagation();
    e.preventDefault();
    for (const t of e.detail.tiles) {
      const item = this.items.find((i) => i.id === t.id);
      if (!item || t.alt === (this.alts[t.id] ?? item.alt)) continue;
      if (this.emit<EvidenceAltChange>("tc-alt-change", { item, alt: t.alt }, { cancelable: true })) this.alts = { ...this.alts, [t.id]: t.alt };
    }
  };

  protected override render() {
    const labels = this.labels;
    const shown = this.shown;
    const look = this.resolvedLook;
    const tiles: ImageGridTile[] = shown.map((i) => ({
      id: i.id,
      src: i.src,
      alt: this.alts[i.id] ?? i.alt,
      label: i.title,
      badge: labels[i.attestation],
      badgeTone: BADGE_TONES[i.attestation] ?? "neutral",
      meta: `${i.claims} ${i.claims === 1 ? "claim" : "claims"}`,
    }));
    const rows: DataRow[] = shown.map((i) => ({ id: i.id, title: `${i.title} · ${i.kind}`, attestation: labels[i.attestation] ?? "", claims: i.claims, source: i.source ?? "" }));
    const tagTones = Object.fromEntries(ORDER.map((a) => [labels[a], TONES[a]]));
    const options: SegmentOption[] = (["all", ...ORDER] as EvidenceFilter[]).map((f) => ({ value: f, label: f === "all" ? "All" : labels[f], badge: String(this.count(f)) }));
    const claims = shown.reduce((n, i) => n + (Number.isFinite(i.claims) ? i.claims : 0), 0);
    const attested = shown.filter((i) => i.attestation === "attested").length;
    const columns = this.width && this.width < ONE_COLUMN ? 1 : 2;

    return html`<div class="ui-evg__bar">
        <tc-segmented-control
          look=${look}
          aria-label="Show"
          .options=${options}
          .value=${this.filter}
          @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
            // The inner control's event stops here: the page hears tc-filter-change
            e.stopPropagation();
            e.preventDefault();
            this.pickFilter(e.detail.value);
          }}
        ></tc-segmented-control>
        <p class="ui-evg__summary" aria-live="polite">
          ${shown.length} ${shown.length === 1 ? "item" : "items"} · ${attested} attested · ${claims} linked ${claims === 1 ? "claim" : "claims"}
        </p>
      </div>
      <div class="ui-evg__panes">
        <tc-image-grid
          look=${look}
          heading=${this.heading}
          .prompt=${this.subtitle}
          .tiles=${tiles}
          .actions=${ACTIONS}
          columns=${columns}
          .ratio=${4 / 3}
          fill
          @tc-tiles-change=${this.onTiles}
        ></tc-image-grid>
        <tc-data-table look=${look} heading="Attestation" readonly .columns=${COLUMNS} .rows=${rows} .tagTones=${tagTones}></tc-data-table>
      </div>`;
  }

  static override css = /* css */ `
[data-ui="evg"] {
  container-type: inline-size;
  display: grid;
  gap: var(--tc-space-4);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="evg"] *, [data-ui="evg"] *::before, [data-ui="evg"] *::after { box-sizing: border-box; }
.ui-evg__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-4); min-width: 0; }
.ui-evg__bar > tc-segmented-control { max-width: 100%; overflow-x: auto; }
.ui-evg__summary { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
/* The grid and its table side by side when there's room, the table under the grid when not */
.ui-evg__panes { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; gap: var(--tc-space-4); }
@container (max-width: 980px) { .ui-evg__panes { grid-template-columns: minmax(0, 1fr); } }
`;
}

if (!customElements.get("tc-evidence-gallery")) customElements.define("tc-evidence-gallery", TcEvidenceGallery);

declare global {
  interface HTMLElementTagNameMap {
    "tc-evidence-gallery": TcEvidenceGallery;
  }
}
