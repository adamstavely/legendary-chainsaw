import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { isMac } from "./internal/util";

/*
 * <tc-risk-register> – a programme's risks as a likelihood × impact heat grid beside the register itself. The grid is
 * 5 × 5, likelihood across and impact up, each cell shaded by its band – low, medium, high or critical, named in words
 * as well – with how many risks sit in it. A risk that has moved since the last review (`previous`) leaves a faint
 * arrow from its old cell. Pick a cell to show only its risks in the register; the register sorts by score, title,
 * owner or status, and a risk opens below its row with its mitigation and two 1–5 pickers to rescore it.
 *   · the grid is a WAI-ARIA grid: arrows move between cells, Home / End to the row's ends, ⌘/Ctrl+Home / End to the
 *     corners; Enter or Space filters by the cell (again clears it), Escape clears the filter
 *   · a risk's title opens and closes its detail (tc-selected-change); rescoring fires a cancelable tc-risks-change
 *     with the whole list as it will be – prevent it and update `risks` yourself to keep them in your own store
 *   · score = likelihood × impact: 1–4 low, 5–9 medium, 10–16 high, 20–25 critical
 *   · narrow, the grid goes above the register; narrower still, the register's rows become cards
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-risk-register .risks=${[{ id: "r1", title: "Storm season delays", likelihood: 4, impact: 3 }]}></tc-risk-register>
 */

export type RiskStatus = "open" | "mitigating" | "accepted" | "closed";
export type RiskTrend = "up" | "down" | "flat";
export type RiskLevel = 1 | 2 | 3 | 4 | 5;
export type Risk = {
  id: string;
  title: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  owner?: string;
  status?: RiskStatus;
  /** What's being done about it */
  mitigation?: string;
  /** Whether it's getting worse (up), better (down) or holding (flat) */
  trend?: RiskTrend;
  /** Where it sat at the last review; drawn as an arrow to where it is now */
  previous?: { likelihood: RiskLevel; impact: RiskLevel };
};
export type RiskBand = "low" | "medium" | "high" | "critical";
export type RiskCell = { likelihood: RiskLevel; impact: RiskLevel };
export type RiskSortKey = "score" | "title" | "owner" | "status";
export type RiskSortDir = "asc" | "desc";

/** Details of the events */
export type RiskSelectedChange = { selected: string | null; risk?: Risk };
export type RiskCellChange = { cell: RiskCell | null };
export type RiskSortChange = { sort: RiskSortKey; sortDir: RiskSortDir };
export type RiskRisksChange = {
  risks: Risk[];
  change: { id: string; likelihood: RiskLevel; impact: RiskLevel };
};

/** The words for each level, 1 to 5; give either list in `labels` to change it */
export type RiskLabels = { likelihood: string[]; impact: string[] };
export const defaultRiskLabels: RiskLabels = {
  likelihood: ["Rare", "Unlikely", "Possible", "Likely", "Almost certain"],
  impact: ["Negligible", "Minor", "Moderate", "Major", "Severe"],
};
const BAND_WORDS: Record<RiskBand, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
const STATUS_WORDS: Record<RiskStatus, string> = {
  open: "Open",
  mitigating: "Mitigating",
  accepted: "Accepted",
  closed: "Closed",
};
const TREND_WORDS: Record<RiskTrend, string> = {
  up: "Getting worse",
  down: "Improving",
  flat: "Holding",
};
const STATUS_ORDER: RiskStatus[] = ["open", "mitigating", "accepted", "closed"];
const LEVELS: RiskLevel[] = [1, 2, 3, 4, 5];

/** A score's band: 1–4 low, 5–9 medium, 10–16 high, 20–25 critical */
export function riskBand(score: number): RiskBand {
  return score >= 20
    ? "critical"
    : score >= 10
      ? "high"
      : score >= 5
        ? "medium"
        : "low";
}
export const riskScore = (r: Pick<Risk, "likelihood" | "impact">) =>
  r.likelihood * r.impact;

let uidCount = 0;

/* shield-alert, arrow-up-right, arrow-down-right, arrow-right, x: Lucide (ISC, lucide.dev) */
const shieldIcon = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg
    width=${size}
    height=${size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    ${body}
  </svg>`;
const trendIcon = (t: RiskTrend) =>
  t === "up"
    ? lucide(14, svg`<path d="M7 7h10v10"></path><path d="M7 17 17 7"></path>`)
    : t === "down"
      ? lucide(
          14,
          svg`<path d="m7 7 10 10"></path><path d="M17 7v10H7"></path>`,
        )
      : lucide(
          14,
          svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`,
        );
const xIcon = () =>
  lucide(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);

/**
 * A risk register – a 5 × 5 likelihood × impact heat grid with counts and moves since the last review, beside a
 * sortable register whose risks open with their mitigation and can be rescored.
 * @tag tc-risk-register
 * @fires tc-selected-change - A risk was opened or closed ({ selected, risk }: RiskSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-cell-change - The grid's filter changed ({ cell }: RiskCellChange); cancelable – prevented, `cell` stays as it was
 * @fires tc-sort-change - The register's order changed ({ sort, sortDir }: RiskSortChange); cancelable – prevented, the order stays
 * @fires tc-risks-change - A risk was rescored ({ risks, change }: RiskRisksChange); cancelable – prevented, `risks` stays as it was
 */
export class TcRiskRegister extends TcElement {
  static override ui = "rrg";

  /** The heading, and the grid's name */
  @property() accessor heading = "Risk register";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The risks. Rescoring changes them unless tc-risks-change is prevented */
  @property({ attribute: false }) accessor risks: Risk[] = [];
  /** The risk whose detail is open. Changed by the user unless tc-selected-change is prevented */
  @property() accessor selected: string | null = null;
  /** The grid cell the register is filtered to, or null for all. Changed by the user unless tc-cell-change is prevented */
  @property({ attribute: false }) accessor cell: RiskCell | null = null;
  /** The register's order. Changed by the user unless tc-sort-change is prevented */
  @property() accessor sort: RiskSortKey = "score";
  /** Which way the register is sorted */
  @property({ attribute: "sort-dir" }) accessor sortDir: RiskSortDir = "desc";
  /** The words for the five likelihood and impact levels */
  @property({ attribute: false }) accessor labels: Partial<RiskLabels> = {};
  /** Read only: risks can be opened but not rescored */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;

  /** @internal The grid cell holding the tab stop, as [likelihood, impact] */
  @state() accessor active: [RiskLevel, RiskLevel] = [1, 5];
  /** @internal The polite status line */
  @state() accessor announce = "";

  private uid = `tc-rrg-${++uidCount}`;

  constructor() {
    super();
    // Focus never drops to <body> when the detail it was in closes
    new FocusRescueController(this, () =>
      this.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]'),
    );
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (
      changed.has("risks") &&
      this.selected &&
      !this.risks.some((r) => r.id === this.selected)
    )
      this.selected = null;
  }

  /* ---------- The model ---------- */

  private get words(): RiskLabels {
    const pad = (list: string[] | undefined, d: string[]) =>
      d.map((w, i) => list?.[i] ?? w);
    return {
      likelihood: pad(this.labels.likelihood, defaultRiskLabels.likelihood),
      impact: pad(this.labels.impact, defaultRiskLabels.impact),
    };
  }

  private inCell(l: number, i: number) {
    return this.risks.filter((r) => r.likelihood === l && r.impact === i);
  }

  /** The register's rows: the cell's risks (or all), in the chosen order */
  private get rows() {
    const list = this.cell
      ? this.inCell(this.cell.likelihood, this.cell.impact)
      : [...this.risks];
    const dir = this.sortDir === "asc" ? 1 : -1;
    const key = (r: Risk): string | number =>
      this.sort === "score"
        ? riskScore(r)
        : this.sort === "title"
          ? r.title.toLowerCase()
          : this.sort === "owner"
            ? (r.owner ?? "").toLowerCase()
            : STATUS_ORDER.indexOf(r.status ?? "open");
    return list.sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      const c =
        typeof ka === "number" && typeof kb === "number"
          ? ka - kb
          : String(ka).localeCompare(String(kb));
      return (
        c * dir || riskScore(b) - riskScore(a) || a.title.localeCompare(b.title)
      );
    });
  }

  private cellName(l: RiskLevel, i: RiskLevel) {
    const w = this.words;
    return `Likelihood ${l} ${w.likelihood[l - 1]}, impact ${i} ${w.impact[i - 1]}`;
  }

  /* ---------- Actions ---------- */

  private setCell(cell: RiskCell | null) {
    const same =
      cell &&
      this.cell &&
      cell.likelihood === this.cell.likelihood &&
      cell.impact === this.cell.impact;
    const next = same ? null : cell;
    if (
      !this.emit<RiskCellChange>(
        "tc-cell-change",
        { cell: next },
        { cancelable: true },
      )
    )
      return;
    this.cell = next;
    const n = next
      ? this.inCell(next.likelihood, next.impact).length
      : this.risks.length;
    this.announce = next
      ? `Showing ${n} ${n === 1 ? "risk" : "risks"}: ${this.cellName(next.likelihood, next.impact)}`
      : `Showing all ${n} risks`;
  }

  private setSelected(id: string | null) {
    if (id === this.selected) return;
    const risk = id ? this.risks.find((r) => r.id === id) : undefined;
    if (
      !this.emit<RiskSelectedChange>(
        "tc-selected-change",
        { selected: id, risk },
        { cancelable: true },
      )
    )
      return;
    this.selected = id;
  }

  private setSort(key: RiskSortKey) {
    // A new column starts in its natural order: highest scores first, names A–Z
    const sortDir: RiskSortDir =
      key === this.sort
        ? this.sortDir === "asc"
          ? "desc"
          : "asc"
        : key === "score"
          ? "desc"
          : "asc";
    if (
      !this.emit<RiskSortChange>(
        "tc-sort-change",
        { sort: key, sortDir },
        { cancelable: true },
      )
    )
      return;
    this.sort = key;
    this.sortDir = sortDir;
  }

  private rescore(r: Risk, likelihood: RiskLevel, impact: RiskLevel) {
    if (this.readonly || (likelihood === r.likelihood && impact === r.impact))
      return;
    const risks = this.risks.map((x) =>
      x.id === r.id ? { ...x, likelihood, impact } : x,
    );
    if (
      !this.emit<RiskRisksChange>(
        "tc-risks-change",
        { risks, change: { id: r.id, likelihood, impact } },
        { cancelable: true },
      )
    ) {
      this.requestUpdate();
      return;
    }
    this.risks = risks;
    const s = likelihood * impact;
    this.announce = `${r.title}: score ${s}, ${BAND_WORDS[riskBand(s)]}`;
  }

  /* ---------- The grid's keys ---------- */

  private focusCell(l: number, i: number) {
    const ll = Math.max(1, Math.min(5, l)) as RiskLevel;
    const ii = Math.max(1, Math.min(5, i)) as RiskLevel;
    this.active = [ll, ii];
    void this.updateComplete.then(() =>
      this.querySelector<HTMLElement>(`[data-cell="${ll}:${ii}"]`)?.focus(),
    );
  }

  private onGridKey = (e: KeyboardEvent) => {
    const cellEl = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-cell]",
    );
    if (!cellEl || e.isComposing || e.altKey) return;
    const [l, i] = cellEl.dataset.cell!.split(":").map(Number);
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    // Rows run impact 5 (top) to 1; columns likelihood 1 to 5
    const moves: Record<string, [number, number]> = {
      ArrowUp: [l, i + 1],
      ArrowDown: [l, i - 1],
      ArrowLeft: [l - 1, i],
      ArrowRight: [l + 1, i],
      Home: mod ? [1, 5] : [1, i],
      End: mod ? [5, 1] : [5, i],
    };
    const m = moves[e.key];
    if (m) {
      e.preventDefault();
      this.focusCell(m[0], m[1]);
      return;
    }
    if (e.metaKey || e.ctrlKey) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setCell({ likelihood: l as RiskLevel, impact: i as RiskLevel });
    } else if (e.key === "Escape" && this.cell) {
      e.preventDefault();
      this.setCell(null);
    }
  };

  /* ---------- Rendering ---------- */

  private renderGrid() {
    const id = this.uid;
    const w = this.words;
    const moved = this.risks.filter(
      (r) =>
        r.previous &&
        (r.previous.likelihood !== r.likelihood ||
          r.previous.impact !== r.impact),
    );
    // Cell centres in a 5 × 5 box: likelihood across, impact up
    const cx = (l: number) => l - 0.5;
    const cy = (i: number) => 5 - i + 0.5;
    return html`<div class="ui-rrg__grid-wrap">
      <span class="ui-rrg__axis-y" aria-hidden="true">Impact</span>
      <div class="ui-rrg__ylabels" aria-hidden="true">
        ${[...LEVELS]
          .reverse()
          .map((i) => html`<span>${w.impact[i - 1]}</span>`)}
      </div>
      <div class="ui-rrg__plot">
        <div
          class="ui-rrg__grid"
          role="grid"
          aria-labelledby=${`${id}-title`}
          aria-describedby=${`${id}-keys`}
          aria-rowcount="5"
          aria-colcount="5"
          @keydown=${this.onGridKey}
        >
          ${[...LEVELS].reverse().map(
            (i, r) =>
              html`<div class="ui-rrg__grow" role="row" aria-rowindex=${r + 1}>
                ${LEVELS.map((l) => {
                  const n = this.inCell(l, i).length;
                  const band = riskBand(l * i);
                  const on =
                    !!this.cell &&
                    this.cell.likelihood === l &&
                    this.cell.impact === i;
                  const isActive = this.active[0] === l && this.active[1] === i;
                  return html`<div
                    class="ui-rrg__cell"
                    role="gridcell"
                    aria-colindex=${l}
                    data-cell=${`${l}:${i}`}
                    data-band=${band}
                    ?data-on=${on}
                    ?data-empty=${!n}
                    aria-selected=${on ? "true" : "false"}
                    aria-label=${`${this.cellName(l, i)}: ${n} ${n === 1 ? "risk" : "risks"}, ${BAND_WORDS[band]}`}
                    tabindex=${isActive ? 0 : -1}
                    @click=${() => {
                      this.active = [l, i];
                      this.setCell({ likelihood: l, impact: i });
                    }}
                    @focus=${() => (this.active = [l, i])}
                  >
                    ${n
                      ? html`<span class="ui-rrg__n" aria-hidden="true"
                          >${n}</span
                        >`
                      : nothing}
                  </div>`;
                })}
              </div>`,
          )}
        </div>
        ${moved.length
          ? html`<svg
              class="ui-rrg__moves"
              viewBox="0 0 5 5"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <marker
                  id=${`${id}-head`}
                  viewBox="0 0 6 6"
                  refX="5"
                  refY="3"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0 6 3 0 6z" fill="currentColor"></path>
                </marker>
              </defs>
              ${moved.map((r) => {
                const x1 = cx(r.previous!.likelihood);
                const y1 = cy(r.previous!.impact);
                const x2 = cx(r.likelihood);
                const y2 = cy(r.impact);
                // Stop short of the centres, so the arrow sits between the counts
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.hypot(dx, dy) || 1;
                const k = 0.28 / len;
                return svg`<line x1=${x1 + dx * k} y1=${y1 + dy * k} x2=${x2 - dx * k} y2=${y2 - dy * k} marker-end=${`url(#${id}-head)`}></line>`;
              })}
            </svg>`
          : nothing}
      </div>
      <span></span>
      <div class="ui-rrg__xlabels" aria-hidden="true">
        ${LEVELS.map((l) => html`<span>${w.likelihood[l - 1]}</span>`)}
      </div>
      <span></span>
      <span class="ui-rrg__axis-x" aria-hidden="true">Likelihood</span>
      <p class="tc-sr-only" id=${`${id}-keys`}>
        Arrow keys move between cells. Enter shows only that cell's risks;
        Escape shows them all.
      </p>
    </div>`;
  }

  private renderPicker(r: Risk, which: "likelihood" | "impact") {
    const w = this.words[which];
    const value = r[which];
    const name = `${this.uid}-${r.id}-${which}`;
    return html`<fieldset class="ui-rrg__picker">
      <legend class="ui-rrg__picker-label">
        ${which === "likelihood" ? "Likelihood" : "Impact"}
        <span class="ui-rrg__picker-word">${w[value - 1]}</span>
      </legend>
      <div class="ui-rrg__seg">
        ${LEVELS.map(
          (v) =>
            html`<label
              class="ui-rrg__seg-opt"
              ?data-on=${v === value}
              title=${w[v - 1]}
            >
              <input
                type="radio"
                class="tc-sr-only"
                name=${name}
                .checked=${v === value}
                ?disabled=${this.readonly}
                aria-label=${`${v} ${w[v - 1]}`}
                @change=${() =>
                  this.rescore(
                    r,
                    which === "likelihood" ? v : r.likelihood,
                    which === "impact" ? v : r.impact,
                  )}
              /><span aria-hidden="true">${v}</span>
            </label>`,
        )}
      </div>
    </fieldset>`;
  }

  private renderDetail(r: Risk) {
    const s = riskScore(r);
    return html`<div class="ui-rrg__detail" id=${`${this.uid}-d-${r.id}`}>
      <div class="ui-rrg__detail-head">
        <p class="ui-rrg__detail-score">
          Score ${s} ·
          ${BAND_WORDS[riskBand(s)]}${r.previous
            ? html` <span class="ui-rrg__was"
                >(was ${riskScore(r.previous)})</span
              >`
            : nothing}
        </p>
        <button
          type="button"
          class="ui-rrg__close"
          @click=${() => {
            const id = r.id;
            this.setSelected(null);
            void this.updateComplete.then(() =>
              this.querySelector<HTMLElement>(`#${this.uid}-t-${id}`)?.focus(),
            );
          }}
        >
          ${xIcon()}<span class="tc-sr-only">Close ${r.title}</span>
        </button>
      </div>
      <p class="ui-rrg__mitigation">
        ${r.mitigation
          ? html`<span class="ui-rrg__mit-label">Mitigation</span>
              ${r.mitigation}`
          : html`<span class="ui-rrg__muted"
              >No mitigation recorded yet.</span
            >`}
      </p>
      ${this.readonly
        ? nothing
        : html`<div class="ui-rrg__pickers">
            ${this.renderPicker(r, "likelihood")}${this.renderPicker(
              r,
              "impact",
            )}
          </div>`}
    </div>`;
  }

  private renderTable() {
    const rows = this.rows;
    const cols: [RiskSortKey, string][] = [
      ["score", "Score"],
      ["title", "Risk"],
      ["owner", "Owner"],
      ["status", "Status"],
    ];
    const head = (key: RiskSortKey, label: string) => {
      const on = this.sort === key;
      return html`<th
        scope="col"
        class=${`ui-rrg__th ui-rrg__th--${key}`}
        aria-sort=${on
          ? this.sortDir === "asc"
            ? "ascending"
            : "descending"
          : "none"}
      >
        <button
          type="button"
          class="ui-rrg__sort"
          ?data-on=${on}
          @click=${() => this.setSort(key)}
        >
          ${label}<span class="ui-rrg__sort-mark" aria-hidden="true"
            >${on ? (this.sortDir === "asc" ? "↑" : "↓") : ""}</span
          >
        </button>
      </th>`;
    };
    return html`<div class="ui-rrg__register">
      <div class="ui-rrg__filter-line">
        ${this.cell
          ? html`<span class="ui-rrg__chip"
              >${this.cellName(this.cell.likelihood, this.cell.impact)}<button
                type="button"
                class="ui-rrg__chip-x"
                @click=${() => this.setCell(null)}
              >
                ${xIcon()}<span class="tc-sr-only">Show all risks</span>
              </button></span
            >`
          : html`<span class="ui-rrg__muted"
              >All ${this.risks.length} risks</span
            >`}
      </div>
      ${rows.length
        ? html`<table
            class="ui-rrg__table"
            aria-labelledby=${`${this.uid}-title`}
          >
            <thead>
              <tr>
                ${cols.map(([k, l]) => head(k, l))}
                <th scope="col" class="ui-rrg__th ui-rrg__th--trend">Trend</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r) => {
                const s = riskScore(r);
                const band = riskBand(s);
                const open = this.selected === r.id;
                return html`<tr
                    class="ui-rrg__row"
                    data-id=${r.id}
                    ?data-open=${open}
                  >
                    <td class="ui-rrg__td ui-rrg__td--score" data-label="Score">
                      <span class="ui-rrg__badge" data-band=${band}
                        >${s}<span class="ui-rrg__badge-band"
                          >${BAND_WORDS[band]}</span
                        ></span
                      ><span class="ui-rrg__lxi"
                        >${r.likelihood}×${r.impact}</span
                      >
                    </td>
                    <td class="ui-rrg__td ui-rrg__td--title" data-label="Risk">
                      <button
                        type="button"
                        class="ui-rrg__title"
                        id=${`${this.uid}-t-${r.id}`}
                        aria-expanded=${open ? "true" : "false"}
                        aria-controls=${`${this.uid}-d-${r.id}`}
                        @click=${() => this.setSelected(open ? null : r.id)}
                      >
                        ${r.title}
                      </button>
                    </td>
                    <td class="ui-rrg__td" data-label="Owner">
                      ${r.owner ?? html`<span class="ui-rrg__muted">–</span>`}
                    </td>
                    <td class="ui-rrg__td" data-label="Status">
                      <span
                        class="ui-rrg__status"
                        data-status=${r.status ?? "open"}
                        >${STATUS_WORDS[r.status ?? "open"]}</span
                      >
                    </td>
                    <td class="ui-rrg__td ui-rrg__td--trend" data-label="Trend">
                      ${r.trend
                        ? html`<span
                            class="ui-rrg__trend"
                            data-trend=${r.trend}
                            title=${TREND_WORDS[r.trend]}
                            >${trendIcon(r.trend)}<span class="tc-sr-only"
                              >${TREND_WORDS[r.trend]}</span
                            ></span
                          >`
                        : html`<span class="ui-rrg__muted">–</span>`}
                    </td>
                  </tr>
                  ${open
                    ? html`<tr class="ui-rrg__detail-row">
                        <td colspan="5">${this.renderDetail(r)}</td>
                      </tr>`
                    : nothing}`;
              })}
            </tbody>
          </table>`
        : html`<p class="ui-rrg__empty">
            ${this.risks.length
              ? "No risks in this cell."
              : "No risks recorded yet."}
          </p>`}
    </div>`;
  }

  protected override render() {
    const counts = (["critical", "high", "medium", "low"] as RiskBand[])
      .map(
        (b) =>
          [
            b,
            this.risks.filter((r) => riskBand(riskScore(r)) === b).length,
          ] as const,
      )
      .filter(([, n]) => n);
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: shieldIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: counts.length
          ? html`<span class="ui-rrg__legend"
              >${counts.map(
                ([b, n], i) =>
                  html`${i ? " " : ""}<span
                      class="ui-rrg__legend-item"
                      data-band=${b}
                      ><span class="ui-rrg__swatch" aria-hidden="true"></span
                      >${n} ${BAND_WORDS[b].toLowerCase()}</span
                    >`,
              )}</span
            >`
          : nothing,
      })}
      <div class="ui-rrg__card">${this.renderGrid()}${this.renderTable()}</div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="rrg"] {
  --tc-rrg-cell: 44px;
  --tc-rrg-low: var(--tc-status-success-bg);
  --tc-rrg-medium: var(--tc-tone-amber-bg);
  --tc-rrg-high: var(--tc-status-warning-bg);
  --tc-rrg-critical: var(--tc-status-danger-bg);
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rrg"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-rrg__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rrg"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rrg__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="rrg"] *, [data-ui="rrg"] *::before, [data-ui="rrg"] *::after { box-sizing: border-box; }
:where([data-ui="rrg"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rrg"] :is(button, [tabindex]):focus-visible, .ui-rrg__seg-opt:has(:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="rrg"]) :is(p, fieldset, legend) { margin: 0; padding: 0; }
[data-ui="rrg"] fieldset { min-width: 0; border: 0; }
[data-ui="rrg"] svg { display: block; flex: none; }
/* Bands: a fill and a word, never the colour alone */
[data-ui="rrg"] [data-band="low"] { --band: var(--tc-rrg-low); --band-fg: var(--tc-status-success-fg); }
[data-ui="rrg"] [data-band="medium"] { --band: var(--tc-rrg-medium); --band-fg: var(--tc-tone-amber-fg); }
[data-ui="rrg"] [data-band="high"] { --band: var(--tc-rrg-high); --band-fg: var(--tc-status-warning-fg); }
[data-ui="rrg"] [data-band="critical"] { --band: var(--tc-rrg-critical); --band-fg: var(--tc-status-danger-fg); }
.ui-rrg__legend { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-rrg__legend-item { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-rrg__swatch { width: var(--tc-space-2-5); height: var(--tc-space-2-5); border-radius: var(--tc-radius-2xs); background: var(--band); box-shadow: inset 0 0 0 1px var(--band-fg); }
/* ----- Layout: the grid beside the register, stacked when narrow ----- */
.ui-rrg__card { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: var(--tc-space-5); padding: var(--tc-space-4); }
/* ----- The grid ----- */
.ui-rrg__grid-wrap { display: grid; grid-template-columns: auto auto calc(5 * var(--tc-rrg-cell)); grid-template-rows: calc(5 * var(--tc-rrg-cell)) auto auto; column-gap: var(--tc-space-1-5); row-gap: var(--tc-space-1); }
.ui-rrg__axis-y { writing-mode: vertical-rl; transform: rotate(180deg); align-self: center; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rrg__axis-x { grid-column: 3; justify-self: center; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rrg__ylabels { display: grid; grid-template-rows: repeat(5, 1fr); align-items: center; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: right; }
.ui-rrg__xlabels { grid-column: 3; display: grid; grid-template-columns: repeat(5, 1fr); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: center; }
/* Words stay whole: a long one ("Unlikely") may run a little past its column rather than break */
.ui-rrg__xlabels > span { padding: 0 var(--tc-space-0-5); overflow-wrap: normal; hyphens: manual; }
.ui-rrg__plot { position: relative; }
.ui-rrg__grid { display: grid; grid-template-rows: repeat(5, var(--tc-rrg-cell)); gap: var(--tc-space-0-5); }
.ui-rrg__grow { display: grid; grid-template-columns: repeat(5, var(--tc-rrg-cell)); gap: var(--tc-space-0-5); }
.ui-rrg__cell { display: grid; place-items: center; border-radius: var(--tc-radius-xs); background: var(--band); color: var(--band-fg); cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), filter var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rrg__cell[data-empty] { background: color-mix(in srgb, var(--band) 45%, transparent); }
.ui-rrg__cell:hover { box-shadow: inset 0 0 0 1.5px var(--band-fg); }
.ui-rrg__cell[data-on] { box-shadow: inset 0 0 0 2px var(--tc-text-primary); }
.ui-rrg__n { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; }
.ui-rrg__moves { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; color: var(--tc-text-muted); pointer-events: none; }
.ui-rrg__moves line { stroke: currentColor; stroke-width: 1.5; stroke-dasharray: 3 2; vector-effect: non-scaling-stroke; opacity: 0.8; }
/* ----- The register ----- */
.ui-rrg__register { display: grid; gap: var(--tc-space-2); min-width: 0; }
.ui-rrg__filter-line { display: flex; align-items: center; min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); }
.ui-rrg__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-selected); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
.ui-rrg__chip-x { display: grid; place-items: center; width: var(--tc-space-5); height: var(--tc-space-5); border-radius: var(--tc-radius-full); color: var(--tc-icon-muted); }
.ui-rrg__chip-x:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-rrg__muted { color: var(--tc-text-muted); }
.ui-rrg__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); }
.ui-rrg__th { padding: 0 var(--tc-space-2) var(--tc-space-1-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: left; white-space: nowrap; }
.ui-rrg__sort { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); border-radius: var(--tc-radius-xs); color: var(--tc-text-muted); }
.ui-rrg__sort:hover, .ui-rrg__sort[data-on] { color: var(--tc-text-primary); }
.ui-rrg__sort-mark { min-width: 1ch; }
.ui-rrg__td { padding: var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-primary); vertical-align: middle; }
.ui-rrg__row[data-open] > .ui-rrg__td { border-bottom-color: transparent; background: var(--tc-fill-subtle); }
.ui-rrg__td--score { white-space: nowrap; }
.ui-rrg__badge { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--band); color: var(--band-fg); font-weight: var(--tc-font-weight-strong); font-variant-numeric: tabular-nums; }
.ui-rrg__badge-band { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-rrg__lxi { margin-left: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rrg__title { min-height: var(--tc-control-h-sm); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-align: left; }
.ui-rrg__title:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-rrg__status { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-rrg__status[data-status="mitigating"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-rrg__status[data-status="closed"] { color: var(--tc-text-muted); }
.ui-rrg__trend { display: inline-grid; place-items: center; }
.ui-rrg__trend[data-trend="up"] { color: var(--tc-status-danger-fg); }
.ui-rrg__trend[data-trend="down"] { color: var(--tc-status-success-fg); }
.ui-rrg__trend[data-trend="flat"] { color: var(--tc-text-muted); }
.ui-rrg__detail-row > td { padding: 0 var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-fill-subtle); }
.ui-rrg__detail { display: grid; gap: var(--tc-space-2-5); animation: ui-rrg-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rrg__detail-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-rrg__detail-score { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rrg__was { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-rrg__close { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-rrg__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rrg__mitigation { color: var(--tc-text-secondary); }
.ui-rrg__mit-label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-rrg__pickers { display: flex; flex-wrap: wrap; gap: var(--tc-space-2) var(--tc-space-5); }
.ui-rrg__picker { display: grid; gap: var(--tc-space-1); }
.ui-rrg__picker-label { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-rrg__picker-word { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-rrg__seg { display: inline-flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rrg__seg-opt { display: inline-grid; place-items: center; min-width: var(--tc-control-h-sm); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; cursor: pointer; }
.ui-rrg__seg-opt[data-on] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-rrg__empty { padding: var(--tc-space-5) 0; color: var(--tc-text-muted); text-align: center; }
@keyframes ui-rrg-in { from { opacity: 0; transform: translateY(-2px); } }
/* Narrow: the grid above the register */
@container (max-width: 700px) {
  .ui-rrg__card { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .ui-rrg__register { justify-self: stretch; }
}
/* Narrower: the register's rows become cards */
@container (max-width: 480px) {
  [data-ui="rrg"] { --tc-rrg-cell: 38px; }
  .ui-rrg__table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .ui-rrg__table, .ui-rrg__table tbody, .ui-rrg__row, .ui-rrg__td, .ui-rrg__detail-row, .ui-rrg__detail-row > td { display: block; }
  .ui-rrg__row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--tc-space-1) var(--tc-space-2); padding: var(--tc-space-2-5) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
  .ui-rrg__td { padding: 0; border: 0; }
  .ui-rrg__row[data-open] > .ui-rrg__td { background: none; }
  .ui-rrg__td--title { grid-column: 1 / -1; grid-row: 1; }
  .ui-rrg__td:not(.ui-rrg__td--title)::before { content: attr(data-label) " "; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
}
@media (forced-colors: active) {
  .ui-rrg__cell { border: 1px solid CanvasText; }
  .ui-rrg__cell[data-on] { outline: 2px solid Highlight; }
  .ui-rrg__seg-opt[data-on] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rrg"] *, [data-ui="rrg"] *::before, [data-ui="rrg"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-risk-register"))
  customElements.define("tc-risk-register", TcRiskRegister);

declare global {
  interface HTMLElementTagNameMap {
    "tc-risk-register": TcRiskRegister;
  }
}
