import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-model-routing> – where a request goes. The routing reads as a route, top to bottom:
 *   · Rules, in order – each one's conditions ("Input is over 100k tokens" and "Plan is Enterprise"), then the target
 *     model it sends to. The first rule that matches wins.
 *   · Otherwise – the fallback chain: the default target, then the next one whenever a target is unavailable.
 * Each target shows the health and circuit-breaker state the app reports, and its region; with `residency` set, a
 * target outside the allowed regions is flagged. Test a route asks the app (tc-route-test) and shows its explanation
 * (`testResult`): which rule matched and why, which targets were skipped and where the request ended up. The element
 * never routes anything itself.
 *   · reorder: drag a row's handle, or focus the handle and press ↑ / ↓ (← / → too in the fallback chain); Home / End
 *     move it to the start or end. Focus stays on the handle and a status message says where it went.
 *
 *   <tc-model-routing .targets=${targets} .value=${{ rules, fallbacks }} .health=${health}></tc-model-routing>
 *
 * Every change to the rules or the chain fires a cancelable tc-value-change ({ value }) – call preventDefault() to
 * control `value`. Standard is a white card on a gray tray, the rules on a numbered rail with filled target chips.
 * Clean is one white card with hairline dividers, outlined target chips and quieter numbers.
 */

/** A model or deployment a rule can send to */
export type RouteTarget = {
  id: string;
  label: string;
  /** A quiet line, e.g. "200k context" */
  detail?: string;
  /** Where it runs, e.g. "EU" – compared with `residency` */
  region?: string;
};
/** One rule: when every condition holds, send to `target` */
export type RouteRule = {
  id: string;
  /** A short name, e.g. "Long inputs" */
  name?: string;
  /** The conditions as the app writes them: "Input is over 100k tokens" */
  conditions: string[];
  /** The target's id */
  target: string;
};
export type ModelRoutingValue = {
  /** Checked in order; the first that matches wins */
  rules: RouteRule[];
  /** Target ids, tried in order when no rule matches or a target is unavailable */
  fallbacks: string[];
};
export type RouteHealthStatus = "healthy" | "degraded" | "down" | "unknown";
export type RouteBreakerState = "closed" | "open" | "half-open";
/** A target's health as the app reports it */
export type RouteTargetHealth = {
  status: RouteHealthStatus;
  /** The circuit breaker: open sends nothing; half-open lets a few test requests through */
  breaker?: RouteBreakerState;
  /** A quiet line, e.g. "p95 2.4s" or "Opened 3 min ago after 5 failures" */
  note?: string;
};
/** The app's answer to a route test */
export type RouteTestResult = {
  /** The input that was tested */
  input: string;
  /** The id of the rule that matched, or null when none did and the fallback chain was used */
  rule: string | null;
  /** The id of the target the request would go to, or null when nothing could take it */
  target: string | null;
  /** Why, in order – "Input is 140k tokens, over 100k", "Breaker open on Atlas Long: skipped" */
  reasons: string[];
  /** Target ids passed over on the way */
  skipped?: string[];
};
/** tc-value-change */
export type ModelRoutingChange = { value: ModelRoutingValue };
/** tc-route-test */
export type RouteTestRequest = { input: string; value: ModelRoutingValue };

const STATUS: Record<RouteHealthStatus, string> = { healthy: "Healthy", degraded: "Degraded", down: "Down", unknown: "No data" };
const BREAKER: Record<RouteBreakerState, string> = { closed: "Breaker closed", open: "Breaker open", "half-open": "Breaker half-open" };
const DEFAULT_VALUE: ModelRoutingValue = { rules: [], fallbacks: [] };
let instances = 0;

/* route, grip-vertical, arrow-right, x, flask-conical: Lucide (ISC, lucide.dev) */
const lucide = (cls: string, body: ReturnType<typeof svg>) =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const routeIcon = svg`<circle cx="6" cy="19" r="3"></circle><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"></path><circle cx="18" cy="5" r="3"></circle>`;
const gripIcon = () =>
  lucide("ui-mrt__icon", svg`<circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle>`);
const arrowIcon = () => lucide("ui-mrt__arrow", svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);
const xIcon = () => lucide("ui-mrt__icon", svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const testIcon = () => lucide("ui-mrt__icon", svg`<path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path>`);

type ListName = "rules" | "fallbacks";
/** A step's part in the tested route: passed over, taken, skipped (unavailable) or never reached */
export type RoutePathStep = "passed" | "hit" | "skipped" | "after";
type Drag = { list: ListName; from: number; to: number; pointer: number };

/**
 * Model routing as a route: rules in order, then the fallback chain, with each target's health, breaker and region,
 * and a route test the app answers.
 * @tag tc-model-routing
 * @fires tc-value-change - The rules or the fallback chain changed ({ value: ModelRoutingValue }); cancelable – prevent it to control `value`
 * @fires tc-route-test - Test a route was submitted ({ input, value }: RouteTestRequest); answer by setting `testResult`; cancelable – prevented, nothing shows as pending
 */
export class TcModelRouting extends TcElement {
  static override ui = "mrt";

  /** The heading, and the group's name */
  @property() accessor heading = "Model routing";
  /** The rules and the fallback chain. Changed by the user unless tc-value-change is prevented */
  @property({ attribute: false }) accessor value: ModelRoutingValue = DEFAULT_VALUE;
  /** Every model or deployment a rule or the chain can name */
  @property({ attribute: false }) accessor targets: RouteTarget[] = [];
  /** Each target's health and breaker, by target id, as the app reports them */
  @property({ attribute: false }) accessor health: Record<string, RouteTargetHealth> = {};
  /** The regions requests may be sent to; targets elsewhere are flagged. Empty means no constraint */
  @property({ attribute: false }) accessor residency: string[] = [];
  /** The app's answer to the last route test; setting it ends the pending state */
  @property({ attribute: false }) accessor testResult: RouteTestResult | null = null;
  /** Placeholder in the route test's field */
  @property({ attribute: "test-placeholder" }) accessor testPlaceholder = "Describe a request, e.g. 140k-token contract from an EU customer";
  /** Shows the route without reorder handles or remove buttons */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;

  @state() private accessor pending: string | null = null;
  @state() private accessor drag: Drag | null = null;
  @state() private accessor announcement = "";
  @state() private accessor draft = "";

  private readonly uid = `tc-mrt${++instances}`;

  constructor() {
    super();
    // Focus never drops to <body> when the row it was on is removed
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-mrt__handle, .ui-mrt__test-input"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  /* ---------- The model ---------- */

  private target(id: string) {
    return this.targets.find((t) => t.id === id);
  }
  private name(id: string) {
    return this.target(id)?.label ?? id;
  }
  private ruleName(r: RouteRule, i: number) {
    return r.name ?? `Rule ${i + 1}`;
  }
  /** A target outside the allowed regions */
  private outside(t: RouteTarget | undefined) {
    return !!(t?.region && this.residency.length && !this.residency.includes(t.region));
  }

  private commit(next: ModelRoutingValue, say: string) {
    if (this.emit<ModelRoutingChange>("tc-value-change", { value: next }, { cancelable: true })) {
      this.value = next;
      this.announcement = say;
      return true;
    }
    this.requestUpdate();
    return false;
  }

  private items(list: ListName): unknown[] {
    return list === "rules" ? this.value.rules : this.value.fallbacks;
  }
  private label(list: ListName, i: number) {
    return list === "rules" ? this.ruleName(this.value.rules[i], i) : this.name(this.value.fallbacks[i]);
  }

  private move(list: ListName, from: number, to: number) {
    const items = [...this.items(list)];
    if (to < 0 || to >= items.length || to === from) return;
    const what = this.label(list, from);
    const [it] = items.splice(from, 1);
    items.splice(to, 0, it);
    const next = { ...this.value, [list]: items } as ModelRoutingValue;
    if (!this.commit(next, `${what} moved to position ${to + 1} of ${items.length}`)) return;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-list="${list}"] [data-at="${to}"] .ui-mrt__handle`)?.focus());
  }

  private removeAt(list: ListName, i: number) {
    const items = [...this.items(list)];
    const what = this.label(list, i);
    items.splice(i, 1);
    const ok = this.commit({ ...this.value, [list]: items } as ModelRoutingValue, `${what} removed`);
    if (!ok) return;
    void this.updateComplete.then(() => {
      const row = this.querySelector<HTMLElement>(`[data-list="${list}"] [data-at="${Math.min(i, items.length - 1)}"]`);
      (row?.querySelector<HTMLElement>(".ui-mrt__handle") ?? row?.querySelector<HTMLElement>(".ui-mrt__remove") ?? this.querySelector<HTMLElement>(".ui-mrt__test-input"))?.focus();
    });
  }

  private addFallback(id: string) {
    if (!id || this.value.fallbacks.includes(id)) return;
    this.commit({ ...this.value, fallbacks: [...this.value.fallbacks, id] }, `${this.name(id)} added to the fallback chain`);
  }

  /** Runs a route test: the app answers by setting `testResult` */
  test(input = this.draft) {
    this.draft = input;
    const text = input.trim();
    if (!text) return;
    if (this.emit<RouteTestRequest>("tc-route-test", { input: text, value: this.value }, { cancelable: true })) this.pending = text;
  }

  /* ---------- Reordering ---------- */

  private onHandleKey(e: KeyboardEvent, list: ListName, i: number) {
    const last = this.items(list).length - 1;
    const horizontal = list === "fallbacks";
    const to =
      e.key === "ArrowUp" || (horizontal && e.key === "ArrowLeft") ? i - 1
      : e.key === "ArrowDown" || (horizontal && e.key === "ArrowRight") ? i + 1
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (to === null) return;
    e.preventDefault();
    this.move(list, i, Math.max(0, Math.min(last, to)));
  }

  private onPointerDown(e: PointerEvent, list: ListName, i: number) {
    if (e.button !== 0 || this.readonly) return;
    const handle = e.currentTarget as HTMLElement;
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {
      // A synthetic pointer (tests, automation) has nothing to capture; moves still reach the handle
    }
    this.drag = { list, from: i, to: i, pointer: e.pointerId };
  }

  private onPointerMove(e: PointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    const rows = [...this.querySelectorAll<HTMLElement>(`[data-list="${d.list}"] > [data-at]`)];
    const horizontal = d.list === "fallbacks" && rows.length > 1 && rows[0].getBoundingClientRect().top === rows[1].getBoundingClientRect().top;
    // The new index is the number of other rows the pointer has passed
    const at = horizontal ? e.clientX : e.clientY;
    const to = rows.filter((row, n) => {
      if (n === d.from) return false;
      const r = row.getBoundingClientRect();
      return at > (horizontal ? r.left + r.width / 2 : r.top + r.height / 2);
    }).length;
    if (to !== d.to) this.drag = { ...d, to };
  }

  private onPointerUp(e: PointerEvent) {
    const d = this.drag;
    if (!d || e.pointerId !== d.pointer) return;
    this.drag = null;
    if (d.to !== d.from) this.move(d.list, d.from, d.to);
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("testResult") && this.testResult) this.pending = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-h`);
  }

  /* ---------- Rendering ---------- */

  private renderTarget(id: string, opts: { matched?: boolean; skipped?: boolean } = {}) {
    const t = this.target(id);
    const h = this.health[id];
    const r = this.testResult;
    const skipped = !!opts.skipped;
    const chosen = !!r && r.target === id;
    const outside = this.outside(t);
    const tone = h ? (h.status === "down" || h.breaker === "open" ? "danger" : h.status === "degraded" || h.breaker === "half-open" ? "warning" : h.status === "healthy" ? "success" : "neutral") : "neutral";
    return html`<span class="ui-mrt__target" data-tone=${tone} ?data-chosen=${chosen} ?data-skipped=${skipped} ?data-matched=${opts.matched}>
      <span class="ui-mrt__target-main">
        <span class="ui-mrt__dot" aria-hidden="true"></span>
        <span class="ui-mrt__target-name">${t?.label ?? id}</span>
        ${t?.region ? html`<span class="ui-mrt__region" ?data-outside=${outside}>${t.region}</span>` : nothing}
      </span>
      <span class="ui-mrt__target-meta">
        ${h ? html`<span class="ui-mrt__status">${STATUS[h.status]}</span>` : nothing}
        ${h?.breaker && h.breaker !== "closed" ? html`<span class="ui-mrt__breaker" data-breaker=${h.breaker}>${BREAKER[h.breaker]}</span>` : nothing}
        ${outside ? html`<span class="ui-mrt__outside">Outside ${this.residency.join(", ")}</span>` : nothing}
        ${h?.note ? html`<span class="ui-mrt__note">${h.note}</span>` : nothing}
        ${t?.detail && !h?.note ? html`<span class="ui-mrt__note">${t.detail}</span>` : nothing}
      </span>
    </span>`;
  }

  private handle(list: ListName, i: number, name: string, total: number) {
    if (this.readonly || total < 2) return nothing;
    return html`<button
      type="button"
      class="ui-mrt__handle"
      aria-label=${`Move ${name}, position ${i + 1} of ${total}`}
      aria-describedby=${`${this.uid}-move-hint`}
      @keydown=${(e: KeyboardEvent) => this.onHandleKey(e, list, i)}
      @pointerdown=${(e: PointerEvent) => this.onPointerDown(e, list, i)}
      @pointermove=${(e: PointerEvent) => this.onPointerMove(e)}
      @pointerup=${(e: PointerEvent) => this.onPointerUp(e)}
      @pointercancel=${() => (this.drag = null)}
    >${gripIcon()}</button>`;
  }

  private removeButton(list: ListName, i: number, name: string) {
    if (this.readonly) return nothing;
    return html`<button type="button" class="ui-mrt__remove" aria-label=${`Remove ${name}`} @click=${() => this.removeAt(list, i)}>${xIcon()}</button>`;
  }

  private dropState(list: ListName, i: number) {
    const d = this.drag;
    if (!d || d.list !== list) return undefined;
    if (i === d.from) return "dragging";
    if (d.to === d.from) return undefined;
    if (d.to < d.from && i === d.to) return "before";
    if (d.to > d.from && i === d.to) return "after";
    return undefined;
  }

  /** Where the last test went: each rule's and each fallback's part in it */
  get path(): { rules: RoutePathStep[]; fallbacks: RoutePathStep[]; fellBack: boolean } | null {
    const r = this.testResult;
    if (!r) return null;
    const { rules, fallbacks } = this.value;
    const hit = r.rule === null ? -1 : rules.findIndex((x) => x.id === r.rule);
    const skipped = new Set(r.skipped ?? []);
    const fellBack = hit < 0 || skipped.has(rules[hit].target) || r.target !== rules[hit].target;
    const chosen = fellBack && r.target ? fallbacks.indexOf(r.target) : -1;
    return {
      rules: rules.map((_, i) => (hit < 0 || i < hit ? "passed" : i === hit ? "hit" : "after")),
      fallbacks: fallbacks.map((id, i) => (!fellBack ? "after" : i === chosen ? "hit" : skipped.has(id) || (chosen >= 0 && i < chosen) || chosen < 0 ? "skipped" : "after")),
      fellBack,
    };
  }

  /** The rail beside each step: a node on a line that lights up where the request went */
  private rail(node: unknown, into: boolean, out: boolean, step: number, last = false) {
    return html`<span class="ui-mrt__rail" ?data-in=${into} ?data-out=${out} ?data-last=${last} style=${styleMap({ "--step": String(step) })}>${node}</span>`;
  }

  private renderRules() {
    const rules = this.value.rules;
    const path = this.path;
    if (!rules.length) return html`<p class="ui-mrt__empty">No rules – every request takes the fallback chain.</p>`;
    return html`<ol class="ui-mrt__rules" data-list="rules" aria-labelledby=${`${this.uid}-rules`}>
      ${repeat(
        rules,
        (r) => r.id,
        (r, i) => {
          const name = this.ruleName(r, i);
          const step = path?.rules[i];
          // Falling back from a matched rule runs the line past the rules below it, to Otherwise
          const bypass = step === "after" && !!path?.fellBack;
          const into = (!!step && step !== "after") || bypass;
          const out = step === "passed" || (step === "hit" && !!path?.fellBack) || bypass;
          const skipped = step === "hit" && path!.fellBack;
          return html`<li class="ui-mrt__rule" data-at=${i} data-drop=${this.dropState("rules", i) ?? ""} data-path=${step ?? ""} ?data-matched=${step === "hit"}>
            ${this.rail(html`<span class="ui-mrt__num" aria-hidden="true">${i + 1}</span>`, into, out, i + 1)}
            ${this.handle("rules", i, name, rules.length)}
            <span class="ui-mrt__when">
              <span class="ui-mrt__rule-name"
                >${name}${step === "hit"
                  ? html`<span class="ui-mrt__hit">Matched</span>`
                  : step === "passed"
                    ? html`<span class="ui-mrt__tag">No match</span>`
                    : step === "after"
                      ? html`<span class="ui-mrt__tag">Not checked</span>`
                      : nothing}</span
              >
              <span class="ui-mrt__conds">
                <span class="ui-mrt__kw">If</span>
                ${r.conditions.length
                  ? r.conditions.map((c, n) => html`${n ? html` <span class="ui-mrt__kw">and</span> ` : nothing}<span class="ui-mrt__cond">${c}</span>`)
                  : html`<span class="ui-mrt__cond">any request</span>`}
              </span>
            </span>
            <span class="ui-mrt__to"><span class="ui-mrt__sr">, send to </span>${arrowIcon()}${this.renderTarget(r.target, { matched: step === "hit", skipped })}</span>
            ${this.removeButton("rules", i, name)}
          </li>`;
        },
      )}
    </ol>`;
  }

  private renderFallbacks() {
    const chain = this.value.fallbacks;
    const unused = this.targets.filter((t) => !chain.includes(t.id));
    const path = this.path;
    const used = !!path?.fellBack;
    const step = this.value.rules.length + 1;
    return html`<div class="ui-mrt__otherwise" data-path=${path ? (used ? "hit" : "after") : ""}>
      ${this.rail(html`<span class="ui-mrt__node" aria-hidden="true"></span>`, used, false, step, true)}
      <div class="ui-mrt__otherwise-body">
        <div class="ui-mrt__section-head">
          <span class="ui-mrt__section-label" id=${`${this.uid}-fb`}>Otherwise, try in order</span>
          ${path ? (used ? html`<span class="ui-mrt__hit">${this.testResult!.rule === null ? "Used" : "Fell back"}</span>` : html`<span class="ui-mrt__tag">Not needed</span>`) : nothing}
        </div>
        ${chain.length
          ? html`<ol class="ui-mrt__chain" data-list="fallbacks" aria-labelledby=${`${this.uid}-fb`}>
              ${repeat(
                chain,
                (id) => id,
                (id, i) => {
                  const at = path?.fallbacks[i];
                  const lit = at === "hit" || at === "skipped";
                  return html`<li class="ui-mrt__link" data-at=${i} data-drop=${this.dropState("fallbacks", i) ?? ""} data-path=${at ?? ""} style=${styleMap({ "--step": String(step + i) })}>
                    ${i ? html`<span class="ui-mrt__then" ?data-lit=${lit} aria-hidden="true">${arrowIcon()}</span>` : nothing}
                    <span class="ui-mrt__link-body">
                      ${this.handle("fallbacks", i, this.name(id), chain.length)}
                      ${this.renderTarget(id, { skipped: at === "skipped" })}
                      ${this.removeButton("fallbacks", i, this.name(id))}
                    </span>
                  </li>`;
                },
              )}
            </ol>`
          : html`<p class="ui-mrt__warn">No fallback – a request no rule matches has nowhere to go.</p>`}
        ${!this.readonly && unused.length
          ? html`<label class="ui-mrt__add">
              <span class="ui-mrt__sr">Add a fallback</span>
              <select
                class="ui-mrt__select"
                @change=${(e: Event) => {
                  const sel = e.target as HTMLSelectElement;
                  this.addFallback(sel.value);
                  sel.value = "";
                }}
              >
                <option value="" selected>Add a fallback…</option>
                ${unused.map((t) => html`<option value=${t.id}>${t.label}${t.region ? ` · ${t.region}` : ""}</option>`)}
              </select>
            </label>`
          : nothing}
      </div>
    </div>`;
  }

  private renderTest() {
    const r = this.testResult;
    const id = this.uid;
    return html`<form
      class="ui-mrt__test"
      @submit=${(e: Event) => {
        e.preventDefault();
        this.test();
      }}
    >
      <label class="ui-mrt__section-label" for=${`${id}-test`}>Test a route</label>
      <div class="ui-mrt__test-row">
        <input
          id=${`${id}-test`}
          class="ui-mrt__test-input"
          type="text"
          autocomplete="off"
          placeholder=${this.testPlaceholder}
          .value=${this.draft}
          @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
        />
        <button type="submit" class="ui-mrt__btn" ?disabled=${!this.draft.trim()} aria-disabled=${this.pending ? "true" : "false"}>${testIcon()}${this.pending ? "Testing…" : "Test"}</button>
      </div>
      <div class="ui-mrt__result" role="status" aria-live="polite">
        ${this.pending
          ? html`<p class="ui-mrt__pending">Asking where “${this.pending}” would go…</p>`
          : r
            ? html`<div class="ui-mrt__answer" data-state=${r.target ? "routed" : "none"}>
                <p class="ui-mrt__verdict">${r.rule !== null
                    ? html`<strong>${this.ruleName(this.value.rules.find((x) => x.id === r.rule) ?? { id: r.rule, conditions: [], target: "" }, Math.max(0, this.value.rules.findIndex((x) => x.id === r.rule)))}</strong> matched`
                    : html`<strong>No rule matched</strong> – the fallback chain was used`}${r.target ? html`, so it goes to <strong>${this.name(r.target)}</strong>.` : html`, and no target could take it.`}</p>
                ${r.reasons.length ? html`<ol class="ui-mrt__reasons">${r.reasons.map((x) => html`<li>${x}</li>`)}</ol>` : nothing}
                <p class="ui-mrt__tested">Tested: “${r.input}”</p>
              </div>`
            : nothing}
      </div>
    </form>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const ids = new Set([...this.value.rules.map((r) => r.target), ...this.value.fallbacks]);
    const reported = [...ids].map((id) => this.health[id]).filter(Boolean);
    const open = reported.filter((h) => h.breaker === "open" || h.status === "down").length;
    const shaky = reported.filter((h) => h.breaker === "half-open" || h.status === "degraded").length;
    const pill = !reported.length
      ? nothing
      : open
        ? html`<span class="ui-mrt__pill" data-tone="danger">${open === 1 ? "1 target unavailable" : `${open} targets unavailable`}</span>`
        : shaky
          ? html`<span class="ui-mrt__pill" data-tone="warning">${shaky === 1 ? "1 target degraded" : `${shaky} targets degraded`}</span>`
          : html`<span class="ui-mrt__pill" data-tone="success">All targets healthy</span>`;
    const rules = this.value.rules.length;
    // The header (.tc-head): on the tray above the card in Standard, the card's first row in Clean
    const head = cardHead({
      icon: routeIcon,
      title: this.heading,
      id: `${this.uid}-h`,
      subtitle: html`${rules === 1 ? "1 rule" : `${rules} rules`} · ${this.value.fallbacks.length === 1 ? "1 fallback" : `${this.value.fallbacks.length} fallbacks`}${this.residency.length
        ? html` · <span class="ui-mrt__residency">Stays in ${this.residency.join(", ")}</span>`
        : nothing}`,
      aside: pill === nothing ? undefined : pill,
    });
    const body = html`
      <div class="ui-mrt__route">
        <div class="ui-mrt__start" data-path=${this.testResult ? "hit" : ""}>
          ${this.rail(html`<span class="ui-mrt__node" aria-hidden="true"></span>`, false, !!this.testResult && (this.value.rules.length > 0 || !!this.path?.fellBack), 0)}
          <span class="ui-mrt__start-text">
            <span class="ui-mrt__section-label" id=${`${this.uid}-rules`}>Rules, first match wins</span>
            ${this.testResult ? html`<span class="ui-mrt__req">Testing “${this.testResult.input}”</span>` : nothing}
          </span>
        </div>
        ${this.renderRules()} ${this.renderFallbacks()}
        <p class="ui-mrt__sr" id=${`${this.uid}-move-hint`}>Arrow keys move it; Home and End move it to the start or end.</p>
      </div>
      ${this.renderTest()}
    `;
    return html`<span class="ui-mrt__sr" role="status">${this.announcement}</span>${head}${clean ? body : html`<div class="ui-mrt__card">${body}</div>`}`;
  }

  static override css = /* css */ `
[data-ui="mrt"] {
  display: flow-root;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 720px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="mrt"] *, [data-ui="mrt"] *::before, [data-ui="mrt"] *::after { box-sizing: border-box; }
:where([data-ui="mrt"]) :is(p, ol, ul) { margin: 0; padding: 0; }
:where([data-ui="mrt"]) :is(ol, ul) { list-style: none; }
:where([data-ui="mrt"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="mrt"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mrt"] button:disabled, [data-ui="mrt"] button[aria-disabled="true"] { cursor: not-allowed; opacity: 0.55; }
/* Standard: a gray tray around a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mrt"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-mrt__card { display: flow-root; padding-top: var(--tc-space-2); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mrt"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-mrt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-mrt__icon { flex: none; width: 14px; height: 14px; stroke-width: 1.75; }
.ui-mrt__arrow { flex: none; width: 14px; height: 14px; stroke-width: 1.75; color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-mrt__icon, .ui-mrt__arrow) { stroke-width: 1.5; }

/* ---------- In the header: the regions, and the health pill at its right ---------- */
.ui-mrt__residency { color: var(--tc-text-secondary); }
.ui-mrt__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-mrt__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-mrt__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-mrt__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }

/* ---------- The route ---------- */
.ui-mrt__route { display: grid; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-4) var(--tc-space-4); }
.ui-mrt__section-head { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-mrt__section-label { color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-mrt__empty, .ui-mrt__warn { padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mrt__warn { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
/* Rules: a numbered rail, conditions on the left, the target on the right */
.ui-mrt__rules { position: relative; display: grid; gap: var(--tc-space-1-5); }
.ui-mrt__rule {
  position: relative;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) minmax(0, auto) auto;
  grid-template-areas: "rail handle when to remove";
  align-items: center;
  gap: var(--tc-space-2) var(--tc-space-2-5);
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-1);
  border-radius: var(--tc-radius-lg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-mrt__rule { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-mrt__rule { border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-mrt__rule[data-matched] { box-shadow: inset 0 0 0 1px var(--tc-border-selected); background: var(--tc-accent-subtle); }
.ui-mrt__rule[data-drop="dragging"], .ui-mrt__link[data-drop="dragging"] { opacity: 0.5; }
.ui-mrt__rule[data-drop="before"]::before, .ui-mrt__rule[data-drop="after"]::after { content: ""; position: absolute; left: 0; right: 0; height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-mrt__rule[data-drop="before"]::before { top: calc(-1 * var(--tc-space-1)); }
.ui-mrt__rule[data-drop="after"]::after { bottom: calc(-1 * var(--tc-space-1)); }
.ui-mrt__handle { grid-area: handle; display: grid; place-items: center; width: var(--tc-space-6); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); cursor: grab; touch-action: none; }
.ui-mrt__handle:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-secondary); }
.ui-mrt__handle:active { cursor: grabbing; }
.ui-mrt__num { position: relative; z-index: 1; display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-mrt__num { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-mrt__num { box-shadow: inset 0 0 0 1px var(--tc-border-control); color: var(--tc-text-secondary); }
/* The rail: a line through every step's node; it lights up along the tested route, one step after another */
.ui-mrt__rail { grid-area: rail; position: relative; display: grid; place-items: center; align-self: stretch; width: 22px; }
.ui-mrt__rail::before, .ui-mrt__rail::after { content: ""; position: absolute; left: 50%; width: 2px; transform: translateX(-50%); background: var(--tc-border-default); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); transition-delay: calc(var(--step, 0) * var(--tc-duration-fast)); }
.ui-mrt__rail::before { top: calc(-1 * (var(--tc-space-2) + var(--tc-space-1-5) / 2)); bottom: 50%; }
.ui-mrt__rail::after { top: 50%; bottom: calc(-1 * (var(--tc-space-2) + var(--tc-space-1-5) / 2)); }
.ui-mrt__rail[data-in]::before, .ui-mrt__rail[data-out]::after { background: var(--tc-accent); }
.ui-mrt__rail[data-last]::after, .ui-mrt__start .ui-mrt__rail::before { display: none; }
.ui-mrt__node { position: relative; z-index: 1; width: 10px; height: 10px; border-radius: 50%; background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-border-strong); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); transition-delay: calc(var(--step, 0) * var(--tc-duration-fast)); }
[data-path="hit"] > .ui-mrt__rail .ui-mrt__node { box-shadow: inset 0 0 0 3px var(--tc-accent); }
.ui-mrt__start { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--tc-space-2-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); }
.ui-mrt__start { grid-template-areas: "rail text"; }
.ui-mrt__start-text { grid-area: text; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); min-width: 0; }
.ui-mrt__req { min-width: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-mrt__start .ui-mrt__rail { height: var(--tc-control-h-sm); align-self: center; }
.ui-mrt__start .ui-mrt__rail::after { bottom: calc(-1 * ((100% - var(--tc-control-h-sm)) / 2 + var(--tc-space-2) + var(--tc-space-1-5) / 2)); }
/* Steps the request passed over or never reached go quiet; the taken one is tinted */
.ui-mrt__rule[data-path="passed"], .ui-mrt__rule[data-path="after"] { background: none !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-mrt__rule[data-path="after"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-mrt__rule[data-path="passed"] .ui-mrt__rule-name, .ui-mrt__rule[data-path="after"] .ui-mrt__rule-name { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-regular); }
.ui-mrt__rule[data-path="after"] .ui-mrt__cond { background: none; }
.ui-mrt__rule[data-path="after"] .ui-mrt__target { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-mrt__num { transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mrt__rule[data-path="passed"] .ui-mrt__num { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-accent); color: var(--tc-accent-text); }
.ui-mrt__rule[data-path="hit"] .ui-mrt__num { background: var(--tc-accent); box-shadow: none; color: var(--tc-text-on-accent); }
.ui-mrt__rule[data-path="after"] .ui-mrt__num { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-control); color: var(--tc-text-muted); }
.ui-mrt__tag { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
.ui-mrt__when { grid-area: when; display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-mrt__rule-name { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-mrt__rule-name { font-weight: var(--tc-font-weight-regular); }
.ui-mrt__conds { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mrt__kw { color: var(--tc-text-muted); }
.ui-mrt__cond { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-mrt__to { grid-area: to; display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-mrt__hit { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent); color: var(--tc-text-on-accent); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
.ui-mrt__remove { grid-area: remove; display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); }
.ui-mrt__remove:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* A target: name, region, health and breaker */
.ui-mrt__target { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-mrt__target { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-mrt__target[data-chosen] { box-shadow: inset 0 0 0 2px var(--tc-accent); }
.ui-mrt__target[data-skipped] .ui-mrt__target-name { text-decoration: line-through; text-decoration-color: var(--tc-text-muted); }
.ui-mrt__target-main { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-mrt__target-name { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
.ui-mrt__dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--tc-icon-muted); }
.ui-mrt__target[data-tone="success"] .ui-mrt__dot { background: var(--tc-status-success-solid); }
.ui-mrt__target[data-tone="warning"] .ui-mrt__dot { background: var(--tc-status-warning-solid); }
.ui-mrt__target[data-tone="danger"] .ui-mrt__dot { background: var(--tc-status-danger-solid); }
.ui-mrt__region { flex: none; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-mrt__region[data-outside] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-mrt__target-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 0 var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-mrt__target-meta:empty { display: none; }
.ui-mrt__target[data-tone="danger"] .ui-mrt__status { color: var(--tc-status-danger-fg); }
.ui-mrt__target[data-tone="warning"] .ui-mrt__status { color: var(--tc-status-warning-fg); }
.ui-mrt__breaker { font-weight: var(--tc-font-weight-medium); }
.ui-mrt__breaker[data-breaker="open"] { color: var(--tc-status-danger-fg); }
.ui-mrt__breaker[data-breaker="half-open"] { color: var(--tc-status-warning-fg); }
.ui-mrt__outside { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
/* Otherwise: the chain, left to right */
.ui-mrt__otherwise { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "rail body"; gap: var(--tc-space-2-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); border-radius: var(--tc-radius-lg); }
.ui-mrt__otherwise[data-path="hit"] { background: var(--tc-accent-subtle); }
.ui-mrt__otherwise > .ui-mrt__rail { align-self: start; height: var(--tc-control-h-sm); }
.ui-mrt__otherwise-body { grid-area: body; display: grid; gap: var(--tc-space-2); min-width: 0; }
.ui-mrt__then .ui-mrt__arrow { transition: color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mrt__then[data-lit] .ui-mrt__arrow { color: var(--tc-accent); }
.ui-mrt__link .ui-mrt__then { transition-delay: calc(var(--step, 0) * var(--tc-duration-fast)); }
.ui-mrt__chain { display: flex; flex-wrap: wrap; align-items: stretch; gap: var(--tc-space-2); }
.ui-mrt__link { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mrt__link-body { display: flex; align-items: center; gap: var(--tc-space-0-5); min-width: 0; }
.ui-mrt__link[data-drop="before"] .ui-mrt__target, .ui-mrt__link[data-drop="after"] .ui-mrt__target { box-shadow: inset 0 0 0 2px var(--tc-accent); }
.ui-mrt__then { display: grid; place-items: center; }
.ui-mrt__add { display: block; justify-self: start; }
.ui-mrt__select, .ui-mrt__test-input {
  height: var(--tc-field-h);
  margin: 0;
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-field-radius);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-mrt__select { cursor: pointer; }
.ui-mrt__select:hover, .ui-mrt__test-input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-mrt__select:focus-visible, .ui-mrt__test-input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-mrt__test-input::placeholder { color: var(--tc-text-placeholder); }

/* ---------- Test a route ---------- */
.ui-mrt__test { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mrt__test-row { display: flex; gap: var(--tc-space-2); }
.ui-mrt__test-input { flex: 1; min-width: 0; }
.ui-mrt__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-field-h); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mrt__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-mrt__result:empty { display: none; }
.ui-mrt__pending { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-mrt__answer { display: grid; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); animation: ui-mrt-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-mrt__answer { border-radius: var(--tc-radius-md); background: var(--tc-accent-subtle); }
.ui-mrt__answer[data-state="none"] { background: var(--tc-status-danger-bg); }
.ui-mrt__verdict { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-mrt__verdict strong { font-weight: var(--tc-font-weight-semibold); }
.ui-mrt__reasons { display: grid; gap: var(--tc-space-0-5); padding-left: var(--tc-space-5) !important; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); list-style: decimal !important; }
.ui-mrt__tested { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
@keyframes ui-mrt-in { from { opacity: 0; transform: translateY(3px); } }

/* Narrow: the target drops under the conditions */
@container (max-width: 520px) {
  .ui-mrt__rule { grid-template-columns: auto auto minmax(0, 1fr) auto; grid-template-areas: "rail handle when remove" "rail . to to"; }
  .ui-mrt__route, .ui-mrt__test { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
}
@container (max-width: 360px) {
  .ui-mrt__test-row { flex-wrap: wrap; }
  .ui-mrt__test-row .ui-mrt__btn { flex: 1 1 100%; justify-content: center; }
}
@media (pointer: coarse) {
  .ui-mrt__btn, .ui-mrt__select, .ui-mrt__test-input, .ui-mrt__remove { height: 40px; }
  .ui-mrt__handle { width: 32px; height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mrt"] *, [data-ui="mrt"] *::before, [data-ui="mrt"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-model-routing")) customElements.define("tc-model-routing", TcModelRouting);

declare global {
  interface HTMLElementTagNameMap {
    "tc-model-routing": TcModelRouting;
  }
}
