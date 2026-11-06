import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { chartLoader } from "./internal/chart/loaders";
import { chartType, resolveSpecData, specToElement, validateSpec, type ChartSpec, type SpecIssue } from "./internal/chart/spec";

/*
 * <tc-chart> – any of the library's charts from a JSON spec: { type, data, encoding, options, title, description }.
 * Ported from ztd-charts' <Chart spec> (MIT, © 2026 Junhan2). The spec is checked first – an unknown type, data in the
 * wrong shape or a channel naming a field the rows don't have shows what's wrong instead of a chart – then the chart
 * named by `type` is loaded and drawn inside this element with the spec's fields and options. Only properties the chart
 * declares are set, so a spec from a model or a tool can't reach anything else on the page. { url } data is fetched
 * before drawing. The look, and the chart's events, pass through: listen for tc-mark-click on this element.
 *
 *   <tc-chart .spec=${{ type: "bar", title: "Samples processed", data: rows, encoding: { x: "lab", y: "samples" } }}></tc-chart>
 */

/** Details of tc-spec-check */
export type ChartSpecCheck = { valid: boolean; errors: SpecIssue[]; warnings: SpecIssue[] };


/** Properties a spec never sets, though the chart declares them: its own working state */
const PRIVATE = new Set(["look", "contextLook", "measured", "active", "via", "onScreen", "zoomed", "brushTick"]);

/**
 * Any chart from a JSON spec – checked first, then drawn with the chart the spec names; what's wrong is shown instead
 * of a chart, and reported.
 * @tag tc-chart
 * @fires tc-spec-check - The spec was checked ({ valid, errors, warnings }: ChartSpecCheck)
 */
export class TcChart extends TcElement {
  static override ui = "cht";

  /** The chart as JSON: { type, data, encoding?, options?, title?, description? } */
  @property({ attribute: false }) accessor spec: ChartSpec | null = null;

  /** @internal What's wrong with the spec */
  @state() accessor problems: SpecIssue[] = [];
  /** @internal The chart element drawn */
  private chart: HTMLElement | null = null;
  private run = 0;

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("spec")) void this.apply(this.spec);
  }

  private async apply(spec: ChartSpec | null) {
    const run = ++this.run;
    if (!spec) {
      this.problems = [];
      this.drop();
      return;
    }
    let s = spec;
    try {
      // { url } data: fetched once per spec, then checked like inline rows
      if (spec.data && !Array.isArray(spec.data) && typeof (spec.data as { url?: unknown }).url === "string") {
        s = await resolveSpecData(spec);
        if (run !== this.run) return;
      }
    } catch (e) {
      this.report({ valid: false, errors: [{ path: "data.url", code: "fetch", message: (e as Error).message }], warnings: [] });
      return;
    }
    const check = validateSpec(s);
    this.report(check);
    if (!check.valid) return;
    const { tag, props } = specToElement(s);
    await chartLoader(tag);
    if (run !== this.run) return;
    if (this.chart?.localName !== tag) {
      this.drop();
      this.chart = document.createElement(tag);
      this.renderRoot.insertBefore(this.chart, this.renderOptions.renderBefore ?? null);
    }
    const el = this.chart as HTMLElement & Record<string, unknown>;
    const declared = (customElements.get(tag) as unknown as { elementProperties?: Map<string, unknown> } | undefined)?.elementProperties;
    for (const [k, v] of Object.entries(props)) if (declared?.has(k) && !PRIVATE.has(k)) el[k] = v;
    if (this.look) el.look = this.look;
  }

  private report(check: ChartSpecCheck) {
    this.problems = check.errors;
    if (!check.valid) this.drop();
    this.emit<ChartSpecCheck>("tc-spec-check", check);
  }

  private drop() {
    this.chart?.remove();
    this.chart = null;
  }

  protected override render() {
    if (!this.problems.length) return nothing;
    const type = this.spec && typeof this.spec.type === "string" ? chartType(this.spec.type)?.name : undefined;
    return html`<div class="ui-cht__problem" role="alert">
      <p class="ui-cht__title">${type ? `This ${type.toLowerCase()} can't be drawn` : "This chart can't be drawn"}</p>
      <ul class="ui-cht__list">
        ${this.problems.map((p) => html`<li><code>${p.path || "spec"}</code> ${p.message}</li>`)}
      </ul>
    </div>`;
  }

  static override css = /* css */ `
[data-ui="cht"] { display: block; }
.ui-cht__problem {
  padding: var(--tc-space-4);
  border: 1px dashed var(--tc-border-strong);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
}
.ui-cht__title { margin: 0 0 var(--tc-space-1-5); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-cht__list { margin: 0; padding-left: var(--tc-space-4); }
.ui-cht__list code { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
`;
}

if (!customElements.get("tc-chart")) customElements.define("tc-chart", TcChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-chart": TcChart;
  }
}
