import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { copyText } from "./internal/util";

/*
 * <tc-attestation-check> – verify a signed evidence package, locally. Paste its hash, or drop the package file (or
 * browse for it), and the app's `verify` function checks it in the page: the signature, the integrity of its hash
 * chain, and what it covers. The element shows the result – valid, or invalid with the reasons – and never sends the
 * file anywhere: it hands the File object to `verify` and nothing else.
 *
 *   <tc-attestation-check .verify=${async (input) => ({ valid: true, signature: { ok: true } })}></tc-attestation-check>
 *
 * `result` is a value with a cancelable `tc-result-change` (a check finished, or "Check another" cleared it);
 * `tc-verify` fires when a check starts. A `verify` that throws shows "Couldn't check" with Try again.
 */

/** One check's outcome */
export type AttestationCheckItem = {
  ok: boolean;
  /** What was found – e.g. "Signed with the release key · Ed25519", "Link 17 doesn't match link 16" */
  detail?: string;
};

export type AttestationResult = {
  /** The verdict: every check passed */
  valid: boolean;
  /** The package's name – e.g. "vendor-risk-q3.evidence" */
  name?: string;
  /** Its hash, as checked */
  hash?: string;
  /** Who signed it */
  signer?: string;
  /** When it was signed, as text */
  signedAt?: string;
  /** The signature check; unset = not checked */
  signature?: AttestationCheckItem;
  /** The hash chain's integrity; unset = not checked */
  chain?: AttestationCheckItem;
  /** What the package covers, and whether it covers what it claims; unset = not checked */
  coverage?: AttestationCheckItem & { items?: string[] };
  /** Why it's invalid, in plain words – shown under the checks */
  reasons?: string[];
};

/** What was checked: a pasted hash or a file */
export type AttestationInput = { kind: "hash"; hash: string } | { kind: "file"; file: File };
/** Checks a hash or a file in the page and returns the result; may return a promise. Throw to say it couldn't check */
export type AttestationVerify = (input: string | File) => AttestationResult | Promise<AttestationResult>;

/** Details of the events */
export type AttestationResultChange = { result: AttestationResult | null; input?: AttestationInput };
export type AttestationVerifyStart = { input: AttestationInput };

const CHECKS = [
  ["signature", "Signature"],
  ["chain", "Chain integrity"],
  ["coverage", "Coverage"],
] as const;

/** A long hash with its middle left out: "sha256:9f2c41ab…c51d08aa" */
const shortHash = (h: string) => {
  const at = h.indexOf(":") + 1;
  const hex = h.slice(at);
  return hex.length > 20 ? `${h.slice(0, at)}${hex.slice(0, 8)}…${hex.slice(-8)}` : h;
};

/* ---------- Icons ---------- */

/* shield, shield-check, shield-x, upload, check, x, minus, copy, rotate-ccw: Lucide (ISC, lucide.dev) */
const shieldPath = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>`;
// The header icon: a shield with a check
const shieldMark = svg`${shieldPath}<path d="m9 12 2 2 4-4"></path>`;
const shieldOk = html`<svg class="ui-atc__verdict-svg" viewBox="0 0 24 24" aria-hidden="true">${shieldPath}${svg`<path d="m9 12 2 2 4-4"></path>`}</svg>`;
const shieldBad = html`<svg class="ui-atc__verdict-svg" viewBox="0 0 24 24" aria-hidden="true">${shieldPath}${svg`<path d="m14.5 9.5-5 5"></path><path d="m9.5 9.5 5 5"></path>`}</svg>`;
const uploadIcon = html`<svg class="ui-atc__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m17 8-5-5-5 5"></path><path d="M12 3v12"></path>`}</svg>`;
const passIcon = html`<svg class="ui-atc__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M20 6 9 17l-5-5"></path>`}</svg>`;
const failIcon = html`<svg class="ui-atc__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`}</svg>`;
const skipIcon = html`<svg class="ui-atc__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M5 12h14"></path>`}</svg>`;
const copyIcon = html`<svg class="ui-atc__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`}</svg>`;
const againIcon = html`<svg class="ui-atc__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`}</svg>`;
const spinner = html`<svg class="ui-atc__spin" viewBox="0 0 24 24" aria-hidden="true">${svg`<circle cx="12" cy="12" r="8.5" stroke-opacity="0.25"></circle><path d="M12 3.5A8.5 8.5 0 0 1 20.5 12"></path>`}</svg>`;

let instances = 0;

/**
 * Verify a signed evidence package by its hash or file – signature, chain integrity and what it covers, checked
 * locally.
 * @tag tc-attestation-check
 * @fires tc-verify - A check started ({ input }: AttestationVerifyStart – the pasted hash or the File)
 * @fires tc-result-change - A check finished, or "Check another" cleared the result ({ result, input }: AttestationResultChange); cancelable – prevent it to keep `result` as it is (controlled use)
 */
export class TcAttestationCheck extends TcElement {
  static override ui = "atc";

  /** The heading, and the component's name */
  @property() accessor heading = "Verify an evidence package";
  /** Checks a pasted hash (a string) or a dropped file (a File) in the page and returns the result, or a promise of
   *  it. Throw to say it couldn't check. The element never sends the file anywhere */
  @property({ attribute: false }) accessor verify: AttestationVerify | undefined = undefined;
  /** The result on show (null = none). Set by a finished check unless a tc-result-change listener calls
   *  preventDefault() */
  @property({ attribute: false }) accessor result: AttestationResult | null = null;
  /** What a pasted hash must look like before it's checked – hex, 40 to 128 characters, optionally "sha256:" first */
  @property({ attribute: false }) accessor hashPattern: RegExp = /^(?:sha(?:256|384|512):)?[0-9a-f]{40,128}$/i;
  /** File types the file picker offers – e.g. [".json", ".zip"]; unset offers any file */
  @property({ attribute: false }) accessor accept: string[] | undefined = undefined;
  /** The line under the drop area – where the check happens */
  @property() accessor hint = "Checked in this browser – the file isn't uploaded";
  /** Placeholder of the hash field */
  @property() accessor placeholder = "sha256:9f2c41ab07e3…";

  /** @internal The hash field */
  @state() accessor hash = "";
  /** @internal The hash field's error */
  @state() accessor hashError = "";
  /** @internal A check in flight, or one that failed */
  @state() accessor phase: "idle" | "checking" | "error" = "idle";
  /** @internal Why the check failed */
  @state() accessor problem = "";
  /** @internal What is being checked, for the status line */
  @state() accessor checking = "";
  /** @internal Files are dragged over */
  @state() accessor dragging = false;
  /** @internal The hash was copied */
  @state() accessor copied = false;
  /** @internal For screen readers */
  @state() accessor said = "";

  private readonly uid = `tc-atc${++instances}`;
  private depth = 0;
  private lastInput: AttestationInput | null = null;
  private run = 0;
  private focusTarget: "verdict" | "area" | null = null;
  private copyTimer = 0;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-atc__area, .ui-atc__again, .ui-atc__verdict"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copyTimer);
    // A check that finishes after the element left is ignored
    this.run++;
  }

  /* ---------- Checking ---------- */

  private async check(input: AttestationInput) {
    if (!this.verify || this.phase === "checking") return;
    this.lastInput = input;
    const run = ++this.run;
    this.phase = "checking";
    this.problem = "";
    this.checking = input.kind === "file" ? input.file.name : shortHash(input.hash);
    this.say(`Checking ${input.kind === "file" ? input.file.name : "the hash"}…`);
    this.emit<AttestationVerifyStart>("tc-verify", { input });
    try {
      const result = await this.verify(input.kind === "file" ? input.file : input.hash);
      if (run !== this.run) return;
      this.phase = "idle";
      this.setResult(result, input);
    } catch (err) {
      if (run !== this.run) return;
      this.phase = "error";
      this.problem = err instanceof Error && err.message ? err.message : "Something went wrong";
      this.say(`Couldn't check: ${this.problem}`);
    }
  }

  private setResult(result: AttestationResult | null, input?: AttestationInput) {
    if (!this.emit<AttestationResultChange>("tc-result-change", { result, input }, { cancelable: true })) return;
    this.result = result;
    if (result) {
      this.focusTarget = this.contains(document.activeElement) || document.activeElement === document.body ? "verdict" : null;
      const failed = CHECKS.filter(([k]) => result[k] && !result[k]!.ok).map(([, label]) => label.toLowerCase());
      this.say(result.valid ? "Valid: the package is intact and signed." : `Invalid${failed.length ? `: ${failed.join(", ")} failed` : ""}.`);
    } else {
      this.focusTarget = "area";
      this.hash = "";
      this.hashError = "";
    }
  }

  private submitHash = (e?: Event) => {
    e?.preventDefault();
    const hash = this.hash.trim();
    if (!hash) {
      this.hashError = "Paste a package hash";
      return;
    }
    if (!this.hashPattern.test(hash)) {
      this.hashError = "That doesn't look like a hash – paste the hex digest, e.g. sha256:9f2c…";
      return;
    }
    this.hashError = "";
    this.check({ kind: "hash", hash });
  };

  private pickFile(files: FileList | null | undefined) {
    const file = files?.[0];
    if (file) this.check({ kind: "file", file });
  }

  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  private async copy(hash: string) {
    if (!(await copyText(hash)) || !this.isConnected) return;
    this.copied = true;
    this.say("Hash copied");
    clearTimeout(this.copyTimer);
    this.copyTimer = window.setTimeout(() => (this.copied = false), 1600);
  }

  /* ---------- Drag and drop ---------- */

  private hasFiles(e: DragEvent) {
    return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files") && this.phase !== "checking";
  }
  private onDragEnter = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.depth++;
    this.dragging = true;
  };
  private onDragOver = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  };
  private onDragLeave = () => {
    this.depth = Math.max(0, this.depth - 1);
    if (!this.depth) this.dragging = false;
  };
  private onDrop = (e: DragEvent) => {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.depth = 0;
    this.dragging = false;
    this.pickFile(e.dataTransfer!.files);
  };

  /* ---------- Update ---------- */

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusTarget) {
      const el = this.querySelector<HTMLElement>(this.focusTarget === "verdict" ? ".ui-atc__verdict" : ".ui-atc__area");
      this.focusTarget = null;
      el?.focus();
    }
  }

  /* ---------- Render ---------- */

  private renderForm() {
    const busy = this.phase === "checking";
    const disabled = !this.verify;
    const errId = `${this.uid}-err`;
    return html`<div class="ui-atc__form">
      <input
        id=${`${this.uid}-file`}
        class="ui-atc__file"
        type="file"
        tabindex="-1"
        aria-hidden="true"
        accept=${ifDefined(this.accept?.join(","))}
        ?disabled=${disabled || busy}
        @change=${(e: Event) => {
          const input = e.target as HTMLInputElement;
          this.pickFile(input.files);
          input.value = "";
        }}
      />
      <button
        type="button"
        class="ui-atc__area"
        ?data-dragging=${this.dragging}
        ?disabled=${disabled || busy}
        aria-describedby=${`${this.uid}-hint`}
        @click=${() => this.querySelector<HTMLInputElement>(".ui-atc__file")?.click()}
        @dragenter=${this.onDragEnter}
        @dragover=${this.onDragOver}
        @dragleave=${this.onDragLeave}
        @drop=${this.onDrop}
      >
        <span class="ui-atc__area-icon" aria-hidden="true">${uploadIcon}</span>
        <span class="ui-atc__area-title">${this.dragging ? "Release to check the package" : html`Drop a package file or <span class="ui-atc__browse">browse</span>`}</span>
        <span class="ui-atc__hint" id=${`${this.uid}-hint`}>${this.hint}</span>
      </button>
      <div class="ui-atc__or" aria-hidden="true"><span>or</span></div>
      <form class="ui-atc__hash" @submit=${this.submitHash} novalidate>
        <label class="ui-atc__label" for=${`${this.uid}-hash`}>Package hash</label>
        <div class="ui-atc__hash-row">
          <span class="ui-atc__field" ?data-invalid=${!!this.hashError}>
            <input
              id=${`${this.uid}-hash`}
              .value=${this.hash}
              placeholder=${this.placeholder}
              spellcheck="false"
              autocomplete="off"
              aria-invalid=${this.hashError ? "true" : "false"}
              aria-describedby=${ifDefined(this.hashError ? errId : undefined)}
              ?disabled=${disabled || busy}
              @input=${(e: InputEvent) => {
                this.hash = (e.currentTarget as HTMLInputElement).value;
                if (this.hashError) this.hashError = "";
              }}
            />
          </span>
          <button type="submit" class="ui-atc__btn ui-atc__btn--primary" ?disabled=${disabled || busy}>Verify</button>
        </div>
        ${this.hashError ? html`<p class="ui-atc__error" id=${errId}>${this.hashError}</p>` : nothing}
      </form>
    </div>`;
  }

  private renderChecking() {
    return html`<div class="ui-atc__checking" aria-busy="true">
      ${spinner}
      <span class="ui-atc__checking-text"><span class="ui-atc__checking-title">Checking the signature, chain and coverage…</span><span class="ui-atc__checking-what">${this.checking}</span></span>
    </div>`;
  }

  private renderError() {
    return html`<div class="ui-atc__problem" role="alert">
      <span class="ui-atc__problem-text"><b>Couldn't check this package.</b> ${this.problem}</span>
      <span class="ui-atc__problem-actions">
        <button type="button" class="ui-atc__btn" @click=${() => this.lastInput && this.check(this.lastInput)}>${againIcon}<span>Try again</span></button>
        <button type="button" class="ui-atc__btn ui-atc__btn--ghost" @click=${() => (this.phase = "idle")}>Cancel</button>
      </span>
    </div>`;
  }

  private renderResult(r: AttestationResult) {
    const verdictId = `${this.uid}-verdict`;
    const facts: [string, unknown][] = [];
    if (r.hash)
      facts.push([
        "Hash",
        html`<span class="ui-atc__hash-value" title=${r.hash}>${shortHash(r.hash)}</span><button type="button" class="ui-atc__copy" aria-label=${this.copied ? "Hash copied" : "Copy hash"} @click=${() => this.copy(r.hash!)}>${this.copied ? passIcon : copyIcon}</button>`,
      ]);
    if (r.signer) facts.push(["Signed by", r.signer]);
    if (r.signedAt) facts.push(["Signed", r.signedAt]);
    return html`<div class="ui-atc__result" data-valid=${r.valid ? "true" : "false"}>
      <div class="ui-atc__verdict" tabindex="-1">
        <span class="ui-atc__verdict-icon">${r.valid ? shieldOk : shieldBad}</span>
        <span class="ui-atc__verdict-text" id=${verdictId}>
          <span class="ui-atc__verdict-title">${r.valid ? "Valid – the package is intact and signed" : "Invalid – don't rely on this package"}</span>
          ${r.name ? html`<span class="ui-atc__verdict-name">${r.name}</span>` : nothing}
        </span>
      </div>
      ${facts.length ? html`<dl class="ui-atc__facts">${facts.map(([k, v]) => html`<div class="ui-atc__fact" ?data-wide=${k === "Hash"}><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>` : nothing}
      <ul class="ui-atc__checks" aria-label="Checks">
        ${CHECKS.map(([key, label]) => {
          const c = r[key];
          const st = !c ? "skip" : c.ok ? "pass" : "fail";
          const items = key === "coverage" ? r.coverage?.items : undefined;
          return html`<li class="ui-atc__check" data-status=${st}>
            <span class="ui-atc__check-icon" aria-hidden="true">${st === "pass" ? passIcon : st === "fail" ? failIcon : skipIcon}</span>
            <span class="ui-atc__check-main">
              <span class="ui-atc__check-label">${label}<span class="ui-atc__sr">: ${st === "pass" ? "passed" : st === "fail" ? "failed" : "not checked"}</span></span>
              <span class="ui-atc__check-detail">${c?.detail ?? (st === "skip" ? "Not checked" : st === "pass" ? "Passed" : "Failed")}</span>
              ${items?.length ? html`<span class="ui-atc__items">${items.map((i) => html`<span class="ui-atc__item">${i}</span>`)}</span>` : nothing}
            </span>
          </li>`;
        })}
      </ul>
      ${r.reasons?.length
        ? html`<div class="ui-atc__reasons">
            <h4 class="ui-atc__caption" id=${`${this.uid}-why`}>Why it failed</h4>
            <ul aria-labelledby=${`${this.uid}-why`}>${r.reasons.map((x) => html`<li>${x}</li>`)}</ul>
          </div>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const r = this.result;
    const titleId = `${this.uid}-title`;
    let body: unknown;
    if (this.phase === "checking") body = this.renderChecking();
    else if (r) body = this.renderResult(r);
    else body = html`${this.phase === "error" ? this.renderError() : nothing}${this.renderForm()}`;
    // Standard: the header sits on the tray above the card; Clean: it's the card's first row
    const clean = this.resolvedLook === "clean";
    const head = cardHead({ icon: shieldMark, title: this.heading, id: titleId });
    return html`
      ${clean ? nothing : head}
      <div class="ui-atc__card">
        ${clean ? head : nothing}
        <div class="ui-atc__body">${body}</div>
        ${r && this.phase !== "checking"
          ? html`<div class="ui-atc__foot">
              <span class="ui-atc__local">Checked locally</span>
              <button type="button" class="ui-atc__btn ui-atc__again" @click=${() => this.setResult(null)}>Check another</button>
            </div>`
          : nothing}
      </div>
      <span class="ui-atc__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="atc"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="atc"] {
  --tc-attestation-check-tray-bg: var(--tc-surface-tray);
  --tc-attestation-check-panel-bg: var(--tc-surface-on-tray);
  --tc-attestation-check-area-bg: var(--tc-surface-well);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 520px;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-attestation-check-tray-bg);
  container: ui-atc / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: var(--tc-tracking-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="atc"] {
  --tc-attestation-check-panel-bg: var(--tc-surface-raised);
  --tc-attestation-check-area-bg: var(--tc-surface-raised);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 500px;
  min-width: 0;
  container: ui-atc / inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="atc"] *, [data-ui="atc"] *::before, [data-ui="atc"] *::after { box-sizing: border-box; }
:where([data-ui="atc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="atc"]) :is(h4, p, ul, dl, dd, form) { margin: 0; padding: 0; }
:where([data-ui="atc"]) ul { list-style: none; }
[data-ui="atc"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="atc"] svg { display: block; flex: none; }
.ui-atc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-atc__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-atc__glyph { stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-atc__glyph { stroke-width: 1.4; }
/* ----- The white card ----- */
.ui-atc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-attestation-check-panel-bg); box-shadow: var(--tc-card-shadow); }
.ui-atc__body { display: grid; padding: var(--tc-space-3); }
.ui-atc__form { display: grid; gap: var(--tc-space-3); }
.ui-atc__file { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
/* The drop area: dropzone's, smaller */
.ui-atc__area { position: relative; display: grid; justify-items: center; gap: var(--tc-space-1); width: 100%; padding: var(--tc-space-5) var(--tc-space-4); border-radius: var(--tc-radius-xl); background: var(--tc-attestation-check-area-bg); text-align: center; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), border-color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-atc__area { border: 1.5px dashed var(--tc-border-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-atc__area { border: 1px dashed var(--tc-border-strong); border-radius: var(--tc-radius-lg); }
.ui-atc__area:hover:not(:disabled) { border-color: var(--tc-border-control-hover); background: var(--tc-fill-subtle); }
.ui-atc__area[data-dragging] { border-style: solid; border-color: var(--tc-border-selected); background: var(--tc-accent-subtle); }
.ui-atc__area:disabled { opacity: 0.55; cursor: not-allowed; }
.ui-atc__area-icon { display: grid; place-items: center; width: 32px; height: 32px; margin-bottom: var(--tc-space-1); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-primary); transition: transform var(--tc-duration-slow) var(--tc-ease-move); }
.ui-atc__area:hover .ui-atc__area-icon, .ui-atc__area[data-dragging] .ui-atc__area-icon { transform: translateY(-2px); }
.ui-atc__area[data-dragging] .ui-atc__area-icon { color: var(--tc-accent-text); }
.ui-atc__area-title { color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); }
.ui-atc__browse { color: var(--tc-accent-text); }
.ui-atc__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-atc__or { display: flex; align-items: center; gap: var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-atc__or::before, .ui-atc__or::after { content: ""; flex: 1; height: var(--tc-hairline); background: var(--tc-divider); }
/* The hash: a field like Combobox's and a primary button */
.ui-atc__hash { display: grid; gap: var(--tc-space-1-5); }
.ui-atc__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-atc__hash-row { display: flex; gap: var(--tc-space-2); }
.ui-atc__field { display: flex; flex: 1; align-items: center; min-width: 0; height: var(--tc-field-h); padding: 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-atc__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-atc__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-atc__field[data-invalid] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-atc__field input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; background: none; color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); letter-spacing: 0; outline: none; }
.ui-atc__field input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
.ui-atc__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
/* Buttons: Button's recipes */
.ui-atc__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-atc__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-atc__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-atc__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-atc__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active); transform: scale(0.97); }
.ui-atc__btn--ghost { background: none; box-shadow: none; color: var(--tc-action-ghost-fg); }
.ui-atc__btn--ghost:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); box-shadow: none; }
.ui-atc__btn:disabled { opacity: 0.5; cursor: default; }
/* ----- Checking ----- */
.ui-atc__checking { display: flex; align-items: center; gap: var(--tc-space-3); min-height: 120px; padding: var(--tc-space-4); }
.ui-atc__spin { width: 20px; height: 20px; fill: none; stroke: var(--tc-accent-text); stroke-width: 2.5; stroke-linecap: round; animation: ui-atc-spin var(--tc-duration-reveal-slow) linear infinite; }
.ui-atc__checking-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-atc__checking-title { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-atc__checking-what { overflow: hidden; color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
/* ----- Couldn't check ----- */
.ui-atc__problem { display: grid; gap: var(--tc-space-2); margin-bottom: var(--tc-space-3); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-atc__problem b { font-weight: var(--tc-font-weight-semibold); }
.ui-atc__problem-actions { display: flex; gap: var(--tc-space-2); }
.ui-atc__problem .ui-atc__btn { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); }
/* ----- The result ----- */
.ui-atc__result { display: grid; gap: var(--tc-space-3); animation: ui-atc-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-atc__verdict { display: flex; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); outline: none; }
.ui-atc__verdict:focus-visible { box-shadow: 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-atc__result[data-valid="true"] .ui-atc__verdict { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-atc__result[data-valid="false"] .ui-atc__verdict { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-atc__verdict-icon { display: grid; flex: none; place-items: center; }
.ui-atc__verdict-svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; animation: ui-atc-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-atc__verdict-svg { stroke-width: 1.4; }
.ui-atc__verdict-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-atc__verdict-title { font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-relaxed); }
:where([data-look="standard"], [data-look="standard"] *).ui-atc__verdict-title { font-weight: var(--tc-font-weight-semibold); }
:where([data-look="clean"], [data-look="clean"] *).ui-atc__verdict-title { font-weight: var(--tc-font-weight-medium); }
.ui-atc__verdict-name { overflow: hidden; color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-atc__facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--tc-space-2) var(--tc-space-4); padding: 0 var(--tc-space-1); }
.ui-atc__fact { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-atc__fact[data-wide] { grid-column: 1 / -1; }
.ui-atc__fact dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
.ui-atc__fact dd { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; color: var(--tc-text-primary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-atc__hash-value { overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; }
.ui-atc__copy { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-atc__copy:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-atc__checks { display: grid; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-atc__check { display: grid; grid-template-columns: 20px minmax(0, 1fr); align-items: start; column-gap: var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-1); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-atc__check-icon { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; }
.ui-atc__check-icon .ui-atc__glyph { width: 12px; height: 12px; stroke-width: 2.4; }
.ui-atc__check[data-status="pass"] .ui-atc__check-icon { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-atc__check[data-status="fail"] .ui-atc__check-icon { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-atc__check[data-status="skip"] .ui-atc__check-icon { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-atc__check-main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-atc__check-label { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-atc__check-detail { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-atc__check[data-status="fail"] .ui-atc__check-detail { color: var(--tc-status-danger-fg); }
.ui-atc__items { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-atc__item { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-atc__reasons { display: grid; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-1); }
.ui-atc__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-atc__reasons ul { display: grid; gap: var(--tc-space-1); }
.ui-atc__reasons li { position: relative; padding-left: var(--tc-space-3-5); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-atc__reasons li::before { content: ""; position: absolute; top: 7px; left: 2px; width: 5px; height: 5px; border-radius: 50%; background: var(--tc-status-danger-solid); }
/* ----- Foot ----- */
.ui-atc__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 48px; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-atc__local { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-atc__foot .ui-atc__btn { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); }
@keyframes ui-atc-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-atc-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-atc-spin { to { transform: rotate(360deg); } }
@media (forced-colors: active) {
  .ui-atc__verdict, .ui-atc__check-icon, .ui-atc__problem { border: 1px solid CanvasText; }
  .ui-atc__btn { border: 1px solid ButtonText; }
}
@media (pointer: coarse) {
  .ui-atc__copy { width: var(--tc-control-h-md); height: var(--tc-control-h-md); }
}
@container ui-atc (max-width: 360px) {
  .ui-atc__hash-row { flex-direction: column; }
  .ui-atc__field { flex: none; }
  .ui-atc__body { padding: var(--tc-space-2-5); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="atc"] *, [data-ui="atc"] *::before, [data-ui="atc"] *::after { animation: none !important; transition: none !important; }
  .ui-atc__spin { animation: none !important; }
}
`;
}

if (!customElements.get("tc-attestation-check")) customElements.define("tc-attestation-check", TcAttestationCheck);

declare global {
  interface HTMLElementTagNameMap {
    "tc-attestation-check": TcAttestationCheck;
  }
}
