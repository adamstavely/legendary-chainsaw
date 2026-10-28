import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import type { ProgressDoneChange, ProgressStep } from "./progress-tracker";
import "./button";
import "./dialog";
import "./progress-tracker";

/*
 * <tc-publish-readiness> – what must pass before something is released (the Lit port of
 * blocks/publish-readiness.tsx). A summary card says how close the release is – one tick per check, checks passed,
 * blockers left – and opens a dialog that walks through every check:
 *   · the checks as the library's Progress Tracker – sign-offs the person gives tick by hand (tc-confirmed-change);
 *     automated checks are read-only rows (passed, failed, or still to run)
 *   · each failing check with the blockers behind it, every blocker a link the page opens (tc-open-blocker) – or
 *     plain text with `plain-blockers`
 *   · checks still to run (e.g. during approval), a note on who approves, and the publish action in the dialog's
 *     footer, held back while anything blocks (tc-publish)
 * Standard: the summary's header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-publish-readiness subject="Weekly digest" version="v1.3" .checks=${[…]}></tc-publish-readiness>
 */

export type ReadinessState = "passed" | "failed" | "pending" | "manual";

export type ReadinessBlocker = {
  id: string;
  /** What blocks, e.g. "Step 4 has no reviewer" */
  label: string;
  /** Where it is, e.g. "Spec · step 4" */
  where?: string;
};

export type ReadinessCheck = {
  id: string;
  /** What must hold, e.g. "Spec is valid" */
  label: string;
  /** passed / failed (has blockers) / pending (runs later, e.g. during approval) / manual (a person signs it off) */
  state: ReadinessState;
  /** A line of detail – shown under the checklist for checks that run later, and in the blocker list */
  detail?: string;
  /** Why a failed check fails – each one opens with tc-open-blocker */
  blockers?: ReadinessBlocker[];
};

/** Details of the events */
export type ReadinessConfirmedChange = { confirmed: string[] };
export type ReadinessOpenChange = { open: boolean };
export type ReadinessOpenBlocker = { blocker: ReadinessBlocker; check: ReadinessCheck };

/* 24 px stroke icons: Lucide (ISC, lucide.dev) */
const icons = {
  send: "M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.03.94l7.93 3.18a2 2 0 0 1 1.11 1.11zM21.85 2.15 10.91 13.09",
  alert: "M12 8v4M12 16h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  clock: "M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  person: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  arrow: "M7 17 17 7M7 7h10v10",
};
const glyph = (d: string, slot?: string) =>
  html`<svg slot=${slot ?? nothing} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

/** The step icons the tracker clones: a person for a sign-off, a clock for a check that runs later. Made on first use,
 *  so importing the element touches no DOM (server rendering) */
let stepIcons: Record<"manual" | "pending", Element> | undefined;
function stepIcon(state: "manual" | "pending") {
  if (!stepIcons) {
    const make = (d: string) => {
      const ns = "http://www.w3.org/2000/svg";
      const s = document.createElementNS(ns, "svg");
      for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) s.setAttribute(k, v);
      // Cloned by the tracker, so its colour rides along inline
      s.setAttribute("style", "color: var(--tc-text-muted)");
      const p = document.createElementNS(ns, "path");
      p.setAttribute("d", d);
      s.append(p);
      return s;
    };
    stepIcons = { manual: make(icons.person), pending: make(icons.clock) };
  }
  return stepIcons[state];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
let uidCount = 0;

/**
 * What must pass before something is released: a summary card with one tick per check that opens a dialog of the
 * checks, the blockers behind failing ones and the publish action, held back while anything blocks.
 * @tag tc-publish-readiness
 * @fires tc-confirmed-change - A sign-off was given or withdrawn ({ confirmed }: ReadinessConfirmedChange – every signed-off id); cancelable – prevented, `confirmed` stays
 * @fires tc-open-change - The dialog opens or closes ({ open }: ReadinessOpenChange); cancelable – prevented, `open` stays
 * @fires tc-open-blocker - A blocker's link was followed – open the place it points at ({ blocker, check }: ReadinessOpenBlocker)
 * @fires tc-publish - The publish action was pressed, with nothing blocking; detail: null
 */
export class TcPublishReadiness extends TcElement {
  static override ui = "prd";

  /** What is being released, e.g. "Daily briefing" */
  @property() accessor subject = "";
  /** Its version, e.g. "v1.3" */
  @property() accessor version: string | undefined = undefined;
  /** The checks, in order */
  @property({ attribute: false }) accessor checks: ReadinessCheck[] = [];
  /** Ids of the manual checks the person has signed off */
  @property({ attribute: false }) accessor confirmed: string[] = [];
  /** Whether the dialog is open */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** The dialog's heading */
  @property() accessor heading = "Ready to publish?";
  /** The line under the summary's title – text, or an element (cloned) */
  @property() accessor description: string | Element | undefined = undefined;
  /** Who approves and what happens next – a note above the action: text, or an element (cloned) */
  @property() accessor note: string | Element | undefined = undefined;
  /** The action's label */
  @property({ attribute: "publish-label" }) accessor publishLabel = "Submit for approval";
  /** Keep the publish action off even when ready – nothing to publish to yet */
  @property({ type: Boolean, attribute: "publish-disabled" }) accessor publishDisabled = false;
  /** Show blockers as plain text instead of links (nothing opens them) */
  @property({ type: Boolean, attribute: "plain-blockers" }) accessor plainBlockers = false;

  /** What the last sign-off did, for the polite status line */
  @state() private accessor said = "";
  private readonly uid = `tc-prd-${++uidCount}`;
  /** Text as it is; an element cloned on each render, so changes to it show the next time this element updates */
  private content(v: string | Element | undefined) {
    return v instanceof Element ? v.cloneNode(true) : v;
  }

  private get list() {
    return Array.isArray(this.checks) ? this.checks : [];
  }

  private status() {
    const checks = this.list;
    const confirmed = this.confirmed ?? [];
    const manual = checks.filter((c) => c.state === "manual");
    const failed = checks.filter((c) => c.state === "failed");
    const pending = checks.filter((c) => c.state === "pending");
    const signed = manual.filter((c) => confirmed.includes(c.id));
    const passed = checks.filter((c) => c.state === "passed").length + signed.length;
    const blockers = failed.reduce((n, c) => n + Math.max(1, c.blockers?.length ?? 0), 0);
    const unsigned = manual.length - signed.length;
    const ready = blockers === 0 && unsigned === 0;
    const done = [...checks.filter((c) => c.state === "passed").map((c) => c.id), ...signed.map((c) => c.id)];
    const text = ready
      ? pending.length
        ? `Ready – ${pending.length} ${pending.length === 1 ? "check runs" : "checks run"} during approval`
        : "Ready to publish"
      : [blockers ? plural(blockers, "blocker", "blockers") : "", unsigned ? plural(unsigned, "sign-off", "sign-offs") + " to give" : ""].filter(Boolean).join(" · ");
    return { failed, pending, passed, blockers, ready, done, text };
  }

  private setOpen(open: boolean) {
    if (open === this.open) return;
    if (this.emit<ReadinessOpenChange>("tc-open-change", { open }, { cancelable: true })) this.open = open;
  }

  private onTick = (e: CustomEvent<ProgressDoneChange>) => {
    // The tracker's event stops here: the page hears tc-confirmed-change, with the signed-off ids
    e.stopPropagation();
    e.preventDefault();
    const ids = e.detail.done;
    const { done } = this.status();
    const changed = this.list.find((c) => ids.includes(c.id) !== done.includes(c.id));
    if (!changed || changed.state !== "manual") return;
    const on = ids.includes(changed.id);
    const current = this.confirmed ?? [];
    const confirmed = on ? [...current, changed.id] : current.filter((id) => id !== changed.id);
    if (!this.emit<ReadinessConfirmedChange>("tc-confirmed-change", { confirmed }, { cancelable: true })) return;
    this.confirmed = confirmed;
    this.said = on ? `Signed off: ${changed.label}` : `Sign-off withdrawn: ${changed.label}`;
  };

  private renderBlocker(c: ReadinessCheck, b: ReadinessBlocker, real: boolean) {
    const where = b.where ? html`<span class="ui-prd__where"> · ${b.where}</span>` : nothing;
    return real && !this.plainBlockers
      ? html`<button type="button" class="ui-prd__link" @click=${() => this.emit<ReadinessOpenBlocker>("tc-open-blocker", { blocker: b, check: c })}>
          ${b.label}${where}${glyph(icons.arrow)}
        </button>`
      : html`<span class="ui-prd__plain">${b.label}${where}</span>`;
  }

  private renderDialogBody(s: ReturnType<TcPublishReadiness["status"]>): TemplateResult {
    const steps: ProgressStep[] = this.list.map((c) => ({
      id: c.id,
      label: c.label,
      readonly: c.state !== "manual",
      state: c.state === "failed" ? "failed" : undefined,
      icon: c.state === "manual" || c.state === "pending" ? stepIcon(c.state) : undefined,
    }));
    const note = this.content(this.note);
    return html`<div class="ui-prd__dialog">
      <p class="ui-prd__eyebrow">${this.subject}${this.version ? ` · ${this.version}` : ""}</p>
      <tc-progress-tracker look=${this.resolvedLook} fit="fill" done-style="plain" heading="Before release" .steps=${steps} .done=${s.done} @tc-done-change=${this.onTick}></tc-progress-tracker>
      <p class="ui-prd__said" role="status" aria-live="polite">${this.said}</p>
      ${s.pending.length
        ? html`<ul class="ui-prd__later">
            ${repeat(
              s.pending,
              (c) => c.id,
              (c) => html`<li>${glyph(icons.clock)}<span><b>${c.label}</b> ${c.detail ? `– ${c.detail}` : "– runs later"}</span></li>`,
            )}
          </ul>`
        : nothing}
      ${s.failed.length
        ? html`<section class="ui-prd__blockers" aria-labelledby=${`${this.uid}-blockers`}>
            <h4 id=${`${this.uid}-blockers`} class="ui-prd__caption">Blocking release</h4>
            <ul>
              ${repeat(
                s.failed,
                (c) => c.id,
                (c) => html`<li class="ui-prd__blocker">
                  <span class="ui-prd__blocker-icon" aria-hidden="true">${glyph(icons.alert)}</span>
                  <div class="ui-prd__blocker-text">
                    <span class="ui-prd__blocker-check">${c.label}${c.detail ? html`<span class="ui-prd__where"> · ${c.detail}</span>` : nothing}</span>
                    ${c.blockers?.length
                      ? repeat(
                          c.blockers,
                          (b) => b.id,
                          (b) => this.renderBlocker(c, b, true),
                        )
                      : this.renderBlocker(c, { id: c.id, label: "Fails – see the check" }, false)}
                  </div>
                </li>`,
              )}
            </ul>
          </section>`
        : nothing}
      ${note ? html`<div class="ui-prd__note">${note}</div>` : nothing}
      ${s.ready ? nothing : html`<p class="ui-prd__why">Publishing waits on: ${s.text}</p>`}
    </div>`;
  }

  protected override render() {
    const s = this.status();
    const look = this.resolvedLook;
    const confirmed = this.confirmed ?? [];
    const total = this.list.length;
    const tone = s.ready ? "success" : s.blockers ? "danger" : "warning";
    const title = html`${this.subject}${this.version ? html`<span class="ui-prd__version"> ${this.version}</span>` : nothing}`;
    return html`<section class="ui-prd__card" aria-labelledby=${`${this.uid}-title`}>
        ${cardHead({
          icon: svg`<path d=${icons.send}></path>`,
          title,
          subtitle: this.content(this.description),
          id: `${this.uid}-title`,
          keepAside: true,
          aside: html`<span class="ui-prd__pill" data-tone=${tone}>${s.ready ? "Ready" : s.blockers ? "Blocked" : "Needs sign-off"}</span>`,
        })}
        <div class="ui-prd__body">
          <div class="ui-prd__meter" .role=${"meter"} aria-label="Checks passed" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${s.passed} aria-valuetext=${`${s.passed} of ${total} checks passed`}>
            ${repeat(
              this.list,
              (c) => c.id,
              (c) => html`<span class="ui-prd__tick" data-state=${c.state === "manual" && confirmed.includes(c.id) ? "passed" : c.state}></span>`,
            )}
          </div>
          <div class="ui-prd__summary">
            <p class="ui-prd__count"><b>${s.passed}</b> of ${total} checks passed</p>
            <p class="ui-prd__status" ?data-ready=${s.ready}>${s.text}</p>
          </div>
          <tc-button look=${look} variant=${s.ready ? "primary" : "secondary"} label=${s.ready ? "Publish…" : "Review checks"} @click=${() => this.setOpen(true)}></tc-button>
        </div>
      </section>
      <tc-dialog
        look=${look}
        label=${this.heading}
        description="Releasing needs every check to pass – nothing goes live on its own."
        ?open=${this.open}
        .content=${this.renderDialogBody(s)}
        .actions=${html`<tc-button
          look=${look}
          variant="primary"
          label=${this.publishLabel}
          ?disabled=${!s.ready || this.publishDisabled}
          @click=${() => {
            if (s.ready && !this.publishDisabled) this.emit("tc-publish", null);
          }}
          >${glyph(icons.send, "icon")}</tc-button
        >`}
        @tc-open-change=${(e: CustomEvent<ReadinessOpenChange>) => {
          // The dialog's event stops here: the page hears this element's tc-open-change
          if (e.target !== e.currentTarget) return;
          e.stopPropagation();
          e.preventDefault();
          this.setOpen(e.detail.open);
        }}
      ></tc-dialog>`;
  }

  static override css = /* css */ `
[data-ui="prd"] {
  container-type: inline-size;
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="prd"] *, [data-ui="prd"] *::before, [data-ui="prd"] *::after { box-sizing: border-box; }

/* The summary card: Standard puts the header on the gray tray above the white card; Clean is one white card */
.ui-prd__card { max-width: 520px; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-prd__body { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "meter meter" "summary action"; align-items: center; gap: var(--tc-space-3) var(--tc-space-4); padding: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-prd__body > tc-button { grid-area: action; }
[data-ui="prd"][data-look="clean"] .ui-prd__card { padding: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="prd"][data-look="clean"] .ui-prd__body { padding: 0 var(--tc-space-4) var(--tc-space-4); border-radius: 0; background: none; box-shadow: none; }
@container (max-width: 380px) { .ui-prd__body { grid-template-columns: minmax(0, 1fr); grid-template-areas: "meter" "summary" "action"; } }

.ui-prd__version { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-prd__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-prd__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-prd__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-prd__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }

/* One tick per check, coloured by its state */
.ui-prd__meter { grid-area: meter; display: flex; gap: var(--tc-space-1); }
.ui-prd__tick { flex: 1; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-prd__tick[data-state="passed"] { background: var(--tc-status-success-solid); }
.ui-prd__tick[data-state="failed"] { background: var(--tc-status-danger-solid); }
.ui-prd__tick[data-state="pending"] { background: repeating-linear-gradient(-45deg, var(--tc-meter-track) 0 3px, var(--tc-border-strong) 3px 5px); }
.ui-prd__summary { grid-area: summary; min-width: 0; }
.ui-prd__count { margin: 0; color: var(--tc-text-secondary); }
.ui-prd__count b { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; }
.ui-prd__status { margin: 0; color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); }
.ui-prd__status[data-ready] { color: var(--tc-status-success-fg); }

/* The dialog's body */
.ui-prd__dialog { display: grid; gap: var(--tc-space-3); width: 480px; max-width: 100%; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; }
.ui-prd__eyebrow { margin: 0; color: var(--tc-eyebrow-color); font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-eyebrow-font-weight); line-height: var(--tc-eyebrow-line-height); letter-spacing: var(--tc-eyebrow-tracking); text-transform: var(--tc-eyebrow-transform); }
.ui-prd__said { min-height: 0; margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-prd__said:empty { display: none; }
.ui-prd__caption { margin: 0 0 var(--tc-space-1-5); color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-prd__blockers ul { display: grid; gap: var(--tc-space-2); margin: 0; padding: 0; list-style: none; }
.ui-prd__blocker { display: flex; gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
.ui-prd__blocker-icon { flex: none; color: var(--tc-status-danger-fg); }
.ui-prd__blocker-icon svg { display: block; width: var(--tc-space-4); height: var(--tc-space-4); stroke-width: 2; margin-top: var(--tc-space-0-5); }
.ui-prd__blocker-text { display: grid; justify-items: start; gap: var(--tc-space-0-5); min-width: 0; }
.ui-prd__blocker-check { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-prd__link { justify-self: start; display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); text-align: left; text-decoration: underline; text-decoration-thickness: var(--tc-hairline); text-underline-offset: 2px; cursor: pointer; }
.ui-prd__link svg { flex: none; width: var(--tc-space-3); height: var(--tc-space-3); stroke-width: 2; }
.ui-prd__link:hover { text-decoration-thickness: 2px; }
.ui-prd__link:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); border-radius: var(--tc-radius-2xs); }
.ui-prd__later { display: grid; gap: var(--tc-space-1); margin: calc(var(--tc-space-1) * -1) 0 0; padding: 0; list-style: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-prd__later li { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); }
.ui-prd__later svg { flex: none; width: var(--tc-space-3-5); height: var(--tc-space-3-5); margin-top: var(--tc-space-0-5); stroke-width: 2; }
.ui-prd__later b { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-prd__plain { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-prd__where { color: var(--tc-text-muted); }
.ui-prd__note { padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-prd__note b, .ui-prd__note strong { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-semibold); }
.ui-prd__why { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

@media (prefers-reduced-motion: reduce) { .ui-prd__tick { transition: none; } }
@media (forced-colors: active) {
  .ui-prd__tick { border: 1px solid CanvasText; }
  .ui-prd__tick[data-state="passed"], .ui-prd__tick[data-state="failed"] { background: CanvasText; }
  .ui-prd__blocker, .ui-prd__pill { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-publish-readiness")) customElements.define("tc-publish-readiness", TcPublishReadiness);

declare global {
  interface HTMLElementTagNameMap {
    "tc-publish-readiness": TcPublishReadiness;
  }
}
