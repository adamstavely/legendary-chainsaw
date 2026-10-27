import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { AriaForwardController } from "./internal/controllers";

/*
 * <tc-otp-input> – the Lit port of src/components/otp-input.tsx: the verification code field.
 * One real input sits under the boxes, so typing, Backspace, paste and the SMS autofill of iOS and Android all work
 * natively; the boxes only draw what it holds. The focus ring glides from box to box with a soft blinking caret,
 * digits pop in, a pasted code fills the boxes one after another. Verifying shimmers, a wrong code shakes and clears
 * for retyping, a right one folds the boxes into a single "Verified" pill. A resend link counts down below.
 * Clean has white cells with hairline shadows, a thin blue focus outline and a tab-style "Resend code" button.
 *
 *   <form><tc-otp-input name="code" required separator></tc-otp-input></form>
 *
 * A form control (form-associated): the code is submitted under `name`, `required` blocks an empty submit, a form
 * reset restores the first value, a disabled fieldset disables it, and a page <label for> names its input.
 * `value` changes as the user types unless a tc-value-change listener calls preventDefault(). `onComplete` runs once
 * the last box is filled and may return a promise: without `status` the field then follows it (verifying → success
 * or error); its signal aborts when the field is removed.
 */

export type OtpStatus = "idle" | "verifying" | "error" | "success";
export type OtpValueChange = { value: string };
export type OtpCompleteHandler = (code: string, options: { signal: AbortSignal }) => void | Promise<unknown>;

/** "0:24" */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** When each character arrived (so it pops in once) and its delay (pasted codes arrive one after another) */
type Arrivals = { code: string; stamps: number[]; delays: number[]; counter: number };
function arrive(prev: Arrivals, code: string): Arrivals {
  const changed = [...code].map((c, i) => c !== prev.code[i]);
  const first = changed.indexOf(true);
  const bulk = changed.filter(Boolean).length > 1;
  const stamps = [...prev.stamps];
  const delays = [...prev.delays];
  let counter = prev.counter;
  changed.forEach((ch, i) => {
    if (!ch) return;
    stamps[i] = ++counter;
    delays[i] = bulk ? (i - first) * 45 : 0;
  });
  return { code, stamps, delays, counter };
}

const icons = {
  check: "M5.5 12.5l4 4L18.5 8",
  alert: "M12 8v4.5M12 16h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

/** Puts the ring on a box: every read first, then the writes */
function placeRing(r: HTMLElement, box: HTMLElement) {
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  const x = box.offsetLeft;
  const y = box.offsetTop;
  r.style.width = `${w}px`;
  r.style.height = `${h}px`;
  r.style.transform = `translate(${x}px, ${y}px)`;
}

/** A boolean that is on by default: the attribute turns it off with "false" */
const onByDefault = { fromAttribute: (v: string | null) => v !== "false", toAttribute: (v: boolean) => (v ? null : "false") };
/** `separator`: the bare attribute puts it in the middle, a number after that many boxes */
const separatorConverter = { fromAttribute: (v: string | null) => (v === null ? false : v === "" || isNaN(Number(v)) ? true : Number(v)) };

let instances = 0;

/**
 * A one-time-code field: one box per character, a gliding focus ring, verify / error / success states and a resend
 * countdown.
 * @tag tc-otp-input
 * @fires tc-value-change - The user changed the code ({ value }: OtpValueChange); cancelable
 * @fires tc-resend - "Resend code" was pressed (shown when `resendable`)
 */
export class TcOtpInput extends TcElement {
  static override ui = "otp";
  static formAssociated = true;

  /** Number of boxes */
  @property({ type: Number }) accessor length = 6;
  /** A small dash between the boxes – `true` puts it in the middle, a number after that many boxes */
  @property({ converter: separatorConverter }) accessor separator: boolean | number = false;
  /** Digits only (numeric keyboard on phones); `false` (numeric="false") allows letters too, shown in capitals */
  @property({ converter: onByDefault }) accessor numeric = true;
  /** The code. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property() accessor value = "";
  /** Called once the last box is filled – typed, pasted or autofilled. May return a promise (the check) */
  @property({ attribute: false }) accessor onComplete: OtpCompleteHandler | undefined = undefined;
  /** The check's state. Unset, it follows the promise `onComplete` returns */
  @property() accessor status: OtpStatus | undefined = undefined;
  /** Shown below the boxes while the status is "error": text, or an element (cloned) */
  @property({ attribute: "error-message", converter: { fromAttribute: (v: string | null) => v ?? "" } }) accessor errorMessage: string | Element = "That code didn't work. Try again.";
  /** Clears the boxes shortly after an error, ready for the next try (clear-on-error="false" keeps them) */
  @property({ attribute: "clear-on-error", converter: onByDefault }) accessor clearOnError = true;
  /** Text in the pill after a successful check */
  @property({ attribute: "success-label" }) accessor successLabel = "Verified";
  /** Shows "Resend code" below the boxes once the countdown is over (fires tc-resend) */
  @property({ type: Boolean }) accessor resendable = false;
  /** Seconds until the code can be resent */
  @property({ type: Number, attribute: "resend-in" }) accessor resendIn = 30;
  /** Center the boxes and the lines below them */
  @property() accessor align: "start" | "center" = "start";
  /** Turns the field off: no typing or resending, and the code isn't submitted with the form */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Name for form submission – the code is submitted under it */
  @property({ reflect: true }) accessor name = "";
  /** A form needs a code before it submits */
  @property({ type: Boolean, reflect: true }) accessor required = false;
  /** Focus the input when the field first renders */
  @property({ type: Boolean, attribute: "auto-focus" }) accessor autoFocus = false;
  /** Accessible name of the field (used when there's no `labelledBy` and no page <label for>) */
  @property() accessor label = "Verification code";
  /** Id of a visible label (a heading or <label>) that names the field – preferred over `label` (WCAG 2.5.3, 3.3.2) */
  @property({ attribute: "labelled-by" }) accessor labelledBy = "";

  /** @internal The check's state when `status` is unset */
  @state() accessor ownStatus: OtpStatus = "idle";
  /** @internal What an IME is composing – the code only changes once it's done */
  @state() accessor composing: string | null = null;
  /** @internal The box the next character goes into */
  @state() accessor idx = 0;
  /** @internal */
  @state() accessor focused = false;
  /** @internal The live region's text */
  @state() accessor announce = "";
  /** @internal The error message is showing */
  @state() accessor errorShown = false;
  /** @internal The wrong code fades out */
  @state() accessor clearing = false;
  /** @internal No typing between the shake and the clearing */
  @state() accessor locked = false;
  /** @internal The resend countdown: the seconds it started from (0: none running), and which one it is */
  @state() accessor run = { from: 0, n: 0 };
  /** @internal A fieldset around it is disabled */
  @state() accessor formDisabled = false;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-otp${++instances}`;
  private arrivals: Arrivals = { code: "", stamps: [], delays: [], counter: 0 };
  private initialValue: string | null = null;
  private prevStatus: OtpStatus | null = null;
  private statusTimers: number[] = [];
  private countdown = 0;
  private checks = new Set<AbortController>();
  private ro?: ResizeObserver;
  private ringReady = false;
  private labelIds: string[] = [];

  constructor() {
    super();
    this.internals = this.attachInternals();
    new AriaForwardController(this, () => this.input);
    // A page <label for> clicks the element: the input takes the focus
    this.addEventListener("click", (e) => {
      if (e.target === this) this.input?.focus();
    });
  }

  private get input() {
    return this.querySelector<HTMLInputElement>(".ui-otp__input");
  }
  private get slots() {
    return this.querySelector<HTMLElement>(".ui-otp__slots");
  }
  override focus(options?: FocusOptions) {
    this.input?.focus(options);
  }

  /* ---------- Derived ---------- */

  /** Keeps allowed characters only – spaces and dashes of a pasted "482 913" fall away; full-width digits from an IME
   *  ("１２３") become plain ones */
  private clean(text: string) {
    let out = "";
    for (const raw of text) {
      const ch = raw.normalize("NFKC");
      const c = this.numeric ? (/[0-9]/.test(ch) ? ch : "") : /[a-z0-9]/i.test(ch) ? ch.toUpperCase() : "";
      if (c && out.length < this.length) out += c;
    }
    return out;
  }
  private get code() {
    return this.clean(this.value ?? "");
  }
  /** The check's state: `status` when set, else driven by the promise onComplete returns */
  private get current(): OtpStatus {
    return this.status ?? this.ownStatus;
  }
  /** An outside change of the value (or a shorter code) keeps the active box in reach */
  private get active() {
    return Math.min(this.idx, this.code.length, this.length - 1);
  }
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  private get busy() {
    return this.current === "verifying" || this.current === "success";
  }
  private get readOnly() {
    return this.busy || this.locked || this.isDisabled;
  }
  private get sepAt() {
    return this.separator === true ? Math.floor(this.length / 2) : typeof this.separator === "number" ? this.separator : 0;
  }

  /* ---------- Lifecycle ---------- */

  override connectedCallback() {
    super.connectedCallback();
    // Reconnected: the countdown starts over
    if (this.hasUpdated) this.restartCountdown(true);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.statusTimers.forEach((t) => window.clearTimeout(t));
    this.statusTimers = [];
    window.clearTimeout(this.countdown);
    this.countdown = 0;
    // A check still running when the field is removed is aborted, and never sets state afterwards
    this.checks.forEach((c) => c.abort());
    this.checks.clear();
    this.ro?.disconnect();
    this.ro = undefined;
  }

  formResetCallback() {
    this.checks.forEach((check) => check.abort());
    this.checks.clear();
    this.value = this.initialValue ?? "";
    this.idx = 0;
    this.ownStatus = "idle";
    this.errorShown = false;
  }
  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.initialValue === null) this.initialValue = this.code;
    if (!this.hasUpdated) this.run = { from: this.resendIn, n: 0 };
    const code = this.code;
    if (this.arrivals.code !== code) this.arrivals = arrive(this.arrivals, code);
    this.statusFlow();
    // A page <label for> names the input (light DOM, so the ids connect)
    const labels = [...((this.internals.labels as NodeListOf<HTMLLabelElement> | undefined) ?? [])];
    labels.forEach((l, i) => (l.id ||= `${this.uid}-for${i}`));
    this.labelIds = labels.map((l) => l.id);
    const showError = this.current === "error" && this.errorShown;
    this.dataset.status = this.current;
    this.dataset.align = this.align;
    this.toggleAttribute("data-error", showError);
    this.toggleAttribute("data-disabled", this.isDisabled);
  }

  protected override firstUpdated() {
    // SMS autofill, no autocorrect, "done" on the phone keyboard (set here: the template analyzer doesn't know them)
    const input = this.input;
    input?.setAttribute("autocomplete", "one-time-code");
    input?.setAttribute("autocorrect", "off");
    input?.setAttribute("enterkeyhint", "done");
    this.restartCountdown(false, true);
    if (this.autoFocus) this.input?.focus({ preventScroll: true });
    const slots = this.slots;
    if (slots && typeof ResizeObserver === "function") {
      // Phones turning, containers resizing: ring and pill follow
      this.ro = new ResizeObserver(() => this.placeRingAndPill(false));
      this.ro.observe(slots);
    }
  }

  protected override updated() {
    this.syncForm();
    this.placeRingAndPill(true);
    this.syncSelection();
  }

  /** The form gets the code under `name`; `required` is checked by the browser, pointing at the input */
  private syncForm() {
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? this.code : null);
    if (this.required && !disabled && !this.code) this.internals.setValidity({ valueMissing: true }, "Enter the code.", this.input ?? undefined);
    else this.internals.setValidity({});
  }

  /* ---------- Status ---------- */

  /** The same message twice (a second wrong code) is still a change for screen readers */
  private say(text: string) {
    this.announce = this.announce === text ? `${text} ` : text;
  }

  /**
   * What a new status sets off: the announcement, and for an error a shake, then the wrong code fades out and clears
   * (unless clearOnError is false). A new status cancels an error still fading out.
   */
  private statusFlow() {
    const status = this.current;
    const before = this.prevStatus;
    this.prevStatus = status;
    if (before === null || status === before) return;
    // A new status cancels an error still fading out – a quick retry mustn't have its code wiped mid-verification
    this.statusTimers.forEach((t) => window.clearTimeout(t));
    this.statusTimers = [];
    this.clearing = false;
    this.locked = false;
    if (status === "verifying") this.say("Verifying code");
    if (status === "success") this.say(this.successLabel);
    if (status !== "error") {
      this.errorShown = false;
      return;
    }
    this.errorShown = true;
    this.say(typeof this.errorMessage === "string" ? this.errorMessage : "That code didn't work");
    // A calm shake, then the wrong code fades out so the next try starts fresh
    const slots = this.slots;
    if (!reducedMotion() && typeof slots?.animate === "function") {
      slots.animate(
        [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
        { duration: 420, easing: "ease-out" },
      );
    }
    if (!this.clearOnError) return;
    this.locked = true;
    this.statusTimers.push(
      window.setTimeout(() => (this.clearing = true), 700),
      window.setTimeout(() => {
        this.clearing = false;
        this.locked = false;
        this.commit("", 0, false);
      }, 980),
    );
  }

  private complete(next: string) {
    const controller = new AbortController();
    const result = this.onComplete?.(next, { signal: controller.signal });
    if (!(result instanceof Promise) || this.status !== undefined) return;
    this.checks.add(controller);
    this.ownStatus = "verifying";
    result.then(
      () => this.checks.delete(controller) && (this.ownStatus = "success"),
      () => this.checks.delete(controller) && (this.ownStatus = "error"),
    );
  }

  private commit(next: string, nextIdx: number, user = true) {
    const code = this.code;
    if (next !== code) {
      if (this.emit<OtpValueChange>("tc-value-change", { value: next }, { cancelable: true })) this.value = next;
      // Controlled: the input shows the app's value until it passes the new one
      else this.requestUpdate();
    }
    this.idx = Math.max(0, Math.min(nextIdx, next.length, this.length - 1));
    if (!user) return;
    if (this.errorShown && next.length) this.errorShown = false;
    if (this.ownStatus === "error" && next.length) this.ownStatus = "idle";
    if (next.length === this.length && next !== code) this.complete(next);
  }

  /* ---------- Native input ---------- */

  private onInput(el: HTMLInputElement) {
    if (this.readOnly) return;
    const raw = el.value;
    const caretRaw = el.selectionStart ?? raw.length;
    const next = this.clean(raw);
    // The caret counts the kept characters in front of it
    const caret = this.clean(raw.slice(0, caretRaw)).length;
    if (next === this.code) {
      el.value = this.code;
      this.syncSelection();
      return;
    }
    this.commit(next, caret);
  }

  private onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    if (this.readOnly) return;
    const text = this.clean(e.clipboardData?.getData("text") ?? "");
    if (!text) return;
    const code = this.code;
    const active = this.active;
    // A whole code replaces everything; a part is written from the active box on
    if (text.length >= this.length) return this.commit(text.slice(0, this.length), this.length - 1);
    const next = (code.slice(0, active) + text + code.slice(active + text.length)).slice(0, this.length);
    this.commit(next, active + text.length);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing || this.composing !== null) return;
    const active = this.active;
    const last = Math.min(this.code.length, this.length - 1);
    const moves: Record<string, number> = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: last, ArrowUp: 0, ArrowDown: last };
    if (e.key in moves && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      this.idx = Math.max(0, Math.min(moves[e.key], last));
    }
  };

  /** A tap or click picks the box under the pointer – never beyond the first empty one */
  private pick(x: number) {
    const boxes = [...this.querySelectorAll<HTMLElement>(".ui-otp__box")];
    let i = boxes.findIndex((b) => x < b.getBoundingClientRect().right + 4);
    if (i < 0) i = this.length - 1;
    this.idx = Math.min(i, this.code.length, this.length - 1);
    requestAnimationFrame(this.syncSelection);
  }

  /** The real input selects the active character, so typing replaces it and Backspace removes it */
  private syncSelection = () => {
    const el = this.input;
    if (!el || document.activeElement !== el || this.composing !== null) return;
    const i = this.active;
    if (i < this.code.length) el.setSelectionRange(i, i + 1);
    else el.setSelectionRange(i, i);
  };

  /* ---------- The gliding ring and the success pill ---------- */

  /** The ring glides to the active box; the success pill starts as wide as all the boxes and morphs down to its label */
  private placeRingAndPill(withPill: boolean) {
    const r = this.querySelector<HTMLElement>(".ui-otp__ring");
    const box = this.querySelectorAll<HTMLElement>(".ui-otp__box")[this.active];
    if (r && box) {
      const first = !this.ringReady;
      if (first) r.style.transition = "none";
      placeRing(r, box);
      if (first) {
        this.ringReady = true;
        void r.offsetWidth;
        r.style.transition = "";
      }
    }
    const p = this.querySelector<HTMLElement>(".ui-otp__pill");
    const inner = this.querySelector<HTMLElement>(".ui-otp__pill-inner");
    const s = this.slots;
    if (!p || !s || !inner) return;
    if (this.current === "success") {
      if (withPill) p.style.width = `${inner.offsetWidth}px`;
    } else p.style.width = `${s.offsetWidth}px`;
  }

  /* ---------- Resend countdown ---------- */

  /** Counts the seconds down in the time's text; renders only when a countdown starts over and when it ends */
  private restartCountdown(fresh: boolean, initial = false) {
    window.clearTimeout(this.countdown);
    this.countdown = 0;
    if (!initial) this.run = { from: this.resendIn, n: this.run.n + (fresh ? 1 : 0) };
    let left = this.run.from;
    if (left <= 0) {
      if (this.resendable && this.resendIn > 0) this.say("You can resend the code now");
      return;
    }
    const tick = () => {
      left -= 1;
      if (left <= 0) {
        this.countdown = 0;
        this.run = { from: 0, n: this.run.n };
        if (this.resendable && this.resendIn > 0) this.say("You can resend the code now");
        return;
      }
      const text = [...(this.querySelector(".ui-otp__time")?.childNodes ?? [])].find((n) => n.nodeType === Node.TEXT_NODE);
      if (text) text.nodeValue = clock(left);
      this.countdown = window.setTimeout(tick, 1000);
    };
    this.countdown = window.setTimeout(tick, 1000);
  }

  private resend() {
    this.emit("tc-resend", null);
    this.restartCountdown(true);
    this.say("A new code is on its way");
  }

  /* ---------- Render ---------- */

  private boxes() {
    const code = this.code;
    const sepAt = this.sepAt;
    const cells = [];
    for (let i = 0; i < this.length; i++) {
      if (sepAt > 0 && sepAt < this.length && i === sepAt) cells.push(html`<span class="ui-otp__sep"></span>`);
      const ch = code[i];
      cells.push(
        html`<span class="ui-otp__box" ?data-filled=${!!ch} style=${styleMap({ "--i": String(i) })}>${ch
          ? keyed(this.arrivals.stamps[i], html`<span class="ui-otp__char" style=${styleMap({ animationDelay: `${this.arrivals.delays[i] ?? 0}ms` })}>${ch}</span>`)
          : nothing}</span>`,
      );
    }
    return cells;
  }

  protected override render() {
    const look = this.resolvedLook;
    const code = this.code;
    const status = this.current;
    const active = this.active;
    const sepAt = this.sepAt;
    const busy = this.busy;
    const disabled = this.isDisabled;
    const showError = status === "error" && this.errorShown;
    // The ring shows where the next character goes: while focused, or mid-way through a code
    const showRing = !busy && !disabled && (this.focused || (code.length > 0 && code.length < this.length));
    const count = `${this.length} ${this.numeric ? "digits" : "characters"}`;
    const namedBy = this.labelledBy ? [this.labelledBy] : this.labelIds;
    const waiting = this.run.from > 0;
    const msg = this.errorMessage;
    return html`
      <div class="ui-otp__field">
        <div
          class="ui-otp__slots"
          ?data-clearing=${this.clearing}
          style=${styleMap({ "--n": String(this.length), "--sep-w": sepAt > 0 && sepAt < this.length ? `calc(var(--tc-otp-input-gap) + ${look === "clean" ? 8 : 10}px)` : "0px" })}
        >
          ${this.boxes()}
          <span class="ui-otp__ring" ?data-show=${showRing} aria-hidden="true">
            <span class="ui-otp__caret" ?data-show=${this.focused && !code[active] && !this.readOnly}></span>
          </span>
          <span class="ui-otp__pill" aria-hidden="true">
            <span class="ui-otp__pill-inner">
              <svg viewBox="0 0 24 24" class="ui-otp__check" aria-hidden="true">${svg`<path d=${icons.check} pathLength="1"></path>`}</svg>
              ${this.successLabel}
            </span>
          </span>
          <input
            class="ui-otp__input"
            type="text"
            ?required=${this.required}
            .value=${live(this.composing ?? code)}
            inputmode=${this.numeric ? "numeric" : "text"}
            pattern=${ifDefined(this.numeric ? "[0-9]*" : undefined)}
            autocapitalize=${this.numeric ? "off" : "characters"}
            spellcheck="false"
            aria-label=${ifDefined(namedBy.length ? undefined : `${this.label}, ${count}`)}
            aria-labelledby=${ifDefined(namedBy.length ? `${namedBy.join(" ")} ${this.uid}-count` : undefined)}
            aria-invalid=${ifDefined(showError ? "true" : undefined)}
            aria-describedby=${ifDefined(showError ? `${this.uid}-msg` : undefined)}
            ?disabled=${disabled}
            ?readonly=${busy || this.locked}
            @input=${(e: InputEvent) => {
              const el = e.currentTarget as HTMLInputElement;
              // Mid-composition the IME owns the text: show it as it is, take it once composing ends
              if (this.composing !== null || e.isComposing) this.composing = el.value;
              else this.onInput(el);
            }}
            @compositionstart=${(e: CompositionEvent) => (this.composing = (e.currentTarget as HTMLInputElement).value)}
            @compositionend=${(e: CompositionEvent) => {
              this.composing = null;
              this.onInput(e.currentTarget as HTMLInputElement);
            }}
            @paste=${this.onPaste}
            @keydown=${this.onKeyDown}
            @focus=${() => {
              this.focused = true;
              requestAnimationFrame(this.syncSelection);
            }}
            @blur=${() => (this.focused = false)}
            @pointerup=${(e: PointerEvent) => this.pick(e.clientX)}
            @select=${(e: Event) => {
              // A native caret move (long press, mouse drag) snaps back to a single box
              const el = e.currentTarget as HTMLInputElement;
              const want = this.active < this.code.length ? [this.active, this.active + 1] : [this.active, this.active];
              if (el.selectionStart !== want[0] || el.selectionEnd !== want[1]) this.syncSelection();
            }}
          />
        </div>
      </div>

      <div class="ui-otp__msg" ?data-show=${showError}>
        <div class="ui-otp__msg-inner">
          <p id=${`${this.uid}-msg`} class="ui-otp__msg-text">
            <svg viewBox="0 0 24 24" class="ui-otp__alert" aria-hidden="true">${svg`<path d=${icons.alert}></path>`}</svg>
            <span>${typeof msg === "string" ? msg : msg.cloneNode(true)}</span>
          </p>
        </div>
      </div>

      ${this.resendable
        ? html`<div class="ui-otp__resend" ?data-hidden=${status === "success"}>
            <span class="ui-otp__resend-q">Didn't get a code?</span>
            ${waiting
              ? keyed(this.run.n, html`<span class="ui-otp__swap ui-otp__wait">Resend in <span class="ui-otp__time">${clock(this.run.from)}</span></span>`)
              : html`<button type="button" class="ui-otp__swap ui-otp__resend-btn" ?disabled=${disabled || busy} @click=${() => this.resend()}>Resend code</button>`}
          </div>`
        : nothing}
      ${namedBy.length ? html`<span id=${`${this.uid}-count`} class="ui-otp__live">${count}</span>` : nothing}
      <span class="ui-otp__live" aria-live="polite">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
/* Colors, size and motion as variables – override them on [data-ui="otp"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="otp"] {
  --tc-otp-input-box-size: 48px;
  --tc-otp-input-gap: 8px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  justify-self: stretch; /* it sizes the boxes from its own width, so it must never shrink to fit them */
  width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors, size and motion as variables – override them on [data-ui="otp"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="otp"] {
  --tc-otp-input-box-size: 40px;
  --tc-otp-input-gap: 8px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  justify-self: stretch; /* it sizes the boxes from its own width, so it must never shrink to fit them */
  width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="otp"] *, [data-ui="otp"] *::before, [data-ui="otp"] *::after { box-sizing: border-box; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="otp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="otp"][data-align="center"] { justify-items: center; text-align: center; }
[data-ui="otp"][data-disabled] { opacity: 0.55; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__field { display: flex; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__field { display: flex; min-width: 0; padding: var(--tc-space-1) 0; }
[data-ui="otp"][data-align="center"] .ui-otp__field { justify-content: center; }
/* The boxes scale down to fit their container (phones at 320px), up to --tc-otp-input-box-size */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__slots {
  --size: min(var(--tc-otp-input-box-size), calc((100cqi - (var(--n) - 1) * var(--tc-otp-input-gap) - var(--sep-w)) / var(--n)));
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--tc-otp-input-gap);
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__box {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: var(--size);
  height: calc(var(--size) * 1.18);
  overflow: hidden;
  border-radius: calc(var(--size) * 0.24);
  background: var(--tc-fill-subtle);
  box-shadow: var(--tc-field-shadow);
  font-size: calc(var(--size) * 0.46);
  font-weight: var(--tc-font-weight-medium);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-primary);
  transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__box[data-filled] { background: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__sep { flex: none; width: 10px; height: 2px; border-radius: var(--tc-radius-2xs); background: var(--tc-text-disabled); transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
/* The cells scale down to fit their container (phones at 320px), up to --tc-otp-input-box-size */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__slots {
  --size: min(var(--tc-otp-input-box-size), calc((100cqi - 6px - (var(--n) - 1) * var(--tc-otp-input-gap) - var(--sep-w)) / var(--n)));
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--tc-otp-input-gap);
}
/* White cells with the field edge (≥ 3:1 – the hairline shadow was ~1.2:1) */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__box {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: var(--size);
  height: calc(var(--size) * 1.1);
  overflow: hidden;
  border-radius: calc(var(--size) * 0.2);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-field-shadow);
  font-size: min(15px, calc(var(--size) * 0.375));
  line-height: var(--tc-line-height-loose);
  font-weight: var(--tc-font-weight-medium);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-primary);
  transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__sep { flex: none; width: 8px; height: 1px; border-radius: var(--tc-radius-2xs); background: var(--tc-text-disabled); transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
/* Digits pop in – a small lift out of a blur, no bounce */
.ui-otp__char { display: block; animation: ui-otp-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-otp__slots[data-clearing] .ui-otp__char { animation: ui-otp-out var(--tc-duration-moderate) var(--tc-ease-standard) both; animation-delay: calc((var(--n) - var(--i)) * 22ms) !important; }
/* One ring glides from box to box; its caret blinks softly in an empty box */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  border-radius: calc(var(--size) * 0.24);
  box-shadow: inset 0 0 0 1.5px var(--tc-text-primary), 0 0 0 4px var(--tc-fill-default);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move), width var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
/* One blue outline glides from cell to cell; its thin caret blinks softly in an empty cell */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  border-radius: calc(var(--size) * 0.2);
  box-shadow: 0 0 0 0.5px var(--tc-accent), 0 0 0 2px var(--tc-focus-ring);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move), width var(--tc-duration-moderate) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-otp__ring[data-show] { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__caret { width: 1.5px; height: 40%; border-radius: var(--tc-radius-2xs); background: var(--tc-text-primary); opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__caret { width: 1px; height: 18px; max-height: 42%; border-radius: var(--tc-radius-2xs); background: var(--tc-accent); opacity: 0; }
/* The caret blinks a few times, then stays (WCAG 2.2.2) */
.ui-otp__caret[data-show] { animation: ui-otp-blink 1.1s var(--tc-ease-in-out) 4; }
/* The real input lies over the boxes, invisible – it takes taps, keys, paste and SMS autofill */
.ui-otp__input {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: transparent;
  -webkit-text-fill-color: transparent;
  caret-color: transparent;
  font-size: var(--tc-font-size-xl); /* iOS doesn't zoom into inputs of 16px and up */
  letter-spacing: -1em;
  cursor: text;
  appearance: none;
}
.ui-otp__input::selection { background: transparent; }
.ui-otp__input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px transparent inset; transition: background-color 9999s; }
.ui-otp__input[readonly], .ui-otp__input:disabled { cursor: default; }
/* Keyboard focus is shown by the ring – a thin outline joins it for keyboard users */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__slots:has(.ui-otp__input:focus-visible) .ui-otp__ring { box-shadow: inset 0 0 0 1.5px var(--tc-text-primary), 0 0 0 4px var(--tc-fill-default), 0 0 0 6px var(--tc-focus-ring); }
/* While verifying (and once verified) the ring is gone but the input still has focus – the field shows it (WCAG 2.4.7) */
[data-ui="otp"]:is([data-status="verifying"], [data-status="success"]) .ui-otp__slots:has(.ui-otp__input:focus-visible) { outline: var(--tc-focus-outline); outline-offset: 4px; border-radius: var(--tc-radius-md); }
/* Verifying: a soft light passes over the boxes, one after another */
.ui-otp__box::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 20%, var(--tc-shimmer) 50%, transparent 80%);
  transform: translateX(-120%);
  opacity: 0;
  pointer-events: none;
}
[data-ui="otp"][data-status="verifying"] .ui-otp__box::after { opacity: 1; animation: ui-otp-shimmer 1.3s var(--tc-ease-in-out) infinite; animation-delay: calc(var(--i) * 70ms); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="otp"][data-status="verifying"] .ui-otp__box { background: var(--tc-fill-default); box-shadow: inset 0 0 0 1px var(--tc-border-default); color: var(--tc-text-secondary); }
/* Error: only the borders turn red */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="otp"][data-error] .ui-otp__box { box-shadow: inset 0 0 0 1px var(--tc-status-danger-border); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="otp"][data-error] .ui-otp__ring { box-shadow: inset 0 0 0 1.5px var(--tc-status-danger-solid), 0 0 0 4px var(--tc-status-danger-bg); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="otp"][data-error] .ui-otp__caret { background: var(--tc-status-danger-solid); }
/* Success: the boxes slide together and fade while one frame morphs into the "Verified" pill */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__pill {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  height: calc(var(--size) * 1.18);
  overflow: hidden;
  border-radius: calc(var(--size) * 0.24);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1px var(--tc-border-strong);
  opacity: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move), border-radius var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard) var(--tc-duration-fast);
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__pill-inner {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  padding: 0 var(--tc-space-4) 0 var(--tc-space-3);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  color: var(--tc-text-primary);
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__check { flex: none; width: 17px; height: 17px; fill: none; stroke: var(--tc-status-success-solid); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="otp"][data-status="verifying"] .ui-otp__box { background: var(--tc-fill-subtle); box-shadow: 0 0 0 0.5px var(--tc-border-default); color: var(--tc-text-secondary); }
/* Error: no red strokes – the cells get a faint red fill and the digits turn red */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="otp"][data-error] .ui-otp__box { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* Success: the cells slide together and fade while one frame morphs into the "Verified" chip */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__pill {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  height: calc(var(--size) * 1.1);
  overflow: hidden;
  border-radius: calc(var(--size) * 0.2);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  opacity: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width var(--tc-duration-slow) var(--tc-ease-move), background-color var(--tc-duration-slow) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard) var(--tc-duration-fast);
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__pill-inner {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  padding: 0 var(--tc-space-3-5) 0 var(--tc-space-3);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  color: var(--tc-text-primary);
  opacity: 0;
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__check { width: 16px; height: 16px; flex: none; fill: none; stroke: var(--tc-status-success-solid); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-otp__check path { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset var(--tc-duration-quick) var(--tc-ease-standard); }
[data-ui="otp"][data-status="success"] .ui-otp__box {
  transform: translateX(calc(((var(--n) - 1) / 2 - var(--i)) * (var(--size) + var(--tc-otp-input-gap)))) scale(0.7);
  opacity: 0;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard) var(--tc-duration-quick);
}
[data-ui="otp"][data-status="success"] .ui-otp__sep { opacity: 0; }
/* The pill settles at a compact height, not the height of the boxes */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="otp"][data-status="success"] .ui-otp__pill {
  height: 36px;
  border-radius: var(--tc-radius-full);
  opacity: 1;
  transition: width var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-base), height var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-base), border-radius var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-base), opacity var(--tc-duration-fast) var(--tc-ease-standard) var(--tc-duration-quick);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="otp"][data-status="success"] .ui-otp__pill {
  background: var(--tc-status-success-bg);
  opacity: 1;
  transition: width var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-base), background-color var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-slow), opacity var(--tc-duration-fast) var(--tc-ease-standard) var(--tc-duration-quick);
}
[data-ui="otp"][data-status="success"] .ui-otp__pill-inner { opacity: 1; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard) var(--tc-duration-slower); }
[data-ui="otp"][data-status="success"] .ui-otp__check path { stroke-dashoffset: 0; transition: stroke-dashoffset var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-slowest); }
/* The error message grows in below, then folds away */
.ui-otp__msg { display: grid; grid-template-rows: 0fr; width: 100%; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move); }
.ui-otp__msg[data-show] { grid-template-rows: 1fr; }
.ui-otp__msg-inner { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__msg-text {
  margin: 0;
  padding-top: var(--tc-space-2-5);
  font-size: var(--tc-font-size-md);
  text-wrap: balance;
  color: var(--tc-text-secondary);
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__msg-text {
  margin: 0;
  padding-top: var(--tc-space-2);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  text-wrap: balance;
  color: var(--tc-text-secondary);
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-otp__msg[data-show] .ui-otp__msg-text { opacity: 1; transform: none; transition-delay: 60ms; }
/* The icon sits inline, so a wrapped message stays centered with it */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__alert { display: inline-block; width: 15px; height: 15px; margin-right: var(--tc-space-1-5); vertical-align: -3px; fill: none; stroke: var(--tc-status-danger-solid); stroke-width: 2; stroke-linecap: round; }
/* Resend: a countdown that turns into a button */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend { margin-top: var(--tc-space-3-5); font-size: var(--tc-font-size-md); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
/* The icon sits inline, so a wrapped message stays centered with it */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__alert { display: inline-block; width: 14px; height: 14px; margin-right: var(--tc-space-1-5); vertical-align: -3px; fill: none; stroke: var(--tc-status-danger-fg); stroke-width: 1.7; stroke-linecap: round; }
/* Resend: a countdown that turns into a tab-style button */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1) var(--tc-space-2);
  min-height: 28px;
  margin-top: var(--tc-space-3);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="otp"][data-align="center"] .ui-otp__resend { justify-content: center; }
.ui-otp__resend[data-hidden] { opacity: 0; visibility: hidden; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), visibility 0s var(--tc-duration-base); }
.ui-otp__swap { display: inline-block; animation: ui-otp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-otp__wait { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__time { display: inline-block; min-width: 3.4ch; text-align: left; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn {
  position: relative;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-accent-text);
  cursor: pointer;
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn::before { content: ""; position: absolute; inset: -6px -8px; border-radius: var(--tc-radius-md); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn:hover { text-decoration: underline; text-underline-offset: 3px; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: 3px; border-radius: var(--tc-radius-xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn:disabled { color: var(--tc-text-muted); cursor: default; text-decoration: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__time { display: inline-block; min-width: 3.4ch; text-align: left; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn {
  position: relative;
  padding: var(--tc-space-1) var(--tc-space-2-5);
  border-radius: var(--tc-radius-sm);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn:active { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn:disabled { color: var(--tc-text-disabled); background: none; cursor: default; }
.ui-otp__live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-otp-pop { from { opacity: 0; transform: translateY(4px) scale(0.7); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-otp-out { to { opacity: 0; transform: translateY(-4px) scale(0.8); filter: blur(2px); } }
@keyframes ui-otp-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes ui-otp-shimmer { 0% { transform: translateX(-120%); } 55%, 100% { transform: translateX(120%); } }
@keyframes ui-otp-in { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
/* Narrow containers (phones): tighter gaps, the question before "Resend" drops first */
@container (max-width: 360px) {
.ui-otp__slots { --tc-otp-input-gap: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__sep { width: 8px; }
}
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-otp__sep { width: 6px; }
}
@container (max-width: 250px) {
  .ui-otp__resend-q { display: none; }
}
/* Touch screens: a bigger target for Resend */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn::before { inset: -11px -12px; }
}
/* Touch screens: a taller Resend button */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn { padding: var(--tc-space-2) var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="otp"] *, [data-ui="otp"] *::before, [data-ui="otp"] *::after { animation: none !important; transition: none !important; }
  .ui-otp__caret[data-show] { opacity: 1; }
}
`;
}

if (!customElements.get("tc-otp-input")) customElements.define("tc-otp-input", TcOtpInput);

declare global {
  interface HTMLElementTagNameMap {
    "tc-otp-input": TcOtpInput;
  }
}
