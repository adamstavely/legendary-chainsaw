import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-configuration-release-control> – a configuration version on its way through the environments. The pipeline
 * shows each stage (Draft → Staging → Production, as data) with the version it runs and any rollout in progress. For
 * the version being promoted it shows what changed (instructions, model, tools, retrieval – counts, with Compare to
 * open the full diff elsewhere), the evaluation evidence against the version it replaces, who has approved, how far
 * its rollout has got, and the rollback target.
 *   · the gate sits in the pipeline, on the edge into the target stage: each requirement (the evaluation meets its
 *     threshold, enough people approve, no hold) ticked or not, and Promote, which stays unavailable until they're all
 *     met. When it's ready it asks first, in a dialog that names the move.
 *   · Roll back asks first too, naming the stage and exactly which version it returns to.
 *   · the confirmation is a modal dialog: focus moves to Cancel, Tab and Shift+Tab stay inside it, Escape cancels, and
 *     focus returns to the button that opened it
 *   · optional, and in the same gate: suites that pass, fail or are conditional; linked open findings (a list, each
 *     opening through tc-finding-open); and waivers – who granted them and when they expire, shown as given. A
 *     conditional suite or a blocking finding needs a waiver that hasn't expired; a failing suite can't be waived
 * The element moves nothing: tc-promote, tc-rollback and tc-compare tell the app, which does the real work and sends
 * back new `stages`. Between the two, the stage shows "Requested". Every event is cancelable.
 * Standard: the header on a gray tray above a white card, stages as filled tiles and the gate a raised tile between them. Clean: one
 * white card, the stages as a quiet track with dots and the gate a hairline box on it, quieter text and thinner icons.
 * Narrow, the pipeline runs down the card.
 *
 *   <tc-configuration-release-control .stages=${stages} .versions=${versions} candidate="v14"></tc-configuration-release-control>
 */

/** A configuration version: an immutable snapshot of instructions, model, tools and retrieval */
export type ReleaseVersion = {
  id: string;
  /** Short, e.g. "v14" */
  label: string;
  /** What it is, e.g. "Shorter refund answers" */
  title?: string;
};
/** An environment a version moves through, in order */
export type ReleaseStage = {
  id: string;
  /** "Production" */
  label: string;
  /** The id of the version it fully runs; unset when nothing is deployed */
  version?: string;
  /** A rollout in progress: another version taking `percent` (0–100) of this stage's traffic */
  rollout?: { version: string; percent: number };
};
/** One area of the configuration that changed */
export type ReleaseChange = {
  id: string;
  /** "Instructions" */
  label: string;
  /** How many changes, e.g. 3 edited lines or 2 tools added */
  count: number;
  /** A quieter line, e.g. "2 added, 1 removed" */
  detail?: string;
};
/** The evaluation behind the promotion. Rates are percentages, 0–100 */
export type ReleaseEvidence = {
  /** "running" while the suite runs; "done" (the default) once `passRate` is final */
  state?: "running" | "done";
  /** The candidate's pass rate */
  passRate?: number;
  /** The pass rate of the version it would replace, on the same suite */
  baseline?: number;
  /** The pass rate needed to promote */
  threshold: number;
  /** How many cases the suite has */
  cases?: number;
  /** The suite's name */
  suite?: string;
};
/** One person's review */
export type ReleaseApproval = {
  id: string;
  name: string;
  /** "Approved", "Waiting" or "Changes requested" */
  state: "approved" | "pending" | "rejected";
  /** A quiet line, e.g. their role or when they approved */
  detail?: string;
};
/** A gate suite's result: pass, fail, or conditional – passing only on a waiver */
export type ReleaseSuiteStatus = "pass" | "fail" | "conditional";
/** A suite of checks the release gate runs, e.g. "Safety regression" */
export type ReleaseSuite = {
  id: string;
  label: string;
  status: ReleaseSuiteStatus;
  /** Counts, shown as "5 passed · 2 failed · 1 inconclusive" */
  passed?: number;
  failed?: number;
  inconclusive?: number;
};
/** An open finding linked to the candidate */
export type ReleaseFinding = {
  id: string;
  /** "Tool ran before its approval" */
  title: string;
  /** A short reference, e.g. "F-001" */
  ref?: string;
  /** e.g. "P0" or "High" */
  severity?: string;
  /** e.g. "Open", "Acknowledged" */
  status?: string;
  /** The id of the suite it came from */
  suite?: string;
  /** A blocking finding holds promotion until it's closed or waived */
  blocking?: boolean;
};
/** A waiver: lets a conditional suite or a blocking finding through until it expires */
export type ReleaseWaiver = {
  id: string;
  /** A short reference, e.g. "W-001" */
  label?: string;
  /** The ids of the suites and findings it covers */
  covers: string[];
  /** Who granted it */
  grantedBy: string;
  /** When it expires, shown as given, e.g. "2026-06-10" */
  expires: string;
  /** The app says it has expired – it then counts as unmet */
  expired?: boolean;
};

/** Where a rollback goes: the stage, and the version it returns to */
export type ReleaseRollback = { stage: string; version: string };

/** Details of the events */
export type ReleasePromoteEvent = { version: ReleaseVersion; stage: ReleaseStage; from?: ReleaseVersion };
export type ReleaseRollbackEvent = { stage: ReleaseStage; from?: ReleaseVersion; to: ReleaseVersion };
export type ReleaseCompareEvent = { from?: ReleaseVersion; to: ReleaseVersion };
export type ReleaseFindingOpenEvent = { finding: ReleaseFinding };

/** A requirement: `text` stands alone, `phrase` goes after "To promote:" */
type Check = { id: "evidence" | "suites" | "findings" | "approvals" | "hold"; met: boolean; text: string; phrase: string; value?: string };
/** A move the app was told about; `was` is the stage as it was then, so any change to it ends the wait */
type Requested = { kind: "promote" | "rollback"; stage: string; version: string; was: string };
const stageKey = (s: ReleaseStage | undefined) => (s ? `${s.version ?? ""}|${s.rollout?.version ?? ""}|${s.rollout?.percent ?? ""}` : "");

const pct = (n: number) => `${+n.toFixed(1)}%`;
const pts = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${+Math.abs(n).toFixed(1)} pts`;
const clamp = (n: number) => Math.min(100, Math.max(0, n));
let uidCount = 0;

/* Layers, arrow-up, undo-2, arrow-up-right, check, x, clock, chevron-right: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const layersIcon = svg`<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path>`;
const promoteIcon = () => lucide(14, svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`);
const undoIcon = (size = 14) => lucide(size, svg`<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"></path>`);
const outIcon = () => lucide(12, svg`<path d="M7 7h10v10"></path><path d="M7 17 17 7"></path>`);
const checkIcon = () => lucide(12, svg`<path d="M20 6 9 17l-5-5"></path>`);
const xIcon = () => lucide(12, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const clockIcon = () => lucide(12, svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>`);
const chevron = () => lucide(14, svg`<path d="m9 18 6-6-6-6"></path>`);
const alertIcon = () => lucide(12, svg`<path d="M12 8v4"></path><path d="M12 16h.01"></path>`);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * A configuration version moving through environments: the pipeline, what changed, the evaluation evidence, the
 * approvals, the rollout and the rollback target, with a gated, confirmed Promote and a confirmed Roll back.
 * @tag tc-configuration-release-control
 * @fires tc-promote - Promote was confirmed ({ version, stage, from }: ReleasePromoteEvent); cancelable – prevented, the stage isn't marked "Requested"
 * @fires tc-rollback - Roll back was confirmed ({ stage, from, to }: ReleaseRollbackEvent); cancelable – prevented, the stage isn't marked "Requested"
 * @fires tc-compare - Compare was pressed – open the full diff ({ from, to }: ReleaseCompareEvent); cancelable, with nothing else to stop
 * @fires tc-finding-open - A linked finding was pressed – open it ({ finding }: ReleaseFindingOpenEvent); cancelable, with nothing else to stop
 */
export class TcConfigurationReleaseControl extends TcElement {
  static override ui = "rls";

  /** The heading */
  @property() accessor heading = "Configuration release";
  /** A quieter line under the heading, e.g. which assistant this configures */
  @property() accessor description = "";
  /** The environments in order, each with the version it runs and any rollout in progress */
  @property({ attribute: false }) accessor stages: ReleaseStage[] = [];
  /** Every version the stages, the candidate and the rollback target refer to */
  @property({ attribute: false }) accessor versions: ReleaseVersion[] = [];
  /** The id of the version being promoted */
  @property() accessor candidate = "";
  /** The id of the stage it's promoted to; unset, the stage after the last one that fully runs it */
  @property() accessor target: string | undefined = undefined;
  /** What changed against the version it replaces, by area */
  @property({ attribute: false }) accessor changes: ReleaseChange[] = [];
  /** The evaluation behind the promotion; unset, promotion waits for one */
  @property({ attribute: false }) accessor evidence: ReleaseEvidence | undefined = undefined;
  /** Who has reviewed the candidate */
  @property({ attribute: false }) accessor approvals: ReleaseApproval[] = [];
  /** How many approvals Promote needs */
  @property({ type: Number, attribute: "required-approvals" }) accessor requiredApprovals = 1;
  /** Where Roll back goes; unset, there's nothing to roll back to */
  @property({ attribute: false }) accessor rollback: ReleaseRollback | undefined = undefined;
  /** A reason that holds every promotion, e.g. "Releases are frozen until Monday" */
  @property() accessor hold = "";
  /** Said in the promote confirmation, under the move */
  @property({ attribute: "promote-note" }) accessor promoteNote = "Traffic moves as your release process sets it. You can roll back afterwards.";
  /** Said in the rollback confirmation, under the move */
  @property({ attribute: "rollback-note" }) accessor rollbackNote = "Only this stage changes. Other stages keep the versions they run.";
  /** The confirmation's Cancel button */
  @property({ attribute: "cancel-label" }) accessor cancelLabel = "Cancel";
  /** Gate suites and their results; unset, the gate doesn't ask for any */
  @property({ attribute: false }) accessor suites: ReleaseSuite[] = [];
  /** Open findings linked to the candidate; blocking ones hold promotion unless waived */
  @property({ attribute: false }) accessor findings: ReleaseFinding[] = [];
  /** Waivers for conditional suites and blocking findings, with who granted them and when they expire */
  @property({ attribute: false }) accessor waivers: ReleaseWaiver[] = [];

  /** Which confirmation is open, or null */
  @state() private accessor confirming: "promote" | "rollback" | null = null;
  /** A move the app was told about and hasn't answered with new stages yet */
  @state() private accessor requested: Requested | null = null;
  @state() private accessor announce = "";

  private uid = `tc-rls-${++uidCount}`;
  private opener: HTMLElement | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.dialogEl?.open) this.dialogEl.close();
  }

  /* ---------- The model ---------- */

  private version(id: string | undefined) {
    return id === undefined ? undefined : this.versions.find((v) => v.id === id);
  }
  private name(v: ReleaseVersion | undefined, id = "") {
    return v?.label ?? id;
  }
  /** The stage the candidate goes to next */
  private get targetStage(): ReleaseStage | undefined {
    if (this.target !== undefined) return this.stages.find((s) => s.id === this.target);
    if (!this.candidate) return undefined;
    let last = -1;
    this.stages.forEach((s, i) => s.version === this.candidate && (last = i));
    return this.stages[last + 1];
  }
  private get rollbackStage() {
    return this.rollback ? this.stages.find((s) => s.id === this.rollback!.stage) : undefined;
  }
  /** What a rollback would take the stage off: the version rolling out, else the one it runs */
  private rollbackFrom(stage: ReleaseStage | undefined) {
    if (!stage) return undefined;
    return stage.rollout && stage.rollout.percent > 0 && stage.rollout.version !== this.rollback?.version ? stage.rollout.version : stage.version;
  }
  private get canRollback() {
    const stage = this.rollbackStage;
    if (!stage || !this.version(this.rollback?.version)) return false;
    const from = this.rollbackFrom(stage);
    return from !== undefined && from !== this.rollback!.version;
  }
  /** The waiver covering a suite or finding – an active one first */
  private waiverFor(id: string) {
    const all = this.waivers.filter((w) => w.covers.includes(id));
    return all.find((w) => !w.expired) ?? all[0];
  }
  private waiverName(w: ReleaseWaiver) {
    return w.label ?? "Waiver";
  }
  /** Why a suite doesn't pass the gate, or "" when it does */
  private suiteProblem(s: ReleaseSuite) {
    if (s.status === "pass") return "";
    if (s.status === "fail") return `${s.label} fails`;
    const w = this.waiverFor(s.id);
    if (!w) return `${s.label} is conditional, with no waiver`;
    return w.expired ? `${s.label}'s waiver ${this.waiverName(w)} has expired` : "";
  }
  private findingBlocks(f: ReleaseFinding) {
    if (!f.blocking) return false;
    const w = this.waiverFor(f.id);
    return !w || !!w.expired;
  }

  /** What promotion still needs */
  private get checks(): Check[] {
    const out: Check[] = [];
    const e = this.evidence;
    const add = (id: Check["id"], met: boolean, text: string, phrase = text.charAt(0).toLowerCase() + text.slice(1)) => out.push({ id, met, text, phrase });
    if (!e || (e.state !== "running" && e.passRate === undefined)) add("evidence", false, "No evaluation yet");
    else if (e.state === "running") add("evidence", false, "Evaluation still running");
    else if (e.passRate! >= e.threshold) add("evidence", true, `Pass rate ${pct(e.passRate!)} meets the ${pct(e.threshold)} threshold`);
    else add("evidence", false, `Pass rate ${pct(e.passRate!)} is under the ${pct(e.threshold)} threshold`);
    if (this.suites.length) {
      const problems = this.suites.map((s) => this.suiteProblem(s)).filter(Boolean);
      const pass = this.suites.filter((s) => s.status === "pass").length;
      const waived = this.suites.length - pass - problems.length;
      const failing = this.suites.filter((s) => s.status === "fail").length;
      const value = problems.length
        ? [failing ? `${failing} failing` : "", problems.length - failing ? `${problems.length - failing} conditional` : ""].filter(Boolean).join(" · ")
        : `${pass} pass${waived ? ` · ${waived} on a waiver` : ""}`;
      if (problems.length) add("suites", false, problems.join(", "), problems.join(", "));
      else add("suites", true, `${pass} of ${plural(this.suites.length, "suite")} pass${waived ? `, ${waived} on a waiver` : ""}`);
      out[out.length - 1].value = value;
    }
    if (this.findings.length) {
      const blocking = this.findings.filter((f) => this.findingBlocks(f)).length;
      const waived = this.findings.filter((f) => f.blocking && !this.findingBlocks(f)).length;
      if (blocking) add("findings", false, `${plural(blocking, "blocking finding")} ${blocking === 1 ? "is" : "are"} open`);
      else add("findings", true, `${plural(this.findings.length, "open finding")}, ${waived ? `${waived} blocking on a waiver` : "none blocking"}`);
      out[out.length - 1].value = blocking ? `${blocking} blocking` : `${this.findings.length} open${waived ? ` · ${waived} waived` : " · none blocking"}`;
    }
    const approved = this.approvals.filter((a) => a.state === "approved").length;
    const rejected = this.approvals.find((a) => a.state === "rejected");
    const need = Math.max(0, this.requiredApprovals);
    if (rejected) add("approvals", false, `${rejected.name} asked for changes`, `${rejected.name} asked for changes`);
    else add("approvals", approved >= need, `${Math.min(approved, need)} of ${need} ${need === 1 ? "approval" : "approvals"}`);
    if (this.hold) add("hold", false, this.hold, this.hold);
    return out;
  }
  private get rollingOut() {
    const r = this.targetStage?.rollout;
    return !!r && r.version === this.candidate && r.percent > 0;
  }
  private get ready() {
    return !!this.targetStage && !!this.version(this.candidate) && this.checks.every((c) => c.met);
  }
  private get dialogEl() {
    return this.querySelector<HTMLDialogElement>(".ui-rls__dialog");
  }
  /** Why an open confirmation can't go ahead now, or "" – the gate can change while it's open, so it's asked again */
  private confirmBlock(kind: "promote" | "rollback") {
    if (kind === "rollback") {
      if (this.canRollback) return "";
      const stage = this.rollbackStage;
      const to = this.version(this.rollback?.version);
      return stage && to ? `Can't roll back now: ${stage.label} already runs ${to.label}.` : "Can't roll back now: the rollback target is gone.";
    }
    if (this.rollingOut) return `Can't promote now: ${this.version(this.candidate)?.label ?? "the candidate"} is already rolling out.`;
    if (this.ready) return "";
    const unmet = this.checks.filter((c) => !c.met).map((c) => c.phrase);
    return `Can't promote now: ${unmet.length ? unmet.join("; ") : "there's nothing to promote"}.`;
  }

  /* ---------- Actions ---------- */

  private ask(kind: "promote" | "rollback", opener: HTMLElement) {
    if (this.requested) return;
    if (kind === "promote" && this.rollingOut) return;
    if (kind === "promote" && !this.ready) {
      this.announce = `Can't promote yet: ${this.checks
        .filter((c) => !c.met)
        .map((c) => c.phrase)
        .join("; ")}.`;
      return;
    }
    if (kind === "rollback" && !this.canRollback) return;
    this.opener = opener;
    this.confirming = kind;
    void this.updateComplete.then(() => {
      const d = this.dialogEl;
      if (!d) return;
      if (!d.open) {
        if (typeof d.showModal === "function") d.showModal();
        else d.setAttribute("open", "");
      }
      d.querySelector<HTMLElement>(".ui-rls__cancel")?.focus();
    });
  }

  private close() {
    if (this.confirming === null) return;
    const d = this.dialogEl;
    if (d?.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    const focus = this.opener;
    this.confirming = null;
    this.opener = null;
    void this.updateComplete.then(() => (focus?.isConnected ? focus : this.querySelector<HTMLElement>(".ui-rls__promote"))?.focus());
  }

  private confirm() {
    const kind = this.confirming;
    // Confirm is disabled while blocked; this catches a click that lands before the re-render
    const block = kind ? this.confirmBlock(kind) : "";
    if (block) {
      this.announce = block;
      return;
    }
    if (kind === "promote") {
      const stage = this.targetStage;
      const version = this.version(this.candidate);
      if (stage && version) {
        const detail: ReleasePromoteEvent = { version, stage, from: this.version(stage.version) };
        if (this.emit<ReleasePromoteEvent>("tc-promote", detail, { cancelable: true })) {
          this.requested = { kind, stage: stage.id, version: version.id, was: stageKey(stage) };
          this.announce = `Promotion of ${version.label} to ${stage.label} requested.`;
        }
      }
    } else if (kind === "rollback") {
      const stage = this.rollbackStage;
      const to = this.version(this.rollback?.version);
      if (stage && to) {
        const detail: ReleaseRollbackEvent = { stage, from: this.version(this.rollbackFrom(stage)), to };
        if (this.emit<ReleaseRollbackEvent>("tc-rollback", detail, { cancelable: true })) {
          this.requested = { kind, stage: stage.id, version: to.id, was: stageKey(stage) };
          this.announce = `Rollback of ${stage.label} to ${to.label} requested.`;
        }
      }
    }
    this.close();
  }

  private compare() {
    const to = this.version(this.candidate);
    if (!to) return;
    this.emit<ReleaseCompareEvent>("tc-compare", { from: this.version(this.targetStage?.version), to }, { cancelable: true });
  }

  private onDialogKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key !== "Tab") return;
    // Tab and Shift+Tab stay inside the dialog
    const items = [...(this.dialogEl?.querySelectorAll<HTMLElement>("button") ?? [])].filter((el) => !el.hasAttribute("disabled"));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !this.dialogEl?.contains(at))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at === last) {
      e.preventDefault();
      first.focus();
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The optional gate parts, unset from a framework, are empty lists
    this.suites ??= [];
    this.findings ??= [];
    this.waivers ??= [];
    // The app's answer is a change to the stage (or a new candidate): the request is no longer pending. Compared by
    // content, so a parent that re-renders with equal data doesn't end the wait
    const req = this.requested;
    if (req && (changed.has("stages") || changed.has("candidate"))) {
      if (changed.has("candidate") || stageKey(this.stages.find((s) => s.id === req.stage)) !== req.was) this.requested = null;
    }
  }

  /* ---------- Rendering ---------- */

  /** The pipeline: every stage, with the gate to the target stage drawn on the edge into it */
  private renderStages(gate: unknown) {
    const target = this.targetStage;
    if (!this.stages.length) return html`<p class="ui-rls__none">No stages yet.</p>`;
    const at = target && gate !== nothing ? this.stages.indexOf(target) : -1;
    const cols = this.stages.flatMap((_, i) => [...(i === at ? ["minmax(10.5rem, 1.25fr)"] : []), "minmax(0, 1fr)"]).join(" ");
    return html`<ol class="ui-rls__stages" aria-label="Pipeline" style=${`--rls-cols: ${cols}`}>
      ${repeat(
        this.stages,
        (s) => s.id,
        (s, i) => {
          const v = this.version(s.version);
          const roll = s.rollout && s.rollout.percent > 0 ? s.rollout : undefined;
          const rv = roll ? this.version(roll.version) : undefined;
          const requested = this.requested?.stage === s.id;
          const role = s.version !== undefined && s.version === this.candidate ? "candidate" : s.id === target?.id ? "target" : "";
          return html`${i === at ? gate : nothing}<li class="ui-rls__stage" data-role=${role} ?data-requested=${requested}>
            ${i || i === at ? html`<span class="ui-rls__arrow">${chevron()}</span>` : nothing}
            <span class="ui-rls__stage-head">
              <span class="ui-rls__dot" aria-hidden="true"></span>
              <span class="ui-rls__stage-name">${s.label}</span>
              ${requested ? html`<span class="ui-rls__tag" data-tone="info">Requested</span>` : role === "target" ? html`<span class="ui-rls__tag">Next</span>` : nothing}
            </span>
            ${s.version !== undefined
              ? html`<span class="ui-rls__stage-version">
                  <span class="ui-rls__ver" ?data-candidate=${s.version === this.candidate}>${this.name(v, s.version)}</span>
                  ${v?.title ? html`<span class="ui-rls__stage-title">${v.title}</span>` : nothing}
                </span>`
              : html`<span class="ui-rls__stage-empty">Nothing deployed</span>`}
            ${roll
              ? html`<span class="ui-rls__stage-roll">
                  <span class="ui-rls__roll-text"><span class="ui-rls__chip" ?data-candidate=${roll.version === this.candidate}>${this.name(rv, roll.version)}</span> on ${pct(clamp(roll.percent))}<span class="ui-rls__sr"> of traffic</span></span>
                  <span class="ui-rls__bar" aria-hidden="true"><span class="ui-rls__bar-fill" style=${`width: ${clamp(roll.percent)}%`}></span></span>
                </span>`
              : nothing}
          </li>`;
        },
      )}
    </ol>`;
  }

  /** The gate into the target stage: each requirement, met or not, and Promote */
  private renderGate(stage: ReleaseStage, candidate: ReleaseVersion, checks: Check[], line: string, state: string, canPromote: boolean) {
    const id = this.uid;
    const e = this.evidence;
    const value = (c: Check) => {
      if (c.id === "hold") return c.text;
      if (c.value) return c.value;
      if (c.id === "approvals") return c.met || !this.approvals.some((a) => a.state === "rejected") ? c.text : "Changes requested";
      if (!e || (e.state !== "running" && e.passRate === undefined)) return "Not run yet";
      if (e.state === "running") return "Running…";
      return `${pct(clamp(e.passRate!))} · needs ${pct(e.threshold)}`;
    };
    const name = { evidence: "Evaluation", suites: "Suites", findings: "Findings", approvals: "Approvals", hold: "Hold" } as const;
    return html`<li class="ui-rls__gate" data-state=${state} aria-labelledby=${`${id}-gate-title`}>
      <span class="ui-rls__arrow">${chevron()}</span>
      <h4 class="ui-rls__gate-title" id=${`${id}-gate-title`}>Gate to ${stage.label}</h4>
      <ul class="ui-rls__checks">
        ${checks.map(
          (c) => html`<li class="ui-rls__check" data-id=${c.id} data-met=${c.met ? "true" : "false"}>
            <span class="ui-rls__mark" data-met=${c.met ? "true" : "false"}>${c.met ? checkIcon() : c.id === "evidence" && e?.state === "running" ? clockIcon() : xIcon()}</span>
            <span class="ui-rls__check-name">${name[c.id]}<span class="ui-rls__sr">${c.met ? ", met" : ", not met"}:</span></span>
            <span class="ui-rls__check-value">${value(c)}</span>
          </li>`,
        )}
      </ul>
      <p class="ui-rls__gate-note ${state === "blocked" ? "ui-rls__sr" : ""}" id=${`${id}-gate`}>${line}</p>
      <button
        type="button"
        class="ui-rls__btn ui-rls__btn--primary ui-rls__promote"
        aria-haspopup="dialog"
        aria-disabled=${canPromote ? "false" : "true"}
        aria-describedby=${`${id}-gate`}
        @click=${(ev: Event) => this.ask("promote", ev.currentTarget as HTMLElement)}
      >${promoteIcon()}Promote ${candidate.label}</button>
    </li>`;
  }

  private renderBlock(id: string, label: unknown, status: Check | undefined, body: unknown) {
    return html`<section class="ui-rls__block" data-block=${id} aria-labelledby=${`${this.uid}-${id}`}>
      <h4 class="ui-rls__label" id=${`${this.uid}-${id}`}>
        ${label}${status
          ? html`<span class="ui-rls__mark" data-met=${status.met ? "true" : "false"}>${status.met ? checkIcon() : id === "evidence" && this.evidence?.state === "running" ? clockIcon() : xIcon()}<span class="ui-rls__sr">${status.met ? " – met" : " – not met"}</span></span>`
          : nothing}
      </h4>
      ${body}
    </section>`;
  }

  private renderChanges(from: ReleaseVersion | undefined, to: ReleaseVersion) {
    return html`${this.changes.length
        ? html`<ul class="ui-rls__changes">
            ${this.changes.map(
              (c) => html`<li class="ui-rls__change" ?data-none=${!c.count}>
                <span class="ui-rls__change-label">${c.label}</span>
                <span class="ui-rls__change-count">${c.count ? c.count : "–"}<span class="ui-rls__sr">${c.count === 1 ? " change" : c.count ? " changes" : " no changes"}</span></span>
                ${c.detail ? html`<span class="ui-rls__change-detail">${c.detail}</span>` : nothing}
              </li>`,
            )}
          </ul>`
        : html`<p class="ui-rls__quiet">No changes reported.</p>`}
      <button type="button" class="ui-rls__link ui-rls__compare" @click=${() => this.compare()}>Compare ${from ? `${from.label} → ${to.label}` : to.label}${outIcon()}</button>`;
  }

  private renderEvidence(check: Check, from: ReleaseVersion | undefined) {
    const e = this.evidence;
    if (!e || (e.state !== "running" && e.passRate === undefined)) return html`<p class="ui-rls__quiet">No evaluation has run on this version.</p>`;
    if (e.state === "running") return html`<p class="ui-rls__quiet">${clockIcon()}Running${e.suite ? ` ${e.suite}` : ""}…</p>`;
    const rate = clamp(e.passRate!);
    const delta = e.baseline === undefined ? undefined : rate - e.baseline;
    return html`<div class="ui-rls__score">
        <span class="ui-rls__big">${pct(rate)}</span>
        <span class="ui-rls__score-text">pass rate${e.cases !== undefined ? html` on ${e.cases.toLocaleString()} cases` : nothing}</span>
      </div>
      <span class="ui-rls__bar ui-rls__bar--score" data-met=${check.met ? "true" : "false"} aria-hidden="true"
        ><span class="ui-rls__bar-fill" style=${`width: ${rate}%`}></span><span class="ui-rls__threshold" style=${`left: ${clamp(e.threshold)}%`}></span
      ></span>
      <p class="ui-rls__fine">
        Threshold ${pct(e.threshold)} · <span class="ui-rls__verdict" data-met=${check.met ? "true" : "false"}>${check.met ? "met" : "not met"}</span>
        ${delta !== undefined ? html`<br /><span class="ui-rls__delta" data-dir=${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}>${pts(delta)}</span> vs ${from ? from.label : "current"} (${pct(e.baseline!)})` : nothing}
      </p>`;
  }

  private renderApprovals(check: Check) {
    const need = Math.max(0, this.requiredApprovals);
    return html`<p class="ui-rls__fine">${check.text}${need && check.text.includes(" of ") ? " in" : ""}</p>
      ${this.approvals.length
        ? html`<ul class="ui-rls__people">
            ${this.approvals.map(
              (a) => html`<li class="ui-rls__person" data-state=${a.state}>
                <span class="ui-rls__avatar" aria-hidden="true">${initials(a.name)}</span>
                <span class="ui-rls__person-text">
                  <span class="ui-rls__person-name">${a.name}</span>
                  ${a.detail ? html`<span class="ui-rls__person-detail">${a.detail}</span>` : nothing}
                </span>
                <span class="ui-rls__state" data-state=${a.state}>${a.state === "approved" ? html`${checkIcon()}Approved` : a.state === "rejected" ? html`${xIcon()}Changes requested` : html`${clockIcon()}Waiting`}</span>
              </li>`,
            )}
          </ul>`
        : html`<p class="ui-rls__quiet">Nobody has reviewed it yet.</p>`}`;
  }

  /** A waiver's line: who granted it and when it expires, as given; expired, said so */
  private renderWaiver(w: ReleaseWaiver | undefined) {
    if (!w) return nothing;
    return html`<span class="ui-rls__waiver" ?data-expired=${!!w.expired}
      >${w.expired ? alertIcon() : clockIcon()}<span class="ui-rls__waiver-ref">${this.waiverName(w)}</span> · ${w.expired ? `expired ${w.expires}` : `expires ${w.expires}`} · granted by ${w.grantedBy}</span
    >`;
  }

  private renderSuites(check: Check) {
    const status = { pass: "Pass", fail: "Fail", conditional: "Conditional" } as const;
    const count = (s: ReleaseSuite) =>
      [s.passed !== undefined ? `${s.passed} passed` : "", s.failed !== undefined ? `${s.failed} failed` : "", s.inconclusive !== undefined ? `${s.inconclusive} inconclusive` : ""].filter(Boolean).join(" · ");
    return html`<p class="ui-rls__fine">${check.text}</p>
      <ul class="ui-rls__suites">
        ${this.suites.map((s) => {
          const problem = this.suiteProblem(s);
          const w = s.status === "conditional" ? this.waiverFor(s.id) : undefined;
          return html`<li class="ui-rls__suite" data-status=${s.status} data-met=${problem ? "false" : "true"}>
            <span class="ui-rls__suite-icon" data-status=${s.status}>${s.status === "pass" ? checkIcon() : s.status === "fail" ? xIcon() : alertIcon()}</span>
            <span class="ui-rls__suite-text">
              <span class="ui-rls__suite-name">${s.label}</span>
              ${count(s) ? html`<span class="ui-rls__suite-count">${count(s)}</span>` : nothing}
              ${s.status === "conditional" && !w ? html`<span class="ui-rls__waiver" data-expired>${alertIcon()}No waiver</span>` : this.renderWaiver(w)}
            </span>
            <span class="ui-rls__status" data-status=${s.status}>${status[s.status]}</span>
          </li>`;
        })}
      </ul>`;
  }

  private renderFindings() {
    const suite = (id: string | undefined) => this.suites.find((s) => s.id === id)?.label;
    return html`<ul class="ui-rls__findings">
      ${this.findings.map((f) => {
        const w = f.blocking ? this.waiverFor(f.id) : undefined;
        const blocks = this.findingBlocks(f);
        return html`<li class="ui-rls__finding" ?data-blocking=${blocks}>
          <button type="button" class="ui-rls__finding-btn" @click=${() => this.emit<ReleaseFindingOpenEvent>("tc-finding-open", { finding: f }, { cancelable: true })}>
            <span class="ui-rls__finding-top">
              ${f.ref ? html`<span class="ui-rls__finding-ref">${f.ref}</span>` : nothing}
              ${f.severity ? html`<span class="ui-rls__sev">${f.severity}</span>` : nothing}
              <span class="ui-rls__finding-title">${f.title}</span>
            </span>
            <span class="ui-rls__finding-meta">
              ${blocks ? html`<span class="ui-rls__blocks-tag">Blocks promotion</span>` : nothing}
              ${[f.status, suite(f.suite)].filter(Boolean).join(" · ")}
            </span>
            ${this.renderWaiver(w)}
          </button>
        </li>`;
      })}
    </ul>`;
  }

  private renderRollback() {
    const r = this.rollback;
    const stage = this.rollbackStage;
    const to = this.version(r?.version);
    if (!r || !stage || !to) return html`<div class="ui-rls__rollback"><span class="ui-rls__rb-icon">${undoIcon()}</span><p class="ui-rls__rb-text"><span class="ui-rls__rb-label">Rollback target</span><span class="ui-rls__quiet">None – there's no earlier version to return to.</span></p></div>`;
    const ok = this.canRollback && !this.requested;
    return html`<div class="ui-rls__rollback">
      <span class="ui-rls__rb-icon">${undoIcon()}</span>
      <p class="ui-rls__rb-text">
        <span class="ui-rls__rb-label">Rollback target</span>
        <span class="ui-rls__rb-what"><span class="ui-rls__chip">${to.label}</span>${to.title ? html` ${to.title}` : nothing}<span class="ui-rls__rb-where"> in ${stage.label}</span></span>
      </p>
      <button
        type="button"
        class="ui-rls__btn ui-rls__btn--secondary ui-rls__rollback-btn"
        aria-haspopup="dialog"
        aria-disabled=${ok ? "false" : "true"}
        aria-label=${`Roll back ${stage.label} to ${to.label}`}
        @click=${(e: Event) => ok && this.ask("rollback", e.currentTarget as HTMLElement)}
      >${undoIcon()}Roll back</button>
    </div>`;
  }

  private renderDialog() {
    const id = this.uid;
    const kind = this.confirming;
    const block = kind ? this.confirmBlock(kind) : "";
    const blocked = block ? html`<p class="ui-rls__dlg-blocked">${block}</p>` : nothing;
    let body: unknown = nothing;
    if (kind === "promote") {
      const stage = this.targetStage;
      const to = this.version(this.candidate);
      const from = this.version(stage?.version);
      const changed = this.changes.filter((c) => c.count);
      const approved = this.approvals.filter((a) => a.state === "approved").map((a) => a.name);
      const e = this.evidence;
      const checks = this.checks;
      // The waivers this promotion leans on
      const waivers = this.waivers.filter((w) => !w.expired && w.covers.some((id) => this.suites.some((s) => s.id === id && s.status === "conditional") || this.findings.some((f) => f.id === id && f.blocking)));
      body = html`<div class="ui-rls__dlg-head">
          <span class="ui-rls__dlg-icon" data-kind="promote">${promoteIcon()}</span>
          <h3 class="ui-rls__dlg-title" id=${`${id}-dlg-title`}>Promote ${to?.label} to ${stage?.label}?</h3>
        </div>
        <div id=${`${id}-dlg-desc`} class="ui-rls__dlg-desc">
          <p class="ui-rls__dlg-lead">${from ? `${stage?.label} moves from ${from.label} to ${to?.label}.` : `${stage?.label} gets its first version, ${to?.label}.`}</p>
          <dl class="ui-rls__facts">
            <div><dt>Changes</dt><dd>${changed.length ? changed.map((c) => `${c.label} ${c.count}`).join(" · ") : "None reported"}</dd></div>
            ${e && e.passRate !== undefined ? html`<div><dt>Evaluation</dt><dd>${pct(e.passRate)} pass rate · ${pct(e.threshold)} threshold</dd></div>` : nothing}
            ${this.suites.length ? html`<div><dt>Suites</dt><dd>${checks.find((c) => c.id === "suites")?.text}</dd></div>` : nothing}
            ${waivers.length ? html`<div><dt>Waivers</dt><dd>${waivers.map((w) => `${this.waiverName(w)} by ${w.grantedBy}, expires ${w.expires}`).join("; ")}</dd></div>` : nothing}
            <div><dt>Approved by</dt><dd>${approved.length ? approved.join(", ") : "Nobody"}</dd></div>
          </dl>
          <p class="ui-rls__dlg-note">${this.promoteNote}</p>
          ${blocked}
        </div>
        <div class="ui-rls__dlg-actions">
          <button type="button" class="ui-rls__btn ui-rls__btn--secondary ui-rls__cancel" @click=${() => this.close()}>${this.cancelLabel}</button>
          <button type="button" class="ui-rls__btn ui-rls__btn--primary ui-rls__confirm" ?disabled=${!!block} @click=${() => this.confirm()}>${promoteIcon()}Promote to ${stage?.label}</button>
        </div>`;
    } else if (kind === "rollback") {
      const stage = this.rollbackStage;
      const to = this.version(this.rollback?.version);
      const fromId = this.rollbackFrom(stage);
      const from = this.version(fromId);
      const partial = stage?.rollout && stage.rollout.version === fromId && stage.rollout.percent < 100 ? stage.rollout.percent : undefined;
      body = html`<div class="ui-rls__dlg-head">
          <span class="ui-rls__dlg-icon" data-kind="rollback">${undoIcon(18)}</span>
          <h3 class="ui-rls__dlg-title" id=${`${id}-dlg-title`}>Roll back ${stage?.label} to ${to?.label}?</h3>
        </div>
        <div id=${`${id}-dlg-desc`} class="ui-rls__dlg-desc">
          <p class="ui-rls__dlg-lead">
            ${stage?.label} stops serving ${this.name(from, fromId)}${partial !== undefined ? ` (${pct(partial)} of traffic)` : ""} and returns to
            <strong>${to?.label}${to?.title ? ` – ${to.title}` : ""}</strong>.
          </p>
          <p class="ui-rls__dlg-note">${this.rollbackNote}</p>
          ${blocked}
        </div>
        <div class="ui-rls__dlg-actions">
          <button type="button" class="ui-rls__btn ui-rls__btn--secondary ui-rls__cancel" @click=${() => this.close()}>${this.cancelLabel}</button>
          <button type="button" class="ui-rls__btn ui-rls__btn--danger ui-rls__confirm" ?disabled=${!!block} @click=${() => this.confirm()}>${undoIcon()}Roll back to ${to?.label}</button>
        </div>`;
    }
    return html`<dialog
      class="ui-rls__dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby=${`${id}-dlg-title`}
      aria-describedby=${`${id}-dlg-desc`}
      @keydown=${this.onDialogKey}
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.close();
      }}
    >
      ${kind === null ? nothing : html`<div class="ui-rls__dlg">${body}</div>`}
    </dialog>`;
  }

  protected override render() {
    const stage = this.targetStage;
    const candidate = this.version(this.candidate);
    const from = this.version(stage?.version);
    const checks = this.checks;
    const unmet = checks.filter((c) => !c.met);
    const ready = this.ready;
    const req = this.requested;
    // The app is already moving the candidate into the target stage
    const rolling = stage?.rollout && stage.rollout.version === this.candidate && stage.rollout.percent > 0 ? clamp(stage.rollout.percent) : 0;
    const [pill, tone] = req
      ? [req.kind === "promote" ? "Promotion requested" : "Rollback requested", "info"]
      : !candidate
        ? ["No candidate", "neutral"]
        : !stage
          ? ["Fully promoted", "success"]
          : rolling
            ? ["Rolling out", "info"]
            : ready
            ? ["Ready to promote", "success"]
            : ["Not ready", "warning"];
    const footLine = req
      ? `Waiting for ${this.stages.find((s) => s.id === req.stage)?.label ?? req.stage} to report the change.`
      : !candidate
        ? "Pick a version to promote."
        : !stage
          ? `${candidate.label} runs in every stage.`
          : rolling
            ? `${candidate.label} is rolling out to ${stage.label}: ${pct(rolling)} of traffic so far.`
            : ready
            ? `Evidence and approvals are in. ${candidate.label} can go to ${stage.label}.`
            : [this.hold ? this.hold.replace(/\.?$/, ".") : "", unmet.some((c) => c.id !== "hold") ? `To promote: ${unmet.filter((c) => c.id !== "hold").map((c) => c.phrase).join("; ")}.` : ""].filter(Boolean).join(" ");
    const canPromote = ready && !req && !rolling;
    const gateState = req || rolling ? "moving" : ready ? "ready" : "blocked";
    const gate = candidate && stage ? this.renderGate(stage, candidate, checks, footLine, gateState, canPromote) : nothing;
    return html`
      <span class="ui-rls__sr" role="status">${this.announce}</span>
      ${cardHead({ icon: layersIcon, title: this.heading, subtitle: this.description, aside: html`<span class="ui-rls__pill" data-tone=${tone}>${pill}</span>` })}
      <div class="ui-rls__card">
        ${this.renderStages(gate)}
        ${candidate && stage
          ? html`<div class="ui-rls__candidate">
              <p class="ui-rls__cand-line">
                <span class="ui-rls__chip" data-candidate>${candidate.label}</span>
                ${candidate.title ? html`<span class="ui-rls__cand-title">${candidate.title}</span>` : nothing}
                <span class="ui-rls__cand-to">${from ? `against ${from.label} in ${stage.label}` : `going to ${stage.label}`}</span>
              </p>
              <div class="ui-rls__blocks">
                ${this.renderBlock("changes", "What changed", undefined, this.renderChanges(from, candidate))}
                ${this.renderBlock("evidence", "Evaluation", checks.find((c) => c.id === "evidence"), this.renderEvidence(checks.find((c) => c.id === "evidence")!, from))}
                ${this.renderBlock("approvals", "Approvals", checks.find((c) => c.id === "approvals"), this.renderApprovals(checks.find((c) => c.id === "approvals")!))}
              </div>
              ${this.suites.length || this.findings.length
                ? html`<div class="ui-rls__blocks ui-rls__blocks--gate" data-n=${this.suites.length && this.findings.length ? 2 : 1}>
                    ${this.suites.length ? this.renderBlock("suites", "Gate suites", checks.find((c) => c.id === "suites"), this.renderSuites(checks.find((c) => c.id === "suites")!)) : nothing}
                    ${this.findings.length
                      ? this.renderBlock("findings", html`Open findings<span class="ui-rls__count">${this.findings.length}</span>`, checks.find((c) => c.id === "findings"), this.renderFindings())
                      : nothing}
                  </div>`
                : nothing}
            </div>`
          : nothing}
        ${this.renderRollback()}
      </div>
      ${this.renderDialog()}
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; the gate line and Promote sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rls"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-muted);
}
/* Clean: one quiet white card; Promote is its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rls"] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  color: var(--tc-text-secondary);
}
[data-ui="rls"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 720px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: var(--tc-tracking-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rls"] *, [data-ui="rls"] *::before, [data-ui="rls"] *::after { box-sizing: border-box; }
:where([data-ui="rls"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rls"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="rls"] :is(ul, ol) { margin: 0; padding: 0; list-style: none; }
[data-ui="rls"] :is(h3, h4, p, dl, dd) { margin: 0; }
[data-ui="rls"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rls"] svg[stroke-width] { stroke-width: 1.5; }
.ui-rls__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rls__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }

/* ----- Header (cardHead): on the tray in Standard, the card's first row in Clean; the state pill at its right ----- */
.ui-rls__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-muted); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-none); white-space: nowrap; }
.ui-rls__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rls__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-rls__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }

/* ----- The pipeline: the dominant row – stage tiles, the gate on the edge into the target ----- */
.ui-rls__stages { display: grid; grid-template-columns: var(--rls-cols); gap: var(--tc-space-3); padding: var(--tc-space-4) !important; }
/* Clean: right under the header row */
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stages { padding-top: var(--tc-space-1) !important; }
.ui-rls__stage, .ui-rls__gate { position: relative; display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); }
/* Standard: filled tiles; the target is outlined */
:where([data-look="standard"], [data-look="standard"] *).ui-rls__stage { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-rls__stage[data-role="target"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
.ui-rls__arrow { position: absolute; top: 50%; left: calc(-1 * var(--tc-space-3)); display: grid; place-items: center; width: var(--tc-space-3); color: var(--tc-icon-muted); transform: translateY(-50%); }
.ui-rls__arrow > svg { width: 12px; height: 12px; }
.ui-rls__gate:first-child > .ui-rls__arrow { display: none; }
.ui-rls__stage-head { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; min-height: var(--tc-pill-h); }
.ui-rls__dot { display: none; flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1.5px var(--tc-border-control); }
.ui-rls__stage-name { overflow: hidden; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-rls__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); margin-left: auto; padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-rls__tag[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-rls__stage-version { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
/* The version a stage runs: the biggest thing on the stage */
.ui-rls__ver { color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); }
.ui-rls__ver[data-candidate] { color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__ver { font-weight: var(--tc-font-weight-medium); }
.ui-rls__stage-title { display: -webkit-box; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.ui-rls__stage-empty { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rls__stage-roll { display: grid; gap: var(--tc-space-1); }
.ui-rls__roll-text { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
/* A version's label inline: mono, a quiet chip; the candidate's is accented */
.ui-rls__chip { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-rls__chip[data-candidate] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
/* The gate: what promotion needs, ticked off, and Promote */
.ui-rls__gate { gap: var(--tc-space-2-5); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-rls__gate::before { content: ""; position: absolute; top: 0; right: var(--tc-space-3); left: var(--tc-space-3); height: 2px; background: var(--tc-status-warning-solid); }
.ui-rls__gate[data-state="ready"]::before { background: var(--tc-status-success-solid); }
.ui-rls__gate[data-state="moving"]::before { background: var(--tc-status-info-solid); }
.ui-rls__gate-title { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-rls__checks { display: grid; gap: var(--tc-space-1-5); }
.ui-rls__check { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 0 var(--tc-space-2); }
.ui-rls__check-name { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rls__check-value { grid-column: 2; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
.ui-rls__check[data-met="false"] .ui-rls__check-value { color: var(--tc-status-warning-fg); }
.ui-rls__gate-note { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-rls__gate .ui-rls__promote { width: 100%; }
/* Clean: a quiet track – a line through dots, the stages' text under it; the gate a hairline box on the line */
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stages { gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stage { padding: 0 var(--tc-space-3) 0 0; border-radius: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stage::before { content: ""; position: absolute; top: 9px; right: 0; left: 0; height: 1px; background: var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stage:last-child::before { right: auto; width: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__arrow { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__dot { position: relative; display: block; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stage-head { position: relative; min-height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stage-name { padding-right: var(--tc-space-1-5); background: var(--tc-surface-raised); font-weight: var(--tc-font-weight-regular); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__tag { position: relative; margin-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stage[data-role="candidate"] .ui-rls__dot { background: var(--tc-accent); box-shadow: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stage[data-role="target"] .ui-rls__dot { box-shadow: inset 0 0 0 1.5px var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__stage[data-role="target"] .ui-rls__stage-name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__gate { margin-right: var(--tc-space-3); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__gate::before { right: 0; left: 0; border-radius: var(--tc-radius-md) var(--tc-radius-md) 0 0; }
.ui-rls__none { padding: 0 var(--tc-space-4) var(--tc-space-4); color: var(--tc-text-muted); }

/* ----- Bars: a rollout or a pass rate ----- */
.ui-rls__bar { position: relative; display: block; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-rls__bar-fill { display: block; height: 100%; min-width: 0; border-radius: inherit; background: var(--tc-meter-fill); transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-rls__bar--score[data-met="true"] .ui-rls__bar-fill { background: var(--tc-status-success-solid); }
.ui-rls__bar--score[data-met="false"] .ui-rls__bar-fill { background: var(--tc-status-warning-solid); }
.ui-rls__threshold { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--tc-text-primary); transform: translateX(-50%); }

/* ----- The candidate ----- */
.ui-rls__candidate { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rls__cand-line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; line-height: var(--tc-line-height-snug); }
.ui-rls__cand-title { min-width: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-rls__cand-to { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rls__blocks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-2); }
.ui-rls__block { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rls__block { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__blocks { gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__block { padding: var(--tc-space-3) 0; border-radius: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__block + .ui-rls__block { padding-left: var(--tc-space-4); box-shadow: inset 1px 0 0 var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__block:not(:last-child) { padding-right: var(--tc-space-4); }
.ui-rls__label { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rls__mark { display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; }
.ui-rls__mark[data-met="true"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rls__mark[data-met="false"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-rls__mark > svg { width: 10px; height: 10px; stroke-width: 2.5; }
.ui-rls__quiet { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rls__fine { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
/* What changed: a small table of areas and counts */
.ui-rls__changes { display: grid; }
.ui-rls__change { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 0 var(--tc-space-2); padding: var(--tc-space-1) 0; }
.ui-rls__change + .ui-rls__change { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rls__change-label { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rls__change-count { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-rls__change-detail { grid-column: 1 / -1; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-rls__change[data-none] :is(.ui-rls__change-label, .ui-rls__change-count) { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-rls__link { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1); min-height: 24px; color: var(--tc-accent-text); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); text-decoration: underline; text-decoration-color: transparent; text-underline-offset: 2px; transition: text-decoration-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rls__link:hover { text-decoration-color: currentColor; }
/* Evaluation and rollout: a big number and a bar */
.ui-rls__score { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-1-5); }
.ui-rls__big { color: var(--tc-text-primary); font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__big { font-weight: var(--tc-font-weight-medium); }
.ui-rls__score-text { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rls__verdict[data-met="true"] { color: var(--tc-status-success-fg); font-weight: var(--tc-font-weight-medium); }
.ui-rls__verdict[data-met="false"] { color: var(--tc-status-warning-fg); font-weight: var(--tc-font-weight-medium); }
.ui-rls__delta[data-dir="up"] { color: var(--tc-status-success-fg); }
.ui-rls__delta[data-dir="down"] { color: var(--tc-status-danger-fg); }
/* Approvals */
.ui-rls__people { display: grid; gap: var(--tc-space-1-5); }
.ui-rls__person { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-2); }
.ui-rls__avatar { display: grid; place-items: center; width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); border-radius: 50%; background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); }
.ui-rls__person-text { display: grid; min-width: 0; }
.ui-rls__person-name { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-rls__person-detail { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-rls__state { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-rls__state[data-state="approved"] { color: var(--tc-status-success-fg); }
.ui-rls__state[data-state="rejected"] { color: var(--tc-status-danger-fg); }

/* ----- Gate suites, linked findings and their waivers ----- */
.ui-rls__blocks--gate { grid-template-columns: minmax(0, 1fr); }
.ui-rls__blocks--gate[data-n="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
:where([data-look="clean"], [data-look="clean"] *).ui-rls__blocks--gate { margin-top: calc(-1 * var(--tc-space-3)); }
.ui-rls__count { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); letter-spacing: normal; text-transform: none; font-variant-numeric: tabular-nums; }
.ui-rls__suites, .ui-rls__findings { display: grid; }
.ui-rls__suite { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-2); padding: var(--tc-space-2) 0; }
.ui-rls__suite + .ui-rls__suite, .ui-rls__finding + .ui-rls__finding { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rls__suite-icon { display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rls__suite-icon[data-status="fail"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rls__suite-icon[data-status="conditional"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-rls__suite-icon > svg { width: 12px; height: 12px; stroke-width: 2.25; }
.ui-rls__suite-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rls__suite-name { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-rls__suite-count { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
/* A suite's result: a pill on its status tone */
.ui-rls__status { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-rls__status[data-status="fail"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rls__status[data-status="conditional"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
/* A waiver: its reference, when it expires as given, who granted it; expired, on the danger tone */
.ui-rls__waiver { display: block; color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
[data-ui="rls"] .ui-rls__waiver > svg { display: inline-block; width: 12px; height: 12px; margin-right: var(--tc-space-1); vertical-align: -2px; }
.ui-rls__waiver[data-expired] { color: var(--tc-status-danger-fg); }
.ui-rls__waiver-ref { font-family: var(--tc-font-mono); font-weight: var(--tc-font-weight-medium); }
/* A finding: a row that opens it */
.ui-rls__finding-btn { display: grid; gap: var(--tc-space-1); width: calc(100% + 2 * var(--tc-space-1-5)); margin: 0 calc(-1 * var(--tc-space-1-5)); padding: var(--tc-space-2) var(--tc-space-1-5); border-radius: var(--tc-radius-md); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rls__finding-btn:hover { background: var(--tc-fill-hover); }
.ui-rls__finding-top { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rls__finding-ref { flex: none; color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-rls__sev { flex: none; display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-rls__finding-title { min-width: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rls__finding-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-rls__blocks-tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }

/* ----- Rollback target ----- */
.ui-rls__rollback { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rls__rb-icon { display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-rls__rb-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rls__rb-label { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rls__rb-what { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-1-5); color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-rls__rb-where { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

/* ----- Buttons: primary, secondary and danger, medium ----- */
.ui-rls__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-rls__btn:active:not([aria-disabled="true"], :disabled) { transform: scale(0.98); }
.ui-rls__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rls__btn--primary:hover:not([aria-disabled="true"], :disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-rls__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-rls__btn--secondary:hover:not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-rls__btn--danger { background: var(--tc-action-danger-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-danger-fg); }
.ui-rls__btn--danger:hover:not(:disabled) { background: var(--tc-action-danger-bg-hover); }
.ui-rls__btn[aria-disabled="true"], .ui-rls__btn:disabled { background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-muted); cursor: not-allowed; }
.ui-rls__rollback-btn { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); }

/* ----- The confirmation ----- */
.ui-rls__dialog { width: min(460px, calc(100vw - 2 * var(--tc-space-4))); max-height: calc(100vh - 2 * var(--tc-space-4)); margin: auto; padding: 0; overflow: auto; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-rls__dialog:not([open]) { display: none; }
.ui-rls__dialog::backdrop { background: var(--tc-scrim); }
.ui-rls__dialog[open] { animation: ui-rls-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rls__dlg { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-5); }
.ui-rls__dlg-head { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-rls__dlg-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: var(--tc-radius-lg); background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-rls__dlg-icon[data-kind="rollback"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rls__dlg-title { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-primary); }
.ui-rls__dlg-desc { display: grid; gap: var(--tc-space-3); }
.ui-rls__dlg-lead { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
.ui-rls__dlg-lead strong { font-weight: var(--tc-font-weight-medium); }
.ui-rls__facts { display: grid; padding: var(--tc-space-1) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-rls__facts > div { display: grid; grid-template-columns: 7.5rem minmax(0, 1fr); gap: var(--tc-space-3); padding: var(--tc-space-1-5) 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rls__facts > div + div { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rls__facts dt { color: var(--tc-text-muted); }
.ui-rls__facts dd { color: var(--tc-text-primary); }
.ui-rls__dlg-note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-rls__dlg-blocked { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-danger-fg); }
.ui-rls__dlg-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }
@keyframes ui-rls-pop { from { opacity: 0; transform: translateY(6px) scale(0.98); } }

/* ----- Narrow: the pipeline runs down the card, the gate between stages ----- */
@container (max-width: 640px) {
  .ui-rls__blocks, .ui-rls__blocks--gate[data-n="2"] { grid-template-columns: minmax(0, 1fr); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rls__block:nth-child(n) { padding: var(--tc-space-3) 0; box-shadow: none; }
}
@container (max-width: 560px) {
  .ui-rls__stages, :where([data-look="clean"], [data-look="clean"] *).ui-rls__stages { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-2); }
  .ui-rls__arrow { display: none; }
  :where([data-look="clean"], [data-look="clean"] *).ui-rls__stages { gap: var(--tc-space-2-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rls__stage { padding: 0 0 0 var(--tc-space-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rls__stage::before, :where([data-look="clean"], [data-look="clean"] *).ui-rls__stage:last-child::before { top: 14px; right: auto; bottom: calc(-1 * var(--tc-space-2-5)); left: 4px; width: 1px; height: auto; }
  :where([data-look="clean"], [data-look="clean"] *).ui-rls__stage:last-child::before { display: none; }
  :where([data-look="clean"], [data-look="clean"] *).ui-rls__dot { position: absolute; top: 4px; left: calc(-1 * var(--tc-space-5)); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rls__gate { margin: 0 0 0 var(--tc-space-5); }
  .ui-rls__ver { font-size: var(--tc-font-size-lg); }
}
@container (max-width: 400px) {
  .ui-rls__candidate, .ui-rls__rollback { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-rls__stages { padding-left: var(--tc-space-3) !important; padding-right: var(--tc-space-3) !important; }
  .ui-rls__rollback { grid-template-columns: auto minmax(0, 1fr); }
  .ui-rls__rollback-btn { grid-column: 2; justify-self: start; }
}
@media (max-width: 400px) {
  .ui-rls__dlg { padding: var(--tc-space-4); }
  .ui-rls__dlg-actions > .ui-rls__btn { flex: 1 1 0; }
  .ui-rls__facts > div { grid-template-columns: minmax(0, 1fr); gap: 0; }
}
@media (pointer: coarse) {
  .ui-rls__btn { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rls"] *, [data-ui="rls"] *::before, [data-ui="rls"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-configuration-release-control")) customElements.define("tc-configuration-release-control", TcConfigurationReleaseControl);

declare global {
  interface HTMLElementTagNameMap {
    "tc-configuration-release-control": TcConfigurationReleaseControl;
  }
}
