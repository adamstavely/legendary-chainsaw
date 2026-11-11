import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-signature-pad> – a form field for signing: a pad with a baseline, an “×” and “Sign here”, where a mouse, pen or
 * finger draws ink whose width follows the speed of the stroke (and a pen's pressure). Undo takes the last stroke
 * away, Clear empties the pad. “Type instead” swaps the pad for a text field that sets the name in a script face –
 * the way to sign without a pointer, so it is always reachable from the keyboard: `allow-typed` only decides whether
 * pointer users see the toggle too (without it the toggle stays hidden until it has focus, like a skip link).
 * Below, the signer's name, the date and an optional statement of what signing means.
 *   · the ink is SVG, drawn from the stored strokes: it follows the theme, scales with the pad and survives resizes
 *   · strokes are stored normalised (0–1 across the pad) with their timing and pressure; toSVG() and toDataURL()
 *     export the signature
 *   · a form control (form-associated): the value is submitted as JSON under `name`, `required` blocks an empty
 *     submit, a form reset clears it, a disabled fieldset disables it
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-signature-pad name="signature" required signer="Noor Haddad" statement="By signing you accept…"></tc-signature-pad>
 */

/** One sample of a stroke: x and y across the pad (0–1), milliseconds since the stroke began, pressure (0–1) */
export type SignaturePoint = [x: number, y: number, t: number, p: number];
export type SignatureStroke = { points: SignaturePoint[] };
export type SignatureValue = { kind: "drawn"; strokes: SignatureStroke[]; text?: undefined } | { kind: "typed"; text: string; strokes?: undefined };
/** Detail of tc-value-change */
export type SignatureValueChange = { value: SignatureValue | null };

/** The words on the pad and its buttons; a page can rename any of them */
export const defaultSignatureLabels = {
  placeholder: "Sign here",
  undo: "Undo",
  clear: "Clear",
  typeInstead: "Type instead",
  drawInstead: "Draw instead",
  typedLabel: "Type your full name",
  signed: "Signed",
  notSigned: "Not signed yet",
  cleared: "Signature cleared",
  undone: "Last stroke removed",
  date: "Date",
};
export type SignatureLabels = typeof defaultSignatureLabels;

/** The ink's base width in px at the pad's own scale, and the pad's drawing size before it's measured */
const INK = 2.6;
const FALLBACK = { w: 480, h: 160 };
const round = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round4 = (n: number) => Math.round(n * 10000) / 10000;
const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c] ?? c);

/** A stroke's outline as one filled path: two edges offset by the width at each point, round caps at both ends */
export function strokePath(points: SignaturePoint[], w: number, h: number, base = INK): string {
  const P = points.map(([x, y]) => [x * w, y * h] as const);
  // Width: faster is thinner, harder is thicker; eased so the edge doesn't wobble
  const widths: number[] = [];
  points.forEach((pt, i) => {
    const prev = points[i - 1];
    const speed = prev ? Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]) / Math.max(1, pt[2] - prev[2]) : 0;
    const raw = base * clamp(1.3 - 0.4 * speed, 0.55, 1.3) * (0.6 + 0.8 * clamp(pt[3], 0, 1));
    widths.push(i ? widths[i - 1] * 0.6 + raw * 0.4 : raw);
  });
  const r0 = round(widths[0] / 2);
  if (P.length === 1 || P.every((p) => p[0] === P[0][0] && p[1] === P[0][1])) {
    const [x, y] = P[0];
    return `M${round(x - r0)} ${round(y)}a${r0} ${r0} 0 1 0 ${round(r0 * 2)} 0a${r0} ${r0} 0 1 0 ${round(-r0 * 2)} 0Z`;
  }
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  let nx = 0;
  let ny = -1;
  P.forEach((p, i) => {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(P.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len > 0) {
      nx = -(b[1] - a[1]) / len;
      ny = (b[0] - a[0]) / len;
    }
    const r = widths[i] / 2;
    left.push([p[0] + nx * r, p[1] + ny * r]);
    right.push([p[0] - nx * r, p[1] - ny * r]);
  });
  const pt = (q: [number, number]) => `${round(q[0])} ${round(q[1])}`;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = P.length - 1;
  const rn = round(widths[n] / 2);
  let d = `M${pt(left[0])}`;
  for (let i = 1; i < n; i++) d += `Q${pt(left[i])} ${pt(mid(left[i], left[i + 1]))}`;
  d += `L${pt(left[n])}A${rn} ${rn} 0 0 0 ${pt(right[n])}`;
  for (let i = n - 1; i > 0; i--) d += `Q${pt(right[i])} ${pt(mid(right[i], right[i - 1]))}`;
  d += `L${pt(right[0])}A${r0} ${r0} 0 0 0 ${pt(left[0])}Z`;
  return d;
}

const icon = svg`<path d="M20 19.5H9.5"/><path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>`; // Lucide "pen-line" (ISC)

let instances = 0;

/**
 * A signature field: draw with a mouse, pen or finger, or type the name instead, with undo, clear, the signer, the
 * date and a statement – a form control that exports SVG or an image.
 * @tag tc-signature-pad
 * @fires tc-value-change - The signature changed: a stroke ended, undo, clear or typing ({ value }: SignatureValueChange); cancelable – prevented, the value stays as it was
 */
export class TcSignaturePad extends TcElement {
  static override ui = "sigp";
  static formAssociated = true;

  /** The title above the pad */
  @property() accessor heading = "Signature";
  /** One line under the title: what is being signed */
  @property() accessor description: string | undefined = undefined;
  /** The signature: drawn strokes or typed text; null when empty */
  @property({ attribute: false }) accessor value: SignatureValue | null = null;
  /** Shows the “Type instead” toggle to pointer users; keyboard users can always reach it */
  @property({ type: Boolean, attribute: "allow-typed" }) accessor allowTyped = false;
  /** The signer's name, under the pad – also the suggestion when typing */
  @property() accessor signer: string | undefined = undefined;
  /** The date shown beside the name (epoch ms); by default today */
  @property({ type: Number }) accessor date: number | undefined = undefined;
  /** “Now” for today's date (epoch ms); by default the element's own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** What signing means, under the name: a short legal statement */
  @property() accessor statement: string | undefined = undefined;
  /** Blocks an empty form submit */
  @property({ type: Boolean, reflect: true }) accessor required = false;
  /** No input, the buttons disabled */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Shows the signature with no way to change it: no buttons, no drawing */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** Marks the field as wrong and shows `error-message` */
  @property({ type: Boolean, reflect: true }) accessor invalid = false;
  /** The message under the pad while `invalid` */
  @property({ attribute: "error-message" }) accessor errorMessage = "Sign to continue.";
  /** The form field's name; the value is submitted as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Words the page can rename (merged over defaultSignatureLabels) */
  @property({ attribute: false }) accessor labels: Partial<SignatureLabels> = {};
  /** The language for the date, e.g. "de"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** @internal The text field is showing instead of the pad */
  @state() accessor typing = false;
  /** @internal The pad's drawn size in px */
  @state() accessor size = FALLBACK;
  /** @internal A fieldset around it is disabled */
  @state() accessor formDisabled = false;
  /** @internal The live region's text */
  @state() accessor announce = "";
  /** @internal The element's own clock, read once when connected */
  @state() accessor clock = 0;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-sigp${++instances}`;
  private ro?: ResizeObserver;
  private drawing: { id: number; start: number; points: SignaturePoint[]; rect: DOMRect } | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  private get words(): SignatureLabels {
    return { ...defaultSignatureLabels, ...this.labels };
  }
  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  private get canSign() {
    return !this.isDisabled && !this.readonly;
  }
  private get strokes() {
    return this.value?.kind === "drawn" ? this.value.strokes : [];
  }
  private get typedText() {
    return this.value?.kind === "typed" ? this.value.text : "";
  }
  private get signed() {
    return this.value?.kind === "drawn" ? this.value.strokes.length > 0 : !!this.typedText.trim();
  }
  private get surface() {
    return this.querySelector<HTMLElement>(".ui-sigp__surface");
  }

  /* ---------- Lifecycle ---------- */

  override connectedCallback() {
    super.connectedCallback();
    this.clock = Date.now();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.drawing = null;
  }
  protected override firstUpdated() {
    this.observe();
  }
  protected override updated() {
    if (!this.ro) this.observe();
    this.syncForm();
  }
  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // A typed value arriving from the page shows the text field
    if (changed.has("value") && this.value?.kind === "typed") this.typing = true;
    this.toggleAttribute("data-signed", this.signed);
  }

  private observe() {
    const s = this.surface;
    if (!s || typeof ResizeObserver !== "function") return;
    this.ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      if (w > 0 && h > 0 && (w !== this.size.w || h !== this.size.h)) this.size = { w, h };
    });
    this.ro.observe(s);
  }

  formResetCallback() {
    this.value = null;
    this.typing = false;
  }
  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  private syncForm() {
    // Environments without form-associated custom elements (jsdom) skip it; every supported browser has it
    if (typeof this.internals.setFormValue !== "function") return;
    const off = this.isDisabled;
    this.internals.setFormValue(this.name && !off && this.signed ? JSON.stringify(this.value) : null);
    const anchor = this.querySelector<HTMLElement>(".ui-sigp__mode") ?? undefined;
    if (this.required && !off && !this.signed) this.internals.setValidity({ valueMissing: true }, this.errorMessage, anchor);
    else this.internals.setValidity({});
  }

  /* ---------- Changes ---------- */

  /** Proposes a value: the page may prevent it, and the field keeps its own */
  private propose(next: SignatureValue | null, say?: string) {
    if (!this.emit<SignatureValueChange>("tc-value-change", { value: next }, { cancelable: true })) return false;
    this.value = next;
    if (say) this.say(say);
    return true;
  }
  private say(text: string) {
    this.announce = this.announce === text ? `${text} ` : text;
  }

  /** Removes the last stroke */
  undo() {
    const strokes = this.strokes;
    if (!strokes.length) return;
    this.propose(strokes.length > 1 ? { kind: "drawn", strokes: strokes.slice(0, -1) } : null, this.words.undone);
  }
  /** Empties the pad (and the typed name) */
  clear() {
    if (!this.value) return;
    this.propose(null, this.words.cleared);
  }

  /* ---------- Drawing ---------- */

  private sample(e: PointerEvent, rect: DOMRect, start: number): SignaturePoint {
    const x = clamp((e.clientX - rect.left) / (rect.width || 1), 0, 1);
    const y = clamp((e.clientY - rect.top) / (rect.height || 1), 0, 1);
    // Mice and fingers report 0.5 (or 0) pressure; only a pen's is real
    const p = e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 0.5;
    return [round4(x), round4(y), Math.max(0, Math.round(e.timeStamp - start)), round4(p)];
  }

  private onDown = (e: PointerEvent) => {
    if (!this.canSign || this.typing || this.drawing) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    const surface = e.currentTarget as HTMLElement;
    try {
      surface.setPointerCapture(e.pointerId);
    } catch {
      // A pointer that's already gone (or a synthetic one) can't be captured; the stroke still ends on its pointerup
    }
    const rect = surface.getBoundingClientRect();
    this.drawing = { id: e.pointerId, start: e.timeStamp, rect, points: [] };
    this.drawing.points.push(this.sample(e, rect, e.timeStamp));
    this.paintLive();
  };
  private onMove = (e: PointerEvent) => {
    const d = this.drawing;
    if (!d || e.pointerId !== d.id) return;
    const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    for (const ev of events.length ? events : [e]) {
      const pt = this.sample(ev, d.rect, d.start);
      const last = d.points[d.points.length - 1];
      // Samples closer than a pixel add nothing but weight
      if (Math.hypot((pt[0] - last[0]) * d.rect.width, (pt[1] - last[1]) * d.rect.height) < 1.2) continue;
      d.points.push(pt);
    }
    this.paintLive();
  };
  private onUp = (e: PointerEvent) => {
    const d = this.drawing;
    if (!d || e.pointerId !== d.id) return;
    this.drawing = null;
    this.paintLive();
    if (e.type === "pointercancel" && d.points.length < 2) return;
    this.propose({ kind: "drawn", strokes: [...this.strokes, { points: d.points }] });
  };

  /** The stroke being drawn is painted straight into its path – no render per pointer move */
  private paintLive() {
    const live = this.querySelector<SVGPathElement>(".ui-sigp__live");
    if (!live) return;
    const d = this.drawing;
    if (d?.points.length) live.setAttribute("d", strokePath(d.points, this.size.w, this.size.h));
    else live.removeAttribute("d");
  }

  /* ---------- Typed ---------- */

  private toggleMode() {
    this.typing = !this.typing;
    void this.updateComplete.then(() => (this.typing ? this.querySelector<HTMLInputElement>(".ui-sigp__typed-input") : this.querySelector<HTMLElement>(".ui-sigp__mode"))?.focus());
  }
  private onTyped = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const text = input.value;
    const ok = this.propose(text.trim() ? { kind: "typed", text } : null);
    if (!ok) input.value = this.typedText;
  };

  /* ---------- Export ---------- */

  /** The signature as a standalone SVG document (the ink in the current text colour); null when unsigned */
  toSVG(): string | null {
    if (!this.signed || !this.value) return null;
    const { w, h } = this.size;
    const ink = this.inkColour();
    if (this.value.kind === "typed") {
      const font = this.scriptFont().replace(/"/g, "'");
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><text x="${round(w * 0.08)}" y="${round(h * 0.72)}" fill="${ink}" font-family="${font}" font-size="${round(h * 0.34)}">${escapeXml(this.value.text)}</text></svg>`;
    }
    const paths = this.value.strokes.map((s) => `<path d="${strokePath(s.points, w, h)}"/>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><g fill="${ink}">${paths}</g></svg>`;
  }

  /** The signature as an image (PNG unless `type` says otherwise), at the screen's pixel density; null when unsigned */
  toDataURL(type = "image/png", quality?: number): string | null {
    if (!this.signed || !this.value) return null;
    const { w, h } = this.size;
    const scale = Math.max(1, window.devicePixelRatio || 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(scale, scale);
    ctx.fillStyle = this.inkColour();
    if (this.value.kind === "typed") {
      ctx.font = `${round(h * 0.34)}px ${this.scriptFont()}`;
      ctx.fillText(this.value.text, w * 0.08, h * 0.72);
    } else {
      for (const s of this.value.strokes) ctx.fill(new Path2D(strokePath(s.points, w, h)));
    }
    return canvas.toDataURL(type, quality);
  }

  private inkColour() {
    const ink = this.querySelector(".ui-sigp__ink");
    return (ink && getComputedStyle(ink).color) || "currentColor";
  }
  private scriptFont() {
    const typed = this.querySelector(".ui-sigp__typed-input") ?? this;
    return getComputedStyle(typed).getPropertyValue("--tc-sigp-script-font").trim() || "cursive";
  }

  /* ---------- Render ---------- */

  private dateText() {
    const when = this.date ?? this.now ?? this.clock;
    if (!when) return "";
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "short", year: "numeric" }).format(when);
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const { w: vw, h: vh } = this.size;
    const signed = this.signed;
    const typedValue = this.value?.kind === "typed";
    const summary = signed ? `${w.signed}${typedValue ? `: ${this.typedText}` : ""}` : w.notSigned;
    const showToggle = this.canSign;
    const head = cardHead({ icon, title: this.heading, subtitle: this.description, id: `${id}-title` });
    const date = this.dateText();
    const describedBy = [this.invalid ? `${id}-error` : "", this.statement ? `${id}-statement` : ""].filter(Boolean).join(" ") || nothing;
    const body = html`<div class="ui-sigp__card">
      <div class="ui-sigp__field" data-typing=${this.typing ? "true" : "false"} ?data-invalid=${this.invalid} ?data-disabled=${this.isDisabled}>
        ${this.typing
          ? html`<label class="ui-sigp__typed">
              <span class="ui-sigp__typed-label">${w.typedLabel}</span>
              <input
                class="ui-sigp__typed-input"
                type="text"
                autocomplete="name"
                spellcheck="false"
                .value=${live(this.typedText)}
                placeholder=${this.signer ?? ""}
                ?disabled=${this.isDisabled}
                ?readonly=${this.readonly}
                ?required=${this.required}
                aria-invalid=${this.invalid ? "true" : "false"}
                aria-describedby=${describedBy}
                @input=${this.onTyped}
              />
            </label>`
          : nothing}
        <div
          class="ui-sigp__surface"
          role="img"
          aria-label=${`${this.heading}: ${summary}`}
          aria-describedby=${describedBy}
          ?hidden=${this.typing}
          @pointerdown=${this.onDown}
          @pointermove=${this.onMove}
          @pointerup=${this.onUp}
          @pointercancel=${this.onUp}
        >
          <svg class="ui-sigp__svg" viewBox=${`0 0 ${vw} ${vh}`} preserveAspectRatio="none" aria-hidden="true">
            <g class="ui-sigp__ink">${this.strokes.map((s) => svg`<path class="ui-sigp__stroke" d=${strokePath(s.points, vw, vh)}></path>`)}<path class="ui-sigp__live"></path></g>
          </svg>
          ${typedValue && !this.typing ? html`<span class="ui-sigp__script" aria-hidden="true">${this.typedText}</span>` : nothing}
          <span class="ui-sigp__x" aria-hidden="true">×</span>
          <span class="ui-sigp__line" aria-hidden="true"></span>
          ${signed ? nothing : html`<span class="ui-sigp__placeholder" aria-hidden="true">${w.placeholder}</span>`}
        </div>
        ${this.typing && typedValue ? html`<span class="ui-sigp__script ui-sigp__script--preview" aria-hidden="true">${this.typedText}</span>` : nothing}
      </div>
      ${this.readonly
        ? nothing
        : html`<div class="ui-sigp__tools" role="toolbar" aria-labelledby=${`${id}-title`}>
            <button type="button" class="tc-btn-sm ui-sigp__undo" ?disabled=${!this.canSign || this.typing || !this.strokes.length} @click=${() => this.undo()}>${w.undo}</button>
            <button type="button" class="tc-btn-sm ui-sigp__clear" ?disabled=${!this.canSign || !this.value} @click=${() => this.clear()}>${w.clear}</button>
            ${showToggle
              ? html`<button type="button" class="tc-btn-sm ui-sigp__mode" ?data-quiet=${!this.allowTyped && !this.typing} aria-pressed=${this.typing ? "true" : "false"} @click=${() => this.toggleMode()}>
                  ${this.typing ? w.drawInstead : w.typeInstead}
                </button>`
              : nothing}
          </div>`}
      ${this.invalid ? html`<p class="ui-sigp__error" id=${`${id}-error`}>${this.errorMessage}</p>` : nothing}
      <div class="ui-sigp__meta">
        <span class="ui-sigp__signer">${this.signer ?? nothing}</span>
        ${date ? html`<span class="ui-sigp__date"><span class="tc-sr-only">${w.date}: </span>${date}</span>` : nothing}
      </div>
      ${this.statement ? html`<p class="ui-sigp__statement" id=${`${id}-statement`}>${this.statement}</p>` : nothing}
      <span class="tc-sr-only" role="status">${this.announce}</span>
    </div>`;
    return html`${head}${body}`;
  }

  static override css = /* css */ `
[data-ui="sigp"] {
  --tc-sigp-script-font: "Segoe Script", "Bradley Hand", "Snell Roundhand", "Brush Script MT", "Apple Chancery", cursive;
  --tc-sigp-pad-h: 160px;
  --tc-sigp-pad-min-h: 120px;
  --tc-sigp-line-inset: 28%;
}
/* Standard: the header on a gray tray, above a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sigp"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card, the header its first row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sigp"] {
  position: relative;
  display: block;
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
[data-ui="sigp"] *, [data-ui="sigp"] *::before, [data-ui="sigp"] *::after { box-sizing: border-box; }
[data-ui="sigp"] p { margin: 0; }
.ui-sigp__card { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-sigp__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-sigp__card { padding-top: 0; }
/* ----- The pad ----- */
.ui-sigp__field { position: relative; display: grid; gap: var(--tc-space-2); }
.ui-sigp__surface {
  position: relative;
  height: var(--tc-sigp-pad-h);
  min-height: var(--tc-sigp-pad-min-h);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg-sunken);
  box-shadow: var(--tc-field-shadow);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  cursor: crosshair;
  overflow: hidden;
}
.ui-sigp__surface[hidden] { display: none; }
.ui-sigp__field:hover .ui-sigp__surface { box-shadow: var(--tc-field-shadow-hover); }
.ui-sigp__field[data-invalid] .ui-sigp__surface, .ui-sigp__field[data-invalid] .ui-sigp__typed-input { box-shadow: var(--tc-field-shadow-invalid); }
.ui-sigp__field[data-disabled] .ui-sigp__surface { cursor: not-allowed; background: var(--tc-surface-sunken); }
:where([data-ui="sigp"][readonly]) .ui-sigp__surface { cursor: default; }
.ui-sigp__svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; overflow: visible; }
.ui-sigp__ink { color: var(--tc-text-strong); fill: currentColor; }
.ui-sigp__field[data-disabled] .ui-sigp__ink { color: var(--tc-text-muted); }
.ui-sigp__stroke { animation: ui-sigp-ink var(--tc-duration-base) var(--tc-ease-out) both; }
@keyframes ui-sigp-ink { from { opacity: 0; } }
.ui-sigp__line { position: absolute; left: var(--tc-space-4); right: var(--tc-space-4); bottom: var(--tc-sigp-line-inset); border-top: var(--tc-hairline) dashed var(--tc-border-strong); pointer-events: none; }
.ui-sigp__x { position: absolute; left: var(--tc-space-4); bottom: calc(var(--tc-sigp-line-inset) + var(--tc-space-1)); font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); pointer-events: none; }
.ui-sigp__placeholder { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); text-align: center; font-size: var(--tc-font-size-md); color: var(--tc-text-placeholder); pointer-events: none; }
.ui-sigp__script { position: absolute; left: calc(var(--tc-space-4) + var(--tc-space-6)); right: var(--tc-space-4); bottom: calc(var(--tc-sigp-line-inset) - var(--tc-space-1)); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-family: var(--tc-sigp-script-font); font-size: var(--tc-font-size-4xl); line-height: var(--tc-line-height-tight); color: var(--tc-text-strong); pointer-events: none; animation: ui-sigp-ink var(--tc-duration-base) var(--tc-ease-out) both; }
.ui-sigp__script--preview { position: static; display: block; min-height: var(--tc-control-h-lg); padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) dashed var(--tc-border-strong); }
/* ----- Typed ----- */
.ui-sigp__typed { display: grid; gap: var(--tc-space-1); }
.ui-sigp__typed-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-sigp__typed-input { width: 100%; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-sigp__typed-input::placeholder { color: var(--tc-text-placeholder); }
.ui-sigp__typed-input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-sigp__typed-input:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
/* ----- Tools ----- */
.ui-sigp__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-sigp__mode { margin-left: auto; }
/* Without allow-typed the toggle is for keyboard users: hidden until it has focus, like a skip link */
.ui-sigp__mode[data-quiet]:not(:focus-visible) { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- Below ----- */
.ui-sigp__error { font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-sigp__meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); }
.ui-sigp__signer { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-sigp__date { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-sigp__statement { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
@container (max-width: 360px) {
  [data-ui="sigp"] { --tc-sigp-pad-h: var(--tc-sigp-pad-min-h); }
  .ui-sigp__script { font-size: var(--tc-font-size-3xl); }
}
@media (forced-colors: active) {
  .ui-sigp__ink, .ui-sigp__script { color: CanvasText; }
  .ui-sigp__surface { border: 1px solid CanvasText; }
  .ui-sigp__line { border-top-color: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="sigp"] *, [data-ui="sigp"] *::before, [data-ui="sigp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-signature-pad")) customElements.define("tc-signature-pad", TcSignaturePad);

declare global {
  interface HTMLElementTagNameMap {
    "tc-signature-pad": TcSignaturePad;
  }
}
