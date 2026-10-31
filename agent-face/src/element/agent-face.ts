import { drawFace } from "../draw/draw-face";
import { FACE_STATES, FaceEngine, type FaceGesture, type FaceState } from "../engine";
import { addToLoop, removeFromLoop, type Tickable } from "./loop";

const MIN_SIZE = 16;
const MAX_SIZE = 256;
const DEFAULT_SIZE = 64;
// The pose can reach outside the box: a hop, a tilt, a spin. The canvas overhangs the box by this share on each side.
const BLEED = 0.25;
const DEFAULT_REST_AFTER_MS = 30000;
// Donovan is in the middle of something during these, so the small movements never fade out
const BUSY: readonly FaceState[] = ["listening", "thinking", "speaking"];

const PHRASES: Record<FaceState, (name: string) => string> = {
  idle: (name) => name,
  listening: (name) => `${name} is listening`,
  thinking: (name) => `${name} is thinking`,
  speaking: (name) => `${name} is speaking`,
  happy: (name) => `${name} is pleased`,
  confused: (name) => `${name} is unsure`,
  sleeping: (name) => `${name} is asleep`,
  error: (name) => `${name} hit a problem`,
  surprised: (name) => `${name} is surprised`,
};

const CSS = `
:host { display: inline-block; position: relative; width: var(--agent-face-size); height: var(--agent-face-size); vertical-align: middle; }
:host([hidden]) { display: none; }
canvas { position: absolute; inset: calc(var(--agent-face-size) * -${BLEED}); width: calc(var(--agent-face-size) * ${1 + BLEED * 2}); height: calc(var(--agent-face-size) * ${1 + BLEED * 2}); pointer-events: none; }
span { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`;

const isState = (value: string | null): value is FaceState => FACE_STATES.includes(value as FaceState);

/**
 * Donovan's face.
 *
 * @attr state - idle, listening, thinking, speaking, happy, confused, sleeping, error or surprised
 * @attr size - Width and height in pixels, 16 to 256. Default 64
 * @attr name - Who the screen-reader label names. Default Donovan
 * @attr label - Replaces the screen-reader label in every state
 * @attr announce - Also tells screen readers when the state changes. Off by default, so it doesn't talk over the chat
 * @attr motion - auto follows the system setting, or full or reduced. Default auto
 * @attr rest-after - How long, in ms, before the small movements fade out when Donovan isn't busy. Default 30000
 * @attr seed - Makes the small movements repeatable
 */
export class AgentFace extends HTMLElement implements Tickable {
  static observedAttributes = ["state", "size", "name", "label", "announce", "motion", "rest-after"];

  private readonly canvas: HTMLCanvasElement;
  private readonly status: HTMLSpanElement;
  private engine: FaceEngine | null = null;
  private observer: IntersectionObserver | null = null;
  private readonly reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  private onScreen = true;
  private looping = false;
  private quietFor = 0;
  private spokenState: FaceState | null = null;
  private amplitudeValue: number | null = null;
  private pixelRatio = 0;
  private labelsValue: Partial<Record<FaceState, string>> = {};

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CSS;
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("role", "img");
    this.status = document.createElement("span");
    root.append(style, this.canvas, this.status);
  }

  get state(): FaceState {
    const value = this.getAttribute("state");
    return isState(value) ? value : "idle";
  }
  set state(value: FaceState) {
    this.setAttribute("state", value);
  }

  /** Screen-reader labels per state, for translation */
  get labels(): Partial<Record<FaceState, string>> {
    return this.labelsValue;
  }
  set labels(value: Partial<Record<FaceState, string>>) {
    this.labelsValue = value;
    this.syncLabels();
  }

  /** What's on screen now, which can lag `state` while the last state finishes its minimum hold */
  get shownState(): FaceState {
    return this.engine?.state ?? this.state;
  }

  /** How loud the agent is, 0 to 1, to drive the mouth while speaking. null goes back to made-up speech */
  get amplitude(): number | null {
    return this.amplitudeValue;
  }
  set amplitude(value: number | null) {
    this.amplitudeValue = value;
    this.engine?.setAmplitude(value);
    this.wake();
  }

  /** Plays once. Returns false when reduced motion rules it out or the face isn't on the page */
  playGesture(gesture: FaceGesture): boolean {
    const played = this.engine?.playGesture(gesture) ?? false;
    if (played) this.wake();
    return played;
  }

  connectedCallback(): void {
    const seed = Number(this.getAttribute("seed"));
    this.engine ??= new FaceEngine({ seed: seed || Math.floor(Math.random() * 2 ** 31), state: this.state, motion: this.resolvedMotion() });
    this.engine.setAmplitude(this.amplitudeValue);
    this.spokenState = this.engine.state;
    this.applySize();
    this.syncLabels();
    this.reducedQuery.addEventListener("change", this.onMotionChange);
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("resize", this.redraw);
    this.observer = new IntersectionObserver((entries) => {
      this.onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
      this.updateLoop();
    });
    this.observer.observe(this);
    this.wake();
  }

  disconnectedCallback(): void {
    this.reducedQuery.removeEventListener("change", this.onMotionChange);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("resize", this.redraw);
    this.observer?.disconnect();
    this.observer = null;
    this.setLooping(false);
  }

  attributeChangedCallback(name: string): void {
    if (!this.engine || !this.isConnected) return;
    if (name === "state") {
      this.engine.setState(this.state);
      this.syncLabels();
      this.wake();
    } else if (name === "size") {
      this.applySize();
      this.redraw();
    } else if (name === "motion") {
      this.onMotionChange();
    } else if (name === "rest-after") {
      this.wake();
    } else {
      this.syncLabels();
    }
  }

  tick(dtMs: number): void {
    const engine = this.engine;
    if (!engine) return;
    engine.step(dtMs);
    this.quietFor += dtMs;
    if (!BUSY.includes(engine.state) && this.quietFor >= this.restAfter) engine.setAmbient(false);
    this.syncLabels();
    this.paint();
    if (engine.atRest) this.setLooping(false);
  }

  private get restAfter(): number {
    const value = Number(this.getAttribute("rest-after") ?? DEFAULT_REST_AFTER_MS);
    return Number.isFinite(value) && value >= 0 ? value : DEFAULT_REST_AFTER_MS;
  }

  private get boxSize(): number {
    const value = Number(this.getAttribute("size") ?? DEFAULT_SIZE);
    return Number.isFinite(value) && value > 0 ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, value)) : DEFAULT_SIZE;
  }

  private resolvedMotion(): "full" | "reduced" {
    const motion = this.getAttribute("motion");
    if (motion === "full" || motion === "reduced") return motion;
    return this.reducedQuery.matches ? "reduced" : "full";
  }

  private applySize(): void {
    this.style.setProperty("--agent-face-size", `${this.boxSize}px`);
    this.pixelRatio = 0;
  }

  private wake(): void {
    if (!this.engine) return;
    this.quietFor = 0;
    this.engine.setAmbient(true);
    this.paint();
    this.updateLoop();
  }

  private updateLoop(): void {
    const engine = this.engine;
    const canRun = this.isConnected && this.onScreen && document.visibilityState !== "hidden";
    this.setLooping(canRun && !!engine && !engine.atRest);
  }

  private setLooping(on: boolean): void {
    if (on === this.looping) return;
    this.looping = on;
    if (on) addToLoop(this);
    else removeFromLoop(this);
  }

  private readonly onMotionChange = (): void => {
    this.engine?.setMotion(this.resolvedMotion());
    this.wake();
  };

  private readonly onVisibility = (): void => this.updateLoop();

  private readonly redraw = (): void => this.paint();

  private paint(): void {
    const engine = this.engine;
    const ctx = this.canvas.getContext("2d");
    if (!engine || !ctx) return;
    const size = this.boxSize;
    const ratio = window.devicePixelRatio || 1;
    const overhang = size * BLEED;
    if (ratio !== this.pixelRatio) {
      this.pixelRatio = ratio;
      this.canvas.width = Math.round((size + overhang * 2) * ratio);
      this.canvas.height = this.canvas.width;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, size + overhang * 2, size + overhang * 2);
    ctx.translate(overhang, overhang);
    drawFace(ctx, engine.pose(), size);
  }

  private syncLabels(): void {
    const shown = this.shownState;
    const name = this.getAttribute("name") || "Donovan";
    const label = this.getAttribute("label") || this.labelsValue[shown] || PHRASES[shown](name);
    if (this.canvas.getAttribute("aria-label") !== label) this.canvas.setAttribute("aria-label", label);
    const announce = this.hasAttribute("announce");
    if (announce && !this.status.hasAttribute("role")) this.status.setAttribute("role", "status");
    if (!announce && this.status.hasAttribute("role")) {
      this.status.removeAttribute("role");
      this.status.textContent = "";
    }
    if (announce && shown !== this.spokenState) this.status.textContent = label;
    this.spokenState = shown;
  }
}
