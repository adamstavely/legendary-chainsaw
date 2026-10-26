import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { easeOutQuart } from "../internal/ease";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";

/*
 * <tc-prompt-library> – the Lit port of src/components/prompt-library.tsx: saved prompt templates with variables.
 * A short list of templates on the left (on top when narrow), with a search field and a category tag. The chosen
 * template shows on the right with every {variable} as an inline field; the finished prompt is assembled live below
 * it, the part you just changed lights up for a moment, and a counter says how many are filled. The tray rolls the
 * token estimate; Use stays off until every variable is filled, then pulses once. Clean drops the gray tray: one
 * white card whose last row holds the caption, Copy and Use.
 *
 *   <tc-prompt-library heading="Prompts" .templates=${templates} .onUse=${(prompt) => send(prompt)}></tc-prompt-library>
 *
 * The host is a group named by the heading.
 */

export type PromptTone = "blue" | "violet" | "amber" | "green" | "red" | "gray";

export type PromptVariable = {
  /** What to put in – shown on the tray while the field is focused or hovered */
  description?: string;
  /** Starts filled with this value */
  default?: string;
};

export type PromptTemplate = {
  id: string;
  title: string;
  /** Small tag next to the title, e.g. "Sales" */
  category?: string;
  /** Color of the tag – by default each category gets its own color in the order they appear */
  tone?: PromptTone;
  /** The prompt with variables in curly braces, e.g. "Summarize this for {audience}" */
  body: string;
  /** Optional details per variable name */
  variables?: Record<string, PromptVariable>;
};

/** What has been typed into the variables: template id → variable name → value */
export type PromptValues = Record<string, Record<string, string>>;
export type PromptUseHandler = (prompt: string, template: PromptTemplate, values: Record<string, string>) => void | Promise<unknown>;
export type PromptValueChange = { value: string };
export type PromptValuesChange = { values: PromptValues };
export type PromptCopy = { prompt: string };

const isPromise = (value: unknown): value is Promise<unknown> => !!value && typeof (value as Promise<unknown>).then === "function";

/* ---------- Helpers ---------- */

const TONES: PromptTone[] = ["blue", "violet", "amber", "green", "red", "gray"];
const VAR = /\{([A-Za-z0-9_-]+)\}/g;

/** A variable keeps the punctuation right after it (its tail), so a line never starts with "." */
type Part = { text: string } | { name: string; tail: string };
const parse = (body: string): Part[] => {
  const parts: Part[] = [];
  let last = 0;
  for (const m of body.matchAll(VAR)) {
    if (m.index > last) parts.push({ text: body.slice(last, m.index) });
    const end = m.index + m[0].length;
    const tail = /^[.,;:!?)\]"'’…]+/.exec(body.slice(end))?.[0] ?? "";
    parts.push({ name: m[1], tail });
    last = end + tail.length;
  }
  if (last < body.length) parts.push({ text: body.slice(last) });
  return parts;
};
const namesOf = (body: string) => [...new Set([...body.matchAll(VAR)].map((m) => m[1]))];
const fill = (body: string, values: Record<string, string>) => body.replace(VAR, (whole, name: string) => (values[name]?.trim() ? values[name] : whole));
/** A rough estimate – about four characters per token */
const estimate = (text: string) => Math.max(1, Math.round(text.length / 4));
const defaults = (t: PromptTemplate) => {
  const v: Record<string, string> = {};
  for (const name of namesOf(t.body)) v[name] = t.variables?.[name]?.default ?? "";
  return v;
};

/* ---------- Icons ---------- */

const line = (width: number) => ({ width });
const std = line(1.4);
const cln = line(1.1);
const ICONS: Record<Look, Record<"search" | "copy" | "done" | "arrow", TemplateResult>> = {
  /* Standard: 12–13px icons with 1.4px lines */
  standard: {
    search: html`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">${svg`<circle cx="5.8" cy="5.8" r="3.8" stroke="currentColor" stroke-width=${std.width} stroke-linecap="round" stroke-linejoin="round"></circle><path d="m8.6 8.6 2.4 2.4" stroke="currentColor" stroke-width=${std.width} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`,
    copy: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<rect x="3.8" y="3.8" width="6.4" height="6.4" rx="1.6" stroke="currentColor" stroke-width=${std.width} stroke-linecap="round" stroke-linejoin="round"></rect><path d="M8.2 3.6V3.2A1.4 1.4 0 0 0 6.8 1.8H3.2a1.4 1.4 0 0 0-1.4 1.4v3.6a1.4 1.4 0 0 0 1.4 1.4h.4" stroke="currentColor" stroke-width=${std.width} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`,
    done: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="m2.6 6.3 2.2 2.2 4.6-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`,
    arrow: html`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">${svg`<path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" stroke-width=${std.width} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`,
  },
  /* Clean: 16px icons with thin lines */
  clean: {
    search: html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${svg`<circle cx="7.25" cy="7.25" r="4.25" stroke="currentColor" stroke-width=${cln.width} stroke-linecap="round" stroke-linejoin="round"></circle><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width=${cln.width} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`,
    copy: html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${svg`<rect x="5.5" y="5.5" width="8" height="8" rx="1.75" stroke="currentColor" stroke-width=${cln.width} stroke-linecap="round" stroke-linejoin="round"></rect><path d="M10.5 5.5V4.25A1.75 1.75 0 0 0 8.75 2.5h-4.5A1.75 1.75 0 0 0 2.5 4.25v4.5c0 .97.78 1.75 1.75 1.75H5.5" stroke="currentColor" stroke-width=${cln.width} stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`,
    done: html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${svg`<path d="m3.5 8.25 3 3 6-6.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`,
    arrow: html`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">${svg`<path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`,
  },
};

type Note = { id: number; kind: "copied" | "copy-failed" | "used" | "use-failed" };
type Line = { id: string; tone?: string; node: TemplateResult | string };

let instances = 0;

/**
 * Saved prompt templates whose variables are filled in place.
 * @tag tc-prompt-library
 * @fires tc-value-change - Another template is chosen ({ value: string }); cancelable
 * @fires tc-values-change - A variable was edited ({ values: PromptValues }, every template's values); cancelable
 * @fires tc-copy - The finished prompt is on the clipboard ({ prompt: string }) – not when the clipboard refused it
 */
export class TcPromptLibrary extends TcElement {
  static override ui = "pli";

  /** The saved templates, in list order – each with a title, an optional category and a body with {variables} */
  @property({ attribute: false }) accessor templates: PromptTemplate[] = [];
  /** Id of the chosen template – unset or unknown shows the first. Changed by the user unless a tc-value-change
   *  listener calls preventDefault() */
  @property() accessor value = "";
  /** The variables typed so far, per template; a missing one shows its template default. Changed by the user unless
   *  a tc-values-change listener calls preventDefault() */
  @property({ attribute: false }) accessor values: PromptValues = {};
  /** Called with the finished prompt when Use is pressed (only once every variable is filled). A promise keeps Use
   *  pending until it settles; a rejection says so on the tray and Use can be pressed again */
  @property({ attribute: false }) accessor onUse: PromptUseHandler | undefined = undefined;
  /** The heading over the list, and the group's name */
  @property() accessor heading = "Prompts";
  /** Label of the use button */
  @property({ attribute: "use-label" }) accessor useLabel = "Use prompt";

  @state() private accessor query = "";
  @state() private accessor flash: { name: string; n: number } | null = null;
  @state() private accessor hint: string | null = null;
  @state() private accessor useHover = false;
  @state() private accessor note: Note | null = null;
  @state() private accessor using = false;
  @state() private accessor said = "";
  @state() private accessor leaving: { id: string; key: number } | null = null;
  @state() private accessor pulse = 0;
  @state() private accessor swapOut: Line | null = null;
  /** The token count as rendered; the frames of a roll write into the DOM in between */
  @state() private accessor shownCount = 0;

  private readonly uid = `tc-pli${++instances}`;
  private notes = 0;
  private lastId: string | undefined = undefined;
  private wasReady: boolean | undefined = undefined;
  private wasId: string | undefined = undefined;
  private lastLine: Line | null = null;
  private line: Line = { id: "", node: "" };
  private timers = new Map<string, number>();
  private timerFor = new Map<string, unknown>();
  private roll = { current: 0, target: Number.NaN, frame: 0 };
  private ro?: ResizeObserver;
  private glideKey = "";
  private glideOn = false;
  private ownName = false;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= this.hasAttribute("aria-label") || (this.hasAttribute("aria-labelledby") && this.getAttribute("aria-labelledby") !== `${this.uid}-title`);
    if (!this.ownName) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    for (const t of this.timers.values()) window.clearTimeout(t);
    this.timers.clear();
    this.timerFor.clear();
    cancelAnimationFrame(this.roll.frame);
    this.roll.frame = 0;
    this.roll.target = Number.NaN;
    this.ro?.disconnect();
    this.ro = undefined;
    this.glideKey = "";
  }

  /* ---------- Derived ---------- */

  private get selected() {
    return this.templates.find((t) => t.id === this.value) ?? this.templates[0];
  }
  private valuesOf(t: PromptTemplate) {
    return { ...defaults(t), ...this.values[t.id] };
  }
  private toneOf(t: PromptTemplate): PromptTone {
    // Category colors in the order the categories first appear
    const map = new Map<string, PromptTone>();
    for (const x of this.templates) if (x.category && !map.has(x.category)) map.set(x.category, TONES[map.size % TONES.length]);
    return t.tone ?? map.get(t.category ?? "") ?? "gray";
  }
  private get shown() {
    const q = this.query.trim().toLowerCase();
    return q ? this.templates.filter((t) => [t.title, t.category ?? "", t.body].some((s) => s.toLowerCase().includes(q))) : this.templates;
  }
  private state() {
    const selected = this.selected;
    const values = selected ? this.valuesOf(selected) : {};
    const names = selected ? namesOf(selected.body) : [];
    const missing = names.filter((n) => !values[n]?.trim());
    const ready = Boolean(selected) && missing.length === 0;
    const prompt = selected ? fill(selected.body, values) : "";
    return { selected, values, names, missing, ready, prompt };
  }

  /* ---------- Changes ---------- */

  private select(id: string) {
    const current = this.selected?.id ?? "";
    if (id === current) return;
    if (this.emit<PromptValueChange>("tc-value-change", { value: id }, { cancelable: true })) this.value = id;
  }

  private change(name: string, v: string) {
    const selected = this.selected;
    if (!selected) return;
    const id = selected.id;
    const next = { ...this.values, [id]: { ...defaults(selected), ...this.values[id], [name]: v } };
    if (this.emit<PromptValuesChange>("tc-values-change", { values: next }, { cancelable: true })) this.values = next;
    // Controlled: the field shows the value it's given again
    else this.requestUpdate();
    this.flash = { name, n: (this.flash?.n ?? 0) + 1 };
  }

  private enter(name: string) {
    // Enter moves on to the next field that is still empty, or presses Use when all are filled
    const inputs = [...this.querySelectorAll<HTMLInputElement>(".ui-pli__panel:not([data-out]) .ui-pli__input")];
    const from = inputs.findIndex((i) => i.dataset.var === name);
    const next = [...inputs.slice(from + 1), ...inputs.slice(0, from)].find((i) => !i.value.trim());
    if (next) next.focus();
    else if (this.state().ready) this.sendPrompt();
  }

  private copy = async () => {
    const { prompt } = this.state();
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Denied, or no clipboard at all (insecure page): say so instead of "Copied"
      if (!this.isConnected) return;
      this.note = { id: ++this.notes, kind: "copy-failed" };
      this.said = "Couldn't copy the prompt";
      return;
    }
    if (!this.isConnected) return;
    this.emit<PromptCopy>("tc-copy", { prompt });
    this.note = { id: ++this.notes, kind: "copied" };
    this.said = "Prompt copied";
  };

  private sendPrompt = () => {
    const { selected, ready, missing, prompt, values } = this.state();
    // Pressed while off: say why (the reason is also its description), instead of doing nothing silently
    if (selected && !ready && !this.using) {
      this.said = `Fill ${missing.length} more ${missing.length === 1 ? "variable" : "variables"} to use the prompt`;
      return;
    }
    if (!ready || !selected || this.using) return;
    const result = this.onUse?.(prompt, selected, values);
    const done = () => {
      this.note = { id: ++this.notes, kind: "used" };
      this.said = `${selected.title} used`;
    };
    if (!isPromise(result)) return done();
    this.using = true;
    result.then(
      () => {
        if (!this.isConnected) return;
        this.using = false;
        done();
      },
      () => {
        if (!this.isConnected) return;
        this.using = false;
        this.note = { id: ++this.notes, kind: "use-failed" };
        this.said = "Couldn't use the prompt";
      },
    );
  };

  /** Runs `run` `ms` after `value` became what it is – a new value restarts it, none clears it */
  private later(name: string, value: unknown, ms: number, run: () => void) {
    if (this.timerFor.get(name) === value) return;
    this.timerFor.set(name, value);
    window.clearTimeout(this.timers.get(name));
    this.timers.delete(name);
    if (value) this.timers.set(name, window.setTimeout(run, ms));
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const { selected, ready, prompt } = this.state();
    // The outgoing template stays a moment and fades out underneath the new one
    if (selected && this.lastId !== selected.id) {
      if (this.lastId && !reducedMotion()) this.leaving = { id: this.lastId, key: (this.leaving?.key ?? 0) + 1 };
      this.lastId = selected.id;
      this.hint = null;
      this.flash = null;
    }
    // Use pulses once when the last variable gets filled
    if (this.wasReady !== undefined && ready && !this.wasReady && this.wasId === selected?.id) {
      this.pulse++;
      this.said = "All variables filled";
    }
    this.wasReady = ready;
    this.wasId = selected?.id;
    // The token count rolls from where it is to its target
    const target = estimate(prompt);
    if (target !== this.roll.target) this.startRoll(target);
    // What the tray says; the old line fades out underneath the new one
    this.line = this.trayLine();
    if (this.lastLine && this.lastLine.id !== this.line.id) this.swapOut = this.lastLine;
    this.lastLine = this.line;
  }

  private startRoll(target: number) {
    const first = Number.isNaN(this.roll.target);
    this.roll.target = target;
    cancelAnimationFrame(this.roll.frame);
    this.roll.frame = 0;
    const from = this.roll.current;
    if (first || reducedMotion() || from === target) {
      this.roll.current = target;
      this.shownCount = target;
      return;
    }
    this.shownCount = Math.round(from);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 420);
      this.roll.current = from + (target - from) * easeOutQuart(t);
      if (t < 1) {
        this.paintRoll();
        this.roll.frame = requestAnimationFrame(step);
      } else {
        this.roll.frame = 0;
        this.shownCount = target;
      }
    };
    this.roll.frame = requestAnimationFrame(step);
  }

  /** Writes the rolling number into every [data-roll] text that isn't fading out – no render per frame */
  private paintRoll() {
    const next = String(Math.round(this.roll.current));
    this.querySelectorAll<HTMLElement>("[data-roll]").forEach((n) => {
      if (n.closest("[data-out]")) return;
      const text = [...n.childNodes].find((c) => c.nodeType === Node.TEXT_NODE);
      if (text && text.nodeValue !== next) text.nodeValue = next;
    });
  }

  protected override updated() {
    // A render in the middle of a roll draws `shownCount` – put the frame's value back
    this.paintRoll();
    this.later("leaving", this.leaving, 260, () => (this.leaving = null));
    this.later("swap", this.swapOut, 260, () => (this.swapOut = null));
    this.later("note", this.note, 1800, () => (this.note = null));
    this.later("said", this.said, 2000, () => (this.said = ""));
    this.placeGlide();
  }

  /** The highlight slides to the chosen item: measured when the choice or the list changes, and when the list resizes */
  private placeGlide() {
    const list = this.querySelector<HTMLElement>(".ui-pli__list");
    const key = `${this.selected?.id}|${this.shown.map((t) => t.id).join("|")}`;
    if (key === this.glideKey && this.ro) return;
    this.glideKey = key;
    this.measureGlide();
    if (!this.ro && list && typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => this.measureGlide());
      this.ro.observe(list);
    }
  }
  private measureGlide() {
    const glide = this.querySelector<HTMLElement>(".ui-pli__glide");
    if (!glide) return;
    const id = this.selected?.id;
    const el = id === undefined ? undefined : [...this.querySelectorAll<HTMLElement>(".ui-pli__option")].find((o) => o.dataset.id === id);
    if (el) {
      glide.style.transform = `translateY(${el.offsetTop}px)`;
      glide.style.height = `${el.offsetHeight}px`;
      glide.toggleAttribute("data-moved", this.glideOn);
      this.glideOn = true;
    } else {
      glide.removeAttribute("data-moved");
      this.glideOn = false;
    }
    glide.toggleAttribute("data-on", this.glideOn);
  }

  /* ---------- Render ---------- */

  /** What the tray says: a note after Copy / Use, the variable pointed at, what's missing, or the token count */
  private trayLine(): Line {
    const note = this.note;
    const { selected, values, names, missing, ready } = this.state();
    if (note)
      return {
        node: note.kind === "copied" ? "Copied to clipboard" : note.kind === "copy-failed" ? "Couldn't copy" : note.kind === "use-failed" ? "Couldn't use the prompt" : "Prompt sent",
        id: `${note.kind}-${note.id}`,
        tone: note.kind === "copy-failed" || note.kind === "use-failed" ? "error" : "ok",
      };
    const hinted = this.hint && names.includes(this.hint) ? this.hint : null;
    if (hinted) {
      const description = selected?.variables?.[hinted]?.description;
      return { node: html`<b>${hinted}</b> · ${description ?? (values[hinted]?.trim() ? "filled" : "fill this in")}`, id: `hint-${hinted}` };
    }
    const n = this.useHover && !ready ? missing.length : 0;
    if (n) return { node: `Fill ${n} more to use`, id: "missing" };
    return { node: html`~<span data-roll="">${this.shownCount}</span> tokens`, id: "tokens" };
  }

  private panel(template: PromptTemplate, values: Record<string, string>, flash: { name: string; n: number } | null, idBase: string, out: boolean) {
    const parts = parse(template.body);
    const names = namesOf(template.body);
    const filled = names.filter((n) => values[n]?.trim()).length;
    const flashOf = (name: string) => (flash && flash.name === name ? (flash.n % 2 ? "a" : "b") : undefined);
    const tone = this.toneOf(template);
    const hintTo = (name: string | null) => (e: PointerEvent) => {
      if (!out && e.pointerType === "mouse") this.hint = name;
    };
    return html`<div class="ui-pli__panel" ?data-out=${out} aria-hidden=${ifDefined(out ? "true" : undefined)} .inert=${out}>
      <div class="ui-pli__panel-head">
        <span class="ui-pli__panel-title">${template.title}</span>
        ${template.category ? html`<span class="ui-pli__tag" data-tone=${tone}>${template.category}</span>` : nothing}
        ${names.length > 0
          ? html`<span class="ui-pli__count"><span class="ui-pli__bars" aria-hidden="true">${names.map((n) => html`<span class="ui-pli__bar" ?data-on=${!!values[n]?.trim()}></span>`)}</span>${filled} of ${names.length} filled</span>`
          : nothing}
      </div>
      <p class="ui-pli__body">${parts.map((p) =>
        "text" in p
          ? p.text
          : html`<span class="ui-pli__glue"><span class="ui-pli__token" ?data-filled=${!!values[p.name]?.trim()} data-flash=${ifDefined(flashOf(p.name))} @pointerenter=${hintTo(p.name)} @pointerleave=${hintTo(null)}><span class="ui-pli__sizer" aria-hidden="true">${values[p.name] || p.name}</span><input
                class="ui-pli__input"
                data-var=${p.name}
                size="1"
                .value=${live(values[p.name] ?? "")}
                placeholder=${p.name}
                aria-label=${template.variables?.[p.name]?.description ? `${p.name} – ${template.variables[p.name].description}` : p.name}
                spellcheck="false"
                autocomplete="off"
                @input=${(e: Event) => !out && this.change(p.name, (e.target as HTMLInputElement).value)}
                @focus=${() => !out && (this.hint = p.name)}
                @blur=${() => !out && (this.hint = null)}
                @keydown=${(e: KeyboardEvent) => {
                  if (!out && e.key === "Enter" && !e.isComposing) {
                    e.preventDefault();
                    this.enter(p.name);
                  }
                }}
              /></span>${p.tail}</span>`,
      )}</p>
      <div class="ui-pli__label" id=${`${idBase}-preview`}>Preview</div>
      <div class="ui-pli__preview" aria-labelledby=${`${idBase}-preview`} role="region">${parts.map((p) =>
        "text" in p
          ? p.text
          : html`<span class="ui-pli__glue">${values[p.name]?.trim()
              ? html`<span class="ui-pli__fill" data-flash=${ifDefined(flashOf(p.name))}>${values[p.name]}</span>`
              : html`<span class="ui-pli__hole">${`{${p.name}}`}</span>`}${p.tail}</span>`,
      )}</div>
    </div>`;
  }

  private side(icon: (typeof ICONS)[Look]) {
    const shown = this.shown;
    const selected = this.selected;
    const uid = this.uid;
    const focusOption = (id: string) => this.updateComplete.then(() => [...this.querySelectorAll<HTMLElement>(".ui-pli__option")].find((o) => o.dataset.id === id)?.focus());
    const onListKey = (e: KeyboardEvent) => {
      if (!shown.length) return;
      const at = shown.findIndex((t) => t.id === selected?.id);
      let next = -1;
      if (e.key === "ArrowDown") next = at < 0 ? 0 : Math.min(shown.length - 1, at + 1);
      else if (e.key === "ArrowUp") next = at < 0 ? shown.length - 1 : Math.max(0, at - 1);
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = shown.length - 1;
      else return;
      e.preventDefault();
      this.select(shown[next].id);
      void focusOption(shown[next].id);
    };
    const onSearchKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && shown.length) {
        e.preventDefault();
        const target = shown.find((t) => t.id === selected?.id) ?? shown[0];
        this.select(target.id);
        void focusOption(target.id);
      } else if (e.key === "Escape" && this.query) {
        e.preventDefault();
        this.query = "";
      }
    };
    return html`<div class="ui-pli__side">
      <div class="ui-pli__side-head">
        <span id=${`${uid}-title`} class="ui-pli__title">${this.heading}</span>
        <span class="ui-pli__total">${this.templates.length}</span>
      </div>
      <label class="ui-pli__search">${icon.search}<input
          type="search"
          .value=${live(this.query)}
          placeholder="Search templates"
          aria-label="Search templates"
          aria-controls=${`${uid}-list`}
          @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value)}
          @keydown=${onSearchKey}
        /></label>
      <div id=${`${uid}-list`} class="ui-pli__list" role="listbox" aria-label="Templates" @keydown=${onListKey}>
        <span class="ui-pli__glide" aria-hidden="true"></span>
        ${repeat(
          shown,
          (t) => t.id,
          (t) => {
            const isOn = t.id === selected?.id;
            const focusable = isOn || (!shown.some((s) => s.id === selected?.id) && t === shown[0]);
            return html`<div
              class="ui-pli__option"
              data-id=${t.id}
              role="option"
              aria-selected=${isOn ? "true" : "false"}
              tabindex=${focusable ? 0 : -1}
              @click=${() => this.select(t.id)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  this.select(t.id);
                }
              }}
            ><span class="ui-pli__option-title">${t.title}</span>${t.category ? html`<span class="ui-pli__tag" data-tone=${this.toneOf(t)}>${t.category}</span>` : nothing}</div>`;
          },
        )}
        ${shown.length === 0 ? html`<div class="ui-pli__empty">No templates match</div>` : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const icon = ICONS[look];
    const uid = this.uid;
    const { selected, values, missing, ready } = this.state();
    const leavingTemplate = this.leaving ? this.templates.find((t) => t.id === this.leaving!.id) : undefined;
    const using = this.using;
    const note = this.note;

    const sideEl = this.side(icon);
    // The chosen template
    const mainEl = html`<div class="ui-pli__main">
      ${leavingTemplate ? keyed(`out-${this.leaving!.key}`, this.panel(leavingTemplate, this.valuesOf(leavingTemplate), null, `${uid}-out`, true)) : nothing}
      ${selected ? keyed(selected.id, this.panel(selected, values, this.flash, uid, false)) : nothing}
    </div>`;

    // Text that changes without a jump: the old line fades out underneath while the new one fades in
    const out = this.swapOut;
    const line = this.line;
    const copied = note?.kind === "copied";
    // The tray under the card (Standard) or the card's last row (Clean): caption, Copy and Use
    const footEl = html`<div class="ui-pli__foot">
      <span class="ui-pli__caption"><span class="ui-pli__swap">${out ? keyed(`out-${out.id}`, html`<span class="ui-pli__swap-item" data-out="" data-tone=${ifDefined(out.tone)} aria-hidden="true">${out.node}</span>`) : nothing}${keyed(line.id, html`<span class="ui-pli__swap-item" data-tone=${ifDefined(line.tone)}>${line.node}</span>`)}</span></span>
      <button type="button" class="ui-pli__copy" @click=${this.copy} aria-label="Copy prompt" ?disabled=${!selected}>${keyed(copied ? "done" : "copy", html`<span class="ui-pli__copy-icon" ?data-done=${copied}>${copied ? icon.done : icon.copy}</span>`)}<span class="ui-pli__copy-text">Copy</span></button>
      <button
        type="button"
        class="ui-pli__use"
        aria-disabled=${!ready || using ? "true" : "false"}
        aria-busy=${ifDefined(using ? "true" : undefined)}
        aria-describedby=${ifDefined(!ready && selected ? `${uid}-why` : undefined)}
        data-pulse=${ifDefined(this.pulse ? (this.pulse % 2 ? "a" : "b") : undefined)}
        @click=${this.sendPrompt}
        @pointerenter=${() => (this.useHover = true)}
        @pointerleave=${() => (this.useHover = false)}
        @focus=${() => (this.useHover = true)}
        @blur=${() => (this.useHover = false)}
      >${this.useLabel}${icon.arrow}</button>
      ${!ready && selected ? html`<span id=${`${uid}-why`} class="ui-pli__sr">${`Fill ${missing.length} more ${missing.length === 1 ? "variable" : "variables"} to use`}</span>` : nothing}
    </div>`;

    return html`
      <div class="ui-pli__card">${clean ? html`<div class="ui-pli__cols">${sideEl}${mainEl}</div>${footEl}` : html`${sideEl}${mainEl}`}</div>
      ${clean ? nothing : footEl}
      <span class="ui-pli__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pli"] {
  /* insets and hover fills: a light grey on the card, lighter than the card in dark mode */
  --tc-prompt-library-well: light-dark(#f4f4f5, #222225);
  /* the flash on a filled-in or inserted value: stronger than --tc-accent-subtle */
  --tc-prompt-library-flash: light-dark(rgba(47, 107, 255, 0.24), rgba(79, 130, 255, 0.36));
  box-sizing: border-box;
  width: 100%;
  max-width: 640px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-space-1);
  border-radius: var(--tc-radius-3xl);
  background: var(--tc-surface-sunken);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="pli"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pli"] {
  --tc-prompt-library-pulse: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.25));
  /* the flash on a filled-in or inserted value: stronger than --tc-accent-subtle */
  --tc-prompt-library-flash: light-dark(rgba(0, 96, 226, 0.16), rgba(77, 141, 255, 0.3));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 640px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="pli"] *, [data-ui="pli"] *::before, [data-ui="pli"] *::after { box-sizing: border-box; }
:where([data-ui="pli"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="pli"]) input { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; outline: none; }
[data-ui="pli"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* List rows: the ring sits inside the row, so its neighbours never cover it */
.ui-pli__option:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pli"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="pli"]) svg { display: block; flex: none; }
[data-ui="pli"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
[data-ui="pli"] p { margin: 0; }
.ui-pli__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__card { display: grid; grid-template-columns: 220px minmax(0, 1fr); border-radius: var(--tc-radius-2xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* ----- List ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pli__side { min-width: 0; padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); border-right: 1px solid var(--tc-border-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__side-head { display: flex; align-items: center; gap: var(--tc-space-1-5); height: 22px; padding: 0 var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__title { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__total { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__search { display: flex; align-items: center; gap: var(--tc-space-2); height: 30px; margin-top: var(--tc-space-2); padding: 0 var(--tc-space-2); border-radius: var(--tc-field-radius); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); color: var(--tc-text-muted); cursor: text; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pli__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-pli__search:focus-within { box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__search input { flex: 1; min-width: 0; height: 100%; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); -webkit-appearance: none; appearance: none; }
.ui-pli__search input::placeholder { color: var(--tc-text-placeholder); }
/* One white card – the edge is a shadow, not a border; the last row sits inside it */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__card { overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__cols { display: grid; grid-template-columns: 220px minmax(0, 1fr); }
/* ----- List ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__side { min-width: 0; padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); border-right: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__side-head { display: flex; align-items: center; gap: var(--tc-space-1-5); height: 20px; padding: 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__title { overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__total { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__search { display: flex; align-items: center; gap: var(--tc-space-1-5); height: 28px; margin-top: var(--tc-space-2-5); padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); border-radius: var(--tc-field-radius); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); color: var(--tc-icon-muted); cursor: text; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__search input { flex: 1; min-width: 0; height: 100%; font-size: var(--tc-font-size-md); color: var(--tc-text-primary); caret-color: var(--tc-accent); -webkit-appearance: none; appearance: none; }
.ui-pli__search input::-webkit-search-cancel-button { -webkit-appearance: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__list { position: relative; display: flex; flex-direction: column; gap: var(--tc-space-0-5); margin-top: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__glide { position: absolute; top: 0; left: 0; right: 0; border-radius: var(--tc-radius-md); background: var(--tc-prompt-library-well); opacity: 0; pointer-events: none; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__list { position: relative; isolation: isolate; display: flex; flex-direction: column; gap: var(--tc-space-0-5); margin-top: var(--tc-space-2); }
/* The chosen row's fill – a short, crisp move to the next row, no long glide */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__glide { position: absolute; top: 0; left: 0; right: 0; z-index: -1; border-radius: var(--tc-radius-sm); background: var(--tc-fill-default); opacity: 0; pointer-events: none; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pli__glide[data-on] { opacity: 1; }
.ui-pli__glide { box-shadow: inset 2px 0 0 var(--tc-border-selected); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__glide[data-moved] { transition: transform var(--tc-duration-slow) var(--tc-ease-move), height var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__option { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); height: 34px; padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); cursor: pointer; user-select: none; transition: color var(--tc-duration-fast) var(--tc-ease-standard); -webkit-tap-highlight-color: transparent; }
.ui-pli__option::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__list { isolation: isolate; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__glide { z-index: -1; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__option:hover:not([aria-selected="true"])::before { background: color-mix(in srgb, var(--tc-prompt-library-well) 55%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__option[aria-selected="true"] { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__glide[data-moved] { transition: transform var(--tc-duration-instant) var(--tc-ease-move), height var(--tc-duration-instant) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); height: 32px; padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); color: var(--tc-text-secondary); cursor: pointer; user-select: none; transition: color var(--tc-duration-fast) var(--tc-ease-standard); -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option:hover:not([aria-selected="true"])::before { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option[aria-selected="true"] { color: var(--tc-text-primary); }
.ui-pli__option-title { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__empty { height: 34px; padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: 34px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__tag { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); white-space: nowrap; color: var(--tc-text-secondary); background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__empty { height: 32px; padding: 0 var(--tc-space-2); line-height: var(--tc-line-height-display); color: var(--tc-text-muted); }
/* Category tags: a light tint of their color */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__tag { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); white-space: nowrap; color: var(--tc-text-secondary); background: var(--tc-fill-default); }
.ui-pli__tag[data-tone="blue"] { color: var(--tc-accent-text); background: var(--tc-accent-subtle); }
.ui-pli__tag[data-tone="violet"] { color: var(--tc-tone-violet-fg); background: var(--tc-tone-violet-bg); }
.ui-pli__tag[data-tone="amber"] { color: var(--tc-status-warning-fg); background: var(--tc-status-warning-bg); }
.ui-pli__tag[data-tone="green"] { color: var(--tc-status-success-fg); background: var(--tc-status-success-bg); }
.ui-pli__tag[data-tone="red"] { color: var(--tc-status-danger-fg); background: var(--tc-status-danger-bg); }
/* ----- Chosen template: the old one fades out underneath while the new one fades in ----- */
.ui-pli__main { display: grid; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__panel { grid-area: 1 / 1; min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); animation: ui-pli-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__panel { grid-area: 1 / 1; min-width: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); animation: ui-pli-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-pli__panel[data-out] { animation: ui-pli-out var(--tc-duration-moderate) var(--tc-ease-standard) both; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__panel-head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 22px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__panel-title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__count { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); margin-left: auto; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__panel-head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__panel-title { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__count { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-pli__bars { display: inline-flex; gap: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__bar { width: 8px; height: 4px; border-radius: var(--tc-radius-2xs); background: var(--tc-border-default); transition: background-color var(--tc-duration-slow) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__bar { width: 6px; height: 6px; border-radius: 1.5px; background: var(--tc-fill-default); transition: background-color var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-pli__bar[data-on] { background: var(--tc-accent); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__body { margin-top: var(--tc-space-2-5) !important; font-size: var(--tc-font-size-md); line-height: 26px; color: var(--tc-text-secondary); overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__body { margin-top: var(--tc-space-2-5) !important; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-display-sm); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-pli__glue { white-space: nowrap; }
.ui-pli__preview .ui-pli__glue { white-space: inherit; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__token { position: relative; display: inline-grid; vertical-align: top; max-width: 100%; height: 22px; margin: var(--tc-space-0-5) 0; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-prompt-library-well); box-shadow: inset 0 0 0 1px var(--tc-border-default); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-muted); cursor: text; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__token:hover { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-text-muted) 45%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__token[data-filled] { background: var(--tc-accent-subtle); box-shadow: none; color: var(--tc-accent-text); }
.ui-pli__token:focus-within { box-shadow: var(--tc-field-shadow-focus); }
/* A variable: an empty one is a soft field, a filled one a light accent tint */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__token { position: relative; display: inline-grid; vertical-align: top; max-width: 100%; height: 22px; margin: var(--tc-space-1) 0; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 0.5px var(--tc-border-strong); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); cursor: text; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__token:hover { background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__token[data-filled] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 0.5px transparent; }
.ui-pli__token[data-flash="a"] { animation: ui-pli-flash-a var(--tc-duration-reveal-slow) var(--tc-ease-decelerate); }
.ui-pli__token[data-flash="b"] { animation: ui-pli-flash-b var(--tc-duration-reveal-slow) var(--tc-ease-decelerate); }
.ui-pli__sizer, .ui-pli__input { grid-area: 1 / 1; min-width: 2ch; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-relaxed); white-space: pre; }
.ui-pli__sizer { padding-right: 1px; font-weight: var(--tc-font-weight-medium); visibility: hidden; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__input { width: 100%; height: 22px; color: inherit; font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__input { width: 100%; height: 22px; color: inherit; font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; caret-color: var(--tc-accent); }
.ui-pli__input::placeholder { color: var(--tc-text-placeholder); font-weight: var(--tc-font-weight-regular); opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__label { margin-top: var(--tc-space-3); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__preview { margin-top: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-prompt-library-well); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__label { margin-top: var(--tc-space-3); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__preview { margin-top: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-pli__fill { border-radius: var(--tc-radius-xs); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.ui-pli__fill[data-flash="a"] { animation: ui-pli-mark-a 1100ms var(--tc-ease-decelerate); }
.ui-pli__fill[data-flash="b"] { animation: ui-pli-mark-b 1100ms var(--tc-ease-decelerate); }
/* An unfilled variable in the preview is real text: muted, not the disabled grey */
.ui-pli__hole { color: var(--tc-text-muted); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pli__foot { display: flex; align-items: center; gap: var(--tc-space-1); min-height: 40px; padding: var(--tc-space-1) var(--tc-space-0-5) 0 var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* ----- The last row: caption, Copy and Use ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__foot { display: flex; align-items: center; gap: var(--tc-space-2); height: 44px; padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: 0.5px solid var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-pli__swap { display: grid; min-width: 0; }
.ui-pli__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-pli-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-pli__swap-item[data-out] { animation: ui-pli-swap-out var(--tc-duration-base) var(--tc-ease-standard) both; }
.ui-pli__swap-item[data-tone="error"] { color: var(--tc-status-danger-fg); }
.ui-pli__swap-item[data-tone="ok"] { color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 calc(var(--tc-control-px-sm) - 1px) 0 calc(var(--tc-control-px-sm) - 2px); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy-icon { display: grid; place-items: center; width: 12px; height: 12px; animation: ui-pli-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__use { position: relative; display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 calc(var(--tc-control-px-sm) - 1px) 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pli__use svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
/* Copy: the secondary button – white with the card's hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) 0 calc(var(--tc-control-px-md) - 2px); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy-icon { display: grid; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted); animation: ui-pli-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy-icon[data-done] { color: var(--tc-status-success-fg); }
/* Use: the primary dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__use { position: relative; display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 calc(var(--tc-control-px-md) - 2px) 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pli__use:hover:not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-hover); }
.ui-pli__use:active:not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-active); }
.ui-pli__use:hover:not([aria-disabled="true"]) svg { transform: translateX(2px); }
.ui-pli__use[aria-disabled="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-muted); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__use[data-pulse="a"] { animation: ui-pli-pulse-a 1400ms var(--tc-ease-decelerate); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__use[data-pulse="b"] { animation: ui-pli-pulse-b 1400ms var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__use[data-pulse="a"] { animation: ui-pli-pulse-a-clean 1400ms var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__use[data-pulse="b"] { animation: ui-pli-pulse-b-clean 1400ms var(--tc-ease-decelerate); }
@keyframes ui-pli-in { from { opacity: 0; filter: blur(2px); transform: translateY(3px); } }
@keyframes ui-pli-out { to { opacity: 0; filter: blur(2px); } }
@keyframes ui-pli-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-pli-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
@keyframes ui-pli-flash-a { from { background-color: var(--tc-prompt-library-flash); } }
@keyframes ui-pli-flash-b { from { background-color: var(--tc-prompt-library-flash); } }
@keyframes ui-pli-mark-a { from { background-color: var(--tc-prompt-library-flash); box-shadow: 0 0 0 2px var(--tc-prompt-library-flash); } to { background-color: transparent; box-shadow: 0 0 0 2px transparent; } }
@keyframes ui-pli-mark-b { from { background-color: var(--tc-prompt-library-flash); box-shadow: 0 0 0 2px var(--tc-prompt-library-flash); } to { background-color: transparent; box-shadow: 0 0 0 2px transparent; } }
@keyframes ui-pli-pulse-a { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tc-text-primary) 30%, transparent); } 60%, 100% { box-shadow: 0 0 0 8px transparent; } }
@keyframes ui-pli-pulse-b { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tc-text-primary) 30%, transparent); } 60%, 100% { box-shadow: 0 0 0 8px transparent; } }
/* Narrow: the list moves on top, the copy button keeps only its icon */
@container (max-width: 540px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pli__card { grid-template-columns: minmax(0, 1fr); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__side { border-right: 0; border-bottom: 1px solid var(--tc-border-default); }
}
@container (max-width: 360px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy { width: 28px; padding: 0; justify-content: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy-text { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__count .ui-pli__bars { display: none; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-pli__option { height: 40px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__search { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy,
:where([data-look="standard"], [data-look="standard"] *).ui-pli__use { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__body { line-height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__token,
:where([data-look="standard"], [data-look="standard"] *).ui-pli__input,
:where([data-look="standard"], [data-look="standard"] *).ui-pli__sizer { height: 26px; line-height: 26px; }
}
@keyframes ui-pli-pulse-a-clean { 0% { box-shadow: 0 0 0 0 var(--tc-prompt-library-pulse); } 60%, 100% { box-shadow: 0 0 0 6px transparent; } }
@keyframes ui-pli-pulse-b-clean { 0% { box-shadow: 0 0 0 0 var(--tc-prompt-library-pulse); } 60%, 100% { box-shadow: 0 0 0 6px transparent; } }
/* Narrow: the list moves on top, the copy button keeps only its icon */
@container (max-width: 540px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pli__cols { grid-template-columns: minmax(0, 1fr); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__side { border-right: 0; border-bottom: 0.5px solid var(--tc-border-default); }
}
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy { width: 28px; padding: 0; justify-content: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy-text { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__count .ui-pli__bars { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__panel { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__foot { padding-left: var(--tc-space-3); }
}
/* Touch screens: taller targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__search { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy,
:where([data-look="clean"], [data-look="clean"] *).ui-pli__use { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy { padding-right: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__foot { height: 50px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__body { line-height: var(--tc-line-height-display); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__token,
:where([data-look="clean"], [data-look="clean"] *).ui-pli__input,
:where([data-look="clean"], [data-look="clean"] *).ui-pli__sizer { height: 26px; line-height: 26px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="pli"] *, [data-ui="pli"] *::before, [data-ui="pli"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-prompt-library")) customElements.define("tc-prompt-library", TcPromptLibrary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-prompt-library": TcPromptLibrary;
  }
}
