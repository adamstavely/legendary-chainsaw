import { html, svg } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";

/*
 * <tc-glow-keyboard> – the Lit port of illustrations/glow-keyboard.tsx: an AI chat input above a glass keyboard and a
 * moving gradient floor. The prompt types itself, key by key, with a human rhythm and the odd typo; click the input
 * to type yourself. Every key press lights up the keyboard and sends a wave up out of the gradient and a flash
 * through the glow. Enter sends the prompt (tc-submit), except while an IME is composing.
 *
 *   <tc-glow-keyboard .prompts=${["Find a quiet hike near Zermatt"]} @tc-submit=${(e) => send(e.detail.text)}></tc-glow-keyboard>
 *
 * The artwork keeps an 11 : 6 frame and scales with its container. The demo types each prompt once and then the scene
 * rests (data-resting): the floor and the glow hold still, and only the user's own key presses still send waves
 * (WCAG 2.2.2). Everything holds while it's off screen or the tab is hidden (data-paused); prefers-reduced-motion keeps
 * it still (typing still works). Colours follow the page theme through light-dark(). The host is a group named by
 * `label`; the input inside is named by the placeholder.
 */

/** [key id, legend, left, top, width, height, classes] – a Mac keyboard with German ISO layout, 1575 × 634 */
type Key = [string, string, number, number, number, number, string];
const KEYS: Key[] = [
  ["Escape", "esc", 24, 24, 149, 56, "mod sm"],
  ["F1", "F1", 183, 24, 96, 56, "fkey"],
  ["F2", "F2", 289, 24, 96, 56, "fkey"],
  ["F3", "F3", 395, 24, 96, 56, "fkey"],
  ["F4", "F4", 501, 24, 96, 56, "fkey"],
  ["F5", "F5", 607, 24, 96, 56, "fkey"],
  ["F6", "F6", 713, 24, 96, 56, "fkey"],
  ["F7", "F7", 819, 24, 96, 56, "fkey"],
  ["F8", "F8", 925, 24, 96, 56, "fkey"],
  ["F9", "F9", 1031, 24, 96, 56, "fkey"],
  ["F10", "F10", 1137, 24, 96, 56, "fkey"],
  ["F11", "F11", 1243, 24, 96, 56, "fkey"],
  ["F12", "F12", 1349, 24, 96, 56, "fkey"],
  ["", "", 1455, 24, 96, 56, "touchid"],
  ["^", "^", 24, 90, 96, 96, ""],
  ["1", "1", 130, 90, 96, 96, ""],
  ["2", "2", 236, 90, 96, 96, ""],
  ["3", "3", 342, 90, 96, 96, ""],
  ["4", "4", 448, 90, 96, 96, ""],
  ["5", "5", 554, 90, 96, 96, ""],
  ["6", "6", 660, 90, 96, 96, ""],
  ["7", "7", 766, 90, 96, 96, ""],
  ["8", "8", 872, 90, 96, 96, ""],
  ["9", "9", 978, 90, 96, 96, ""],
  ["0", "0", 1084, 90, 96, 96, ""],
  ["\u00df", "\u00df", 1190, 90, 96, 96, ""],
  ["\u00b4", "\u00b4", 1296, 90, 96, 96, ""],
  ["Backspace", "\u232b", 1402, 90, 149, 96, "mod"],
  ["Tab", "\u21e5", 24, 196, 149, 96, "mod"],
  ["q", "q", 183, 196, 96, 96, ""],
  ["w", "w", 289, 196, 96, 96, ""],
  ["e", "e", 395, 196, 96, 96, ""],
  ["r", "r", 501, 196, 96, 96, ""],
  ["t", "t", 607, 196, 96, 96, ""],
  ["z", "z", 713, 196, 96, 96, ""],
  ["u", "u", 819, 196, 96, 96, ""],
  ["i", "i", 925, 196, 96, 96, ""],
  ["o", "o", 1031, 196, 96, 96, ""],
  ["p", "p", 1137, 196, 96, 96, ""],
  ["\u00fc", "\u00fc", 1243, 196, 96, 96, ""],
  ["+", "+", 1349, 196, 96, 96, ""],
  ["Enter", "\u21a9", 1455, 196, 96, 202, "mod enter"],
  ["CapsLock", "\u21ea", 24, 302, 149, 96, "mod"],
  ["a", "a", 183, 302, 96, 96, ""],
  ["s", "s", 289, 302, 96, 96, ""],
  ["d", "d", 395, 302, 96, 96, ""],
  ["f", "f", 501, 302, 96, 96, ""],
  ["g", "g", 607, 302, 96, 96, ""],
  ["h", "h", 713, 302, 96, 96, ""],
  ["j", "j", 819, 302, 96, 96, ""],
  ["k", "k", 925, 302, 96, 96, ""],
  ["l", "l", 1031, 302, 96, 96, ""],
  ["\u00f6", "\u00f6", 1137, 302, 96, 96, ""],
  ["\u00e4", "\u00e4", 1243, 302, 96, 96, ""],
  ["#", "#", 1349, 302, 96, 96, ""],
  ["ShiftLeft", "\u21e7", 24, 408, 122.5, 96, "mod"],
  ["", "<", 156.5, 408, 96, 96, ""],
  ["y", "y", 262.5, 408, 96, 96, ""],
  ["x", "x", 368.5, 408, 96, 96, ""],
  ["c", "c", 474.5, 408, 96, 96, ""],
  ["v", "v", 580.5, 408, 96, 96, ""],
  ["b", "b", 686.5, 408, 96, 96, ""],
  ["n", "n", 792.5, 408, 96, 96, ""],
  ["m", "m", 898.5, 408, 96, 96, ""],
  [",", ",", 1004.5, 408, 96, 96, ""],
  [".", ".", 1110.5, 408, 96, 96, ""],
  ["-", "-", 1216.5, 408, 96, 96, ""],
  ["ShiftRight", "\u21e7", 1322.5, 408, 228.5, 96, "mod"],
  ["Fn", "fn", 24, 514, 96, 96, "mod sm"],
  ["ControlLeft", "\u2303", 130, 514, 96, 96, "mod"],
  ["AltLeft", "\u2325", 236, 514, 96, 96, "mod"],
  ["MetaLeft", "\u2318", 342, 514, 122.5, 96, "mod"],
  ["Space", "", 474.5, 514, 520, 96, "space"],
  ["MetaRight", "\u2318", 1004.5, 514, 122.5, 96, "mod"],
  ["AltRight", "\u2325", 1137, 514, 96, 96, "mod"],
  ["ArrowLeft", "\u2190", 1243, 514, 96, 96, "mod arrow"],
  ["ArrowUp", "\u2191", 1349, 514, 96, 45.5, "mod arrow half"],
  ["ArrowDown", "\u2193", 1349, 564.5, 96, 45.5, "mod arrow half"],
  ["ArrowRight", "\u2192", 1455, 514, 96, 96, "mod arrow"],
];

/** Base points of both floor shapes: peaks (l, m, r) and valleys (vL, vR) move independently */
type Shape = {
  k: number;
  v1: [number, number]; c: [number, number]; l: [number, number]; bottom: number; r: [number, number];
  v4: [number, number]; v3: [number, number]; m2: [number, number]; m1: [number, number]; v2: [number, number];
};
const COLOR: Shape = {
  k: 1, v1: [926.8, 565.8], c: [302.1, 297.3], l: [291.3, 291.3], bottom: 1222.8, r: [3155.8, 361.3],
  v4: [2493.8, 565.8], v3: [2189.3, 565.8], m2: [1898.8, 428.8], m1: [1510.8, 428.8], v2: [1230.8, 565.8],
};
const LIGHT: Shape = {
  k: 0.8427, v1: [781.039, 476.815], c: [254.588, 250.543], l: [245.486, 245.486], bottom: 1030.49, r: [2659.48, 304.477],
  v4: [2101.59, 476.815], v3: [1844.98, 476.815], m2: [1600.17, 361.361], m1: [1273.19, 361.361], v2: [1037.23, 476.815],
};
const PERIOD = 6000;
const PEAK = 60;
const VALLEY = 45;
/** Frame → SVG offsets of the two floor layers (both SVGs are 1 : 1 with the 2200 frame) */
const COLOR_OFF = { x: 581.3, y: 461.7 };
const LIGHT_OFF = { x: 310.5, y: 676.5 };
const KB = { left: 312.5, width: 1575 };

function shapePath(p: Shape, t: number) {
  const d = {
    l: PEAK * Math.sin(t),
    m: -PEAK * Math.sin(t + 0.5),
    r: PEAK * Math.sin(t + 1),
    vL: VALLEY * Math.sin(t + Math.PI / 2 + 0.25),
    vR: VALLEY * Math.sin(t - Math.PI / 2 + 0.75),
  };
  const y = (pt: [number, number], dy: number) => (pt[1] + dy * p.k).toFixed(1);
  return (
    `M${p.v1[0]} ${y(p.v1, d.vL)}` +
    `C${p.v1[0]} ${y(p.v1, d.vL)} ${p.c[0]} ${y(p.c, d.l)} ${p.l[0]} ${y(p.l, d.l)}` +
    `V${p.bottom}H${p.r[0]}V${y(p.r, d.r)}` +
    `L${p.v4[0]} ${y(p.v4, d.vR)}H${p.v3[0]}V${y(p.v3, d.vR)}` +
    `L${p.m2[0]} ${y(p.m2, d.m)}H${p.m1[0]}V${y(p.m1, d.m)}` +
    `L${p.v2[0]} ${y(p.v2, d.vL)}H${p.v1[0]}V${y(p.v1, d.vL)}Z`
  );
}

/** Wave that rises out of the floor: fast up, soft down; -1 once it is over */
function envelope(t: number) {
  const A = 160;
  const D = 1200;
  if (t < A) return Math.sin((Math.PI / 2) * (t / A));
  if (t < A + D) return 0.5 * (1 + Math.cos((Math.PI * (t - A)) / D));
  return -1;
}

/** Physical key → key id on the drawn keyboard */
const BY_CODE: Record<string, string> = {
  ShiftLeft: "ShiftLeft", ShiftRight: "ShiftRight", ControlLeft: "ControlLeft", ControlRight: "ControlLeft",
  AltLeft: "AltLeft", AltRight: "AltRight", MetaLeft: "MetaLeft", MetaRight: "MetaRight", OSLeft: "MetaLeft", OSRight: "MetaRight",
  Space: "Space", Backspace: "Backspace", Delete: "Backspace", Tab: "Tab", Enter: "Enter", NumpadEnter: "Enter",
  CapsLock: "CapsLock", Escape: "Escape", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", ArrowUp: "ArrowUp", ArrowDown: "ArrowDown",
};
/** Physical position → German legend, for shifted, option and dead keys */
const CODE_CHAR: Record<string, string> = {
  Minus: "ß", Equal: "´", BracketLeft: "ü", BracketRight: "+", Semicolon: "ö", Quote: "ä", Backslash: "#",
  Comma: ",", Period: ".", Slash: "-", Backquote: "^", IntlBackslash: "^", KeyY: "z", KeyZ: "y",
};
const KEY_IDS = new Set(KEYS.map((k) => k[0]).filter(Boolean));
function resolveKey(e: { code: string; key: string }) {
  if (BY_CODE[e.code]) return BY_CODE[e.code];
  if (/^F([1-9]|1[0-2])$/.test(e.code)) return e.code;
  if (e.key.length === 1 && KEY_IDS.has(e.key.toLowerCase())) return e.key.toLowerCase();
  if (/^Digit\d$/.test(e.code)) return e.code.slice(5);
  if (CODE_CHAR[e.code]) return CODE_CHAR[e.code];
  if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase();
  return null;
}

const defaultPrompts = ["Find a quiet hike near Zermatt", "Plan a sunrise climb for Saturday", "What should I pack for two days?"];
/** What the typing demo needs from the scene */
type Typist = {
  sleep: (ms: number) => Promise<void>;
  press: (k: string) => void;
  release: (k: string) => void;
  surge: (k: string) => void;
  submit: () => void;
  stopped: () => boolean;
  prompts: () => string[];
  set: (value: string) => void;
  value: () => string;
};

/** Types each prompt by itself, slow and human, with one typo in the first, then sends it with Enter */
async function typeDemo({ sleep, press, release, surge, submit, stopped: stop, prompts, set, value }: Typist) {
  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  const tap = async (k: string, hold = rand(130, 180)) => {
    press(k);
    surge(k);
    await sleep(hold);
    release(k);
  };
  const typeChar = async (ch: string) => {
    if (ch === " ") {
      await tap("Space");
      set(value() + " ");
      return;
    }
    const lower = ch.toLowerCase();
    if (!KEY_IDS.has(lower)) {
      set(value() + ch);
      return;
    }
    if (ch !== lower) {
      // Capital: hold shift around the letter
      press("ShiftLeft");
      await sleep(rand(60, 90));
      press(lower);
      surge(lower);
      set(value() + ch);
      await sleep(rand(130, 170));
      release(lower);
      await sleep(60);
      release("ShiftLeft");
      return;
    }
    press(lower);
    surge(lower);
    set(value() + ch);
    await sleep(rand(130, 180));
    release(lower);
  };
  // Sleeps also wait while the scene is off screen, so the demo picks up where it left off
  await sleep(1700); // let the entry animation finish
  // Each prompt once, then the demo is over and the scene rests
  for (let round = 0; !stop() && round < prompts().length; round++) {
    const text = prompts()[round];
    // One typo in the first prompt, after its first word and a bit
    const typoAt = round === 0 ? Math.min(text.length - 1, (text.indexOf(" ") + 4) || 4) : -1;
    for (let i = 0; i < text.length; i++) {
      if (stop()) return;
      if (i === typoAt) {
        await typeChar("w");
        await sleep(rand(320, 420));
        await tap("Backspace");
        set(value().slice(0, -1));
        await sleep(rand(160, 220));
      }
      await typeChar(text[i]);
      await sleep(text[i] === " " ? rand(220, 380) : rand(110, 260)); // uneven rhythm like a person
    }
    await sleep(1600);
    if (stop()) return;
    await tap("Enter");
    submit();
    await sleep(1100);
  }
}


/** Whether the user asked for reduced motion */
const reducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** A length in the 2200 × 1200 design frame, scaled to the container */
function u(n: number) {
  return `calc(${n} * var(--tc-glow-keyboard-u))`;
}

let seq = 0;

/** Detail of tc-submit: the prompt sent with Enter */
export type GlowKeyboardSubmit = { text: string };

/**
 * An AI chat input above a glass keyboard and a moving gradient floor; the prompt types itself, key by key.
 * @tag tc-glow-keyboard
 * @fires tc-submit - A prompt was sent with Enter, by the demo or by the user. Detail: { text: string }
 */
export class TcGlowKeyboard extends TcElement {
  static override ui = "gk";
  static override looks = false;

  /** Prompts the demo types one after another, once each – each one is sent with Enter */
  @property({ attribute: false }) accessor prompts: string[] = defaultPrompts;
  /** Placeholder in the chat input (also its accessible name) */
  @property() accessor placeholder = "Ask AI anything...";
  /** Accessible name of the scene (the host is a group) */
  @property() accessor label = "AI chat input above a glass keyboard and a moving colour gradient";

  /** @internal Gradient and filter ids, unique per instance */
  private readonly uid = `ui-gk${++seq}`;
  /** @internal Stops the scene's loops, timers and listeners */
  private teardown?: () => void;
  /** @internal The page named the group itself (aria-label or aria-labelledby on the host) */
  private ownName = false;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.label) || this.hasAttribute("aria-labelledby");
    this.addEventListener("pointerdown", this.onPointerDown);
    if (this.hasUpdated) this.teardown ??= this.scene();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pointerdown", this.onPointerDown);
    this.teardown?.();
    this.teardown = undefined;
  }

  protected override firstUpdated() {
    this.teardown ??= this.scene();
  }

  protected override updated() {
    if (!this.ownName) this.setAttribute("aria-label", this.label);
  }

  /** @internal A click anywhere on the scene puts the cursor into the input */
  private onPointerDown = (e: PointerEvent) => {
    const input = this.querySelector<HTMLInputElement>(".ui-gk-prompt");
    if (e.target !== input) {
      e.preventDefault();
      input?.focus();
    }
  };

  /** @internal Everything that moves: the floor, the waves, the glow flashes, the pressed keys and the typing demo */
  private scene() {
    const el = this as HTMLElement;
    const id = this.uid;
    const field = this.querySelector<HTMLInputElement>(".ui-gk-prompt");
    const pathC = this.querySelector<SVGPathElement>(".ui-gk-floor--color path");
    const pathL = this.querySelector<SVGPathElement>(".ui-gk-floor--light path");
    if (!field || !pathC || !pathL) return undefined;
    const still = reducedMotion();
    const svgC = pathC.ownerSVGElement!;
    const svgL = pathL.ownerSVGElement!;
    const composer = el.querySelector<HTMLElement>(".ui-gk-composer")!;
    const glowHard = el.querySelector<HTMLElement>(".ui-gk-glow--hard")!;
    const keyEls = new Map<string, HTMLElement>();
    el.querySelectorAll<HTMLElement>("[data-k]").forEach((k) => keyEls.set(k.dataset.k!, k));
    const unit = () => el.clientWidth / 2200;

    /* Waves out of the floor */
    const NS = "http://www.w3.org/2000/svg";
    const bumps: { c: SVGEllipseElement; l: SVGEllipseElement; t0: number }[] = [];
    const addBump = (frameX: number) => {
      if (still) return;
      const c = document.createElementNS(NS, "ellipse");
      c.setAttribute("fill", `url(#${id}-floor)`);
      c.setAttribute("rx", "230");
      c.setAttribute("ry", "320");
      c.setAttribute("cx", String(frameX + COLOR_OFF.x));
      c.setAttribute("cy", String(1361.7 - COLOR_OFF.y));
      // Its fill comes from the CSS (.ui-gk-floor--light ellipse), so it follows the theme
      const l = document.createElementNS(NS, "ellipse");
      l.setAttribute("rx", "200");
      l.setAttribute("ry", "260");
      l.setAttribute("cx", String(frameX + LIGHT_OFF.x));
      l.setAttribute("cy", String(1401.7 - LIGHT_OFF.y));
      svgC.appendChild(c);
      svgL.appendChild(l);
      bumps.push({ c, l, t0: performance.now() });
      if (bumps.length > 14) {
        const b = bumps.shift()!;
        b.c.remove();
        b.l.remove();
      }
    };

    /* Floor morph and waves – one loop, only while on screen and the tab is visible. Once the scene rests, the
       floor holds its shape and the loop only runs while waves from the user's key presses are still up */
    let frame = 0;
    let visible = false;
    let resting = false;
    let drawn = 0;
    let last = 0; // previous frame; the floor's own clock only advances while it moves, so it never jumps
    let clock = 0;
    const tick = (now: number) => {
      if (resting && bumps.length === 0) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
      if (!resting) clock += last ? Math.min(now - last, 100) : 0;
      last = now;
      // The floor moves slowly under a heavy blur – 30 redraws a second look the same as 60
      if (now - drawn < 32) return;
      drawn = now;
      const t = (clock / PERIOD) * Math.PI * 2;
      pathC.setAttribute("d", shapePath(COLOR, t));
      pathL.setAttribute("d", shapePath(LIGHT, t));
      for (let i = bumps.length - 1; i >= 0; i--) {
        const b = bumps[i];
        const a = envelope(now - b.t0);
        if (a < 0) {
          b.c.remove();
          b.l.remove();
          bumps.splice(i, 1);
          continue;
        }
        // The light layer rises less, so it never outshines the colour layer
        b.c.setAttribute("cy", (1361.7 - a * 470 - COLOR_OFF.y).toFixed(1));
        b.l.setAttribute("cy", (1401.7 - a * 330 - LIGHT_OFF.y).toFixed(1));
      }
    };

    /* Flash in the input glow at the key's position, in the colour the glow has there right now */
    const swapPhase = () => {
      const a = glowHard.getAnimations({ subtree: true }).find((x) => (x as CSSAnimation).animationName === "ui-gk-swap");
      const ms = Number(a?.currentTime ?? 0);
      return (1 - Math.cos((2 * Math.PI * (ms % 6000)) / 6000)) / 2;
    };
    const flashGlow = (rel: number) => {
      if (still) return;
      const p = swapPhase();
      const pink = rel * (1 - p) + (1 - rel) * p;
      const g = Math.round(119 * (1 - pink));
      const b = Math.round(85 * pink);
      const s = unit();
      const hit = document.createElement("div");
      hit.className = "ui-gk-hit";
      hit.style.left = `${(578.36 + rel * 1037.79 - 170) * s}px`;
      hit.style.background = `radial-gradient(closest-side, rgba(255,${g},${b},.95), rgba(255,${g},${b},0))`;
      composer.insertBefore(hit, glowHard);
      hit.animate(
        [
          { opacity: 0, transform: "scale(.8, 1)", filter: `blur(${14 * s}px)` },
          { opacity: 0.6, transform: `translateY(${-2 * s}px) scale(1.1, 1.35)`, filter: `blur(${22 * s}px)`, offset: 0.15 },
          { opacity: 0, transform: "scale(1.2, 1.15)", filter: `blur(${30 * s}px)` },
        ],
        { duration: 1100, easing: "ease-out" },
      ).onfinish = () => hit.remove();
    };

    /* Every timeout of the demo and the key releases, so disconnecting can clear what's still pending */
    const timeouts = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timeouts.delete(t);
        fn();
      }, ms);
      timeouts.add(t);
    };

    /* Pressed keys: quick taps stay visible for a moment */
    const downAt = new Map<string, number>();
    const press = (k: string) => {
      const key = keyEls.get(k);
      if (!key) return;
      key.setAttribute("data-down", "");
      downAt.set(k, performance.now());
    };
    const release = (k: string) => {
      const key = keyEls.get(k);
      if (!key) return;
      const wait = Math.max(0, 150 - (performance.now() - (downAt.get(k) ?? 0)));
      downAt.delete(k);
      later(() => {
        if (!downAt.has(k)) key.removeAttribute("data-down");
      }, wait);
    };
    const releaseAll = () => [...downAt.keys()].forEach(release);
    const surge = (k: string) => {
      const key = keyEls.get(k);
      if (!key || !visible) return;
      const rel = Math.min(1, Math.max(0, (key.offsetLeft + key.offsetWidth / 2) / (KB.width * unit())));
      addBump(120 + rel * 1960);
      flashGlow(rel);
      run();
    };
    /* (Re)start the loop, e.g. for a wave while the scene rests */
    const run = () => {
      if (frame || still || !visible) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    /* The demo is over (or the user took over): the ambient motion stops */
    const rest = () => {
      if (!alive) return;
      resting = true;
      el.setAttribute("data-resting", "");
    };
    const submit = () => {
      const text = field.value.trim();
      if (text) this.emit<GlowKeyboardSubmit>("tc-submit", { text });
      field.value = "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    };

    /* The user types: mirror every key, Enter sends */
    let userTook = false;
    const onDown = (e: KeyboardEvent) => {
      if (e.isTrusted) userTook = true;
      const k = resolveKey(e);
      if (k) press(k);
      if (k && !e.repeat) surge(k);
      if (e.key === "Enter" && !e.isComposing) {
        e.preventDefault();
        submit();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const k = resolveKey(e);
      if (k) release(k);
      // macOS swallows the keyup of other keys while ⌘ is held
      if (k === "MetaLeft" || k === "MetaRight") releaseAll();
    };
    const takeOver = () => {
      userTook = true;
    };
    field.addEventListener("keydown", onDown);
    field.addEventListener("keyup", onUp);
    field.addEventListener("blur", releaseAll);
    field.addEventListener("focus", takeOver);

    /* The demo: types each prompt by itself, slow and human, with one typo, then sends it */
    let alive = true;
    // Sleeps that end while the scene is off screen wait for it to come back; after disconnecting they never
    // resolve, so the demo just stops where it was
    let waiting: (() => void)[] = [];
    const sleep = (ms: number) => new Promise<void>((r) => later(() => (visible ? r() : waiting.push(r)), ms));
    const typist: Typist = {
      sleep,
      press,
      release,
      surge,
      submit,
      stopped: () => !alive || userTook,
      prompts: () => this.prompts,
      set: (v: string) => {
        field.value = v;
        field.dispatchEvent(new Event("input", { bubbles: true }));
      },
      value: () => field.value,
    };

    let started = false;
    let inView = false;
    let reported = false;
    const update = () => {
      const next = inView && document.visibilityState !== "hidden";
      if (next === visible && reported) return;
      reported = true;
      visible = next;
      cancelAnimationFrame(frame);
      frame = 0;
      el.toggleAttribute("data-paused", !visible);
      if (!visible) return;
      if (!started) {
        started = true;
        el.setAttribute("data-in", "");
        if (!still) void typeDemo(typist).then(rest);
      }
      const resume = waiting;
      waiting = [];
      resume.forEach((r) => r());
      run();
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            inView = entries[entries.length - 1].isIntersecting;
            update();
          });
    if (io) io.observe(el);
    else {
      inView = true;
      update();
    }
    document.addEventListener("visibilitychange", update);

    return () => {
      alive = false;
      timeouts.forEach(clearTimeout);
      timeouts.clear();
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
      cancelAnimationFrame(frame);
      field.removeEventListener("keydown", onDown);
      field.removeEventListener("keyup", onUp);
      field.removeEventListener("blur", releaseAll);
      field.removeEventListener("focus", takeOver);
      bumps.forEach((b) => {
        b.c.remove();
        b.l.remove();
      });
    };
  }

  protected override render() {
    const id = this.uid;
    return html`<div class="ui-gk-frame">
      <div class="ui-gk-floor ui-gk-floor--color" aria-hidden="true">
        <div class="ui-gk-bleed">
          <svg viewBox="0 0 3447.1 1514.1" preserveAspectRatio="none">
            ${svg`<defs>
              <linearGradient id=${`${id}-floor`} x1="1723.8" y1="423.3" x2="1723.8" y2="894.3" gradientUnits="userSpaceOnUse">
                <stop stop-color="#FF7700"></stop>
                <stop offset="0.302885" stop-color="#FF0055"></stop>
                <stop offset="0.673077" stop-color="#0073FF"></stop>
              </linearGradient>
            </defs>
            <path d=${shapePath(COLOR, 0)} fill=${`url(#${id}-floor)`}></path>`}
          </svg>
        </div>
      </div>
      <div class="ui-gk-floor ui-gk-floor--light" aria-hidden="true">
        <div class="ui-gk-bleed">
          <svg viewBox="0 0 2904.96 1275.97" preserveAspectRatio="none">${svg`<path d=${shapePath(LIGHT, 0)}></path>`}</svg>
        </div>
      </div>

      <div class="ui-gk-composer">
        <div class="ui-gk-glow ui-gk-glow--soft" aria-hidden="true"></div>
        <div class="ui-gk-glow-mid" aria-hidden="true"></div>
        <div class="ui-gk-glow ui-gk-glow--hard" aria-hidden="true"></div>
        <div class="ui-gk-ring" aria-hidden="true"></div>
        <div class="ui-gk-input">
          <div class="ui-gk-glass" aria-hidden="true"></div>
          <svg class="ui-gk-orb" viewBox="0 0 95.5862 95.5862" aria-hidden="true">
            ${svg`<defs>
              <radialGradient id=${`${id}-orb`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(47.7931 9.55862) rotate(90) scale(86.0276)">
                <stop offset="0.221154" stop-color="#FF7700"></stop>
                <stop offset="1" stop-color="#FF2A91"></stop>
              </radialGradient>
              <filter id=${`${id}-orb-glow`} x="0" y="0" width="95.5862" height="95.5862" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="alpha"></feColorMatrix>
                <feGaussianBlur stdDeviation="21.3703"></feGaussianBlur>
                <feComposite in2="alpha" operator="arithmetic" k2="-1" k3="1"></feComposite>
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"></feColorMatrix>
                <feBlend mode="normal" in2="SourceGraphic"></feBlend>
              </filter>
            </defs>
            <circle cx="47.7931" cy="47.7931" r="47.7931" fill=${`url(#${id}-orb)`} filter=${`url(#${id}-orb-glow)`}></circle>`}
          </svg>
          <span class="ui-gk-field">
            <span class="ui-gk-caret" aria-hidden="true"></span>
            <input class="ui-gk-prompt" type="text" placeholder=${this.placeholder} aria-label=${this.placeholder} autocomplete="off" spellcheck="false" />
          </span>
          <div class="ui-gk-glass ui-gk-glass--inner" aria-hidden="true"></div>
        </div>
      </div>

      <div class="ui-gk-keyboard" aria-hidden="true">
        ${KEYS.map(
          ([k, legend, left, top, width, height, cls]) =>
            html`<span
              class=${["ui-gk-key", ...cls.split(" ").filter(Boolean).map((c) => `ui-gk-key--${c}`)].join(" ")}
              data-k=${ifDefined(k || undefined)}
              style=${styleMap({ left: u(left), top: u(top), width: u(width), height: u(height) })}
              >${legend}</span
            >`,
        )}
      </div>
    </div>`;
  }

  static override css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="gk"] {
  /* Theme colours. In dark the white plus-lighter layers would wash the page grey, so they only keep a soft hot
     core (30 % of the floor's white, 55 % of the ring's); the caps get a faint top edge */
  --tc-glow-keyboard-bg: light-dark(#fafafa, #111113);
  --tc-glow-keyboard-floor-white: light-dark(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.24));
  --tc-glow-keyboard-ring-white: light-dark(#ffffff, rgba(255, 255, 255, 0.55));
  /* One beat of the floor drift and of the glow swap / breathe; they rest with the scene */
  --tc-glow-keyboard-beat: 6s;
  --tc-glow-keyboard-breathe: 4s;
  --tc-glow-keyboard-blink: 1.06s;
  --tc-glow-keyboard-tap: 60ms;
  --tc-glow-keyboard-input-border: light-dark(#fff, rgba(255, 255, 255, 0.14));
  --tc-glow-keyboard-input-bg: light-dark(rgba(255, 255, 255, 0.9), rgba(24, 24, 27, 0.88));
  --tc-glow-keyboard-input-inner: light-dark(#fff, rgba(255, 255, 255, 0.04));
  --tc-glow-keyboard-caret: light-dark(rgba(175, 175, 175, 0.4), rgba(255, 255, 255, 0.3));
  --tc-glow-keyboard-text: light-dark(#676767, #e4e4e7);
  --tc-glow-keyboard-placeholder: light-dark(#afafaf, #737378);
  --tc-glow-keyboard-board-border: light-dark(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.08));
  --tc-glow-keyboard-board-bg: light-dark(rgba(255, 255, 255, 0.16), rgba(14, 14, 16, 0.5));
  --tc-glow-keyboard-board-inner: light-dark(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.03));
  --tc-glow-keyboard-board-shadow: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.5));
  --tc-glow-keyboard-key-bg: light-dark(rgba(255, 255, 255, 0.72), rgba(32, 32, 35, 0.86));
  --tc-glow-keyboard-key-edge: inset 0 ${u(1.5)} 0 light-dark(transparent, rgba(255, 255, 255, 0.08));
  --tc-glow-keyboard-key-drop: light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.6));
  --tc-glow-keyboard-key-inner: light-dark(rgba(255, 255, 255, 0.6), rgba(0, 0, 0, 0.18));
  --tc-glow-keyboard-key-text: light-dark(rgba(20, 20, 30, 0.5), rgba(235, 235, 245, 0.6));
  --tc-glow-keyboard-touchid: light-dark(rgba(20, 20, 30, 0.25), rgba(235, 235, 245, 0.22));
  --tc-glow-keyboard-key-down-bg: light-dark(rgba(206, 206, 214, 0.97), rgba(56, 56, 62, 0.97));
  --tc-glow-keyboard-key-down-text: light-dark(rgba(20, 20, 30, 0.9), rgba(255, 255, 255, 0.95));
  --tc-glow-keyboard-key-down-inner: light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.4));
  container-type: inline-size;
  width: 100%;
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
  cursor: text;
}
.ui-gk-frame {
  --tc-glow-keyboard-u: calc(100cqw / 2200);
  position: relative;
  aspect-ratio: 2200 / 1200;
  overflow: hidden;
  isolation: isolate;
  background: var(--tc-glow-keyboard-bg);
}
.ui-gk-frame > * { position: absolute; margin: 0; }

/* Gradient floor */
.ui-gk-floor--color { left: ${u(-290)}; top: ${u(753)}; width: ${u(2864.5)}; height: ${u(931.5)}; }
.ui-gk-floor--light { left: ${u(-65)}; top: ${u(922)}; width: ${u(2414)}; height: ${u(785)}; mix-blend-mode: plus-lighter; }
.ui-gk-floor--light :is(path, ellipse) { fill: var(--tc-glow-keyboard-floor-white); }
.ui-gk-bleed { position: absolute; inset: -31.27% -10.17%; transform-origin: 50% 70%; will-change: transform; }
/* The floor is so soft that it can be drawn at a quarter of its size and scaled up 4× on the GPU –
   it looks the same, but every redraw of the moving shapes costs about a sixteenth */
.ui-gk-bleed svg {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 25%;
  height: 25%;
  overflow: visible;
  transform: scale(4);
  transform-origin: 0 0;
  will-change: transform;
}
.ui-gk-floor--color svg { filter: blur(calc(${u(145.65)} / 4)); }
.ui-gk-floor--light svg { filter: blur(calc(${u(122.74)} / 4)); }
/* Both layers drift on the same slow beat; the light one moves a little less */
.ui-gk-floor--color .ui-gk-bleed { animation: ui-gk-drift-color var(--tc-glow-keyboard-beat) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) infinite; }
.ui-gk-floor--light .ui-gk-bleed { animation: ui-gk-drift-light var(--tc-glow-keyboard-beat) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) infinite; }
@keyframes ui-gk-drift-color {
  0%, 100% { transform: translate(0, 0) scale(1, 1); }
  33% { transform: translate(${u(-120)}, ${u(-20)}) scale(1.05, 1.08); }
  66% { transform: translate(${u(100)}, ${u(12)}) scale(0.98, 0.96); }
}
@keyframes ui-gk-drift-light {
  0%, 100% { transform: translate(0, 0) scale(1, 1); }
  33% { transform: translate(${u(-100)}, ${u(-10)}) scale(1.03, 1); }
  66% { transform: translate(${u(85)}, ${u(10)}) scale(0.98, 0.94); }
}

/* Chat input and its glow */
.ui-gk-composer { inset: 0; }
.ui-gk-composer > * { position: absolute; }
.ui-gk-glow {
  left: ${u(578.36)};
  top: ${u(230)};
  width: ${u(1037.79)};
  height: ${u(152.94)};
  border-radius: ${u(163.86)};
}
/* Two blurred layers – orange → pink and pink → orange – that cross-fade, so the colours swap sides.
   Only opacity moves, so the GPU blends them without redrawing the blur */
.ui-gk-glow::before,
.ui-gk-glow::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  filter: var(--tc-glow-keyboard-glow-blur);
  will-change: opacity;
}
.ui-gk-glow::before { background-image: linear-gradient(to right, var(--tc-glow-keyboard-glow-a), var(--tc-glow-keyboard-glow-b)); }
.ui-gk-glow::after {
  background-image: linear-gradient(to right, var(--tc-glow-keyboard-glow-b), var(--tc-glow-keyboard-glow-a));
  opacity: 0;
  animation: ui-gk-swap var(--tc-glow-keyboard-beat) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) infinite;
}
.ui-gk-glow--soft {
  --tc-glow-keyboard-glow-a: rgba(255, 119, 0, 0.3);
  --tc-glow-keyboard-glow-b: rgba(255, 0, 85, 0.3);
  --tc-glow-keyboard-glow-blur: blur(${u(54)});
}
.ui-gk-glow--hard {
  --tc-glow-keyboard-glow-a: #f70;
  --tc-glow-keyboard-glow-b: #f05;
  --tc-glow-keyboard-glow-blur: blur(${u(9.5)});
}
.ui-gk-glow-mid {
  left: ${u(817.25)};
  top: ${u(230)};
  width: ${u(560)};
  height: ${u(152.94)};
  border-radius: ${u(76.47)};
  background: radial-gradient(closest-side, rgba(255, 60, 45, 0.75), rgba(255, 60, 45, 0));
  /* A fixed blur; only transform and opacity move, so it stays on the GPU */
  filter: blur(${u(22)});
  will-change: transform, opacity;
  animation: ui-gk-breathe var(--tc-glow-keyboard-breathe) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) infinite;
}
/* Flash at the position of a pressed key */
.ui-gk-hit {
  top: ${u(230)};
  width: ${u(340)};
  height: ${u(152.94)};
  border-radius: ${u(76.47)};
  pointer-events: none;
}
@keyframes ui-gk-swap {
  50% { opacity: 1; }
}
@keyframes ui-gk-breathe {
  0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.7; }
  25% { transform: translateY(${u(-16)}) scaleY(1.4); opacity: 1; }
  50% { transform: translateY(0) scaleY(1.1); opacity: 0.8; }
  75% { transform: translateY(${u(16)}) scaleY(1.45); opacity: 1; }
}
/* White stroke around the glow, fading out at both ends */
.ui-gk-ring {
  left: ${u(576.86)};
  top: ${u(228.5)};
  width: ${u(1040.79)};
  height: ${u(155.94)};
  border: ${u(3)} solid transparent;
  border-radius: ${u(77.97)};
  background: linear-gradient(to right, rgba(255, 255, 255, 0) 0.14%, var(--tc-glow-keyboard-ring-white) 25%, var(--tc-glow-keyboard-ring-white) 75%, rgba(255, 255, 255, 0) 99.86%) border-box;
  -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0) border-box;
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  filter: blur(${u(5.74)});
  mix-blend-mode: plus-lighter;
}
.ui-gk-input {
  left: ${u(576.99)};
  top: ${u(230)};
  width: ${u(1046.09)};
  height: ${u(152.94)};
  display: flex;
  align-items: center;
  gap: ${u(20.59)};
  padding: ${u(27.31)};
  border: ${u(1.37)} solid var(--tc-glow-keyboard-input-border);
  border-radius: ${u(109.24)};
}
.ui-gk-glass { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; }
.ui-gk-input > .ui-gk-glass {
  background: var(--tc-glow-keyboard-input-bg);
  -webkit-backdrop-filter: blur(${u(25.48)});
  backdrop-filter: blur(${u(25.48)});
}
.ui-gk-input > .ui-gk-glass--inner {
  background: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  box-shadow: inset 0 0 ${u(35.91)} 0 var(--tc-glow-keyboard-input-inner), inset 0 0 ${u(35.91)} 0 var(--tc-glow-keyboard-input-inner);
}
.ui-gk-orb { position: relative; flex: none; width: ${u(95.59)}; height: ${u(95.59)}; }
.ui-gk-field { position: relative; flex: 1; display: flex; align-items: center; gap: ${u(8.19)}; min-width: 0; }
/* Drawn cursor that blinks like a native input – only while the input is empty */
.ui-gk-caret {
  flex: none;
  width: ${u(2.73)};
  height: ${u(60.08)};
  background: var(--tc-glow-keyboard-caret);
  animation: ui-gk-blink var(--tc-glow-keyboard-blink) step-end infinite;
}
.ui-gk-field:has(.ui-gk-prompt:not(:placeholder-shown)) .ui-gk-caret { visibility: hidden; }
@keyframes ui-gk-blink { 50% { opacity: 0; } }
.ui-gk-prompt {
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: ${u(46.43)};
  line-height: normal;
  color: var(--tc-glow-keyboard-text);
  caret-color: var(--tc-glow-keyboard-placeholder);
}
.ui-gk-prompt::placeholder { color: var(--tc-glow-keyboard-placeholder); opacity: 1; }
.ui-gk-prompt:placeholder-shown { caret-color: transparent; }
/* The focus ring goes around the whole pill rather than the bare text line (also against global
   :focus-visible rules of the host page) */
[data-ui="gk"] .ui-gk-prompt:focus-visible { outline: none; }
.ui-gk-input:focus-within {
  outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff));
  outline-offset: var(--tc-focus-ring-offset, 2px);
}

/* Glass keyboard */
.ui-gk-keyboard {
  left: ${u(312.5)};
  top: ${u(440)};
  width: ${u(1575)};
  height: ${u(634)};
  border: ${u(1.5)} solid var(--tc-glow-keyboard-board-border);
  border-radius: ${u(52)};
  background: var(--tc-glow-keyboard-board-bg);
  -webkit-backdrop-filter: blur(${u(24)});
  backdrop-filter: blur(${u(24)});
  box-shadow: inset 0 0 ${u(30)} var(--tc-glow-keyboard-board-inner), 0 ${u(22)} ${u(48)} var(--tc-glow-keyboard-board-shadow);
}
.ui-gk-key {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${u(20)};
  background-color: var(--tc-glow-keyboard-key-bg);
  box-shadow: var(--tc-glow-keyboard-key-edge), 0 ${u(1.5)} 0 var(--tc-glow-keyboard-key-drop), inset 0 0 ${u(12)} var(--tc-glow-keyboard-key-inner);
  font-size: ${u(44)};
  line-height: 1;
  color: var(--tc-glow-keyboard-key-text);
  user-select: none;
  transition: transform var(--tc-duration-moderate, 260ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)), background-color var(--tc-duration-moderate, 260ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)), color var(--tc-duration-moderate, 260ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)), box-shadow var(--tc-duration-moderate, 260ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1));
}
.ui-gk-key--mod { font-size: ${u(36)}; }
.ui-gk-key--sm { font-size: ${u(26)}; }
.ui-gk-key--fkey { font-size: ${u(22)}; border-radius: ${u(14)}; }
.ui-gk-key--arrow { font-size: ${u(28)}; }
.ui-gk-key--half { font-size: ${u(22)}; border-radius: ${u(12)}; }
.ui-gk-key--touchid { border-radius: ${u(14)}; }
.ui-gk-key--touchid::after {
  content: "";
  width: ${u(30)};
  height: ${u(30)};
  border: ${u(2)} solid var(--tc-glow-keyboard-touchid);
  border-radius: 50%;
}
/* Pressed */
.ui-gk-key[data-down] {
  transform: translateY(${u(3)}) scale(0.9);
  background-color: var(--tc-glow-keyboard-key-down-bg);
  color: var(--tc-glow-keyboard-key-down-text);
  box-shadow: inset 0 0 0 transparent, 0 0 0 rgba(0, 0, 0, 0), inset 0 ${u(2)} ${u(6)} var(--tc-glow-keyboard-key-down-inner);
  transition-duration: var(--tc-glow-keyboard-tap);
}

/* Entry: the input first, then the keyboard. Fill mode "backwards" only,
   so no stacking context stays behind – the glass and plus-lighter keep blending like the static frame */
[data-ui="gk"]:not([data-in]) .ui-gk-composer,
[data-ui="gk"]:not([data-in]) .ui-gk-keyboard { opacity: 0; }
[data-ui="gk"][data-in] .ui-gk-composer { animation: ui-gk-rise var(--tc-duration-reveal-slow, 900ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) var(--tc-duration-fast, 150ms) backwards; }
[data-ui="gk"][data-in] .ui-gk-keyboard { animation: ui-gk-rise var(--tc-duration-reveal-slow, 900ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) var(--tc-duration-slower, 420ms) backwards; }
@keyframes ui-gk-rise {
  from { opacity: 0; transform: translateY(${u(60)}); }
  to { opacity: 1; transform: none; }
}

/* Off screen, and once the demo is over: the loops hold still (the caret stops blinking, fully visible) */
[data-ui="gk"][data-paused] *,
[data-ui="gk"][data-paused] .ui-gk-glow::after,
[data-ui="gk"][data-resting] :is(.ui-gk-bleed, .ui-gk-glow-mid),
[data-ui="gk"][data-resting] .ui-gk-glow::after { animation-play-state: paused; }
[data-ui="gk"][data-resting] .ui-gk-caret { animation: none; }

@media (prefers-reduced-motion: reduce) {
  .ui-gk-bleed, .ui-gk-glow::after, .ui-gk-glow-mid, .ui-gk-caret,
  [data-ui="gk"][data-in] .ui-gk-composer, [data-ui="gk"][data-in] .ui-gk-keyboard { animation: none; }
  .ui-gk-key { transition: none; }
}
`;
}

if (!customElements.get("tc-glow-keyboard")) customElements.define("tc-glow-keyboard", TcGlowKeyboard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-glow-keyboard": TcGlowKeyboard;
  }
}
