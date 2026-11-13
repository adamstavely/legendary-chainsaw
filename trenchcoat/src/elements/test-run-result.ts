import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-test-run-result> – a test run that shows only what failed. The header says how it went in words ("3 failed,
 * 212 passed, 4 skipped") over a bar of the same shares, with the duration and the command. The failing tests come
 * first, each a disclosure that opens to the assertion message, expected against received as a small line diff, and
 * the stack trimmed to the project's own frames, with the file and line as a link (tc-open). The passed and skipped
 * tests fold into one line each, "212 passed", that opens to the list. Re-run failed asks the page to run them again
 * (tc-rerun). While `running`, the counts tick up live and the bar fills towards `total`.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-test-run-result command="npx vitest run" .tests=${tests} duration="12400"></tc-test-run-result>
 *
 * Passed tests can be left out and given as `counts` instead – a big suite needn't send 2,000 names to show 3
 * failures. Unset, `open` opens the first failure; a toggle fires a cancelable tc-open-change ({ open }).
 *
 * Keyboard: the failures' disclosures are one tab stop – ↑ / ↓ or j / k move between them, Home / End to the first and
 * last, Enter or Space opens one. Tab goes on into an open failure's file link.
 */

/* Icons: Lucide (ISC, lucide.dev) – flask-conical, chevron-right, rotate-ccw, x, check, minus, file */
const flaskIcon = svg`<path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"></path><path d="M6.453 15h11.094"></path><path d="M8.5 2h7"></path>`;
const icons = {
  chevron: svg`<path d="m9 18 6-6-6-6"></path>`,
  rerun: svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`,
  failed: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  passed: svg`<path d="M20 6 9 17l-5-5"></path>`,
  skipped: svg`<path d="M5 12h14"></path>`,
  file: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`,
};
const glyph = (body: TemplateResult) =>
  html`<svg class="ui-trr__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export type TestStatus = "passed" | "failed" | "skipped";

export type TestCase = {
  id: string;
  /** The test's own name – "rejects a negative amount" */
  name: string;
  /** Where it sits – the file or describe path, "ledger › postings" */
  suite?: string;
  status: TestStatus;
  /** How long it took, in ms */
  durationMs?: number;
  /** The assertion's message – "expected 1240 to be 1214.5" */
  message?: string;
  /** What the test expected, as text; with `received`, drawn as a line diff */
  expected?: string;
  /** What it got */
  received?: string;
  /** The stack as printed; trimmed to the project's frames for display */
  stack?: string;
  /** The file to open, when the stack doesn't say */
  file?: string;
  /** The line in it */
  line?: number;
};

export type TestCounts = { passed: number; failed: number; skipped: number };

/** Detail of tc-open: the file and line of a failure */
export type TestOpen = { id: string; file: string; line?: number };
/** Detail of tc-rerun: the failing tests to run again */
export type TestRerun = { ids: string[] };
/** Detail of tc-open-change: the failures now open */
export type TestOpenChange = { open: string[] };

/** A stack frame from a dependency or the runtime, left out of the trimmed stack */
export function isLibraryFrame(line: string): boolean {
  return /node_modules|\bnode:|\(internal\/|\binternal\/|\(<anonymous>\)|\bjest-circus\b/.test(line);
}

/** The first frame of the project's own code as { file, line } – "at post (src/ledger.ts:42:7)" */
export function firstUserFrame(stack: string | undefined): { file: string; line?: number } | null {
  for (const line of (stack ?? "").split("\n")) {
    if (!/^\s*at\s/.test(line) || isLibraryFrame(line)) continue;
    const m = /\(?((?:[A-Za-z]:)?[^\s():]+):(\d+)(?::\d+)?\)?\s*$/.exec(line);
    if (m) return { file: m[1].replace(/^file:\/\//, ""), line: Number(m[2]) };
  }
  return null;
}

/** Totals from the tests, with `counts` filling in what the tests leave out (the larger of the two wins) */
export function countTests(tests: readonly TestCase[], counts?: Partial<TestCounts>): TestCounts {
  const c: TestCounts = { passed: 0, failed: 0, skipped: 0 };
  for (const t of tests) c[t.status]++;
  return { passed: Math.max(c.passed, counts?.passed ?? 0), failed: Math.max(c.failed, counts?.failed ?? 0), skipped: Math.max(c.skipped, counts?.skipped ?? 0) };
}

function duration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)} s`;
  return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
}

let instances = 0;

/**
 * A test run that shows only what failed: counts in words over a bar, the failures with their message, diff and stack, and Re-run failed.
 * @tag tc-test-run-result
 * @fires tc-open-change - A failure was opened or closed ({ open }: TestOpenChange); cancelable – prevented, it stays as it was
 * @fires tc-open - A failure's file link was pressed ({ id, file, line }: TestOpen)
 * @fires tc-rerun - Re-run failed was pressed ({ ids }: TestRerun); cancelable – prevented, nothing is announced
 */
export class TcTestRunResult extends TcElement {
  static override ui = "trr";

  /** The heading */
  @property() accessor heading = "Test run";
  /** The command that ran the tests – "npx vitest run" */
  @property() accessor command: string | undefined = undefined;
  /** The tests: the failures with their details, and any passed or skipped ones to list */
  @property({ attribute: false }) accessor tests: TestCase[] = [];
  /** Totals, for tests left out of `tests` */
  @property({ attribute: false }) accessor counts: Partial<TestCounts> | undefined = undefined;
  /** How many tests the run has, so the bar can fill towards it while running */
  @property({ type: Number }) accessor total: number | undefined = undefined;
  /** How long the run took, in ms */
  @property({ type: Number }) accessor duration: number | undefined = undefined;
  /** The run is still going: the counts are live and Re-run waits */
  @property({ type: Boolean, reflect: true }) accessor running = false;
  /** The failures that are open, by id. Unset: the first failure */
  @property({ attribute: false }) accessor open: string[] | undefined = undefined;
  /** Hides Re-run failed */
  @property({ type: Boolean, attribute: "no-rerun" }) accessor noRerun = false;

  /** @internal The failure holding the tab stop */
  @state() accessor active = "";
  /** @internal Whether the passed and skipped lists are open */
  @state() accessor shown: { passed: boolean; skipped: boolean } = { passed: false, skipped: false };
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-trr${++instances}`;
  private wasRunning = false;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-trr__toggle[tabindex="0"]') ?? this.querySelector<HTMLElement>(".ui-trr__fold"));
  }

  private get failures() {
    return this.tests.filter((t) => t.status === "failed");
  }
  private get openIds(): string[] {
    if (this.open) return this.open;
    const first = this.failures[0];
    return first ? [first.id] : [];
  }
  private get totals() {
    return countTests(this.tests, this.counts);
  }

  /** "3 failed, 212 passed, 4 skipped" */
  private summary(c: TestCounts) {
    const parts: string[] = [];
    if (c.failed) parts.push(`${c.failed} failed`);
    if (c.passed) parts.push(`${c.passed} passed`);
    if (c.skipped) parts.push(`${c.skipped} skipped`);
    return parts.join(", ") || (this.running ? "Starting" : "No tests");
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const f = this.failures;
    if (!f.some((t) => t.id === this.active)) this.active = f[0]?.id ?? "";
    if (changed.has("running")) {
      if (this.wasRunning && !this.running) {
        const c = this.totals;
        this.said = `Run finished: ${this.summary(c)}`;
      }
      this.wasRunning = this.running;
    }
  }

  private toggle(id: string) {
    const now = this.openIds;
    const open = now.includes(id) ? now.filter((x) => x !== id) : [...now, id];
    this.active = id;
    if (this.emit<TestOpenChange>("tc-open-change", { open }, { cancelable: true })) this.open = open;
  }

  private rerun() {
    if (this.running) {
      this.said = "The run is still going";
      return;
    }
    const ids = this.failures.map((t) => t.id);
    if (!ids.length) return;
    if (this.emit<TestRerun>("tc-rerun", { ids }, { cancelable: true })) this.said = ids.length === 1 ? "Re-running 1 failed test" : `Re-running ${ids.length} failed tests`;
  }

  private onListKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".ui-trr__toggle");
    if (!btn || e.altKey || e.metaKey || e.ctrlKey) return;
    const f = this.failures;
    const i = f.findIndex((t) => t.id === btn.dataset.id);
    const to: Record<string, number> = { ArrowUp: i - 1, k: i - 1, ArrowDown: i + 1, j: i + 1, Home: 0, End: f.length - 1 };
    const next = to[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const t = f[Math.max(0, Math.min(f.length - 1, next))];
    if (!t) return;
    this.active = t.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-trr__toggle[data-id="${CSS.escape(t.id)}"]`)?.focus());
  };

  /* ---------- Render ---------- */

  private renderBar(c: TestCounts) {
    const sum = c.passed + c.failed + c.skipped;
    const whole = Math.max(sum, this.total ?? 0) || 1;
    const seg = (n: number, kind: TestStatus) => (n ? html`<span class="ui-trr__seg" data-kind=${kind} style=${styleMap({ flexGrow: String(n / whole) })}></span>` : nothing);
    return html`<span class="ui-trr__bar" aria-hidden="true">${seg(c.failed, "failed")}${seg(c.passed, "passed")}${seg(c.skipped, "skipped")}</span>`;
  }

  /** Expected against received, line by line: lines that differ are marked − and + */
  private renderDiff(t: TestCase) {
    if (t.expected === undefined || t.received === undefined) return nothing;
    const a = t.expected.split("\n");
    const b = t.received.split("\n");
    const side = (lines: string[], other: string[], kind: "expected" | "received") =>
      html`<div class="ui-trr__side" data-kind=${kind}>
        <span class="ui-trr__side-label">${kind === "expected" ? "Expected" : "Received"}</span>
        <pre class="ui-trr__pre">${lines.map((l, i) => {
          const changed = l !== other[i];
          return html`<span class="ui-trr__line" ?data-changed=${changed}><span class="ui-trr__sign" aria-hidden="true">${changed ? (kind === "expected" ? "−" : "+") : " "}</span>${changed
              ? html`<span class="ui-trr__sr">${kind === "expected" ? "expected: " : "received: "}</span>`
              : nothing}${l}</span>`;
        })}</pre>
      </div>`;
    return html`<div class="ui-trr__diff">${side(a, b, "expected")}${side(b, a, "received")}</div>`;
  }

  private renderFailure(t: TestCase) {
    const isOpen = this.openIds.includes(t.id);
    const panel = `${this.uid}-p-${t.id}`;
    const where = t.file ? { file: t.file, line: t.line } : firstUserFrame(t.stack);
    const frames = (t.stack ?? "")
      .split("\n")
      .filter((l) => l.trim() && (!/^\s*at\s/.test(l) || !isLibraryFrame(l)))
      .join("\n");
    return html`<li class="ui-trr__fail" data-id=${t.id} ?data-open=${isOpen}>
      <button
        type="button"
        class="ui-trr__toggle"
        data-id=${t.id}
        tabindex=${this.active === t.id ? 0 : -1}
        aria-expanded=${isOpen ? "true" : "false"}
        aria-controls=${panel}
        aria-describedby=${`${this.uid}-keys`}
        @click=${() => this.toggle(t.id)}
      >
        <span class="ui-trr__chev">${glyph(icons.chevron)}</span>
        <span class="ui-trr__mark" data-kind="failed">${glyph(icons.failed)}</span>
        <span class="ui-trr__name"
          >${t.suite ? html`<span class="ui-trr__suite">${t.suite} › </span>` : nothing}${t.name}<span class="ui-trr__sr">, failed</span></span
        >
        ${t.durationMs !== undefined ? html`<span class="ui-trr__time">${duration(t.durationMs)}</span>` : nothing}
      </button>
      <div class="ui-trr__panel" id=${panel} ?hidden=${!isOpen}>
        ${t.message ? html`<pre class="ui-trr__pre ui-trr__message">${t.message}</pre>` : nothing} ${this.renderDiff(t)}
        ${frames ? html`<pre class="ui-trr__pre ui-trr__stack" aria-label="Stack">${frames}</pre>` : nothing}
        ${where
          ? html`<button
              type="button"
              class="ui-trr__file"
              @click=${() => this.emit<TestOpen>("tc-open", { id: t.id, file: where.file, line: where.line })}
            >${glyph(icons.file)}<span>${where.file}${where.line !== undefined ? `:${where.line}` : ""}</span></button>`
          : nothing}
      </div>
    </li>`;
  }

  private renderFold(kind: "passed" | "skipped", n: number) {
    if (!n) return nothing;
    const list = this.tests.filter((t) => t.status === kind);
    const word = `${n} ${kind}`;
    if (!list.length)
      return html`<div class="ui-trr__fold-row"><span class="ui-trr__fold" data-static><span class="ui-trr__mark" data-kind=${kind}>${glyph(icons[kind])}</span>${word}</span></div>`;
    const open = this.shown[kind];
    const id = `${this.uid}-${kind}`;
    return html`<div class="ui-trr__fold-row">
      <button type="button" class="ui-trr__fold" aria-expanded=${open ? "true" : "false"} aria-controls=${id} @click=${() => (this.shown = { ...this.shown, [kind]: !open })}>
        <span class="ui-trr__chev">${glyph(icons.chevron)}</span><span class="ui-trr__mark" data-kind=${kind}>${glyph(icons[kind])}</span>${word}
      </button>
      <ul class="ui-trr__names" id=${id} ?hidden=${!open}>
        ${list.map(
          (t) =>
            html`<li>${t.suite ? html`<span class="ui-trr__suite">${t.suite} › </span>` : nothing}${t.name}${t.durationMs !== undefined
                ? html`<span class="ui-trr__time">${duration(t.durationMs)}</span>`
                : nothing}</li>`,
        )}
      </ul>
    </div>`;
  }

  protected override render() {
    const c = this.totals;
    const failures = this.failures;
    const meta = [this.running ? "Running" : this.duration !== undefined ? duration(this.duration) : ""].filter(Boolean);
    const head = cardHead({
      icon: flaskIcon,
      title: this.heading,
      id: `${this.uid}-title`,
      subtitle: this.command ? html`<code class="ui-trr__cmd">${this.command}</code>` : nothing,
      aside: meta.length ? html`<span class="ui-trr__meta" ?data-running=${this.running}>${meta[0]}</span>` : nothing,
    });
    const state = this.running ? "running" : c.failed ? "failed" : c.passed ? "passed" : "none";
    const body = html`<div class="ui-trr__summary" data-state=${state}>
        <p class="ui-trr__words">
          ${this.running ? html`<span class="ui-trr__live">Running · </span>` : nothing}${this.summary(c)}${this.running && this.total
            ? html`<span class="ui-trr__of"> of ${this.total}</span>`
            : nothing}
        </p>
        ${this.renderBar(c)}
        ${failures.length && !this.noRerun
          ? html`<button type="button" class="ui-trr__rerun" aria-disabled=${ifDefined(this.running ? "true" : undefined)} @click=${this.rerun}>${glyph(icons.rerun)}Re-run failed</button>`
          : nothing}
      </div>
      ${failures.length
        ? html`<ul class="ui-trr__fails" aria-label="Failed tests" @keydown=${this.onListKey}>${repeat(
            failures,
            (t) => t.id,
            (t) => this.renderFailure(t),
          )}</ul>`
        : nothing}
      ${this.renderFold("passed", c.passed)} ${this.renderFold("skipped", c.skipped)}`;
    const clean = this.resolvedLook === "clean";
    return html`${clean ? html`<div class="ui-trr__card">${head}${body}</div>` : html`${head}<div class="ui-trr__card">${body}</div>`}
      <span class="ui-trr__sr" id=${`${this.uid}-keys`}>Up and down arrows or J and K move between failures</span>
      <span class="ui-trr__sr" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="trr"] {
  box-sizing: border-box;
  container-type: inline-size;
  display: block;
  width: 100%;
  max-width: 760px;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="trr"] {
  box-sizing: border-box;
  container-type: inline-size;
  display: block;
  width: 100%;
  max-width: 740px;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="trr"] *, [data-ui="trr"] *::before, [data-ui="trr"] *::after { box-sizing: border-box; }
:where([data-ui="trr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="trr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="trr"] ul { margin: 0; padding: 0; list-style: none; }
.ui-trr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-trr__glyph { display: block; flex: none; width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-trr__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-trr__card { min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-trr__cmd { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); overflow-wrap: anywhere; }
.ui-trr__meta { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; }
.ui-trr__meta[data-running] { color: var(--tc-status-info-fg); }
/* ----- The summary: words, the bar, Re-run failed ----- */
.ui-trr__summary { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: var(--tc-space-3); row-gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-trr__card > .tc-head + .ui-trr__summary { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-trr__words { grid-column: 1; margin: 0; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-trr__summary[data-state="failed"] .ui-trr__words { color: var(--tc-status-danger-fg); }
.ui-trr__live { color: var(--tc-status-info-fg); }
.ui-trr__of { color: var(--tc-text-muted); }
.ui-trr__bar { grid-column: 1 / -1; grid-row: 2; display: flex; gap: var(--tc-hairline); height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-trr__seg { flex-basis: 0; min-width: var(--tc-space-0-5); transition: flex-grow var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-trr__seg[data-kind="failed"] { background: var(--tc-status-danger-fg); }
.ui-trr__seg[data-kind="passed"] { background: var(--tc-status-success-fg); }
.ui-trr__seg[data-kind="skipped"] { background: var(--tc-border-strong); }
.ui-trr__rerun { grid-column: 2; grid-row: 1; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
.ui-trr__rerun:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-trr__rerun[aria-disabled="true"] { color: var(--tc-text-muted); cursor: default; }
/* ----- Failures ----- */
.ui-trr__fails { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-trr__fail + .ui-trr__fail { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-trr__toggle { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-2) var(--tc-space-4); text-align: left; }
.ui-trr__toggle:hover, .ui-trr__fold:not([data-static]):hover { background: var(--tc-fill-hover); }
.ui-trr__chev { color: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
[aria-expanded="true"] > .ui-trr__chev { transform: rotate(90deg); }
.ui-trr__mark[data-kind="failed"] { color: var(--tc-status-danger-fg); }
.ui-trr__mark[data-kind="passed"] { color: var(--tc-status-success-fg); }
.ui-trr__mark[data-kind="skipped"] { color: var(--tc-icon-muted); }
.ui-trr__name { flex: 1 1 0; min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-trr__suite { color: var(--tc-text-muted); }
.ui-trr__time { flex: none; margin-left: auto; padding-left: var(--tc-space-2); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-trr__panel { display: grid; gap: var(--tc-space-2); padding: 0 var(--tc-space-4) var(--tc-space-3) var(--tc-space-10); }
.ui-trr__panel[hidden] { display: none; }
.ui-trr__pre { margin: 0; padding: var(--tc-space-2) var(--tc-space-2-5); overflow-x: auto; border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-trr__message { color: var(--tc-status-danger-fg); }
.ui-trr__stack { color: var(--tc-text-muted); }
.ui-trr__diff { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--tc-space-2); }
.ui-trr__side { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-trr__side-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-trr__line { display: block; }
.ui-trr__sign { display: inline-block; width: 1.5ch; color: var(--tc-text-muted); }
.ui-trr__side[data-kind="expected"] .ui-trr__line[data-changed] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-trr__side[data-kind="received"] .ui-trr__line[data-changed] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-trr__line[data-changed] .ui-trr__sign { color: inherit; }
.ui-trr__file { justify-self: start; display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; text-align: left; }
.ui-trr__file:hover { background: var(--tc-fill-hover); }
/* ----- Passed and skipped, folded ----- */
.ui-trr__fold-row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-trr__fold { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-2) var(--tc-space-4); color: var(--tc-text-secondary); text-align: left; }
.ui-trr__fold[data-static] { padding-left: var(--tc-space-10); }
[data-ui="trr"] .ui-trr__names { display: grid; gap: var(--tc-space-1); padding: 0 var(--tc-space-4) var(--tc-space-3) var(--tc-space-10); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-trr__names[hidden] { display: none; }
.ui-trr__names li { display: flex; gap: var(--tc-space-2); }
@container (max-width: 480px) {
  .ui-trr__diff { grid-template-columns: minmax(0, 1fr); }
  .ui-trr__panel, [data-ui="trr"] .ui-trr__names { padding-left: var(--tc-space-4); }
  .ui-trr__summary { grid-template-columns: minmax(0, 1fr); }
  .ui-trr__rerun { grid-column: 1; grid-row: 3; justify-self: start; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="trr"] *, [data-ui="trr"] *::before, [data-ui="trr"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-trr__mark, .ui-trr__seg { color: CanvasText; forced-color-adjust: none; }
  .ui-trr__seg { background: CanvasText !important; }
}
`;
}

if (!customElements.get("tc-test-run-result")) customElements.define("tc-test-run-result", TcTestRunResult);

declare global {
  interface HTMLElementTagNameMap {
    "tc-test-run-result": TcTestRunResult;
  }
}
