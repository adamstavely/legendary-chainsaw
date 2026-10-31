import { seededRandom, type Random } from "./random";
import { Spring, type SpringConfig } from "./spring";
import { EXPRESSIONS, MIN_HOLD_MS, type Expression, type FaceState } from "./states";

export type FaceGesture = "nod" | "hop" | "spin" | "wave";
export type FaceMotion = "full" | "reduced";

export interface FacePose extends Expression {
  /** Degrees, from a spin gesture */
  spin: number;
}

export interface FaceEngineOptions {
  seed?: number;
  state?: FaceState;
  /** Blinks, glances, breathing and made-up speech. Default true */
  ambient?: boolean;
  motion?: FaceMotion;
}

const TICK_MS = 1000 / 120;
// A tab waking up can hand over minutes at once; the face just carries on from where it was
const MAX_STEP_MS = 250;

const BLINK_MS = 160;
const GESTURE_MS: Record<FaceGesture, number> = { nod: 520, hop: 560, spin: 850, wave: 1200 };

const SPRINGS: Record<keyof Expression, SpringConfig> = {
  eyeOpen: { stiffness: 320, damping: 30 },
  eyeSmile: { stiffness: 220, damping: 26 },
  eyeCross: { stiffness: 260, damping: 30 },
  eyeAsym: { stiffness: 200, damping: 24 },
  gazeX: { stiffness: 240, damping: 28 },
  gazeY: { stiffness: 240, damping: 28 },
  mouthOpen: { stiffness: 500, damping: 36 },
  mouthCurve: { stiffness: 200, damping: 24 },
  tilt: { stiffness: 110, damping: 16 },
  squash: { stiffness: 180, damping: 18 },
  lift: { stiffness: 150, damping: 18 },
  handLeft: { stiffness: 130, damping: 15 },
  handRight: { stiffness: 130, damping: 15 },
};
const CHANNELS = Object.keys(SPRINGS) as (keyof Expression)[];

const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const between = (random: Random, low: number, high: number) => low + random() * (high - low);

/** Turns a state and the passing of time into a pose. It knows nothing about the DOM or how the face is drawn. */
export class FaceEngine {
  private readonly random: Random;
  private readonly springs: Record<keyof Expression, Spring>;
  private readonly ambientWeight: Spring;

  private tick = 0;
  private carry = 0;

  private current: FaceState;
  private pending: FaceState | null = null;
  private earliestChange = 0;

  private ambient: boolean;
  private motion: FaceMotion;
  private amplitude: number | null = null;

  private nextBlink = 0;
  private blinkStart = -Infinity;
  private nextGlance = 0;
  private glanceX = 0;
  private glanceY = 0;
  private nextSyllable = 0;
  private syllable = 0;

  private gesture: FaceGesture | null = null;
  private gestureStart = 0;

  constructor(options: FaceEngineOptions = {}) {
    this.random = seededRandom(options.seed ?? 1);
    this.current = options.state ?? "idle";
    this.ambient = options.ambient ?? true;
    this.motion = options.motion ?? "full";
    const start = EXPRESSIONS[this.current];
    this.springs = Object.fromEntries(CHANNELS.map((c) => [c, new Spring(start[c], SPRINGS[c])])) as Record<keyof Expression, Spring>;
    this.ambientWeight = new Spring(this.ambientOn ? 1 : 0, { stiffness: 40, damping: 13 });
    this.scheduleBlink();
    this.scheduleGlance();
  }

  get state(): FaceState {
    return this.current;
  }

  /** Goes to the state once the current one has held for its minimum time. If several arrive first, the last one wins. */
  setState(state: FaceState): void {
    if (state === this.current) {
      this.pending = null;
      return;
    }
    this.pending = state;
    this.applyPending();
  }

  /** Plays once. Returns false when reduced motion rules it out. Playing again restarts it. */
  playGesture(gesture: FaceGesture): boolean {
    if (this.motion === "reduced") return false;
    this.gesture = gesture;
    this.gestureStart = this.now;
    return true;
  }

  /** How loud the agent is, from 0 to 1, to drive the mouth while speaking. null goes back to made-up speech. */
  setAmplitude(amplitude: number | null): void {
    this.amplitude = amplitude === null ? null : Math.min(1, Math.max(0, Number.isFinite(amplitude) ? amplitude : 0));
  }

  setAmbient(ambient: boolean): void {
    this.ambient = ambient;
    this.ambientWeight.target = this.ambientOn ? 1 : 0;
  }

  setMotion(motion: FaceMotion): void {
    this.motion = motion;
    this.ambientWeight.target = this.ambientOn ? 1 : 0;
    if (motion === "reduced") {
      this.gesture = null;
      this.settleNow();
    }
  }

  /** Moves time on. Any way of slicing the same time gives the same pose, so frame rate doesn't change the result. */
  step(dtMs: number): void {
    if (!(dtMs > 0)) return;
    this.carry += Math.min(dtMs, MAX_STEP_MS);
    while (this.carry >= TICK_MS) {
      this.carry -= TICK_MS;
      this.advance();
    }
  }

  pose(): FacePose {
    const s = this.springs;
    const now = this.now;
    const weight = this.ambientWeight.value;

    const sinceBlink = now - this.blinkStart;
    const blink = this.ambientOn && sinceBlink < BLINK_MS ? 1 - Math.abs((2 * sinceBlink) / BLINK_MS - 1) : 0;
    const breathPeriod = this.current === "sleeping" ? 7000 : 4000;
    const breath = Math.sin((2 * Math.PI * now) / breathPeriod) * 0.012 * weight;

    const pose: FacePose = {
      eyeOpen: Math.max(0, s.eyeOpen.value) * (1 - blink),
      eyeSmile: clamp01(s.eyeSmile.value),
      eyeCross: clamp01(s.eyeCross.value),
      eyeAsym: s.eyeAsym.value,
      gazeX: s.gazeX.value,
      gazeY: s.gazeY.value,
      mouthOpen: clamp01(s.mouthOpen.value),
      mouthCurve: s.mouthCurve.value,
      tilt: s.tilt.value,
      squash: s.squash.value + breath,
      lift: s.lift.value,
      handLeft: clampHand(s.handLeft.value),
      handRight: clampHand(s.handRight.value),
      spin: 0,
    };

    if (this.gesture) {
      const p = Math.min(1, (now - this.gestureStart) / GESTURE_MS[this.gesture]);
      if (this.gesture === "nod") {
        pose.gazeY -= Math.sin(p * 2 * Math.PI) * 0.35;
        pose.lift -= Math.sin(p * 2 * Math.PI) * 1.5;
      } else if (this.gesture === "hop") {
        pose.lift += Math.sin(p * Math.PI) * 10;
        pose.squash += Math.sin(p * 2 * Math.PI) * 0.05;
      } else if (this.gesture === "wave") {
        const up = Math.min(1, Math.sin(p * Math.PI) * 3);
        pose.handRight += (0.92 + Math.sin(p * 6 * Math.PI) * 0.1 - pose.handRight) * up;
      } else {
        pose.spin = easeInOut(p) * 360;
      }
    }
    return pose;
  }

  /** True when nothing will change until someone calls a setter, so a draw loop can stop */
  get atRest(): boolean {
    return !this.ambientOn && !this.gesture && !this.pending && this.ambientWeight.atRest && CHANNELS.every((c) => this.springs[c].atRest);
  }

  private get now(): number {
    return this.tick * TICK_MS;
  }

  private get ambientOn(): boolean {
    return this.ambient && this.motion === "full";
  }

  private advance(): void {
    this.tick += 1;
    this.applyPending();
    this.runAmbient();
    this.aim();
    const dt = TICK_MS / 1000;
    for (const c of CHANNELS) this.springs[c].step(dt);
    this.ambientWeight.step(dt);
    if (this.gesture && this.now - this.gestureStart >= GESTURE_MS[this.gesture]) this.gesture = null;
  }

  private applyPending(): void {
    if (!this.pending || this.now < this.earliestChange) return;
    this.current = this.pending;
    this.pending = null;
    this.earliestChange = this.now + MIN_HOLD_MS[this.current];
    if (this.motion === "reduced") this.settleNow();
  }

  private runAmbient(): void {
    if (!this.ambientOn) {
      this.glanceX = 0;
      this.glanceY = 0;
      return;
    }
    const now = this.now;
    if (now >= this.nextBlink) {
      // A shut or crossed eye has nothing to blink
      if (this.current !== "sleeping" && this.current !== "error") this.blinkStart = now;
      this.scheduleBlink();
    }
    if (now >= this.nextGlance) {
      const roaming = this.current === "idle" || this.current === "listening" || this.current === "thinking";
      const glancing = roaming && this.random() < 0.6;
      this.glanceX = glancing ? between(this.random, -0.3, 0.3) : 0;
      this.glanceY = glancing ? between(this.random, -0.15, 0.15) : 0;
      this.scheduleGlance();
    }
    if (now >= this.nextSyllable) {
      this.syllable = this.random() < 0.2 ? 0.05 : between(this.random, 0.25, 0.8);
      this.nextSyllable = now + between(this.random, 90, 220);
    }
  }

  private aim(): void {
    const expression = EXPRESSIONS[this.current];
    for (const c of CHANNELS) this.springs[c].target = expression[c];
    this.springs.gazeX.target += this.glanceX;
    this.springs.gazeY.target += this.glanceY;
    if (this.current === "speaking") {
      if (this.amplitude !== null) this.springs.mouthOpen.target = this.amplitude;
      else if (this.ambientOn) this.springs.mouthOpen.target = this.syllable;
      // Hands move a little with the words
      if (this.ambientOn) this.springs.handRight.target += this.syllable * 0.2;
    }
  }

  private settleNow(): void {
    this.glanceX = 0;
    this.glanceY = 0;
    this.aim();
    for (const c of CHANNELS) this.springs[c].snap();
    this.ambientWeight.snap();
  }

  private scheduleBlink(): void {
    this.nextBlink = this.now + between(this.random, 2200, 6000);
  }

  private scheduleGlance(): void {
    this.nextGlance = this.now + between(this.random, 1500, 4000);
  }
}

function clampHand(value: number): number {
  return Math.min(1.1, Math.max(0, value));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
